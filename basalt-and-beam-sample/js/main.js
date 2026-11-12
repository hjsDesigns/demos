/* Basalt & Beam (HJS Designs sample). Four small pieces:
   1. the hero's one event: the lights come on (a crossfade between two locked stills), then still;
   2. the film: a canvas draws the frame that matches the scroll (frames load every 8th first, then fill in);
   3. the chapter words: step-state (vendor/effects/scroll/step-state-story), driven by the same scroll;
   4. the rooms: tap a finish, the photo swaps; tap it again for the before. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1 · hero: lights on, once
  const hero = document.querySelector('.hero'), lit = hero.querySelector('.hero-on');
  const light = () => hero.classList.add('lit');
  if (reduce) light();
  else {
    const go = () => setTimeout(light, 500);
    lit.complete && lit.naturalWidth ? go() : lit.addEventListener('load', go, { once: true });
    setTimeout(light, 4500);                                   // never leave the lights off
  }

  // 4 · rooms (before the film so they work even where the film is skipped)
  document.querySelectorAll('[data-chooser], [data-toggle]').forEach(view => {
    const pics = [...view.querySelectorAll('.room-img')], tag = view.querySelector('.room-tag'), chips = [...view.querySelectorAll('.chip')];
    const base = tag.textContent; let cur = '';
    const show = key => {
      pics.forEach(im => im.classList.toggle('is-on', im.dataset.key === key));
      chips.forEach(c => { const on = c.dataset.key === key; c.setAttribute('aria-pressed', on);
        if (c.dataset.on) c.textContent = on ? c.dataset.on : c.dataset.off; });
      const c = chips.find(c => c.dataset.key === key); tag.textContent = c ? c.dataset.label : base;
    };
    chips.forEach(c => c.addEventListener('click', () => { cur = cur === c.dataset.key ? '' : c.dataset.key; show(cur); }));
    // warm the hidden photos before anyone can tap, so the first tap is instant (iOS lazy-load stall, Trust Welding 11/9)
    new IntersectionObserver((es, o) => { if (es.some(e => e.isIntersecting)) { pics.forEach(im => { im.loading = 'eager'; }); o.disconnect(); } },
      { rootMargin: '700px 0px' }).observe(view);
  });

  // quote form: a sample, so it says so instead of sending
  const form = document.querySelector('.contact-form'), done = document.querySelector('.form-success');
  form.addEventListener('submit', e => { e.preventDefault(); if (!form.reportValidity()) return; form.hidden = true; done.hidden = false; });

  const steps = document.querySelector('.steps');
  if (steps) new IntersectionObserver((es, o) => { if (es.some(e => e.isIntersecting)) { steps.classList.add('lit'); o.disconnect(); } }, { threshold: 0.4 }).observe(steps);
  if (reduce || !window.gsap || !window.ScrollTrigger || !window.FRAMES) return;   // reduced motion: the static stage list shows instead
  gsap.registerPlugin(ScrollTrigger);

  // 2 · the film
  const F = window.FRAMES, N = F.count;
  const canvas = document.getElementById('film'), panel = canvas.parentElement, ctx = canvas.getContext('2d');
  const imgs = new Array(N), ok = new Uint8Array(N);
  const src = i => F.path + String(i + 1).padStart(F.pad, '0') + F.ext;
  const order = [], have = new Set();
  const conn = navigator.connection || {}, lite = !!conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');
  (lite ? [8] : [8, 4, 2, 1]).forEach(s => { for (let i = 0; i < N; i += s) if (!have.has(i)) { have.add(i); order.push(i); } });
  if (!have.has(N - 1)) order.splice(1, 0, N - 1);               // the last frame early: it's where the story lands
  let want = 0, drawn = -1, cw = 0, ch = 0;
  const nearest = i => { for (let k = 0; k < N; k++) { if (ok[i - k]) return i - k; if (ok[i + k]) return i + k; } return -1; };
  const draw = () => {
    const i = nearest(want); if (i < 0 || i === drawn) return;
    const im = imgs[i], s = Math.max(cw / im.naturalWidth, ch / im.naturalHeight), w = im.naturalWidth * s, h = im.naturalHeight * s;
    ctx.drawImage(im, (cw - w) / 2, (ch - h) / 2, w, h); drawn = i; panel.classList.add('ready');
  };
  const fit = () => { const r = panel.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
    cw = canvas.width = Math.round(r.width * d); ch = canvas.height = Math.round(r.height * d); drawn = -1; draw(); };
  let q = 0, started = false;
  const next = () => { if (q >= order.length) return; const i = order[q++], im = new Image(); im.decoding = 'async';
    im.onload = () => { imgs[i] = im; ok[i] = 1; if (Math.abs(i - want) <= 10 || drawn < 0) draw(); next(); };
    im.onerror = next; im.src = src(i); };
  const start = () => { if (started) return; started = true; for (let k = 0; k < 6; k++) next(); };
  new IntersectionObserver((es, o) => { if (es.some(e => e.isIntersecting)) { start(); o.disconnect(); } }, { rootMargin: '1200px 0px' }).observe(panel);
  addEventListener('load', () => setTimeout(start, 1200), { once: true });
  addEventListener('resize', fit); fit();

  // 3 · one scroll drives both the frame and the words
  const head = document.querySelector('.site-header').offsetHeight;
  const S = [...document.querySelectorAll('.film-words .sec')], n = S.length;
  S.forEach(s => s.querySelectorAll('h3, p:not(.eyebrow)').forEach(el => {     // step-state words, split once
    const text = el.textContent; el.textContent = '';
    text.split(/(\s+)/).forEach(t => { if (!t) return; if (/^\s+$/.test(t)) { el.append(' '); return; }
      const w = document.createElement('span'); w.className = 'w'; w.textContent = t; el.append(w); });
  }));
  const delays = () => S.forEach(s => { const W = s.offsetWidth || 1;
    s.querySelectorAll('.w').forEach(w => w.style.setProperty('--d', ((1 - (w.offsetLeft + w.offsetWidth / 2) / W) * 0.567).toFixed(3) + 's')); });
  delays(); addEventListener('resize', delays); if (document.fonts) document.fonts.ready.then(delays);
  let cur = 0; S[0].classList.add('is-on');
  ScrollTrigger.create({
    trigger: '.film-track', start: 'top ' + head + 'px', end: 'bottom bottom',
    onUpdate: self => {
      const p = self.progress, t = Math.min(1, Math.max(0, (p - 0.02) / 0.96));
      want = Math.round(t * (N - 1)); requestAnimationFrame(draw);
      const i = Math.min(n - 1, Math.floor(p * n)), o = p === 1 ? 1 : p * n - i;
      if (i !== cur) { cur = i; S.forEach((s, j) => s.classList.toggle('is-on', j === i)); }
      S[i].style.setProperty('--o', o.toFixed(4));
    }
  });
})();
