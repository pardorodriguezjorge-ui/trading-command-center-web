// Server-side only: secrets must never enter browser code or the output JSON.
import {mkdir,writeFile,rename} from 'node:fs/promises';
const key=process.env.TWELVE_DATA_API_KEY;
if(!key)throw Error('Configure TWELVE_DATA_API_KEY in GitHub Actions secrets.');
if(process.env.MARKET_DATA_PUBLICATION_APPROVED!=='true')throw Error('Public data redistribution has not been approved.');
const symbols=['CRML','CEG','IREN','NU','NTNX','SPY','QQQ'];
const quotes={};
for(const symbol of symbols){
 const url=new URL('https://api.twelvedata.com/quote');url.search=new URLSearchParams({symbol,apikey:key}).toString();
 let payload;try{const r=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error();payload=await r.json();}catch{throw Error('Market request failed for '+symbol);}
 const price=Number(payload.close),timestamp=Number(payload.timestamp);
 if(payload.status==='error'||!Number.isFinite(price)||price<=0||!Number.isFinite(timestamp)||timestamp<=0)throw Error('Invalid quote for '+symbol+'; previous snapshot preserved.');
 quotes[symbol]={price,asof:new Date(timestamp*1000).toISOString(),currency:payload.currency||null,changePct:Number.isFinite(Number(payload.percent_change))?Number(payload.percent_change):null,source:'Twelve Data',extendedHours:payload.is_extended_hours===true};
}
await mkdir('data',{recursive:true});await writeFile('data/market.tmp',JSON.stringify({schemaVersion:1,updated_at:new Date().toISOString(),source:'Twelve Data',quotes},null,2));await rename('data/market.tmp','data/market.json');
console.log('Validated public snapshot written; no positions or user records included.');
