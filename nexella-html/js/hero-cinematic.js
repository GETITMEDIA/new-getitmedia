/* ==========================================================================
   GetIt Media — Hero Cinematic Video Fade System + Entrance Animations
   Pure Vanilla JavaScript — No frameworks
   ========================================================================== */

(function () {
  'use strict';

  // ── Reduced motion check ──
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Video Fade System ──
  var video = document.getElementById('gmHeroVideo');
  if (!video) return;

  var fadingOut = false;
  var currentAnimFrame = null;
  var FADE_DURATION = 500; // ms

  /**
   * Cancel any running animation frame
   */
  function cancelFade() {
    if (currentAnimFrame) {
      cancelAnimationFrame(currentAnimFrame);
      currentAnimFrame = null;
    }
  }

  /**
   * Animate opacity from startVal to endVal over durationMs using rAF
   * @param {number} startVal  - starting opacity
   * @param {number} endVal    - target opacity
   * @param {number} durationMs - animation duration
   * @param {function} [onComplete] - callback when done
   */
  function animateOpacity(startVal, endVal, durationMs, onComplete) {
    cancelFade();
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var elapsed = timestamp - startTime;
      var progress = Math.min(elapsed / durationMs, 1);

      // Linear interpolation
      var currentOpacity = startVal + (endVal - startVal) * progress;
      video.style.opacity = currentOpacity;

      if (progress < 1) {
        currentAnimFrame = requestAnimationFrame(step);
      } else {
        currentAnimFrame = null;
        if (onComplete) onComplete();
      }
    }

    currentAnimFrame = requestAnimationFrame(step);
  }

  // ── Fade In on video ready ──
  function onVideoReady() {
    animateOpacity(0, 1, FADE_DURATION);
  }

  if (video.readyState >= 3) {
    // Video already loaded
    onVideoReady();
  } else {
    video.addEventListener('loadeddata', onVideoReady, { once: true });
  }

  // ── Fade Out near end ──
  video.addEventListener('timeupdate', function () {
    if (fadingOut) return;
    if (!video.duration || isNaN(video.duration)) return;

    var timeRemaining = video.duration - video.currentTime;
    if (timeRemaining <= 0.55) {
      fadingOut = true;
      var currentOpacity = parseFloat(video.style.opacity) || 1;
      animateOpacity(currentOpacity, 0, FADE_DURATION);
    }
  });

  // ── Seamless loop on ended ──
  video.addEventListener('ended', function () {
    video.style.opacity = '0';

    setTimeout(function () {
      video.currentTime = 0;
      var playPromise = video.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch(function () { /* autoplay blocked, ignore */ });
      }

      // Fade back in
      animateOpacity(0, 1, FADE_DURATION);
      fadingOut = false;
    }, 100);
  });

  // ── Entrance Animations (staggered reveal) ──
  if (!prefersReducedMotion) {
    var revealElements = document.querySelectorAll('.gm-reveal');
    var baseDelay = 300; // ms after page load

    // Wait for video to start fading in, then stagger content
    setTimeout(function () {
      for (var i = 0; i < revealElements.length; i++) {
        (function (el, index) {
          setTimeout(function () {
            el.classList.add('gm-reveal--visible');
          }, index * 200);
        })(revealElements[i], i);
      }
    }, baseDelay);
  } else {
    // Immediately show all elements for reduced motion
    var revealElements = document.querySelectorAll('.gm-reveal');
    for (var i = 0; i < revealElements.length; i++) {
      revealElements[i].classList.add('gm-reveal--visible');
    }
  }

  // ── Visibility API: pause animations when tab is hidden ──
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      video.pause();
    } else {
      var playPromise = video.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch(function () { /* ignore */ });
      }
    }
  });

})();
