(function() {
  'use strict';

  function setLang(lang) {
    var btns = document.querySelectorAll('.lang-btn');
    btns.forEach(function(b) { b.classList.remove('active'); });
    if (lang === 'en') {
      document.body.classList.add('en');
      document.documentElement.lang = 'en';
      if (btns.length > 1) btns[btns.length - 1].classList.add('active');
    } else {
      document.body.classList.remove('en');
      document.documentElement.lang = 'uk';
      if (btns.length > 0) btns[0].classList.add('active');
    }
    try { localStorage.setItem('lang', lang); } catch(e) {}
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));
  }
  window.setLang = setLang;

  function init() {
    try {
      var saved = localStorage.getItem('lang');
      if (saved === 'en') setLang('en');
    } catch(e) {}

    var hamburger = document.querySelector('.hamburger') || document.getElementById('hamburger');
    var navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
      hamburger.addEventListener('click', function() {
        var open = navLinks.classList.toggle('open');
        hamburger.classList.toggle('open', open);
        hamburger.setAttribute('aria-expanded', String(open));
      });
      document.addEventListener('click', function(e) {
        if (!e.target.closest('nav')) {
          navLinks.classList.remove('open');
          hamburger.classList.remove('open');
          hamburger.setAttribute('aria-expanded', 'false');
        }
      });
    }

    var nav = document.querySelector('nav');
    if (nav) {
      window.addEventListener('scroll', function() {
        nav.classList.toggle('scrolled', window.scrollY > 40);
      }, { passive: true });
    }
  }

  // Generic scroll-reveal: opt-in via [data-reveal] attribute on any element.
  // Triggers a "is-visible" class once the element scrolls into view. Pages
  // may pair this with their own CSS, e.g.:
  //   [data-reveal] { opacity: 0; transform: translateY(12px); transition: ... }
  //   [data-reveal].is-visible { opacity: 1; transform: none; }
  function initReveal() {
    var nodes = document.querySelectorAll('[data-reveal]:not(.is-visible)');
    if (!nodes.length) return;
    if (!('IntersectionObserver' in window) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      nodes.forEach(function(n) { n.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (!e.isIntersecting) return;
        var delay = parseInt(e.target.getAttribute('data-reveal-delay'), 10) || 0;
        setTimeout(function() { e.target.classList.add('is-visible'); }, delay);
        io.unobserve(e.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    nodes.forEach(function(n) { io.observe(n); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { init(); initReveal(); });
  } else {
    init();
    initReveal();
  }

  // Register service worker (PWA + offline). Skipped on file:// and localhost-without-https.
  if ('serviceWorker' in navigator &&
      (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/service-worker.js').catch(function() {});
    });
  }
})();
