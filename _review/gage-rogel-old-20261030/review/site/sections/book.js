// Section 10 · book a call.
// Round 3 (Hayden 10/30: "book a call. We need to make a little bit bigger, and. Can we do a hold to confirm? … I would
// like that for that section, or to book a call."):
//  - the confirm is the React Bits Hold Button he hearted (ported, js/vendor/hold-button.js). Once a time is picked,
//    "Hold to book", in his blue, sits in the Slot Picker's confirm bar where its one-tap Confirm was (that button is
//    hidden, so there is exactly one confirm; the picked-time readout beside it stays). Holding fills it, letting go early
//    snaps it back (the original's 2 s fill and 200 ms snap-back); a quick tap says "Press and hold to book." A full hold
//    presses the picker's own Confirm, so everything Confirm did still happens the same way: the picker's Booked state,
//    the book-confirm event (the Status Island listens for it), opts.onConfirm, the booking link when there is one; then
//    the button reads "Booked". A new pick un-books it, as the picker always did, and the button drains back.
//  - everything in the section is 18% bigger (sections.css: .bk-inner redefines --u as --bu = 1.18 × the section's u),
//    the box itself stays 150u × 72u, and the content is centred in it. Phones stack the two columns.
// Round 2 (Hayden 10/30: "I like the slot picker"): the Kokonut UI Slot Picker (ported, js/vendor/slot-picker.js) replaced
// the two Rubber Segment pickers (Rubber Segment and Slide Commit stay in the effect library).
// mountBook(host, opts) → { el, picker, hold, reveal(), reset(), destroy() }   opts: { bookingUrl, days: 5, onConfirm }
// Words: the eyebrow, the line and the three call topics are Gage's own (his "How it works" step 02, "Intro Call · 1-on-1
// with me · We talk through where you're at, what you want, and which plan fits."); the email is his "Direct line" card.
// PLACEHOLDERS (stamped on the page and in data attributes): there is no booking link anywhere in his demo or brief.json
// (brief asks him "Cal.com on his account?"), so the days are the next weekdays and the open hours / busy blocks are
// SAMPLE availability; the 30-minute length is a sample too (his intro call length isn't stated). With a real link
// (opts.bookingUrl or data-booking-url on the host) a booking opens it in a new tab (and the note under the picker links
// to it, in case the browser held the tab back). Every booking fires CustomEvent('book-confirm') on the host.
import { createSlotPicker } from '../../../js/vendor/slot-picker.js?v=20261030c';
import { createHoldButton } from '../../../js/vendor/hold-button.js?v=20261030a';
import { ensureCss, el, lineReveal } from './common.js?v=20261030e';

const COPY = {
  k: ['Intro call', '1-on-1 with me'],
  title: 'Book a call',
  lede: "We talk through where you're at, what you want, and which plan fits.",
  topics: ["Where you're at", 'What you want', 'Which plan fits'],
  emailLead: 'Prefer email?',
  email: 'gagerogelfitness@gmail.com',
  hold: 'Hold to book',
  held: 'Booked',
  tapHint: 'Press and hold to book.'
};
const H = (hours, minutes = 0) => hours * 60 + minutes;
// SAMPLE availability by weekday (1 = Mon … 5 = Fri), until Gage's calendar is connected (Cal.com later)
const SAMPLE = {
  1: { open: [H(15), H(20)], busy: [[H(15), H(16)], [H(18), H(18, 30)]] },
  2: { open: [H(15), H(20)], busy: [[H(16, 30), H(17, 30)], [H(19), H(20)]] },
  3: { open: [H(16), H(20)], busy: [[H(16), H(17)], [H(18), H(19)]] },
  4: { open: [H(15), H(19)], busy: [[H(15, 30), H(16)], [H(17), H(18)]] },
  5: { open: [H(15), H(18)], busy: [[H(16), H(17)]] }
};
const SAMPLE_MINUTES = 30;
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function nextWeekdays(count) {
  const out = [];
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  while (out.length < count) {
    d.setDate(d.getDate() + 1);
    const w = d.getDay();
    if (w >= 1 && w <= 5) out.push(new Date(d));
  }
  return out;
}
const sampleDays = count => nextWeekdays(count).map(d => ({ date: iso(d), ...structuredClone(SAMPLE[d.getDay()]) }));

// the visitor's own time zone, in the original's "Eastern Time, New York" shape
function visitorZone() {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const name = new Intl.DateTimeFormat('en-US', { timeZoneName: 'longGeneric' })
      .formatToParts(new Date())
      .find(part => part.type === 'timeZoneName')?.value;
    const city = zone.split('/').pop()?.replace(/_/g, ' ');
    return [name, city].filter(Boolean).join(', ') || 'Your time zone';
  } catch {
    return 'Your time zone';
  }
}

// the Hold Button's stylesheet, linked once (sections.css carries the section's own rules)
const HOLD_CSS = new URL('../../../js/vendor/hold-button.css?v=20261030a', import.meta.url);
function linkHoldCss() {
  const has = [...document.querySelectorAll('link[rel="stylesheet"]')].some(node => {
    try {
      return new URL(node.href, location.href).pathname === HOLD_CSS.pathname;
    } catch {
      return false;
    }
  });
  if (has) return;
  const node = document.createElement('link');
  node.rel = 'stylesheet';
  node.href = HOLD_CSS.href;
  document.head.appendChild(node);
}

// showing, as far as CSS goes (the tunnel hides a section it has flown past with visibility: hidden)
const shown = node => {
  if (!node.isConnected) return false;
  if (node.checkVisibility) return node.checkVisibility({ visibilityProperty: true, checkVisibilityCSS: true });
  return getComputedStyle(node).visibility !== 'hidden';
};

export function mountBook(host, opts = {}) {
  const css = ensureCss();
  linkHoldCss();
  const o = { bookingUrl: host.dataset.bookingUrl || '', days: 5, onConfirm: null, ...opts };
  const url = (o.bookingUrl || '').trim();

  const root = el('section', 'gs gs-book');
  root.setAttribute('aria-label', 'Book a call');
  root.dataset.bookingUrl = url;
  root.dataset.bookingLink = url ? 'real' : 'placeholder';
  root.dataset.slots = 'sample';
  // the content, 18% bigger than the box's unit (sections.css), centred in the box
  const inner = el('div', 'bk-inner');

  // ---- left: his words ----
  const left = el('div', 'bk-left');
  const k = el('p', 'gs-k');
  k.append(el('span', '', COPY.k[0]), el('span', 'gs-k-dot', '·'), el('span', '', COPY.k[1]));
  const h = el('h3', 'gs-h', COPY.title);
  const lede = el('p', 'gs-p', COPY.lede);
  const topics = el('ol', 'bk-topics');
  COPY.topics.forEach((line, i) => {
    const li = el('li');
    li.append(el('b', '', String(i + 1).padStart(2, '0')), el('span', '', line));
    topics.appendChild(li);
  });
  const mail = el('p', 'bk-mail');
  const a = el('a', '', COPY.email);
  a.href = `mailto:${COPY.email}`;
  mail.append(el('span', '', COPY.emailLead), a);
  left.append(k, h, lede, topics, mail);

  // ---- right: the slot picker ----
  const right = el('div', 'bk-right');
  const stamp = el('div', 'bk-stamp');
  stamp.appendChild(el('span', 'gs-tag', 'Sample times'));
  const pickerHost = el('div', 'bk-picker');
  pickerHost.dataset.sample = 'true';
  const status = el('p', 'bk-status');
  status.setAttribute('aria-live', 'polite');
  right.append(stamp, pickerHost, status);
  inner.append(left, right);
  root.appendChild(inner);
  host.appendChild(root);

  // the note under the picker: the booking's ("booked") or the tap hint ("hint")
  let note = null;
  let hintTimer = 0;
  const setStatus = (kind, parts) => {
    clearTimeout(hintTimer);
    note = kind;
    status.replaceChildren(...parts.map(part => (typeof part === 'string' ? document.createTextNode(part) : part)));
    if (kind === 'booked') root.dataset.booked = '';
    else delete root.dataset.booked;
  };
  const clearStatus = () => {
    clearTimeout(hintTimer);
    note = null;
    status.replaceChildren();
    delete root.dataset.booked;
  };

  const picker = createSlotPicker(pickerHost, {
    host: { name: 'Gage Rogel', title: 'Intro call' },
    days: sampleDays(o.days),
    durations: [SAMPLE_MINUTES],
    lengths: false,
    timezone: visitorZone(),
    className: 'bk-slot',
    // the picker's own Confirm (hidden; pressed by a full hold below): everything a booking does
    onBook: slot => {
      const day = new Date(`${slot.date}T12:00:00`);
      const detail = {
        date: slot.date,
        day: day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        start: slot.start,
        minutes: slot.minutes,
        time: `${String(Math.floor(slot.start / 60)).padStart(2, '0')}:${String(slot.start % 60).padStart(2, '0')}`,
        sample: true,
        bookingUrl: url || null
      };
      host.dispatchEvent(new CustomEvent('book-confirm', { detail, bubbles: true }));
      o.onConfirm?.(detail);
      if (url) window.open(url, '_blank', 'noopener');
      if (url) {
        const link = el('a', '', 'Gage’s calendar');
        Object.assign(link, { href: url, target: '_blank', rel: 'noopener' });
        setStatus('booked', ['Finish on ', link, ' (new tab).']);
      } else setStatus('booked', ['Demo: a sample slot, nothing was booked.']);
    }
  });

  // ---- the one confirm: the Hold Button, in the picker's confirm bar where its Confirm button was ----
  const bar = picker.el.querySelector('.sp-confirm');
  const confirmBtn = bar ? bar.querySelector('.sp-confirm-btn') : null;
  const hold = createHoldButton(bar || right, {
    label: COPY.hold,
    doneLabel: COPY.held,
    size: 'md',
    className: 'bk-hold',
    backgroundColor: 'var(--bk-hold-bg)',
    fillColor: 'var(--gs-blue)',
    textColor: 'var(--gs-ink)',
    fillTextColor: '#ffffff',
    resetAfter: 0, // a booking stays "Booked" until the pick changes
    disabled: true, // until a time is picked
    onComplete: () => {
      // the picker's own Confirm path; if it didn't book (nothing picked), the button drains back
      if (confirmBtn && !confirmBtn.disabled) confirmBtn.click();
      return picker.value?.booked ? undefined : Promise.reject(new Error('no slot to book'));
    },
    onTap: () => {
      if (!picker.value || picker.value.booked || note === 'booked') return;
      setStatus('hint', [COPY.tapHint]);
      hintTimer = setTimeout(() => {
        if (note === 'hint') clearStatus();
      }, 2400);
    }
  });

  // follow the picker: its (hidden) Confirm is disabled until a time is picked and carries is-booked once it's booked;
  // a new pick (tap, drag, arrow keys, another day) un-books it, the original's behaviour: the note goes with it and the
  // Hold Button drains back to "Hold to book"
  let holdOff = true;
  const syncHold = () => {
    const v = picker.value;
    if (!v) {
      if (hold.phase !== 'idle') hold.reset({ instant: true });
    } else if (!v.booked && hold.phase === 'done') hold.reset();
    if (!v !== holdOff) {
      holdOff = !v;
      hold.set({ disabled: holdOff });
    }
    if (note === 'booked' && !v?.booked) clearStatus();
  };
  const follow = new MutationObserver(syncHold);
  if (confirmBtn) follow.observe(confirmBtn, { attributes: true, attributeFilter: ['disabled', 'class'] });
  syncHold();
  css.then(() => requestAnimationFrame(() => picker.relayout()));

  function reset() {
    clearStatus();
    picker.setDays(sampleDays(o.days));
    hold.reset({ instant: !shown(root) });
    syncHold();
  }

  let cancelReveal = () => {};
  let revealing = false;
  return {
    el: root,
    picker,
    hold,
    // the tunnel calls this as you arrive (and can call it again while you're past the section): a reveal that is still
    // running isn't restarted, and a hidden section isn't revealed
    reveal() {
      if (revealing || !shown(root)) return;
      cancelReveal();
      revealing = true;
      cancelReveal = lineReveal([h, lede], {
        onDone: () => {
          revealing = false;
        }
      });
    },
    reset,
    destroy() {
      cancelReveal();
      clearTimeout(hintTimer);
      follow.disconnect();
      hold.destroy();
      picker.destroy();
      root.remove();
    }
  };
}

export default mountBook;
