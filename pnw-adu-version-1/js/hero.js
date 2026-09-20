/* PNW ADU — full-bleed CapCut hero; one play, clean ending, no replay UI. */
(function () {
  'use strict';
  var hero = document.getElementById('hero');
  var video = document.getElementById('heroVideo');
  var control = document.getElementById('heroVideoControl');
  if (!hero || !video || !control) return;

  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  var endPoster = video.poster;
  var wantsPlay = !motion.matches && !saveData;
  var inView = true, finished = false, failed = false, starting = false;
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;

  function markReady() {
    // The example gallery waits for this class before warming its images.
    hero.classList.add('is-done');
  }
  function updateControl() {
    control.hidden = finished || failed;
    control.dataset.paused = String(video.paused);
    control.setAttribute('aria-label', video.paused ? (video.currentTime > 0 ? 'Resume animation' : 'Play animation') : 'Pause animation');
  }
  function tryPlay() {
    if (!wantsPlay || !inView || document.hidden || finished || failed || starting) return;
    starting = true;
    var request = video.play();
    if (request && request.then) {
      request.then(function () { starting = false; }, function (error) {
        starting = false;
        if (error.name === 'AbortError') return;
        wantsPlay = false;
        video.poster = endPoster;
        markReady();
        updateControl();
      });
    } else starting = false;
  }
  function syncVisibility() {
    if (document.hidden || !inView) video.pause();
    else tryPlay();
  }

  control.addEventListener('click', function () {
    if (!video.paused) {
      wantsPlay = false;
      video.pause();
    } else {
      if (finished || failed) return;
      wantsPlay = true;
      tryPlay();
    }
  });
  video.addEventListener('playing', updateControl);
  video.addEventListener('pause', updateControl);
  video.addEventListener('ended', function () {
    finished = true;
    wantsPlay = false;
    markReady();
    updateControl();
  });
  function onError() {
    failed = true;
    wantsPlay = false;
    video.pause();
    video.hidden = true;
    document.getElementById('heroPoster').hidden = false;
    hero.style.setProperty('--hero-focus', '40%');
    control.hidden = true;
    markReady();
  }
  video.addEventListener('error', onError);
  var source = video.querySelector('source');
  if (source) source.addEventListener('error', onError);
  document.addEventListener('visibilitychange', syncVisibility);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      syncVisibility();
    }, { threshold: 0 }).observe(video);
  }
  function onMotionChange() {
    if (motion.matches) {
      wantsPlay = false;
      video.pause();
      markReady();
    }
  }
  if (motion.addEventListener) motion.addEventListener('change', onMotionChange);
  else motion.addListener(onMotionChange);

  // No JavaScript, reduced motion, or failed media retains a clean poster.
  video.controls = false;
  if (wantsPlay) {
    video.poster = video.dataset.openingPoster;
    tryPlay();
  } else { markReady(); updateControl(); }

  // Portrait-to-wide cover framing follows the assembly center, then eases
  // back to the finished house. The clip's playback rate and cuts stay intact.
  function frameFocus() {
    if (failed) return;
    var t = video.currentTime;
    var rise = Math.max(0, Math.min(1, (t - 1) / 1.1));
    var fall = Math.max(0, Math.min(1, (t - 5) / .7));
    function smooth(x) { return x * x * (3 - 2 * x); }
    var focus = 40 + 9 * smooth(rise) * (1 - smooth(fall));
    hero.style.setProperty('--hero-focus', focus.toFixed(2) + '%');
  }
  video.addEventListener('timeupdate', frameFocus);
  if (video.requestVideoFrameCallback) {
    function frame() { frameFocus(); video.requestVideoFrameCallback(frame); }
    video.requestVideoFrameCallback(frame);
  }
})();
