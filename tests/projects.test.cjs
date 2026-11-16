/* Interacción del módulo aislada, sin red ni dependencias. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../assets/js/projects.js'),'utf8');

function setup({modal=true}={}){
 const state={active:null,locked:false};
 function node(extra={}){return Object.assign({dataset:{},listeners:{},children:[],attributes:{},hidden:false,addEventListener(k,fn){this.listeners[k]=fn},setAttribute(k,v){this.attributes[k]=v},focus(){state.active=this},replaceChildren(...items){this.children=items},querySelectorAll(){return []}},extra)}
 const states=['production','production','demo','development','development','development','demo','demo','development','development','development','concept'];
 const cards=states.map((s,i)=>node({dataset:{project:'p'+i,projectState:s},querySelector(selector){return selector==='h3'?{textContent:'Proyecto '+i}:content}}));
 const buttons=['all','production','demo','development','concept','invalid'].map(s=>node({dataset:{projectFilter:s}}));
 const content={children:[{cloneNode(){return {tag:'img'}}},{cloneNode(){return {textContent:'Descripción literal'}}}]};
 const gallery=node({querySelectorAll:()=>cards});
 const body=node(); const title=node(); const status=node(); const close=node();
 const dialog=node({open:false,showModal(){this.open=true},querySelector:()=>close});
 const elements={'project-gallery':gallery,'project-status':status,'project-viewer':modal?dialog:null,'project-viewer-body':body,'project-viewer-title':title};
 const document={getElementById:id=>elements[id],querySelectorAll:()=>buttons,body:{classList:{add(){state.locked=true},remove(){state.locked=false}}}};
 vm.runInNewContext(source,{document});
 function open(index,extra={}){const trigger=node({closest:()=>cards[index]}); const event={target:{closest:()=>trigger},button:0,preventDefault(){this.prevented=true},...extra}; gallery.listeners.click?.(event); return {trigger,event}}
 return {state,cards,buttons,gallery,body,title,status,close,dialog,open};
}

test('filtros conservan orden y anuncian 12/2/3/6/1 proyectos',()=>{
 const p=setup();
 for(const [key,count] of [['all',12],['production',2],['demo',3],['development',6],['concept',1]]){
  p.buttons.find(b=>b.dataset.projectFilter===key).listeners.click();
  assert.equal(p.cards.filter(c=>!c.hidden).length,count);
  assert.equal(p.status.textContent,count+(count===1?' proyecto disponible.':' proyectos disponibles.'));
  assert.equal(p.buttons.filter(b=>b.attributes['aria-pressed']==='true').length,1);
 }
 p.buttons.at(-1).listeners.click(); assert.equal(p.cards.filter(c=>!c.hidden).length,1);
});

test('ficha muestra título y contenido, bloquea scroll y devuelve el foco',()=>{
 const p=setup(); p.dialog.scrollTop=850; const {trigger,event}=p.open(2);
 assert.equal(event.prevented,true); assert.equal(p.dialog.open,true); assert.equal(p.title.textContent,'Proyecto 2');
 assert.equal(p.body.children.length,2); assert.equal(p.state.locked,true); assert.equal(p.state.active,p.close);
 assert.equal(p.dialog.scrollTop,0);
 p.dialog.open=false; p.dialog.listeners.close();
 assert.equal(p.state.locked,false); assert.equal(p.body.children.length,0); assert.equal(p.state.active,trigger);
});

test('un cierre anterior no limpia una ficha recién reabierta',()=>{
 const p=setup(); p.open(0); p.dialog.listeners.close();
 assert.equal(p.body.children.length,2); assert.equal(p.state.locked,true);
});

test('se preservan clics modificados y navegación nativa sin dialog',()=>{
 for(const modifier of [{ctrlKey:true},{metaKey:true},{shiftKey:true},{altKey:true},{button:1}]){
  const p=setup(); const {event}=p.open(0,modifier); assert.equal(event.prevented,undefined); assert.equal(p.dialog.open,false);
 }
 const p=setup({modal:false}); assert.equal(p.gallery.listeners.click,undefined);
 p.buttons[2].listeners.click(); assert.equal(p.cards.filter(c=>!c.hidden).length,3);
});

test('la galería real mantiene doce fichas, estados honestos y galerías Remember/JMBooks sin URLs inventadas',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 const cards=[...html.matchAll(/<article class="work-card" data-project="([^"]+)"[\s\S]*?<\/article>/g)];
 assert.deepEqual(cards.map(m=>m[1]),['shepherd','consulado','patriapulse','rememberhr','jmbooks','sbpe','sintra','bic','kikipay','ticketstime','kairos','rdes']);
 for(const [slug,count,label] of [['rememberhr',3,'DEMO VISUAL'],['jmbooks',4,'Google AI Studio']]){
  const card=cards.find(m=>m[1]===slug)[0];assert.match(card,/data-project-state="development"/);
  assert.ok(card.includes(label));assert.ok(card.includes('ilustrativos'));
  assert.equal((card.match(/class="project-support-image"/g)||[]).length,count);
  assert.ok(!card.includes('href="https://'));assert.ok(card.includes('Sin demo ni repositorio público acreditado.'));
 }
});
