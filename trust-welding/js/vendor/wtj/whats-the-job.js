/*
 * What's the job? — the counter question ("can you weld this?") turned into a tap-a-picture toy.
 * One gesture: tap the picture of what you've got → that tile lights to colour with a falling weld-spark burst,
 * the stage above/right shows the NUMBER of real jobs of that kind + those real photos + one text button.
 * Tap the same tile again → it clears back to the total. No inputs, no units, no readback sentence.
 *
 * WTJ.mount(sectionEl, {groups:[{key,label,cover,count?,noun,jobs:[{src,caption}]}], total, totalLabel, sms, smsBody(group)})
 * count defaults to jobs.length so the number can never drift from the photos shown.
 * Timing constants (keep): flash 420 ms · photo stagger 70 ms · count-up 420 ms ease-out cubic.
 * Spark (ClickSpark port, click-spark.js): streak, 16 sparks, radius 64, size 10, width 2.4, 700 ms, gravity 1.4, glow .7, randomness .6, ring.
 */
(function (global) {
  'use strict';
  var STAGGER = 70, COUNT_MS = 420;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function countUp(node, to) {
    if (reduced) { node.textContent = to; return; }
    var t0 = performance.now();
    (function step(now) {
      var p = Math.min(1, (now - t0) / COUNT_MS), e = 1 - Math.pow(1 - p, 3);
      node.textContent = Math.round(to * e);
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  function mount(root, cfg) {
    var tilesBox = root.querySelector('.wtj-tiles'), stage = root.querySelector('.wtj-stage');
    var idle = stage.querySelector('.wtj-idle'), show = stage.querySelector('.wtj-show');
    var photos = show.querySelector('.wtj-photos'), num = show.querySelector('.wtj-count b'), noun = show.querySelector('.wtj-count span');
    var text = show.querySelector('.wtj-text');
    idle.querySelector('.wtj-big').textContent = cfg.total;
    idle.querySelector('.wtj-sub').textContent = cfg.totalLabel;
    if (cfg.plate) idle.style.setProperty('--wtj-plate', 'url("' + cfg.plate + '")');
    var current = null, tiles = [];
    cfg.groups.forEach(function (g) {
      var b = el('button', 'wtj-tile');
      b.type = 'button'; b.setAttribute('aria-pressed', 'false'); b.dataset.key = g.key;
      b.innerHTML = '<img alt="" src="' + g.cover + '" loading="lazy" decoding="async"><span class="wtj-label">' + g.label + '</span>';
      b.querySelector('img').alt = g.alt || g.label;
      b.addEventListener('click', function (ev) {
        var r = b.getBoundingClientRect();
        var fx = ev.detail === 0 ? 50 : ((ev.clientX - r.left) / r.width) * 100, fy = ev.detail === 0 ? 50 : ((ev.clientY - r.top) / r.height) * 100;
        b.style.setProperty('--fx', fx + '%'); b.style.setProperty('--fy', fy + '%');
        b.classList.remove('is-struck'); void b.offsetWidth; b.classList.add('is-struck');
        pick(current === g.key ? null : g.key);
      });
      tilesBox.appendChild(b); tiles.push(b);
    });
    function pick(key) {
      current = key;
      tiles.forEach(function (t) { t.setAttribute('aria-pressed', String(t.dataset.key === key)); });
      if (!key) { stage.removeAttribute('data-on'); return; }
      var g = cfg.groups.filter(function (x) { return x.key === key; })[0];
      var n = g.count != null ? g.count : g.jobs.length;
      stage.setAttribute('data-on', key);
      photos.innerHTML = '';
      g.jobs.forEach(function (j, i) {
        var f = el('figure', 'wtj-photo');
        f.innerHTML = '<img alt="" src="' + j.src + '" decoding="async"><figcaption></figcaption>';
        f.querySelector('img').alt = j.caption; f.querySelector('img').style.objectPosition = j.pos || '50% 50%';
        f.querySelector('figcaption').textContent = j.caption;
        photos.appendChild(f);
        if (reduced) f.classList.add('in'); else setTimeout(function () { f.classList.add('in'); }, 30 + i * STAGGER);
      });
      noun.textContent = g.noun;
      countUp(num, n);
      text.href = cfg.sms + '?&body=' + encodeURIComponent(cfg.smsBody(g));
      text.textContent = cfg.button || 'Text a photo of yours';
    }
    if (global.ClickSpark) {
      global.ClickSpark.attach(tilesBox, { sparkColor: ['#FFFFFF', '#FFE3A3', '#FFB347', '#7FE3F2'], shape: 'streak', sparkCount: 16,
        sparkRadius: 64, sparkSize: 10, sparkWidth: 2.4, duration: 700, gravity: 1.4, glow: 0.7, randomness: 0.6, ring: true });
    }
    return { pick: pick, get current() { return current; } };
  }
  global.WTJ = { mount: mount };
})(window);
