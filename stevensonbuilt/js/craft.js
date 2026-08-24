/* Craft layer. Pure enhancement — with this file deleted the site is
   still complete, readable and navigable. */
(function () {
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine  = matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ---------------------------------------------------------------
     Split the hero headline into lines so each can rise out of its
     own mask. Done in JS so the HTML stays plain text for anything
     that doesn't run scripts (and for the <em> accent to survive).
     --------------------------------------------------------------- */
  var h1 = document.querySelector('.hero h1');
  if (h1 && !still) {
    var words = [];
    // Flatten to word-level spans first, preserving <em> styling.
    (function walk(node, em) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach(function (t) {
            if (!t.trim()) return;
            var s = document.createElement('span');
            s.textContent = t;
            if (em) s.className = 'em';
            words.push(s);
          });
        } else if (n.nodeType === 1) {
          walk(n, em || n.tagName === 'EM');
        }
      });
    })(h1, false);

    if (words.length) {
      h1.textContent = '';
      var probe = document.createElement('span');
      probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap';
      // Rebuild inline first so we can measure where the browser breaks lines.
      words.forEach(function (w, i) {
        h1.appendChild(w);
        if (i < words.length - 1) h1.appendChild(document.createTextNode(' '));
      });

      // Group words by their rendered top offset — that's a line.
      var lines = [], last = null;
      words.forEach(function (w) {
        var top = Math.round(w.getBoundingClientRect().top);
        if (last === null || Math.abs(top - last) > 4) { lines.push([]); last = top; }
        lines[lines.length - 1].push(w);
      });

      h1.textContent = '';
      lines.forEach(function (group, i) {
        var mask = document.createElement('span');
        mask.className = 'ln';
        var inner = document.createElement('span');
        inner.style.setProperty('--i', i);
        group.forEach(function (w, j) {
          if (w.className === 'em') {
            var e = document.createElement('em'); e.textContent = w.textContent;
            inner.appendChild(e);
          } else {
            inner.appendChild(document.createTextNode(w.textContent));
          }
          if (j < group.length - 1) inner.appendChild(document.createTextNode(' '));
        });
        mask.appendChild(inner);
        h1.appendChild(mask);
      });
      probe.remove();
    }
  }

  /* ---------------------------------------------------------------
     Scroll progress. CSS drives this natively where scroll() exists;
     this is the fallback for everything else.
     --------------------------------------------------------------- */
  var bar = document.querySelector('.progress');
  if (bar && !still && !(CSS.supports && CSS.supports('animation-timeline', 'scroll()'))) {
    var tick = false;
    addEventListener('scroll', function () {
      if (tick) return; tick = true;
      requestAnimationFrame(function () {
        var max = document.documentElement.scrollHeight - innerHeight;
        bar.style.transform = 'scaleX(' + (max > 0 ? scrollY / max : 0) + ')';
        tick = false;
      });
    }, { passive: true });
  }

  /* ---------------------------------------------------------------
     Pointer: a soft field that follows the cursor, and a rim of light
     that tracks around whichever trade orb you're over.
     --------------------------------------------------------------- */
  if (fine && !still) {
    var field = document.querySelector('.glow-field');
    var fx = 0, fy = 0, tx = 0, ty = 0, running = false;

    addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!running) { running = true; requestAnimationFrame(loop); }

      var orb = e.target.closest && e.target.closest('.industry');
      if (orb) {
        var b = orb.querySelector('.orb').getBoundingClientRect();
        var ang = Math.atan2(e.clientY - (b.top + b.height / 2),
                             e.clientX - (b.left + b.width / 2)) * 180 / Math.PI;
        orb.querySelector('.orb').style.setProperty('--ang', (ang + 90) + 'deg');
      }
    }, { passive: true });

    function loop() {
      fx += (tx - fx) * 0.14; fy += (ty - fy) * 0.14;
      if (field) {
        field.style.setProperty('--mx', fx + 'px');
        field.style.setProperty('--my', fy + 'px');
      }
      if (Math.abs(tx - fx) > 0.4 || Math.abs(ty - fy) > 0.4) requestAnimationFrame(loop);
      else running = false;
    }

    /* Magnetic tier discs — they lean toward the cursor, then let go. */
    document.querySelectorAll('.tier').forEach(function (t) {
      var disc = t.querySelector('.disc');
      t.addEventListener('pointermove', function (e) {
        var b = t.getBoundingClientRect();
        var dx = (e.clientX - (b.left + b.width / 2)) / b.width;
        var dy = (e.clientY - (b.top + b.height / 2)) / b.height;
        disc.style.transform = 'translate(' + (dx * 12).toFixed(1) + 'px,' +
                               (dy * 12 - 5).toFixed(1) + 'px)';
      });
      t.addEventListener('pointerleave', function () { disc.style.transform = ''; });
    });
  }

  /* ---------------------------------------------------------------
     The wipe's leading edge. View Transitions animate the document
     itself; this paints the warm edge that travels with the cut.
     --------------------------------------------------------------- */
  if (!still && 'startViewTransition' in document) {
    addEventListener('pageswap', function () {
      var e = document.createElement('div');
      e.className = 'wipe-edge';
      document.body.appendChild(e);
    });
    addEventListener('pagereveal', function () {
      var e = document.createElement('div');
      e.className = 'wipe-edge';
      document.body.appendChild(e);
      setTimeout(function () { e.remove(); }, 620);
    });
  }
})();
