/* Trust Welding · the learned pass (11/5): the opening through the hood, the Colibri story, the gadget, the arc band, the thumb bar */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SMS = (document.querySelector('a[href^="sms:"]') || {}).getAttribute ? document.querySelector('a[href^="sms:"]').getAttribute('href').split('?')[0] : 'sms:+14252836496';
  // 1 · the opening: his numbers (three strikes), the bead take through the hood, ending on the still; scroll, tap or Skip ends it early
  const op = document.getElementById('opening');
  if (op && !reduce) {
    import('./vendor/opening/anim.js').then(({ mount }) => mount(op, 'bead', { assets: 'images/opening/', onDone: () => { op.classList.add('is-gone'); setTimeout(() => op.remove(), 900); } }))
      .then(h => { if (!h) return; const end = () => h.skip(); op.querySelector('.skip').addEventListener('click', end); ['wheel', 'touchstart', 'keydown'].forEach(ev => addEventListener(ev, end, { once: true, passive: true })); })
      .catch(() => op.remove());
  } else if (op) op.remove();
  // 2 · the story: one real job by scroll (layout-sections trial constants)
  if (window.gsap && window.ScrollTrigger && !reduce) {
    gsap.registerPlugin(ScrollTrigger);
    const figs = gsap.utils.toArray('.story .shot figure'), steps = gsap.utils.toArray('.story .step'), ticks = gsap.utils.toArray('.story .ticks i'), seam = document.querySelector('.story .seam'), stamps = gsap.utils.toArray('.story .stamp span');
    if (figs.length > 1) {
      const tl = gsap.timeline({ defaults: { ease: 'none' } });
      tl.to('.story .rail i', { scaleY: 1, duration: 3.6 }, 0);
      for (let i = 1; i < figs.length; i++) {
        const t = i - 0.55;
        tl.fromTo(figs[i], { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.42, ease: 'power1.inOut' }, t)
          .fromTo(seam, { top: '0%', opacity: 1 }, { top: '100%', duration: 0.42, ease: 'power1.inOut' }, t).to(seam, { opacity: 0, duration: 0.08 }, t + 0.42)
          .to(steps[i - 1], { rotateX: 72, opacity: 0, duration: 0.2, ease: 'power2.in' }, t).fromTo(steps[i], { rotateX: -78, opacity: 0 }, { rotateX: 0, opacity: 1, duration: 0.26, ease: 'power2.out' }, t + 0.18)
          .to(stamps[i - 1], { opacity: 0, duration: 0.12 }, t + 0.1).fromTo(stamps[i], { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: 0.18, ease: 'power3.out' }, t + 0.22);
      }
      tl.to({}, { duration: 0.4 });
      ScrollTrigger.create({ trigger: '.story', start: 'top top', end: 'bottom bottom', scrub: 0.35, animation: tl, onUpdate: self => { const n = Math.min(ticks.length - 1, Math.floor(self.progress * ticks.length + 0.15)); ticks.forEach((el, k) => el.classList.toggle('on', k <= n)); window.__storyProgress = self.progress; if (window.__barBlock) { window.__barBlock.storyEnd = self.progress > 0.72 && window.__stageUp && window.__stageUp(); window.__syncBar && window.__syncBar(); } } });
    }
  }
  // 3 · the gadget: his real jobs as the answer to "can you weld this?"
  const g = document.getElementById('whats-the-job');
  if (g && window.WTJ) {
    const P = f => 'images/work/phone/' + f + '.jpg';
    WTJ.mount(g, { total: 11, totalLabel: 'Tap the kind of job you have.', sparks: false, plate: new URL('images/texture/panel-steel.jpg', document.baseURI).href, sms: SMS, button: 'Text Trustin a photo', smsBody: x => "Hi Trustin, I've got a " + x.ask + ". Here's a photo:",
      groups: [
        { key: 'truck', label: 'Truck', alt: "Trustin's work on a Duramax pickup", cover: P('track-bars-duramax'), noun: '', ask: 'truck job', jobs: [{ src: P('track-bars-2'), caption: 'Track bars · on the truck' }, { src: P('track-bars-3'), caption: 'Track bars · the welds' }, { src: P('headache-rack'), caption: 'Headache rack' }, { src: P('aluminum-roof-rack-bars'), caption: 'Aluminum roof-rack bars', pos: '60% 40%' }, { src: P('d-rings-roll-off-bed'), caption: 'D-rings · roll-off bed' }] },
        { key: 'equipment', label: 'Equipment', alt: 'A Cat engine on a steel motor mount', cover: P('motor-mount-cat-rebuild'), noun: '', ask: 'equipment job', jobs: [{ src: P('gantry-lift'), caption: 'Gantry lift' }, { src: P('gantry-lift-2'), caption: 'Gantry lift · second view' }, { src: P('gantry-lift-3'), caption: 'Gantry lift · the frame' }] },
        { key: 'outdoor', label: 'Outdoor', alt: 'Corten steel fire-pit cladding', cover: P('corten-fire-pit-snohomish'), noun: '', ask: 'yard or building job', jobs: [{ src: P('corten-fire-pit-2'), caption: 'Corten fire pit · the cladding, close' }, { src: P('steel-planter-boxes'), caption: 'Steel planter boxes', pos: '50% 70%' }] },
        { key: 'signs', label: 'Signs & installs', alt: 'A custom steel sign for Hopper Group', cover: P('custom-sign-hopper-group'), noun: '', ask: 'sign, cut-out or install job', jobs: [{ src: P('custom-sign-hopper-2'), caption: 'Custom sign · in place' }, { src: P('mariners-trident-door'), caption: 'Trident cut-out · a cocktail door' }, { src: P('mariners-trident-2'), caption: 'Trident cut-out · second piece' }, { src: P('premier-chiropractic-install'), caption: 'Install · Premier Chiropractic', pos: '50% 75%' }] }
      ] });
  }
  // 5 · the thumb bar: text or call under the thumb once the hero is gone, hidden while the quote section is on screen
  const tb = document.getElementById('thumb');
  const blockers = ['hero', 'quote'].map(id => document.getElementById(id)).filter(Boolean);
  if (tb && blockers.length && 'IntersectionObserver' in window) {   // the bar hides only where Text/Call is already on screen: the hero, the quote, the story's last step, the gadget's result
    const on = new Map(blockers.map(b => [b, b.id === 'hero'])); window.__barBlock = { storyEnd: false, gadget: false };
    const sync = () => { const show = ![...on.values()].some(Boolean) && !window.__barBlock.storyEnd && !window.__barBlock.gadget && !window.__barBlock.panelDoor; tb.classList.toggle('is-on', show); document.body.classList.toggle('thumb-on', show); };
    window.__syncBar = sync;
    const io = new IntersectionObserver(es => { es.forEach(e => on.set(e.target, e.isIntersecting)); sync(); }, { threshold: 0.08 });
    blockers.forEach(b => io.observe(b));
    const wtj = document.getElementById('whats-the-job'), showEl = wtj && wtj.querySelector('.wtj-show');
    const stage = wtj && wtj.querySelector('.wtj-stage');
    const gadgetUp = () => { if (!wtj || !stage) return false; const r = wtj.getBoundingClientRect(); return stage.hasAttribute('data-on') && r.top < innerHeight && r.bottom > 0; };
    const stageEl = document.querySelector('.story .stage');
    window.__stageUp = () => { if (!stageEl) return false; const r = stageEl.getBoundingClientRect(); return r.bottom > innerHeight * 0.45 && r.top < innerHeight * 0.55; };   // its Text/Call must really be in view   // the story's last step stays pinned after its trigger ends
    if (wtj) new MutationObserver(() => { window.__barBlock.gadget = gadgetUp(); sync(); }).observe(wtj, { attributes: true, subtree: true, attributeFilter: ['data-on', 'class'] });
    const panelEl = document.querySelector('.panel');
    window.__barBlock.panelDoor = false;
    const panelDoorUp = () => { const on = document.querySelector('.sec.is-on'); if (!on || !on.querySelector('.ways') || !panelEl) return false; const r = panelEl.getBoundingClientRect(); return r.bottom > innerHeight * 0.45 && r.top < innerHeight * 0.85; };   // the panel's own Text/Call is on screen
    const syncAll = () => { window.__barBlock.gadget = gadgetUp(); window.__barBlock.storyEnd = (window.__storyProgress || 0) > 0.72 && window.__stageUp(); window.__barBlock.panelDoor = panelDoorUp(); sync(); };
    addEventListener('scroll', syncAll, { passive: true }); setInterval(syncAll, 600);
  }
})();
