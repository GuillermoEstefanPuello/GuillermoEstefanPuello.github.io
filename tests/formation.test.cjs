/* Estado del disclosure y enlaces directos; Enter/Espacio/Tab se prueban en navegador. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../assets/js/formation.js'),'utf8');
const data={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js/certifications.js'),'utf8'),data);
const records=Array.from(data.window.PORTFOLIO_CREDENTIALS);

function setup(hash=''){
 const ids=new Map(),documentEvents={},windowEvents={};let document,filterClicks=0,closeCalls=0;
 function node(id,parent=null){
  const n={id,parent,hidden:false,attributes:{},events:{},dataset:{},
   setAttribute(k,v){this.attributes[k]=v},getAttribute(k){return this.attributes[k]??null},
   addEventListener(k,fn){(this.events[k]??=[]).push(fn)},click(){for(const fn of this.events.click||[])fn({})},
   contains(other){for(let p=other;p;p=p.parent)if(p===this)return true;return false},
   closest(selector){for(let p=this;p;p=p.parent)if(selector==='details'&&p===more)return p;return null},
   focus(){document.activeElement=this},scrollIntoView(value){this.scrolled=value}};
  ids.set(id,n);return n;
 }
 document={activeElement:null,getElementById:id=>ids.get(id)||null,addEventListener(k,fn){(documentEvents[k]??=[]).push(fn)}};
 const panel=node('formation-panel'),toggle=node('formation-toggle'),label=node('label'),more=node('more',panel),gallery=node('certification-gallery',panel);
 node('formacion');node('certificaciones');node('complementary-gallery',more);
 const filters=['all','fullstack','data','management','security','ai'].map(key=>{const n=node('filter-'+key,panel);n.dataset.certFilter=key;return n});
 let cards=[],links=[];
 function render(category){
  for(const [id] of ids)if(id.startsWith('credencial-')||id.startsWith('categoria-'))ids.delete(id);
  cards=[];links=[];
  for(const key of ['fullstack','data','management','security','ai'])if(category==='all'||category===key)node('categoria-'+key,gallery);
  for(const record of records){
   if(record.category!=='complementary'&&category!=='all'&&record.category!==category)continue;
   const id='credencial-'+record.image.split('/').pop().replace(/\.[^.]+$/,'');
   const card=node(id,record.category==='complementary'?more:ids.get('categoria-'+record.category));
   const link=node('link-'+id,card);link.href=record.image;cards.push(card);links.push(link);
  }
  filters.forEach(n=>n.setAttribute('aria-pressed',String(n.dataset.certFilter===category)));
 }
 for(const n of filters)n.addEventListener('click',()=>{filterClicks++;render(n.dataset.certFilter)});
 render('all');
 panel.querySelectorAll=selector=>selector==='[data-cert-filter]'?filters:links;
 toggle.querySelector=()=>label;
 const viewer=node('image-viewer'),picture=node('picture');viewer.open=false;viewer.querySelector=()=>picture;
 viewer.close=()=>{viewer.open=false;closeCalls++};
 const window={PORTFOLIO_CREDENTIALS:records,location:{hash},addEventListener(k,fn){(windowEvents[k]??=[]).push(fn)}};
 vm.runInNewContext(source,{window,document});
 return{panel,toggle,label,more,viewer,picture,document,filters,ids,get cards(){return cards},get links(){return links},get filterClicks(){return filterClicks},get closeCalls(){return closeCalls},
  hash(value){window.location.hash=value;windowEvents.hashchange.forEach(fn=>fn())},
  anchor(value,options={}){const link={hash:value};documentEvents.click.forEach(fn=>fn({button:0,target:{closest:()=>link},...options}))},
  closeEvent(){(viewer.events.close||[]).forEach(fn=>fn())}};
}

test('HTML conserva introducción y anclas; botón real precede al panel inicialmente hidden',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 const section=html.match(/<section[^>]*id="certificaciones"[\s\S]*?<\/section>/)[0];
 assert.ok(section.includes('id="formacion"'));assert.ok(section.includes('Conocimiento<br/>con respaldo.'));
 assert.match(section,/<button type="button"[^>]*id="formation-toggle"[^>]*aria-expanded="false"[^>]*aria-controls="formation-panel"/);
 assert.match(section,/<div class="formation-panel" id="formation-panel" hidden>/);
 assert.ok(section.indexOf('class="section-lead"')<section.indexOf('id="formation-toggle"'));
 assert.ok(section.indexOf('id="formation-toggle"')<section.indexOf('id="formation-panel"'));
 assert.ok(section.includes('Ver las 25 certificaciones'));assert.ok(section.includes('Más sobre mí'));
 assert.equal((html.match(/src="assets\/js\/formation.js"/g)||[]).length,1);
});

test('estado inicial recogido y apertura/cierre sincronizan texto y aria sin reconstruir 25 tarjetas',()=>{
 const p=setup();assert.equal(p.panel.hidden,true);assert.equal(p.toggle.getAttribute('aria-expanded'),'false');assert.equal(p.label.textContent,'Ver las 25 certificaciones');
 const original=p.cards.slice();assert.equal(original.length,25);
 for(let i=0;i<5;i++){
  p.toggle.click();assert.equal(p.panel.hidden,false);assert.equal(p.toggle.getAttribute('aria-expanded'),'true');assert.equal(p.label.textContent,'Ocultar certificaciones');
  assert.deepEqual(p.cards,original);assert.equal(p.filters.length,6);
  p.toggle.click();assert.equal(p.panel.hidden,true);assert.equal(p.toggle.getAttribute('aria-expanded'),'false');
 }
 assert.equal(p.toggle.events.click.length,1);assert.equal(p.filterClicks,0);
});

test('recoger con foco dentro lo devuelve al botón; reapertura conserva filtro y nodos',()=>{
 const p=setup();p.toggle.click();p.filters.find(n=>n.dataset.certFilter==='security').click();const filtered=p.cards.slice();
 p.links[0].focus();p.toggle.click();assert.equal(p.document.activeElement,p.toggle);assert.equal(p.panel.hidden,true);
 p.toggle.click();assert.deepEqual(p.cards,filtered);assert.equal(p.filterClicks,1);
});

test('recoger un visor de credencial usa close y recupera foco incluso en close diferido',()=>{
 const p=setup();p.toggle.click();p.picture.src=p.links[0].href;p.viewer.open=true;p.viewer.focus();
 p.toggle.click();assert.equal(p.closeCalls,1);assert.equal(p.viewer.open,false);assert.equal(p.panel.hidden,true);
 p.closeEvent();assert.equal(p.document.activeElement,p.toggle);
});

test('un close encolado no roba foco a una reapertura ni cierra un visor ajeno',()=>{
 const p=setup();p.toggle.click();p.picture.src=p.links[0].href;p.viewer.open=true;p.toggle.click();p.toggle.click();p.links[0].focus();const target=p.document.activeElement;
 p.viewer.open=true;p.closeEvent();assert.equal(p.document.activeElement,target);p.viewer.open=false;p.closeEvent();assert.equal(p.document.activeElement,target);
 p.picture.src='assets/projects/shepherd/example.png';p.viewer.open=true;p.toggle.click();assert.equal(p.viewer.open,true);assert.equal(p.closeCalls,1);
});

test('formacion/certificaciones mantienen panel recogido; enlaces existentes interiores lo revelan',()=>{
 for(const hash of ['#formacion','#certificaciones'])assert.equal(setup(hash).panel.hidden,true);
 const p=setup('#certification-gallery');assert.equal(p.panel.hidden,false);assert.equal(p.document.activeElement,p.ids.get('certification-gallery'));
});

test('deep link de categoría o credencial revela también destinos fuera del filtro actual',()=>{
 const p=setup('#categoria-data');assert.equal(p.panel.hidden,false);assert.equal(p.document.activeElement.id,'categoria-data');assert.equal(p.cards.filter(c=>c.parent!==p.more).length,8);
 p.hash('#credencial-fullstack-avanzado');assert.equal(p.document.activeElement.id,'credencial-fullstack-avanzado');assert.equal(p.document.activeElement.getAttribute('tabindex'),'-1');
 assert.equal(p.document.activeElement.scrolled.behavior,'instant');
 p.toggle.click();p.anchor('#credencial-fullstack-avanzado');assert.equal(p.panel.hidden,false);
});

test('credencial complementaria abre Más sobre mí; hashes ajenos/malformados y clics modificados no alteran estado',()=>{
 const p=setup('#credencial-liderazgo-historico');assert.equal(p.panel.hidden,false);assert.equal(p.more.open,true);assert.equal(p.document.activeElement.id,'credencial-liderazgo-historico');
 const q=setup();for(const hash of ['#proyectos','#%ZZ','#categoria-invalid','#credencial-inexistente'])q.hash(hash);assert.equal(q.panel.hidden,true);
 for(const options of [{ctrlKey:true},{metaKey:true},{shiftKey:true},{altKey:true},{button:1}])q.anchor('#categoria-data',options);
 assert.equal(q.panel.hidden,true);assert.equal(q.filterClicks,0);
});
