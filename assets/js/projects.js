/* Galería progresiva: los proyectos y fichas siguen disponibles sin JavaScript. */
(() => {
  'use strict';
  const gallery = document.getElementById('project-gallery');
  if (!gallery) return;
  const cards = [...gallery.querySelectorAll('[data-project]')];
  const filters = [...document.querySelectorAll('[data-project-filter]')];
  const status = document.getElementById('project-status');
  filters.forEach(button => button.addEventListener('click', () => {
    const state = button.dataset.projectFilter;
    if (!['all', 'production', 'demo', 'development', 'concept'].includes(state)) return;
    let count = 0;
    cards.forEach(card => { card.hidden = state !== 'all' && card.dataset.projectState !== state; if (!card.hidden) count++; });
    filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
    if (status) status.textContent = count + (count === 1 ? ' proyecto disponible.' : ' proyectos disponibles.');
  }));

  const dialog = document.getElementById('project-viewer');
  const body = document.getElementById('project-viewer-body');
  const title = document.getElementById('project-viewer-title');
  let opener;
  if (!dialog || !body || !title || typeof dialog.showModal !== 'function') return;
  gallery.addEventListener('click', event => {
    const trigger = event.target.closest('[data-project-open], [data-project-summary]');
    if (!trigger || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const card = trigger.closest('[data-project]');
    const content = card?.querySelector('.project-detail-content');
    if (!content) return;
    event.preventDefault();
    title.textContent = card.querySelector('h3').textContent;
    // Se clona exclusivamente el contenido estático propio, sin interpretar cadenas HTML.
    body.replaceChildren(...Array.from(content.children, child => child.cloneNode(true)));
    body.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    body.querySelectorAll('img').forEach(img => { img.loading = 'eager'; });
    opener = trigger;
    dialog.showModal();
    document.body.classList.add('viewer-open');
    dialog.querySelector('button').focus({ preventScroll: true });
    // Reiniciar después del foco: el encabezado sticky conserva posiciones previas.
    dialog.scrollTop = 0;
  });
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    if (dialog.open) return;
    body.replaceChildren();
    document.body.classList.remove('viewer-open');
    opener?.focus();
  });
})();
