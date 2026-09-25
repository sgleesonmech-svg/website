/* LEESONMECH — shared behaviour: loader, nav, reveals, hero motion, WhatsApp, enquiry form */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Site settings — change contact details here, once.
     WHATSAPP must be a WhatsApp-enabled number: country code + number, digits only.
     ------------------------------------------------------------------ */
  var CONFIG = {
    WHATSAPP: '6587760680',
    WHATSAPP_TEXT: 'Hello Leesonmech, I would like to enquire about your products.',
    EMAIL: 'leesonmech@singnet.com.sg'
  };
  window.LM_CONFIG = CONFIG;

  var body = document.body;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  function waLink(text) {
    return 'https://wa.me/' + CONFIG.WHATSAPP + '?text=' + encodeURIComponent(text || CONFIG.WHATSAPP_TEXT);
  }
  window.LM_waLink = waLink;

  /* ---------- Loader (home page only) ---------- */
  // Only the home page has a loader; other pages reveal immediately (entrance animations still play)
  var hasLoader = !!document.querySelector('.loader') && !location.hash;
  var minTime = (reduceMotion || !hasLoader) ? 0 : 1350;
  var started = Date.now();
  var done = false;
  function reveal() {
    if (done) return;
    done = true;
    var wait = Math.max(0, minTime - (Date.now() - started));
    setTimeout(function () { body.classList.add('is-loaded'); }, wait);
  }
  if (!hasLoader) requestAnimationFrame(function () { requestAnimationFrame(reveal); });
  else if (document.readyState === 'complete') reveal(); else window.addEventListener('load', reveal);
  setTimeout(reveal, 3500); // never trap the visitor behind the loader
  window.addEventListener('pageshow', function (e) { if (e.persisted) { body.classList.add('is-loaded'); body.classList.remove('is-leaving'); } });

  /* ---------- Nav ---------- */
  var nav = $('.nav');
  var toTop = $('.totop');
  function onScroll() {
    var y = window.scrollY;
    if (nav) nav.classList.toggle('is-scrolled', y > 24);
    if (toTop) toTop.classList.toggle('is-on', y > 700);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); });

  var toggle = $('.nav__toggle');
  function setMenu(open) {
    body.classList.toggle('menu-open', open);
    body.classList.toggle('is-locked', open);
    if (toggle) toggle.setAttribute('aria-expanded', String(open));
  }
  if (toggle) toggle.addEventListener('click', function () { setMenu(!body.classList.contains('menu-open')); });
  $$('.menu a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  window.addEventListener('resize', function () { if (window.innerWidth > 900) setMenu(false); });

  /* ---------- WhatsApp links ---------- */
  $$('[data-wa]').forEach(function (a) {
    a.href = waLink(a.getAttribute('data-wa') || '');
    a.target = '_blank';
    a.rel = 'noopener';
  });

  /* ---------- Reveal on scroll ---------- */
  function observeReveals(root) {
    var items = $$('[data-reveal], .img-reveal, .stat', root);
    if (!('IntersectionObserver' in window) || reduceMotion) { items.forEach(function (el) { el.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }
  window.LM_observeReveals = observeReveals;

  /* ---------- Count-up numbers ---------- */
  function countUps() {
    var nums = $$('[data-count]');
    if (!nums.length) return;
    var run = function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      if (reduceMotion) { el.firstChild.nodeValue = String(target); return; }
      var t0 = null, dur = 1800;
      var step = function (t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / dur);
        var eased = 1 - Math.pow(1 - p, 4);
        el.firstChild.nodeValue = String(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (!('IntersectionObserver' in window) || reduceMotion) { nums.forEach(run); return; }
    nums.forEach(function (n) { n.firstChild.nodeValue = '0'; });
    // fire only once the numbers cross the middle band of the viewport
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
    }, { rootMargin: '-42% 0px -42% 0px', threshold: 0 });
    nums.forEach(function (n) { io.observe(n); });
  }

  /* ---------- Hero: keep the wordmark inside the viewport + parallax ---------- */
  var hero = $('.hero');
  if (hero) {
    var mark = $('.hero__mark', hero);
    var valve = $('.hero__valve', hero);
    var heroBg = $('.hero__bg', hero);

    var fitMark = function () {
      mark.style.fontSize = '';
      var max = window.innerWidth * 0.95;
      var w = mark.getBoundingClientRect().width;
      if (w > max) mark.style.fontSize = (parseFloat(getComputedStyle(mark).fontSize) * max / w) + 'px';
    };
    fitMark();
    window.addEventListener('resize', fitMark);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitMark);

    if (!reduceMotion) {
      var mx = 0, my = 0, cx = 0, cy = 0, sy = 0, ticking = false;
      var finePointer = window.matchMedia('(pointer: fine)').matches;
      var frame = function () {
        cx += (mx - cx) * 0.07; cy += (my - cy) * 0.07;
        var s = Math.min(sy, window.innerHeight);
        mark.style.transform = 'translate3d(' + (cx * -16).toFixed(2) + 'px,' + (cy * -8 + s * 0.22).toFixed(2) + 'px,0)';
        valve.style.translate = (cx * 12).toFixed(2) + 'px ' + (cy * 6 + s * 0.08).toFixed(2) + 'px';
        heroBg.style.transform = 'translate3d(' + (cx * -6).toFixed(2) + 'px,' + (s * 0.16).toFixed(2) + 'px,0)';
        if (Math.abs(mx - cx) > 0.001 || Math.abs(my - cy) > 0.001) requestAnimationFrame(frame); else ticking = false;
      };
      var kick = function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
      if (finePointer) hero.addEventListener('mousemove', function (e) {
        mx = e.clientX / window.innerWidth - 0.5; my = e.clientY / window.innerHeight - 0.5; kick();
      });
      window.addEventListener('scroll', function () { sy = window.scrollY; if (sy < window.innerHeight * 1.1) kick(); }, { passive: true });
    }
  }

  /* ---------- Soft parallax for inner-page hero + CTA backgrounds ---------- */
  if (!reduceMotion) {
    var layers = $$('.page-hero__bg, .cta__bg');
    if (layers.length) {
      var onPar = function () {
        layers.forEach(function (el) {
          var r = el.parentNode.getBoundingClientRect();
          if (r.bottom < 0 || r.top > window.innerHeight) return;
          var rate = el.classList.contains('cta__bg') ? 0.08 : 0.18;
          el.style.transform = 'translate3d(0,' + (-r.top * rate).toFixed(1) + 'px,0)';
        });
      };
      window.addEventListener('scroll', onPar, { passive: true });
      onPar();
    }
  }

  /* ---------- Marquee: duplicate the group so the loop is seamless ---------- */
  $$('.marquee__track').forEach(function (track) {
    var g = track.firstElementChild;
    if (!g) return;
    var clone = g.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  });

  /* ---------- Home: category tiles + featured products from the catalogue ---------- */
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  window.LM_esc = esc;

  var catsEl = $('#home-cats');
  if (catsEl && window.LM_PRODUCTS) {
    catsEl.innerHTML = window.LM_GROUPS.map(function (g, i) {
      var items = window.LM_PRODUCTS.filter(function (p) { return p.group === g.id; });
      if (!items.length) return '';
      return '<a class="cat" data-reveal style="--d:' + (i % 5) + '" href="products.html?cat=' + g.id + '">' +
        '<div class="cat__img"><img src="' + items[0].images[0] + '" alt="' + esc(g.name) + '" loading="lazy" width="800" height="800"></div>' +
        '<div class="cat__body"><div><h3>' + esc(g.name) + '</h3><small>' + items.length + (items.length === 1 ? ' product' : ' products') + '</small></div>' + ARROW + '</div></a>';
    }).join('');
  }
  var featEl = $('#home-featured');
  if (featEl && window.LM_PRODUCTS) {
    var picks = ['yasiki-pneumatic-actuator-ball-valve', 'okumura-japan-butterfly-valve', 'yasiki-electric-on-off-modulating-actuator-ball-valve', 'yasiki-wcb-gate-valve',
      'yasiki-fully-stainless-steel-pressure-gauge', 'yasiki-ss304-ss316-ball-valve', 'yasiki-instrument-valve-and-manifold', 'meidinger-ag-switzerland-atex-blower'];
    var groupName = {};
    window.LM_GROUPS.forEach(function (g) { groupName[g.id] = g.name; });
    featEl.innerHTML = picks.map(function (slug, i) {
      var p = window.LM_PRODUCTS.filter(function (x) { return x.slug === slug; })[0];
      if (!p) return '';
      return '<a class="pcard" data-reveal style="--d:' + (i % 4) + '" href="products.html#' + p.slug + '">' +
        '<div class="pcard__img"><img src="' + p.images[0] + '" alt="' + esc(p.name) + '" loading="lazy" width="800" height="800">' +
        '<span class="pcard__view">View details ' + ARROW + '</span></div>' +
        '<div class="pcard__body"><span class="pcard__cat">' + esc(groupName[p.group]) + '</span><h3 class="pcard__name">' + esc(p.name) + '</h3><p class="pcard__sum">' + esc(p.summary) + '</p></div></a>';
    }).join('');
  }

  /* ---------- Contact form: composes an email (or WhatsApp message) — no server needed ---------- */
  var form = $('#enquiry-form');
  if (form) {
    var params = new URLSearchParams(location.search);
    var wanted = params.get('product');
    if (wanted && window.LM_PRODUCTS) {
      var prod = window.LM_PRODUCTS.filter(function (p) { return p.slug === wanted; })[0];
      if (prod) {
        form.elements.subject.value = 'Quotation request';
        form.elements.message.value = 'I would like a quotation for: ' + prod.name + '\n\nSize / rating / quantity: ';
      }
    }
    var compose = function () {
      var f = form.elements;
      return [
        'Name: ' + f.name.value,
        'Company: ' + (f.company.value || '-'),
        'Email: ' + f.email.value,
        'Phone: ' + (f.phone.value || '-'),
        'Enquiry type: ' + f.subject.value,
        '',
        f.message.value
      ].join('\n');
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var subject = form.elements.subject.value + ' — ' + form.elements.name.value;
      location.href = 'mailto:' + CONFIG.EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(compose());
    });
    var viaWa = $('#enquiry-wa');
    if (viaWa) viaWa.addEventListener('click', function () {
      if (!form.reportValidity()) return;
      window.open(waLink(compose()), '_blank', 'noopener');
    });
  }

  /* ---------- Footer year ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  observeReveals(document);
  countUps();
})();
