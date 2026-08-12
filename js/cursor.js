/* ==========================================================================
   Custom Premium Cursor
   - Dot: follows the raw pointer position every frame (effectively instant).
   - Ring: lerps toward the pointer (soft trailing delay) and gains a
     velocity-based stretch that eases back to a perfect circle at rest.
   - Hover/click states, and a capped magnetic pull toward nearby
     links/buttons, are layered on top.
   Entirely pointer-events:none and skipped outright on touch/coarse-pointer
   or reduced-motion setups, so it can never affect page interaction.
   ========================================================================== */

(function () {
  'use strict';

  var supportsFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!supportsFinePointer || prefersReducedMotion) return;

  var dot = document.getElementById('cursorDot');
  var ring = document.getElementById('cursorRing');
  if (!dot || !ring) return;

  var INTERACTIVE_SELECTOR = 'a, button, [role="button"], input, textarea, select, label, summary';

  var RING_LERP = 0.16;          // soft trailing delay
  var STRETCH_LERP = 0.22;       // how quickly stretch eases toward its target
  var STRETCH_FACTOR = 0.05;     // speed -> stretch amount
  var MAX_STRETCH = 0.32;
  var MAGNET_STRENGTH = 0.35;    // 0..1, how strongly the ring is pulled toward a target's center
  var MAGNET_MAX_OFFSET = 14;    // px cap so magnetism stays subtle on large elements

  var mouseX = window.innerWidth / 2;
  var mouseY = window.innerHeight / 2;
  var ringX = mouseX;
  var ringY = mouseY;
  var stretch = 0;
  var lastAngle = 0;
  var magnetTarget = null;
  var rafId = null;
  var hasMoved = false;

  document.documentElement.classList.add('custom-cursor-active');

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function showCursor() {
    dot.classList.add('is-visible');
    ring.classList.add('is-visible');
  }

  function hideCursor() {
    dot.classList.remove('is-visible');
    ring.classList.remove('is-visible');
  }

  function onMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!hasMoved) {
      hasMoved = true;
      ringX = mouseX;
      ringY = mouseY;
      showCursor();
    }
  }

  function onWindowLeave(e) {
    // Only hide when the pointer actually leaves the viewport, not when
    // it moves between child elements (relatedTarget is null at the doc edge).
    if (!e.relatedTarget && !e.toElement) hideCursor();
  }

  function findInteractive(target) {
    return target && target.closest ? target.closest(INTERACTIVE_SELECTOR) : null;
  }

  function onPointerOver(e) {
    var target = findInteractive(e.target);
    if (target) {
      ring.classList.add('is-hover');
      dot.classList.add('is-hover');
      magnetTarget = target;
    }
  }

  function onPointerOut(e) {
    var target = findInteractive(e.target);
    if (!target) return;
    var related = e.relatedTarget;
    if (!related || !target.contains(related)) {
      ring.classList.remove('is-hover');
      dot.classList.remove('is-hover');
      if (magnetTarget === target) magnetTarget = null;
    }
  }

  function onMouseDown() {
    ring.classList.add('is-active');
    dot.classList.add('is-active');
  }

  function onMouseUp() {
    ring.classList.remove('is-active');
    dot.classList.remove('is-active');
  }

  document.addEventListener('mousemove', onMouseMove, { passive: true });
  document.addEventListener('mouseout', onWindowLeave, { passive: true });
  document.addEventListener('mouseenter', showCursor, { passive: true });
  document.addEventListener('pointerover', onPointerOver, { passive: true });
  document.addEventListener('pointerout', onPointerOut, { passive: true });
  document.addEventListener('mousedown', onMouseDown, { passive: true });
  document.addEventListener('mouseup', onMouseUp, { passive: true });

  function tick() {
    var targetX = mouseX;
    var targetY = mouseY;

    if (magnetTarget && document.body.contains(magnetTarget)) {
      var rect = magnetTarget.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var pullX = Math.max(-MAGNET_MAX_OFFSET, Math.min(MAGNET_MAX_OFFSET, (cx - mouseX) * MAGNET_STRENGTH));
      var pullY = Math.max(-MAGNET_MAX_OFFSET, Math.min(MAGNET_MAX_OFFSET, (cy - mouseY) * MAGNET_STRENGTH));
      targetX = mouseX + pullX;
      targetY = mouseY + pullY;
    }

    var prevRingX = ringX;
    var prevRingY = ringY;
    ringX = lerp(ringX, targetX, RING_LERP);
    ringY = lerp(ringY, targetY, RING_LERP);

    var dx = ringX - prevRingX;
    var dy = ringY - prevRingY;
    var speed = Math.sqrt(dx * dx + dy * dy);

    if (speed > 0.15) {
      lastAngle = Math.atan2(dy, dx) * (180 / Math.PI);
    }

    var targetStretch = Math.min(speed * STRETCH_FACTOR, MAX_STRETCH);
    stretch = lerp(stretch, targetStretch, STRETCH_LERP);

    dot.style.transform = 'translate3d(' + mouseX + 'px,' + mouseY + 'px,0)';
    ring.style.transform =
      'translate3d(' + ringX + 'px,' + ringY + 'px,0) rotate(' + lastAngle + 'deg) scale(' +
      (1 + stretch) + ',' + (1 - stretch * 0.4) + ')';

    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);

  // Defensive cleanup if the environment stops matching a fine pointer
  // (e.g. a hybrid device toggling input mode) — falls back to the native cursor.
  var pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
  var handlePointerChange = function (e) {
    if (!e.matches) {
      if (rafId) cancelAnimationFrame(rafId);
      document.documentElement.classList.remove('custom-cursor-active');
      hideCursor();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseout', onWindowLeave);
      document.removeEventListener('mouseenter', showCursor);
      document.removeEventListener('pointerover', onPointerOver);
      document.removeEventListener('pointerout', onPointerOut);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
    }
  };
  if (pointerQuery.addEventListener) {
    pointerQuery.addEventListener('change', handlePointerChange);
  }
})();
