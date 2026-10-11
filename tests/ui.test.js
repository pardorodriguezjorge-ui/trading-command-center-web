import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {KEY} from '../src/core.js';
const dom=new JSDOM(await readFile(new URL('../index.html',import.meta.url),'utf8'),{url:'https://example.com/trading-command-center-web/'});
for(const key of ['window','document','location','localStorage','navigator'])Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true});
globalThis.confirm=()=>true;globalThis.fetch=async()=>({ok:false});
const interval=globalThis.setInterval;globalThis.setInterval=(...args)=>{const t=interval(...args);t.unref();return t;};
dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false};
await import('../src/app.js');
const $=s=>document.querySelector(s);
function go(name){location.hash=name;window.dispatchEvent(new dom.window.HashChangeEvent('hashchange'));}
function click(s){$(s).click();}
function fill(name,value){$('#form').elements[name].value=value;}
function submit(){ $('#form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));}
test('todos los menús renderizan contenido y título',()=>{for(const id of ['dashboard','positions','radar','setups','charts','macro','news','journal','playbook','history','settings']){go(id);assert.ok($('#content').textContent.trim().length>15,id);assert.ok($('#title').textContent.length>3);}});
test('formulario compra guarda y actualiza cantidad; reload recupera el estado',()=>{go('positions');click('[data-k="transactions"]');fill('ticker','CRML');fill('side','Compra');fill('qty','10');fill('price','7');fill('fees','1');fill('date','2026-10-11T10:00:00Z');submit();assert.equal($('#formError').textContent,'');const d=JSON.parse(localStorage.getItem(KEY));assert.equal(d.positions[0].qty,360);assert.equal(d.transactions.length,1);assert.ok($('#content').textContent.includes('360'));});
test('sobreventa muestra error y conserva el registro',()=>{const before=localStorage.getItem(KEY);click('[data-k="transactions"]');fill('ticker','CRML');fill('side','Venta');fill('qty','999');fill('price','8');fill('fees','1');fill('date','2026-10-11T11:00:00Z');submit();assert.match($('#formError').textContent,/más acciones/);assert.equal(localStorage.getItem(KEY),before);$('#editor').close();});
test('editar setup conserva snapshot anterior',()=>{go('setups');click('[data-k="setups"][data-id="s1"]');fill('stop','287');submit();assert.equal($('#formError').textContent,'');const d=JSON.parse(localStorage.getItem(KEY));assert.equal(d.setups[0].stop,'287');assert.equal(d.setups[0].history.at(-1).snapshot.stop,'289 (versión histórica)');});
test('filtro radar reduce resultados sin perder foco',()=>{go('radar');const input=$('[data-filter="query"]');input.value='NTNX';input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));assert.equal(document.querySelectorAll('.cards>.panel').length,1);assert.ok($('.cards').textContent.includes('NTNX'));});
test('temporalidad cambia solo el iframe seleccionado',()=>{go('charts');$('#chartInterval').value='240';$('#chartInterval').dispatchEvent(new dom.window.Event('change',{bubbles:true}));assert.ok($('.chart').src.includes('interval=240'));assert.equal(document.querySelectorAll('iframe').length,1);});
test('noticias escapadas no inyectan HTML',()=>{go('news');click('[data-k="news"]');fill('ticker','CEG');fill('title','<img src=x onerror=alert(1)>');fill('date','2026-10-11T10:00:00Z');fill('url','https://example.com/news');submit();assert.equal($('#formError').textContent,'');assert.equal(document.querySelectorAll('#content img').length,0);assert.ok($('#content').textContent.includes('<img'));});
