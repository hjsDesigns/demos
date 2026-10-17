/* HJS Designs: native scrolling, progressive enhancement, and quiet motion controls. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const onMediaChange = (query, callback) => {
    if (query.addEventListener) query.addEventListener('change', callback);
    else query.addListener(callback);
  };
  const focusable = (container) => Array.from(container.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )).filter((element) => element.getClientRects().length && !element.closest('[inert]'));

  const ambientToggle = document.querySelector('[data-page-motion-toggle]');
  let ambientPaused = false;
  try { ambientPaused = sessionStorage.getItem('hjs-ambient-paused') === 'true'; } catch (error) { /* Storage is optional. */ }
  const syncPageMotion = () => {
    root.dataset.pageMotion = document.hidden || reducedMotion.matches || ambientPaused ? 'paused' : 'running';
    if (ambientToggle) {
      ambientToggle.hidden = reducedMotion.matches;
      ambientToggle.textContent = ambientPaused ? 'Play ambient motion' : 'Pause ambient motion';
      ambientToggle.setAttribute('aria-pressed', String(ambientPaused));
    }
  };
  if (ambientToggle) {
    ambientToggle.type = 'button';
    ambientToggle.addEventListener('click', () => {
      ambientPaused = !ambientPaused;
      try { sessionStorage.setItem('hjs-ambient-paused', String(ambientPaused)); } catch (error) { /* Continue without persistence. */ }
      syncPageMotion();
    });
  }
  syncPageMotion();
  document.addEventListener('visibilitychange', syncPageMotion);
  onMediaChange(reducedMotion, syncPageMotion);

  function enhanceHeader() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    let scheduled = false;
    const update = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 32);
      scheduled = false;
    };
    window.addEventListener('scroll', () => {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    update();

    const toggle = header.querySelector('.nav-toggle');
    const nav = document.getElementById('main-nav');
    if (!toggle || !nav) return;
    const mobile = window.matchMedia('(max-width: 760px)');
    let open = false;

    const setOpen = (next, restoreFocus = false) => {
      open = Boolean(next && mobile.matches);
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      header.dataset.navState = open ? 'open' : 'closed';
      nav.inert = mobile.matches && !open;
      if (restoreFocus && mobile.matches) toggle.focus({ preventScroll: true });
    };

    toggle.type = 'button';
    toggle.addEventListener('click', () => {
      root.classList.add('nav-interacted');
      setOpen(!open);
      if (open) {
        // Wait for visibility to update before moving keyboard focus into the drawer.
        requestAnimationFrame(() => {
          if (open) focusable(nav)[0]?.focus({ preventScroll: true });
        });
      }
    });
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a[href]')) setOpen(false);
    });
    document.addEventListener('click', (event) => {
      if (open && !header.contains(event.target)) setOpen(false);
    });
    document.addEventListener('focusin', (event) => {
      if (open && !header.contains(event.target)) setOpen(false);
    });
    document.addEventListener('keydown', (event) => {
      if (!open) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false, true);
      } else if (event.key === 'Tab') {
        const items = [toggle, ...focusable(nav)];
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
    onMediaChange(mobile, () => {
      const focusedInside = nav.contains(document.activeElement);
      setOpen(false, mobile.matches && focusedInside);
    });
    setOpen(false);
    root.classList.add('interactions-ready');
  }

  function enhanceReveals() {
    const elements = Array.from(document.querySelectorAll('.reveal'));
    if (!elements.length) return;
    let observer;
    const showAll = () => {
      elements.forEach((element) => element.classList.add('is-in'));
      observer?.disconnect();
    };
    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      showAll();
      return;
    }
    try {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -40px 0px', threshold: 0.06 });
      elements.forEach((element) => {
        const siblings = Array.from(element.parentElement.children)
          .filter((child) => child.classList.contains('reveal'));
        const index = siblings.indexOf(element);
        element.style.setProperty('--reveal-delay', `${Math.min(index, 3) * 90}ms`);
        observer.observe(element);
      });
      root.classList.add('motion-ready');
      onMediaChange(reducedMotion, () => {
        if (reducedMotion.matches) showAll();
      });
    } catch (error) {
      // Content stays readable if motion enhancement is unavailable.
      root.classList.remove('motion-ready');
      showAll();
    }
  }

  function enhanceSpecialties() {
    document.querySelectorAll('.specialties').forEach((section) => {
      const track = section.querySelector('.specialties-track');
      const button = section.querySelector('[data-marquee-toggle]');
      if (!track || !button) return;
      let userPaused = false;
      let hovered = false;
      let focused = section.contains(document.activeElement);
      let visible = !('IntersectionObserver' in window);

      const update = () => {
        const reduced = reducedMotion.matches;
        const paused = reduced || userPaused || hovered || focused || !visible || document.hidden;
        section.dataset.motion = reduced ? 'reduced' : paused ? 'paused' : 'running';
        section.dataset.paused = String(paused);
        track.style.animationPlayState = paused ? 'paused' : 'running';
        button.disabled = reduced;
        button.setAttribute('aria-pressed', String(userPaused));
        button.textContent = reduced ? 'Motion reduced' : userPaused ? 'Resume specialties' : 'Pause specialties';
        button.setAttribute('aria-label', button.textContent);
      };
      const measure = () => {
        const group = track.firstElementChild;
        if (!group) return;
        const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
        const distance = group.getBoundingClientRect().width + gap;
        if (distance > 0) {
          track.style.setProperty('--marquee-duration', `${Math.max(18, distance / 34).toFixed(2)}s`);
          track.style.setProperty('--marquee-distance', `${distance.toFixed(2)}px`);
        }
      };

      button.type = 'button';
      button.hidden = false;
      button.addEventListener('click', () => {
        userPaused = !userPaused;
        update();
      });
      section.addEventListener('pointerenter', (event) => {
        if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
          hovered = true;
          update();
        }
      });
      section.addEventListener('pointerleave', () => { hovered = false; update(); });
      section.addEventListener('focusin', () => { focused = true; update(); });
      section.addEventListener('focusout', (event) => {
        focused = Boolean(event.relatedTarget && section.contains(event.relatedTarget));
        update();
      });
      document.addEventListener('visibilitychange', update);
      onMediaChange(reducedMotion, () => { measure(); update(); });
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          update();
        }, { threshold: 0 });
        observer.observe(section);
      }
      if ('ResizeObserver' in window) new ResizeObserver(measure).observe(track);
      else window.addEventListener('resize', measure, { passive: true });
      document.fonts?.ready.then(measure);
      measure();
      update();
    });
  }

  function enhanceProjectPreview() {
    const dialog = document.getElementById('project-preview');
    const frame = document.getElementById('project-frame');
    const openLink = document.getElementById('project-open');
    const title = document.getElementById('project-title');
    if (!dialog || !frame || !openLink || !title || typeof dialog.showModal !== 'function') return;
    const closeButton = dialog.querySelector('[data-preview-close]');
    if (!closeButton) return;
    let trigger;
    let previousOverflow;

    document.querySelectorAll('a[data-preview]').forEach((link) => {
      link.addEventListener('click', (event) => {
        // Keep new-tab, download and non-web links as ordinary anchors.
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const url = new URL(link.href, window.location.href);
        if (!['http:', 'https:'].includes(url.protocol)) return;
        const name = link.dataset.title || link.querySelector('h3, b')?.textContent.trim() || 'Project';
        event.preventDefault();
        trigger = link;
        title.textContent = name;
        frame.title = `${name} website preview`;
        frame.src = url.href;
        openLink.href = url.href;
        openLink.setAttribute('aria-label', `Open ${name} full site in a new tab`);
        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        dialog.showModal();
        closeButton.focus({ preventScroll: true });
      });
    });
    closeButton.type = 'button';
    closeButton.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      const outside = event.clientX < box.left || event.clientX > box.right ||
        event.clientY < box.top || event.clientY > box.bottom;
      if (outside) dialog.close();
    });
    dialog.addEventListener('close', () => {
      frame.src = 'about:blank';
      document.body.style.overflow = previousOverflow || '';
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    });
  }

  function enhanceProjectRails() {
    document.querySelectorAll('[data-work-track]').forEach((track) => {
      const section = track.closest('[data-work-carousel]') || track.closest('section') || track.parentElement;
      const previous = section.querySelector('[data-work-prev]');
      const next = section.querySelector('[data-work-next]');
      if (!previous || !next) return;
      let scheduled = false;
      const update = () => {
        const maximum = Math.max(0, track.scrollWidth - track.clientWidth);
        previous.disabled = track.scrollLeft <= 2;
        next.disabled = track.scrollLeft >= maximum - 2;
        scheduled = false;
      };
      const move = (direction) => {
        const item = track.firstElementChild;
        const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
        const distance = item ? item.getBoundingClientRect().width + gap : track.clientWidth;
        track.scrollBy({ left: direction * distance, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
      };
      previous.type = next.type = 'button';
      previous.hidden = next.hidden = false;
      previous.addEventListener('click', () => move(-1));
      next.addEventListener('click', () => move(1));
      track.addEventListener('scroll', () => {
        if (!scheduled) {
          scheduled = true;
          requestAnimationFrame(update);
        }
      }, { passive: true });
      if ('ResizeObserver' in window) new ResizeObserver(update).observe(track);
      else window.addEventListener('resize', update, { passive: true });
      update();
    });
  }

  // Each feature is independent: a missing optional component must not hide the page.
  [enhanceHeader, enhanceReveals, enhanceSpecialties, enhanceProjectPreview, enhanceProjectRails].forEach((enhance) => {
    try { enhance(); } catch (error) { console.warn('HJS enhancement unavailable:', enhance.name, error); }
  });
})();
