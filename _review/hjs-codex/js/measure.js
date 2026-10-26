/* HJS Designs — counted hand-offs (the meter, named on day 0).
   Every text / call / email tap is reported to whatever analytics the page has (gtag or plausible).
   No analytics is installed yet, so this does nothing today; it never records who tapped or what they typed. */
(function () {
  function send(name, props) {
    try { if (window.gtag) { window.gtag('event', name, props); } } catch (e) {}
    try { if (window.plausible) { window.plausible(name, { props: props }); } } catch (e) {}
  }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href^="sms:"],a[href^="tel:"],a[href^="mailto:"]') : null;
    if (!a) { return; }
    var kind = (a.getAttribute('href') || '').split(':')[0];
    var box = a.closest('section,header,footer,dialog');
    var where = a.getAttribute('data-measure') || (box && (box.id || (box.className || '').split(' ')[0])) || 'page';
    var props = { page: document.body.getAttribute('data-page') || '', where: where };
    send(kind + '_tap', props);
    if (kind === 'sms') { send('generate_lead', props); }
  }, true);
})();
