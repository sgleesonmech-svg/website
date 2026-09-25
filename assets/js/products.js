/* LEESONMECH — products page: category filter, search, product detail modal */
(function () {
  'use strict';
  var PRODUCTS = window.LM_PRODUCTS || [];
  var GROUPS = window.LM_GROUPS || [];
  var esc = window.LM_esc;
  var grid = document.getElementById('product-grid');
  if (!grid) return;

  var chipsEl = document.getElementById('product-chips');
  var searchEl = document.getElementById('product-search');
  var titleEl = document.getElementById('result-title');
  var countEl = document.getElementById('result-count');
  var modal = document.getElementById('product-modal');
  var groupName = {};
  GROUPS.forEach(function (g) { groupName[g.id] = g.name; });

  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var params = new URLSearchParams(location.search);
  var FAMILIES = {};
  (window.LM_FAMILIES || []).forEach(function (f) { FAMILIES[f.id] = f.name; });
  var state = { cat: groupName[params.get('cat')] ? params.get('cat') : 'all', family: FAMILIES[params.get('family')] ? params.get('family') : null, q: '' };

  /* ---------- chips ---------- */
  var chipData = [{ id: 'all', name: 'All Products', n: PRODUCTS.length }].concat(GROUPS.map(function (g) {
    return { id: g.id, name: g.name, n: PRODUCTS.filter(function (p) { return p.group === g.id; }).length };
  }).filter(function (g) { return g.n; }));
  chipsEl.innerHTML = chipData.map(function (c) {
    return '<button type="button" class="chip" role="tab" data-cat="' + c.id + '">' + esc(c.name) + ' <b>' + c.n + '</b></button>';
  }).join('');
  chipsEl.addEventListener('click', function (e) {
    var b = e.target.closest('.chip');
    if (!b) return;
    state.cat = b.getAttribute('data-cat');
    state.family = null;
    var url = new URL(location.href);
    url.searchParams.delete('family');
    if (state.cat === 'all') url.searchParams.delete('cat'); else url.searchParams.set('cat', state.cat);
    history.replaceState(null, '', url);
    render(true);
  });
  searchEl.addEventListener('input', function () { state.q = searchEl.value.trim().toLowerCase(); render(false); });

  /* ---------- grid ---------- */
  grid.innerHTML = PRODUCTS.map(function (p) {
    return '<button type="button" class="pcard" data-slug="' + p.slug + '" aria-haspopup="dialog">' +
      '<div class="pcard__img">' +
      '<img src="' + p.images[0] + '" alt="' + esc(p.name) + '" loading="lazy" width="800" height="800">' +
      '<span class="pcard__view">View details ' + ARROW + '</span></div>' +
      '<div class="pcard__body"><span class="pcard__cat">' + esc(groupName[p.group]) + '</span>' +
      '<h3 class="pcard__name">' + esc(p.name) + '</h3><p class="pcard__sum">' + esc(p.summary) + '</p></div></button>';
  }).join('') + '<div class="empty" id="product-empty" hidden><h3 class="h-md">No products match your search</h3><p>Try a different keyword, or ask us directly — we stock far more than is listed here.</p><a class="btn btn--sm" href="contact.html">Ask our team</a></div>';
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.pcard'));
  var emptyEl = document.getElementById('product-empty');

  function matches(p) {
    if (state.family) { if ((p.families || []).indexOf(state.family) === -1) return false; }
    else if (state.cat !== 'all' && p.group !== state.cat) return false;
    if (!state.q) return true;
    var hay = (p.name + ' ' + p.summary + ' ' + p.brand + ' ' + p.tags.join(' ') + ' ' + groupName[p.group]).toLowerCase();
    return state.q.split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; });
  }

  function render(scroll) {
    var shown = 0;
    cards.forEach(function (card, i) {
      var ok = matches(PRODUCTS[i]);
      card.classList.toggle('is-hidden', !ok);
      card.classList.remove('is-enter');
      if (ok) {
        card.style.setProperty('--i', Math.min(shown, 11));
        void card.offsetWidth; // restart the entrance animation
        card.classList.add('is-enter');
        shown++;
      }
    });
    emptyEl.hidden = shown !== 0;
    Array.prototype.forEach.call(chipsEl.children, function (c) {
      var on = !state.family && c.getAttribute('data-cat') === state.cat;
      c.classList.toggle('is-active', on);
      c.setAttribute('aria-selected', String(on));
      if (on && scroll) c.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    });
    titleEl.textContent = state.family ? FAMILIES[state.family] : (state.cat === 'all' ? 'All Products' : groupName[state.cat]);
    countEl.textContent = shown + (shown === 1 ? ' product' : ' products') + (state.q ? ' matching “' + searchEl.value.trim() + '”' : '');
    if (scroll) {
      var top = document.getElementById('catalogue').getBoundingClientRect().top + window.scrollY - 130;
      if (window.scrollY > top) window.scrollTo({ top: top, behavior: 'smooth' });
    }
  }

  /* ---------- modal ---------- */
  var lastFocus = null;
  function openModal(p, push) {
    lastFocus = document.activeElement;
    var thumbs = p.images.length > 1 ? '<div class="modal__thumbs">' + p.images.map(function (src, i) {
      return '<button type="button" class="' + (i === 0 ? 'is-active' : '') + '" data-src="' + src + '" aria-label="Image ' + (i + 1) + '"><img src="' + src + '" alt=""></button>';
    }).join('') + '</div>' : '';
    var specs = p.features.length ? '<div class="modal__sub">Options &amp; specifications</div><ul class="specs">' + p.features.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' : '';
    modal.querySelector('.modal__panel').innerHTML =
      '<button type="button" class="modal__close" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '<div class="modal__gallery"><div class="modal__main"><img src="' + p.images[0] + '" alt="' + esc(p.name) + '"></div>' + thumbs + '</div>' +
      '<div class="modal__info"><div class="modal__meta"><span class="pill pill--brand">' + esc(p.brand) + '</span><span class="pill pill--o">' + esc(p.origin) + '</span><span class="pill">' + esc(groupName[p.group]) + '</span></div>' +
      '<h2 id="modal-title">' + esc(p.name) + '</h2><p>' + esc(p.summary) + '</p>' + specs +
      '<div class="modal__actions"><a class="btn" href="contact.html?product=' + p.slug + '">Request a Quote ' + ARROW.replace('<svg', '<svg class="arrow"') + '</a>' +
      '<a class="btn btn--wa" target="_blank" rel="noopener" href="' + window.LM_waLink('Hello Leesonmech, I would like to enquire about: ' + p.name) + '">WhatsApp Us</a></div></div>';
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    modal.querySelector('.modal__panel').scrollTop = 0;
    modal.querySelector('.modal__close').focus();
    if (push) history.replaceState(null, '', '#' + p.slug);
  }
  function closeModal() {
    if (!modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
    history.replaceState(null, '', location.pathname + location.search);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  grid.addEventListener('click', function (e) {
    var card = e.target.closest('.pcard');
    if (!card) return;
    var p = PRODUCTS.filter(function (x) { return x.slug === card.getAttribute('data-slug'); })[0];
    if (p) openModal(p, true);
  });
  modal.addEventListener('click', function (e) {
    if (e.target.closest('.modal__close') || e.target.classList.contains('modal__scrim')) { closeModal(); return; }
    var t = e.target.closest('.modal__thumbs button');
    if (t) {
      var img = modal.querySelector('.modal__main img');
      img.classList.remove('swap'); void img.offsetWidth;
      img.src = t.getAttribute('data-src'); img.classList.add('swap');
      Array.prototype.forEach.call(t.parentNode.children, function (b) { b.classList.toggle('is-active', b === t); });
    }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

  render(false);

  // Deep link: products.html#product-slug opens that product
  var hash = decodeURIComponent(location.hash.slice(1));
  var linked = hash && PRODUCTS.filter(function (x) { return x.slug === hash; })[0];
  if (linked) setTimeout(function () { openModal(linked, false); }, 900);
})();
