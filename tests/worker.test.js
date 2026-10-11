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
