/* count-413 — the one event.
   Runs the real Google rating count 0 -> 413 over 1.8s after a 200ms beat,
   deterministic (ease-out cubic, no randomness) and always landing exactly
   on 413. Adds .c413-go to the section so the CSS timeline starts at the
   same instant. Reduced motion / hidden tab -> straight to the final frame. */
(function () {
  var hero = document.getElementById('hero');
  if (!hero || !hero.classList.contains('v-count-413')) return;

  var live = hero.querySelector('.c413-live');
  if (!live) return;

  var TARGET = 413, DUR = 1800, DELAY = 200;

  function land() {
    live.textContent = String(TARGET);
    hero.classList.add('c413-still');
  }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  if (reduce || document.hidden) { hero.classList.add('c413-go'); land(); return; }

  live.textContent = '0';
  hero.classList.add('c413-go');

  var start = null, done = false;
  function ease(t) { var u = 1 - t; return 1 - u * u * u; }

  function step(ts) {
    if (done) return;
    if (start === null) start = ts;
    var e = ts - start - DELAY;
    if (e <= 0) { requestAnimationFrame(step); return; }
    var t = e / DUR; if (t > 1) t = 1;
    live.textContent = String(Math.round(ease(t) * TARGET));
    if (t < 1) requestAnimationFrame(step);
    else { done = true; land(); }
  }
  requestAnimationFrame(step);

  /* safety: a backgrounded tab starves rAF — never leave the number short */
  setTimeout(function () { if (!done) { done = true; land(); } }, DELAY + DUR + 600);
})();
