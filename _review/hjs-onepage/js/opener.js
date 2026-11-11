// HJS Designs, the opener (Hayden 10/29: "Laptop is closed and I say come on in. We click it, we open the laptop… it pulls
// you into the computer, and then it's like a computer world type thing").
//   A  the lid opens and the screen grows: Aceternity MacBook Scroll, its exact ranges (lid -28deg held to 0.12 then flat by
//      0.3; screen scaleX 1.2 -> 1.5, scaleY 0.6 -> 1.5, phones -> 1). The screen already shows the world.
//   B  into the screen: the world is the same picture, clipped to the screen and matched to it pixel for pixel, then the clip
//      opens to the whole view while the picture settles to full size; the laptop grows past the camera and fades.
//   C  you've arrived: the way to reach him rises under the name. The name never leaves.
// Scroll drives every step (nothing plays at you); "Come on in" or a tap on the laptop does the scrolling for you.
import { createMacbookScroll } from './macbook-scroll.js?v=1';

const html = document.documentElement;
if (html.classList.contains('op') && !matchMedia('(prefers-reduced-motion: reduce)').matches) start();

function start() {
  const section = document.querySelector('.opener');
  const stage = section.querySelector('.stage');
  const host = stage.querySelector('.laptop');
  const world = stage.querySelector('.world');
  const pic = world.querySelector('.world-img');
  const cue = stage.querySelector('.come-in');

  const mb = createMacbookScroll(host, { mode: 'manual', src: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=', alt: '', logo: 'HJS' });
  const screen = mb.screen, shot = screen.querySelector('.mb-img');
  const useSrc = () => { const s = pic.currentSrc || pic.src; if (s && shot.getAttribute('src') !== s) shot.src = s; };
  useSrc(); pic.addEventListener('load', () => { useSrc(); measure(); }, { once: !1 });
  window.__opReady = true;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (input, output) => p => {          // motion's useTransform, piecewise linear, clamped
    if (p <= input[0]) return output[0];
    for (let i = 1; i < input.length; i++) if (p <= input[i]) { const t = (p - input[i - 1]) / (input[i] - input[i - 1] || 1); return output[i - 1] + (output[i] - output[i - 1]) * t; }
    return output[output.length - 1];
  };
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;   // in-out cubic
  const out = t => 1 - Math.pow(1 - t, 3);
  const wide = () => matchMedia('(min-width: 900px) and (min-aspect-ratio: 1/1)').matches;

  // the original's lid + screen ranges (component progress 0..0.3)
  let sx, sy;
  const rot = lerp([0.1, 0.12, 0.3], [-28, -28, 0]);
  const setRanges = () => { const m = !wide(); sx = lerp([0, 0.3], [1.2, m ? 1 : 1.5]); sy = lerp([0, 0.3], [0.6, m ? 1 : 1.5]); };
  const screenAt = q => `scaleX(${sx(q).toFixed(4)}) scaleY(${sy(q).toFixed(4)}) rotateX(${rot(q).toFixed(3)}deg)`;

  // geometry, measured with the lid flat (end of A)
  let W = 0, H = 0, R = null, r0 = 0, m = 1, K = 1, D = 1, base = '';
  function measure() {
    setRanges();
    base = wide() ? 'translate(-50%,-50%)' : 'translate(-50%,0)';
    const keepS = screen.style.transform, keepL = host.style.transform, keepO = host.style.transformOrigin;
    host.style.transform = base; host.style.transformOrigin = '50% 0';
    screen.style.transform = screenAt(0.3);
    const st = stage.getBoundingClientRect(), r = shot.getBoundingClientRect(), hr = host.getBoundingClientRect();
    W = st.width; H = st.height;
    R = { l: r.left - st.left, t: r.top - st.top, w: r.width, h: r.height };
    R.cx = R.l + R.w / 2; R.cy = R.t + R.h / 2;
    r0 = parseFloat(getComputedStyle(shot).borderTopLeftRadius) * sx(0.3) || 8;
    host.style.transformOrigin = `${(R.cx - (hr.left - st.left)).toFixed(1)}px ${(R.cy - (hr.top - st.top)).toFixed(1)}px`;
    const iw = pic.naturalWidth || 16, ih = pic.naturalHeight || 9;
    const Sv = Math.max(W / iw, H / ih), Sr = Math.max(R.w / iw, R.h / ih);
    m = Sr / Sv;                                    // how much smaller the world is when it is still inside the screen
    K = Math.max(W / R.w, H / R.h) * 1.12;          // how far the laptop grows past the camera
    D = Math.max(1, section.offsetHeight - stage.offsetHeight);
    stage.style.setProperty('--lap-h', host.offsetHeight + 'px');
    screen.style.transform = keepS; host.style.transform = keepL || base;
    last = -1; frame();
  }

  // one scroll position -> every piece
  let last = -1;
  function frame() {
    raf = 0;
    const p = clamp(-section.getBoundingClientRect().top / D);
    if (p === last) return; last = p;
    const a = clamp(p / 0.34), b = clamp((p - 0.34) / 0.46), c = clamp((p - 0.8) / 0.16);
    const eb = ease(b);

    // A: the lid
    screen.style.transform = screenAt(a * 0.3);

    // B: the laptop goes past the camera
    const k = 1 + (K - 1) * eb * eb;
    host.style.transform = `${base} scale(${k.toFixed(4)})`;
    host.style.opacity = (1 - clamp(eb * 1.7)).toFixed(3);
    host.style.visibility = b >= 1 ? 'hidden' : 'visible';

    // B: the world opens out of the screen
    if (b <= 0) world.style.clipPath = 'inset(50% 50% 50% 50%)';
    else {
      const f = 1 - eb, rad = (r0 * f).toFixed(1);
      world.style.clipPath = `inset(${(R.t * f).toFixed(1)}px ${((W - R.l - R.w) * f).toFixed(1)}px ${((H - R.t - R.h) * f).toFixed(1)}px ${(R.l * f).toFixed(1)}px round ${rad}px)`;
    }
    const sEnd = 1.05, s = b < 1 ? m + (sEnd - m) * eb : sEnd - (sEnd - 1) * out(c);
    const tx = (R.cx - W / 2) * (1 - eb), ty = (R.cy - H / 2) * (1 - eb);
    pic.style.transform = `translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px) scale(${s.toFixed(4)})`;

    // the rest: cue goes, shade comes with the world, the actions arrive
    stage.style.setProperty('--a', a.toFixed(3));
    stage.style.setProperty('--b', eb.toFixed(3));
    stage.style.setProperty('--c', out(c).toFixed(3));
    stage.style.setProperty('--cv', c > 0 ? 'visible' : 'hidden');
    stage.style.setProperty('--pe', a > 0.2 ? 'none' : 'auto');
  }
  let raf = 0;
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(frame); };
  addEventListener('scroll', onScroll, { passive: true });
  let rz = 0; addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(measure); });
  if (document.fonts) document.fonts.ready.then(measure);
  measure();

  // "Come on in": the scroll does the walking, about two seconds, and any touch or wheel hands it back
  let walking = 0;
  const walk = () => {
    const from = scrollY, to = section.offsetTop + D * 0.92, dur = 2200, t0 = performance.now();
    if (to <= from) return;
    const stop = () => { cancelAnimationFrame(walking); walking = 0; ['wheel', 'touchstart', 'keydown'].forEach(e => removeEventListener(e, stop)); };
    ['wheel', 'touchstart', 'keydown'].forEach(e => addEventListener(e, stop, { passive: true }));
    const step = now => { const t = clamp((now - t0) / dur); scrollTo(0, from + (to - from) * ease(t)); walking = t < 1 ? requestAnimationFrame(step) : (stop(), 0); };
    walking = requestAnimationFrame(step);
  };
  cue.addEventListener('click', walk);
  host.addEventListener('click', () => { if (last < 0.2) walk(); });
}
