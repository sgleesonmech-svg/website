/* LEESONMECH — interactive regional-presence globe + country slider */
(function () {
  'use strict';
  var root = document.querySelector('[data-globe]');
  if (!root || !window.LM_LAND) return;

  var canvas = root.querySelector('canvas');
  var ctx = canvas.getContext('2d');
  var track = document.querySelector('.rslider__track');
  var slides = Array.prototype.slice.call(document.querySelectorAll('.rslide'));
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var RAD = Math.PI / 180;

  var places = slides.map(function (s) {
    return { lon: parseFloat(s.getAttribute('data-lon')), lat: parseFloat(s.getAttribute('data-lat')), name: s.getAttribute('data-name'), el: s };
  });
  var hq = places[0];

  // pre-convert land dots to unit vectors
  var L = window.LM_LAND, dots = new Float32Array(L.length / 2 * 3);
  for (var i = 0, j = 0; i < L.length; i += 2, j += 3) {
    var lo = L[i] / 10 * RAD, la = L[i + 1] / 10 * RAD;
    dots[j] = Math.cos(la) * Math.sin(lo); dots[j + 1] = Math.sin(la); dots[j + 2] = Math.cos(la) * Math.cos(lo);
  }

  var view = { lon: hq.lon, lat: 8 };      // current centre of the globe
  var target = null;                       // animating towards {lon, lat}
  var active = 0;
  var size = 0, dpr = 1, R = 0, cx = 0, cy = 0;
  var visible = true, t0 = performance.now();

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    size = canvas.clientWidth; // layout size — unaffected by the reveal's scale transform
    canvas.width = size * dpr; canvas.height = size * dpr;
    R = size * 0.44; cx = size / 2; cy = size / 2;
  }

  // orthographic projection of unit vector -> screen, returns depth (z>0 = front)
  function project(x, y, z, out) {
    var l = view.lon * RAD, p = view.lat * RAD;
    var x1 = x * Math.cos(l) - z * Math.sin(l);
    var z1 = x * Math.sin(l) + z * Math.cos(l);
    var y2 = y * Math.cos(p) - z1 * Math.sin(p);
    var z2 = y * Math.sin(p) + z1 * Math.cos(p);
    out[0] = cx + x1 * R; out[1] = cy - y2 * R; out[2] = z2;
    return out;
  }
  function vec(lon, lat) { lon *= RAD; lat *= RAD; return [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)]; }

  var tmp = [0, 0, 0];
  function draw(now) {
    var t = (now - t0) / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    // halo + sphere
    var halo = ctx.createRadialGradient(cx, cy, R * .9, cx, cy, R * 1.16);
    halo.addColorStop(0, 'rgba(224,125,38,.22)'); halo.addColorStop(1, 'rgba(224,125,38,0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, R * 1.16, 0, 7); ctx.fill();
    var g = ctx.createRadialGradient(cx - R * .35, cy - R * .4, R * .1, cx, cy, R);
    g.addColorStop(0, '#34408a'); g.addColorStop(.6, '#1c2454'); g.addColorStop(1, '#0e1430');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();

    // land
    var ds = Math.max(1, R / 170);
    for (var k = 0; k < dots.length; k += 3) {
      project(dots[k], dots[k + 1], dots[k + 2], tmp);
      if (tmp[2] <= 0) continue;
      ctx.fillStyle = 'rgba(214,224,245,' + (0.18 + tmp[2] * 0.72).toFixed(2) + ')';
      ctx.fillRect(tmp[0] - ds / 2, tmp[1] - ds / 2, ds * 1.15, ds * 1.15);
    }

    // arcs from HQ (clipped to the sphere so long routes never poke past the edge)
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.clip();
    var a = vec(hq.lon, hq.lat);
    places.forEach(function (pl, idx) {
      if (idx === 0) return;
      var b = vec(pl.lon, pl.lat);
      var dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2], om = Math.acos(Math.min(1, dot)), so = Math.sin(om);
      if (so < 1e-4) return;
      var lift = 1 + Math.min(.1, om * .12);
      ctx.beginPath();
      var started = false;
      for (var s = 0; s <= 40; s++) {
        var f = s / 40, w1 = Math.sin((1 - f) * om) / so, w2 = Math.sin(f * om) / so, h = 1 + (lift - 1) * Math.sin(f * Math.PI);
        project((a[0] * w1 + b[0] * w2) * h, (a[1] * w1 + b[1] * w2) * h, (a[2] * w1 + b[2] * w2) * h, tmp);
        if (tmp[2] < 0) { started = false; continue; }
        if (!started) { ctx.moveTo(tmp[0], tmp[1]); started = true; } else ctx.lineTo(tmp[0], tmp[1]);
      }
      var on = idx === active;
      ctx.strokeStyle = on ? 'rgba(242,138,46,.95)' : 'rgba(242,138,46,.4)';
      ctx.lineWidth = on ? 2 : 1.2;
      ctx.setLineDash([5, 5]); ctx.lineDashOffset = reduceMotion ? 0 : -t * 18;
      ctx.stroke(); ctx.setLineDash([]);
    });
    ctx.restore();

    // markers
    places.forEach(function (pl, idx) {
      var v = vec(pl.lon, pl.lat); project(v[0], v[1], v[2], tmp);
      pl.sx = tmp[0]; pl.sy = tmp[1]; pl.front = tmp[2] > 0.05;
      if (!pl.front) return;
      var on = idx === active, pulse = reduceMotion ? .5 : (t * .8 + idx * .15) % 1;
      ctx.strokeStyle = 'rgba(242,138,46,' + (1 - pulse).toFixed(2) + ')'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(tmp[0], tmp[1], (on ? 8 : 5) + pulse * (on ? 16 : 10), 0, 7); ctx.stroke();
      ctx.fillStyle = idx === 0 ? '#fff' : '#f28a2e';
      ctx.beginPath(); ctx.arc(tmp[0], tmp[1], on ? 6 : 4, 0, 7); ctx.fill();
      if (idx === 0) { ctx.strokeStyle = '#f28a2e'; ctx.lineWidth = 2.5; ctx.stroke(); }
      if (on) {
        ctx.font = '700 13px "Red Hat Display", Arial, sans-serif';
        var label = pl.name, w = ctx.measureText(label).width + 20, lx = Math.min(size - w - 4, Math.max(4, tmp[0] - w / 2)), ly = tmp[1] - 42;
        ctx.fillStyle = '#fff'; roundRect(lx, ly, w, 26, 7); ctx.fill();
        ctx.fillStyle = '#242e63'; ctx.fillText(label, lx + 10, ly + 17.5);
      }
    });
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // animation loop
  var dragging = false, idleAt = 0;
  function loop(now) {
    if (visible) {
      if (target) {
        var dl = ((target.lon - view.lon + 540) % 360) - 180;
        view.lon += dl * 0.08; view.lat += (target.lat - view.lat) * 0.08;
        if (Math.abs(dl) < .05 && Math.abs(target.lat - view.lat) < .05) target = null;
      } else if (!dragging && !reduceMotion && now - idleAt > 4000) {
        view.lon -= 0.06; // slow drift once the visitor stops interacting
      }
      draw(now);
    }
    requestAnimationFrame(loop);
  }

  function select(idx) {
    active = idx;
    target = { lon: places[idx].lon, lat: Math.max(-30, Math.min(30, places[idx].lat)) };
    idleAt = performance.now();
    slides.forEach(function (s, i) { s.classList.toggle('is-active', i === idx); s.setAttribute('aria-pressed', String(i === idx)); });
    var s = slides[idx];
    track.scrollTo({ left: s.offsetLeft - (track.clientWidth - s.offsetWidth) / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  // drag to rotate, tap a marker to select
  var start = null;
  canvas.addEventListener('pointerdown', function (e) {
    start = { x: e.clientX, y: e.clientY, lon: view.lon, lat: view.lat, moved: false };
    dragging = true; target = null; canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', function (e) {
    var r = canvas.getBoundingClientRect(), k = size / r.width, mx = (e.clientX - r.left) * k, my = (e.clientY - r.top) * k;
    if (!start) { canvas.style.cursor = hit(mx, my) >= 0 ? 'pointer' : 'grab'; return; }
    var dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) start.moved = true;
    view.lon = start.lon - dx * 0.35; view.lat = Math.max(-60, Math.min(60, start.lat + dy * 0.35));
    canvas.style.cursor = 'grabbing';
  });
  function end(e) {
    if (!start) return;
    if (!start.moved) {
      var r = canvas.getBoundingClientRect(), k = size / r.width, h = hit((e.clientX - r.left) * k, (e.clientY - r.top) * k);
      if (h >= 0) select(h);
    }
    start = null; dragging = false; idleAt = performance.now(); canvas.style.cursor = 'grab';
  }
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  function hit(x, y) {
    var best = -1, bd = 22 * 22;
    places.forEach(function (p, i) { if (!p.front) return; var d = (p.sx - x) * (p.sx - x) + (p.sy - y) * (p.sy - y); if (d < bd) { bd = d; best = i; } });
    return best;
  }

  // slider
  slides.forEach(function (s, i) { s.addEventListener('click', function () { select(i); }); });
  var prev = document.querySelector('.rslider__btn--prev'), next = document.querySelector('.rslider__btn--next');
  if (prev) prev.addEventListener('click', function () { select((active - 1 + places.length) % places.length); });
  if (next) next.addEventListener('click', function () { select((active + 1) % places.length); });
  root.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') select((active + 1) % places.length);
    if (e.key === 'ArrowLeft') select((active - 1 + places.length) % places.length);
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(canvas);
  }
  window.addEventListener('resize', resize);
  resize();
  slides[0].classList.add('is-active');
  requestAnimationFrame(loop);
})();
