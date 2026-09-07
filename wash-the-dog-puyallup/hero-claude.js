/* Wash The Dog — hero suds. Seeded, so every load draws the same bubbles.
   No libraries. Not interactive. Pauses when the tab is hidden. */
(function () {
  var hero = document.getElementById('hero');
  var field = document.getElementById('chBubbles');
  var burst = document.getElementById('chBurst');
  if (!hero || !field) return;

  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still) return;                       // CSS already holds the final frame

  // mulberry32 — fixed seed, identical output on every load
  function rng(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  var r = rng(19881115);                   // 115 W Meeker
  function between(lo, hi) { return lo + r() * (hi - lo); }
  function px(n) { return n.toFixed(1) + 'px'; }

  var frag = document.createDocumentFragment();

  // 1. the intro: suds rise out of the tubs and pop along the sign's line
  var LINE = 47;                           // % down the hero where the wordmark sits
  for (var i = 0; i < 16; i++) {
    var b = document.createElement('span');
    var d = between(9, 34);
    b.className = 'ch-bub is-rise';
    b.style.setProperty('--x', between(6, 94).toFixed(1) + '%');
    b.style.setProperty('--y', between(LINE - 7, LINE + 6).toFixed(1) + '%');
    b.style.setProperty('--d', px(d));
    b.style.setProperty('--from', px(between(210, 460)));
    b.style.setProperty('--sway', px(between(-26, 26)));
    b.style.setProperty('--t', between(1.05, 1.6).toFixed(2) + 's');
    b.style.setProperty('--delay', between(0.02, 0.5).toFixed(2) + 's');
    frag.appendChild(b);
  }

  // 2. the hold: a handful of slow ones, barely there
  for (var j = 0; j < 7; j++) {
    var s = document.createElement('span');
    var ds = between(12, 40);
    s.className = 'ch-bub is-drift';
    s.style.setProperty('--x', between(4, 96).toFixed(1) + '%');
    s.style.setProperty('--y', '104%');
    s.style.setProperty('--d', px(ds));
    s.style.setProperty('--from', px(-between(760, 1180)));
    s.style.setProperty('--sway', px(between(-46, 46)));
    s.style.setProperty('--t', between(17, 27).toFixed(1) + 's');
    s.style.setProperty('--delay', (2.9 + j * between(1.6, 3.4)).toFixed(2) + 's');
    frag.appendChild(s);
  }
  field.appendChild(frag);

  // 3. the paw logo landing throws a small ring of suds
  if (burst) {
    var ring = document.createDocumentFragment();
    for (var k = 0; k < 10; k++) {
      var a = (k / 10) * Math.PI * 2 + 0.32;
      var reach = between(46, 88);
      var p = document.createElement('span');
      p.className = 'ch-bub';
      p.style.setProperty('--d', px(between(6, 15)));
      p.style.setProperty('--bx', px(Math.cos(a) * reach * 1.25));
      p.style.setProperty('--by', px(Math.sin(a) * reach * 0.72 - 8));
      ring.appendChild(p);
    }
    burst.appendChild(ring);
  }

  document.addEventListener('visibilitychange', function () {
    hero.classList.toggle('is-paused', document.hidden);
  });
})();
