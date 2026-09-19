/* Kun i demoudgaven: formularerne kan ikke sende fra GitHub Pages. */
(function () {
  'use strict';
  document.querySelectorAll('form').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      window.alert('Dette er en demoversion. Formularen sender ikke beskeder endnu.');
    });
  });
})();
