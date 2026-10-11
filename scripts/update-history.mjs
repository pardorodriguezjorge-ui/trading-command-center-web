// Runs only in GitHub Actions. Requires explicit publication approval and provider credentials.
// Never embed a secret in website scripts or public JSON.
import {mkdir,writeFile,rename} from 'node:fs/promises';
const key=process.env.TWELVE_DATA_API_KEY;
if(!key)throw Error('Missing TWELVE_DATA_API_KEY. No public dataset was changed.');
if(process.env.MARKET_DATA_PUBLICATION_APPROVED!=='true')throw Error('Market-data redistribution not authorized.');
const symbols=['CRML','CEG','IREN','NTNX','NU','GPN','ALM','LW'];
const stocks={};
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
for(let i=0;i<symbols.length;i++){
 const symbol=symbols[i];
 const url=new URL('https://api.twelvedata.com/time_series');
 url.search=new URLSearchParams({symbol,interval:'1day',outputsize:'520',apikey:key}).toString();
 let data;
 try{
  const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error();
  data=await response.json();
 }catch{throw Error('Historical feed unavailable for '+symbol+'; previous snapshot preserved.');}
 if(data.status==='error'||!Array.isArray(data.values)||data.values.length<50)throw Error('Incomplete historical response for '+symbol+'; previous snapshot preserved.');
 const candles=data.values.map(x=>({
  time:String(x.datetime).slice(0,10),
  open:Number(x.open),high:Number(x.high),low:Number(x.low),close:Number(x.close),volume:Number(x.volume)
 })).sort((a,b)=>a.time.localeCompare(b.time));
 for(let j=0;j<candles.length;j++){
  const c=candles[j];
  if(!/^\d{4}-\d{2}-\d{2}$/.test(c.time)||!Number.isFinite(Date.parse(c.time))||
    (j>0&&candles[j-1].time>=c.time)||
    ![c.open,c.high,c.low,c.close,c.volume].every(Number.isFinite)||
    c.low<=0||c.high<Math.max(c.open,c.close)||c.low>Math.min(c.open,c.close)||c.volume<0){
   throw Error('Invalid OHLCV data for '+symbol+'; previous snapshot preserved.');
  }
 }
 const recent=candles.slice(-252);
 stocks[symbol]={
  asof:candles.at(-1).time,
  sourceName:'Twelve Data',
  source:'https://twelvedata.com/',
  low52:Math.min(...recent.map(x=>x.low)),
  high52:Math.max(...recent.map(x=>x.high)),
  candles
 };
 if(i<symbols.length-1)await delay(8500); // Avoid free-tier bursts; actual plan limits still apply.
}
await mkdir('data',{recursive:true});
await writeFile('data/history.tmp',JSON.stringify({
 schemaVersion:1,updated_at:new Date().toISOString(),source:'Twelve Data',stocks
},null,2));
await rename('data/history.tmp','data/history.json');
console.log('Validated daily history for '+symbols.length+' stocks. No personal account data included.');
