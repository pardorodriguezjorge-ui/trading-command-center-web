import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/private-market.js';

test('private feed denies requests without a verified Cloudflare Access JWT',async()=>{
 let reads=0;
 const env={ACCESS_AUD:'aud-example',ACCESS_TEAM_DOMAIN:'example.cloudflareaccess.com',
  MARKET_KV:{async get(){reads++;return {quotes:{CRML:{price:12}}};}}};
 const result=await worker.fetch(new Request('https://market.example.workers.dev/data/market.json'),env);
 assert.equal(result.status,403);
 assert.equal(reads,0);
 assert.match(await result.text(),/Authentication required/);
});
test('non-market paths may serve static assets independently',async()=>{
 const env={ASSETS:{fetch:async()=>new Response('<h1>App</h1>',{status:200})}};
 const result=await worker.fetch(new Request('https://market.example.workers.dev/'),env);
 assert.equal(result.status,200);
 assert.match(await result.text(),/App/);
});
test('scheduled task stays disabled until user confirms personal feed',async()=>{
 let requested=false;
 const env={MARKET_KV:{async get(){requested=true;},async put(){requested=true;}}};
 await worker.scheduled({cron:'*/5 12-23 * * MON-FRI',scheduledTime:Date.now()},env,{waitUntil() {requested=true;}});
 assert.equal(requested,false);
});

test('failed cycle retains quotes and their market timestamp but records attempt',async()=>{
 const {updateQuotes}=await import('../worker/private-market.js');
 const old={schemaVersion:1,updated_at:'2026-10-09T14:00:00Z',quotes:{CRML:{price:6,asof:'2026-10-09T13:59:00Z'}}};
 const data=new Map([['quotes',old]]);
 const env={QUOTE_PROVIDER:'finnhub',MARKET_KV:{async get(k){return data.get(k)||null;},async put(k,v){data.set(k,JSON.parse(v));}}};
 await updateQuotes(env,Date.parse('2026-10-09T15:00:00Z'));
 assert.deepEqual(data.get('quotes'),old);
 assert.equal(data.get('status').outcome,'failed');
 assert.equal(data.get('status').symbols.CRML.asof,'2026-10-09T13:59:00Z');
 assert.equal(data.get('status').symbols.CRML.ageSeconds,3660);
});
test('weekend records no-session state without pretending market refreshed',async()=>{
 const {updateQuotes}=await import('../worker/private-market.js');
 const data=new Map();
 const env={MARKET_KV:{async get(k){return data.get(k)||null;},async put(k,v){data.set(k,JSON.parse(v));}}};
 await updateQuotes(env,Date.parse('2026-10-11T15:00:00Z'));
 assert.equal(data.get('status').outcome,'outside_session');
 assert.equal(data.has('quotes'),false);
});
test('status endpoint is also private',async()=>{
 const result=await worker.fetch(new Request('https://market.example.workers.dev/data/status.json'),{});
 assert.equal(result.status,403);
});
