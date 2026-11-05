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
      ScrollTrigger.create({ trigger: '.story', start: 'top top', end: 'bottom bottom', scrub: 0.35, animation: tl, onUpdate: self => { const n = Math.min(ticks.length - 1, Math.floor(self.progress * ticks.length + 0.15)); ticks.forEach((el, k) => el.classList.toggle('on', k <= n)); } });
    }
  }
  // 3 · the gadget: his real jobs as the answer to "can you weld this?"
  const g = document.getElementById('whats-the-job');
  if (g && window.WTJ) {
    const P = f => 'images/work/phone/' + f + '.jpg';
    WTJ.mount(g, { total: 11, totalLabel: 'jobs posted · pick yours', plate: new URL('images/texture/panel-steel.jpg', document.baseURI).href, sms: SMS, button: 'Text Trustin a photo', smsBody: x => "Hi Trustin, I've got a " + x.ask + ". Here's a photo:",
      groups: [
        { key: 'truck', label: 'Truck', alt: "Trustin's work on a Duramax pickup", cover: P('track-bars-duramax'), noun: 'truck jobs posted', ask: 'truck job', jobs: [{ src: P('track-bars-duramax'), caption: 'Track bars · Duramax LBZ', pos: '30% 60%' }, { src: P('headache-rack'), caption: 'Headache rack' }, { src: P('aluminum-roof-rack-bars'), caption: 'Aluminum roof-rack bars', pos: '60% 40%' }] },
        { key: 'equipment', label: 'Equipment', alt: 'A Cat engine on a steel motor mount', cover: P('motor-mount-cat-rebuild'), noun: 'equipment jobs posted', ask: 'equipment job', jobs: [{ src: P('d-rings-roll-off-bed'), caption: 'D-rings · roll-off bed' }, { src: P('gantry-lift'), caption: 'Gantry lift' }, { src: P('motor-mount-cat-rebuild'), caption: 'Motor mount · Cat rebuild', pos: '62% 40%' }] },
        { key: 'outdoor', label: 'Outdoor', alt: 'Corten steel fire-pit cladding', cover: P('corten-fire-pit-snohomish'), noun: 'outdoor jobs posted', ask: 'yard or building job', jobs: [{ src: P('corten-fire-pit-snohomish'), caption: 'Corten fire pit · Snohomish' }, { src: P('steel-planter-boxes'), caption: 'Steel planter boxes', pos: '50% 70%' }, { src: P('premier-chiropractic-install'), caption: 'Premier Chiropractic install', pos: '50% 75%' }] },
        { key: 'signs', label: 'Signs', alt: 'A custom steel sign for Hopper Group', cover: P('custom-sign-hopper-group'), noun: 'sign jobs posted', ask: 'sign or cut-out job', jobs: [{ src: P('custom-sign-hopper-group'), caption: 'Custom sign · Hopper Group' }, { src: P('mariners-trident-door'), caption: 'Trident cut-out · the cocktail door' }] }
      ] });
  }
  // 4 · the arc band under the quote (desktop only; one WebGL canvas, paused off-screen)
  const arc = document.getElementById('arc');
  if (arc && !reduce && innerWidth > 760) import('./vendor/molten/molten-metal.js').then(({ createMoltenMetal }) => {
    const mm = createMoltenMetal(arc, { colors: ['#24B7CA', '#FF7A1A'], coreColor: '#FFFFFF', backgroundColor: '#0A0C0E', speed: 0.25 });
    new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? mm.resume() : mm.pause()), { threshold: 0.05 }).observe(arc);
  }).catch(() => {});
  // 5 · the thumb bar: text or call under the thumb once the hero is gone, hidden while the quote section is on screen
  const tb = document.getElementById('thumb'), hero = document.getElementById('hero'), quote = document.getElementById('quote');
  if (tb && hero && quote && 'IntersectionObserver' in window) {
    let heroIn = true, quoteIn = false;
    const io = new IntersectionObserver(es => { es.forEach(e => { if (e.target === hero) heroIn = e.isIntersecting; if (e.target === quote) quoteIn = e.isIntersecting; }); tb.classList.toggle('is-on', !heroIn && !quoteIn); }, { threshold: 0.12 });
    io.observe(hero); io.observe(quote);
  }
})();
