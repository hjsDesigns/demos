/* Milton Lodge: navigation and Pacific-day context. No inferred closing times. */
(() => {
  'use strict';

  function init() {
    document.documentElement.classList.add('js');
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.getElementById('main-nav');
    const navLinks = nav ? Array.from(nav.querySelectorAll('a[href^="#"]')) : [];

    /* The CSS mobile breakpoint is 900px. */
    if (toggle && nav) {
      const desktop = window.matchMedia('(min-width: 901px)');
      function setNav(open) {
        nav.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
        toggle.textContent = open ? '×' : '☰';
      }
      setNav(false);
      toggle.addEventListener('click', () => {
        setNav(!desktop.matches && !nav.classList.contains('open'));
      });
      nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => setNav(false));
      });
      document.addEventListener('click', event => {
        if (!nav.contains(event.target) && !toggle.contains(event.target)) setNav(false);
      });
      document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && nav.classList.contains('open')) {
          event.preventDefault();
          setNav(false);
          toggle.focus();
        }
      });
      const resetOnDesktop = event => {
        if (event.matches) setNav(false);
      };
      if (desktop.addEventListener) desktop.addEventListener('change', resetOnDesktop);
      else if (desktop.addListener) desktop.addListener(resetOnDesktop);
    }

    /* Weekdays follow the business's timezone, regardless of the visitor's clock. */
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    function updateDay() {
      const now = new Date();
      const year = document.getElementById('year');
      if (year) year.textContent = String(now.getFullYear());
      let weekday;
      try {
        weekday = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/Los_Angeles', weekday: 'long'
        }).format(now);
      } catch (_) {
        return; // Leave the complete hours table readable if timezone support is unavailable.
      }
      const day = weekdays.indexOf(weekday);
      if (day < 0) return;
      document.querySelectorAll('#hours [data-day]').forEach(row => {
        const today = row.getAttribute('data-day') === String(day);
        row.classList.toggle('today', today);
        if (today) row.setAttribute('aria-current', 'date');
        else row.removeAttribute('aria-current');
      });
      const dayLabel = document.getElementById('hours-day');
      if (dayLabel) dayLabel.textContent = weekday + ' at the Lodge';
    }
    updateDay();
    window.setInterval(updateDay, 60000);
    window.addEventListener('focus', updateDay);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) updateDay();
    });

    /* Section tracking is an enhancement; every anchor works without it. */
    const destinations = navLinks.map(link => {
      const fragment = link.getAttribute('href').slice(1);
      let id;
      try { id = decodeURIComponent(fragment); } catch (_) { return null; }
      const section = id ? document.getElementById(id) : null;
      return section ? { link, section } : null;
    }).filter(Boolean);
    function markCurrent(section) {
      destinations.forEach(destination => {
        const current = destination.section === section;
        destination.link.classList.toggle('is-current', current);
        if (current) destination.link.setAttribute('aria-current', 'location');
        else destination.link.removeAttribute('aria-current');
      });
    }
    destinations.forEach(destination => {
      destination.link.addEventListener('click', () => markCurrent(destination.section));
    });
    if (typeof window.IntersectionObserver === 'function' && destinations.length) {
      const visible = new Set();
      let observer;
      let resizeTimer;
      function observeSections() {
        if (observer) observer.disconnect();
        visible.clear();
        const height = window.innerHeight;
        observer = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) visible.add(entry.target);
            else visible.delete(entry.target);
          });
          const readingLine = window.innerHeight * 0.2;
          const nearest = Array.from(visible).sort((a, b) =>
            Math.abs(a.getBoundingClientRect().top - readingLine) -
            Math.abs(b.getBoundingClientRect().top - readingLine)
          )[0];
          markCurrent(nearest || null);
        }, {
          rootMargin: '-' + Math.round(height * 0.12) + 'px 0px -' + Math.round(height * 0.62) + 'px 0px',
          threshold: [0, 0.1, 0.5, 1]
        });
        new Set(destinations.map(destination => destination.section)).forEach(section => {
          observer.observe(section);
        });
      }
      observeSections();
      window.addEventListener('resize', () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(observeSections, 150);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
