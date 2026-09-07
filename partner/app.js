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

function card(l) {
  const state = askState(l);
  const stage = STAGE_LABEL[l.stage] || l.stage;
  const interestLine = l.property_name || l.project_interest || "Open to suggestions";

  // The button is the whole point of the card, so it is the only thing on it
  // that carries weight. Once asked, it becomes a statement rather than a
  // control: there is nothing further for the agency to do.
  const action = state
    ? `<span class="block w-full text-center border border-brand-stone/60 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] ${
        state === "granted" ? "text-brand-gold border-brand-gold" : "text-gray-400"
      }">${esc(ASK_LABEL[state] || state)}</span>`
    : `<button data-ask="${l.id}"
         class="block w-full bg-brand-ink text-white px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-brand-gold hover:text-brand-ink transition">
         Request an introduction
       </button>`;

  return `
    <article class="bg-white border border-brand-stone/60 p-5 flex flex-col gap-4">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="text-[10px] tracking-[0.2em] text-gray-400 tabular-nums">${esc(l.lead_no || "—")}</div>
          <div class="band mt-1">${esc(l.budget_band)}</div>
        </div>
        <div class="card-heat flex flex-col items-end gap-1.5 shrink-0">
          <span class="stage-${l.stage} text-[9px] font-bold uppercase tracking-[0.15em] px-2.5 py-1.5">${esc(stage)}</span>
          ${matchTag(l)}
        </div>
      </div>

      <div class="text-sm text-gray-700 font-light leading-relaxed">
        ${l.country ? `<div class="font-normal">${esc(l.country)}</div>` : ""}
        <div class="text-gray-500">${esc(interestLine)}</div>
      </div>

      <div class="text-[10px] uppercase tracking-[0.15em] text-gray-400 mt-auto">
        Enquired ${esc(when(l.created_at))}
      </div>

      ${action}
    </article>`;
}

function renderBoard() {
  const rows = visibleBoard();
  $("count").textContent = `${rows.length} of ${board.length}`;
  $("empty").classList.toggle("hidden", rows.length > 0);
  $("cards").innerHTML = rows.map(card).join("");

  document.querySelectorAll("[data-ask]").forEach((b) =>
    b.addEventListener("click", () => ask(b.dataset.ask, b))
  );
}

async function ask(leadId, button) {
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
      }),
    });
    await loadInterest();
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
    button.textContent = "Request an introduction";
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
  } finally {
    showLoading(false);
  }
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
