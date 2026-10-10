/* A single tap exchanges a real photo; no navigation or automatic rotation. */
(function () {
  const buttons = Array.from(document.querySelectorAll('[data-moment]'));
  const photos = Array.from(document.querySelectorAll('[data-moment-photo]'));
  const announcement = document.getElementById('moment-announcement');
  if (!buttons.length || !photos.length) return;
  photos.forEach(figure => {
    const photo = figure.querySelector('img');
    const preload = new Image();
    preload.src = photo.src;
  });
  buttons.forEach(button => button.addEventListener('click', () => {
    const choice = button.dataset.moment;
    buttons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    photos.forEach(figure => { figure.hidden = figure.dataset.momentPhoto !== choice; });
    if (announcement) announcement.textContent = 'Showing: ' + button.textContent.trim();
  }));
})();
