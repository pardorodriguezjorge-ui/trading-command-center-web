// Server-side adapter for a licensed, redistributable market-data subscription.
// GitHub Secrets only: never send the API key to browser code or output files.
import {mkdir,writeFile,rename,readFile} from 'node:fs/promises';
const key=process.env.TWELVE_DATA_API_KEY;
if(!key)throw Error('Missing TWELVE_DATA_API_KEY; no public quote update.');
if(process.env.MARKET_DATA_PUBLICATION_APPROVED!=='true')throw Error('Market-data publication not approved.');
const symbols=['CRML','CEG','IREN','NTNX','NU','GPN','ALM','LW','SPY','QQQ'];
const quotes={},errors={};
let prior={};
try{prior=JSON.parse(await readFile('data/market.json','utf8')).quotes||{};}catch{}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let success=0;
for(let i=0;i<symbols.length;i++){
 const symbol=symbols[i];
 const url=new URL('https://api.twelvedata.com/quote');
 url.search=new URLSearchParams({symbol,apikey:key}).toString();
 try{
  const response=await fetch(url,{signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error('Unavailable');
  const payload=await response.json();
  const price=Number(payload.close),ts=Number(payload.timestamp);
  if(payload.status==='error'||!(price>0)||!Number.isFinite(ts)||ts<1577836800||ts*1000>Date.now()+900000)throw Error('Invalid data');
  quotes[symbol]={
   price,asof:new Date(ts*1000).toISOString(),currency:payload.currency||'USD',
   changePct:Number.isFinite(Number(payload.percent_change))?Number(payload.percent_change):null,
   source:'Twelve Data',extendedHours:payload.is_extended_hours===true
  };
  success++;
 }catch{
  errors[symbol]='Provider did not supply a validated quote; old quote kept if available';
  if(prior[symbol]&&Number(prior[symbol].price)>0&&Number.isFinite(Date.parse(prior[symbol].asof)))
    quotes[symbol]=prior[symbol]; // Preserve original asof; never fake recency.
 }
 if(i<symbols.length-1)await pause(8500); // Avoid provider rate-limit bursts.
}
if(success<5)throw Error('Too few validated market responses ('+success+'); existing snapshot preserved.');
await mkdir('data',{recursive:true});
await writeFile('data/market.tmp',JSON.stringify({
 schemaVersion:1,updated_at:new Date().toISOString(),source:'Twelve Data',quotes,errors
},null,2));
await rename('data/market.tmp','data/market.json');
console.log('Validated '+success+' fresh symbols; '+Object.keys(errors).length+' errors (per-symbol timestamps preserved).');
