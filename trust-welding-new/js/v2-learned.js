/* Trust Welding · version 2 (11/7): js/learned.js copied, never edited in place (version 1 still loads the original).
   Kept: the gadget (Hayden 11/5–11/6: categories and job names, no counts) and the thumb bar's hide rules.
   Changed: every word the gadget shows comes from window.TW_COPY.gadget (the COPY block in build-new-skills.py),
   so the copy team's words drop in without touching code. Dropped: the old hood opening (#opening; v2 runs the filmed
   opening, js/opening-video.js) and the Colibri story (out since 11/5); both were no-ops on this page. */
(function () {
  const C = window.TW_COPY || {};
  const SMS = (C.contact && C.contact.sms) || 'sms:+14252836496';

  // 3 · the gadget: his real jobs as the answer to "can you weld this?"
  const g = document.getElementById('whats-the-job'), G = C.gadget;
  if (g && window.WTJ && G) {
    const P = f => 'images/work/phone/' + f + '.jpg';
    WTJ.mount(g, { total: '', totalLabel: G.idle, sparks: false, plate: new URL('images/texture/panel-steel.jpg', document.baseURI).href,
      sms: SMS, button: G.button, smsBody: x => G.sms_body.replace('{ask}', x.ask),
      groups: G.groups.map(gr => ({ key: gr.key, label: gr.label, alt: gr.alt, cover: P(gr.cover), noun: '', ask: gr.ask,
        jobs: gr.jobs.map(j => ({ src: P(j.file), caption: j.caption, pos: j.pos })) })) });
    // the idle number is hidden (Hayden 11/5: no counts); keep it out of the accessibility tree too
    const big = g.querySelector('.wtj-big'); if (big) big.setAttribute('aria-hidden', 'true');
  }

  // 5 · the thumb bar: text or call under the thumb once the hero is gone, hidden where Text/Call is already on screen
  const tb = document.getElementById('thumb');
  const blockers = ['hero', 'quote'].map(id => document.getElementById(id)).filter(Boolean);
  if (tb && blockers.length && 'IntersectionObserver' in window) {
    const on = new Map(blockers.map(b => [b, b.id === 'hero'])); window.__barBlock = { gadget: false, panelDoor: false };
    const sync = () => { const show = ![...on.values()].some(Boolean) && !window.__barBlock.gadget && !window.__barBlock.panelDoor; tb.classList.toggle('is-on', show); document.body.classList.toggle('thumb-on', show); };
    window.__syncBar = sync;
    const io = new IntersectionObserver(es => { es.forEach(e => on.set(e.target, e.isIntersecting)); sync(); }, { threshold: 0.08 });
    blockers.forEach(b => io.observe(b));
    const wtj = document.getElementById('whats-the-job'), stage = wtj && wtj.querySelector('.wtj-stage');
    const gadgetUp = () => { if (!wtj || !stage) return false; const r = wtj.getBoundingClientRect(); return stage.hasAttribute('data-on') && r.top < innerHeight && r.bottom > 0; };
    if (wtj) new MutationObserver(() => { window.__barBlock.gadget = gadgetUp(); sync(); }).observe(wtj, { attributes: true, subtree: true, attributeFilter: ['data-on', 'class'] });
    const panelEl = document.querySelector('.panel');
    const panelDoorUp = () => { const s = document.querySelector('.sec.is-on'); if (!s || !s.querySelector('.ways') || !panelEl) return false; const r = panelEl.getBoundingClientRect(); return r.bottom > innerHeight * 0.45 && r.top < innerHeight * 0.85; };
    let raf = 0;
    const syncAll = () => { raf = 0; window.__barBlock.gadget = gadgetUp(); window.__barBlock.panelDoor = panelDoorUp(); sync(); };
    // one check per frame while scrolling (performance-phone: no 600 ms polling timer in v2)
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(syncAll); }, { passive: true });
    addEventListener('resize', syncAll); syncAll();
    // the stage's words change on the scrub's catch-up, after the last scroll event; the stage script says so (no polling)
    document.addEventListener('tw:section', () => { if (!raf) raf = requestAnimationFrame(syncAll); });
  }
})();
