/* The landscape moves behind the foreground river lines, only with a visitor's
   pointer or scrolling. No perpetual animation, timers, trackers or requests. */
(() => {
  const hero = document.querySelector('.hero-adventure');
  if (!hero) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  let x = 0, y = 0, frame = 0;
  const paint = () => {
    frame = 0;
    const rect = hero.getBoundingClientRect();
    if (motion.matches || rect.bottom < 0) return;
    hero.style.setProperty('--hero-x', `${x.toFixed(2)}px`);
    hero.style.setProperty('--hero-y', `${y.toFixed(2)}px`);
    const scroll = Math.max(0, Math.min(1, -rect.top / rect.height));
    hero.style.setProperty('--trail-shift', `${(scroll * 16).toFixed(2)}px`);
  };
  const request = () => { if (!frame && !motion.matches) frame = requestAnimationFrame(paint); };
  hero.addEventListener('pointermove', event => {
    if (!fine.matches || motion.matches) return;
    const rect = hero.getBoundingClientRect();
    x = ((event.clientX - rect.left) / rect.width - .5) * -9;
    y = ((event.clientY - rect.top) / rect.height - .5) * -7;
    request();
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { x = y = 0; request(); }, { passive: true });
  window.addEventListener('scroll', request, { passive: true });
  motion.addEventListener('change', () => {
    x = y = 0;
    hero.style.removeProperty('--hero-x');
    hero.style.removeProperty('--hero-y');
    hero.style.removeProperty('--trail-shift');
    request();
  });
})();
