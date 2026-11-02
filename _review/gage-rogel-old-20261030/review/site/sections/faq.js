// Section 11 · the questions (Hayden 10/29: "don't do the questions how you have them styled… find a gadget and try to make
// it pop a little bit better"). mountFaq(host, opts) → { el, bento, open(i), close(), intro(), reveal(), destroy() }
// Gadget: React Bits Magic Bento (ported, js/vendor/magic-bento.js): edge light that follows the pointer, the spotlight and
// stars inside the card under it, the click wave, the press spring, the staggered intro. Tap a tile: it grows over its
// neighbours into a 2 × 2 tile (SETTLE curve) and the answer rolls in line by line (Pegassi's reveal: lines slide up out of a
// mask, yPercent 100 → 0, 1.75 s expo.out, 0.1 s apart); the downward chevron flips up (ARROW LAW). Tap it again, or Esc,
// and it folds back. Questions and answers: Gage's own, verbatim and in his order (assets/his-demo-copy.json "faq").
import { createMagicBento } from '../../../js/vendor/magic-bento.js?v=20261030c';
import { ensureCss, el, lineReveal, icon, reduce, closeEnough } from './common.js?v=20261030e';

export const FAQ = [
  { q: 'Do I need gym experience to start?', a: "No. Your program starts from where you are, whether that's your first month in a gym or your tenth year. If you're coming back after time off, the first couple of weeks ease you in while you find your working weights." },
  { q: "What's included with coaching?", a: 'Every plan comes with a custom training program, a nutrition plan built from your own MyFitnessPal, hour-long check-in calls, supplement recommendations with client discounts, and direct access to me. The tiers change how many calls you get each month, and Gold and Platinum add in-depth education and weekly program adjustments.' },
  { q: 'How much does coaching cost?', a: 'Silver is $399 a month, Gold is $499 a month, and Platinum is $799 a month, each with a 90-day minimum. Longer terms of 6 months or a full year get a better rate.' },
  { q: 'How long does a coaching phase run?', a: 'Every plan starts with a 90-day minimum, and a phase usually runs about 12 weeks. At the end of a phase we go over your trackers together and build the next one from there.' },
  { q: 'Do you write generic meal plans?', a: "No. Your meals come from your MyFitnessPal, the foods you already like, and anything you don't eat or can't have. If you're not a breakfast person, your plan won't make you eat breakfast." },
  { q: 'I have an injury or an old surgery. Can you still program around it?', a: 'Yes. Tell me about it on your intro call. Lower backs, knees, and shoulders come up all the time, and your program gets set up for it from day one with machine and dumbbell swaps and supported lifts.' },
  { q: 'Can I move workout days around?', a: "Yes. Keep the order of the split so you're not training the same muscles two days in a row, and slide the days around your schedule however you need." },
  { q: 'How soon will I see results?', a: 'Most clients feel a difference in strength, energy, and how their clothes fit within 2 to 3 weeks, and visible changes usually show up around weeks 4 to 6. Everyone moves at a different pace, which is why we track photos and measurements every week.' },
  { q: "How do we communicate once I'm a client?", a: 'Hour-long check-in calls (2, 4, or 8 a month depending on your plan), plus direct access between calls. I reply within 24 hours on weekdays.' },
  { q: 'Can I get a refund?', a: "Plans aren't refundable once your term starts. Everything is laid out in the Client Agreement you read and sign before we begin." }
];
const WIDE = new Set([2, 3]);   // cost and phase span two columns: the bento's staggered big tiles (row 1 right, row 2 left)
const SETTLE = 'cubic-bezier(0.22, 1, 0.36, 1)';   // the Stepper's settle curve: fast out, no overshoot past the grid
const OPEN_MS = 560;
const CLOSE_MS = 420;

export function mountFaq(host, opts = {}) {
  const css = ensureCss();
  const o = { title: 'Frequently asked questions', hint: 'Tap a question', ...opts };
  const root = el('section', 'gs gs-faq');
  root.setAttribute('aria-label', o.title);
  const head = el('div', 'fq-head');
  const h = el('h3', 'gs-h', o.title);
  head.append(h, el('p', 'fq-hint', o.hint));
  const gridHost = el('div', 'fq-grid');
  root.append(head, gridHost);
  host.appendChild(root);

  const tiles = FAQ.map((item, i) => {
    const tile = el('div', WIDE.has(i) ? 'fq fq--wide' : 'fq');
    const face = el('div', 'fq-face');
    face.append(el('span', 'fq-n', String(i + 1).padStart(2, '0')), el('p', 'fq-q', item.q));
    const openFace = el('div', 'fq-open');
    openFace.setAttribute('aria-hidden', 'true');
    const oq = el('p', 'fq-oq', item.q);
    const oa = el('p', 'fq-a', item.a);
    openFace.append(oq, oa);
    const chev = el('span', 'fq-chev');
    chev.appendChild(icon('ArrowDown01Icon', 1.8));
    tile.append(face, openFace, chev);
    return { tile, face, openFace, oq, oa, cancel: () => {} };
  });

  const bento = createMagicBento(gridHost, {
    items: FAQ.map((item, i) => ({ title: item.q, content: tiles[i].tile, colSpan: WIDE.has(i) ? 2 : 1 })),
    columns: 4,
    rowHeight: 'calc(var(--u) * 20.2)',
    gap: 'calc(var(--u) * 1.4)',
    radius: 6,
    glowColor: '#5CB2FF',
    spotlightRadius: 300,
    enableStars: true,
    particleCount: 24,
    clickEffect: true,
    intro: true,
    introOnView: false,
    className: 'fq-bento',
    style: {
      '--mb-surface': 'linear-gradient(180deg, rgba(14, 25, 41, 0.97) 0%, rgba(9, 15, 25, 0.97) 100%)',
      '--mb-edge': 'rgba(92, 178, 255, 0.2)',
      '--mb-highlight': 'rgba(255, 255, 255, 0.05)',
      '--mb-shadow': '0 calc(var(--u) * 2.4) calc(var(--u) * 6) calc(var(--u) * -3) rgba(6, 135, 255, 0.28)',
      '--mb-focus': 'rgba(92, 178, 255, 0.7)',
      '--mb-spot-alpha': 0.12
    },
    onItemClick: (_, i) => toggle(i)
  });
  bento.cards.forEach(card => card.setAttribute('aria-expanded', 'false'));
  css.then(() => bento.refresh());   // sections.css may arrive after the grid is built

  // the intro plays once the grid is close enough to read (in the tunnel it is visible long before that)
  let introTimer = setInterval(() => {
    if (!closeEnough(bento.el)) return;
    clearInterval(introTimer);
    introTimer = 0;
    bento.enter();
  }, 120);

  // ---- open / close ----
  let open = -1;
  const pad = () => parseFloat(getComputedStyle(bento.cards[0].querySelector('.magic-bento__content')).paddingLeft) || 0;
  const geometry = i => {
    const cells = bento.cells;
    const cell = cells[i];
    const unitCell = cells.find((_, j) => !WIDE.has(j));
    const gap = parseFloat(getComputedStyle(bento.el).columnGap) || 0;
    const colW = unitCell.offsetWidth;
    const rowH = unitCell.offsetHeight;
    const cols = Math.max(1, Math.round((bento.el.clientWidth + gap) / (colW + gap)));
    const rows = Math.max(1, Math.round((bento.el.clientHeight + gap) / (rowH + gap)));
    const c = Math.round(cell.offsetLeft / (colW + gap));
    const r = Math.round(cell.offsetTop / (rowH + gap));
    const span = Math.round((cell.offsetWidth + gap) / (colW + gap));
    const wCols = Math.min(2, cols);
    const hRows = Math.min(2, rows);
    const c0 = span >= wCols ? c : Math.max(0, Math.min(c, cols - wCols));
    const r0 = Math.max(0, Math.min(r, rows - hRows));
    return {
      left: c0 * (colW + gap) - cell.offsetLeft,
      top: r0 * (rowH + gap) - cell.offsetTop,
      width: wCols * colW + (wCols - 1) * gap,
      height: hRows * rowH + (hRows - 1) * gap
    };
  };
  const box = card => ({ left: card.offsetLeft, top: card.offsetTop, width: card.offsetWidth, height: card.offsetHeight });
  const px = g => ({ left: `${g.left}px`, top: `${g.top}px`, width: `${g.width}px`, height: `${g.height}px` });
  // while a card changes size the bento re-reads its box every frame, so the edge light and the stars follow it
  const pump = ms => {
    const end = performance.now() + ms + 60;
    const loop = () => {
      bento.refresh();
      if (performance.now() < end) requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  };

  function openTile(i) {
    const card = bento.cards[i];
    const cell = bento.cells[i];
    const t = tiles[i];
    const from = card.style.position === 'absolute' ? box(card) : { left: 0, top: 0, width: cell.offsetWidth, height: cell.offsetHeight };
    card.getAnimations().forEach(a => a.cancel());
    const to = geometry(i);
    open = i;
    bento.el.dataset.open = String(i);
    cell.style.zIndex = '6';
    card.style.position = 'absolute';
    Object.assign(card.style, px(to));
    card.setAttribute('aria-expanded', 'true');
    t.tile.classList.add('is-open');
    t.openFace.removeAttribute('aria-hidden');
    t.face.setAttribute('aria-hidden', 'true');
    // the open face is laid out at its final size from the start, so the lines it splits are the lines it ends with
    const p = pad();
    t.openFace.style.width = `${to.width - p * 2}px`;
    t.openFace.style.height = `${to.height - p * 2}px`;
    if (!reduce()) {
      card.animate([px(from), px(to)], { duration: OPEN_MS, easing: SETTLE });
      pump(OPEN_MS);
    } else bento.refresh();
    t.cancel();
    t.cancel = lineReveal([t.oq, t.oa], { delay: 0.08 });
  }

  function closeTile(i) {
    const card = bento.cards[i];
    const cell = bento.cells[i];
    const t = tiles[i];
    if (open === i) {
      open = -1;
      delete bento.el.dataset.open;
    }
    t.cancel();
    t.cancel = () => {};
    t.tile.classList.remove('is-open');
    t.openFace.setAttribute('aria-hidden', 'true');
    t.face.removeAttribute('aria-hidden');
    card.setAttribute('aria-expanded', 'false');
    const from = box(card);
    card.getAnimations().forEach(a => a.cancel());
    const to = { left: 0, top: 0, width: cell.offsetWidth, height: cell.offsetHeight };
    const finish = () => {
      if (open === i) return;
      card.style.position = '';
      card.style.left = card.style.top = card.style.width = card.style.height = '';
      cell.style.zIndex = '';
      bento.refresh();
    };
    if (reduce()) {
      finish();
      return;
    }
    Object.assign(card.style, px(to));
    cell.style.zIndex = '5';
    const anim = card.animate([px(from), px(to)], { duration: CLOSE_MS, easing: SETTLE });
    anim.onfinish = finish;
    pump(CLOSE_MS);
  }

  function toggle(i) {
    if (open === i) closeTile(i);
    else {
      if (open >= 0) closeTile(open);
      openTile(i);
    }
  }

  // the window changed size with a tile open: the grid re-flowed, so the open tile re-fits its 2 × 2 block (no animation)
  const refit = new ResizeObserver(() => {
    if (open < 0) return;
    const card = bento.cards[open];
    const to = geometry(open);
    const p = pad();
    Object.assign(card.style, px(to));
    tiles[open].openFace.style.width = `${to.width - p * 2}px`;
    tiles[open].openFace.style.height = `${to.height - p * 2}px`;
    bento.refresh();
  });
  refit.observe(bento.el);

  const onKey = e => {
    if (e.key === 'Escape' && open >= 0) {
      const i = open;
      closeTile(i);
      bento.cards[i].focus({ preventScroll: true });
    }
  };
  root.addEventListener('keydown', onKey);

  let cancelReveal = () => {};
  return {
    el: root,
    bento,
    open: i => {
      if (i >= 0 && i < FAQ.length && open !== i) toggle(i);
    },
    close: () => {
      if (open >= 0) closeTile(open);
    },
    // run the tiles' entrance again (e.g. each time the camera arrives)
    intro: () => {
      if (introTimer) {
        clearInterval(introTimer);
        introTimer = 0;
      }
      bento.replayIntro();
    },
    reveal() {
      cancelReveal();
      cancelReveal = lineReveal([h]);
    },
    destroy() {
      if (introTimer) clearInterval(introTimer);
      tiles.forEach(t => t.cancel());
      cancelReveal();
      root.removeEventListener('keydown', onKey);
      refit.disconnect();
      bento.destroy();
      root.remove();
    }
  };
}

export default mountFaq;
