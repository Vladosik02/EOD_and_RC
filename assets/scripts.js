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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
