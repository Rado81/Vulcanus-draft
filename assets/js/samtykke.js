/* Cookiesamtykke til Google Maps-kortet på kontaktsiden.
 * Siden sætter ikke selv cookies; kun kortet (Google) gør. Kortet oprettes
 * derfor først her, når den besøgende har sagt ja i banneret. Valget gemmes
 * i localStorage ('vulcanus-samtykke') i 365 dage, derefter spørges igen.
 * "Cookieindstillinger" i sidefoden viser banneret igen, så valget kan ændres.
 * Uden JavaScript vises hverken banner eller kort.
 * Ekstern fil (ikke inline), så CSP'en kan nøjes med script-src 'self'. */
(function () {
  'use strict';
  var NOEGLE = 'vulcanus-samtykke';
  var GYLDIG_MS = 365 * 24 * 60 * 60 * 1000;
  var banner = document.getElementById('cookiebanner');

  function laes() {
    try {
      var v = JSON.parse(window.localStorage.getItem(NOEGLE));
      if (v && (v.valg === 'ja' || v.valg === 'nej') && Date.now() - v.tid < GYLDIG_MS) {
        return v.valg;
      }
    } catch (e) { /* intet gemt valg, eller lageret er spærret */ }
    return null;
  }

  function gem(valg) {
    try {
      window.localStorage.setItem(NOEGLE, JSON.stringify({ valg: valg, tid: Date.now() }));
    } catch (e) { /* valget gælder så kun for denne sidevisning */ }
  }

  function visKort() {
    document.querySelectorAll('[data-samtykke-kort]').forEach(function (ramme) {
      if (ramme.querySelector('iframe')) { return; }
      var kort = document.createElement('iframe');
      kort.src = ramme.getAttribute('data-kort-src');
      kort.title = ramme.getAttribute('data-kort-titel');
      kort.loading = 'lazy';
      kort.allowFullscreen = true;
      ramme.textContent = '';
      ramme.appendChild(kort);
    });
  }

  function vaelg(valg) {
    var foer = laes();
    gem(valg);
    if (banner) { banner.hidden = true; }
    if (valg === 'ja') {
      visKort();
    } else if (foer === 'ja') {
      // Samtykket er trukket tilbage: genindlæs, så kortet forsvinder igen.
      window.location.reload();
    }
  }

  document.querySelectorAll('[data-samtykke]').forEach(function (knap) {
    knap.hidden = false;
    knap.addEventListener('click', function () {
      vaelg(knap.getAttribute('data-samtykke'));
    });
  });

  document.querySelectorAll('[data-cookieindstillinger]').forEach(function (knap) {
    knap.hidden = false;
    knap.addEventListener('click', function () {
      if (!banner) { return; }
      banner.hidden = false;
      var foerste = banner.querySelector('button');
      if (foerste) { foerste.focus(); }
    });
  });

  var valg = laes();
  if (valg === 'ja') {
    visKort();
  } else if (valg === null && banner) {
    banner.hidden = false;
  }
})();
