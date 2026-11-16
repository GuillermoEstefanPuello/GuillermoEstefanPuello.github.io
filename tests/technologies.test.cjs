const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../assets/js/technologies.js'),'utf8');

function setup({reduced=false,observer=false,initial=0}={}){
 const frames=new Map();let serial=0,intersection,scroll=Math.round(initial);
 function node(extra={}){return Object.assign({hidden:false,dataset:{},attributes:{},events:{},children:[],classList:{add(){}},setAttribute(k,v){this.attributes[k]=v},addEventListener(k,fn){this.events[k]=fn},append(n){this.children.push(n)}},extra)}
 const clone=node();const first=node({offsetWidth:500,cloneNode:()=>clone});const track=node();const label=node();const icon=node();
 const section=node();const viewport=node({contains:n=>n===viewport,querySelector:s=>s==='[data-technology-set]'?first:track});
 Object.defineProperty(viewport,'scrollLeft',{get:()=>scroll,set:v=>{scroll=Math.round(v)}});
 const toggle=node({querySelector:s=>s==='[data-motion-label]'?label:icon});
 const motion={matches:reduced,addEventListener(_,fn){this.change=fn}};
 const document={hidden:false,events:{},getElementById:id=>({'tecnologias-resumen':section,'technology-viewport':viewport,'technology-motion-toggle':toggle}[id]),addEventListener(k,fn){this.events[k]=fn}};
 const window={matchMedia:()=>motion,requestAnimationFrame:fn=>{frames.set(++serial,fn);return serial},cancelAnimationFrame:id=>frames.delete(id)};
 if(observer) window.IntersectionObserver=class{constructor(fn){intersection=fn}observe(){}};
 vm.runInNewContext(source,{window,document});
 return {section,viewport,toggle,label,motion,document,clone,frames,tick(time){const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn(time))},intersect(visible){intersection([{isIntersecting:visible}])}};
}

test('movimiento lento conserva fracciones a 60 Hz y la copia no duplica accesibilidad',()=>{
 const p=setup();p.tick(0);for(let time=16;time<=992;time+=16)p.tick(time);
 assert.ok(p.viewport.scrollLeft>=35&&p.viewport.scrollLeft<=36);
 assert.equal(p.clone.attributes['aria-hidden'],'true');assert.ok('inert' in p.clone.attributes);
 assert.equal(p.section.dataset.motion,'playing');
});
test('mantiene 36 px/s con frames espaciados y no recupera tiempo oculto',()=>{
 const p=setup();p.tick(0);p.tick(1000);assert.equal(p.viewport.scrollLeft,36);
 p.document.hidden=true;p.document.events.visibilitychange();
 p.document.hidden=false;p.document.events.visibilitychange();p.tick(9000);assert.equal(p.viewport.scrollLeft,36);
 p.tick(10000);assert.equal(p.viewport.scrollLeft,72);
});
test('pausa explícita, reanudación y teclado no compiten con scroll nativo',()=>{
 const p=setup();p.tick(0);p.tick(80);p.toggle.events.click();
 assert.equal(p.frames.size,0);assert.equal(p.toggle.attributes['aria-pressed'],'true');assert.equal(p.label.textContent,'Reanudar movimiento');
 p.toggle.events.click();assert.equal(p.frames.size,1);
 p.viewport.events.keydown({key:'ArrowRight'});assert.equal(p.frames.size,0);assert.equal(p.toggle.attributes['aria-pressed'],'true');
});
test('movimiento reducido desactiva animación y copia, también si cambia en ejecución',()=>{
 const p=setup({reduced:true});assert.equal(p.frames.size,0);assert.equal(p.clone.hidden,true);assert.equal(p.toggle.hidden,true);
 p.motion.matches=false;p.motion.change();assert.equal(p.frames.size,1);assert.equal(p.clone.hidden,false);
 p.motion.matches=true;p.motion.change();assert.equal(p.frames.size,0);assert.equal(p.section.dataset.motion,'reduced');
});
test('pausa al perder visibilidad, salir de pantalla, enfocar o tocar la cinta',()=>{
 const p=setup({observer:true});assert.equal(p.frames.size,0);p.intersect(true);assert.equal(p.frames.size,1);
 p.document.hidden=true;p.document.events.visibilitychange();assert.equal(p.frames.size,0);
 p.document.hidden=false;p.document.events.visibilitychange();assert.equal(p.frames.size,1);
 p.viewport.events.focusin();assert.equal(p.frames.size,0);p.viewport.events.focusout({relatedTarget:null});assert.equal(p.frames.size,1);
 p.intersect(false);assert.equal(p.frames.size,0);p.intersect(true);
 p.viewport.events.pointerdown({pointerType:'touch'});assert.equal(p.frames.size,0);
});
test('el loop reinicia en el mismo punto de la copia sin acumular un salto de fondo',()=>{
 const p=setup({initial:499});p.tick(0);p.tick(80);assert.equal(p.viewport.scrollLeft,2);
});

test('el HTML real integra todas las tecnologías en una sola lista móvil y exactamente cinco destacadas',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 const belt=html.match(/<section[^>]*id="tecnologias-resumen"[^>]*>[\s\S]*?<\/section>/)[0];
 const chips=[...belt.matchAll(/<li class="technology-item([^"]*)">[\s\S]*?<h3>([^<]+)<\/h3>[\s\S]*?<\/li>/g)];
 assert.equal(chips.length,19);assert.equal((belt.match(/data-technology-set/g)||[]).length,1);
 assert.deepEqual(chips.filter(m=>m[1].includes('technology-featured')).map(m=>m[2]),['Python','JavaScript','TypeScript','C#','PowerShell']);
 for(const name of ['.NET','React','Next.js','PostgreSQL','NestJS','FastAPI','Docker','Power BI','Git','GitHub','Vercel','Render'])assert.ok(chips.some(m=>m[2]===name));
 assert.ok(!/technology-core|technology-primary|ASP.NET Core|Supabase/.test(belt));
 assert.ok(html.indexOf('id="hero"')<html.indexOf('id="tecnologias-resumen"')&&html.indexOf('id="tecnologias-resumen"')<html.indexOf('id="manifiesto"'));
});

test('logos locales con nombre debajo y presentación sin tarjetas',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 const belt=html.match(/<section[^>]*id="tecnologias-resumen"[^>]*>[\s\S]*?<\/section>/)[0];
 const items=[...belt.matchAll(/<li class="technology-item[^"]*">([\s\S]*?)<\/li>/g)];
 for(const [,body] of items){
  assert.ok(body.indexOf('<img ')<body.indexOf('<h3>'));
  const src=body.match(/src="([^"]+)"/)[1];assert.ok(src.startsWith('assets/technologies/'));assert.ok(fs.existsSync(path.join(__dirname,'..',src)));
  assert.ok(body.includes('alt="" aria-hidden="true"'));assert.ok(!body.includes('<p>'));
 }
 const css=fs.readFileSync(path.join(__dirname,'../assets/css/technologies.css'),'utf8');
 assert.match(css,/background:transparent;border:0;border-radius:0;box-shadow:none/);
 assert.ok(!css.includes('technology-chip'));assert.match(source,/const speed = 36;/);
});
