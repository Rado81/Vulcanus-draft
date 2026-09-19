/* ============================================================================
   Vulcanus · "To sider". Page-local choreography.

   The engine (scrollcraft.js) is untouched and drives every cue, reveal and
   flow entrance on the page. This file owns only what the kit has no device for:

     --split   where the line stands. 0.5 until Jan has crossed it, 0.3 while
               your side is the wide one, 0 when it has the screen.
     hero      the depth planes and the fold of both photographs into the line,
               both sides' mirrors of the scrubbed clip, and the arrow
     gauge     the line filling to 45,2 % (Danish decimal comma, real figure)
     peak      THE SIGNATURE MOVE: the portrait crossing the line
     keyboard  parking a pinned act where a focused link's cue is open

   Everything is written as custom properties; to-sider.css decides what they
   mean at each breakpoint and under reduced motion.
   ========================================================================== */
(function () {
  'use strict';

  ScrollCraft.mount(document.body);

  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)');
  var $ = function (s, el) { return (el || document).querySelector(s); };

  var hero = $('[data-vs-hero]'), gauge = $('[data-vs-gauge]');
  var peak = $('[data-vs-peak]'), close = $('[data-vs-close]');
  var chrome = $('[data-vs-chrome]');
  var heroStage = $('[data-sc-stage]', hero);
  var gaugeStage = $('[data-sc-stage]', gauge);
  var peakStage = $('[data-sc-stage]', peak);
  var gaugeNum = $('[data-vs-gauge-num]', gauge);
  var fotos = [].slice.call(document.querySelectorAll('.vs-a__indre figure.billede'));

  // Ankenævnet for Forsikring, sag 99364 (content/forside.md). Not a design value.
  var SKADEGRAD = parseFloat(gauge.getAttribute('data-vs-gauge-value')) || 45.2;

  var clamp01 = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  var seg = function (p, a, b) { return clamp01((p - a) / (b - a)); };
  var smooth = function (x) { return x * x * (3 - 2 * x); };
  var easeOut = function (x) { return 1 - Math.pow(1 - x, 3); };
  // Reduced motion keeps the states and drops the travel between them.
  var step = function (x) { return x > 0.5 ? 1 : 0; };

  // Same formula the engine uses for a pinned act, so page state and cues agree.
  function progress(act) {
    var r = act.getBoundingClientRect();
    return clamp01(-r.top / Math.max(r.height - innerHeight, 1));
  }

  // Only touch the style when the rounded value actually changed.
  function set(el, name, value) {
    var seen = el.__vs || (el.__vs = {});
    if (seen[name] === value) return;
    seen[name] = value;
    el.style.setProperty(name, value);
  }

  function frame() {
    var pH = progress(hero), pG = progress(gauge), pP = progress(peak), pC = progress(close);

    // hero: planes drift apart, then both photographs fold into the line
    var h = reduce ? 0 : smooth(seg(pH, 0, 0.55));
    // Folded away as the second beat's copy opens (its cue starts at 0.66 and is
    // still faint when the last sliver of photograph reaches the line at 0.72):
    // copy that fades in while a photograph still covers half of it reads as a bug.
    var wipe = smooth(seg(pH, 0.4, 0.72));
    set(heroStage, '--h', h.toFixed(4));
    set(heroStage, '--wipe', wipe.toFixed(4));

    // gauge: fast at first, slowing into the stop, just under the limit
    var g = reduce ? 1 : easeOut(seg(pG, 0.06, 0.56));
    var value = SKADEGRAD * g;
    set(gaugeStage, '--g', (value / 100).toFixed(4));
    var text = value.toFixed(1).replace('.', ',') + ' %';
    if (gaugeNum.textContent !== text) gaugeNum.textContent = text;

    // peak: he crosses, and only then does the line give
    var t = smooth(seg(pP, 0.14, 0.6));
    var give = smooth(seg(pP, 0.7, 0.93));
    var collapse = smooth(seg(pC, 0.04, 0.42));
    if (reduce) { give = step(give); collapse = step(collapse); }
    set(peakStage, '--jan-t', t.toFixed(4));

    var split = (0.5 - 0.2 * give) * (1 - collapse);
    set(root, '--split', split.toFixed(4));

    // The photographs inside the answers open with the scroll. They come from
    // Markdown, so they carry no data-sc-reveal, and a reveal window written as
    // act progress would drift with every edit to the copy: measure them instead.
    // Without this (no JavaScript, reduced motion) --rv is unset and they stand open.
    if (!reduce) fotos.forEach(function (f) {
      var r = f.getBoundingClientRect();
      if (r.bottom < -innerHeight || r.top > innerHeight * 2) return;
      set(f, '--rv', smooth(clamp01((innerHeight * 0.96 - r.top) / (innerHeight * 0.5))).toFixed(3));
    });

    // What actually paints, rounded, for the verification harness. Not raw
    // scroll progress: if these hold still while the wheel turns, that is a
    // finding. The resolved close is the one authored hold.
    chrome.setAttribute('data-sc-verify-state', [
      's' + split.toFixed(3), 'h' + h.toFixed(2), 'w' + wipe.toFixed(2),
      'g' + value.toFixed(1), 'j' + t.toFixed(2)
    ].join(' '));
    chrome.setAttribute('data-sc-verify-hold', pC >= 0.62 ? 'true' : 'false');
  }

  var ticking = false;
  function request() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; frame(); });
  }
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request);
  addEventListener('load', request);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(request);
  frame();

  // ---- pointer: the room shifts a little when you lean ----------------------
  // Additive. Touch, keyboard and reduced-motion visitors get the same complete
  // composition. Interpolated, never tracked 1:1, and idle once it has settled.
  (function () {
    if (reduce) return;
    var tx = 0, ty = 0, x = 0, y = 0, running = false;
    function loop() {
      x += (tx - x) * 0.08; y += (ty - y) * 0.08;
      heroStage.style.setProperty('--mx', x.toFixed(3));
      heroStage.style.setProperty('--my', y.toFixed(3));
      if (Math.abs(tx - x) + Math.abs(ty - y) > 0.002) requestAnimationFrame(loop);
      else running = false;
    }
    addEventListener('pointermove', function (e) {
      if (!fine.matches || e.pointerType === 'touch') return;
      if (hero.getBoundingClientRect().bottom < 0) return;
      tx = (e.clientX / innerWidth) * 2 - 1;
      ty = (e.clientY / innerHeight) * 2 - 1;
      if (!running) { running = true; requestAnimationFrame(loop); }
    }, { passive: true });
  })();

  // ---- the clips wait for the page --------------------------------------------
  // The engine fetches a clip as soon as its act is near, and the hero is near
  // from the first millisecond: several megabytes competing with the poster,
  // which is the page's LCP. So the address sits in data-vs-src and is handed to
  // the engine (data-sc-src) only once the page has loaded and gone idle. On a
  // slow or data-saving connection it is never handed over: the stills are the
  // whole page there, exactly as under reduced motion.
  (function () {
    var clips = [].slice.call(document.querySelectorAll('video[data-vs-src]'));
    var net = navigator.connection || {};
    if (reduce || !clips.length || net.saveData || /(^|-)[23]g$/.test(net.effectiveType || '')) return;
    function arm() {
      clips.forEach(function (v) {
        v.setAttribute('data-sc-src', v.getAttribute('data-vs-src'));
        if (v.getAttribute('data-vs-src-mobile')) v.setAttribute('data-sc-src-mobile', v.getAttribute('data-vs-src-mobile'));
      });
      dispatchEvent(new Event('scroll'));      // the engine looks for clips when it reads the scroll
    }
    function idle() {
      if (window.requestIdleCallback) requestIdleCallback(arm, { timeout: 2500 }); else setTimeout(arm, 800);
    }
    if (document.readyState === 'complete') idle(); else addEventListener('load', idle);
  })();

  // ---- wind in the garden: the close act's photograph, alive -------------------
  // A loop, not a scrub, so the engine has no part in it. It lies over the
  // photograph and shows only where something moves (forside.css masks it). It is
  // the last thing on the page and the least important, so it is fetched only when
  // the close act is near, only on a wide screen with a decent connection, never
  // under reduced motion, and it plays only while it can be seen.
  (function () {
    var vind = $('video[data-vs-vind]', close);
    var net = navigator.connection || {};
    if (!vind || reduce || !('IntersectionObserver' in window)) return;
    if (net.saveData || /(^|-)[23]g$/.test(net.effectiveType || '')) return;
    var bred = matchMedia('(min-width: 861px)');
    var hentet = false;
    vind.addEventListener('playing', function () { close.classList.add('vs-har-vind'); });
    new IntersectionObserver(function (poster) {
      var inde = poster[0].isIntersecting;
      if (inde && !hentet && bred.matches) {
        hentet = true;
        vind.src = vind.getAttribute('data-vs-vind');
      }
      if (!hentet) return;
      if (inde) { var p = vind.play(); if (p && p.catch) p.catch(function () {}); } else vind.pause();
    }, { rootMargin: '100% 0px' }).observe(close);
  })();

  // ---- scrubbed clips: one decode, two sides ---------------------------------
  // The engine scrubs ONE clip per act. Both sides are canvases that take every
  // frame that clip paints, in the same call, so the two halves of the picture
  // cannot be a frame apart along the line; forside.css grades the cold one. A
  // <video> on one side and a canvas on the other is always one frame out, and
  // two clips would double the download and seek out of step.
  [hero, gauge].forEach(function (act) {
    var clip = $('video[data-sc-scrub]', act);
    var spejle = [].slice.call(act.querySelectorAll('[data-vs-spejl]'));
    if (reduce || !clip || !spejle.length) return;
    var ctx = spejle.map(function (c) { return c.getContext('2d', { alpha: false }); });
    var sized = false;
    function draw() {
      if (clip.readyState < 2 || !clip.videoWidth) return;
      if (!sized) { spejle.forEach(function (c) { c.width = clip.videoWidth; c.height = clip.videoHeight; }); sized = true; }
      ctx.forEach(function (x, i) { x.drawImage(clip, 0, 0, spejle[i].width, spejle[i].height); });
      act.classList.add('vs-har-spejl');
    }
    if (clip.requestVideoFrameCallback) {
      var next = function () { draw(); clip.requestVideoFrameCallback(next); };
      clip.requestVideoFrameCallback(next);
    }
    // Safari presents a seeked frame without always reporting it as a new one.
    clip.addEventListener('seeked', draw);
    clip.addEventListener('loadeddata', draw);
  });

  // ---- the comparison table takes sides ---------------------------------------
  // "Arbejder for" is the page's idea in one column. The table is Markdown, so
  // the rows carry no class: read the column, and let each row take its side's
  // colour as the table comes up the screen. Which side a row is on is
  // information, not motion, so under reduced motion the rows are simply tinted.
  // Without JavaScript the one accented row in forside.css stands as before.
  (function () {
    var tabel = $('.tabel-rul');
    if (!tabel) return;
    var raekker = [].slice.call(tabel.querySelectorAll('tbody tr'));
    raekker.forEach(function (tr, i) {
      var hvem = tr.cells[1] ? tr.cells[1].textContent.trim().toLowerCase() : '';
      if (hvem.indexOf('dig') === 0) tr.classList.add('er-din');
      else if (hvem.indexOf('selskab') !== -1) tr.classList.add('er-deres');
      tr.style.setProperty('--nr', i);
    });
    var ind = function () { raekker.forEach(function (tr) { tr.classList.add('er-inde'); }); };
    if (reduce || !('IntersectionObserver' in window)) { ind(); return; }
    tabel.classList.add('tabel-venter');
    var io = new IntersectionObserver(function (poster) {
      if (!poster.some(function (p) { return p.isIntersecting; })) return;
      io.disconnect();
      ind();
    }, { threshold: 0.4 });
    io.observe(tabel);
  })();

  // ---- the arrow: on into the hero, not past it -------------------------------
  // Its href is the next section, which is right without JavaScript. With it,
  // that jump would skip the second half of the hero, so stop where that opens.
  (function () {
    var pil = $('[data-vs-pil]', hero);
    if (!pil) return;
    pil.addEventListener('click', function (e) {
      e.preventDefault();
      var r = hero.getBoundingClientRect();
      var top = r.top + scrollY, travel = Math.max(r.height - innerHeight, 1);
      scrollTo({ top: Math.round(top + travel * 0.9), behavior: reduce ? 'instant' : 'smooth' });
    });
  })();

  // ---- keyboard: a link inside a pinned cue --------------------------------
  // A pinned stage holds one viewport position for its whole act, so the
  // engine's centre-on-focus cannot open the cue (it scrolls back out of the act
  // to progress 0). Park the act where that link's own cue is open instead.
  addEventListener('focusin', function (e) {
    var el = e.target;
    if (!el || !el.getAttribute) return;
    // The links come from Markdown, so the parking point sits on their block.
    var holder = el.closest ? el.closest('[data-vs-focus-p]') : null;
    var at = holder ? parseFloat(holder.getAttribute('data-vs-focus-p')) : NaN;
    if (isNaN(at)) return;
    var act = el.closest('[data-sc-act]');
    if (!act) return;
    var r = act.getBoundingClientRect();
    var top = r.top + scrollY, travel = Math.max(r.height - innerHeight, 1);
    var here = clamp01((scrollY - top) / travel);
    if (Math.abs(here - at) < 0.12) return;
    scrollTo({ top: Math.round(top + travel * at), behavior: 'instant' });
  });
})();
