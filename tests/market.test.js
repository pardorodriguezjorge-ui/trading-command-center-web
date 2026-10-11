import test from 'node:test';
import assert from 'node:assert/strict';
import {research,ingestQuotes,ingestHistory,marketMeta,viewPosition} from '../src/terminal.js';

test('Reject malformed external snapshots, preserve verified captures',()=>{
 const before=research.stocks.CRML.asof;
 assert.equal(ingestQuotes({schemaVersion:3,quotes:{}}),false);
 assert.equal(ingestHistory({schemaVersion:3,stocks:{}}),false);
 assert.equal(research.stocks.CRML.asof,before);
});

test('More recent dated quote is used for portfolio, but an even newer manual price wins',()=>{
 const quoteTime='2026-10-09T21:30:00.000Z';
 const payload={schemaVersion:1,updated_at:'2026-10-10T00:00:00.000Z',source:'Licensed provider',
  quotes:{CRML:{price:7.99,asof:quoteTime,source:'Licensed provider',changePct:1.2}}};
 assert.equal(ingestQuotes(payload),true);
 const position={ticker:'CRML',qty:1,avg:7.5,price:null};
 const current=viewPosition(position);
 assert.equal(current.price,7.99);
 assert.equal(current.priceAt,quoteTime);
 const manual=viewPosition({...position,price:8.1,priceAt:'2026-10-10T10:00:00.000Z'});
 assert.equal(manual.price,8.1);
 assert.equal(manual.priceAt,'2026-10-10T10:00:00.000Z');
 assert.equal(marketMeta().quoteCount,1);
});

test('Valid extended OHLCV replaces only the covered symbol',()=>{
 const old=research.stocks.CRML, original=old.candles.slice();
 try{
  const bars=original.map(x=>({...x}));
  const source={schemaVersion:1,source:'Licensed provider',stocks:{
   CRML:{sourceName:'Test provider',source:'https://example.org/',candles:bars}
  }};
  assert.equal(ingestHistory(source),true);
  assert.equal(research.stocks.CRML.asof,bars.at(-1).time);
  assert.equal(research.stocks.CRML.candles.length,bars.length);
  assert.match(research.stocks.CRML.levelsMethod,/NO zonas/);
 }finally{
  old.candles=original;
 }
});
