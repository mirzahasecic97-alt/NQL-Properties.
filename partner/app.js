/* --------------------------------------------------------------------------
   NQL Properties — partner portal

   The agency-facing side. Same shape as crm/app.js: plain fetch against
   Supabase, no libraries, no build step.

   This app reads two views and writes one table, and that is the whole of its
   access. It never queries `leads`. An agency account cannot read that table
   at all, which is enforced by row level security in db/partner-portal.sql,
   not by the fact that this file does not ask.

   partner_board   anonymised: no name, no email, no phone, no message
   partner_leads   full details, and only where the buyer agreed to this agency
   partner_interest  one row per lead this agency has asked about
   -------------------------------------------------------------------------- */

const CONFIG = {
  url: "https://bonqtspukzjlievjppzt.supabase.co",
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvbnF0c3B1a3pqbGlldmpwcHp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNDAyNDgsImV4cCI6MjEwMjgxNjI0OH0.T5rxpaOhjtO0cPZWe8ZGgQZpOXHyljbDMEIwwjRis2c",
};
const SESSION_KEY = "nql.partner.session";

const STAGE_LABEL = {
  new: "New",
  contacted: "In conversation",
  viewing: "Viewing booked",
  offer: "Offer stage",
};

// What the agency sees about their own request. Deliberately not the raw
// status: "declined" is between NQL and the buyer, and saying so would invite
// an argument about a decision that is not the agency's to have.
const ASK_LABEL = {
  asked: "Requested",
  pending: "Asked the buyer",
  granted: "Introduced",
  refused: "Not available",
  declined: "Not available",
};

let session = null;
let me = null;          // row from partner_users
let agency = null;      // row from partners
let board = [];
let mine = [];
let interest = [];
let myCountries = [];
let offers = [];
let lastSeen = null;

/* How many introductions an agency may have in flight at once.
 *
 * Without a cap, a keen agency asks about every brief on the board and we owe
 * forty buyers a consent email. That is how these arrangements fall over, and
 * it makes each request meaningless, which is exactly what our email to the
 * buyer must not be. Five reads as fairness rather than as a limit. */
const OPEN_REQUEST_LIMIT = 5;

const OUTCOMES = [
  ["spoke", "Spoke to them"],
  ["viewing", "Viewing booked"],
  ["offer", "Offer made"],
  ["sold", "Sold"],
  ["cold", "Went cold"],
];

const OUTCOME_LABEL = Object.fromEntries(OUTCOMES);

const MED_COUNTRIES = [
  "Italy", "Spain", "Portugal", "France", "Greece", "Cyprus",
  "Malta", "Croatia", "Montenegro", "Turkey", "Morocco",
];
let section = "board";

/* ---------------------------------------------------------------- helpers */

const $ = (id) => document.getElementById(id);

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function when(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/* ------------------------------------------------------------------- api */

function persist(s) {
  if (s && s.expires_in && !s.expires_at) {
    s.expires_at = Math.floor(Date.now() / 1000) + Number(s.expires_in);
  }
  session = s;
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

async function refreshSession() {
  if (!session || !session.refresh_token) return false;
  try {
    const res = await fetch(`${CONFIG.url}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { apikey: CONFIG.anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    if (!res.ok) return false;
    persist(await res.json());
    return true;
  } catch (err) {
    return false;
  }
}

// Tokens last about an hour. Swap an expired one before the call rather than
// dropping somebody back at the login screen mid-task.
async function ensureFresh() {
  if (!session || !session.expires_at) return;
  if (session.expires_at - 60 > Math.floor(Date.now() / 1000)) return;
  await refreshSession();
}

async function api(path, options = {}, retried = false) {
  const res = await fetch(`${CONFIG.url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: CONFIG.anonKey,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (res.status === 401 && !retried) {
    if (await refreshSession()) return api(path, options, true);
    signOut();
    throw new Error("Session expired");
  }
  if (res.status === 401) {
    signOut();
    throw new Error("Session expired");
  }
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function signIn(email, password) {
  const res = await fetch(`${CONFIG.url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: CONFIG.anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error_description || body.msg || "Could not sign in");
  return body;
}

function showLogin() {
  $("app").classList.add("hidden");
  $("login").classList.remove("hidden");
  $("login").classList.add("flex");
}

function signOut() {
  localStorage.removeItem(SESSION_KEY);
  session = null;
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
  showLogin();
}

function showLoading(on) {
  $("loading-bar").classList.toggle("hidden", !on);
}

/* ----------------------------------------------------------------- board */

/* How much of the buyer's brief NQL can already cover: hot from 80, warm
   from 50, limited below that. A card with no badge is one nobody has
   measured, which is a different thing from a thin one and is why nothing is
   printed rather than a fourth word. */
const HEAT = {
  hot:     ["Hot",     "heat-hot"],
  warm:    ["Warm",    "heat-warm"],
  limited: ["Limited", "heat-limited"],
};

function matchTag(l) {
  const h = HEAT[l.match_band];
  if (!h) return "";
  return `<span class="${h[1]}">${h[0]}</span>`;
}

function openRequestCount() {
  return interest.filter((i) => i.status === "asked" || i.status === "pending").length;
}

function isNew(lead) {
  // Marked against the last time this person signed in, not against a
  // timestamp we set on every page load, or nothing would ever be new.
  return lastSeen && new Date(lead.created_at) > new Date(lastSeen);
}

function askState(lead) {
  const row = interest.find((i) => i.lead_id === lead.id);
  return row ? row.status : null;
}

function visibleBoard() {
  const q = $("search").value.trim().toLowerCase();
  const country = $("filter-country").value;
  const band = $("filter-band").value;
  const openOnly = $("filter-open").checked;
  const heat = $("filter-heat").value;

  return board.filter((l) => {
    if (heat === "hot" && l.match_band !== "hot") return false;
    if (heat === "warm" && !["hot", "warm"].includes(l.match_band)) return false;
    if (country && l.country !== country) return false;
    if (band && l.budget_band !== band) return false;
    if (openOnly && askState(l)) return false;
    if (!q) return true;
    return [l.lead_no, l.country, l.property_name, l.project_interest]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(q);
  });
}

function fillCountries() {
  const seen = Array.from(new Set(board.map((l) => l.country).filter(Boolean))).sort();
  const sel = $("filter-country");
  const keep = sel.value;
  sel.innerHTML =
    `<option value="">Anywhere</option>` +
    seen.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join("");
  sel.value = keep;
}

/* What an agency may read about a brief. Order matters: this is the sequence
   somebody works down when deciding whether they have anything to offer.

   The buyer's own message is deliberately absent. It is free text, so it
   carries whatever they chose to type, their name and telephone number
   included, and it is also where we keep what they said to us rather than what
   they want. The answers below say everything needed to judge a brief without
   either problem. */
const BRIEF = [
  ["Looking in", (l) => l.location_detail],
  ["Country", (l) => l.country],
  ["Budget", (l) => l.budget],
  ["Sort of place", (l) => l.property_kinds],
  ["Bedrooms", (l) => l.bedrooms],
  ["Land", (l) => l.land],
  ["Must have", (l) => l.must_haves],
  ["Would rule it out", (l) => l.dealbreakers],
  ["What for", (l) => l.purpose],
  ["When", (l) => l.timeline],
  ["Buyer is based in", (l) => l.based_in],
  ["Property or project", (l) => l.property_name || l.project_interest],
  ["Meeting", (l) => l.meeting_format],
  ["Preferred", (l) => [l.preferred_date, l.preferred_time].filter(Boolean).join(" \u00b7 ")],
];

function briefRows(l) {
  const rows = BRIEF.map(([label, get]) => [label, get(l)]).filter(([, v]) => v);
  if (!rows.length) {
    return `<p class="text-sm text-gray-400 font-light py-6 text-center">
              We have not been told much about this one yet.
            </p>`;
  }
  return rows
    .map(
      ([label, value]) => `
      <div class="flex justify-between gap-6 py-3 border-b border-brand-stone/40 last:border-0">
        <span class="text-[10px] uppercase tracking-[0.18em] text-gray-400 shrink-0 pt-0.5">${esc(label)}</span>
        <span class="text-sm text-right">${esc(value)}</span>
      </div>`
    )
    .join("");
}

function card(l) {
  const state = askState(l);
  const stage = STAGE_LABEL[l.stage] || l.stage;
  const where = [l.location_detail, l.country].filter(Boolean)[0] || "Still deciding";
  const kind = l.property_kinds || l.property_name || l.project_interest || "Open to suggestions";

  /* Once asked, the button becomes a statement: there is nothing further for
     the agency to do, and a control that does nothing is worse than a label. */
  const atLimit = openRequestCount() >= OPEN_REQUEST_LIMIT;
  const action = state
    ? `<span class="block w-full text-center border px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] ${
        state === "granted" ? "text-brand-gold border-brand-gold" : "text-gray-400 border-brand-stone/60"
      }">${esc(ASK_LABEL[state] || state)}</span>`
    : atLimit
    ? `<span class="block w-full text-center border border-brand-stone/60 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
         Waiting on ${OPEN_REQUEST_LIMIT} already
       </span>`
    : `<button data-ask="${l.id}"
         class="block w-full bg-brand-ink text-white px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-brand-gold hover:text-brand-ink transition">
         Request an introduction
       </button>`;

  return `
    <article class="bg-white border border-brand-stone/60 p-5 flex flex-col gap-4 ${
      l.match_band === "hot" ? "card-hot" : l.match_band === "warm" ? "card-warm" : ""
    }">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="text-[10px] tracking-[0.2em] text-gray-400 tabular-nums flex items-center gap-2">
            ${esc(l.lead_no || "\u2014")}
            ${isNew(l) ? `<span class="bg-brand-ink text-white text-[8px] font-bold tracking-[0.15em] px-1.5 py-0.5">NEW</span>` : ""}
          </div>
          <div class="band mt-1">${esc(l.budget_band)}</div>
        </div>
        <div class="card-heat flex flex-col items-end gap-1.5 shrink-0">
          <span class="stage-${l.stage} text-[9px] font-bold uppercase tracking-[0.15em] px-2.5 py-1.5">${esc(stage)}</span>
          ${matchTag(l)}
        </div>
      </div>

      <div class="text-sm text-gray-700 font-light leading-relaxed">
        <div class="font-normal">${esc(where)}</div>
        <div class="text-gray-500">${esc(kind)}</div>
        ${
          l.bedrooms
            ? `<div class="text-gray-500">${esc(l.bedrooms)}</div>`
            : ""
        }
      </div>

      <div class="text-[10px] uppercase tracking-[0.15em] text-gray-400 mt-auto flex flex-wrap items-center gap-x-3 gap-y-1">
        <span>Enquired ${esc(when(l.created_at))}</span>
        ${
          l.pitches > 0
            ? `<span class="text-brand-gold">${l.pitches} ${
                l.pitches === 1 ? "agency is" : "agencies are"
              } already offering</span>`
            : ""
        }
      </div>

      <div class="flex flex-col gap-2">
        <button data-info="${l.id}"
          class="block w-full border border-brand-stone/60 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 hover:border-brand-ink hover:text-brand-ink transition">
          Information
        </button>
        ${action}
      </div>
    </article>`;
}

function renderBoard() {
  const rows = visibleBoard();
  $("count").textContent = `${rows.length} of ${board.length}`;

  /* What they are looking at, in a sentence. A grid of equal cards tells an
     agency nothing about whether today is worth their time; a line saying
     fourteen buyers, three of them ready to move, does. */
  const summary = $("summary");
  if (summary) {
    const hot = board.filter((l) => l.match_band === "hot").length;
    const places = Array.from(new Set(board.map((l) => l.country).filter(Boolean)));
    if (!board.length) {
      summary.textContent =
        "Nothing on the board at the moment. If that is not what you expect, tell us and we will look.";
    } else {
      const where =
        places.length === 1
          ? ` in ${places[0]}`
          : places.length > 1
          ? ` across ${places.length} countries`
          : "";
      summary.textContent =
      `${board.length} ${board.length === 1 ? "buyer" : "buyers"} looking${where}` +
      (hot ? `, ${hot} of them ready to move.` : ".");
    }
  }

  // An agency restricted to one country sees a short board and no reason for
  // it. Saying so plainly is cheaper than answering the email.
  const where = $("scope");
  if (where) {
    where.textContent = myCountries.length
      ? `Showing ${myCountries.join(", ")} only. Ask us to widen it.`
      : "";
    where.classList.toggle("hidden", myCountries.length === 0);
  }
  $("empty").classList.toggle("hidden", rows.length > 0);
  $("cards").innerHTML = rows.map(card).join("");

  // Both buttons open the same panel. Asking without reading the brief is
  // exactly what the note is meant to stop.
  document.querySelectorAll("[data-info]").forEach((b) =>
    b.addEventListener("click", () => openInfo(b.dataset.info))
  );
  document.querySelectorAll("[data-ask]").forEach((b) =>
    b.addEventListener("click", () => openInfo(b.dataset.ask))
  );
}

/* The Information panel. The request form lives inside it rather than on the
   card, because the note an agency writes is worth writing after reading the
   brief, and a box on a card invites a line typed without reading it. */
function openInfo(id) {
  const l = board.find((x) => x.id === id);
  if (!l) return;

  $("info-no").textContent = l.lead_no || "";
  $("info-body").innerHTML = briefRows(l);

  const state = askState(l);
  $("info-action").innerHTML = state
    ? `<span class="block w-full text-center border px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] ${
        state === "granted" ? "text-brand-gold border-brand-gold" : "text-gray-400 border-brand-stone/60"
      }">${esc(ASK_LABEL[state] || state)}</span>`
    : `<label for="info-offer" class="block text-[10px] uppercase tracking-[0.18em] text-gray-400 mb-2">
         The house you would show them
       </label>
       <select id="info-offer"
         class="w-full bg-white border border-brand-stone/60 px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition mb-2">
         ${offers.map((o) => `<option value="${esc(o.id)}">${esc(o.title)}${o.location ? " · " + esc(o.location) : ""}${o.price ? " · €" + Number(o.price).toLocaleString("en-GB") : ""}</option>`).join("")}
         <option value="__new" ${offers.length ? "" : "selected"}>Add a house</option>
       </select>
       <div id="info-new" class="${offers.length ? "hidden" : ""} space-y-2 mb-2">
         <input id="info-h-title" placeholder="Name of the property *"
           class="w-full bg-white border border-brand-stone/60 px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition placeholder-gray-300" />
         <div class="grid grid-cols-2 gap-2">
           <input id="info-h-location" placeholder="Where"
             class="bg-white border border-brand-stone/60 px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition placeholder-gray-300" />
           <input id="info-h-price" type="number" min="0" step="1000" placeholder="Price in €"
             class="bg-white border border-brand-stone/60 px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition placeholder-gray-300" />
         </div>
         <input id="info-h-link" placeholder="Link to the listing or a brochure"
           class="w-full bg-white border border-brand-stone/60 px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition placeholder-gray-300" />
         <input id="info-h-photo" placeholder="Link to one photo"
           class="w-full bg-white border border-brand-stone/60 px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition placeholder-gray-300" />
         <p class="text-[11px] text-gray-400 font-light leading-relaxed">
           This is what the buyer sees before deciding whether to talk to you,
           so make it the one house you would put in front of them.
         </p>
       </div>
       <label for="info-note" class="block text-[10px] uppercase tracking-[0.18em] text-gray-400 mb-2 mt-3">
         Why it fits
       </label>
       <textarea id="info-note" rows="3"
         placeholder="Three houses in Todi within their budget, one with the land they want. Viewings possible from the 20th."
         class="w-full bg-white border border-brand-stone/60 px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition placeholder-gray-300"></textarea>
       <p class="text-[11px] text-gray-400 font-light mt-2 leading-relaxed">
         Other agencies may be answering the same brief. We read all of them
         together and put forward whoever has the right house, so name the
         properties rather than asking to be introduced.
       </p>
       <button id="info-send"
         class="mt-3 block w-full bg-brand-ink text-white px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-brand-gold hover:text-brand-ink transition">
         Request an introduction
       </button>`;

  const pick = $("info-offer");
  if (pick) pick.addEventListener("change", () =>
    $("info-new").classList.toggle("hidden", pick.value !== "__new")
  );

  const send = $("info-send");
  if (send) {
    send.addEventListener("click", () => {
      const note = $("info-note");
      ask(id, send, note ? note.value.trim() : "");
    });
  }

  // Already asked: say which house was put forward, so the agency can see
  // what the buyer is being shown.
  if (state) {
    const r = interest.find((x) => x.lead_id === id);
    const o = r && r.offer_id ? offers.find((x) => x.id === r.offer_id) : null;
    if (o)
      $("info-action").insertAdjacentHTML("beforeend",
        `<p class="mt-3 text-[12px] text-gray-500 font-light">You put forward <span class="text-brand-ink">${esc(o.title)}</span>${o.location ? ", " + esc(o.location) : ""}.</p>`);
  }

  showInfo(true);
}

function showInfo(open) {
  $("info-bg").classList.toggle("hidden", !open);
  $("info").classList.toggle("hidden", !open);
  $("info").classList.toggle("flex", open);
  document.body.style.overflow = open ? "hidden" : "";
}

/* A request carries the house. If the agency picked one they had already
   added it is linked; if they typed a new one it is saved to What we have
   first and then linked. The buyer is asked about a house, not about a
   phone call, and this is where the house comes from. */
async function houseForAsk() {
  const pick = $("info-offer");
  if (!pick) return null;
  if (pick.value !== "__new") return pick.value || null;

  const v = (id) => ($(id) ? $(id).value.trim() : "");
  if (!v("info-h-title")) throw new Error("Give the house a name first.");
  const body = {
    partner_id: me.partner_id,
    user_id: session.user.id,
    title: v("info-h-title"),
    location: v("info-h-location") || null,
    price: v("info-h-price") ? Number(v("info-h-price")) : null,
    link: v("info-h-link") || null,
    photo_url: v("info-h-photo") || null,
  };
  const post = (b) => api("partner_offers", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(b),
  });
  let rows;
  try {
    rows = await post(body);
  } catch (e) {
    // The photo column arrives with db/pitch-house.sql. Without it, save the
    // rest rather than refuse the request.
    if (!/photo_url|PGRST204/.test(String(e.message || e))) throw e;
    delete body.photo_url;
    rows = await post(body);
  }
  const row = rows && rows[0];
  if (!row || !row.id) throw new Error("The house was not saved.");
  offers.unshift(row);
  return row.id;
}

async function ask(leadId, button, note) {
  button.disabled = true;
  button.textContent = "Sending";
  try {
    const offerId = await houseForAsk();
    const body = {
      lead_id: leadId,
      partner_id: me.partner_id,
      user_id: session.user.id,
      status: "asked",
      note: note || null,
    };
    if (offerId) body.offer_id = offerId;
    const post = (b) => api("partner_interest", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(b),
    });
    try {
      await post(body);
    } catch (e) {
      // Column not added yet: send the request without the link rather
      // than lose it. The note still names the house.
      if (!body.offer_id || !/offer_id|PGRST204/.test(String(e.message || e))) throw e;
      delete body.offer_id;
      await post(body);
    }
    await loadInterest();
    showInfo(false);
    renderBoard();
  } catch (err) {
    // A second click on the same lead hits the unique index. That is not a
    // failure, it is the request already being in.
    if (String(err.message || err).includes("23505")) {
      await loadInterest();
      renderBoard();
      return;
    }
    button.disabled = false;
    button.textContent = "Send request";
    alert("Could not send that request: " + (err.message || err));
  }
}

/* -------------------------------------------------------------- my leads */

async function setOutcome(leadId, value, button) {
  button.disabled = true;
  try {
    await api(
      `lead_partners?lead_id=eq.${leadId}&partner_id=eq.${me.partner_id}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ outcome: value, outcome_at: new Date().toISOString() }),
      }
    );
    const l = mine.find((x) => x.id === leadId);
    if (l) {
      l.outcome = value;
      l.outcome_at = new Date().toISOString();
    }
    renderMine();
  } catch (err) {
    button.disabled = false;
    alert("Could not save that: " + (err.message || err));
  }
}

function renderMine() {
  // Anything granted since they last signed in is what the count is for.
  const fresh = mine.filter(
    (l) => lastSeen && l.intro_consent_at && new Date(l.intro_consent_at) > new Date(lastSeen)
  ).length;
  $("mine-count").textContent = fresh
    ? `${fresh} new`
    : mine.length
    ? `(${mine.length})`
    : "";
  $("mine-empty").classList.toggle("hidden", mine.length > 0);

  const line = (label, value, href) =>
    value
      ? `<div class="flex justify-between gap-6 border-b border-brand-stone/40 py-2.5">
           <span class="text-[10px] uppercase tracking-[0.2em] text-gray-400 shrink-0">${esc(label)}</span>
           <span class="text-sm text-right">${
             href
               ? `<a href="${href}${esc(value)}" class="hover:text-brand-gold transition">${esc(value)}</a>`
               : esc(value)
           }</span>
         </div>`
      : "";

  $("mine").innerHTML = mine
    .map(
      (l) => `
      <article class="bg-white border border-brand-stone/60 p-6">
        <div class="flex items-start justify-between gap-4 mb-4">
          <div>
            <div class="text-[10px] tracking-[0.2em] text-brand-gold tabular-nums">${esc(l.lead_no || "—")}</div>
            <h2 class="font-serif text-xl leading-tight mt-1">
              ${esc([l.first_name, l.last_name].filter(Boolean).join(" ") || "Name not given")}
            </h2>
          </div>
          <span class="text-[10px] uppercase tracking-[0.15em] text-gray-400 shrink-0">
            Introduced ${esc(when(l.intro_consent_at))}
          </span>
        </div>

        ${line("Email", l.email, "mailto:")}
        ${line("Phone", l.phone, "tel:")}
        ${line("Looking in", l.country)}
        ${line("Interest", l.property_name || l.project_interest)}
        ${line("Budget", l.budget)}

        ${
          l.message
            ? `<div class="mt-4">
                 <div class="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">What they wrote</div>
                 <p class="text-sm text-gray-700 font-light leading-relaxed whitespace-pre-line">${esc(l.message)}</p>
               </div>`
            : ""
        }

        <!-- The one thing NQL cannot see for themselves. They are not at the
             viewing, and their own pipeline only moves when they move it. -->
        <div class="mt-5 pt-4 border-t border-brand-stone/60">
          <div class="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3">
            How is it going? ${
              l.outcome_at
                ? `<span class="text-gray-300 ml-1">last told us ${esc(when(l.outcome_at))}</span>`
                : ""
            }
          </div>
          <div class="flex flex-wrap gap-2">
            ${OUTCOMES.map(
              ([key, label]) => `
              <button data-outcome="${l.id}" data-value="${key}"
                class="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] border transition ${
                  l.outcome === key
                    ? "bg-brand-ink text-white border-brand-ink"
                    : "border-brand-stone text-gray-500 hover:border-brand-ink hover:text-brand-ink"
                }">${label}</button>`
            ).join("")}
          </div>
        </div>
      </article>`
    )
    .join("");

  document.querySelectorAll("[data-outcome]").forEach((b) =>
    b.addEventListener("click", () => setOutcome(b.dataset.outcome, b.dataset.value, b))
  );
}

/* --------------------------------------------------------------- history */

/* What they have to show for it.
 *
 * Counted from what the agency told us themselves, so it is their own record
 * rather than our claim about them. This is the page somebody looks at before
 * deciding whether to keep paying, and without it that decision is a feeling.
 */
function renderScorecard() {
  const el = $("scorecard");
  if (!el) return;

  const asked = interest.length;
  const introduced = mine.length;
  const by = (o) => mine.filter((l) => l.outcome === o).length;
  const viewings = by("viewing");
  const offers = by("offer");
  const sold = by("sold");
  const soldValue = mine
    .filter((l) => l.outcome === "sold")
    .reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0);

  const tile = (n, label, gold) => `
    <div class="bg-white p-4">
      <div class="font-serif text-3xl leading-none ${gold ? "text-brand-gold" : ""}">${n}</div>
      <div class="text-[10px] uppercase tracking-[0.18em] text-gray-400 mt-2">${esc(label)}</div>
    </div>`;

  el.innerHTML =
    tile(asked, "asked for") +
    tile(introduced, "introduced") +
    tile(viewings, "viewings") +
    tile(offers, "offers") +
    tile(sold ? (soldValue ? money(soldValue) : sold) : "0", sold ? "sold" : "sold", !!sold);

  // The number that matters is the one they have not filled in.
  const silent = mine.filter((l) => !l.outcome).length;
  $("scorecard-note").textContent = !introduced
    ? "Nothing yet. Ask for an introduction from the board and it will show here."
    : silent
    ? `${silent} of the ${introduced} we introduced you to have no outcome against them. Marking those is what makes this page worth reading.`
    : "Every introduction has an outcome against it. Thank you: it is how we decide who to send the next one to.";
}

function money(n) {
  const v = Number(n);
  if (!isFinite(v) || v <= 0) return "";
  const k = Math.round(v / 1000);
  if (k >= 1000) return "\u20ac" + (v / 1000000).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (v >= 1000) return "\u20ac" + k + "k";
  return "\u20ac" + v;
}

function renderHistory() {
  renderScorecard();
  const rows = interest.slice();
  $("history-empty").classList.toggle("hidden", rows.length > 0);

  $("history").innerHTML = rows
    .map((r) => {
      const l =
        board.find((x) => x.id === r.lead_id) || mine.find((x) => x.id === r.lead_id);
      const state = ASK_LABEL[r.status] || r.status;
      return `
        <div class="bg-white border border-brand-stone/60 px-5 py-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          <span class="text-sm tabular-nums">${esc(l ? l.lead_no : "\u2014")}</span>
          <span class="text-sm text-gray-600 font-light">${esc(
            l ? [l.location_detail, l.country].filter(Boolean)[0] || "" : ""
          )}</span>
          <span class="text-[10px] uppercase tracking-[0.18em] text-gray-400">${esc(state)}</span>
          ${
            l && l.outcome
              ? `<span class="text-[10px] uppercase tracking-[0.18em] text-brand-gold">${esc(
                  OUTCOME_LABEL[l.outcome] || l.outcome
                )}</span>`
              : ""
          }
          <span class="text-[10px] uppercase tracking-[0.18em] text-gray-400 ml-auto">${esc(when(r.created_at))}</span>
        </div>`;
    })
    .join("");
}

/* ---------------------------------------------------------------- offers */

async function loadOffers() {
  try {
    offers = await api("partner_offers?select=*&order=created_at.desc");
  } catch (err) {
    offers = [];
  }
  renderOffers();
}

const OFFER_STATUS = {
  new: ["With NQL", "text-gray-400"],
  interested: ["Interested", "text-brand-gold"],
  passed: ["Not for us", "text-gray-400"],
};

function renderOffers() {
  const el = $("offers");
  if (!el) return;
  $("offers-empty").classList.toggle("hidden", offers.length > 0);
  el.innerHTML = offers
    .map((o) => {
      const st = OFFER_STATUS[o.status] || [o.status, "text-gray-400"];
      return `
        <div class="bg-white border border-brand-stone/60 px-5 py-4">
          <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span class="text-sm">${esc(o.title)}</span>
            <span class="text-[10px] uppercase tracking-[0.18em] text-gray-400">${esc(
              [o.location, o.country].filter(Boolean).join(", ")
            )}</span>
            ${o.price ? `<span class="font-serif text-brand-gold tabular-nums">\u20ac${Number(o.price).toLocaleString("en-GB")}</span>` : ""}
            <span class="text-[10px] uppercase tracking-[0.2em] ${st[1]} ml-auto">${esc(st[0])}</span>
          </div>
          ${
            o.reply
              ? `<div class="mt-3 border-l-2 border-brand-gold/60 pl-3">
                   <div class="text-[10px] uppercase tracking-[0.18em] text-gray-400 mb-1">NQL said</div>
                   <p class="text-sm text-gray-600 font-light whitespace-pre-line">${esc(o.reply)}</p>
                 </div>`
              : ""
          }
        </div>`;
    })
    .join("");
}

async function sendOffer(e) {
  e.preventDefault();
  const err = $("o-error");
  const state = $("o-state");
  err.classList.add("hidden");

  const value = (id) => {
    const v = $(id).value.trim();
    return v === "" ? null : v;
  };
  if (!value("o-title")) return;

  $("o-send").disabled = true;
  state.textContent = "Sending";
  try {
    await api("partner_offers", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        partner_id: me.partner_id,
        user_id: session.user.id,
        title: value("o-title"),
        country: value("o-country"),
        location: value("o-location"),
        price: value("o-price") ? Number(value("o-price")) : null,
        bedrooms: value("o-bedrooms"),
        land: value("o-land"),
        link: value("o-link"),
        notes: value("o-notes"),
      }),
    });
    $("offer-form").reset();
    state.textContent = "Sent";
    await loadOffers();
  } catch (e2) {
    state.textContent = "";
    err.textContent = String(e2.message || e2).includes("42P01")
      ? "This is not switched on yet. Ask NQL to run db/agency-loop.sql."
      : String(e2.message || e2);
    err.classList.remove("hidden");
  } finally {
    $("o-send").disabled = false;
  }
}

/* ----------------------------------------------------------------- loads */

async function loadInterest() {
  try {
    interest = await api("partner_interest?select=lead_id,status,offer_id");
  } catch (e) {
    // db/pitch-house.sql not run yet: the column is missing, the rest works.
    interest = await api("partner_interest?select=lead_id,status");
  }
}

/* An empty board tells you nothing about why it is empty, and working that out
   from the outside has cost days. Every gate the board passes through is asked
   here, as this account, and printed. If a value is wrong it is visible rather
   than deduced. */
async function whyEmpty() {
  const line = (k, v) => (k + " ").padEnd(30, ".") + " " + v;
  const out = [];

  const probe = async (label, path) => {
    try {
      const rows = await api(path);
      out.push(line(label, JSON.stringify(rows)));
      return rows;
    } catch (e) {
      out.push(line(label, "REFUSED " + String(e.message || e).slice(0, 120)));
      return null;
    }
  };

  out.push(line("signed in as", session && session.user ? session.user.email : "?"));
  await probe("my partner_users row", "partner_users?select=partner_id,status");
  const ags = await probe("my agency", "partners?select=id,name,status,sees_leads");
  await probe("my countries", "partner_countries?select=country");
  await probe("board rows", "partner_board?select=id&limit=5");
  await probe("my leads rows", "partner_leads?select=id&limit=5");

  if (ags && ags[0]) {
    const a = ags[0];
    out.push("");
    out.push(line("sees_leads is exactly", JSON.stringify(a.sees_leads)));
    out.push(line("the board needs it to be", "true"));
    if (a.sees_leads !== true)
      out.push("  >>> THIS IS THE BLOCKER. null and false both close the board.");
  }

  $("why-empty-body").textContent = out.join("\n");
  $("why-empty").classList.remove("hidden");
}

async function loadAll() {
  try {
    board = await api("partner_board?select=*&order=created_at.desc");
    // Hot first, then warm, then the rest, each newest first inside its group.
    // The board exists to point an agency at the leads worth asking about.
    const rank = { hot: 0, warm: 1, limited: 2 };
    board.sort(
      (a, b) =>
        (rank[a.match_band] ?? 3) - (rank[b.match_band] ?? 3) ||
        new Date(b.created_at) - new Date(a.created_at)
    );
    $("board-error").classList.add("hidden");
    if (!board.length) whyEmpty();
    else $("why-empty").classList.add("hidden");
  } catch (err) {
    /* An empty board and a refused query look identical on screen, and the
       message here used to guess at which. It said the portal was not
       switched on whatever had actually happened, so a missing view, a broken
       policy and a genuinely new account all read the same, and there was
       nothing to act on.

       Now it says what the database said. This page is only ever seen by an
       agency we gave a login to, so a technical line is not a leak, and
       whoever reads it can send it to us. */
    console.error("partner: board unavailable", err);
    board = [];
    const detail = String(err.message || err);
    $("board-error").innerHTML =
      `<span class="block">The board could not be loaded. Please send this to info@nordicql.com:</span>` +
      `<code class="block mt-2 text-xs text-gray-500 break-all">${esc(detail.slice(0, 300))}</code>`;
    $("board-error").classList.remove("hidden");
  }

  try {
    mine = await api("partner_leads?select=*&order=intro_consent_at.desc");
  } catch (err) {
    console.error("partner: my leads unavailable", err);
    mine = [];
  }

  try {
    const rows = await api("partner_countries?select=country&order=country");
    myCountries = rows.map((r) => r.country);
  } catch (err) {
    console.error("partner: countries unavailable", err);
    myCountries = [];
  }

  try {
    await loadInterest();
  } catch (err) {
    console.error("partner: interest unavailable", err);
    interest = [];
  }

  fillCountries();

  // The offer form only lists the countries this agency covers, or all of
  // them when they are not restricted.
  const sel = $("o-country");
  if (sel) {
    const list = myCountries.length ? myCountries : MED_COUNTRIES;
    sel.innerHTML =
      `<option value="">Not stated</option>` +
      list.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join("");
  }

  renderBoard();
  renderMine();
}

const SECTIONS = ["board", "mine", "offer", "history"];
const SECTION_TITLE = {
  board: "Available",
  mine: "My leads",
  offer: "What we have",
  history: "History",
};

function setSection(next) {
  section = next;
  SECTIONS.forEach((name) => {
    $("section-" + name).classList.toggle("hidden", name !== next);
    $("nav-" + name).className =
      "text-[10px] uppercase tracking-luxe pb-1 border-b-2 " +
      (section === name
        ? "text-white font-bold border-brand-gold"
        : "text-white/40 hover:text-white transition border-transparent");
  });

  if (next === "history") renderHistory();
  if (next === "offer") renderOffers();

  document.title = (SECTION_TITLE[next] || "Available") + " | NQL Partner Portal";
}

/* ------------------------------------------------------------ report a fix */

/* The people using this every day know what is wrong with it. Without a box
   like this they tell nobody and work around it, and the working around never
   reaches us.

   An agency also sees what it has already sent, and the answer, so the box is
   somewhere to look rather than somewhere to shout into. */

const FIX_STATUS = {
  open: ["Open", "text-brand-gold"],
  doing: ["In hand", "text-blue-700"],
  done: ["Done", "text-green-700"],
  declined: ["Not doing", "text-gray-400"],
};

function showFix(open) {
  $("fix-bg").classList.toggle("hidden", !open);
  $("fix-modal").classList.toggle("hidden", !open);
  $("fix-modal").classList.toggle("flex", open);
  $("fix-error").classList.add("hidden");
  if (open) {
    $("fix-body").value = "";
    loadMyFixes();
    $("fix-body").focus();
  }
}

async function loadMyFixes() {
  const el = $("fix-mine");
  try {
    const rows = await api("fix_requests?select=*&order=created_at.desc&limit=10");
    el.innerHTML = rows.length
      ? `<div class="text-[10px] uppercase tracking-[0.18em] text-gray-400 pt-2">What you have sent</div>` +
        rows
          .map((f) => {
            const st = FIX_STATUS[f.status] || [f.status, "text-gray-400"];
            return `
              <div class="border-t border-brand-stone/40 pt-3">
                <div class="flex items-baseline gap-3">
                  <span class="text-[10px] uppercase tracking-[0.18em] text-gray-400">${esc(when(f.created_at))}</span>
                  <span class="text-[10px] uppercase tracking-[0.2em] ${st[1]} ml-auto">${esc(st[0])}</span>
                </div>
                <p class="text-sm text-gray-600 font-light whitespace-pre-line mt-1">${esc(f.body)}</p>
                ${
                  f.reply
                    ? `<div class="mt-2 border-l-2 border-brand-gold/60 pl-3">
                         <div class="text-[10px] uppercase tracking-[0.18em] text-gray-400 mb-1">NQL said</div>
                         <p class="text-sm text-gray-600 font-light whitespace-pre-line">${esc(f.reply)}</p>
                       </div>`
                    : ""
                }
              </div>`;
          })
          .join("")
      : "";
  } catch (err) {
    el.innerHTML = "";
  }
}

async function sendFix() {
  const body = $("fix-body").value.trim();
  const err = $("fix-error");
  if (!body) {
    err.textContent = "Say what is wrong and it will get looked at.";
    err.classList.remove("hidden");
    return;
  }

  const button = $("fix-send");
  button.disabled = true;
  button.textContent = "Sending";
  try {
    await api("fix_requests", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        created_by: session.user.id,
        from_name: (me && me.name) || session.user.email,
        from_email: session.user.email,
        from_where: "portal",
        agency: agency ? agency.name : null,
        body,
      }),
    });
    $("fix-body").value = "";
    await loadMyFixes();
  } catch (e) {
    err.textContent = String(e.message || e).includes("42P01")
      ? "This is not switched on yet. Ask NQL to run db/fix-requests.sql."
      : String(e.message || e);
    err.classList.remove("hidden");
  } finally {
    button.disabled = false;
    button.textContent = "Send it";
  }
}

/* ----------------------------------------------------------------- start */

async function start(s) {
  showLoading(true);
  try {
    persist(s);
    await ensureFresh();

    // Which agency is this. An account that is on no agency has no business
    // here, and saying so plainly beats an empty screen they cannot explain.
    const rows = await api(
      `partner_users?user_id=eq.${s.user.id}&select=partner_id,name,status,last_seen_at`
    );
    if (!rows || !rows.length) {
      throw new Error(
        "This account is not linked to an agency. Email info@nordicql.com and we will set it up."
      );
    }
    me = rows[0];
    if (me.status !== "active") {
      throw new Error("This account is paused. Email info@nordicql.com.");
    }

    // Read it before touching it, or nothing is ever new: the marker has to
    // mean the previous visit, not this one.
    lastSeen = me.last_seen_at;

    const ags = await api(`partners?id=eq.${me.partner_id}&select=name,country`);
    agency = ags && ags[0] ? ags[0] : { name: "Partner" };

    $("login").classList.add("hidden");
    $("login").classList.remove("flex");
    $("app").classList.remove("hidden");
    $("agency").textContent = agency.name;

    setSection("board");
    await loadAll();
    await loadOffers();

    // Now the board has been drawn with the old marker, move it on. Failing
    // is harmless: everything stays new until the next visit.
    api(`partner_users?user_id=eq.${s.user.id}`, {
      method: "PATCH",
      body: JSON.stringify({ last_seen_at: new Date().toISOString() }),
    }).catch(() => {});

    startPolling();
  } finally {
    showLoading(false);
  }
}

/* The board is something an agency leaves open. Without this, they spend the
   afternoon looking at a list from this morning and asking for leads that have
   already gone to somebody else.

   A minute rather than the CRM's thirty seconds: nothing here is urgent, and
   an agency does not need to watch leads arrive in real time. */
let pollTimer = null;

function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(() => {
    if (!session || document.hidden) return;
    loadAll();
  }, 60000);

  // Coming back to the tab should feel immediate rather than waiting out the
  // rest of the minute.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && session) loadAll();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  $("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    $("login-error").classList.add("hidden");
    try {
      const s = await signIn($("email").value, $("password").value);
      await start(s);
    } catch (err) {
      // The whole message, not a summary. A wrong password and a missing
      // table both said "could not sign in" before this.
      $("login-error").textContent = String(err.message || err).slice(0, 300);
      $("login-error").classList.remove("hidden");
      showLogin();
    }
  });

  $("signout").addEventListener("click", signOut);
  $("nav-fix").addEventListener("click", () => showFix(true));
  $("fix-cancel").addEventListener("click", () => showFix(false));
  $("fix-bg").addEventListener("click", () => showFix(false));
  $("fix-send").addEventListener("click", sendFix);
  $("info-close").addEventListener("click", () => showInfo(false));
  $("info-bg").addEventListener("click", () => showInfo(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      showInfo(false);
      showFix(false);
    }
  });
  SECTIONS.forEach((name) =>
    $("nav-" + name).addEventListener("click", () => setSection(name))
  );
  $("offer-form").addEventListener("submit", sendOffer);
  ["search", "filter-country", "filter-band", "filter-heat", "filter-open"].forEach((id) =>
    $(id).addEventListener("input", renderBoard)
  );

  const saved = localStorage.getItem(SESSION_KEY);
  if (saved) {
    start(JSON.parse(saved)).catch((err) => {
      console.error("partner: could not resume", err);
      $("login-error").textContent = err.message || "Please sign in again.";
      $("login-error").classList.remove("hidden");
      showLogin();
    });
  } else {
    showLogin();
  }
});
