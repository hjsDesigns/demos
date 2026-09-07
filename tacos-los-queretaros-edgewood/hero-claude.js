/* ============================================================
   TACOS LOS QUERETAROS — hero heat shimmer.
   One deterministic pass: the air over a comal wobbling the mark,
   settling to nothing by 2.66s. No libraries, fixed noise seed,
   time-driven (not frame-driven) so every replay is identical.
   Pauses while the tab is hidden; reduced motion lands on frame 1.
   ============================================================ */
(function () {
  var hero  = document.getElementById('hero');
  var disp  = document.getElementById('tlqHeatDisp');
  var noise = document.getElementById('tlqHeatNoise');
  if (!hero || !disp || !noise) return;

  var DELAY = 260;    // ms — the mark starts rising at .30s
  var DUR   = 2400;   // ms — shimmer fully settled at 2.66s
  var AMP   = 24;     // px of displacement at full heat
  var FY0   = 0.024, FY1 = 0.040;   // the noise gets finer as it cools
  var FX    = 0.010;

  function settle() {
    disp.setAttribute('scale', '0');
    noise.setAttribute('baseFrequency', FX + ' ' + FY1);
    hero.classList.remove('is-hot');
  }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { settle(); return; }

  hero.classList.add('is-hot');

  var elapsed = 0, last = null, raf = 0;

  function frame(now) {
    if (last === null) last = now;
    elapsed += Math.min(now - last, 48);
    last = now;

    var t = (elapsed - DELAY) / DUR;
    if (t < 0) t = 0;
    if (t >= 1) { raf = 0; settle(); return; }

    var decay = Math.pow(1 - t, 2.1);          // heat falls off, never snaps
    disp.setAttribute('scale', (AMP * decay).toFixed(2));
    noise.setAttribute('baseFrequency', FX + ' ' + (FY0 + (FY1 - FY0) * t).toFixed(4));

    raf = requestAnimationFrame(frame);
  }

  raf = requestAnimationFrame(frame);

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
    } else if (elapsed < DELAY + DUR && !raf) {
      last = null;
      raf = requestAnimationFrame(frame);
    }
  });
})();
