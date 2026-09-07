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
  const action = state
    ? `<span class="block w-full text-center border px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] ${
        state === "granted" ? "text-brand-gold border-brand-gold" : "text-gray-400 border-brand-stone/60"
      }">${esc(ASK_LABEL[state] || state)}</span>`
    : `<button data-ask="${l.id}"
         class="block w-full bg-brand-ink text-white px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-brand-gold hover:text-brand-ink transition">
         Request an introduction
       </button>`;

  return `
    <article class="bg-white border border-brand-stone/60 p-5 flex flex-col gap-4">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="text-[10px] tracking-[0.2em] text-gray-400 tabular-nums">${esc(l.lead_no || "\u2014")}</div>
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

      <div class="text-[10px] uppercase tracking-[0.15em] text-gray-400 mt-auto">
        Enquired ${esc(when(l.created_at))}
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
    : `<label for="info-note" class="block text-[10px] uppercase tracking-[0.18em] text-gray-400 mb-2">
         What can you offer them?
       </label>
       <textarea id="info-note" rows="3"
         placeholder="Three houses in Todi within their budget, one with the land they want. Viewings possible from the 20th."
         class="w-full bg-white border border-brand-stone/60 px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition placeholder-gray-300"></textarea>
       <p class="text-[11px] text-gray-400 font-light mt-2 leading-relaxed">
         We read this before deciding whether to put your name to the buyer. It
         is the difference between a request and a reason.
       </p>
       <button id="info-send"
         class="mt-3 block w-full bg-brand-ink text-white px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-brand-gold hover:text-brand-ink transition">
         Request an introduction
       </button>`;

  const send = $("info-send");
  if (send) {
    send.addEventListener("click", () => {
      const note = $("info-note");
      ask(id, send, note ? note.value.trim() : "");
    });
  }

  showInfo(true);
}

function showInfo(open) {
  $("info-bg").classList.toggle("hidden", !open);
  $("info").classList.toggle("hidden", !open);
  $("info").classList.toggle("flex", open);
  document.body.style.overflow = open ? "hidden" : "";
}

async function ask(leadId, button, note) {
  button.disabled = true;
  button.textContent = "Sending";
  try {
    await api("partner_interest", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        lead_id: leadId,
        partner_id: me.partner_id,
        user_id: session.user.id,
        status: "asked",
        note: note || null,
      }),
    });
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

function renderMine() {
  $("mine-count").textContent = mine.length ? `(${mine.length})` : "";
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
      </article>`
    )
    .join("");
}

/* ----------------------------------------------------------------- loads */

async function loadInterest() {
  interest = await api("partner_interest?select=lead_id,status");
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
  } catch (err) {
    // An empty board and a refused query look identical on screen. Say which.
    console.error("partner: board unavailable", err);
    board = [];
    $("board-error").textContent =
      "The board could not be loaded. This usually means the portal has not been switched on for your account yet — email info@nordicql.com.";
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
  renderBoard();
  renderMine();
}

function setSection(next) {
  section = next;
  $("section-board").classList.toggle("hidden", next !== "board");
  $("section-mine").classList.toggle("hidden", next !== "mine");

  const cls = (name) =>
    "text-[10px] uppercase tracking-luxe pb-1 border-b-2 " +
    (section === name
      ? "text-white font-bold border-brand-gold"
      : "text-white/40 hover:text-white transition border-transparent");
  $("nav-board").className = cls("board");
  $("nav-mine").className = cls("mine");

  document.title =
    (next === "mine" ? "My leads" : "Available") + " | NQL Partner Portal";
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
      `partner_users?user_id=eq.${s.user.id}&select=partner_id,name,status`
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

    const ags = await api(`partners?id=eq.${me.partner_id}&select=name,country`);
    agency = ags && ags[0] ? ags[0] : { name: "Partner" };

    $("login").classList.add("hidden");
    $("login").classList.remove("flex");
    $("app").classList.remove("hidden");
    $("agency").textContent = agency.name;

    setSection("board");
    await loadAll();
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
      $("login-error").textContent = err.message;
      $("login-error").classList.remove("hidden");
      showLogin();
    }
  });

  $("signout").addEventListener("click", signOut);
  $("info-close").addEventListener("click", () => showInfo(false));
  $("info-bg").addEventListener("click", () => showInfo(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") showInfo(false);
  });
  $("nav-board").addEventListener("click", () => setSection("board"));
  $("nav-mine").addEventListener("click", () => setSection("mine"));
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
