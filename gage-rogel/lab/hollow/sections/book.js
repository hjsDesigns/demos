// Section 10 · book a call.
// Round 4 (Hayden 11/1: "there was a cool feature where it gave the month, and then you could click a day. And then from the
// day, I want to get rid of pick a day, and this section should pop it up where it says tap an open time, and then the hold
// the book is beautiful. But I want to find like a month. Click it, day available, click it."):
// Then, the same day: "when I have the calendar, it should take up the full box, and then whenever I click on the day, the
// time scale for that day should be the full box, and then you should be able to give me like a button to go back."
//  - the picker's day strip is a MONTH CALENDAR (slot-picker.js, calendar: true) the full width of the card: month + year with
//    previous / next chevrons, Mo–Su, six rows of day cells that stretch with the card; days with open times lit in his blue,
//    today ringed, past days and days with nothing open dim and dead; the picked day filled blue with the picker's own ring
//    springing to it.
//  - clicking a lit day fades the calendar out and the rail view in, in the same slot and the full width of the card (hours
//    column + a 375 px rail): "‹ Thu, Nov 5" at the top goes back to the calendar; under it the one step label left ("Tap an
//    open time · drag to move it"; "Pick a day" is gone, so the label lost its number), then the rail. Both views are one
//    CSS grid cell, so the card is as tall as the calendar in either view and never moves. The rail's minute scale is chosen
//    below so the rail view fills that height (just under it). Hold to book is untouched.
//  - the sample days now cover the rest of this month and all of next (sampleDays(): SAMPLE by weekday, a few days skipped or
//    full on a fixed pattern so the month reads like a calendar, not a wall of blue). Still stamped "Sample times" /
//    data-slots="sample"; one function to swap for Gage's Cal.com feed later.
//  - [phone] the same one layout at the phone's unit (sections.css sizes the cells and type; minutePx below).
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
// mountBook(host, opts) → { el, picker, hold, reveal(), reset(), destroy() }   opts: { bookingUrl, months: 2, onConfirm }
// Words: the eyebrow, the line and the three call topics are Gage's own (his "How it works" step 02, "Intro Call · 1-on-1
// with me · We talk through where you're at, what you want, and which plan fits."); the email is his "Direct line" card.
// PLACEHOLDERS (stamped on the page and in data attributes): there is no booking link anywhere in his demo or brief.json
// (brief asks him "Cal.com on his account?"), so the days are the coming weekdays and the open hours / busy blocks are
// SAMPLE availability; the 30-minute length is a sample too (his intro call length isn't stated). With a real link
// (opts.bookingUrl or data-booking-url on the host) a booking opens it in a new tab (and the note under the picker links
// to it, in case the browser held the tab back). Every booking fires CustomEvent('book-confirm') on the host.
import { createSlotPicker } from '../../../js/vendor/slot-picker.js?v=20261101b';
import { createHoldButton } from '../../../js/vendor/hold-button.js?v=20261030a';
import { ensureCss, el, lineReveal, reduce } from './common.js?v=20261030e';

const COPY = {
  bar: '/// Intro call · 1-on-1 with me',
  titleLines: ['Book', 'a call'],
  k: ['Intro call', '1-on-1 with me'],   // not shown since 11/1 (kept for the record, with the lede, topics and email below)
  title: 'Book a call',
  lede: "We talk through where you're at, what you want, and which plan fits.",
  topics: ["Where you're at", 'What you want', 'Which plan fits'],
  emailLead: 'Prefer email?',
  email: 'gagerogelfitness@gmail.com',
  hold: 'Hold to book',
  held: 'Booked',
  tapHint: 'Press and hold to book.',
  // Hayden 10/31: "a lot bigger and easier to fill out… hard to tell what everything is… more digestible… more legible";
  // 11/1: "get rid of pick a day" — the calendar needs no label, so this is the one step left, over the rail
  steps: ['Tap an open time · drag to move it'],
  hint: 'Your time shows here.'
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
// [phone] the tunnel's narrow room (width/height <= 0.95), the same switch as index.html's layout() and sections.css
const NARROW_ROOM = '(max-aspect-ratio: 19/20)';
const PHONE = () => !!(window.matchMedia && window.matchMedia(NARROW_ROOM).matches);
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// SAMPLE days for the calendar: every weekday from tomorrow through the end of the (months − 1)th month ahead (2 = the rest
// of this month and all of next, so the calendar has a month to turn to), open hours and busy blocks from SAMPLE by weekday;
// a few days skipped (no openings) and a few full, on a fixed pattern, so the month reads like a real calendar and not a wall
// of blue. This is the one function to replace when Gage's calendar (Cal.com) feeds real times: same shape, { date, open, busy }.
function sampleDays(months = 2) {
  const out = [];
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth() + months, 0, 12);   // the last day of that month
  for (d.setDate(d.getDate() + 1); d <= end; d.setDate(d.getDate() + 1)) {
    const w = d.getDay();
    if (w < 1 || w > 5) continue;
    const n = d.getDate();
    if ((n * 7 + w) % 9 === 0) continue;                                       // a day off
    const day = { date: iso(d), ...structuredClone(SAMPLE[w]) };
    if ((n * 5 + w) % 11 === 0) day.busy = [[day.open[0], day.open[1]]];        // a full day
    out.push(day);
  }
  return out;
}

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


// the console heading (Hayden 11/1, picking treatment 1 of five and cutting it down: "I like the number one, but we can just get rid
// of the entire subsection… just keep the Apply for coaching and Book a call"): a status bar with a live LED, then the heading typed
// in with a caret when the camera arrives. Nothing else in the column. Reduced motion: the words are simply there.
function consoleHead(barText, lines) {   // Hayden 11/1 later: "I don't need it typed on there… get rid of the cursor typing" — the words are simply there, no caret
  const bar = el('div', 'cs-bar');
  bar.append(el('span', 'cs-led'), el('span', 'cs-bar-t', barText));
  const h = el('h3', 'gs-h cs-h');
  const spans = lines.map(t => { const sp = el('span', 'cs-line', t); sp.dataset.text = t; h.appendChild(sp); return sp; });
  const fill = () => { spans.forEach(sp => { sp.textContent = sp.dataset.text; }); };
  const type = onDone => { fill(); onDone && onDone(); return () => {}; };   // kept as the reveal hook; nothing animates
  return { bar, h, type, fill };
}

export function mountBook(host, opts = {}) {
  const css = ensureCss();
  linkHoldCss();
  const o = { bookingUrl: host.dataset.bookingUrl || '', months: 2, onConfirm: null, ...opts };
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
  const head = consoleHead(COPY.bar, COPY.titleLines);
  const h = head.h;
  left.append(head.bar, h);   // the console bar and the typed heading; no eyebrow, no lede, no 01–03, no email line (Hayden 11/1)

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
    days: sampleDays(o.months),
    durations: [SAMPLE_MINUTES],
    lengths: false,
    calendar: true,   // 11/1: the month calendar in place of the day strip; the rail shows once a day is clicked
    hint: COPY.hint,
    // 11/1 PM: the rail view fills the calendar's slot (sections.css): Mac slot 330 px of --sp-px − back row 32 − label 17 −
    // margin 14 = 267 for the 300 sample minutes (3–8 pm) → 0.87 (261, 6 under, so the card never grows on the swap); phone
    // slot 310 − 36 − 21 − 12 = 241 → 0.78 (234). Both above the original's 0.8 class: a half hour is 23–26 px, room for "Busy".
    minutePx: PHONE() ? 0.78 : 0.87,
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
  // the one step label, right above the rail it means (Hayden 10/31: "hard to tell what everything is"; 11/1: "get rid of
  // pick a day" — the calendar needs no label, and the rail's label lost its number now that it stands alone). It lives in
  // the picker's rail view (.sp-times), under its "‹ day" row, so it rises in with the rail when a day is clicked.
  const step = text => { const p = el('p', 'bk-step bk-step--solo'); p.append(el('span', '', text)); return p; };
  const railRow = picker.el.querySelector('.sp-railrow');
  if (railRow) railRow.before(step(COPY.steps[0]));

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
    picker.setDays(sampleDays(o.months));
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
      cancelReveal = head.type(() => { revealing = false; });
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
