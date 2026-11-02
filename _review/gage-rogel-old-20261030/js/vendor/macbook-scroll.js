// Aceternity UI "MacBook Scroll" (macbook-scroll.tsx), ported to plain JS for Gage's site (2026-10-29).
// The original (React + motion + @tabler/icons-react) sits beside this file, unchanged. Everything you see is the original:
// the same markup and Tailwind values (sizes in rem, so 1 rem here = the host's var(--mb), default 16px), the same colours, the keyboard
// key for key (including its two "F8" keys), the backlit white key glow, the speaker grids, the trackpad, the Tabler icons
// (their real SVG paths, MIT) and the exact motion ranges:
//   screen scaleX 1.2 -> 1.5 and scaleY 0.6 -> 1.5 over progress 0-0.3 (phones: -> 1), lid rotateX -28deg held to 0.12 then
//   -> 0 by 0.3, screen translateY 0 -> 1500px over 0-1, title down 0 -> 100px over 0-0.3 and faded 1 -> 0 over 0-0.2,
//   lid back perspective(800px) rotateX(-25deg); transforms composed in motion's order (translate, scale, rotate).
// What is different: React state is plain DOM; useScroll is either the same "start start" -> "end start" page-scroll reading
// (mode 'scroll') or progress the page sets itself with setProgress(p) (mode 'manual', for Gage's 3D room where the camera,
// not the page, moves). The lid's Aceternity mark is a slot (logo) for the client's own mark, and the screen exposes its box
// so a page can put a video or a play button on it.
// Licence (ui.aceternity.com/licence): use inside end products for us or clients; never redistribute this source.

const ICONS = {
  "brightness_down": [0, "<path d=\"M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0\" /><path d=\"M12 5l0 .01\" /><path d=\"M17 7l0 .01\" /><path d=\"M19 12l0 .01\" /><path d=\"M17 17l0 .01\" /><path d=\"M12 19l0 .01\" /><path d=\"M7 17l0 .01\" /><path d=\"M5 12l0 .01\" /><path d=\"M7 7l0 .01\" />"],
  "brightness_up": [0, "<path d=\"M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0\" /><path d=\"M12 5l0 -2\" /><path d=\"M17 7l1.4 -1.4\" /><path d=\"M19 12l2 0\" /><path d=\"M17 17l1.4 1.4\" /><path d=\"M12 19l0 2\" /><path d=\"M7 17l-1.4 1.4\" /><path d=\"M6 12l-2 0\" /><path d=\"M7 7l-1.4 -1.4\" />"],
  "caret_downF": [1, "<path d=\"M18 9c.852 0 1.297 .986 .783 1.623l-.076 .084l-6 6a1 1 0 0 1 -1.32 .083l-.094 -.083l-6 -6l-.083 -.094l-.054 -.077l-.054 -.096l-.017 -.036l-.027 -.067l-.032 -.108l-.01 -.053l-.01 -.06l-.004 -.057v-.118l.005 -.058l.009 -.06l.01 -.052l.032 -.108l.027 -.067l.07 -.132l.065 -.09l.073 -.081l.094 -.083l.077 -.054l.096 -.054l.036 -.017l.067 -.027l.108 -.032l.053 -.01l.06 -.01l.057 -.004l12.059 -.002z\" />"],
  "caret_leftF": [1, "<path d=\"M13.883 5.007l.058 -.005h.118l.058 .005l.06 .009l.052 .01l.108 .032l.067 .027l.132 .07l.09 .065l.081 .073l.083 .094l.054 .077l.054 .096l.017 .036l.027 .067l.032 .108l.01 .053l.01 .06l.004 .057l.002 .059v12c0 .852 -.986 1.297 -1.623 .783l-.084 -.076l-6 -6a1 1 0 0 1 -.083 -1.32l.083 -.094l6 -6l.094 -.083l.077 -.054l.096 -.054l.036 -.017l.067 -.027l.108 -.032l.053 -.01l.06 -.01z\" />"],
  "caret_rightF": [1, "<path d=\"M9 6c0 -.852 .986 -1.297 1.623 -.783l.084 .076l6 6a1 1 0 0 1 .083 1.32l-.083 .094l-6 6l-.094 .083l-.077 .054l-.096 .054l-.036 .017l-.067 .027l-.108 .032l-.053 .01l-.06 .01l-.057 .004l-.059 .002l-.059 -.002l-.058 -.005l-.06 -.009l-.052 -.01l-.108 -.032l-.067 -.027l-.132 -.07l-.09 -.065l-.081 -.073l-.083 -.094l-.054 -.077l-.054 -.096l-.017 -.036l-.027 -.067l-.032 -.108l-.01 -.053l-.01 -.06l-.004 -.057l-.002 -12.059z\" />"],
  "caret_upF": [1, "<path d=\"M11.293 7.293a1 1 0 0 1 1.32 -.083l.094 .083l6 6l.083 .094l.054 .077l.054 .096l.017 .036l.027 .067l.032 .108l.01 .053l.01 .06l.004 .057l.002 .059l-.002 .059l-.005 .058l-.009 .06l-.01 .052l-.032 .108l-.027 .067l-.07 .132l-.065 .09l-.073 .081l-.094 .083l-.077 .054l-.096 .054l-.036 .017l-.067 .027l-.108 .032l-.053 .01l-.06 .01l-.057 .004l-.059 .002h-12c-.852 0 -1.297 -.986 -.783 -1.623l.076 -.084l6 -6z\" />"],
  "chevron_up": [0, "<path d=\"M6 15l6 -6l6 6\" />"],
  "command": [0, "<path d=\"M7 9a2 2 0 1 1 2 -2v10a2 2 0 1 1 -2 -2h10a2 2 0 1 1 -2 2v-10a2 2 0 1 1 2 2h-10\" />"],
  "microphone": [0, "<path d=\"M9 2m0 3a3 3 0 0 1 3 -3h0a3 3 0 0 1 3 3v5a3 3 0 0 1 -3 3h0a3 3 0 0 1 -3 -3z\" /><path d=\"M5 10a7 7 0 0 0 14 0\" /><path d=\"M8 21l8 0\" /><path d=\"M12 17l0 4\" />"],
  "moon": [0, "<path d=\"M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z\" />"],
  "player_skip_forward": [0, "<path d=\"M4 5v14l12 -7z\" /><path d=\"M20 5l0 14\" />"],
  "player_track_next": [0, "<path d=\"M3 5v14l8 -7z\" /><path d=\"M14 5v14l8 -7z\" />"],
  "player_track_prev": [0, "<path d=\"M21 5v14l-8 -7z\" /><path d=\"M10 5v14l-8 -7z\" />"],
  "search": [0, "<path d=\"M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0\" /><path d=\"M21 21l-6 -6\" />"],
  "table": [0, "<path d=\"M3 5a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14z\" /><path d=\"M3 10h18\" /><path d=\"M10 3v18\" />"],
  "volume_2": [0, "<path d=\"M15 8a5 5 0 0 1 0 8\" /><path d=\"M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a.8 .8 0 0 1 1.5 .5v14a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5\" />"],
  "volume_3": [0, "<path d=\"M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a.8 .8 0 0 1 1.5 .5v14a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5\" /><path d=\"M16 10l4 4m0 -4l-4 4\" />"],
  "volume": [0, "<path d=\"M15 8a5 5 0 0 1 0 8\" /><path d=\"M17.7 5a9 9 0 0 1 0 14\" /><path d=\"M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a.8 .8 0 0 1 1.5 .5v14a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5\" />"],
  "world": [0, "<path d=\"M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0\" /><path d=\"M3.6 9h16.8\" /><path d=\"M3.6 15h16.8\" /><path d=\"M11.5 3a17 17 0 0 0 0 18\" /><path d=\"M12.5 3a17 17 0 0 1 0 18\" />"],
};
const icon = name => {
  const [filled, paths] = ICONS[name];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${filled ? 'currentColor' : 'none'}"${filled ? '' : ' stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'} class="mb-ico">${paths}</svg>`;
};
const OPTION_KEY = '<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" class="mb-ico"><rect stroke="currentColor" stroke-width="2" x="18" y="5" width="10" height="2"/><polygon stroke="currentColor" stroke-width="2" points="10.6,5 4,5 4,7 9.4,7 18.4,27 28,27 28,25 19.6,25 "/><rect width="32" height="32" stroke="none"/></svg>';
const ACETERNITY_MARK = '<svg width="66" height="65" viewBox="0 0 66 65" fill="none" xmlns="http://www.w3.org/2000/svg" class="mb-mark"><path d="M8 8.05571C8 8.05571 54.9009 18.1782 57.8687 30.062C60.8365 41.9458 9.05432 57.4696 9.05432 57.4696" stroke="currentColor" stroke-width="15" stroke-miterlimit="3.86874" stroke-linecap="round"/></svg>';

// KBtn: [inner classes, children classes, children html]
const two = (a, b, first) => `<span class="mb-b${first ? ' mb-mt1' : ''}">${a}</span><span class="mb-b">${b}</span>`;
const one = a => `<span class="mb-b">${a}</span>`;
const fkey = (ic, label) => `${icon(ic)}<span class="mb-mt1 mb-ib">${label}</span>`;
const mod = (top, bottom, topStart) => `<div class="mb-row-w ${topStart ? 'mb-js mb-pl1' : 'mb-je mb-pr1'}">${top}</div><div class="mb-row-w mb-js mb-pl1">${bottom}</div>`;
const L = ['mb-w10 mb-ie mb-js mb-pb2 mb-pl4', 'mb-is'];   // a wide key labelled bottom-left
const R = ['mb-w10 mb-ie mb-je mb-pr4 mb-pb2', 'mb-ie'];   // a wide key labelled bottom-right
const MOD = 'mb-hfull mb-jb mb-py4';
const ROWS = [
  [[L[0], L[1], 'esc'], ['', '', fkey('brightness_down', 'F1')], ['', '', fkey('brightness_up', 'F2')], ['', '', fkey('table', 'F3')],
   ['', '', fkey('search', 'F4')], ['', '', fkey('microphone', 'F5')], ['', '', fkey('moon', 'F6')], ['', '', fkey('player_track_prev', 'F7')],
   ['', '', fkey('player_skip_forward', 'F8')], ['', '', fkey('player_track_next', 'F8')], ['', '', fkey('volume_3', 'F10')],
   ['', '', fkey('volume_2', 'F11')], ['', '', fkey('volume', 'F12')], ['', '', '<div class="mb-power"><div></div></div>']],
  [['', '', two('~', '`', true)], ...[['!', 1], ['@', 2], ['#', 3], ['$', 4], ['%', 5], ['^', 6], ['&amp;', 7], ['*', 8], ['(', 9], [')', 0], ['&mdash;', '_'], ['+', ' = ']].map(([a, b]) => ['', '', two(a, b)]),
   [R[0], R[1], 'delete']],
  [[L[0], L[1], 'tab'], ...'QWERTYUIOP'.split('').map(c => ['', '', one(c)]), ['', '', two('{', '[')], ['', '', two('}', ']')], ['', '', two('|', '\\')]],
  [['mb-w28 mb-ie mb-js mb-pb2 mb-pl4', 'mb-is', 'caps lock'], ...'ASDFGHJKL'.split('').map(c => ['', '', one(c)]), ['', '', two(':', ';')], ['', '', two('"', "'")],
   ['mb-w285 mb-ie mb-je mb-pr4 mb-pb2', 'mb-ie', 'return']],
  [['mb-w365 mb-ie mb-js mb-pb2 mb-pl4', 'mb-is', 'shift'], ...'ZXCVBNM'.split('').map(c => ['', '', one(c)]), ['', '', two('&lt;', ',')], ['', '', two('&gt;', '.')], ['', '', two('?', '/')],
   ['mb-w365 mb-ie mb-je mb-pr4 mb-pb2', 'mb-ie', 'shift']],
  [['', MOD, mod(one('fn'), icon('world'))], ['', MOD, mod(icon('chevron_up'), one('control'))], ['', MOD, mod(OPTION_KEY, one('option'))],
   ['mb-w8', MOD, mod(icon('command'), one('command'))], ['mb-w82', '', ''], ['mb-w8', MOD, mod(icon('command'), one('command'), true)],
   ['', MOD, mod(OPTION_KEY, one('option'), true)], 'ARROWS']
];
const kbtn = (cls, kids, html) => `<div class="mb-k"><div class="mb-ki ${cls}"><div class="mb-kc ${kids}">${html}</div></div></div>`;
const ARROWS = `<div class="mb-arrows">${kbtn('mb-h3 mb-w6', '', icon('caret_upF'))}<div class="mb-flex">${kbtn('mb-h3 mb-w6', '', icon('caret_leftF'))}${kbtn('mb-h3 mb-w6', '', icon('caret_downF'))}${kbtn('mb-h3 mb-w6', '', icon('caret_rightF'))}</div></div>`;
const keypad = () => `<div class="mb-keypad">${ROWS.map(row => `<div class="mb-krow">${row.map(k => k === 'ARROWS' ? ARROWS : kbtn(k[0], k[1], k[2])).join('')}</div>`).join('')}</div>`;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (input, output) => p => {   // motion's useTransform with clamping, piecewise linear
  if (p <= input[0]) return output[0];
  for (let i = 1; i < input.length; i++) if (p <= input[i]) { const t = (p - input[i - 1]) / (input[i] - input[i - 1] || 1); return output[i - 1] + (output[i] - output[i - 1]) * t; }
  return output[output.length - 1];
};

export function createMacbookScroll(host, opts = {}) {
  const o = { src: '', alt: 'aceternity logo', title: null, badge: null, showGradient: false, logo: null, mode: 'manual', mobile: null, ...opts };
  const isMobile = o.mobile ?? (window.innerWidth < 768);
  const scaleX = lerp([0, 0.3], [1.2, isMobile ? 1 : 1.5]);
  const scaleY = lerp([0, 0.3], [0.6, isMobile ? 1 : 1.5]);
  const translate = lerp([0, 1], [0, 1500]);
  const rotate = lerp([0.1, 0.12, 0.3], [-28, -28, 0]);
  const textTransform = lerp([0, 0.3], [0, 100]);
  const textOpacity = lerp([0, 0.2], [1, 0]);

  const root = document.createElement('div');
  root.className = 'mb-root' + (o.mode === 'scroll' ? ' mb-root--scroll' : '');
  root.innerHTML = `${o.title !== null ? `<h2 class="mb-title"></h2>` : ''}
    <div class="mb-lid">
      <div class="mb-lid-back"><div class="mb-lid-face"><span class="mb-logo"></span></div></div>
      <div class="mb-screen"><div class="mb-screen-bg"></div>${o.src ? `<img class="mb-img" alt="">` : ''}</div>
    </div>
    <div class="mb-base">
      <div class="mb-bar"><div></div></div>
      <div class="mb-mid"><div class="mb-side"><div class="mb-grid"></div></div><div class="mb-center">${keypad()}</div><div class="mb-side"><div class="mb-grid"></div></div></div>
      <div class="mb-trackpad"></div>
      <div class="mb-notch"></div>
      ${o.showGradient ? '<div class="mb-fade"></div>' : ''}
      ${o.badge ? '<div class="mb-badge"></div>' : ''}
    </div>`;
  const title = root.querySelector('.mb-title'), screen = root.querySelector('.mb-screen'), img = root.querySelector('.mb-img');
  if (title) { if (typeof o.title === 'string') title.textContent = o.title; else title.append(o.title); }
  if (img) { img.src = o.src; img.alt = o.alt; }
  const logoSlot = root.querySelector('.mb-logo');
  if (o.logo instanceof Node) logoSlot.append(o.logo); else logoSlot.innerHTML = o.logo || ACETERNITY_MARK;
  const badgeSlot = root.querySelector('.mb-badge');
  if (badgeSlot) { if (o.badge instanceof Node) badgeSlot.append(o.badge); else badgeSlot.innerHTML = o.badge; }
  host.appendChild(root);

  let progress = -1;
  const setProgress = p => {
    p = clamp(+p || 0, 0, 1);
    if (p === progress) return;
    progress = p;
    // motion's transform order: translate, then scale, then rotate
    screen.style.transform = `translateY(calc(var(--mbu) * ${(translate(p) / 16).toFixed(4)})) scaleX(${scaleX(p).toFixed(4)}) scaleY(${scaleY(p).toFixed(4)}) rotateX(${rotate(p).toFixed(3)}deg)`;
    if (title) { title.style.transform = `translateY(calc(var(--mbu) * ${(textTransform(p) / 16).toFixed(4)}))`; title.style.opacity = textOpacity(p).toFixed(4); }
  };
  setProgress(0);

  let raf = 0;
  const readScroll = () => {   // useScroll({ target, offset: ['start start', 'end start'] })
    raf = 0;
    const r = root.getBoundingClientRect();
    setProgress(r.height ? -r.top / r.height : 0);
  };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(readScroll); };
  if (o.mode === 'scroll') { addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); readScroll(); }

  return {
    root, screen,
    get progress() { return progress; },
    setProgress,
    destroy() { if (o.mode === 'scroll') { removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); } cancelAnimationFrame(raf); root.remove(); }
  };
}
export default createMacbookScroll;
