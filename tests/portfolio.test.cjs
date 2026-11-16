/* Pruebas en memoria: sin navegador, red, archivos ficticios ni dependencias. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/js/portfolio.js'), 'utf8');

class Element {
  constructor(text = '') { this.textContent = text; this.children = []; this.dataset = {}; this.attributes = {}; this.listeners = {}; this.hidden = false; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  setAttribute(key, value) { this.attributes[key] = value; }
  addEventListener(key, callback) { this.listeners[key] = callback; }
  querySelector(selector) { return this.selectors?.[selector] || null; }
  removeAttribute(key) { delete this.attributes[key]; delete this[key]; }
}

function run({ reduced = false, observerAvailable = true, records = [], count = '990', viewer = null } = {}) {
  const counter = new Element(count);
  const section = new Element();
  const gallery = new Element();
  const complementary = new Element();
  const empty = new Element(); empty.selectors = { p: new Element() };
  const status = new Element();
  const keys = ['all', 'fullstack', 'data', 'management', 'security', 'ai'];
  const buttons = keys.map(key => { const button = new Element(key); button.dataset.certFilter = key; return button; });
  const elements = { 'counter-934': counter, contribuciones: section, 'certification-gallery': gallery,
    'certification-empty': empty, 'certification-status': status, 'complementary-gallery': complementary, 'image-viewer': viewer };
  const frames = new Map(); let nextFrame = 0; let onIntersection;
  const motion = { matches: reduced, addEventListener(_, callback) { this.onChange = callback; } };
  const window = {
    matchMedia: () => motion, PORTFOLIO_CREDENTIALS: records,
    requestAnimationFrame: callback => { const id = ++nextFrame; frames.set(id, callback); return id; },
    cancelAnimationFrame: id => frames.delete(id)
  };
  class Observer {
    constructor(callback) { onIntersection = callback; }
    observe() {}
    disconnect() {}
  }
  if (observerAvailable) window.IntersectionObserver = Observer;
  const document = {
    querySelector(selector) { return buttons.find(button => selector === '[data-cert-filter="' + button.dataset.certFilter + '"]') || null; },
    querySelectorAll(selector) { return selector === '[data-cert-filter]' ? buttons : []; },
    getElementById(id) { return elements[id] || null; },
    addEventListener() {}, createElement: () => new Element(), body: { classList: { remove() {} } }
  };
  vm.runInNewContext(source, { window, document, IntersectionObserver: Observer, URL });
  return { counter, gallery, complementary, empty, status, buttons, frames, motion,
    intersect() { onIntersection?.([{ isIntersecting: true }]); },
    tick(time) { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(time)); }
  };
}

test('el contador avanza y termina exactamente en el dato de la automatización', () => {
  const page = run(); page.intersect(); page.tick(0); assert.equal(page.counter.textContent, '0');
  page.tick(600); assert.ok(Number(page.counter.textContent) > 0 && Number(page.counter.textContent) < 990);
  page.tick(1200); assert.equal(page.counter.textContent, '990'); assert.equal(page.frames.size, 0);
});

test('movimiento reducido evita programar animación; sin observer mantiene el dato', () => {
  for (const settings of [{ reduced: true }, { observerAvailable: false }]) {
    const page = run(settings); page.intersect(); assert.equal(page.frames.size, 0); assert.equal(page.counter.textContent, '990');
  }
});

test('activar movimiento reducido durante el contador cancela la animación', () => {
  const page = run(); page.intersect(); page.tick(0); page.tick(400);
  page.motion.matches = true; page.motion.onChange(); assert.equal(page.counter.textContent, '990'); assert.equal(page.frames.size, 0);
});

test('inventario vacío y filtros no producen tarjetas ficticias', () => {
  const page = run(); assert.equal(page.gallery.children.length, 0); assert.equal(page.empty.hidden, false);
  page.buttons.find(button => button.dataset.certFilter === 'security').listeners.click();
  assert.equal(page.gallery.children.length, 0); assert.match(page.status.textContent, /No hay certificados/);
  assert.equal(page.buttons.filter(button => button.attributes['aria-pressed'] === 'true').length, 1);
});

const fixture = { title: 'PRUEBA EN MEMORIA', category: 'fullstack', image: 'assets/certifications/test.webp', width: 1200, height: 800, publicReviewed: true };

test('el renderer agrupa por orden oficial y conserva texto literal y metadatos acreditados', () => {
  const page = run({ records: [
    { ...fixture, category: 'ai', title: 'IA — prueba' },
    { ...fixture, title: '<script>texto literal</script>', issuer: 'Emisor de prueba', date: '2026', verification: 'https://example.com/credential' }
  ] });
  assert.equal(page.gallery.children.length, 2);
  assert.equal(page.gallery.children[0].children[0].textContent, 'fullstack');
  const card = page.gallery.children[0].children[1].children[0];
  assert.equal(card.children[1].textContent, '<script>texto literal</script>');
  assert.equal(card.children[2].textContent, 'Emisor de prueba · 2026');
  assert.equal(card.children[3].href, 'https://example.com/credential');
  assert.equal(card.children[0].children[0].width, 1200);
  page.buttons.find(button => button.dataset.certFilter === 'ai').listeners.click();
  assert.equal(page.gallery.children.length, 1); assert.equal(page.gallery.children[0].children[0].textContent, 'ai');
});

test('rechaza credenciales sin revisión pública, categoría válida o imagen local segura', () => {
  const page = run({ records: [
    { ...fixture, publicReviewed: false }, { ...fixture, category: 'unknown' },
    { ...fixture, image: 'https://example.com/private.png' },
    { ...fixture, image: 'assets/certifications/../private.png' },
    { ...fixture, image: 'assets/certifications/test.svg' },
    { ...fixture, image: 'assets/certifications/test.png?token=private' },
    { ...fixture, image: 'assets/certifications/%2e%2e/private.png' },
    { ...fixture, width: 0 }
  ] });
  assert.equal(page.gallery.children.length, 0); assert.equal(page.empty.hidden, false);
});

test('omite verificación insegura y separa credenciales complementarias', () => {
  const page = run({ records: [
    { ...fixture, verification: 'javascript:alert(1)' },
    { ...fixture, category: 'complementary', verification: 'https://user:secret@example.com/' }
  ] });
  const card = page.gallery.children[0].children[1].children[0];
  assert.equal(card.children.length, 2);
  assert.equal(page.complementary.children.length, 1);
  assert.equal(page.complementary.children[0].children.length, 2);
});

test('miniaturas seguras, tipos y avisos conservan su significado', () => {
  for (const thumbnail of ['assets/certifications/test-thumb.webp', 'https://example.com/private.jpg']) {
    const page = run({ records: [{ ...fixture, thumbnail, kind: 'Práctica de preparación', note: 'No acredita CSM.', privacy: 'QR omitido.', expires: '2029' }] });
    const card = page.gallery.children[0].children[1].children[0];
    assert.equal(card.children[0].children[0].src, thumbnail.startsWith('assets/') ? thumbnail : fixture.image);
    assert.equal(card.children[1].textContent, 'Práctica de preparación');
    assert.equal(card.children[3].textContent, 'Vencimiento indicado: 2029');
    assert.equal(card.children[4].textContent, 'No acredita CSM. QR omitido.');
  }
});

test('el inventario real conserva 18 tecnológicas, cinco complementarias y las prioridades', () => {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../assets/js/certifications.js'), 'utf8'), context);
  const records = context.window.PORTFOLIO_CREDENTIALS;
  assert.equal(records.length, 23);
  assert.ok(records.every(record => record.publicReviewed && record.kind && record.issuer && record.date));
  assert.deepEqual(Array.from(records.slice(0, 3), record => path.basename(record.image)), ['fullstack-avanzado.webp', 'fullstack-intermedio.webp', 'ibm-software-engineering.webp']);
  for (const record of records) {
    for (const key of ['image', 'thumbnail']) assert.ok(fs.existsSync(path.join(__dirname, '..', record[key])), record[key]);
  }
  const page = run({ records });
  assert.equal(page.gallery.children.reduce((sum, group) => sum + group.children[1].children.length, 0), 18);
  assert.equal(page.complementary.children.length, 5);
  for (const [key, expected] of [['fullstack', 4], ['data', 8], ['management', 4], ['security', 1], ['ai', 1]]) {
    page.buttons.find(button => button.dataset.certFilter === key).listeners.click();
    assert.equal(page.gallery.children[0].children[1].children.length, expected);
    assert.equal(page.empty.hidden, true);
    assert.equal(page.status.textContent, expected + (expected === 1 ? ' credencial disponible.' : ' credenciales disponibles.'));
  }
  const preparation = records.find(record => record.image.endsWith('/csm-practice.webp'));
  assert.equal(preparation.kind, 'Práctica de preparación'); assert.match(preparation.note, /No acredita/);
});

test('el contador real del HTML finaliza en 1,002 y conserva la fecha de corte', () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  const count = html.match(/id="counter-934"[^>]*>([\d,]+)</)[1];
  assert.equal(count, '1,002'); assert.match(html, /15 de noviembre de 2026/);
  const page = run({ count }); page.intersect(); page.tick(0); page.tick(1200);
  assert.equal(page.counter.textContent, '1,002'); assert.equal(page.frames.size, 0);
});

test('un close diferido no vacía la imagen de un visor recién reabierto', () => {
  const viewer = new Element(); const image = new Element(); image.src = fixture.image;
  viewer.selectors = { img: image, button: new Element() }; viewer.open = true;
  run({ viewer }); viewer.listeners.close(); assert.equal(image.src, fixture.image);
  viewer.open = false; viewer.listeners.close(); assert.equal(image.src, undefined);
});
