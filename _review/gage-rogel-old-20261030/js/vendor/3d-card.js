// Aceternity UI "3D Card Effect" (3d-card.tsx: CardContainer / CardBody / CardItem), as a plain-JS ES module.
// Built from the local proof port (website-factory/vendor/effects/aceternity/proof/3d-card.js, checked against the live
// demo on 2026-10-29) and the original beside this file. The numbers are the source's: the outer container's perspective
// 1000px, tilt = pointer offset from the card's centre / 25 degrees (rotateY by x, rotateX by y), every move eased by the
// CSS `transition: all 200ms linear`, items lift on enter to their translateX/Y/Z + rotateX/Y/Z and everything returns to
// 0 on leave (3d-card.css carries the transitions).
// Markup (one card):
//   <div class="tdc">                                   CardContainer outer (perspective 1000px)
//     <div class="tdc-container">                       the element that tilts
//       <div class="tdc-body"> ...                      CardBody (preserve-3d)
//         <div class="tdc-item" data-tz="50">           CardItem: data-tx/ty/tz in px, data-rx/ry/rz in deg
// What is different from the source:
//  - touch (the source is hover-only, so a phone sees nothing): a tap toggles the lifted state, a drag tilts and lifts
//    like a hover, letting go settles it back (same as the proof). A touch that starts on a button or link is left alone.
//  - the pointer is read as offsetX/offsetY inside the container's layout box instead of getBoundingClientRect(), so the
//    tilt keeps the source's degrees and follows the cursor when a parent scales the card in CSS 3D (Gage's tunnel). On
//    a flat page the numbers match the source.
//  - prefers-reduced-motion: no tilt (as the proof) and no lift.
//  - hooks for effects layered on the card: onMove({ x, y, nx, ny, rotateX, rotateY, active }) on every tilt or settle,
//    onLift(on); the root gets .tdc-up while its items are lifted (mouse or touch). No auto-init: call create3DCard(root).
// Licence (ui.aceternity.com/licence): use inside end products for us or clients; never redistribute this source.

const ZERO = 'translateX(0px) translateY(0px) translateZ(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)';

function num(el, name) {
  const v = el.getAttribute('data-' + name);
  return v == null || v === '' ? 0 : v;
}

export function create3DCard(root, opts = {}) {
  if (!root) return null;
  if (root.__card3d) return root.__card3d;
  const container = root.querySelector('.tdc-container');
  const body = root.querySelector('.tdc-body');
  const items = Array.from(root.querySelectorAll('.tdc-item'));
  const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const onMove = typeof opts.onMove === 'function' ? opts.onMove : null;
  const onLift = typeof opts.onLift === 'function' ? opts.onLift : null;

  let hovering = false; // the source's isMouseEntered
  let tapLifted = false; // touch: toggled by a tap
  let lifted = null;

  function applyItems(on) {
    if (reduce) on = false;
    if (on === lifted) return;
    lifted = on;
    items.forEach(it => {
      it.style.transform = on
        ? 'translateX(' + num(it, 'tx') + 'px) translateY(' + num(it, 'ty') + 'px) translateZ(' + num(it, 'tz') +
          'px) rotateX(' + num(it, 'rx') + 'deg) rotateY(' + num(it, 'ry') + 'deg) rotateZ(' + num(it, 'rz') + 'deg)'
        : ZERO;
    });
    if (body) body.classList.toggle('is-lifted', on && !hovering);
    root.classList.toggle('tdc-up', on);
    if (onLift) onLift(on);
  }

  // the pointer in the container's own layout pixels (offsetX is mapped through every ancestor transform)
  function local(e) {
    let x = e.offsetX;
    let y = e.offsetY;
    for (let n = e.target; n && n !== container; n = n.offsetParent) {
      if (!container.contains(n)) return null;
      x += n.offsetLeft;
      y += n.offsetTop;
    }
    return { x, y };
  }

  function tiltTo(x, y) {
    const w = container.clientWidth;
    const h = container.clientHeight;
    const rx = (x - w / 2) / 25; // the source: (clientX - left - width / 2) / 25
    const ry = (y - h / 2) / 25;
    if (!reduce) container.style.transform = 'rotateY(' + rx + 'deg) rotateX(' + ry + 'deg)';
    if (onMove) onMove({ x, y, nx: w ? x / w : 0.5, ny: h ? y / h : 0.5, rotateY: reduce ? 0 : rx, rotateX: reduce ? 0 : ry, active: true });
  }
  function tilt(e) {
    const p = local(e);
    if (p) tiltTo(p.x, p.y);
  }
  function flat() {
    container.style.transform = 'rotateY(0deg) rotateX(0deg)';
    if (onMove) onMove({ x: 0, y: 0, nx: 0.5, ny: 0.5, rotateY: 0, rotateX: 0, active: false });
  }

  applyItems(false); // the source runs handleAnimations() once on mount

  // ── mouse (and pen hover): the source behaviour ──
  const enter = e => {
    if (e.pointerType === 'touch') return;
    hovering = true;
    if (body) body.classList.remove('is-lifted');
    lifted = null;
    applyItems(true);
  };
  const move = e => {
    if (e.pointerType === 'touch') return;
    tilt(e);
  };
  const leave = e => {
    if (e.pointerType === 'touch') return;
    hovering = false;
    flat();
    applyItems(false);
  };

  // ── touch fallback ──
  let touch = null;
  const down = e => {
    if (e.pointerType !== 'touch') return;
    if (e.target && e.target.closest && e.target.closest('button, a, input, select, textarea, [role="button"]')) return;
    touch = { id: e.pointerId, x: e.clientX, y: e.clientY, t: Date.now(), dragging: false };
  };
  const touchMove = e => {
    if (!touch || e.pointerId !== touch.id) return;
    const dx = e.clientX - touch.x;
    const dy = e.clientY - touch.y;
    if (!touch.dragging && dx * dx + dy * dy > 64) {
      touch.dragging = true;
      try {
        container.setPointerCapture(e.pointerId);
      } catch (err) {
        /* ignore */
      }
      applyItems(true);
      if (body) body.classList.add('is-lifted');
    }
    if (touch.dragging) tilt(e);
  };
  function endTouch(e, cancelled) {
    if (!touch || e.pointerId !== touch.id) return;
    const wasDrag = touch.dragging;
    const quick = Date.now() - touch.t < 500;
    touch = null;
    if (wasDrag || cancelled) {
      flat();
      applyItems(tapLifted);
      if (body) body.classList.toggle('is-lifted', tapLifted);
    } else if (quick) {
      tapLifted = !tapLifted;
      applyItems(tapLifted);
      if (body) body.classList.toggle('is-lifted', tapLifted);
    }
  }
  const up = e => endTouch(e, false);
  const cancel = e => endTouch(e, true);

  container.addEventListener('pointerenter', enter);
  container.addEventListener('pointermove', move);
  container.addEventListener('pointerleave', leave);
  container.addEventListener('pointerdown', down);
  container.addEventListener('pointermove', touchMove);
  container.addEventListener('pointerup', up);
  container.addEventListener('pointercancel', cancel);

  const api = {
    root,
    lift(on) {
      tapLifted = !!on;
      applyItems(tapLifted);
      if (body) body.classList.toggle('is-lifted', tapLifted);
    },
    /** Tilt to a point in the container's layout pixels (0,0 = its top-left corner). */
    tiltTo,
    reset() {
      tapLifted = false;
      hovering = false;
      flat();
      applyItems(false);
    },
    get lifted() {
      return !!lifted;
    },
    destroy() {
      container.removeEventListener('pointerenter', enter);
      container.removeEventListener('pointermove', move);
      container.removeEventListener('pointerleave', leave);
      container.removeEventListener('pointerdown', down);
      container.removeEventListener('pointermove', touchMove);
      container.removeEventListener('pointerup', up);
      container.removeEventListener('pointercancel', cancel);
      delete root.__card3d;
    }
  };
  root.__card3d = api;
  return api;
}

export default create3DCard;
