/* Mobile navigation — toggle, Escape, outside click, resize reset.
   Progressive: with JS off the nav is a plain visible list. */
(function () {
  var btn = document.querySelector('.nav-toggle');
  var nav = document.getElementById('main-nav');
  if (!btn || !nav) return;

  function set(open) {
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    nav.classList.toggle('open', open);
  }

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    set(btn.getAttribute('aria-expanded') !== 'true');
  });

  document.addEventListener('click', function (e) {
    if (nav.classList.contains('open') && !nav.contains(e.target)) set(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('open')) { set(false); btn.focus(); }
  });

  /* Dragging the window back to desktop must not leave the panel stuck open. */
  var wide = window.matchMedia('(min-width:861px)');
  (wide.addEventListener ? wide.addEventListener.bind(wide, 'change')
                         : wide.addListener.bind(wide))(function () { set(false); });
})();
