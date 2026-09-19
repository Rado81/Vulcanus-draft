/* ============================================================================
   Vulcanus · bevægelse, som forsiden og undersiderne deler (som faelles.css).
   Ingen scrollmotor: begge dele måler selv, og begge står færdige uden
   JavaScript og under reduceret bevægelse (CSS'ens standard er sluttilstanden).

     forløb   en ordnet liste i <div class="forloeb">: linjen fyldes ned gennem
              listen, og hvert punkt tændes, når linjen når det. Skrives som
              --f (0..1) på hvert <li> og klassen 'er-naaet'.
     måler    [[MAALER:…]] (vulcanus/render.py): bjælken og tallet tæller op,
              én gang, når måleren er halvt inde på skærmen.
   ========================================================================== */
/* Menuen i skiltet (<details class="vs-menu">) lukker, når man klikker eller
   tabber uden for den, og på Escape (så går fokus tilbage til "Menu"). Uden
   JavaScript åbner og lukker den stadig på "Menu". Ikke bevægelse: gælder også
   under reduceret bevægelse, derfor sin egen blok. */
(function () {
  'use strict';
  var menu = document.querySelector('details.vs-menu');
  if (!menu) return;
  var luk = function () { menu.removeAttribute('open'); };
  document.addEventListener('click', function (e) {
    if (menu.open && !menu.contains(e.target)) luk();
  });
  document.addEventListener('focusin', function (e) {
    if (menu.open && !menu.contains(e.target)) luk();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || !menu.open) return;
    luk();
    var knap = menu.querySelector('summary');
    if (knap) knap.focus();
  });
})();

(function () {
  'use strict';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var root = document.documentElement;
  var clamp01 = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  var easeOut = function (x) { return 1 - Math.pow(1 - x, 3); };

  // ---- forløb: linjen fyldes med scrollet -----------------------------------
  // Fyldet går kun frem: det, man har læst, slukkes ikke, når man ruller tilbage.
  var forloeb = [].slice.call(document.querySelectorAll('.forloeb'));
  if (forloeb.length) {
    root.classList.add('linje-js');
    // Scrollet sætter et MÅL (hvor langt nede linjen må være), og linjen går derhen
    // i sit eget tempo, punkt for punkt. I et højt vindue står hele listen over
    // målelinjen, før man har rullet: skrev scrollet fyldet direkte, var de første
    // punkter tændt på én gang, og kun det sidste var tilbage at se.
    // Linjens sted måles i punkter: 0 er første mærke, 1 det næste, 1,5 midt imellem.
    var TEMPO = 2;                                     // punkter i sekundet (4 var for hurtigt: Rado, 2026-09-19)
    var lister = forloeb.map(function (f) {
      return {
        el: f, maal: -1, vist: -0.4, sidst: 0,
        punkter: [].slice.call(f.querySelectorAll('ol > li')).map(function (li) { return { li: li, f: -1, naaet: false }; })
      };
    });

    var tegn = function (l) {
      l.punkter.forEach(function (p, i) {
        if (!p.naaet && l.vist >= i) { p.naaet = true; p.li.classList.add('er-naaet'); }
        var f2 = Math.round(clamp01(l.vist - i) * 200) / 200;
        if (f2 > p.f) { p.f = f2; p.li.style.setProperty('--f', f2); }
      });
    };

    var koerer = false;
    var gaa = function (t) {
      var mere = false;
      lister.forEach(function (l) {
        if (l.vist >= l.maal) { l.sidst = 0; return; }
        var dt = l.sidst ? Math.min((t - l.sidst) / 1000, 0.05) : 0.016;
        l.sidst = t;
        l.vist = Math.min(l.maal, l.vist + TEMPO * dt);
        tegn(l);
        if (l.vist < l.maal) mere = true; else l.sidst = 0;
      });
      if (mere) requestAnimationFrame(gaa); else koerer = false;
    };

    var maal = function () {
      var linjeY = innerHeight * 0.72;
      lister.forEach(function (l) {
        var r = l.el.getBoundingClientRect();
        if (r.top > innerHeight || r.bottom < -innerHeight) return;
        l.punkter.forEach(function (p, i) {
          var b = p.li.getBoundingClientRect();
          var prik = b.top + 13;                       // midten af punktets mærke (0.8rem)
          if (linjeY < prik) return;
          var her = i + (i < l.punkter.length - 1 ? clamp01((linjeY - prik) / Math.max(b.height, 1)) : 0);
          if (her > l.maal) l.maal = her;               // kun frem
        });
      });
      if (!koerer && lister.some(function (l) { return l.vist < l.maal; })) { koerer = true; requestAnimationFrame(gaa); }
    };

    var venter = false;
    var bed = function () {
      if (venter) return;
      venter = true;
      requestAnimationFrame(function () { venter = false; maal(); });
    };
    addEventListener('scroll', bed, { passive: true });
    addEventListener('resize', bed);
    addEventListener('load', bed);
    maal();
  }

  // ---- måler: tæller op én gang ---------------------------------------------
  var maalere = [].slice.call(document.querySelectorAll('[data-maaler]'));
  if (maalere.length && 'IntersectionObserver' in window) {
    var vis = function (m, g) {
      var vaerdi = parseFloat(m.getAttribute('data-maaler')) || 0;
      var fyld = m.querySelector('.maaler__fyld'), tal = m.querySelector('.maaler__tal');
      if (fyld) fyld.style.setProperty('--g', g.toFixed(4));
      if (tal) tal.textContent = (vaerdi * g).toFixed(1).replace('.', ',') + ' %';
    };
    var io = new IntersectionObserver(function (poster) {
      poster.forEach(function (p) {
        if (!p.isIntersecting) return;
        io.unobserve(p.target);
        var start = null, m = p.target;
        var trin = function (t) {
          if (start === null) start = t;
          var x = clamp01((t - start) / 1500);
          vis(m, easeOut(x));
          if (x < 1) requestAnimationFrame(trin); else m.classList.add('er-inde');
        };
        requestAnimationFrame(trin);
      });
    }, { threshold: 0.5 });
    maalere.forEach(function (m) { vis(m, 0); io.observe(m); });
  }
})();
