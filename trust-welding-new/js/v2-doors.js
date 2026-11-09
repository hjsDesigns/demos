/* Trust Welding · version 2 (11/7) · the doors. New in v2; version 1 never loads it.
   NEEDS.md §2 (the form that really works) and §3 (Text and Call in reach on every screen, the tap counter),
   the welding playbook (the goal is a text), and the conversion-path, mobile-craft, navigation and accessibility cards.
   Every word comes from window.TW_COPY (the COPY block in build-new-skills.py).

   The one decision this file makes: is there a text app here? A phone (or any touch screen, or any window 900 px wide
   or less) gets the real sms:/tel: links. A laptop (fine pointer + hover + wider than 900 px) has no text app to open,
   so every Text door opens the laptop door instead: the number big and copyable, the message copyable, and a QR code
   that opens the same text, filled in, on the visitor's phone. */
(function () {
  const C = window.TW_COPY || {}, K = C.contact || {}, F = C.form || {}, D = C.door || {};
  const SMS = K.sms || 'sms:+14252836496';
  const E164 = '+' + SMS.replace(/\D/g, '');
  const laptopQ = matchMedia('(hover:hover) and (pointer:fine) and (min-width:901px)');
  const LAPTOP = () => laptopQ.matches;
  const EDIT = location.hostname === 'localhost' || location.search.includes('edit=1');
  const current = { body: '' };   // the message the open door (laptop dialog or the phone's fallback) carries
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // ── the meter (the leads law: name it on day 0). Every door pushes a dataLayer 'door' event; only a hand-off that can
  //    really reach Trustin (a phone's Text or Send, a Call, a Copy) is tallied. A laptop Send that opens nothing never counts.
  const KEY = 'tw-doors';
  let chip = null;
  const tally = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } };
  const paint = () => { if (!chip) return; const t = tally(); chip.innerHTML = (D.meter_label || 'Hand-offs in this browser') + '<br>' + ['text', 'call', 'copy', 'send'].map(k => k + ' <b>' + (t[k] || 0) + '</b>').join(' · '); };
  function meter(door, where, handoff) {
    (window.dataLayer = window.dataLayer || []).push({ event: 'door', door: door, where: where, handoff: !!handoff });
    if (handoff) { const t = tally(), k = door.indexOf('copy') === 0 ? 'copy' : door; t[k] = (t[k] || 0) + 1; try { localStorage.setItem(KEY, JSON.stringify(t)); } catch (e) {} }
    paint();
  }
  window.twMeter = meter;
  if (EDIT) { chip = document.createElement('div'); chip.className = 'meterchip'; chip.setAttribute('aria-hidden', 'true'); document.body.appendChild(chip); paint(); }
  const whereOf = el => { const w = el.closest('[data-where]'); if (w) return w.dataset.where; const s = el.closest('section[id],header,footer,#thumb,dialog'); return s ? (s.id || s.tagName.toLowerCase()) : 'page'; };

  // ── copy, with the answer in the same frame (micro-interactions card); the meter counts only a copy that worked
  async function copyText(text) {
    try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; } } catch (e) {}
    const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) {} ta.remove(); return ok;
  }
  function flash(btn, ok) {
    const tag = btn.querySelector('.cpy') || btn;
    if (!tag.dataset.label) tag.dataset.label = tag.textContent;
    btn.classList.toggle('is-copied', ok); tag.textContent = ok ? (D.copied || 'Copied') : tag.dataset.label;
    clearTimeout(btn._t); btn._t = setTimeout(() => { btn.classList.remove('is-copied'); tag.textContent = tag.dataset.label; }, 1800);
  }
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-copy]'); if (!b) return;
    e.preventDefault();
    const isMsg = b.dataset.copy === '@message', text = isMsg ? current.body : b.dataset.copy;
    if (!text) return;
    // "Copied" only once it is true: the clipboard answers in a few milliseconds, so the reply still lands at once,
    // and a copy the browser refused never shows a false "Copied" (or counts on the meter)
    const ok = await copyText(text);
    flash(b, ok);
    if (ok) meter(isMsg ? 'copy-message' : 'copy-number', whereOf(b), true);
  });

  // ── the laptop door: a native <dialog> (no navigation, no lost scroll)
  const dlg = document.getElementById('ldoor');
  function qrSVG(text) {
    if (!window.TWQR) return '';
    const q = window.TWQR(text, 'M'), n = q.n, pad = 3, N = n + pad * 2;
    let d = '';
    for (let r = 0; r < n; r++) {   // one run per row of dark modules keeps the path short
      let c = 0;
      while (c < n) { if (!q.dark(r, c)) { c++; continue; } let e = c; while (e < n && q.dark(r, e)) e++; d += 'M' + (c + pad) + ' ' + (r + pad) + 'h' + (e - c) + 'v1h-' + (e - c) + 'z'; c = e; }
    }
    return '<svg viewBox="0 0 ' + N + ' ' + N + '" role="img" aria-label="' + esc(D.qr_alt || 'QR code') + '" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><rect width="' + N + '" height="' + N + '" fill="#F2F4F5"/><path d="' + d + '" fill="#0A0C0E"/></svg>';
  }
  function openDoor(body, qrBody) {
    if (!dlg) return false;
    current.body = body || '';
    // SMSTO:<number>:<message> is the camera-app standard for "start a text". The code carries at most 150 characters
    // (critic 11/7: a 240-character code missed at 1x, 150 reads); the full message is still one tap away on Copy.
    const q = (qrBody != null ? qrBody : current.body);
    dlg.querySelector('.ldoor-qr-box').innerHTML = qrSVG('SMSTO:' + E164 + ':' + (q.length > 150 ? q.slice(0, 149) + '…' : q));
    dlg.querySelector('.ldoor-qr figcaption').textContent = current.body ? D.qr_with_msg : D.qr_plain;
    const msg = dlg.querySelector('.ldoor-msg'); msg.hidden = !current.body; msg.querySelector('blockquote').textContent = current.body;
    const mac = dlg.querySelector('.ldoor-mac'), isMac = /Mac/i.test(navigator.platform || navigator.userAgent || '');
    mac.hidden = !isMac; mac.querySelector('a').href = current.body ? SMS + '?&body=' + encodeURIComponent(current.body) : SMS;
    if (typeof dlg.showModal === 'function') { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute('open', '');
    return true;
  }
  window.twOpenDoor = openDoor;
  if (dlg) {
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });   // a tap on the dimmed page closes it
    dlg.querySelector('.ldoor-x').addEventListener('click', () => dlg.close());
  }

  // the header's "Text or call" on a laptop opens the door itself; the number is copied from inside it
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-door-open]'); if (!b) return;
    e.preventDefault(); meter('laptop-door', whereOf(b), false); openDoor('');
  });

  // ── every Text and Call door on the page, one listener (the header, the panel, the gadget, the thumb bar, the form's fallback)
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="sms:"],a[href^="tel:"],a[href*="instagram.com"]'); if (!a) return;
    const href = a.getAttribute('href'), where = whereOf(a);
    if (href.indexOf('tel:') === 0) { meter('call', where, true); return; }
    if (href.indexOf('instagram.com') > -1) { meter('instagram', where, false); return; }
    if (a.hasAttribute('data-pass')) { meter('text', where, true); return; }   // the Mac's own Messages, picked on purpose
    if (LAPTOP()) {
      e.preventDefault();
      const m = href.match(/[?&]body=([^&]*)/);
      meter('laptop-door', where, false); openDoor(m ? decodeURIComponent(m[1]) : '');
      return;
    }
    meter('text', where, true);
  });

  // ── the form: the typed number rides in the text; nothing says "sent" before anything was (NEEDS §2 a–d)
  const form = document.getElementById('quoteForm');
  if (form) {
    const st = form.querySelector('.qstatus'), fail = form.querySelector('.qfail'), job = form.querySelector('[name="job"]');
    const val = n => ((form.querySelector('[name="' + n + '"]') || {}).value || '').trim();
    const say = (txt, tone) => { st.textContent = txt || ''; if (tone) st.dataset.tone = tone; else delete st.dataset.tone; };
    const openRow = el => { const row = el && el.closest('.qrow'); if (row && !row.classList.contains('open')) { row.classList.add('open'); row.querySelector('.qline').setAttribute('aria-expanded', 'true'); } };
    // the line buttons, as in version 1
    form.querySelectorAll('.qrow .qline').forEach(b => b.addEventListener('click', () => {
      const row = b.closest('.qrow'), open = row.classList.toggle('open');
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) row.querySelector('input,textarea').focus();
    }));
    // tabbing into a closed line opens it, so the keyboard never lands on a field it cannot see (accessibility card)
    form.addEventListener('focusin', e => { if (e.target.matches('input,textarea')) openRow(e.target); });
    if (job) job.addEventListener('input', () => { if (job.value.trim()) { form.classList.remove('need-job'); if (st.dataset.tone === 'warn') say(''); } });
    const clean = s => s.replace(/[\s.]+$/, '');
    const ticket = (limit) => {   // reads like a job ticket he can quote from (conversion-path rubric line)
      const T = F.ticket || {}, rest = [];
      if (val('where')) rest.push((T.where || '') + clean(val('where')));
      if (val('phone')) rest.push((T.phone || '') + clean(val('phone')));
      let job = clean(val('job'));
      const room = limit - (T.prefix || '').length - rest.reduce((n, r) => n + r.length + 2, 0) - 1;
      if (job.length > room) job = job.slice(0, Math.max(20, room - 1)).replace(/\s+\S*$/, '') + '…';   // the job gives way first
      return ([(T.prefix || '') + job].concat(rest).join('. ') + '.').replace('…. ', '… ').slice(0, limit);
    };
    let unwatch = null;   // the last send's listeners; a new send replaces them
    form.addEventListener('submit', e => {
      e.preventDefault(); fail.hidden = true;
      if (unwatch) { unwatch(); unwatch = null; }
      if (!val('job')) { form.classList.add('need-job'); openRow(job); job.focus(); say(F.need_job, 'warn'); return; }
      form.classList.remove('need-job');
      current.body = ticket(600);
      if (LAPTOP()) { meter('laptop-door', 'quote', false); openDoor(current.body, ticket(150)); say(F.status_laptop); return; }
      meter('send', 'quote', true);
      // did a text app really open? Opening one hides this page or takes its focus, whenever that happens (a slow phone
      // can take seconds), so the listeners stay on until the next send. "No text app opened" waits 2.5 s, and the
      // moment the page goes hidden or loses focus it clears: hidden = the app opened ("ready, hit Send"); focus lost
      // alone claims nothing (critic 11/7: the 1.6 s listener left the failure up for good when the app opened late).
      let left = false, t = 0;
      const gone = hidden => {
        if (left && !hidden) return;
        clearTimeout(t); fail.hidden = true;
        if (hidden) { left = true; say(F.success_touch); } else if (st.dataset.tone === 'warn') say('');
      };
      const onVis = () => { if (document.visibilityState === 'hidden') gone(true); };
      const onBlur = () => gone(false);
      document.addEventListener('visibilitychange', onVis); addEventListener('blur', onBlur);
      unwatch = () => { clearTimeout(t); document.removeEventListener('visibilitychange', onVis); removeEventListener('blur', onBlur); };
      say('');
      t = setTimeout(() => { if (!left) { say(F.fail_touch, 'warn'); fail.hidden = false; } }, 2500);
      location.href = SMS + '?&body=' + encodeURIComponent(current.body);
    });
  }

  // ── navigation: mark the part of the page you are in (navigation card: never make them ask "where am I?")
  const links = [...document.querySelectorAll('#main-nav a[href^="#"]:not(.btn)')];
  const pairs = links.map(a => [a, document.querySelector(a.getAttribute('href'))]).filter(p => p[1]);
  if (pairs.length) {
    let raf = 0;
    const spy = () => { raf = 0; const mid = innerHeight * 0.45;
      pairs.forEach(([a, t]) => { const r = t.getBoundingClientRect(); if (r.top <= mid && r.bottom >= mid) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); }); };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(spy); }, { passive: true });
    addEventListener('resize', spy); spy();
  }
})();
