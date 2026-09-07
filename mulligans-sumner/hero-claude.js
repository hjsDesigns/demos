/* ============================================================
   MULLIGANS — hero.js
   The intro itself is pure CSS and is armed inline at parse time, so it
   never depends on this file. All this does is hold the animation where
   it is while the tab is hidden, so a visitor who tabs away and comes
   back still sees the mark being written instead of a finished frame.
   No libraries, no randomness, nothing interactive.
   ============================================================ */
(function () {
  var hero = document.getElementById('hero');
  if (!hero) return;
  document.addEventListener('visibilitychange', function () {
    hero.classList.toggle('mg-hold', document.hidden);
  });
  if (document.hidden) hero.classList.add('mg-hold');
})();
