/* Country code on every phone field (11 Nov 2026).
 *
 * Numbers arrived without a country code ("964117766") and could not be
 * called. Each <input type="tel"> gets a country picker in front of it, every
 * country with its code, and the number is checked against that country's
 * numbering plan with libphonenumber. A number that cannot exist is refused
 * with a message, through setCustomValidity, so every form on the site (plain
 * POST, the step forms, the fetch forms) stops on it with no form-specific
 * code. A good number leaves the page in international form, "+351 964 117 766",
 * so the CRM only ever sees numbers you can dial.
 *
 * Typing "+44 ..." works too: the picker follows the number.
 * If the library cannot load, the field stays as it was and the form still works.
 */
(function () {
  var LIB = "https://cdn.jsdelivr.net/npm/libphonenumber-js@1.13.12/bundle/libphonenumber-min.js";
  var FIRST = ["US", "GB", "NO", "IS", "SE", "DK", "CH", "DE", "NL", "FR", "IT", "ES", "PT", "AE", "SA", "QA"];
  var LANG = { nb: "NO", nn: "NO", no: "NO", is: "IS", sv: "SE", da: "DK", de: "DE", fr: "FR", it: "IT",
               es: "ES", pt: "PT", nl: "NL", ar: "AE", en: "US" };
  var MSG = "Please check the number and the country code.";
  var lib, options;

  function flag(cc) {
    return String.fromCodePoint.apply(null, cc.split("").map(function (c) { return 127397 + c.charCodeAt(0); }));
  }

  function guess() {
    var langs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "en-US"];
    for (var i = 0; i < langs.length; i++) {
      var parts = String(langs[i]).split("-");
      var region = parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "";
      if (region.length === 2 && lib.isSupportedCountry(region)) return region;
      if (LANG[parts[0].toLowerCase()]) return LANG[parts[0].toLowerCase()];
    }
    return "US";
  }

  function buildOptions() {
    if (options) return options;
    var names = window.Intl && Intl.DisplayNames ? new Intl.DisplayNames(["en"], { type: "region" }) : null;
    var all = lib.getCountries().map(function (cc) {
      var name = cc;
      try { name = (names && names.of(cc)) || cc; } catch (e) {}
      return { cc: cc, name: name, code: lib.getCountryCallingCode(cc) };
    }).sort(function (a, b) { return a.name.localeCompare(b.name); });
    var byCc = {};
    all.forEach(function (c) { byCc[c.cc] = c; });
    var opt = function (c) { return '<option value="' + c.cc + '">' + flag(c.cc) + " " + c.name + " (+" + c.code + ")</option>"; };
    options = {
      html: '<optgroup label="Most used">' + FIRST.filter(function (cc) { return byCc[cc]; }).map(function (cc) { return opt(byCc[cc]); }).join("") +
            '</optgroup><optgroup label="All countries">' + all.map(opt).join("") + "</optgroup>",
      byCc: byCc,
    };
    return options;
  }

  function enhance(input) {
    if (input.dataset.cc || input.closest("[data-no-cc]")) return;
    input.dataset.cc = "1";
    var o = buildOptions();
    var cs = getComputedStyle(input);

    var wrap = document.createElement("div");
    wrap.style.cssText = "display:flex;gap:8px;align-items:stretch;width:100%";
    var chip = document.createElement("div");
    chip.style.cssText = "position:relative;flex:none;display:flex;align-items:center;gap:6px;white-space:nowrap;cursor:pointer";
    ["borderTop", "borderRight", "borderBottom", "borderLeft", "borderRadius", "backgroundColor", "color",
     "fontFamily", "fontSize", "fontWeight", "paddingTop", "paddingBottom", "paddingLeft", "paddingRight"].forEach(function (k) {
      chip.style[k] = cs[k];
    });
    var label = document.createElement("span");
    var caret = document.createElement("span");
    caret.textContent = "▾";
    caret.style.cssText = "opacity:.5;font-size:.75em";
    var select = document.createElement("select");
    select.setAttribute("aria-label", "Country code");
    select.innerHTML = o.html;
    // Invisible over the chip: the browser's own list opens, which is the
    // easiest one to search on a phone, and the chip shows only flag and code.
    select.style.cssText = "position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;font-size:16px;border:0;padding:0;margin:0";
    chip.appendChild(label);
    chip.appendChild(caret);
    chip.appendChild(select);

    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(chip);
    wrap.appendChild(input);
    input.style.flex = "1 1 auto";
    input.style.minWidth = "0";
    if (/^\s*\+/.test(input.placeholder || "")) input.placeholder = "";

    function setCountry(cc) {
      if (!o.byCc[cc]) return;
      select.value = cc;
      label.textContent = flag(cc) + " +" + o.byCc[cc].code;
    }

    function parse() {
      var v = input.value.trim();
      if (!v) return null;
      try { return lib.parsePhoneNumber(v.replace(/^00/, "+"), select.value); } catch (e) { return false; }
    }

    // While typing: say whether the number can exist, follow a typed "+44".
    function check() {
      var p = parse();
      if (p && p.country && p.country !== select.value && /^\s*(\+|00)/.test(input.value)) setCountry(p.country);
      input.setCustomValidity(p === null || (p && p.isValid()) ? "" : MSG);
    }

    // Leaving the field: tidy it as the country writes it, the code is on the
    // chip. Sending: the full international form, which is what the CRM keeps.
    function settle(sending) {
      check();
      var p = parse();
      if (p && p.isValid()) input.value = sending ? p.formatInternational() : p.formatNational();
    }

    select.addEventListener("change", function () {
      setCountry(select.value);
      // A number already written "+47 ..." is re-read as a local number for the new country.
      var p = parse();
      if (p && /^\s*\+/.test(input.value) && p.country !== select.value) input.value = p.nationalNumber;
      if (input.value.trim()) settle(false);
      input.focus();
    });
    input.addEventListener("input", check);
    input.addEventListener("blur", function () { settle(false); });
    input.addEventListener("change", function () { settle(false); });
    input._nqlSettle = settle;

    setCountry(guess());
    if (input.value.trim()) settle(false);

    // Beside the email in a narrow form the number had 75px left. Then the
    // grid it sits in goes to one column, so email and phone get a line each.
    var cell = wrap, grid = null;
    while (cell.parentElement && cell.parentElement !== input.form) {
      if (getComputedStyle(cell.parentElement).display === "grid") { grid = cell.parentElement; break; }
      cell = cell.parentElement;
    }
    function fit() {
      if (!grid || !grid.offsetWidth) return;  // hidden for now: measured when it shows
      grid.style.gridTemplateColumns = "";
      if (input.getBoundingClientRect().width < 160) grid.style.gridTemplateColumns = "minmax(0,1fr)";
    }
    // The grid's own width, which changes with the window and when a hidden
    // form opens, never with the columns set here.
    if (grid && window.ResizeObserver) new ResizeObserver(fit).observe(grid);
    else fit();
  }

  // Before any form's own submit, Enter or send handler reads the value.
  function settleAll(e) {
    var form = e.target && e.target.closest && e.target.closest("form");
    if (!form) return;
    form.querySelectorAll('input[type="tel"]').forEach(function (i) { if (i._nqlSettle) i._nqlSettle(true); });
  }
  document.addEventListener("submit", settleAll, true);
  document.addEventListener("keydown", function (e) { if (e.key === "Enter") settleAll(e); }, true);
  document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("button")) settleAll(e); }, true);

  function run() {
    lib = window.libphonenumber;
    document.querySelectorAll('input[type="tel"]').forEach(enhance);
    new MutationObserver(function () {
      document.querySelectorAll('input[type="tel"]:not([data-cc])').forEach(enhance);
    }).observe(document.body, { childList: true, subtree: true });
  }

  function start() {
    if (!document.querySelector('input[type="tel"]')) return;
    var s = document.createElement("script");
    s.src = LIB;
    s.async = true;
    s.onload = function () { if (window.libphonenumber) run(); };
    document.head.appendChild(s);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
