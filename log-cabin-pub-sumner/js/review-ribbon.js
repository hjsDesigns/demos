/* Friday finish: saved review pace, progressively enhanced; no playback controls. */
(function () {
  'use strict';
  document.querySelectorAll('[data-review-ribbon]').forEach(function (rail) {
    var track = rail.querySelector('.review-track');
    var group = rail.querySelector('.review-group');
    if (!track || !group) return;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    var speed = Number(rail.dataset.pixelsPerSecond) || 40;
    var duplicate = null, distance = 0, frame = 0, previous = 0;
    var carry = 0;
    var hover = false, touch = false, focus = false, visible = true, keyboard = false;
    function measure() {
      distance = group.getBoundingClientRect().width + (parseFloat(getComputedStyle(track).columnGap) || 0);
      if (distance > 0 && rail.scrollLeft >= distance) rail.scrollLeft %= distance;
    }
    function tick(time) {
      if (!reduced.matches && distance > 0 && visible && !document.hidden && !hover && !touch && !focus) {
        var delta = previous ? Math.min(time - previous, 64) / 1000 : 0;
        carry += speed * delta;
        var step = Math.floor(carry); carry -= step;
        var next = rail.scrollLeft + step;
        rail.scrollLeft = next >= distance ? next - distance : next;
      }
      previous = time;
      frame = requestAnimationFrame(tick);
    }
    function configure() {
      cancelAnimationFrame(frame); previous = 0;
      if (duplicate) duplicate.remove();
      duplicate = null;
      rail.classList.remove('has-ribbon-motion');
      if (reduced.matches) { rail.scrollLeft = 0; return; }
      duplicate = group.cloneNode(true);
      duplicate.setAttribute('aria-hidden', 'true');
      duplicate.setAttribute('inert', '');
      duplicate.querySelectorAll('[id]').forEach(function (el) { el.removeAttribute('id'); });
      duplicate.querySelectorAll('a,button,input,select,textarea,[tabindex]').forEach(function (el) { el.tabIndex = -1; });
      track.appendChild(duplicate);
      rail.classList.add('has-ribbon-motion');
      measure(); frame = requestAnimationFrame(tick);
    }
    rail.addEventListener('pointerenter', function (event) { hover = event.pointerType === 'mouse'; });
    rail.addEventListener('pointerleave', function () { hover = false; });
    rail.addEventListener('touchstart', function () { touch = true; }, {passive:true});
    rail.addEventListener('touchend', function () { touch = false; }, {passive:true});
    rail.addEventListener('touchcancel', function () { touch = false; }, {passive:true});
    document.addEventListener('keydown', function (event) { if (['Tab','ArrowLeft','ArrowRight','Home','End'].indexOf(event.key) !== -1) { keyboard = true; if (rail.contains(document.activeElement)) focus = true; } });
    document.addEventListener('pointerdown', function () { keyboard = false; focus = false; }, {passive:true});
    rail.addEventListener('focusin', function () { focus = keyboard || rail.matches(':focus-visible'); });
    rail.addEventListener('focusout', function (event) { focus = keyboard && rail.contains(event.relatedTarget); });
    document.addEventListener('visibilitychange', function () { previous = 0; });
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(group);
    else window.addEventListener('resize', measure, {passive:true});
    if ('IntersectionObserver' in window) new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; previous = 0; }).observe(rail);
    if (reduced.addEventListener) reduced.addEventListener('change', configure);
    else reduced.addListener(configure);
    configure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  });
}());
