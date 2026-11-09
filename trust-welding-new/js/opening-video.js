/* Trust Welding · the filmed opening (Hayden 11/7, draft C).
   From inside the hood: two strikes on the top of the T, then the hood lifts onto the hero still.
   The phone or wide cut is picked at the same 900px line the hero <picture> uses, so the last frame IS the still underneath.
   Skip, scroll, tap or a key ends it early. It never blocks: if nothing plays within 3 s (Low Power Mode, a slow line),
   the opening steps aside and the still shows. Reduced motion skips it entirely.
   Its own id keeps js/learned.js's hood opening from touching it. */
(function () {
  const op = document.getElementById('opening-video');
  if (!op) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { op.remove(); return; }
  const v = op.querySelector('video');
  const base = matchMedia('(max-width:900px)').matches ? op.dataset.srcPhone : op.dataset.srcWide;
  let done = false;
  const end = () => {
    if (done) return; done = true;
    op.classList.add('is-gone');
    setTimeout(() => { try { v.pause(); } catch (e) {} op.remove(); }, 800);
  };
  [['mp4', 'video/mp4'], ['webm', 'video/webm']].forEach(([ext, type]) => {
    const s = document.createElement('source'); s.src = base + '.' + ext; s.type = type; v.appendChild(s);
  });
  v.lastElementChild.addEventListener('error', end);
  v.addEventListener('ended', end);
  v.addEventListener('error', end);
  const guard = setTimeout(() => { if (v.currentTime < 0.05) end(); }, 3000);
  v.addEventListener('playing', () => clearTimeout(guard), { once: true });
  const p = v.play(); if (p && p.catch) p.catch(end);
  op.querySelector('.skip').addEventListener('click', end);
  ['wheel', 'touchstart', 'keydown'].forEach(ev => addEventListener(ev, end, { once: true, passive: true }));
})();
