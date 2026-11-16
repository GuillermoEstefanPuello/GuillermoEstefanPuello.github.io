/* Formación: disclosure sin reconstruir tarjetas ni duplicar sus eventos. */
(() => {
  'use strict';
  const toggle = document.getElementById('formation-toggle');
  const panel = document.getElementById('formation-panel');
  if (!toggle || !panel) return;
  const label = toggle.querySelector('[data-formation-label]');
  const viewer = document.getElementById('image-viewer');
  const filters = [...panel.querySelectorAll('[data-cert-filter]')];
  let returnToToggle = false;

  function setExpanded(expanded) {
    const focusedInside = panel.contains(document.activeElement);
    if (!expanded && viewer?.open) {
      const picture = viewer.querySelector('img');
      const credentialOpen = [...panel.querySelectorAll('a[data-lightbox]')].some(link => link.href === picture?.src);
      if (credentialOpen) { returnToToggle = true; viewer.close(); }
    }
    panel.hidden = !expanded;
    toggle.setAttribute('aria-expanded', String(expanded));
    label.textContent = expanded ? 'Ocultar certificaciones' : 'Ver las 25 certificaciones';
    if (!expanded && (focusedInside || returnToToggle)) toggle.focus({ preventScroll: true });
  }
  toggle.addEventListener('click', () => setExpanded(panel.hidden));
  viewer?.addEventListener('close', () => {
    if (viewer.open || !returnToToggle) return;
    returnToToggle = false;
    if (panel.hidden) toggle.focus({ preventScroll: true });
  });

  function selectCategory(category) {
    const button = filters.find(item => item.dataset.certFilter === category);
    if (button && button.getAttribute('aria-pressed') !== 'true') button.click();
  }
  function reveal(hash) {
    let id;
    try { id = decodeURIComponent(hash.replace(/^#/, '')); } catch { return; }
    if (!id) return;
    if (id.startsWith('categoria-')) selectCategory(id.slice('categoria-'.length));
    let target = document.getElementById(id);
    if (!target && id.startsWith('credencial-')) {
      const records = Array.isArray(window.PORTFOLIO_CREDENTIALS) ? window.PORTFOLIO_CREDENTIALS : [];
      const item = records.find(record => record?.publicReviewed &&
        typeof record.image === 'string' &&
        /^assets\/certifications\/[a-zA-Z0-9_-]+\.(?:webp|png|jpe?g)$/i.test(record.image) &&
        'credencial-' + record.image.split('/').pop().replace(/\.[^.]+$/, '') === id);
      if (item) { selectCategory(item.category); target = document.getElementById(id); }
    }
    if (!target || !panel.contains(target)) return;
    setExpanded(true);
    const details = target.closest('details');
    if (details && panel.contains(details)) details.open = true;
    target.setAttribute('tabindex', '-1');
    target.scrollIntoView({ block: 'start', behavior: 'instant' });
    target.focus({ preventScroll: true });
  }
  window.addEventListener('hashchange', () => reveal(window.location.hash));
  document.addEventListener('click', event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href^="#"]');
    if (link) reveal(link.hash);
  });
  setExpanded(false);
  reveal(window.location.hash);
})();
