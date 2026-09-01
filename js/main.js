/* LEPAK — main effects engine (vanilla JS) */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------------- Lenis smooth scroll ---------------- */
  var lenis = null;
  if (window.Lenis && !reduceMotion) {
    lenis = new Lenis({ duration: 0.8 });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -parseFloat(getComputedStyle(target).scrollMarginTop || 0) });
      });
    });
  }
  window.__lenis = lenis;

  /* scroll velocity (for ticker boosts) */
  var scrollVel = 0, smoothVel = 0, lastY = window.scrollY, lastT = performance.now();
  function velTick(now) {
    var y = window.scrollY;
    var dt = Math.max(1, now - lastT);
    scrollVel = (y - lastY) / dt * 1000; // px per s
    lastY = y; lastT = now;
    smoothVel += (scrollVel - smoothVel) * 0.08; // spring-ish smoothing
    requestAnimationFrame(velTick);
  }
  requestAnimationFrame(velTick);

  /* ---------------- split text ---------------- */
  function splitChars(el) {
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    var chars = [];
    words.forEach(function (word, wi) {
      var w = document.createElement('span');
      w.className = 'w';
      for (var i = 0; i < word.length; i++) {
        if (el.classList.contains('split-mask')) {
          var m = document.createElement('span'); m.className = 'm';
          var c = document.createElement('span'); c.className = 'c';
          c.textContent = word[i];
          m.appendChild(c); w.appendChild(m); chars.push(c);
        } else {
          var c2 = document.createElement('span'); c2.className = 'c';
          c2.textContent = word[i];
          w.appendChild(c2); chars.push(c2);
        }
      }
      el.appendChild(w);
      if (wi < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
    return chars;
  }

  document.querySelectorAll('.split-mask, .split-pop').forEach(function (el) {
    var chars = splitChars(el);
    var mid = (chars.length - 1) / 2;
    var isMask = el.classList.contains('split-mask');
    var stagger = isMask ? 0.06 : 0.02;
    var base = isMask ? 0 : 0.13;
    chars.forEach(function (c, i) {
      c.style.setProperty('--d', (base + Math.abs(mid - i) * stagger + i * 0.005).toFixed(3) + 's');
    });
    if (el.dataset.splitDur) el.style.setProperty('--sd', el.dataset.splitDur + 's');
    var repeat = el.hasAttribute('data-split-repeat');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { el.classList.add('play'); if (!repeat) io.unobserve(el); }
        else if (repeat) { el.classList.remove('play'); }
      });
    }, { rootMargin: '-10% 0px -10% 0px' });
    io.observe(el);
  });

  /* ---------------- data-reveal ---------------- */
  var revIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); revIO.unobserve(en.target); }
    });
  }, { threshold: 0.25 });
  document.querySelectorAll('[data-reveal]').forEach(function (el, i) {
    el.style.transitionDelay = (i % 4) * 0.05 + 's';
    revIO.observe(el);
  });

  /* ---------------- page-load entrances (WAAPI) ---------------- */
  if (!reduceMotion) {
    var nav = document.getElementById('nav');
    if (nav) nav.animate(
      [{ opacity: 0, transform: 'translateY(-71px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 700, delay: 100, easing: 'cubic-bezier(.44,0,.56,1)', fill: 'backwards' }
    );
    var clock = document.getElementById('heroClock');
    if (clock) clock.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1000, delay: 1100, easing: 'ease-out', fill: 'backwards' });
    var chip = document.getElementById('scrollChip');
    if (chip) chip.animate(
      [{ opacity: 0, transform: 'translateY(40px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 800, delay: 900, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }
    );
  }

  /* ---------------- nav hide/show (4px deadzone) ---------------- */
  (function () {
    var anchor = window.scrollY, dir = 'up', DEAD = 4;
    function onScroll() {
      var y = window.scrollY;
      if (y <= 0) { document.body.classList.remove('nav-hidden'); anchor = 0; return; }
      var newDir = y > anchor ? 'down' : (y < anchor ? 'up' : dir);
      if (newDir !== dir) { dir = newDir; anchor = y; return; }
      if (Math.abs(y - anchor) < DEAD) return;
      document.body.classList.toggle('nav-hidden', dir === 'down' && y > 140);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
  })();

  /* ---------------- KL clock ---------------- */
  (function () {
    var out = document.getElementById('clockTime');
    if (!out) return;
    var fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kuala_Lumpur', hour: 'numeric', minute: '2-digit', hour12: true });
    function tick() { out.textContent = fmt.format(new Date()); }
    tick(); setInterval(tick, 20000);
  })();

  /* ---------------- custom cursor ---------------- */
  (function () {
    if (!finePointer) return;
    var cur = document.getElementById('cursor');
    var x = -100, y = -100, tx = -100, ty = -100;
    window.addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function loop() {
      x += (tx - x) * 0.22; y += (ty - y) * 0.22;
      cur.style.transform = 'translate(' + (x - 11) + 'px,' + (y - 11) + 'px)';
      requestAnimationFrame(loop);
    })();

  })();

  /* ---------------- marquee rails (team + community) ---------------- */
  function marquee(railId, trackId, pxPerSec) {
    var rail = document.getElementById(railId), track = document.getElementById(trackId);
    if (!rail || !track) return;
    // duplicate content until at least 2x rail width
    var baseWidth = track.scrollWidth;
    var clones = [].slice.call(track.children);
    while (track.scrollWidth < rail.clientWidth * 2 + baseWidth) {
      clones.forEach(function (c) { track.appendChild(c.cloneNode(true)); });
    }
    var loopW = baseWidth + parseFloat(getComputedStyle(track).gap || 32);
    var x = 0, dragging = false, lastPX = 0, dragVel = 0, inView = true, lastTime = performance.now();
    var io = new IntersectionObserver(function (e) { inView = e[0].isIntersecting; });
    io.observe(rail);

    rail.addEventListener('pointerdown', function (e) { dragging = true; lastPX = e.clientX; rail.setPointerCapture(e.pointerId); });
    rail.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var d = e.clientX - lastPX; lastPX = e.clientX;
      x += d; dragVel = d;
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
      rail.addEventListener(ev, function () { dragging = false; });
    });

    (function loop(now) {
      var dt = Math.min(50, now - lastTime) / 1000; lastTime = now;
      if (inView && !reduceMotion) {
        if (!dragging) {
          var boost = Math.min(Math.abs(smoothVel) * 0.12, 340);
          x += (pxPerSec + boost) * dt;
          dragVel *= 0.94;
          x += dragVel;
        }
        // wrap
        if (x > 0) x -= loopW;
        if (x < -loopW) x += loopW;
        track.style.transform = 'translateX(' + x.toFixed(2) + 'px)';
      }
      requestAnimationFrame(loop);
    })(performance.now());
  }
  marquee('teamRail', 'teamTrack', 60);
  marquee('comRail', 'comTrack', 46);

  /* ---------------- snake tickers ---------------- */
  function snake(pathId, textPathId, phrase, idlePctPerSec) {
    var path = document.getElementById(pathId);
    var tp = document.getElementById(textPathId);
    if (!path || !tp) return;
    tp.textContent = (phrase + '   ').repeat(40);
    var svg = path.ownerSVGElement;
    var inView = true;
    var io = new IntersectionObserver(function (e) { inView = e[0].isIntersecting; });
    io.observe(svg);
    var offset = 0, period = null, lastTime = performance.now();
    function measure() {
      try {
        var total = tp.getComputedTextLength();
        var one = total / 40;
        period = one / path.getTotalLength() * 100; // % of path per phrase repeat
      } catch (e) { period = 25; }
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure); else measure();
    (function loop(now) {
      var dt = Math.min(50, now - lastTime) / 1000; lastTime = now;
      if (inView && !reduceMotion && period) {
        var boost = Math.min(Math.abs(smoothVel) * 0.004, 6);
        offset -= (idlePctPerSec + boost) * dt;
        if (offset <= -period) offset += period;
        tp.setAttribute('startOffset', offset.toFixed(3) + '%');
      }
      requestAnimationFrame(loop);
    })(performance.now());
  }
  snake('snakePathA', 'snakeTextA', 'JOM LEPAK. THE MATCHA IS READY.', 2);
  snake('snakePathB', 'snakeTextB', 'SEE YOU AT JALAN SULTAN.', 2);

  /* ---------------- specials arc conveyor ----------------
     position = scroll-driven sweep + manual drag offset (with momentum).
     Scrolling always moves the ring; dragging slides it on top of that. */
  (function () {
    var stage = document.getElementById('arcStage');
    if (!stage) return;
    var section = stage.closest('.specials');
    var items = [].slice.call(stage.querySelectorAll('.arc-item'));
    var N = items.length;
    var caps = [-6, 5, -4, 6, -5, 4];
    items.forEach(function (it, i) { it.style.setProperty('--capr', caps[i % caps.length] + 'deg'); });
    var inView = false;
    var io = new IntersectionObserver(function (e) { inView = e[0].isIntersecting; }, { rootMargin: '20% 0px 20% 0px' });
    io.observe(section);
    var THETA_SPAN = 3.6;           // radians of visible+offscreen sweep
    var SPACING = THETA_SPAN / N;   // even ring spacing
    var DRAG_K = SPACING / 300;     // one slot per ~300px of drag

    /* manual drag state */
    var manual = 0, manualVel = 0, manualTarget = 0;
    var dragging = false, intent = null, lastX = 0, lastY = 0;

    section.addEventListener('pointerdown', function (e) {
      dragging = true; intent = null; lastX = e.clientX; lastY = e.clientY;
      manualVel = 0;
      if (section.setPointerCapture) { try { section.setPointerCapture(e.pointerId); } catch (err) {} }
    });
    section.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX, dy = e.clientY - lastY;
      if (intent === null) {
        if (Math.abs(dx) + Math.abs(dy) < 6) return;
        intent = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (intent === 'y') { dragging = false; return; }   // let vertical scrolling be
      }
      lastX = e.clientX; lastY = e.clientY;
      manualTarget -= dx * DRAG_K;      // drag left -> ring advances left, same as scrolling down
      manualVel = -dx * DRAG_K;
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) {
      section.addEventListener(ev, function () { dragging = false; intent = null; });
    });

    var stageEl = section.querySelector('.specials-stage');
    function layout() {
      var rect = section.getBoundingClientRect();
      var vh = window.innerHeight;
      var progress = (vh - rect.top) / (rect.height + vh);  // 0..1 through section
      // everything positions inside the sticky STAGE, so the ring never drifts
      var w = stageEl.clientWidth;
      var h = stageEl.clientHeight;
      var R = Math.max(w * 0.62, 420);
      var cx = w / 2;
      var apexY = h * 0.54;                 // ring apex fixed at stage centre-ish
      var cys = apexY + R;
      var sweep = progress * SPACING * (N + 2.2) + manual;
      for (var i = 0; i < N; i++) {
        var theta = (i * SPACING) - sweep + THETA_SPAN * 0.62;
        // wrap cyclically
        var half = THETA_SPAN / 2;
        theta = ((theta + half) % THETA_SPAN + THETA_SPAN) % THETA_SPAN - half;
        var x = cx + R * Math.sin(theta);
        var y = cys - R * Math.cos(theta);  // stage-local y of item centre
        var iw = items[i].offsetWidth || 300;
        var ih = items[i].offsetHeight || 380;
        var s = 0.82 + 0.28 * Math.max(0, Math.cos(theta * 1.4));
        items[i].style.transform =
          'translate(' + (x - iw / 2).toFixed(1) + 'px,' + (y - ih / 2).toFixed(1) + 'px)' +
          ' rotate(' + (theta * 22).toFixed(2) + 'deg) scale(' + s.toFixed(3) + ')';
      }
    }
    (function loop() {
      if (inView) {
        if (!dragging) {
          manualTarget += manualVel;      // momentum after release
          manualVel *= 0.94;
        }
        manual += (manualTarget - manual) * 0.18;   // smooth toward target
        layout();
      }
      requestAnimationFrame(loop);
    })();
  })();

  /* ---------------- merch: linear tee slider (scroll + drag) ---------------- */
  (function () {
    var rail = document.getElementById('merchRail');
    if (!rail) return;
    var section = rail.closest('.merch');
    var stage = rail.closest('.merch-stage');
    var items = [].slice.call(rail.querySelectorAll('.merch-item'));
    var N = items.length;
    var inView = false;
    var io = new IntersectionObserver(function (e) { inView = e[0].isIntersecting; }, { rootMargin: '20% 0px 20% 0px' });
    io.observe(section);

    var manual = 0, manualVel = 0, manualTarget = 0;
    var dragging = false, intent = null, lastX = 0, lastY = 0;
    stage.addEventListener('pointerdown', function (e) {
      dragging = true; intent = null; lastX = e.clientX; lastY = e.clientY; manualVel = 0;
      if (stage.setPointerCapture) { try { stage.setPointerCapture(e.pointerId); } catch (err) {} }
    });
    stage.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX, dy = e.clientY - lastY;
      if (intent === null) {
        if (Math.abs(dx) + Math.abs(dy) < 6) return;
        intent = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (intent === 'y') { dragging = false; return; }
      }
      lastX = e.clientX; lastY = e.clientY;
      manualTarget -= dx;
      manualVel = -dx;
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) {
      stage.addEventListener(ev, function () { dragging = false; intent = null; });
    });

    function layout() {
      var rect = section.getBoundingClientRect();
      var vh = window.innerHeight;
      var vw = stage.clientWidth;
      var progress = (vh - rect.top) / (rect.height + vh);
      var SP = Math.max(vw * 0.46, 560);       // spacing between tees
      var total = N * SP;
      var sweep = progress * total * 1.25 + manual;
      var cx = vw / 2;
      for (var i = 0; i < N; i++) {
        var rel = ((i * SP - sweep + total / 2) % total + total) % total - total / 2;
        var x = cx + rel;
        var iw = items[i].offsetWidth || 460;
        var ih = items[i].offsetHeight || 520;
        var t = Math.max(0, 1 - Math.abs(rel) / (SP * 1.15));
        var sc = 0.86 + 0.18 * t;
        items[i].style.transform =
          'translate(' + (x - iw / 2).toFixed(1) + 'px,' + (vh * 0.52 - ih / 2).toFixed(1) + 'px)' +
          ' scale(' + sc.toFixed(3) + ')';
        items[i].style.zIndex = String(10 + Math.round(t * 10));
      }
    }
    (function loop() {
      if (inView) {
        if (!dragging) { manualTarget += manualVel; manualVel *= 0.94; }
        manual += (manualTarget - manual) * 0.18;
        layout();
      }
      requestAnimationFrame(loop);
    })();
  })();

  /* ---------------- menu: hover swaps the photo ---------------- */
  (function () {
    var photo = document.querySelector('.menu-photo img');
    var list = document.querySelector('.menu-list');
    if (!photo || !list) return;
    var DEFAULT = photo.getAttribute('src');
    var IMGS = ['assets/img/menu-1.webp', 'assets/img/menu-2.webp', 'assets/img/menu-3.webp',
                'assets/img/menu-4.webp', 'assets/img/menu-5.webp', 'assets/img/menu-6.webp',
                'assets/img/menu-7.webp', 'assets/img/menu-8.webp'];
    // fetch the hover set only once the menu is near the viewport
    var preIO = new IntersectionObserver(function (e) {
      if (e[0].isIntersecting) {
        IMGS.forEach(function (src) { var im = new Image(); im.src = src; });
        preIO.disconnect();
      }
    }, { rootMargin: '600px 0px' });
    preIO.observe(list.closest('.menu'));
    var pending = null;
    function swap(src) {
      if (photo.getAttribute('src') === src) return;
      photo.style.opacity = '0';
      clearTimeout(pending);
      pending = setTimeout(function () {
        photo.setAttribute('src', src);
        photo.style.opacity = '1';
      }, 160);
    }
    [].slice.call(list.children).forEach(function (li, i) {
      li.addEventListener('mouseenter', function () { if (IMGS[i]) swap(IMGS[i]); });
    });
    list.addEventListener('mouseleave', function () { swap(DEFAULT); });
  })();

  /* ---------------- gallery: photo cars riding the track ---------------- */
  (function () {
    var path = document.getElementById('trackPath');
    var carsG = document.getElementById('trackCars');
    if (!path || !carsG) return;
    var IMGS = ['assets/img/gal-1.webp', 'assets/img/gal-2.webp', 'assets/img/gal-3.webp',
                'assets/img/gal-4.webp', 'assets/img/gal-5.webp', 'assets/img/gal-6.webp',
                'assets/img/gal-7.webp', 'assets/img/gal-8.webp'];
    var NS = 'http://www.w3.org/2000/svg';
    var S = 164;
    var total = path.getTotalLength();
    var buildCars = function () { return IMGS.map(function (src) {
      var g = document.createElementNS(NS, 'g');
      var img = document.createElementNS(NS, 'image');
      img.setAttribute('href', src);
      img.setAttribute('x', -S / 2); img.setAttribute('y', -S / 2);
      img.setAttribute('width', S); img.setAttribute('height', S);
      img.setAttribute('preserveAspectRatio', 'xMidYMid slice');
      img.setAttribute('clip-path', 'url(#carClip)');
      var frame = document.createElementNS(NS, 'rect');
      frame.setAttribute('x', -S / 2); frame.setAttribute('y', -S / 2);
      frame.setAttribute('width', S); frame.setAttribute('height', S);
      frame.setAttribute('rx', 22);
      frame.setAttribute('class', 'track-car-frame');
      g.appendChild(img); g.appendChild(frame);
      carsG.appendChild(g);
      return g;
    }); };
    var cars = [];
    var svg = path.ownerSVGElement;
    var inView = false;
    // photos are fetched only when the track approaches, not at page open
    var buildIO = new IntersectionObserver(function (e) {
      if (e[0].isIntersecting && !cars.length) { cars = buildCars(); buildIO.disconnect(); }
    }, { rootMargin: '800px 0px' });
    buildIO.observe(svg);
    new IntersectionObserver(function (e) { inView = e[0].isIntersecting; }).observe(svg);
    // sample the path ONCE; per-frame native path walks are expensive
    var SAMPLES = 900, pts = [];
    for (var si = 0; si <= SAMPLES; si++) pts.push(path.getPointAtLength(total * si / SAMPLES));
    function at(L) {
      var f = (L / total) * SAMPLES;
      var i0 = Math.floor(f) % SAMPLES, i1 = (i0 + 1) % SAMPLES, t = f - Math.floor(f);
      var a = pts[i0], b = pts[i1];
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t,
               ang: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI };
    }
    var offset = 0, lastTime = performance.now();
    var IDLE = total * 0.02;           // 2% of the line per second
    (function loop(now) {
      var dt = Math.min(50, now - lastTime) / 1000; lastTime = now;
      if (inView && !reduceMotion) {
        var boost = Math.min(Math.abs(smoothVel) * 0.35, total * 0.10);
        offset = (offset + (IDLE + boost) * dt) % total;
        for (var i = 0; i < cars.length; i++) {
          var p = at((offset + i * total / cars.length) % total);
          cars[i].setAttribute('transform', 'translate(' + p.x.toFixed(1) + ',' + p.y.toFixed(1) + ') rotate(' + p.ang.toFixed(2) + ')');
        }
      }
      requestAnimationFrame(loop);
    })(performance.now());
  })();

  /* ---------------- FAQ accordion ---------------- */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var q = item.querySelector('.faq-q'), a = item.querySelector('.faq-a');
    q.addEventListener('click', function () {
      var open = item.classList.toggle('open');
      a.style.maxHeight = open ? a.scrollHeight + 'px' : '0px';
    });
  });

  /* ---------------- hero parallax (logo + tagline drift) ---------------- */
  (function () {
    var content = document.querySelector('.hero-content');
    var logo = document.querySelector('.hero-logo');
    var tag = document.querySelector('.hero-tag');
    if (!content || reduceMotion || !finePointer) return;
    function onScroll() {
      var y = window.scrollY;
      if (y > window.innerHeight * 1.2) return;
      logo.style.transform = 'translateY(' + (-y * 0.10).toFixed(1) + 'px)';
      tag.style.transform = 'translateY(' + (-y * 0.15).toFixed(1) + 'px)';
    }
    window.addEventListener('scroll', onScroll, { passive: true });
  })();

})();
