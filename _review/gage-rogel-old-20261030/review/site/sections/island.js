// Gage hollow site · the status island (Hayden 10/30: "Can we do the status island for sending a message to Gage or
// booking an appointment?"). A fixed overlay, outside the 3D scene: top-center on screens wide enough for the top row
// (wordmark top-left, Apply top-right, the island between), bottom-center on phones. Shown once the visitor has clicked in
// (body.entered).
// mountIsland(host = document.body, opts) → { el, island, push(task), update(id, patch), remove(id), booked(detail),
//   applied(detail), destroy() }   opts: { onBook(), messageUrl, onUndo(detail), listen: true }
// Gadget: Kokonut UI Status Island (ported, js/vendor/status-island.js). Resting face (added to the port as `rest`): two
// actions, "Message Gage" (his Instagram DMs, new tab: most of his inquiries come in there, where a bot replies first) and
// "Book a call" (onBook: the page flies to the booking section). Status through the original's task model:
//   book-confirm  → running "Booking your intro call" → done "Sample slot held · <day, time>" + Undo (calls onUndo)
//   apply-submit  → running "Sending your application" → done "Demo · not sent yet"
// Both are demos: nothing is booked or sent, and the island says so. listen: true wires those two page events itself (they
// bubble from the sections to document); pass listen: false to call booked() / applied() / push() / update() yourself.
import { createStatusIsland } from '../../../js/vendor/status-island.js?v=20261030d';

const VERSION = '20261030d';
const MESSAGE_URL = 'https://ig.me/m/gagerogel';
const HOLD_MS = 900;   // the running state reads before it settles (a demo: there is no request to wait for)

// lucide-static 0.468.0 (ISC)
const ICON = {
  message: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>'
};
const icon = name => {
  const span = document.createElement('span');
  span.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="gi-icon">${ICON[name]}</svg>`;
  return span.firstChild;
};
const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
};
const link = href => {
  const path = new URL(href, import.meta.url);
  const has = [...document.querySelectorAll('link[rel="stylesheet"]')].some(node => {
    try {
      return new URL(node.href, location.href).pathname === path.pathname;
    } catch {
      return false;
    }
  });
  if (has) return;
  const node = document.createElement('link');
  node.rel = 'stylesheet';
  node.href = path.href;
  document.head.appendChild(node);
};
// "7:15pm" from minutes after midnight (the slot picker's clock)
const clock = minutes => {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${hours % 12 || 12}${mins ? `:${String(mins).padStart(2, '0')}` : ''}${hours >= 12 ? 'pm' : 'am'}`;
};
const when = detail => {
  if (!detail) return '';
  const time = typeof detail.start === 'number' ? clock(detail.start) : detail.time || '';
  return [detail.day, time].filter(Boolean).join(' at ');
};

export function mountIsland(host = document.body, opts = {}) {
  const o = { onBook: null, messageUrl: MESSAGE_URL, onUndo: null, listen: true, ...opts };
  link(`../../../js/vendor/status-island.css?v=${VERSION}`);
  link(`./island.css?v=${VERSION}`);

  const frame = el('div', 'gage-island');
  frame.setAttribute('role', 'region');
  frame.setAttribute('aria-label', 'Message Gage or book a call');

  // the resting face: the two ways in
  const rest = el('div', 'gi-rest');
  const message = el('a', 'gi-btn gi-btn--ghost');
  Object.assign(message, { href: o.messageUrl, target: '_blank', rel: 'noopener' });
  message.append(icon('message'), el('span', '', 'Message Gage'));
  const book = el('button', 'gi-btn gi-btn--primary');
  book.type = 'button';
  book.append(icon('calendar'), el('span', '', 'Book a call'));
  book.addEventListener('click', () => o.onBook?.());
  rest.append(message, book);

  host.appendChild(frame);
  // Hayden 10/30: "get rid of the two icon buttons at the top": no resting face; like the original, the island only shows while it has a status
  const island = createStatusIsland(frame, { className: 'gi-island' });

  let n = 0;
  const later = [];
  const settle = (fn, ms) => later.push(setTimeout(fn, ms));

  function booked(detail) {
    const id = `book-${++n}`;
    island.push({ id, status: 'running', label: 'Booking your intro call' });
    settle(() => {
      island.update(id, {
        status: 'done',
        label: 'Sample slot held',
        detail: when(detail) || undefined,
        action: {
          label: 'Undo',
          onClick: () => {
            island.update(id, { label: 'Sample slot released', detail: undefined, action: undefined });
            o.onUndo?.(detail);
          }
        }
      });
    }, HOLD_MS);
    return id;
  }

  function applied() {
    const id = `apply-${++n}`;
    island.push({ id, status: 'running', label: 'Sending your application' });
    settle(() => island.update(id, { status: 'done', label: 'Demo', detail: 'not sent yet', action: undefined }), HOLD_MS);
    return id;
  }

  const onBooked = event => booked(event.detail);
  const onApplied = event => applied(event.detail);
  if (o.listen) {
    document.addEventListener('book-confirm', onBooked);
    document.addEventListener('apply-submit', onApplied);
  }

  return {
    el: frame,
    island,
    push: task => island.push(task),
    update: (id, patch) => island.update(id, patch),
    remove: id => island.remove(id),
    booked,
    applied,
    destroy() {
      later.splice(0).forEach(t => clearTimeout(t));
      document.removeEventListener('book-confirm', onBooked);
      document.removeEventListener('apply-submit', onApplied);
      island.destroy();
      frame.remove();
    }
  };
}

export default mountIsland;
