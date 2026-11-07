/* Meta Pixel behind a consent banner (7 Nov 2026).
 *
 * The pixel sets cookies and sends the visit to Meta, so for visitors in the
 * EEA, Iceland, Norway and the UK it may only run after they agree. Nothing
 * from Meta loads until the visitor presses Accept; the choice is kept in
 * localStorage (strictly necessary, holds only "yes" or "no").
 *
 * PageView on every page once accepted. Lead on /success, the page every
 * enquiry form ends on, so one finished enquiry is one Lead.
 *
 * window.nqlConsent.reset() shows the banner again (privacy page button).
 */
(function () {
  var PIXEL_ID = "1152219530632663";
  var KEY = "nql_consent";

  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function loadPixel() {
    if (window.fbq) return;
    /* Meta's own loader, unchanged in behaviour. */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", PIXEL_ID);
    window.fbq("track", "PageView");
    if (/^\/success(\.html)?\/?$/.test(location.pathname)) {
      window.fbq("track", "Lead", { content_name: document.referrer ? new URL(document.referrer).pathname : "" });
    }
  }

  function banner() {
    if (document.getElementById("nql-consent")) return;
    var box = document.createElement("div");
    box.id = "nql-consent";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "Cookie choice");
    box.style.cssText = "position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:2147483000;width:calc(100% - 32px);max-width:520px;background:#fff;color:#141312;border:1px solid rgba(20,19,18,.12);box-shadow:0 18px 50px rgba(0,0,0,.18);padding:18px 20px;font-family:Lato,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;line-height:1.55";
    box.innerHTML =
      '<p style="margin:0 0 14px;font-weight:300">We use a Meta pixel to see which of our ads bring people here. It sets cookies only if you accept. ' +
      '<a href="/privacy#cookies" style="color:inherit;text-decoration:underline;text-underline-offset:3px">Privacy</a></p>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end">' +
      '<button type="button" data-c="no" style="cursor:pointer;background:#fff;color:#141312;border:1px solid rgba(20,19,18,.3);padding:10px 18px;font:700 11px/1 Lato,sans-serif;letter-spacing:.2em;text-transform:uppercase">Decline</button>' +
      '<button type="button" data-c="yes" style="cursor:pointer;background:#b08d42;color:#fff;border:1px solid #b08d42;padding:10px 18px;font:700 11px/1 Lato,sans-serif;letter-spacing:.2em;text-transform:uppercase">Accept</button>' +
      "</div>";
    box.addEventListener("click", function (e) {
      var c = e.target && e.target.getAttribute && e.target.getAttribute("data-c");
      if (!c) return;
      set(c);
      box.remove();
      if (c === "yes") loadPixel();
    });
    document.body.appendChild(box);
  }

  window.nqlConsent = {
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} banner(); },
    state: get,
  };

  var choice = get();
  if (choice === "yes") loadPixel();
  else if (choice !== "no") {
    if (document.body) banner();
    else document.addEventListener("DOMContentLoaded", banner);
  }
})();
