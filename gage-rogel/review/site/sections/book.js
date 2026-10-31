// Section 10 · book a call. Round 2 (Hayden 10/30: "I like the slot picker"): the Kokonut UI Slot Picker (ported,
// js/vendor/slot-picker.js) replaces the two Rubber Segment pickers. Its own confirm bar (the picked time + Confirm →
// Booked) is the confirm: it is part of the piece he picked, it is one tap, and a Slide Commit under it would be a second
// confirm for the same thing. (Slide Commit stays in the effect library.)
// mountBook(host, opts) → { el, picker, reveal(), reset(), destroy() }   opts: { bookingUrl, days: 5, onConfirm }
// Words: the eyebrow, the line and the three call topics are Gage's own (his "How it works" step 02, "Intro Call · 1-on-1
// with me · We talk through where you're at, what you want, and which plan fits."); the email is his "Direct line" card.
// PLACEHOLDERS (stamped on the page and in data attributes): there is no booking link anywhere in his demo or brief.json
// (brief asks him "Cal.com on his account?"), so the days are the next weekdays and the open hours / busy blocks are
// SAMPLE availability; the 30-minute length is a sample too (his intro call length isn't stated). With a real link
// (opts.bookingUrl or data-booking-url on the host) Confirm opens it in a new tab. Every confirm fires
// CustomEvent('book-confirm') on the host.
import { createSlotPicker } from '../../../js/vendor/slot-picker.js?v=20261030c';
import { ensureCss, el, lineReveal } from './common.js?v=20261030e';

const COPY = {
  k: ['Intro call', '1-on-1 with me'],
  title: 'Book a call',
  lede: "We talk through where you're at, what you want, and which plan fits.",
  topics: ["Where you're at", 'What you want', 'Which plan fits'],
  emailLead: 'Prefer email?',
  email: 'gagerogelfitness@gmail.com'
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

export function mountBook(host, opts = {}) {
  const css = ensureCss();
  const o = { bookingUrl: host.dataset.bookingUrl || '', days: 5, onConfirm: null, ...opts };
  const url = (o.bookingUrl || '').trim();

  const root = el('section', 'gs gs-book');
  root.setAttribute('aria-label', 'Book a call');
  root.dataset.bookingUrl = url;
  root.dataset.bookingLink = url ? 'real' : 'placeholder';
  root.dataset.slots = 'sample';

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
  root.append(left, right);
  host.appendChild(root);

  let noted = false;   // the "demo, nothing was booked" note is showing
  const picker = createSlotPicker(pickerHost, {
    host: { name: 'Gage Rogel', title: 'Intro call' },
    days: sampleDays(o.days),
    durations: [SAMPLE_MINUTES],
    lengths: false,
    timezone: visitorZone(),
    className: 'bk-slot',
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
      status.textContent = url ? 'Finish on Gage’s calendar (new tab).' : 'Demo: a sample slot, nothing was booked.';
      noted = true;
      root.dataset.booked = '';
    }
  });
  // a new pick (tap, drag, arrow keys, another day) un-books it, the original's behaviour: the note goes with it
  const syncStatus = () => {
    if (!noted || picker.value?.booked) return;
    noted = false;
    delete root.dataset.booked;
    status.textContent = '';
  };
  pickerHost.addEventListener('pointerup', syncStatus);
  pickerHost.addEventListener('keyup', syncStatus);
  pickerHost.addEventListener('click', syncStatus);
  css.then(() => requestAnimationFrame(() => picker.relayout()));

  function reset() {
    noted = false;
    delete root.dataset.booked;
    status.textContent = '';
    picker.setDays(sampleDays(o.days));
  }

  let cancelReveal = () => {};
  return {
    el: root,
    picker,
    reveal() {
      cancelReveal();
      cancelReveal = lineReveal([h, lede]);
    },
    reset,
    destroy() {
      cancelReveal();
      picker.destroy();
      root.remove();
    }
  };
}

export default mountBook;
