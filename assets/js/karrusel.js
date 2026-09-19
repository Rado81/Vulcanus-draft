/* Billedkarrusel på profil- og skadesiden, som på den nuværende side:
 * 4 billeder ad gangen (2 på tablet, 1 på mobil, styret af --synlige i
 * style.css), 10 px mellemrum, pile og prikker, automatisk skift hvert
 * 5. sekund i en uendelig løkke, pause ved hover/fokus og stop, når brugeren
 * selv bladrer. Uden JavaScript er rækken en almindelig vandret rulleliste.
 * Brugere, der har slået animationer fra, får ingen automatisk afspilning.
 * Et klik på et billede åbner det i fuld størrelse i en lysboks; uden
 * JavaScript åbner linket blot billedfilen.
 * Ekstern fil (ikke inline), så CSP'en kan nøjes med script-src 'self'. */
(function () {
  'use strict';
  var INTERVAL = 5000;
  var reduceret = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function knap(klasse, etiket, tegn) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = klasse;
    b.setAttribute('aria-label', etiket);
    b.textContent = tegn;
    return b;
  }

  // Lysboks: et klik på et billede viser det i fuld størrelse (som på den
  // nuværende side). Én delt <dialog>; showModal() giver fokusfælde og Esc.
  var lys = null;
  function lysboks() {
    if (lys) { return lys; }
    var d = document.createElement('dialog');
    d.className = 'lysboks';
    d.setAttribute('aria-label', 'Billedvisning');
    var luk = knap('lysboks__luk', 'Luk', '×');
    var tilbage = knap('lysboks__pil lysboks__pil--forrige', 'Forrige billede', '‹');
    var frem = knap('lysboks__pil lysboks__pil--naeste', 'Næste billede', '›');
    var billede = document.createElement('img');
    billede.className = 'lysboks__billede';
    var taeller = document.createElement('p');
    taeller.className = 'lysboks__taeller';
    [luk, tilbage, billede, frem, taeller].forEach(function (e) { d.appendChild(e); });
    document.body.appendChild(d);

    lys = { dialog: d, liste: [], nr: 0 };
    lys.vis = function (nr) {
      var m = lys.liste.length;
      lys.nr = (nr + m) % m;
      var link = lys.liste[lys.nr];
      var lille = link.querySelector('img');
      billede.src = link.getAttribute('href');
      billede.alt = lille ? lille.getAttribute('alt') : '';
      taeller.textContent = (lys.nr + 1) + ' / ' + m;
    };
    luk.addEventListener('click', function () { d.close(); });
    tilbage.addEventListener('click', function () { lys.vis(lys.nr - 1); });
    frem.addEventListener('click', function () { lys.vis(lys.nr + 1); });
    d.addEventListener('click', function (e) { if (e.target === d) { d.close(); } });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { lys.vis(lys.nr - 1); }
      if (e.key === 'ArrowRight') { lys.vis(lys.nr + 1); }
    });
    return lys;
  }

  document.querySelectorAll('[data-karrusel]').forEach(function (rod) {
    var spor = rod.querySelector('.karrusel__spor');
    var originaler = Array.prototype.slice.call(spor.children);
    var n = originaler.length;
    if (n < 2) { return; }
    rod.classList.add('karrusel--aktiv');

    // Kopier alle billeder én gang efter originalerne, så løkken kan køre
    // videre uden hop; kopierne skjules for skærmlæsere.
    originaler.forEach(function (s) {
      var kopi = s.cloneNode(true);
      kopi.setAttribute('aria-hidden', 'true');
      kopi.querySelectorAll('img').forEach(function (i) { i.alt = ''; });
      kopi.querySelectorAll('a').forEach(function (a) { a.tabIndex = -1; });
      spor.appendChild(kopi);
    });

    var links = originaler.map(function (s) { return s.querySelector('a'); });
    var svejset = false;

    spor.addEventListener('click', function (e) {
      var a = e.target.closest('a.karrusel__link');
      if (!a) { return; }
      e.preventDefault();
      if (svejset) { svejset = false; return; }   // et stryg er ikke et klik
      if (!window.HTMLDialogElement) { window.location.href = a.href; return; }
      stop();
      var slide = a.closest('.karrusel__slide');
      var nr = Array.prototype.indexOf.call(spor.children, slide) % n;
      var l = lysboks();
      l.liste = links;
      l.vis(nr);
      l.dialog.showModal();
    });

    var index = 0;
    var stoppet = reduceret;
    var holdt = false;

    var forrige = knap('karrusel__pil karrusel__pil--forrige', 'Forrige billede', '‹');
    var naeste = knap('karrusel__pil karrusel__pil--naeste', 'Næste billede', '›');
    rod.appendChild(forrige);
    rod.appendChild(naeste);

    var prikkeliste = document.createElement('div');
    prikkeliste.className = 'karrusel__prikker';
    var prikker = originaler.map(function (_, i) {
      var p = knap('karrusel__prik', 'Vis billede ' + (i + 1), '');
      p.addEventListener('click', function () { stop(); gaaTil(i); });
      prikkeliste.appendChild(p);
      return p;
    });
    rod.appendChild(prikkeliste);

    function skridt() {
      var gap = parseFloat(getComputedStyle(spor).columnGap) || 0;
      return originaler[0].getBoundingClientRect().width + gap;
    }

    function vis(animer) {
      spor.classList.toggle('karrusel__spor--straks', !animer);
      spor.style.transform = 'translateX(' + (-index * skridt()) + 'px)';
      prikker.forEach(function (p, i) {
        p.setAttribute('aria-current', i === index % n ? 'true' : 'false');
      });
    }

    function gaaTil(ny) {
      if (ny < 0) {
        // Baglæns fra første billede: spring usynligt til kopien, og glid derfra.
        index = n;
        vis(false);
        void spor.offsetWidth;
        ny = n - 1;
      }
      index = ny;
      vis(true);
    }

    spor.addEventListener('transitionend', function () {
      if (index >= n) {
        index -= n;
        vis(false);
      }
    });

    function stop() { stoppet = true; }

    forrige.addEventListener('click', function () { stop(); gaaTil(index - 1); });
    naeste.addEventListener('click', function () { stop(); gaaTil(index + 1); });

    rod.addEventListener('mouseenter', function () { holdt = true; });
    rod.addEventListener('mouseleave', function () { holdt = false; });
    rod.addEventListener('focusin', function () { holdt = true; });
    rod.addEventListener('focusout', function () { holdt = false; });

    // Stryg til siden på touchskærme.
    var startX = null;
    rod.addEventListener('pointerdown', function (e) { startX = e.clientX; });
    rod.addEventListener('pointerup', function (e) {
      if (startX === null) { return; }
      var dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 40) { svejset = true; stop(); gaaTil(index + (dx < 0 ? 1 : -1)); }
    });

    window.addEventListener('resize', function () { vis(false); });

    setInterval(function () {
      if (!stoppet && !holdt && !document.hidden) { gaaTil(index + 1); }
    }, INTERVAL);

    vis(false);
  });
})();
