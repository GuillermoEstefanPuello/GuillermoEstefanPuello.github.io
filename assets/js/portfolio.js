/* DEVGEP+ | Guillermo Estefan Puello — interacciones sin dependencias. */
(() => {
  'use strict';
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const menu = document.querySelector('.mobile-menu');
  menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    menu.open = false;
    const target = document.getElementById(link.hash.slice(1));
    if (target) { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
  }));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu?.open) { menu.open = false; menu.querySelector('summary').focus(); }
  });

  // El contador conserva sus identificadores y el dato escrito por GitHub Actions.
  const counter = document.getElementById('counter-934');
  const counterSection = document.getElementById('contribuciones');
  let frame = 0;
  const endValue = counter ? Number(counter.textContent.replace(/\D/g, '')) : 0;
  const finishCounter = () => {
    window.cancelAnimationFrame(frame);
    if (counter) counter.textContent = endValue.toLocaleString('en-US');
  };
  const animateCounter = () => {
    if (!counter || motion.matches || !Number.isFinite(endValue)) { finishCounter(); return; }
    let start;
    const step = timestamp => {
      start ??= timestamp;
      const progress = Math.min((timestamp - start) / 1200, 1);
      counter.textContent = Math.round(endValue * (1 - Math.pow(1 - progress, 3))).toLocaleString('en-US');
      if (progress < 1 && !motion.matches) frame = window.requestAnimationFrame(step);
      else finishCounter();
    };
    frame = window.requestAnimationFrame(step);
  };
  if (counterSection && 'IntersectionObserver' in window && !motion.matches) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { animateCounter(); observer.disconnect(); }
    }, { threshold: 0.25 });
    observer.observe(counterSection);
  }
  motion.addEventListener?.('change', () => { if (motion.matches) finishCounter(); });

  // El simulador explica gobernanza; nunca concede permisos reales.
  const states = {
    green: { label: 'Verde · Dentro del módulo autorizado', title: 'Construir con un alcance definido.', text: 'Lectura, edición local y pruebas permitidas por el módulo. Cada entrega conserva su evidencia y sus límites.', note: 'La autonomía depende de la autorización vigente.', light: 'light-green' },
    yellow: { label: 'Amarillo · Autorización contextual', title: 'Revisar el impacto antes de avanzar.', text: 'Dependencias, configuración o cambios de alcance requieren autorización contextual previa, salvo que el módulo vigente ya cubra expresamente esa operación.', note: 'Un permiso general no elimina una restricción específica.', light: 'light-yellow' },
    red: { label: 'Rojo · Publicación separada', title: 'Detener la operación sensible.', text: 'Commit, push, merge y despliegue conservan sus autorizaciones. Producción, datos reales, secretos y operaciones destructivas exigen su control específico.', note: 'Una validación local no autoriza publicar.', light: 'light-red' }
  };
  const semaforoContent = document.getElementById('semaforo-content');
  const gate = document.getElementById('red-gate');
  const approve = document.getElementById('btn-approve');
  function setSemaforo(state, announce = true) {
    const value = states[state];
    if (!value || !semaforoContent) return;
    document.querySelectorAll('[data-semaforo]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.semaforo === state)));
    Object.values(states).forEach(item => document.getElementById(item.light)?.classList.toggle('is-lit', item === value));
    semaforoContent.dataset.state = state;
    semaforoContent.querySelector('[data-state-label]').textContent = value.label;
    semaforoContent.querySelector('h4').textContent = value.title;
    semaforoContent.querySelector('[data-state-text]').textContent = value.text;
    semaforoContent.querySelector('[data-state-note]').textContent = value.note;
    if (gate) gate.hidden = state !== 'red';
    if (approve) { approve.textContent = 'Simular aprobación del Director'; approve.disabled = false; }
    if (announce) document.getElementById('semaforo-status').textContent = value.label + '. ' + value.title;
  }
  document.querySelectorAll('[data-semaforo]').forEach(button => button.addEventListener('click', () => setSemaforo(button.dataset.semaforo)));
  approve?.addEventListener('click', () => {
    approve.textContent = 'Simulación finalizada'; approve.disabled = true;
    document.getElementById('semaforo-status').textContent = 'Simulación finalizada. No concede permisos ni ejecuta operaciones.';
  });
  setSemaforo('green', false);

  const dialog = document.getElementById('image-viewer');
  let opener;
  function openImage(link) {
    if (!dialog || typeof dialog.showModal !== 'function') return false;
    const picture = dialog.querySelector('img');
    picture.src = link.href;
    picture.alt = link.dataset.imageTitle || link.textContent.trim();
    document.getElementById('image-viewer-title').textContent = picture.alt;
    opener = link;
    dialog.showModal();
    document.body.classList.add('viewer-open');
    dialog.querySelector('button').focus();
    return true;
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-lightbox]');
    if (link && event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && openImage(link)) event.preventDefault();
  });
  dialog?.querySelector('button').addEventListener('click', () => dialog.close());
  dialog?.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog?.addEventListener('close', () => {
    // Un evento close encolado no debe limpiar un visor que ya se reabrió.
    if (dialog.open) return;
    document.body.classList.remove('viewer-open'); dialog.querySelector('img').removeAttribute('src'); opener?.focus();
  });

  // Los archivos públicos se incorporan solo después de revisar imagen y metadatos.
  const localImage = /^assets\/certifications\/(?!.*(?:\.\.|[?#%\\]))[a-zA-Z0-9/_-]+\.(?:png|jpe?g|webp)$/i;
  const categories = ['fullstack', 'data', 'management', 'security', 'ai'];
  const records = (Array.isArray(window.PORTFOLIO_CREDENTIALS) ? window.PORTFOLIO_CREDENTIALS : []).filter(item =>
    item && item.publicReviewed === true && typeof item.title === 'string' && item.title.trim() &&
    [...categories, 'complementary'].includes(item.category) && localImage.test(item.image) &&
    Number.isInteger(item.width) && item.width > 0 && Number.isInteger(item.height) && item.height > 0
  );
  const gallery = document.getElementById('certification-gallery');
  const status = document.getElementById('certification-status');
  const empty = document.getElementById('certification-empty');
  function credentialCard(item) {
    const article = document.createElement('article'); article.className = 'credential-card';
    article.id = 'credencial-' + item.image.split('/').pop().replace(/\.[^.]+$/, '');
    const link = document.createElement('a'); link.href = item.image; link.dataset.lightbox = ''; link.dataset.imageTitle = item.title;
    link.setAttribute('aria-label', 'Ampliar certificado: ' + item.title);
    const image = document.createElement('img'); image.src = typeof item.thumbnail === 'string' && localImage.test(item.thumbnail) ? item.thumbnail : item.image; image.alt = item.title; image.width = item.width; image.height = item.height; image.loading = 'lazy'; image.decoding = 'async'; link.append(image);
    const title = document.createElement('h4'); title.textContent = item.title;
    article.append(link);
    if (item.kind) { const kind = document.createElement('p'); kind.className = 'credential-kind'; kind.textContent = item.kind; article.append(kind); }
    article.append(title);
    if (item.issuer || item.date) { const meta = document.createElement('p'); meta.textContent = [item.issuer, item.date].filter(Boolean).join(' · '); article.append(meta); }
    if (typeof item.verification === 'string') {
      try {
        const url = new URL(item.verification);
        if (url.protocol === 'https:' && !url.username && !url.password) {
          const verify = document.createElement('a'); verify.href = url.href; verify.textContent = 'Verificar credencial ↗'; verify.target = '_blank'; verify.rel = 'noopener noreferrer'; verify.className = 'project-link'; article.append(verify);
        }
      } catch { /* Una URL inválida se omite de la versión pública. */ }
    }
    if (item.expires) { const expires = document.createElement('p'); expires.textContent = 'Vencimiento indicado: ' + item.expires; article.append(expires); }
    if (item.note || item.privacy) { const note = document.createElement('p'); note.className = 'credential-note'; note.textContent = [item.note, item.privacy].filter(Boolean).join(' '); article.append(note); }
    return article;
  }
  function filterCredentials(category, announce = true) {
    if (!gallery) return;
    gallery.replaceChildren();
    document.querySelectorAll('[data-cert-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.certFilter === category)));
    const shown = records.filter(item => item.category !== 'complementary' && (category === 'all' || item.category === category));
    categories.forEach(key => {
      const group = shown.filter(item => item.category === key);
      if (!group.length) return;
      const section = document.createElement('section'); section.className = 'credential-group';
      section.id = 'categoria-' + key;
      const heading = document.createElement('h3'); heading.textContent = document.querySelector('[data-cert-filter="' + key + '"]').textContent;
      const grid = document.createElement('div'); grid.className = 'credential-grid'; group.forEach(item => grid.append(credentialCard(item)));
      section.append(heading, grid); gallery.append(section);
    });
    if (empty) { empty.hidden = shown.length > 0; empty.querySelector('p').textContent = category === 'all' ? 'Las credenciales se incorporarán cuando estén disponibles sus versiones públicas verificables.' : 'Todavía no hay certificados públicos disponibles en esta categoría.'; }
    if (status && announce) status.textContent = shown.length ? shown.length + (shown.length === 1 ? ' credencial disponible.' : ' credenciales disponibles.') : 'No hay certificados públicos disponibles' + (category === 'all' ? '.' : ' en esta categoría.');
  }
  document.querySelectorAll('[data-cert-filter]').forEach(button => button.addEventListener('click', () => filterCredentials(button.dataset.certFilter)));
  filterCredentials('all', false);
  const complementary = document.getElementById('complementary-gallery');
  const more = records.filter(item => item.category === 'complementary');
  if (complementary && more.length) { complementary.replaceChildren(); more.forEach(item => complementary.append(credentialCard(item))); }
})();
