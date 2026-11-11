/* Where a lead came from (Mirza, 11 Nov 2026).
 *
 * An ad link carries ?utm_source=meta&utm_medium=paid_social&utm_campaign=ski.
 * Those are kept for the visit (sessionStorage), so a visitor who lands on
 * /ski from the ad and fills in the contact form three pages later still
 * counts for the ad. Every form that posts to /api/lead gets the three as
 * hidden fields, and the CRM shows them on the lead as Source, Medium and
 * Campaign. Someone who came from Google or typed the address leaves them
 * empty.
 */
(function () {
  var KEYS = ["utm_source", "utm_medium", "utm_campaign"];
  var params = new URLSearchParams(location.search);

  function get(k) { try { return sessionStorage.getItem(k) || ""; } catch (e) { return ""; } }
  function set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }

  // A new tagged link replaces all three, so one ad's campaign never sits
  // under another ad's source.
  if (KEYS.some(function (k) { return params.get(k); })) {
    KEYS.forEach(function (k) { set(k, (params.get(k) || "").slice(0, 100)); });
  }

  function fill(form) {
    KEYS.forEach(function (k) {
      var f = form.querySelector('input[name="' + k + '"]');
      if (!f) {
        f = document.createElement("input");
        f.type = "hidden";
        f.name = k;
        form.appendChild(f);
      }
      f.value = get(k);
    });
  }

  function run() {
    document.querySelectorAll('form[action="/api/lead"]').forEach(fill);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
