/* The "Coming up" row on the homepage: the events we are already placing
   guests for, soonest first, from js/upcoming-data.js. Past events drop off
   by themselves. Each card ends on the Rent form for its first place; the
   last card is for everything else, because people can ask for anything. */
(function () {
  var track = document.querySelector("#upcoming [data-track]");
  var events = window.NQL_EVENTS || [];
  if (!track || !events.length) return;

  var today = new Date(); today.setHours(0, 0, 0, 0);
  var M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function d(iso) { var p = iso.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function when(e) {
    var a = d(e.starts_on), b = d(e.ends_on || e.starts_on);
    if (a.getTime() === b.getTime()) return a.getDate() + " " + M[a.getMonth()] + " " + a.getFullYear();
    if (a.getMonth() === b.getMonth()) return a.getDate() + "\u2013" + b.getDate() + " " + M[a.getMonth()] + " " + a.getFullYear();
    return a.getDate() + " " + M[a.getMonth()] + " \u2013 " + b.getDate() + " " + M[b.getMonth()] + " " + b.getFullYear();
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function link(place) { return "contact.html?about=rent&place=" + encodeURIComponent(place); }

  var upcoming = events
    .filter(function (e) { return d(e.ends_on || e.starts_on) >= today; })
    .sort(function (x, y) { return x.starts_on < y.starts_on ? -1 : 1; })
    .slice(0, 12);

  var card = "group relative block shrink-0 snap-start w-[82vw] sm:w-[60vw] lg:w-[calc((100%-2rem)/3.25)] min-h-[21rem] bg-brand-cream border border-brand-stone/60 p-7 md:p-8 flex flex-col transition hover:border-brand-gold";
  track.innerHTML = upcoming.map(function (e) {
    return '<a href="' + link(e.places[0]) + '" class="' + card + '" aria-label="' + esc(e.title) + '">' +
      '<p class="text-[11px] uppercase tracking-[0.3em] text-gray-400">' + esc(when(e)) + (e.dates_fixed ? "" : ' <span class="normal-case tracking-normal text-gray-300">\u00b7 usual dates</span>') + '</p>' +
      '<h3 class="mt-4 font-serif text-2xl md:text-[1.75rem] leading-tight text-brand-ink">' + esc(e.title) + '</h3>' +
      '<p class="mt-3 text-sm text-gray-600 font-light leading-relaxed">' + esc(e.places.join(" \u00b7 ")) + '</p>' +
      '<p class="mt-3 text-sm text-gray-500 font-light italic leading-relaxed">' + esc(e.hook) + '.</p>' +
      '<span class="mt-auto pt-6 text-[11px] uppercase tracking-[0.3em] text-brand-ink group-hover:text-brand-gold transition">Ask for a house \u2192</span>' +
    '</a>';
  }).join("") +
    '<a href="contact.html?about=rent" class="' + card + ' !bg-brand-ink !border-brand-ink" aria-label="Somewhere else">' +
      '<p class="text-[11px] uppercase tracking-[0.3em] text-white/50">Anything else</p>' +
      '<h3 class="mt-4 font-serif text-2xl md:text-[1.75rem] leading-tight text-white">Somewhere else in mind?</h3>' +
      '<p class="mt-3 text-sm text-white/70 font-light leading-relaxed">A week that is not on this list, a house for forty, a yacht to go with it. Ask us for anything.</p>' +
      '<span class="mt-auto pt-6 text-[11px] uppercase tracking-[0.3em] text-brand-gold">Tell us \u2192</span>' +
    '</a>' +
    '<div class="shrink-0 w-2" aria-hidden="true"></div>';

  // Arrows slide the row by about one card.
  var c = document.getElementById("upcoming");
  function step() { var f = track.firstElementChild; return f ? f.getBoundingClientRect().width + 16 : 300; }
  c.querySelector("[data-prev]").addEventListener("click", function () { track.scrollBy({ left: -step(), behavior: "smooth" }); });
  c.querySelector("[data-next]").addEventListener("click", function () { track.scrollBy({ left: step(), behavior: "smooth" }); });
})();
