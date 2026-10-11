// Private market API for a single-user Cloudflare Worker.
// Cloudflare Access JWT is VERIFIED before serving quotes; no token/API key is exposed to browsers.
// Do not use a provider plan unless its terms permit personal/internal display.
const TICKERS=['CRML','CEG','IREN','NTNX','NU','GPN','ALM','LW','SPY','QQQ'];
const HISTORY_TICKERS=TICKERS.filter(t=>!['SPY','QQQ'].includes(t));
const JSON_HEADERS={'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
let cachedKeys=null,keysExpires=0;
function decodeB64(s){
 const normalized=s.replace(/-/g,'+').replace(/_/g,'/');
 const raw=atob(normalized.padEnd(Math.ceil(normalized.length/4)*4,'='));
 return Uint8Array.from(raw,c=>c.charCodeAt(0));
}
async function accessAuthorized(request,env){
 const jwt=request.headers.get('Cf-Access-Jwt-Assertion');
 const domain=String(env.ACCESS_TEAM_DOMAIN||''),aud=String(env.ACCESS_AUD||'');
 if(!/^[a-z0-9.-]+\.cloudflareaccess\.com$/.test(domain)||!aud||!jwt)return false;
 const pieces=jwt.split('.');
 if(pieces.length!==3||pieces.some(x=>x.length>10000))return false;
 try{
  const header=JSON.parse(new TextDecoder().decode(decodeB64(pieces[0])));
  const claims=JSON.parse(new TextDecoder().decode(decodeB64(pieces[1])));
  const now=Math.floor(Date.now()/1000);
  if(header.alg!=='RS256'||typeof header.kid!=='string'||!Array.isArray(claims.aud)||!claims.aud.includes(aud)||
     claims.iss!==('https://'+domain)||!(claims.exp>now)||(claims.nbf&&claims.nbf>now))return false;
  if(!cachedKeys||Date.now()>keysExpires){
   const res=await fetch('https://'+domain+'/cdn-cgi/access/certs',{signal:AbortSignal.timeout(8000)});
   if(!res.ok)return false;
   const parsed=await res.json();
   if(!Array.isArray(parsed.keys))return false;
   cachedKeys=parsed.keys;keysExpires=Date.now()+300000;
  }
  const jwk=cachedKeys.find(x=>x.kid===header.kid&&x.kty==='RSA');
  if(!jwk)return false;
  const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  return await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decodeB64(pieces[2]),new TextEncoder().encode(pieces[0]+'.'+pieces[1]));
 }catch{return false;}
}
function responseJson(data,status=200){return new Response(JSON.stringify(data),{status,headers:JSON_HEADERS});}
function nyClock(ms=Date.now()){
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(ms));
 const get=x=>parts.find(p=>p.type===x)?.value;
 return {weekday:get('weekday'),minutes:Number(get('hour'))*60+Number(get('minute')||0)};
}
function isRegularSession(ms=Date.now()){
 const t=nyClock(ms);
 return !['Sat','Sun'].includes(t.weekday)&&t.minutes>=9*60+30&&t.minutes<=16*60+5;
}
async function queryQuote(ticker,env){
 const provider=env.QUOTE_PROVIDER==='finnhub'?'finnhub':'twelvedata';
 let url;
 if(provider==='finnhub'){
  if(!env.FINNHUB_API_KEY)return null;
  url=new URL('https://finnhub.io/api/v1/quote');
  url.search=new URLSearchParams({symbol:ticker,token:env.FINNHUB_API_KEY}).toString();
 }else{
  if(!env.TWELVE_DATA_API_KEY)return null;
  url=new URL('https://api.twelvedata.com/quote');
  url.search=new URLSearchParams({symbol:ticker,apikey:env.TWELVE_DATA_API_KEY}).toString();
 }
 try{
  const res=await fetch(url,{signal:AbortSignal.timeout(10000)});
  if(!res.ok)return null;
  const body=await res.json();
  if(body.status==='error')return null;
  const value=provider==='finnhub'?Number(body.c):Number(body.close);
  const ts=provider==='finnhub'?Number(body.t):Number(body.timestamp);
  if(!(value>0)||!Number.isFinite(ts)||ts<1577836800||ts*1000>Date.now()+600000)return null;
  return {price:value,asof:new Date(ts*1000).toISOString(),changePct:provider==='finnhub'?Number(body.dp||0):Number(body.percent_change||0),
   source:provider==='finnhub'?'Finnhub':'Twelve Data'};
 }catch{return null;}
}
async function updateQuotes(env,ms){
 if(!env.MARKET_KV||!isRegularSession(ms))return;
 const existing=await env.MARKET_KV.get('quotes','json').catch(()=>null);
 const quotes={...(existing?.quotes||{})};
 // Five symbols every 5 minutes. Each symbol targeted once per 10 minutes.
 const minute=new Date(ms).getUTCMinutes();
 const batch=minute%10<5?TICKERS.slice(0,5):TICKERS.slice(5);
 const answers=await Promise.all(batch.map(t=>queryQuote(t,env)));
 let successes=0;
 batch.forEach((t,i)=>{
  const q=answers[i];
  if(q&&(!quotes[t]||Date.parse(q.asof)>=Date.parse(quotes[t].asof||0))){
   quotes[t]=q;successes++;
  }
 });
 if(!successes){console.log('Quote feed: no validated updates, preserving previous data');return;}
 await env.MARKET_KV.put('quotes',JSON.stringify({schemaVersion:1,updated_at:new Date(ms).toISOString(),
  source:env.QUOTE_PROVIDER==='finnhub'?'Finnhub':'Twelve Data',quotes}));
 console.log('Quote feed: '+successes+' updated symbols; expired timestamps kept where provider lagged');
}
async function updateHistory(env,ms){
 if(!env.MARKET_KV||!env.TWELVE_DATA_API_KEY)return;
 const stocks={};let ok=true;
 // One request per US ticker, only once per trading day, within provider quotas.
 for(const ticker of HISTORY_TICKERS){
  const url=new URL('https://api.twelvedata.com/time_series');
  url.search=new URLSearchParams({symbol:ticker,interval:'1day',outputsize:'520',apikey:env.TWELVE_DATA_API_KEY}).toString();
  try{
   const res=await fetch(url,{signal:AbortSignal.timeout(12000)});
   if(!res.ok)throw Error('Data unavailable');
   const payload=await res.json();
   if(payload.status==='error'||!Array.isArray(payload.values)||payload.values.length<50)throw Error('Insufficient history');
   const candles=payload.values.map(x=>({time:String(x.datetime).slice(0,10),open:Number(x.open),high:Number(x.high),
      low:Number(x.low),close:Number(x.close),volume:Number(x.volume)})).sort((a,b)=>a.time.localeCompare(b.time));
   for(let i=0;i<candles.length;i++){
    const c=candles[i];
    if(!/^\d{4}-\d{2}-\d{2}$/.test(c.time)||!(c.low>0)||c.high<Math.max(c.open,c.close)||
       c.low>Math.min(c.open,c.close)||c.volume<0||
       ![c.open,c.high,c.low,c.close,c.volume].every(Number.isFinite)||
       (i>0&&candles[i-1].time>=c.time))throw Error('Invalid OHLCV');
   }
   stocks[ticker]={candles,sourceName:'Twelve Data',source:'https://twelvedata.com/'};
  }catch{ok=false;break;}
 }
 if(!ok){console.log('History: incomplete, previous data preserved');return;}
 await env.MARKET_KV.put('history',JSON.stringify({schemaVersion:1,updated_at:new Date(ms).toISOString(),source:'Twelve Data',stocks}));
 console.log('History: validated '+Object.keys(stocks).length+' symbols');
}
export default {
 async fetch(request,env){
  const path=new URL(request.url).pathname;
  if(path==='/data/market.json'||path==='/data/history.json'){
   if(!await accessAuthorized(request,env))return responseJson({error:'Authentication required'},403);
   if(!env.MARKET_KV)return responseJson({error:'Private market store not configured'},503);
   const key=path.endsWith('history.json')?'history':'quotes';
   const data=await env.MARKET_KV.get(key,{type:'json'});
   if(!data)return responseJson({error:'Private feed not populated'},503);
   return responseJson(data);
  }
  return env.ASSETS.fetch(request);
 },
 async scheduled(controller,env,ctx){
  if(env.ENABLE_PERSONAL_FEED!=='true'){
   console.log('Personal market feed disabled until provider terms and Access configuration are confirmed');
   return;
  }
  const ms=controller.scheduledTime||Date.now();
  const cron=controller.cron||'';
  if(cron.startsWith('*/5'))ctx.waitUntil(updateQuotes(env,ms));
  if(cron.startsWith('20 0'))ctx.waitUntil(updateHistory(env,ms));
 }
};
