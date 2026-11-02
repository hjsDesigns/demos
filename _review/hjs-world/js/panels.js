/* The four districts' content. Clicking a pin flies you there and opens its panel.
 * Facts are Hayden's own, from the factory constitution: the pricing law (2026-09-04), the
 * 10/12 decision that the two monthly packages lead and the social package is off the site
 * for now, his real number and address, and the towns he serves.
 */
export const PANELS = {
  'The Work': {
    kicker: 'The work',
    title: 'Sites already standing.',
    lede: 'Real businesses on the Plateau, built and live. Not mockups — pages you can open right now.',
    blocks: [
      { h:'What a build includes', p:'Every page written from your own hours, photos and words. Real reviews with real names and faces. A live open/closed band. One signature piece that belongs only to you.' },
      { h:'How long it takes', p:'A first version in days, not months. You look at it, we change what you want, then it goes live.' }
    ],
    cta: { label:'See the builds ↗', href:'https://hjsdesigns.github.io/demos/' }
  },
  'Packages': {
    kicker: 'Packages',
    title: 'The site, then the upkeep.',
    lede: 'One build, and two monthly options that keep it working after launch. Month to month, cancel any time, quoted plus tax.',
    blocks: [
      { h:'The site', p:'$500–$1,000 standard · $1,000–$3,000 premium · $3,000+ for a custom build.' },
      { h:'Google listing', p:'Your listing kept current — hours, photos, posts, questions answered. It is the first thing most people see, and most of them never get past it.' },
      { h:'Phone package', p:'So nobody who finds you reaches a dead end. Calls and texts answered and handed to you.' },
      { h:'Care', p:'$50–$100 basic for hosting and swaps · $100–$250 active for menus, specials and the listing.' }
    ],
    cta: { label:'Call or text (253) 259-4558', href:'tel:+12532594558' }
  },
  'About Hayden': {
    kicker: 'About',
    title: 'One person, and he answers his own phone.',
    lede: 'Hayden Stevenson. I build websites for local shops, trades and restaurants on the Plateau — the kind of site that brings the phone call in, not a template with your name dropped into it.',
    blocks: [
      { h:'Why local only', p:'Because I can stand in your room. The site should feel the way the place feels when you walk in, and you cannot get that off a questionnaire.' },
      { h:'What you deal with', p:'Me. Not an account manager, not a ticket queue. You call, I pick up.' }
    ],
    cta: { label:'hjsdesignsco@gmail.com', href:'mailto:hjsdesignsco@gmail.com' }
  },
  'Get in touch': {
    kicker: 'Get in touch',
    title: 'Tell me about the place.',
    lede: 'Call or text and tell me what you do and what you need. If a site is not the right move for you yet, I will say so.',
    blocks: [
      { h:'Towns I cover', p:'Enumclaw · Buckley · Bonney Lake · Sumner · Puyallup · Auburn · Orting · Black Diamond' },
      { h:'Fastest way', p:'A text. Say the business name and I will look it up before I call you back.' }
    ],
    cta: { label:'Call or text (253) 259-4558', href:'tel:+12532594558' },
    cta2:{ label:'Email me', href:'mailto:hjsdesignsco@gmail.com' }
  }
};

export function mountPanels(){
  const wrap = document.createElement('div');
  wrap.id = 'panel';
  wrap.innerHTML = `<button id="panelX" type="button" aria-label="Close">&times;</button><div id="panelBody"></div>`;
  document.body.appendChild(wrap);

  const css = document.createElement('style');
  css.textContent = `
  #panel{position:fixed;right:0;top:0;bottom:0;width:min(470px,92vw);z-index:15;
    background:rgba(10,16,13,.93);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
    border-left:1px solid rgba(167,192,163,.22);transform:translateX(104%);
    transition:transform .5s cubic-bezier(.22,.8,.3,1);overflow-y:auto;overscroll-behavior:contain;
    padding:clamp(30px,5vw,52px) clamp(22px,4vw,44px) 60px;pointer-events:auto}
  #panel.on{transform:translateX(0)}
  #panelX{position:absolute;right:16px;top:14px;width:34px;height:34px;border-radius:50%;
    border:1px solid rgba(167,192,163,.25);background:transparent;color:#A7C0A3;font-size:19px;
    line-height:1;cursor:pointer;transition:.16s}
  #panelX:hover{background:#A7C0A3;color:#14211A;border-color:#A7C0A3}
  #panel .k{font-size:.63rem;letter-spacing:.24em;text-transform:uppercase;color:#5E7F5F;
    font-weight:600;margin:0 0 12px}
  #panel h2{font-size:clamp(1.4rem,3.4vw,2rem);line-height:1.2;font-weight:500;margin:0 0 14px;color:#F4EEDC}
  #panel .lede{font-size:.92rem;line-height:1.65;color:#BFC6B6;margin:0 0 26px}
  #panel .b{padding:17px 0;border-top:1px solid rgba(167,192,163,.14)}
  #panel .b h3{margin:0 0 6px;font-size:.84rem;font-weight:600;color:#F2EDE0;letter-spacing:.01em}
  #panel .b p{margin:0;font-size:.86rem;line-height:1.6;color:#9FAD98}
  #panel .acts{display:flex;gap:9px;flex-wrap:wrap;margin-top:26px}
  #panel .acts a{flex:1 1 170px;text-align:center;text-decoration:none;font-weight:600;font-size:.86rem;
    padding:14px 18px;border-radius:99px;background:#F2EDE0;color:#16281F;transition:.16s}
  #panel .acts a+a{background:transparent;color:#F2EDE0;border:1px solid rgba(167,192,163,.3)}
  #panel .acts a:hover{background:#fff}
  #panel .acts a+a:hover{background:rgba(167,192,163,.14);color:#F2EDE0}
  @media(max-width:560px){#panel{width:100%;border-left:0}}`;
  document.head.appendChild(css);

  const body = document.getElementById('panelBody');
  const close = () => wrap.classList.remove('on');
  document.getElementById('panelX').onclick = close;
  addEventListener('keydown', e => { if(e.key === 'Escape') close(); });

  return {
    open(name){
      const d = PANELS[name]; if(!d) return;
      body.innerHTML =
        `<p class="k">${d.kicker}</p><h2>${d.title}</h2><p class="lede">${d.lede}</p>` +
        d.blocks.map(b => `<div class="b"><h3>${b.h}</h3><p>${b.p}</p></div>`).join('') +
        `<div class="acts"><a href="${d.cta.href}"${d.cta.href.startsWith('http')?' target="_blank" rel="noopener"':''}>${d.cta.label}</a>` +
        (d.cta2 ? `<a href="${d.cta2.href}">${d.cta2.label}</a>` : '') + `</div>`;
      wrap.classList.add('on');
    },
    close
  };
}
