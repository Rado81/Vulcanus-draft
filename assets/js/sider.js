/* Undersidernes indtoning: et afsnit toner ind, når det kommer ind på skærmen.
   (Forløbslinjen og måleren deles med forsiden og står i faelles.js.) Klassen 'us-js' sættes først her, så alt står fremme uden JavaScript,
   og scriptet gør ingenting under reduceret bevægelse. */
(function () {
  if (!("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var el = document.querySelectorAll("[data-us-ind]");
  if (!el.length) return;
  document.documentElement.classList.add("us-js");
  var io = new IntersectionObserver(function (poster) {
    poster.forEach(function (p) {
      if (p.isIntersecting) { p.target.classList.add("er-inde"); io.unobserve(p.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  el.forEach(function (e) { io.observe(e); });
})();
