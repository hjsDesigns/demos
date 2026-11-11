/* HJS Designs, one page: the header, the ribbon, the entrances and the house that builds itself as you scroll. */
(() => {
  window.__pageReady = true;
  const html = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  // header: the small name and a backing appear once the opener is behind you
  const header = document.getElementById('header'), opener = document.querySelector('.opener');
  const solid = () => header.classList.toggle('solid', opener.getBoundingClientRect().bottom <= header.offsetHeight + 1);
  addEventListener('scroll', solid, { passive: true }); addEventListener('resize', solid); solid();

  // ribbon: a second copy for a seamless loop, 40 px a second (the saved review-ribbon pace); hover or touch holds it
  const ribbon = document.querySelector('.ribbon');
  if (ribbon && !reduce) {
    const track = ribbon.querySelector('.ribbon-track'), list = track.querySelector('.ribbon-list');
    const copy = list.cloneNode(true); copy.setAttribute('aria-hidden', 'true'); track.append(copy);
    const pace = () => track.style.setProperty('--dur', (list.scrollWidth / 40).toFixed(1) + 's');
    pace(); addEventListener('resize', pace); if (document.fonts) document.fonts.ready.then(pace);
    let t = 0;
    ribbon.addEventListener('touchstart', () => { clearTimeout(t); ribbon.classList.add('hold'); }, { passive: true });
    ribbon.addEventListener('touchend', () => { t = setTimeout(() => ribbon.classList.remove('hold'), 1200); }, { passive: true });
  }

  // entrances: once, words only, a short stagger between siblings
  const items = [...document.querySelectorAll('.reveal')];
  items.forEach(el => { const sib = [...el.parentElement.children].filter(c => c.classList.contains('reveal')); el.style.setProperty('--i', sib.indexOf(el)); });
  if (reduce || !('IntersectionObserver' in window)) items.forEach(el => el.classList.add('in'));
  else {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    items.forEach(el => io.observe(el));
  }

  // the sample: a canvas draws the frame that matches the scroll; frames load every 8th first, then fill in
  const film = document.getElementById('film');
  if (!film || reduce) return;
  const N = 124, starts = [0, 25, 50, 74, 98];
  const src = i => `media/house/h-${String(i + 1).padStart(3, '0')}.webp`;
  const canvas = film.querySelector('.film-canvas'), frameBox = film.querySelector('.film-frame'), ctx = canvas.getContext('2d');
  const steps = [...film.querySelectorAll('.film-steps li')];
  html.classList.add('fs');
  const imgs = new Array(N), ok = new Uint8Array(N), order = [], have = new Set();
  [8, 4, 2, 1].forEach(s => { for (let i = 0; i < N; i += s) if (!have.has(i)) { have.add(i); order.push(i); } });
  if (!have.has(N - 1)) order.splice(1, 0, N - 1);
  let want = 0, drawn = -1, cw = 0, ch = 0;
  const nearest = i => { for (let k = 0; k < N; k++) { if (ok[i - k]) return i - k; if (ok[i + k]) return i + k; } return -1; };
  const draw = () => {
    const i = nearest(want); if (i < 0 || i === drawn) return;
    const im = imgs[i], s = Math.max(cw / im.naturalWidth, ch / im.naturalHeight), w = im.naturalWidth * s, h = im.naturalHeight * s;
    ctx.drawImage(im, (cw - w) / 2, (ch - h) / 2, w, h); drawn = i; film.classList.add('ready');
  };
  const fit = () => { const r = frameBox.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
    cw = canvas.width = Math.round(r.width * d); ch = canvas.height = Math.round(r.height * d); drawn = -1; draw(); };
  let q = 0, started = false;
  const next = () => { if (q >= order.length) return; const i = order[q++], im = new Image(); im.decoding = 'async';
    im.onload = () => { imgs[i] = im; ok[i] = 1; if (Math.abs(i - want) <= 8 || drawn < 0) draw(); next(); };
    im.onerror = next; im.src = src(i); };
  const begin = () => { if (started) return; started = true; for (let k = 0; k < 4; k++) next(); };
  new IntersectionObserver((es, o) => { if (es.some(e => e.isIntersecting)) { begin(); o.disconnect(); } }, { rootMargin: '1400px 0px' }).observe(film);

  let cur = -1, raf = 0;
  const update = () => {
    raf = 0;
    const r = film.getBoundingClientRect(), stage = film.firstElementChild, travel = Math.max(1, r.height - stage.offsetHeight);
    const p = clamp((header.offsetHeight - r.top) / travel), t = clamp((p - 0.03) / 0.94);
    want = Math.round(t * (N - 1)); draw();
    let s = 0; starts.forEach((st, j) => { if (want >= st) s = j; });
    if (s !== cur) { cur = s; steps.forEach((li, j) => li.classList.toggle('on', j === s)); }
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  addEventListener('resize', () => { fit(); update(); });
  fit(); update();
})();
