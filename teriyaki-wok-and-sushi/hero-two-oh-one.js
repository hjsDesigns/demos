/* Hero variant "two-oh-one" — the count.
   Deterministic: fixed 2000 ms ease-out from 0 to 201, no randomness.
   Starts 180 ms in (with the numeral's rise), pauses while the tab is
   hidden and resumes where it left off, and lands on the final frame
   immediately under prefers-reduced-motion. */
(function () {
  var el = document.getElementById('v201Num');
  if (!el) return;

  var TARGET = 201;      // facts.json _sourced_facts.items_on_menu
  var DUR = 2000;        // two seconds
  var DELAY = 180;

  function land() { el.textContent = String(TARGET); }

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    land();
    return;
  }

  var hero = el.closest ? el.closest('.hero') : null;
  if (hero) hero.classList.add('v201-hold');

  var elapsed = 0;
  var last = null;
  var done = false;

  /* gentle ease-out — the digits stay readable across the whole two
     seconds instead of racing to 201 in the first third. */
  function ease(t) { return 1 - Math.pow(1 - t, 1.7); }

  function frame(now) {
    if (done) return;
    if (last === null) last = now;
    var dt = now - last;
    last = now;
    if (dt > 100) dt = 100;              // tab was away — don't jump
    elapsed += dt;
    var t = (elapsed - DELAY) / DUR;
    if (t < 0) t = 0;
    if (t >= 1) {
      done = true;
      land();
      return;
    }
    el.textContent = String(Math.round(ease(t) * TARGET));
    requestAnimationFrame(frame);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      last = null;
    } else if (!done) {
      last = null;
      requestAnimationFrame(frame);
    }
  });

  /* start once the hero ground and the sign mark are actually up, so the
     count is never half-run behind a blank frame. */
  function start() {
    if (hero) { hero.classList.remove('v201-hold'); hero.classList.add('v201-go'); }
    requestAnimationFrame(frame);
  }
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
})();
