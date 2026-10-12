/* A single divider: full After at the left edge, full Before at the right. */
(function () {
  'use strict';
  var frame = document.getElementById('lashCompare');
  if (!frame) return;
  var range = frame.querySelector('input[type="range"]');
  var dragging = null;
  function render(value) {
    value = Math.max(0, Math.min(100, Number(value)));
    range.value = value;
    value = Number(range.value);
    frame.style.setProperty('--cut', value + '%');
    range.setAttribute('aria-valuetext', value === 0 ? 'After image, full view' : value === 100 ? 'Before image, full view' : value + '% before, ' + (100 - value) + '% after');
  }
  function atPointer(event) {
    var rect = frame.getBoundingClientRect();
    render((event.clientX - rect.left) / rect.width * 100);
  }
  range.addEventListener('input', function () { render(range.value); });
  range.addEventListener('pointerdown', function (event) {
    if (event.button !== 0) return;
    event.preventDefault();
    dragging = event.pointerId;
    range.focus({preventScroll:true});
    range.setPointerCapture(dragging);
    atPointer(event);
  });
  range.addEventListener('pointermove', function (event) {
    if (event.pointerId === dragging) atPointer(event);
  });
  function release(event) {
    if (event.pointerId !== dragging) return;
    if (event.type === 'pointerup') atPointer(event);
    if (range.hasPointerCapture(dragging)) range.releasePointerCapture(dragging);
    dragging = null;
  }
  range.addEventListener('pointerup', release);
  range.addEventListener('pointercancel', release);
  range.addEventListener('lostpointercapture', function () { dragging = null; });
  render(range.value);
})();
