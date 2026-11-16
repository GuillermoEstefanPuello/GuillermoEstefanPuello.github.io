/* Cinta progresiva: scroll nativo, pausa accesible y cero animación con movimiento reducido. */
(() => {
  'use strict';
  const section = document.getElementById('tecnologias-resumen');
  const viewport = document.getElementById('technology-viewport');
  const toggle = document.getElementById('technology-motion-toggle');
  if (!section || !viewport || !toggle) return;
  const first = viewport.querySelector('[data-technology-set]');
  const track = viewport.querySelector('.technology-track');
  if (!first || !track) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clone = first.cloneNode(true);
  clone.classList.add('technology-clone'); clone.setAttribute('aria-hidden', 'true'); clone.setAttribute('inert', '');
  track.append(clone);
  let manualPause = false, hovered = false, focused = false;
  let inView = !('IntersectionObserver' in window), frame = null, last = null, position = viewport.scrollLeft;
  const speed = 36; // Píxeles por segundo; velocidad constante e independiente del refresco.

  function canMove() { return !motion.matches && !manualPause && !hovered && !focused && !document.hidden && inView; }
  function tick(time) {
    frame = null;
    if (!canMove()) { last = null; return; }
    if (last !== null && first.offsetWidth > 0) {
      const distance = first.offsetWidth;
      const delta = Math.max(0, time - last) / 1000 * speed;
      // Conservar fracciones: scrollLeft se redondea en algunos navegadores.
      position = (position + delta) % distance;
      viewport.scrollLeft = position;
    }
    last = time;
    frame = window.requestAnimationFrame(tick);
  }
  function refresh() {
    toggle.hidden = motion.matches;
    clone.hidden = motion.matches;
    toggle.setAttribute('aria-pressed', String(manualPause));
    toggle.querySelector('[data-motion-label]').textContent = manualPause ? 'Reanudar movimiento' : 'Pausar movimiento';
    toggle.querySelector('[data-motion-icon]').textContent = manualPause ? '▷' : 'Ⅱ';
    section.dataset.motion = motion.matches ? 'reduced' : canMove() ? 'playing' : 'paused';
    if (!canMove()) {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = null; last = null;
    } else if (frame === null) { position = viewport.scrollLeft; frame = window.requestAnimationFrame(tick); }
  }
  toggle.addEventListener('click', () => { manualPause = !manualPause; refresh(); });
  viewport.addEventListener('mouseenter', () => { hovered = true; refresh(); });
  viewport.addEventListener('mouseleave', () => { hovered = false; refresh(); });
  viewport.addEventListener('focusin', () => { focused = true; refresh(); });
  viewport.addEventListener('focusout', event => { if (!viewport.contains(event.relatedTarget)) { focused = false; refresh(); } });
  viewport.addEventListener('keydown', event => { if (['ArrowLeft','ArrowRight','Home','End','PageUp','PageDown',' '].includes(event.key)) { manualPause = true; refresh(); } });
  viewport.addEventListener('wheel', () => { manualPause = true; refresh(); }, {passive:true});
  viewport.addEventListener('pointerdown', event => { if (event.pointerType !== 'mouse') { manualPause = true; refresh(); } });
  document.addEventListener('visibilitychange', refresh);
  motion.addEventListener('change', refresh);
  if ('IntersectionObserver' in window) {
    const observer = new window.IntersectionObserver(entries => { inView = entries.some(entry => entry.isIntersecting); refresh(); }, {threshold:0.05});
    observer.observe(section);
  }
  refresh();
})();
