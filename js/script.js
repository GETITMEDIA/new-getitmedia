(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Sticky navbar shadow on scroll
  ------------------------------------------------------------------ */
  var navbar = document.getElementById('navbar');

  function onScroll() {
    if (window.scrollY > 8) {
      navbar.classList.add('is-scrolled');
    } else {
      navbar.classList.remove('is-scrolled');
    }
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ------------------------------------------------------------------
     Desktop Services mega dropdown
     Hover to open (with small close delay so moving the mouse into
     the panel doesn't close it), click/keyboard toggle for a11y.
  ------------------------------------------------------------------ */
  var servicesItem = document.getElementById('servicesItem');
  var servicesTrigger = document.getElementById('servicesTrigger');
  var servicesMenu = document.getElementById('servicesMenu');
  var closeTimer = null;
  var MOBILE_BREAKPOINT = 1024;

  function isDesktop() {
    return window.innerWidth > MOBILE_BREAKPOINT;
  }

  // Tracks whether the current open state came from a hover (mouse) vs. an
  // explicit click/keyboard activation, so a click right after a hover-open
  // doesn't immediately toggle it shut again on desktop.
  var openedViaHover = false;

  function openServices(viaHover) {
    clearTimeout(closeTimer);
    servicesItem.classList.add('is-open');
    servicesTrigger.setAttribute('aria-expanded', 'true');
    openedViaHover = !!viaHover;
  }

  function closeServices(immediate) {
    clearTimeout(closeTimer);
    var delay = immediate ? 0 : 150;
    closeTimer = setTimeout(function () {
      servicesItem.classList.remove('is-open');
      servicesTrigger.setAttribute('aria-expanded', 'false');
      openedViaHover = false;
    }, delay);
  }

  if (servicesItem && servicesTrigger && servicesMenu) {
    servicesItem.addEventListener('mouseenter', function () {
      if (isDesktop()) openServices(true);
    });
    servicesItem.addEventListener('mouseleave', function () {
      if (isDesktop()) closeServices(false);
    });

    servicesTrigger.addEventListener('click', function (e) {
      e.preventDefault();
      var isOpen = servicesItem.classList.contains('is-open');
      if (isOpen && !openedViaHover) {
        closeServices(true);
      } else {
        openServices(false);
      }
    });

    servicesTrigger.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeServices(true);
        servicesTrigger.blur();
      }
    });

    document.addEventListener('click', function (e) {
      if (!servicesItem.contains(e.target)) {
        closeServices(true);
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeServices(true);
    });
  }

  /* ------------------------------------------------------------------
     Mobile off-canvas menu
  ------------------------------------------------------------------ */
  var hamburger = document.getElementById('hamburger');
  var mobileMenu = document.getElementById('mobileMenu');
  var mobileOverlay = document.getElementById('mobileOverlay');
  var mobileClose = document.getElementById('mobileClose');

  function openMobileMenu() {
    mobileMenu.classList.add('is-open');
    mobileOverlay.classList.add('is-visible');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    mobileMenu.classList.remove('is-open');
    mobileOverlay.classList.remove('is-visible');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (hamburger && mobileMenu && mobileOverlay) {
    hamburger.addEventListener('click', function () {
      var isOpen = mobileMenu.classList.contains('is-open');
      if (isOpen) closeMobileMenu(); else openMobileMenu();
    });
    mobileClose.addEventListener('click', closeMobileMenu);
    mobileOverlay.addEventListener('click', closeMobileMenu);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMobileMenu();
    });

    // Close mobile menu automatically if resized back to desktop
    window.addEventListener('resize', function () {
      if (window.innerWidth > MOBILE_BREAKPOINT) closeMobileMenu();
    });
  }

  /* ------------------------------------------------------------------
     Mobile Services accordion
  ------------------------------------------------------------------ */
  var mobileServicesTrigger = document.getElementById('mobileServicesTrigger');
  var mobileAccordion = mobileServicesTrigger ? mobileServicesTrigger.closest('.mobile-accordion') : null;

  if (mobileServicesTrigger && mobileAccordion) {
    mobileServicesTrigger.addEventListener('click', function () {
      var isOpen = mobileAccordion.getAttribute('data-open') === 'true';
      mobileAccordion.setAttribute('data-open', isOpen ? 'false' : 'true');
      mobileServicesTrigger.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
    });
  }

  /* ------------------------------------------------------------------
     Scroll parallax — any element with [data-parallax="0.15"] drifts
     vertically at that fraction of the scroll distance, giving decorative
     background art (e.g. the services shape) a subtle depth effect as the
     page background color/section itself stays put. rAF-throttled so it
     never runs more than once per frame; skipped entirely for
     prefers-reduced-motion.
  ------------------------------------------------------------------ */
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));

  if (parallaxEls.length) {
    var parallaxTicking = false;

    function updateParallax() {
      var viewportH = window.innerHeight;
      parallaxEls.forEach(function (el) {
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0.15;
        var rect = el.getBoundingClientRect();
        // Distance of the element's center from the viewport's center,
        // scaled by speed — 0 when centered, +/- as it scrolls past.
        var offset = (rect.top + rect.height / 2 - viewportH / 2) * speed;
        el.style.transform = 'translate3d(0, ' + (-offset * 0.2).toFixed(2) + 'px, 0)';
      });
      parallaxTicking = false;
    }

    function onParallaxScroll() {
      if (!parallaxTicking) {
        window.requestAnimationFrame(updateParallax);
        parallaxTicking = true;
      }
    }

    updateParallax();
    window.addEventListener('scroll', onParallaxScroll, { passive: true });
    window.addEventListener('resize', onParallaxScroll);
  }

  /* ------------------------------------------------------------------
     Services section — per-element scroll-triggered reveal.
     Progressive enhancement only: every [data-reveal] element (the shape,
     the heading block, each card) is fully visible by default in CSS, so
     nothing depends on this running. When IntersectionObserver is
     available, each one is switched to its CSS "hidden" starting state
     and observed on its own, so it plays its entrance right as IT crosses
     into the viewport — cards further down the page animate when you
     actually scroll to them, not all at once when the section top appears.
  ------------------------------------------------------------------ */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));

  if (revealEls.length && 'IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

    revealEls.forEach(function (el) {
      el.classList.add('js-reveal');
      revealObserver.observe(el);
    });
  }
})();
