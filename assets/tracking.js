// assets/tracking.js
// One place to manage GA4 + Microsoft Clarity.
// Replace the IDs when you create them.

const GA_MEASUREMENT_ID = "G-XXXXXXXXXX";        // <-- replace later
const CLARITY_PROJECT_ID = "CLARITY_PROJECT_ID"; // <-- replace later

(function () {
  // --- Google Analytics 4 (gtag.js) ---
  if (GA_MEASUREMENT_ID && GA_MEASUREMENT_ID.startsWith("G-")) {
    const ga = document.createElement("script");
    ga.async = true;
    ga.src =
      "https://www.googletagmanager.com/gtag/js?id=" +
      encodeURIComponent(GA_MEASUREMENT_ID);
    document.head.appendChild(ga);

    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;

    gtag("js", new Date());
    gtag("config", GA_MEASUREMENT_ID, { anonymize_ip: true });
  }

  // --- Microsoft Clarity ---
  if (CLARITY_PROJECT_ID && CLARITY_PROJECT_ID !== "CLARITY_PROJECT_ID") {
    (function (c, l, a, r, i, t, y) {
      c[a] =
        c[a] ||
        function () {
          (c[a].q = c[a].q || []).push(arguments);
        };
      t = l.createElement(r);
      t.async = 1;
      t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", CLARITY_PROJECT_ID);
  }
})();
