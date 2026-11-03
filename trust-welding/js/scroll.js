// the flow: the photos scroll past, the panel holds its place and the sections take turns as you get further down
// (Hayden 11/2: "as you scroll, the photos keep going down… after you get to each certain point, sections start popping up").
export function mountFlow(root) {
  const secs = [...root.querySelectorAll('.sec')], photos = root.querySelector('.photos'), dots = root.querySelector('.dots');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (dots) secs.forEach(() => dots.appendChild(document.createElement('i')));
  let cur = -1;
  function show(i) {
    if (i === cur || i < 0 || i >= secs.length) return;
    cur = i;
    secs.forEach((s, j) => s.classList.toggle('is-on', j === i));
    if (dots) [...dots.children].forEach((d, j) => d.classList.toggle('on', j === i));
    if (reduce || !window.gsap) return;
    const s = secs[i];
    gsap.killTweensOf([s, ...s.children]);
    gsap.fromTo(s, { clipPath: 'inset(0 0 100% 0)', y: 14 }, { clipPath: 'inset(0 0 -2% 0)', y: 0, duration: 0.75, ease: 'power3.out', clearProps: 'clipPath' });   // unfolds downward
    gsap.fromTo(s.children, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: 'power2.out', stagger: 0.07, delay: 0.12 });
  }
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.create({
      trigger: photos, start: 'top 70%', end: 'bottom 55%',
      onUpdate: self => show(Math.min(secs.length - 1, Math.floor(self.progress * secs.length)))
    });
    ScrollTrigger.create({ trigger: photos, start: 'top 95%', once: true, onEnter: () => show(0) });
  } else { show(0); }
  return { show };
}
export default mountFlow;
