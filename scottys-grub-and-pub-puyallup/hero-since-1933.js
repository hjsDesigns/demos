/* ============================================================
   SCOTTY'S GRUB AND PUB — hero variant 4: "since-1933"

   One job: draw the span of years under the sentence. A hairline fills
   left to right while the year riding its end counts 1933 -> 2026, both
   driven off the SAME progress value so they can never drift apart.

   Deterministic: fixed 600 ms delay, fixed 2000 ms run, fixed easing,
   no random, no loop. Accumulates only while the tab is visible, and
   parks the hero's CSS animations with it. Reduced motion lands straight
   on the final frame. No libraries.
   ============================================================ */
(function () {
  var sec = document.getElementById('hero');
  if (!sec || !sec.classList.contains('v-since-1933')) return;
  var out = document.getElementById('s33Count');
  if (!out) return;

  var FROM = 1933, TO = 2026, DELAY = 600, DUR = 2000;

  var mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mq && mq.matches) {
    sec.style.setProperty('--s33-p', '1');
    out.textContent = String(TO);
    return;
  }

  sec.style.setProperty('--s33-p', '0');
  out.textContent = String(FROM);

  var elapsed = 0, last = null, raf = 0, done = false;

  /* eased out: the year leaves 1933 straight away (so the ticker never sits
     repeating the headline) and settles onto 2026 instead of slamming into it */
  function ease(t) { return 1 - Math.pow(1 - t, 1.9); }

  function frame(now) {
    if (last === null) last = now;
    var dt = now - last;
    last = now;
    if (dt < 0) dt = 0;
    if (dt > 100) dt = 100;                /* a stalled frame never fast-forwards */
    elapsed += dt;

    var t = (elapsed - DELAY) / DUR;
    if (t < 0) t = 0;
    if (t > 1) t = 1;
    var p = ease(t);

    sec.style.setProperty('--s33-p', p.toFixed(4));
    out.textContent = String(FROM + Math.round((TO - FROM) * p));

    if (t < 1) {
      raf = requestAnimationFrame(frame);
    } else {
      raf = 0;
      done = true;
      sec.style.setProperty('--s33-p', '1');
      out.textContent = String(TO);
    }
  }

  function start() {
    if (!done && !raf) { last = null; raf = requestAnimationFrame(frame); }
  }
  function stop() {
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      sec.style.setProperty('--s33-play', 'paused');
      stop();
    } else {
      sec.style.setProperty('--s33-play', 'running');
      start();
    }
  });

  if (document.hidden) sec.style.setProperty('--s33-play', 'paused');
  else start();
})();
