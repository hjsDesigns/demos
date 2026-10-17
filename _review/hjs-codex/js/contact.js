/* Contact stays a draft. No server submission, tracking or automatic message send. */
(() => {
  document.querySelectorAll('[data-contact-form]').forEach(form => {
    const panel = form.parentElement.querySelector('[data-draft]');
    if (!panel) return;
    const text = panel.querySelector('[data-draft-text]');
    const open = panel.querySelector('[data-draft-open]');
    const status = panel.querySelector('[data-draft-status]');
    const copy = panel.querySelector('[data-copy-draft]');
    let draft = '';
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const value = key => String(data.get(key) || '').trim();
      if (!value('business')) {
        const field = form.querySelector('[name="business"]');
        field.setCustomValidity('Please enter your business name.');
        field.reportValidity();
        return;
      }
      if (form.dataset.contactForm === 'listing') {
        if (!value('town')) {
          const field = form.querySelector('[name="town"]');
          field.setCustomValidity('Please enter your town.'); field.reportValidity(); return;
        }
        draft = `Hey Hayden, could you check the Google listing for ${value('business')} in ${value('town')}?${value('link') ? '\nHere’s the link: ' + value('link') : ''}`;
      } else {
        draft = `Hey Hayden, this is ${value('business')}. Could we arrange a walk-in? ${value('day') === 'Any day' ? 'Any day' : value('day')} in the ${value('time').toLowerCase()} is best for me.${value('message') ? '\n' + value('message') : ''}`;
      }
      text.textContent = draft;
      // iOS/macOS use an ampersand for body; Android uses a query separator.
      const android = /Android/i.test(navigator.userAgent);
      open.href = 'sms:+12532594558' + (android ? '?body=' : '&body=') + encodeURIComponent(draft);
      status.textContent = 'Nothing has been sent. Review your text, then open Messages or copy it.';
      panel.hidden = false;
      panel.tabIndex = -1;
      panel.focus({preventScroll:true});
      panel.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
    });
    form.addEventListener('input', event => { if (event.target.setCustomValidity) event.target.setCustomValidity(''); });
    copy.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(draft); status.textContent = 'Copied. Paste it into a text or email to Hayden.'; }
      catch (_) {
        const selection = window.getSelection(); const range = document.createRange(); range.selectNodeContents(text); selection.removeAllRanges(); selection.addRange(range);
        status.textContent = 'Text selected. Use Copy, then paste it into your message.';
      }
    });
  });
  document.documentElement.classList.add('contact-ready');
})();
