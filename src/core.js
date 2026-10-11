export const KEY='swing-command-center-v3', LEGACY='swing-command-center-v1';
export const statuses=['Preparándose','Esperando confirmación','Entrada activada','Invalidado','Caducado','Ejecutado','Descartado'];
export const collections=['positions','orders','transactions','radar','setups','news','journal','rules','events','reports'];
export const uid=()=>crypto.randomUUID();
export const now=()=>new Date().toISOString();
export const number=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))?Number(v):null;
export function validate(d){
 if(!d||typeof d!=='object'||Array.isArray(d)||!Array.isArray(d.positions)||!Array.isArray(d.journal))throw Error('Copia incompatible: faltan posiciones o registro');
 for(const k of collections){if(d[k]!==undefined&&!Array.isArray(d[k]))throw Error(k+': debe ser una lista');const ids=new Set();for(const x of d[k]||[]){if(!x||typeof x!=='object'||Array.isArray(x)||typeof (k==='reports'?x.reportId:x.id)!=='string'||ids.has(k==='reports'?x.reportId:x.id))throw Error(k+': registro o identificador inválido/duplicado');ids.add(k==='reports'?x.reportId:x.id);if(x.ticker&&!/^[A-Z0-9.^=-]{1,15}$/.test(x.ticker))throw Error('Ticker inválido');}}
 for(const k of ['positions','radar','setups','rules'])for(const x of d[k]||[])if(x.history!==undefined&&!Array.isArray(x.history))throw Error('Historial inválido');
 for(const p of d.positions)if(number(p.qty)===null||p.qty<0||number(p.avg)===null||p.avg<=0)throw Error('Cantidad o coste inválido');
 for(const t of d.transactions||[])if(!(t.qty>0&&t.price>0)||!['Compra','Venta'].includes(t.side))throw Error('Ejecución inválida');
 return d;
}
export function migrate(input){
 const d=structuredClone(validate(input));for(const k of collections)d[k]??=[];
 d.version=3;d.settings??={equity:null};d.market??='Sin evaluar';d.chartLevels??={};
 for(const k of ['setups','rules'])for(const x of d[k]){x.history??=[];if(!x.history.length)x.history.push({at:now(),reason:'Versión original preservada al migrar',snapshot:structuredClone(Object.fromEntries(Object.entries(x).filter(([k])=>k!=='history')))});}
 for(const x of d.setups){if(!statuses.includes(x.status))x.status='Esperando confirmación';x.verifiedAt??='';}
 for(const x of d.positions){x.priceAt??='';x.provenance??='Registro histórico; pendiente de verificación';}
 // Legacy executions were only notes and must NEVER be applied a second time.
 for(const t of d.transactions)t.applied??=false;
 for(const ticker of ['CRML','ALM','LW'])if(!d.radar.some(r=>r.ticker===ticker))d.radar.push({id:'recovered-'+ticker,ticker,status:'Vigilando',setup:'Seguimiento histórico',notes:'Recuperado del universo histórico; sin señal activa ni niveles verificados.'});
 const ruleAdditions=[['risk','Gestión del riesgo','Definir invalidación y tamaño antes de entrar. No confundir volatilidad del valor con porcentaje de capital arriesgado. No calcular riesgo agregado sin stops y capital de referencia.'],['manage','Gestión de posiciones','Valorar mantener, añadir, reducir o cerrar según la tesis y el riesgo. No promediar automáticamente. Separar siempre órdenes pendientes y ejecuciones confirmadas.'],['rebuy','Toma parcial de beneficios y recompra','Comparar mantener, vender parcialmente o vender todo en fortaleza. Evaluar coste y spread, señal de recompra, efecto sobre el precio medio y posibilidad de quedarse fuera. Nunca dar la recompra por garantizada.'],['no-trade','Condiciones para no operar','No entrar con datos sin fecha, invalidación indefinida, liquidez insuficiente, tesis binaria o relación riesgo/recompensa desfavorable. Un objetivo menor no justifica por sí solo una entrada.']];
 for(const [id,name,text] of ruleAdditions)if(!d.rules.some(r=>r.id==='p-'+id))d.rules.push({id:'p-'+id,name,text,version:'Borrador 1.0',status:'Propuesta, pendiente de aprobación',history:[]});
 return d;
}
export function load(storage,seed){
 const current=storage.getItem(KEY);if(current)return migrate(JSON.parse(current));
 const raw=storage.getItem(LEGACY);if(raw){const migrated=migrate(JSON.parse(raw));storage.setItem(KEY+'-before-migration',raw);storage.setItem(KEY,JSON.stringify(migrated));return migrated;}
 return migrate(seed);
}
export function persist(storage,d){validate(d);storage.setItem(KEY,JSON.stringify(d));}
export function revise(d,k,item,reason='Edición manual'){
 const old=d[k].find(x=>x.id===item.id);const next={...old,...item,updatedAt:now()};
 if(['setups','rules','radar','positions'].includes(k))next.history=[...(old?.history||[]),{at:now(),reason,snapshot:structuredClone(Object.fromEntries(Object.entries(old||item).filter(([k])=>k!=='history')))}];
 if(k==='setups'&&next.status==='Entrada activada'&&next.expiry&&Number.isFinite(Date.parse(next.expiry))&&Date.parse(next.expiry)<Date.now())throw Error('Setup caducado: revisa la fecha antes de activarlo');
 if(k==='setups'&&next.status==='Entrada activada'&&(!Number.isFinite(Date.parse(next.verifiedAt))||!next.confirm||!(number(next.stop)>0)||!(number(next.entryPrice)>number(next.stop))||!(number(next.tp1)>number(next.entryPrice))))throw Error('Activación: exige fecha de verificación, confirmación, entrada numérica, stop inferior y TP1 superior');
 if(old)d[k][d[k].indexOf(old)]=next;else d[k].push(next);return next;
}
export function execute(d,t){
 if(!/^[A-Z0-9.^=-]{1,15}$/.test(t.ticker)||!['Compra','Venta'].includes(t.side)||!(number(t.qty)>0)||!(number(t.price)>0)||!(number(t.fees)>=0)||!t.date||!Number.isFinite(Date.parse(t.date)))throw Error('Revisa ticker, fecha, cantidad, precio y comisiones');
 if(d.transactions.some(x=>x.id===t.id))throw Error('Ejecución duplicada');
 if(d.transactions.some(x=>x.applied&&x.ticker===t.ticker&&Date.parse(x.date)>Date.parse(t.date)))throw Error('No se admiten ejecuciones anteriores a la última aplicada: usa una corrección documentada');
 if(t.setupId){const setup=d.setups.find(x=>x.id===t.setupId);if(!setup||setup.ticker!==t.ticker)throw Error('Setup vinculado incompatible');}
 let p=d.positions.find(x=>x.ticker===t.ticker&&x.qty>0);
 if(t.side==='Venta'&&(!p||t.qty>p.qty))throw Error('No puedes vender más acciones de las registradas');
 if(t.orderId){const o=d.orders.find(x=>x.id===t.orderId);if(!o||o.ticker!==t.ticker||o.side!==t.side||t.qty>((o.qty||0)-(o.filledQty||0)))throw Error('Orden incompatible o cantidad excedida');o.filledQty=(o.filledQty||0)+t.qty;o.status=o.filledQty===o.qty?'Ejecutada':'Parcialmente ejecutada';}
 if(!p){p={id:uid(),ticker:t.ticker,name:t.ticker,qty:0,avg:t.price,price:null,stop:null};d.positions.push(p);}
 const cost=t.side==='Venta'?t.qty*p.avg:0;const result=t.side==='Venta'?(t.price-p.avg)*t.qty-t.fees:null;
 const before=structuredClone(Object.fromEntries(Object.entries(p).filter(([k])=>k!=='history')));
 if(t.side==='Compra'){p.avg=(p.qty*p.avg+t.qty*t.price+t.fees)/(p.qty+t.qty);p.qty+=t.qty;}else p.qty-=t.qty;
 p.history??=[];p.history.push({at:now(),reason:'Ejecución '+t.id,snapshot:before});p.status=p.qty?'Abierta':'Cerrada';
 if(t.setupId)revise(d,'setups',{id:t.setupId,status:'Ejecutado'},'Ejecución confirmada '+t.id);
 d.transactions.push({...t,applied:true,realized:result,cost,returnPct:cost?result/cost*100:null,recordedAt:now()});
 return result;
}
export function positionMetrics(p){const price=number(p.price),stop=number(p.stop);return {invested:p.qty*p.avg,pnl:price===null?null:(price-p.avg)*p.qty,pct:price===null?null:(price/p.avg-1)*100,risk:stop===null?null:Math.max(0,p.avg-stop)*p.qty,openRisk:stop===null||price===null?null:Math.max(0,price-stop)*p.qty,rr:stop===null||p.avg<=stop||number(p.tp1)===null?null:(p.tp1-p.avg)/(p.avg-stop)};}
export function statistics(d){const rows=d.transactions.filter(t=>t.applied&&t.side==='Venta'&&Number.isFinite(t.realized)).sort((a,b)=>Date.parse(a.date)-Date.parse(b.date));const wins=rows.filter(t=>t.realized>0),losses=rows.filter(t=>t.realized<0);const gain=wins.reduce((s,t)=>s+t.realized,0),loss=-losses.reduce((s,t)=>s+t.realized,0);let total=0,peak=0,dd=0;const curve=rows.map(t=>{total+=t.realized;peak=Math.max(peak,total);dd=Math.max(dd,peak-total);return {date:t.date,value:total};});return {n:rows.length,winRate:rows.length?wins.length/rows.length*100:null,pf:loss?gain/loss:null,expectancy:rows.length?total/rows.length:null,total,drawdown:rows.length?dd:null,avgReturn:rows.length?rows.reduce((s,t)=>s+t.returnPct,0)/rows.length:null,curve,rows};}
export function importReport(d,r){
 if(!r||typeof r.reportId!=='string'||!r.reportId.trim()||!Number.isFinite(Date.parse(r.timestamp)))throw Error('Informe: reportId y timestamp ISO requeridos');
 if(d.reports.some(x=>x.reportId===r.reportId))throw Error('Informe ya importado');
 for(const k of ['news','radar','setups']){if(r[k]!==undefined&&!Array.isArray(r[k]))throw Error(k+': lista requerida');for(const row of r[k]||[]){if(!row||typeof row!=='object'||Array.isArray(row))throw Error('Registro inválido');const item={...row,id:row.id||uid(),sourceReport:r.reportId,provenance:'Informe importado',sourceAt:r.timestamp};if(k==='news'&&d.news.some(n=>(n.url&&n.url===item.url)||(n.title===item.title&&n.date===item.date)))continue;if(k==='setups'&&!statuses.includes(item.status))item.status='Esperando confirmación';revise(d,k,item,'Informe '+r.reportId);}}
 if(['Risk-On','Neutral','Risk-Off'].includes(r.market)&&(!d.marketAt||Date.parse(r.timestamp)>=Date.parse(d.marketAt))){d.market=r.market;d.marketAt=r.timestamp;d.marketSource='Informe '+r.reportId;}
 d.reports.push({reportId:r.reportId,timestamp:r.timestamp,importedAt:now()});validate(d);
}
export function csv(rows,fields){return '\ufeff'+[fields,...rows.map(r=>fields.map(k=>r[k]??''))].map(row=>row.map(v=>'"'+String(v).replace(/^[=+@\-]/,"'$&").replaceAll('"','""')+'"').join(';')).join('\r\n');}
export function parseCSV(text){const rows=[];let row=[],v='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){v+='"';i++;}else quoted=!quoted;}else if(c===';'&&!quoted){row.push(v);v='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(v);if(row.some(Boolean))rows.push(row);row=[];v='';}else v+=c;}if(quoted)throw Error('CSV: guillemets no cerrados');row.push(v);if(row.some(Boolean))rows.push(row);const headers=rows.shift()?.map(x=>x.replace(/^\ufeff/,''));if(!headers?.includes('ticker'))throw Error('CSV: falta ticker');return rows.map(r=>Object.fromEntries(headers.map((k,i)=>[k,r[i]||''])));}
