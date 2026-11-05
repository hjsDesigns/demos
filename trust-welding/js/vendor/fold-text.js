/* Fold Text — React Bits (DavidHDev/react-bits, src/content/TextAnimations/FoldText/FoldText.jsx), ported to plain DOM + GSAP 11/4.
   Same hinges, slats, eases, crease shading, stagger and durations as the original; the React render became buildFoldText(),
   the effect became playFoldText(). Needs gsap on the page. MIT + Commons Clause (use in client sites; never sell the component). */
(function (global) {
  var HINGES = { top: { origin: '50% 0%', axis: 'rotateX', sign: -1 }, bottom: { origin: '50% 100%', axis: 'rotateX', sign: 1 },
                 left: { origin: '0% 50%', axis: 'rotateY', sign: 1 }, right: { origin: '100% 50%', axis: 'rotateY', sign: -1 } };
  var SLATS = { rotateX: { origins: ['50% 25%', '50% 75%'], clips: ['inset(-40% -20% 50% -20%)', 'inset(50% -20% -40% -20%)'] },
                rotateY: { origins: ['25% 50%', '75% 50%'], clips: ['inset(-40% 50% -40% -20%)', 'inset(-40% -20% -40% 50%)'] } };
  var FOLD_STYLES = ['paper', 'blinds', 'flip'], SLAT_DELAY = 0.24;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var D = { splitBy: 'char', hinge: 'top', foldStyle: 'paper', duration: 0.65, stagger: 0.045, staggerFrom: 'start', foldAngle: 92,
            ease: 'power3.out', perspective: 700, creaseShading: 0.55 };

  function piece(content, safeStyle, safeHinge, isLine) {
    var seg = document.createElement('span'); seg.className = 'fold-text-segment'; if (isLine) seg.setAttribute('data-fold-split', 'line');
    var p = document.createElement('span'); p.className = 'fold-text-piece'; p.setAttribute('data-fold-hinge', safeHinge); p.style.opacity = '0';
    if (safeStyle === 'blinds') {
      p.setAttribute('data-fold-style', 'blinds');
      ['', 'b'].forEach(function (k) { var s = document.createElement('span'); s.className = 'fold-text-slat'; if (k) s.setAttribute('data-fold-slat', k); s.setAttribute('data-fold-text', content); s.textContent = content; p.appendChild(s); });
    } else { p.setAttribute('data-fold-style', safeStyle); p.setAttribute('data-fold-text', content); p.textContent = content; }
    seg.appendChild(p); return seg;
  }

  /* Wrap an element's own text (the React component's `text` prop) in the Fold Text anatomy. Returns the root span. */
  function buildFoldText(el, o) {
    o = Object.assign({}, D, o || {});
    var text = o.text != null ? o.text : el.textContent;
    var safeHinge = HINGES[o.hinge] ? o.hinge : 'top', safeStyle = FOLD_STYLES.indexOf(o.foldStyle) >= 0 ? o.foldStyle : 'paper';
    var root = document.createElement('span'); root.className = 'fold-text' + (o.className ? ' ' + o.className : '');
    root.style.setProperty('--fold-perspective', Math.max(120, o.perspective) + 'px');
    var sr = document.createElement('span'); sr.className = 'fold-text-sr-only'; sr.textContent = text;
    var vis = document.createElement('span'); vis.className = 'fold-text-visual'; vis.setAttribute('aria-hidden', 'true');
    if (o.splitBy === 'line') { text.split('\n').forEach(function (line) { vis.appendChild(piece(line || ' ', safeStyle, safeHinge, true)); }); }
    else {
      text.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { part.split('\n').forEach(function (sp, i) { if (i > 0) vis.appendChild(document.createElement('br')); if (sp) vis.appendChild(document.createTextNode(sp)); }); return; }
        if (o.splitBy === 'word') { vis.appendChild(piece(part, safeStyle, safeHinge)); return; }
        var w = document.createElement('span'); w.className = 'fold-text-word';
        Array.from(part).forEach(function (ch) { w.appendChild(piece(ch, safeStyle, safeHinge)); }); vis.appendChild(w);
      });
    }
    root.appendChild(sr); root.appendChild(vis);
    el.textContent = ''; el.appendChild(root);
    root.__fold = { o: o, safeHinge: safeHinge, safeStyle: safeStyle }; return root;
  }

  /* The effect, exactly as the original's play(false): unfold once. Returns the gsap timeline. */
  function playFoldText(root) {
    var cfg = root.__fold; if (!cfg) return null;
    var o = cfg.o, hingeConfig = HINGES[cfg.safeHinge], safeStyle = cfg.safeStyle;
    var elements = Array.from(root.querySelectorAll('.fold-text-piece')); if (!elements.length) return null;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var axis = hingeConfig.axis, sign = hingeConfig.sign, origin = hingeConfig.origin, slats = SLATS[axis];
    var unfoldEase = gsap.parseEase(reduceMotion ? 'power1.out' : o.ease) || gsap.parseEase('power3.out');
    var foldEase = gsap.parseEase(reduceMotion ? 'power1.in' : 'power2.in');
    var angle = reduceMotion ? 0 : safeStyle === 'flip' ? 180 : clamp(o.foldAngle, 0, 180);
    var crease = reduceMotion ? 0 : clamp(o.creaseShading, 0, 1);
    var lift = safeStyle === 'flip' && !reduceMotion ? 0.45 : 0;
    var unfoldDuration = reduceMotion ? Math.min(o.duration, 0.22) : o.duration;
    var staggerVars = { each: reduceMotion ? Math.min(Math.max(0, o.stagger), 0.02) : Math.max(0, o.stagger), from: o.staggerFrom };
    var pieces = elements.map(function (element) {
      var parts = safeStyle === 'blinds' ? Array.from(element.children) : [element];
      if (safeStyle === 'blinds') { element.style.opacity = '1'; parts.forEach(function (part, i) { part.style.transformOrigin = slats.origins[i]; if (i > 0) part.style.clipPath = slats.clips[i]; }); }
      else { element.style.transformOrigin = safeStyle === 'flip' ? '50% 50%' : origin; element.style.backfaceVisibility = safeStyle === 'flip' ? 'visible' : ''; }
      return { element: element, parts: parts, t: 0, f: 0, r: 0, aim: 0 };
    });
    var shade = function (progress, tilt) { return String(crease * clamp(1 - progress + tilt / 90, 0, 1)); };
    var render = function () {
      pieces.forEach(function (pc) {
        var tilt = 0;
        if (safeStyle === 'blinds') {
          var resting = true;
          pc.parts.forEach(function (part, i) {
            var offset = i * SLAT_DELAY, open = unfoldEase(clamp((pc.t - offset) / (1 - SLAT_DELAY), 0, 1)), close = foldEase(clamp((pc.f - offset) / (1 - SLAT_DELAY), 0, 1));
            var progress = open * (1 - close); if (Math.abs(1 - progress) > 0.002) resting = false;
            part.style.transform = axis + '(' + (sign * ((1 - progress) * angle + tilt)) + 'deg)'; part.style.opacity = String(clamp(progress, 0, 1)); part.style.setProperty('--fold-crease', shade(progress, tilt));
          });
          pc.parts[0].style.clipPath = resting ? 'none' : slats.clips[0]; pc.parts[1].style.visibility = resting ? 'hidden' : 'visible'; return;
        }
        var progress = unfoldEase(pc.t) * (1 - foldEase(pc.f)), rise = lift * Math.sin(Math.PI * clamp(progress, 0, 1));
        var turn = axis + '(' + (sign * ((1 - progress) * angle + tilt)) + 'deg)';
        pc.element.style.transform = rise > 0.001 ? 'translateZ(' + rise + 'em) ' + turn : turn;
        pc.element.style.opacity = String(clamp(progress, 0, 1)); pc.element.style.setProperty('--fold-crease', shade(progress, tilt));
      });
    };
    if (root.__tl) root.__tl.kill();
    var tl = gsap.timeline({ onUpdate: render });
    tl.fromTo(pieces, { t: 0, f: 0 }, { t: 1, duration: unfoldDuration, ease: 'none', stagger: staggerVars });
    render(); root.__tl = tl; return tl;
  }
  function resetFoldText(root) { if (root.__tl) root.__tl.kill(); root.querySelectorAll('.fold-text-piece').forEach(function (p) { p.style.opacity = '0'; p.style.transform = ''; }); }
  global.buildFoldText = buildFoldText; global.playFoldText = playFoldText; global.resetFoldText = resetFoldText;
})(window);
