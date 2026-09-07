/* --------------------------------------------------------------------------
   NQL Properties CRM

   Talks to Supabase over its REST API with plain fetch — no libraries, no
   build step. Row level security does the access control: the anon key below
   is public by design and grants nothing without a signed-in session.

   The anon key is safe in this file: it identifies the project, not a person,
   and every table refuses it until Supabase Auth returns a session.
   -------------------------------------------------------------------------- */

const CONFIG = {
  url: "https://bonqtspukzjlievjppzt.supabase.co",
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvbnF0c3B1a3pqbGlldmpwcHp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNDAyNDgsImV4cCI6MjEwMjgxNjI0OH0.T5rxpaOhjtO0cPZWe8ZGgQZpOXHyljbDMEIwwjRis2c",
};
const SESSION_KEY = "nql.crm.session";
let recoveryToken = null;
let recoverySession = null;

const STAGES = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "viewing", label: "Viewing booked" },
  { key: "offer", label: "Offer" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
];

const SOURCE_LABEL = {
  contact: "Contact",
  property: "Property enquiry",
  meeting: "Meeting request",
  footer: "Footer",
  newsletter: "Newsletter",
  ads: "Advertising",
  mandate: "Buyer mandate",
  guide: "Country guide",
  manual: "Added by hand",
  phone: "Phone call",
  referral: "Referral",
  partner: "Partner agency",
  event: "Event or viewing",
};

let session = null;
let leads = [];
let staff = [];
let reminders = [];
let openLeadId = null;
let dueOnly = false;
let quietOnly = false;
let lastTouch = new Map();
let view = localStorage.getItem('nql.crm.view') || 'list';
let partners = [];
let partnerContacts = [];
let partnerStaff = [];
let leadPartners = [];
let section = 'leads';
let subscribers = [];
let tasks = [];
let hideNewsletter = false;
let tasksError = null;
let presence = [];
let presenceOff = false;
let subscribersError = null;
let partnersError = null;

/* ---------------------------------------------------------------- helpers */

const $ = (id) => document.getElementById(id);

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function fullName(lead) {
  const n = [lead.first_name, lead.last_name].filter(Boolean).join(" ").trim();
  return n || lead.email || "Unnamed enquiry";
}

// blank when the heading is already showing the address
// A lead that predates the numbering, or one still waiting for the migration,
// shows a dash rather than an empty cell that looks like a rendering fault.
function leadNo(l) {
  return l.lead_no || "\u2014";
}

function subLine(lead) {
  return fullName(lead) === lead.email ? "" : lead.email || "";
}

function when(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d) / 60000);
  if (mins < 60) return `${mins} min ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)} h ago`;
  if (mins < 60 * 24 * 7) return `${Math.round(mins / 1440)} d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function staffName(id) {
  if (!id) return null;
  const s = staff.find((x) => x.id === id);
  return s ? s.name : "Unknown";
}

/* One colour per person, derived from their account id. Deriving it rather
   than storing it means everyone sees the same colours on every device, and a
   new colleague gets one the moment their account exists. Dark enough to read
   on white; the dot carries the colour where the text cannot. */
const STAFF_COLOURS = [
  "#B45309", "#1D4ED8", "#047857", "#7C3AED",
  "#BE123C", "#0F766E", "#A16207", "#4338CA",
];

function staffColour(id) {
  if (!id) return "#9CA3AF";
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return STAFF_COLOURS[h % STAFF_COLOURS.length];
}

// First letters of the first two words: "Jon Jokull" is JJ, "Mirza" is M.
function initials(name) {
  return (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

/* A coloured disc with the person's initials. Scanning a column of eight discs
   is faster than reading eight names, and it gives the Interest column back
   the width it was truncating at.

   Colour is never the only carrier: mode "avatar" keeps the name in the title
   attribute for anyone who cannot tell the discs apart, and every other mode
   prints it. */
function ownerTag(id, mode) {
  const name = staffName(id);
  if (!name) return "";
  const colour = staffColour(id);
  const disc = `<span class="owner-disc shrink-0" style="background:${colour}">${esc(initials(name))}</span>`;

  if (mode === "avatar")
    return `<span class="inline-flex align-middle" title="${esc(name)}">${disc}</span>`;

  return `<span class="inline-flex items-center gap-1.5 align-middle">
      ${disc}<span style="color:${colour}">${esc(name)}</span>
    </span>`;
}

/* Who is signed in, top right. The header sits on near black, so the name
   keeps its own colour only in the disc; coloured text there would fail
   contrast. */
function renderWho(user) {
  const name = staffName(user.id);
  $("who").innerHTML =
    `<span class="inline-flex items-center gap-2">` +
    `<span class="owner-disc" style="background:${staffColour(user.id)}">` +
    `${esc(initials(name && name !== "Unknown" ? name : user.email))}</span>` +
    `<span>${esc(name && name !== "Unknown" ? name : user.email)}</span></span>`;
}

/* ------------------------------------------------------------------- api */

// Supabase access tokens last about an hour. Rather than dumping people back
// at the login screen mid-task, swap the refresh token for a new one and retry
// the call once.
// Supabase returns expires_in (seconds). Store an absolute expiry so a
// reload can tell whether the token died while the tab was closed.
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
    persist({ ...session, ...(await res.json()) });
    return true;
  } catch {
    return false;
  }
}

// Refresh ahead of expiry rather than waiting for a 401. Without this, opening
// the CRM more than an hour after signing in means the first call fails and
// the session is thrown away before the retry can rescue it.
async function ensureFresh() {
  if (!session || !session.expires_at) return;
  if (session.expires_at - Math.floor(Date.now() / 1000) > 60) return;
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

  // PostgREST answers a write with 201 and an empty body unless asked for a
  // representation, and res.json() on an empty body throws. That is why adding
  // an agency, a note or a reminder looked like it did nothing: the row was
  // written, then the code that refreshed the panel never ran.
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
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error_description || body.msg || "Could not sign in");
  }
  return res.json();
}


/* -------------------------------------------------------- password reset */

// Supabase sends people back with the token in the URL fragment, not the query
// string, and expects the page to notice. Without this the link looks broken:
// you land on the login form with a perfectly good token being ignored.
function hashParams() {
  const raw = location.hash.startsWith("#") ? location.hash.slice(1) : location.hash;
  return new URLSearchParams(raw);
}

function clearHash() {
  history.replaceState(null, "", location.pathname + location.search);
}

function showRecover() {
  $("app").classList.add("hidden");
  $("login").classList.add("hidden");
  $("login").classList.remove("flex");
  $("recover").classList.remove("hidden");
  $("recover").classList.add("flex");
}

// Returns true when it has taken over the page, so boot leaves it alone.
function handleRecoveryLink() {
  const p = hashParams();
  const error = p.get("error_description") || p.get("error");
  if (error) {
    clearHash();
    showLogin();
    $("login-error").textContent =
      decodeURIComponent(error).replace(/\+/g, " ") +
      ". Reset links expire and can only be used once; ask for a new one.";
    $("login-error").classList.remove("hidden");
    return true;
  }

  const token = p.get("access_token");
  if (!token || p.get("type") !== "recovery") return false;

  recoveryToken = token;
  recoverySession = {
    access_token: token,
    refresh_token: p.get("refresh_token") || "",
    expires_at: Math.floor(Date.now() / 1000) + Number(p.get("expires_in") || 3600),
  };
  clearHash();
  showRecover();
  return true;
}

async function saveNewPassword(e) {
  e.preventDefault();
  const pw = $("new-password").value;
  const err = $("recover-error");
  const btn = $("recover-save");
  err.classList.add("hidden");
  if (pw.length < 8) {
    err.textContent = "Use at least eight characters.";
    err.classList.remove("hidden");
    return;
  }
  btn.disabled = true;
  btn.textContent = "Saving";
  try {
    const res = await fetch(`${CONFIG.url}/auth/v1/user`, {
      method: "PUT",
      headers: {
        apikey: CONFIG.anonKey,
        Authorization: `Bearer ${recoveryToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: pw }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.msg || body.error_description || "Could not set the password");
    }
    const user = await res.json();
    $("recover").classList.add("hidden");
    $("recover").classList.remove("flex");
    await start({ ...recoverySession, user });
  } catch (e2) {
    btn.disabled = false;
    btn.textContent = "Save and sign in";
    err.textContent = String(e2.message || e2);
    err.classList.remove("hidden");
  }
}

function showLogin() {
  $("app").classList.add("hidden");
  $("login").classList.remove("hidden");
  $("login").classList.add("flex");
}

// Only clears the stored session. A network hiccup should send someone back to
// the login screen, not destroy a session that is still perfectly valid.
function signOut() {
  // Drop the presence row so the person disappears from the header at once
  // rather than lingering for two minutes.
  //
  // Deliberately a bare fetch and not api(): api() calls signOut() on a 401,
  // and signOut() is itself called from there when a token is rejected, so
  // going through it would loop. Nothing here is worth blocking on either,
  // which is why the result is ignored.
  if (session && session.user) {
    fetch(
      `${CONFIG.url}/rest/v1/presence?user_id=eq.${session.user.id}`,
      {
        method: "DELETE",
        headers: {
          apikey: CONFIG.anonKey,
          Authorization: `Bearer ${session.access_token}`,
        },
        keepalive: true,
      }
    ).catch(() => {});
  }

  localStorage.removeItem(SESSION_KEY);
  session = null;
  presence = [];
  renderPresence();
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
  showLogin();
}

/* ------------------------------------------------------------------ views */

function stageTabs() {
  const active = $("stage-tabs").dataset.active || "";
  const counts = {};
  leads.forEach((l) => (counts[l.stage] = (counts[l.stage] || 0) + 1));

  const tab = (key, label, n) => `
    <button data-stage="${key}"
      class="stage-tab shrink-0 px-5 py-4 text-[10px] font-bold uppercase tracking-[0.2em] border-b-2 transition ${
        active === key
          ? "border-brand-gold text-brand-ink"
          : "border-transparent text-gray-400 hover:text-brand-ink"
      }">
      ${esc(label)} <span class="ml-1 text-gray-400 font-normal">${n}</span>
      ${
        money(stageValue(key))
          ? `<span class="block mt-1 font-serif text-xs normal-case tracking-normal text-brand-gold">${money(stageValue(key))}</span>`
          : ""
      }
    </button>`;

  $("stage-tabs").innerHTML =
    tab("", "All", leads.length) +
    STAGES.map((s) => tab(s.key, s.label, counts[s.key] || 0)).join("");

  document.querySelectorAll(".stage-tab").forEach((b) =>
    b.addEventListener("click", () => {
      $("stage-tabs").dataset.active = b.dataset.stage;
      render();
    })
  );
}

function dueLeadIds() {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return new Set(
    reminders
      .filter((r) => !r.done && new Date(r.due_at) <= end)
      .map((r) => r.lead_id)
  );
}

function renderFollowUps() {
  const n = dueLeadIds().size;
  const btn = $("followups");
  btn.classList.toggle("hidden", n === 0);
  btn.classList.toggle("flex", n > 0);
  $("followups-count").textContent =
    n === 1 ? "1 follow-up due" : `${n} follow-ups due`;
  btn.classList.toggle("bg-brand-gold/20", dueOnly);
}

function visibleLeads() {
  const q = $("search").value.trim().toLowerCase();
  const src = $("filter-source").value;
  const owner = $("filter-owner").value;
  const stage = $("stage-tabs").dataset.active || "";
  const due = dueOnly ? dueLeadIds() : null;
  const quiet = quietOnly ? quietLeadIds() : null;

  return leads.filter((l) => {
    if (due && !due.has(l.id)) return false;
    if (quiet && !quiet.has(l.id)) return false;
    if (stage && l.stage !== stage) return false;
    if (src && l.source !== src) return false;
    if (owner === "__none" && l.assigned_to) return false;
    if (owner && owner !== "__none" && l.assigned_to !== owner) return false;
    if (!q) return true;
    return [l.lead_no, l.first_name, l.last_name, l.email, l.phone, l.message, l.property_name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(q);
  });
}

function render() {
  renderTaskBadge();
  stageTabs();
  renderFollowUps();
  renderQuiet();
  const rows = visibleLeads();
  $("count").textContent = `${rows.length} of ${leads.length}`;
  $("empty").classList.toggle("hidden", rows.length > 0 || view === "board");
  renderCards(rows);
  renderBoard(rows);

  $("rows").innerHTML = rows
    .map((l) => {
      const stage = STAGES.find((s) => s.key === l.stage) || STAGES[0];
      const interest = l.property_name || l.project_interest || "—";
      const owner = staffName(l.assigned_to);
      return `
      <tr data-id="${l.id}"
          class="lead-row border-b border-brand-stone/40 last:border-0 cursor-pointer transition ${
            isQuiet(l) ? "bg-red-50 hover:bg-red-100" : "hover:bg-[#FBFAF7]"
          } ${openLeadId === l.id ? "row-active" : ""}">
        <td class="py-4 px-5 text-xs text-gray-400 tabular-nums whitespace-nowrap">${esc(leadNo(l))}</td>
        <td class="py-4 px-5">
          <div class="lead-name font-serif text-base leading-tight">${esc(fullName(l))}</div>
          <div class="lead-sub text-xs text-gray-400 font-light mt-0.5">${esc(subLine(l))}</div>
        </td>
        <td class="py-4 px-5 text-xs text-gray-500">${esc(SOURCE_LABEL[l.source] || l.source)}</td>
        <td class="py-4 px-5 text-xs text-gray-500 max-w-[240px] truncate">${esc(interest)}</td>
        <td class="py-4 px-5">
          <span class="stage-${l.stage} inline-block text-[9px] font-bold uppercase tracking-[0.18em] px-3 py-1.5">${esc(stage.label)}</span>
        </td>
        <td class="py-4 px-5 text-xs">${
          l.assigned_to
            ? ownerTag(l.assigned_to, "avatar")
            : `<span class="text-gray-300">Unassigned</span>`
        }</td>
        <td class="py-4 px-5 text-xs text-gray-400 whitespace-nowrap">
          ${esc(when(l.created_at))}
          ${isQuiet(l) ? `<div class="mt-1 text-[10px] uppercase tracking-[0.15em]">${quietFlag(l)}</div>` : ""}
        </td>
      </tr>`;
    })
    .join("");

  document.querySelectorAll(".lead-row").forEach((r) =>
    r.addEventListener("click", () => openLead(r.dataset.id))
  );
}

/* ------------------------------------------------------------ phone view */

function renderCards(rows) {
  const due = dueLeadIds();
  $("cards").innerHTML = rows
    .map((l) => {
      const stage = STAGES.find((s) => s.key === l.stage) || STAGES[0];
      const owner = staffName(l.assigned_to);
      return `
      <button data-id="${l.id}"
        class="lead-card w-full text-left border p-4 ${
          isQuiet(l) ? "bg-red-50 border-red-200" : "bg-white border-brand-stone/60"
        } ${openLeadId === l.id ? "border-brand-gold" : ""}">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="text-[10px] tracking-[0.15em] text-gray-400 tabular-nums">${esc(leadNo(l))}</div>
            <div class="font-serif text-base leading-tight truncate">${esc(fullName(l))}</div>
            <div class="text-xs text-gray-400 font-light truncate">${esc(subLine(l))}</div>
          </div>
          <span class="stage-${l.stage} shrink-0 text-[9px] font-bold uppercase tracking-[0.15em] px-2.5 py-1">${esc(stage.label)}</span>
        </div>
        <div class="mt-3 flex items-center gap-3 text-[10px] uppercase tracking-[0.15em] text-gray-400">
          <span>${esc(SOURCE_LABEL[l.source] || l.source)}</span>
          <span>&middot;</span>
          <span>${esc(when(l.created_at))}</span>
          <span class="ml-auto flex items-center gap-2">
            ${due.has(l.id) ? `<span class="text-brand-gold">Due</span>` : ""}
            ${isQuiet(l) ? quietFlag(l) : ""}
            ${owner ? ownerTag(l.assigned_to, "avatar") : ""}
          </span>
        </div>
      </button>`;
    })
    .join("");

  document.querySelectorAll(".lead-card").forEach((c) =>
    c.addEventListener("click", () => openLead(c.dataset.id))
  );
}

/* --------------------------------------------------------------- partners */

function setSection(next) {
  section = next;
  const SECTIONS = ["leads", "tasks", "reports", "partners", "subscribers"];
  const navClass = (name) =>
    "text-[10px] uppercase tracking-luxe pb-1 border-b-2 " +
    (section === name
      ? "text-white font-bold border-brand-gold"
      : "text-white/40 hover:text-white transition border-transparent") +
    // Rebuilding className wipes anything set elsewhere, so a tab that is
    // meant to stay hidden has to be hidden here too.
    (name === "subscribers" && hideNewsletter ? " hidden" : "");

  SECTIONS.forEach((name) => {
    $("section-" + name).classList.toggle("hidden", name !== next);
    $("nav-" + name).className = navClass(name);
  });

  // The tab title says where you are, which matters when the CRM is one of
  // fifteen tabs somebody left open.
  const TITLES = {
    leads: "Leads",
    tasks: "Tasks",
    reports: "Reports",
    partners: "Agencies",
    subscribers: "Newsletter",
  };
  document.title = `${TITLES[next] || "Leads"} | NQL Properties`;

  if (next === "leads") render();
  else if (next === "tasks") renderTasks();
  else if (next === "reports") renderReports();
  else if (next === "partners") renderPartners();
  else renderSubscribers();
}

function partnerStats(id) {
  const mine = leadPartners.filter((lp) => lp.partner_id === id);
  const stageOf = (leadId) => (leads.find((l) => l.id === leadId) || {}).stage;
  return {
    total: mine.length,
    won: mine.filter((lp) => stageOf(lp.lead_id) === "won").length,
    open: mine.filter((lp) => !["won", "lost"].includes(stageOf(lp.lead_id))).length,
  };
}

const STATUS_STYLE = {
  active: "bg-[#DCFCE7] text-[#166534]",
  paused: "bg-[#FEF3C7] text-[#92400E]",
  former: "bg-[#F3F4F6] text-[#6B7280]",
};

function renderPartners() {
  const q = $("p-search").value.trim().toLowerCase();
  const status = $("p-status").value;

  const rows = partners.filter((p) => {
    if (status && p.status !== status) return false;
    if (!q) return true;
    return [p.name, p.country, p.city, p.notes]
      .filter(Boolean).join(" ").toLowerCase().includes(q);
  });

  $("p-empty").classList.toggle("hidden", rows.length > 0);
  if (!rows.length) {
    $("p-empty").textContent = partnersError
      ? "Could not load agencies: " + partnersError
      : "No agencies yet.";
  }
  $("p-grid").innerHTML = rows
    .map((p) => {
      const s = partnerStats(p.id);
      const contacts = partnerContacts.filter((c) => c.partner_id === p.id);
      const primary = contacts.find((c) => c.is_primary) || contacts[0];
      return `
      <button data-partner="${p.id}"
        class="p-card text-left bg-white border border-brand-stone/60 p-6 hover:shadow-lg transition-all duration-300">
        <div class="flex items-start justify-between gap-3 mb-3">
          <h3 class="font-serif text-lg leading-tight">${esc(p.name)}</h3>
          <span class="${p.agreement_signed ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#FEF3C7] text-[#92400E]"} shrink-0 text-[9px] font-bold uppercase tracking-[0.15em] px-2.5 py-1">${p.agreement_signed ? "Signed" : "Unsigned"}</span>
        </div>
        <div class="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-4">
          ${esc([p.city, p.country].filter(Boolean).join(", ") || "—")}
        </div>
        ${
          primary
            ? `<p class="text-sm text-gray-600 font-light mb-4">${esc(primary.name)}${primary.role ? ` &middot; ${esc(primary.role)}` : ""}</p>`
            : `<p class="text-sm text-gray-300 font-light mb-4">No contact yet</p>`
        }
        <div class="border-t border-brand-stone/40 pt-3 flex gap-5 text-[10px] uppercase tracking-[0.15em] text-gray-400">
          <span><span class="text-brand-ink font-bold">${s.total}</span> sent</span>
          <span><span class="text-brand-ink font-bold">${s.open}</span> open</span>
          <span><span class="text-brand-ink font-bold">${s.won}</span> won</span>
        </div>
      </button>`;
    })
    .join("");

  document.querySelectorAll(".p-card").forEach((c) =>
    c.addEventListener("click", () => openPartner(c.dataset.partner))
  );
}

function openPartner(id) {
  const p = partners.find((x) => x.id === id);
  if (!p) return;
  const contacts = partnerContacts.filter((c) => c.partner_id === id);
  const mine = leadPartners.filter((lp) => lp.partner_id === id);
  const s = partnerStats(id);

  const field = (label, value, href) =>
    value
      ? `<div class="border-b border-brand-stone/40 py-3 flex justify-between gap-6">
           <span class="text-[10px] uppercase tracking-[0.2em] text-gray-400 shrink-0">${esc(label)}</span>
           <span class="text-sm text-right">${
             href ? `<a href="${href}" class="underline underline-offset-4 hover:text-brand-gold">${esc(value)}</a>` : esc(value)
           }</span>
         </div>`
      : "";

  $("drawer-body").innerHTML = `
    ${duplicateBanner(l)}
    <div class="flex items-start justify-between gap-4 mb-8">
      <div>
        <h2 class="font-serif text-2xl leading-tight">${esc(p.name)}</h2>
        <p class="text-[10px] uppercase tracking-[0.2em] text-gray-400 mt-2">
          ${esc([p.city, p.country].filter(Boolean).join(", ") || "—")}
        </p>
      </div>
      <button id="drawer-close" class="text-gray-400 hover:text-brand-ink transition p-1" aria-label="Close">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <div class="grid grid-cols-3 gap-4 mb-8 text-center">
      <div class="border border-brand-stone/40 py-4">
        <div class="font-serif text-2xl">${s.total}</div>
        <div class="text-[9px] uppercase tracking-[0.2em] text-gray-400 mt-1">Sent</div>
      </div>
      <div class="border border-brand-stone/40 py-4">
        <div class="font-serif text-2xl">${s.open}</div>
        <div class="text-[9px] uppercase tracking-[0.2em] text-gray-400 mt-1">Open</div>
      </div>
      <div class="border border-brand-stone/40 py-4">
        <div class="font-serif text-2xl">${s.won}</div>
        <div class="text-[9px] uppercase tracking-[0.2em] text-gray-400 mt-1">Won</div>
      </div>
    </div>

    <div class="mb-8">
      <label class="block text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">Status</label>
      <select id="p-status-edit" class="w-full bg-white border border-brand-stone/60 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-gold">
        ${["active", "paused", "former"].map((v) => `<option value="${v}" ${v === p.status ? "selected" : ""}>${v[0].toUpperCase() + v.slice(1)}</option>`).join("")}
      </select>
    </div>

    <div class="mb-8">
      ${field("Website", p.website, p.website ? "https://" + p.website.replace(/^https?:\/\//, "") : null)}
      ${field("Email", p.email, p.email ? "mailto:" + p.email : null)}
      ${field("Phone", p.phone, p.phone ? "tel:" + p.phone.replace(/\s/g, "") : null)}
      ${field("Commission", p.commission)}
    </div>

    ${p.notes ? `<div class="mb-8">
      <h3 class="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3">Notes</h3>
      <p class="text-sm text-gray-700 font-light leading-relaxed whitespace-pre-line">${esc(p.notes)}</p>
    </div>` : ""}

    <div class="mb-8">
      <h3 class="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3">Contacts</h3>
      <div class="space-y-3 mb-4">
        ${
          contacts.length
            ? contacts.map((c) => `
              <div class="border-l-2 border-brand-stone pl-4 flex items-start justify-between gap-3">
                <div>
                  <p class="text-sm">${esc(c.name)}${c.is_primary ? ` <span class="text-[9px] uppercase tracking-[0.15em] text-brand-gold ml-1">Primary</span>` : ""}</p>
                  <p class="text-xs text-gray-500 font-light">${esc([c.role, c.email, c.phone].filter(Boolean).join(" · "))}</p>
                </div>
                <button data-rmcontact="${c.id}" class="text-gray-300 hover:text-red-600 transition text-xs shrink-0">Remove</button>
              </div>`).join("")
            : `<p class="text-sm text-gray-400 font-light">Nobody recorded yet.</p>`
        }
      </div>
      <div class="grid grid-cols-2 gap-2">
        <input id="c-name"  placeholder="Name"  class="bg-white border border-brand-stone/60 px-3 py-2 text-sm focus:outline-none focus:border-brand-gold" />
        <input id="c-role"  placeholder="Role"  class="bg-white border border-brand-stone/60 px-3 py-2 text-sm focus:outline-none focus:border-brand-gold" />
        <input id="c-email" placeholder="Email" class="bg-white border border-brand-stone/60 px-3 py-2 text-sm focus:outline-none focus:border-brand-gold" />
        <input id="c-phone" placeholder="Phone" class="bg-white border border-brand-stone/60 px-3 py-2 text-sm focus:outline-none focus:border-brand-gold" />
      </div>
      <button id="c-add" class="mt-2 bg-brand-ink text-white px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition">Add contact</button>
    </div>

    <div class="mb-8">
      <h3 class="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3">Handled by</h3>
      <div class="space-y-2 mb-4" id="ps-list">
        ${
          partnerStaff.filter((x) => x.partner_id === p.id).length
            ? partnerStaff
                .filter((x) => x.partner_id === p.id)
                .map((x) => `
                  <div class="flex items-center justify-between gap-3">
                    ${ownerTag(x.user_id) || `<span class="text-sm text-gray-400">Unknown</span>`}
                    <button data-rmstaff="${x.user_id}" class="text-gray-300 hover:text-red-600 transition text-xs shrink-0">Remove</button>
                  </div>`)
                .join("")
            : `<p class="text-sm text-gray-400 font-light">Nobody assigned yet.</p>`
        }
      </div>
      <div class="flex gap-2">
        <select id="ps-pick" class="flex-1 bg-white border border-brand-stone/60 px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"></select>
        <button id="ps-add" class="bg-brand-ink text-white px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition whitespace-nowrap">Assign</button>
      </div>
    </div>

    <div class="mb-8">
      <h3 class="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3">Leads sent</h3>
      ${
        mine.length
          ? `<div class="space-y-2">${mine
              .map((lp) => {
                const l = leads.find((x) => x.id === lp.lead_id);
                if (!l) return "";
                const st = STAGES.find((s2) => s2.key === l.stage) || STAGES[0];
                return `<button data-goto="${l.id}" class="w-full text-left flex items-center justify-between gap-3 border-b border-brand-stone/40 pb-2 hover:text-brand-gold transition">
                  <span class="text-sm">
                    <span class="text-gray-400 tabular-nums">${esc(leadNo(l))}</span>
                    ${esc(fullName(l))}
                  </span>
                  <span class="stage-${l.stage} text-[9px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 shrink-0">${esc(st.label)}</span>
                </button>`;
              })
              .join("")}</div>`
          : `<p class="text-sm text-gray-400 font-light">Nothing sent to this agency yet.</p>`
      }
    </div>

    <div class="border-t border-brand-stone/40 pt-6">
      <button id="p-delete" class="text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-red-600 transition">
        Remove this agency
      </button>
    </div>
  `;

  $("drawer-close").addEventListener("click", () => showDrawer(false));

  $("p-status-edit").addEventListener("change", async (e) => {
    p.status = e.target.value;
    await api(`partners?id=eq.${p.id}`, { method: "PATCH", body: JSON.stringify({ status: p.status }) });
    renderPartners();
  });

  $("c-add").addEventListener("click", async () => {
    const name = $("c-name").value.trim();
    if (!name) return;
    const row = {
      partner_id: p.id, name,
      role: $("c-role").value.trim() || null,
      email: $("c-email").value.trim() || null,
      phone: $("c-phone").value.trim() || null,
      is_primary: contacts.length === 0,
    };
    await api("partner_contacts", { method: "POST", body: JSON.stringify(row) });
    partnerContacts = await api("partner_contacts?select=*");
    openPartner(p.id);
    renderPartners();
  });

  // who handles this agency
  const already = partnerStaff.filter((x) => x.partner_id === p.id).map((x) => x.user_id);
  $("ps-pick").innerHTML =
    staff
      .filter((s) => !already.includes(s.id))
      .map((s) => `<option value="${esc(s.id)}">${esc(s.name || s.email)}</option>`)
      .join("") || '<option value="">Everyone is already on this agency</option>';

  $("ps-add").addEventListener("click", async () => {
    const user = $("ps-pick").value;
    if (!user) return;
    try {
      await api("partner_staff", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          partner_id: p.id,
          user_id: user,
          added_by: session ? session.user.id : null,
        }),
      });
      partnerStaff = await api("partner_staff?select=*");
      openPartner(p.id);
    } catch (err) {
      alert(
        String(err.message || err).includes("PGRST205")
          ? "Run db/partner-staff.sql in the Supabase SQL editor first."
          : "Could not assign: " + String(err.message || err)
      );
    }
  });

  document.querySelectorAll("[data-rmstaff]").forEach((b) =>
    b.addEventListener("click", async () => {
      await api(`partner_staff?partner_id=eq.${p.id}&user_id=eq.${b.dataset.rmstaff}`, {
        method: "DELETE",
      });
      partnerStaff = await api("partner_staff?select=*");
      openPartner(p.id);
    })
  );

  document.querySelectorAll("[data-rmcontact]").forEach((b) =>
    b.addEventListener("click", async () => {
      await api(`partner_contacts?id=eq.${b.dataset.rmcontact}`, { method: "DELETE" });
      partnerContacts = await api("partner_contacts?select=*");
      openPartner(p.id);
      renderPartners();
    })
  );

  document.querySelectorAll("[data-goto]").forEach((b) =>
    b.addEventListener("click", () => {
      setSection("leads");
      openLead(b.dataset.goto);
    })
  );

  $("p-delete").addEventListener("click", async () => {
    if (!confirm(`Remove ${p.name}? Leads stay, but the link to this agency goes.`)) return;
    await api(`partners?id=eq.${p.id}`, { method: "DELETE" });
    partners = partners.filter((x) => x.id !== p.id);
    leadPartners = leadPartners.filter((lp) => lp.partner_id !== p.id);
    showDrawer(false);
    renderPartners();
  });

  showDrawer(true);
}

async function addPartner() {
  const name = prompt("Agency name");
  if (!name || !name.trim()) return;
  const [row] = await api("partners", {
    method: "POST",
    body: JSON.stringify({ name: name.trim(), status: "active" }),
  });
  partners = await api("partners?select=*&order=name.asc");
  renderPartners();
  if (row && row.id) openPartner(row.id);
}

/* ------------------------------------------------------------ board view */

function setView(next) {
  view = next;
  localStorage.setItem("nql.crm.view", next);
  const board = next === "board";
  $("board-wrap").classList.toggle("hidden", !board);
  $("list-wrap").classList.toggle("hidden", board);
  $("view-board").className =
    "px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] " +
    (board ? "bg-brand-ink text-white" : "text-gray-500 hover:text-brand-ink transition");
  $("view-list").className =
    "px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] " +
    (board ? "text-gray-500 hover:text-brand-ink transition" : "bg-brand-ink text-white");
  render();
}

/* ---------------------------------------------------------------- online */

/* Presence is a heartbeat, not a socket. The browser writes its own row on
   the timer that already fetches new leads, and anyone whose row is fresher
   than this counts as online. Two minutes covers three missed beats, so a
   slow request does not make someone blink out.

   The beat only happens while the tab is visible, so "online" means somebody
   is actually looking at the CRM rather than that they left it open on
   Friday. */
const ONLINE_WINDOW_MS = 120000;

async function beat() {
  if (presenceOff || !session || document.hidden) return;
  try {
    await api("presence?on_conflict=user_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        user_id: session.user.id,
        last_seen: new Date().toISOString(),
      }),
    });
  } catch (err) {
    // One failed beat is not worth a message. A missing table is: without
    // this the widget would sit empty and look like nobody is ever at work.
    console.error("crm: presence beat failed", err);
    if (String(err.message || err).includes("42P01")) presenceOff = true;
  }
}

async function loadPresence() {
  if (presenceOff) return;
  try {
    presence = await api("presence?select=user_id,last_seen");
  } catch (err) {
    console.error("crm: presence unavailable", err);
    presence = [];
    presenceOff = true;
  }
  renderPresence();
}

function onlineNow() {
  const cutoff = Date.now() - ONLINE_WINDOW_MS;
  return presence
    .filter((p) => new Date(p.last_seen).getTime() >= cutoff)
    .map((p) => p.user_id)
    // Yourself first, then by name, so the row does not reshuffle as
    // colleagues come and go.
    .sort((a, b) => {
      const me = session && session.user.id;
      if (a === me) return -1;
      if (b === me) return 1;
      return (staffName(a) || "").localeCompare(staffName(b) || "");
    });
}

function renderPresence() {
  const el = $("online");
  if (!el) return;

  const ids = onlineNow();
  el.classList.toggle("hidden", ids.length === 0);
  el.classList.toggle("flex", ids.length > 0);
  if (!ids.length) {
    el.innerHTML = "";
    return;
  }

  const names = ids.map((id) => {
    const n = staffName(id) || "Someone";
    return session && id === session.user.id ? n + " (you)" : n;
  });

  // Five discs is as many as the header can hold without crowding the nav;
  // the rest become a count, and every name is in the tooltip either way.
  const shown = ids.slice(0, 5);
  const rest = ids.length - shown.length;

  el.innerHTML =
    `<span class="presence-dot" aria-hidden="true"></span>` +
    `<span class="presence-stack">` +
    shown
      .map(
        (id) =>
          `<span class="owner-disc" style="background:${staffColour(id)}">${esc(
            initials(staffName(id) || "?")
          )}</span>`
      )
      .join("") +
    `</span>` +
    (rest > 0
      ? `<span class="text-[10px] text-white/50 tabular-nums">+${rest}</span>`
      : "") +
    `<span class="sr-only">${esc(names.join(", "))} online</span>`;

  el.title =
    ids.length === 1
      ? `${names[0]} is online`
      : `Online now: ${names.join(", ")}`;
}

/* ------------------------------------------------------- density, loading */

let dense = localStorage.getItem("nql.crm.dense") === "1";

function applyDensity() {
  document.body.classList.toggle("dense", dense);
  const btn = $("density");
  if (btn) btn.textContent = dense ? "Comfortable" : "Compact";
}

function toggleDensity() {
  dense = !dense;
  localStorage.setItem("nql.crm.dense", dense ? "1" : "0");
  applyDensity();
}

/* The app shell is revealed before the data arrives, so without this the
   first seconds look like an account with no leads in it rather than one
   still loading. */
function showLoading(on) {
  const bar = $("loading-bar");
  if (bar) bar.classList.toggle("hidden", !on);
  if (on) skeletonRows();
}

function skeletonRows() {
  const w = ["70%", "45%", "60%", "38%", "55%"];
  $("rows").innerHTML = Array.from({ length: 5 })
    .map(
      (_, i) => `
      <tr class="border-b border-brand-stone/40 last:border-0">
        <td class="py-4 px-5"><span class="skel" style="width:52px;height:8px"></span></td>
        <td class="py-4 px-5">
          <span class="skel" style="width:${w[i]}"></span>
          <span class="skel mt-2" style="width:35%;height:8px"></span>
        </td>
        <td class="py-4 px-5"><span class="skel" style="width:60%;height:8px"></span></td>
        <td class="py-4 px-5"><span class="skel" style="width:80%;height:8px"></span></td>
        <td class="py-4 px-5"><span class="skel" style="width:64px;height:18px"></span></td>
        <td class="py-4 px-5"><span class="skel" style="width:24px;height:24px;border-radius:9999px"></span></td>
        <td class="py-4 px-5"><span class="skel" style="width:70%;height:8px"></span></td>
      </tr>`
    )
    .join("");
}

function kanbanCard(l, due) {
  const owner = staffName(l.assigned_to);
  const interest = l.property_name || l.project_interest || "";
  return `
    <article
      class="kcard border p-4 cursor-grab active:cursor-grabbing select-none ${
        isQuiet(l) ? "bg-red-50 border-red-200" : "bg-white border-brand-stone/60"
      }"
      data-id="${l.id}"
    >
      <div class="text-[10px] tracking-[0.15em] text-gray-400 tabular-nums">${esc(leadNo(l))}</div>
      <div class="font-serif text-base leading-tight">${esc(fullName(l))}</div>
      ${
        interest
          ? `<div class="text-xs text-gray-500 font-light mt-1 line-clamp-2">${esc(interest)}</div>`
          : ""
      }
      <div class="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-gray-400">
        <span>${esc(SOURCE_LABEL[l.source] || l.source)}</span>
        <span class="ml-auto flex items-center gap-2">
          ${due.has(l.id) ? `<span class="text-brand-gold">Due</span>` : ""}
          ${isQuiet(l) ? quietFlag(l) : ""}
          ${owner ? ownerTag(l.assigned_to, "avatar") : ""}
        </span>
      </div>
    </article>`;
}

function renderBoard(rows) {
  if (view !== "board") return;
  const due = dueLeadIds();

  $("board").innerHTML = STAGES.map((s) => {
    const inStage = rows.filter((l) => l.stage === s.key);
    // Counted from the visible rows rather than stageValue(), so a filtered
    // board shows the value of what is filtered, not of everything.
    const columnValue = money(
      inStage.reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0)
    );
    return `
      <section
        data-col="${s.key}"
        class="board-col shrink-0 w-[260px] bg-[#F4F2ED] border border-brand-stone/50 transition-colors"
      >
        <div class="h-[3px] bar-${s.key}"></div>
        <header class="col-head px-4 py-3 border-b border-brand-stone/50">
          <div class="flex items-baseline justify-between">
            <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">${esc(s.label)}</span>
            <span class="text-[10px] text-gray-400">${inStage.length}</span>
          </div>
          ${
            columnValue
              ? `<div class="font-serif text-sm text-brand-gold mt-1">${columnValue}</div>`
              : ""
          }
        </header>
        <div class="col-body p-3 space-y-3 min-h-[140px]">
          ${
            inStage.length
              ? inStage.map((l) => kanbanCard(l, due)).join("")
              : `<p class="text-[11px] text-gray-400 font-light px-1 py-6 text-center">Nothing here</p>`
          }
        </div>
      </section>`;
  }).join("");

  wireDrag();
}

/* Pointer events rather than HTML5 drag-and-drop, which does not work on
   touch screens. Same code path for mouse and finger. */
function wireDrag() {
  let start = null;   // { x, y, id, el }
  let ghost = null;
  let hot = null;     // column currently under the pointer

  const cards = Array.prototype.slice.call($("board").querySelectorAll(".kcard"));

  function clearHot() {
    if (hot) hot.classList.remove("col-hot");
    hot = null;
  }

  function finish() {
    if (ghost) ghost.remove();
    ghost = null;
    if (start && start.el) start.el.classList.remove("card-lifted");
    clearHot();
    start = null;
  }

  cards.forEach((card) => {
    card.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      start = { x: e.clientX, y: e.clientY, id: card.dataset.id, el: card, moved: false };
      card.setPointerCapture(e.pointerId);
    });

    card.addEventListener("pointermove", (e) => {
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;

      if (!start.moved) {
        // only take over once the gesture is clearly a drag, and clearly
        // more horizontal than vertical, so the column can still scroll
        if (Math.hypot(dx, dy) < 8) return;
        if (Math.abs(dy) > Math.abs(dx) * 1.4) {
          start = null;
          return;
        }
        start.moved = true;
        const r = card.getBoundingClientRect();
        ghost = card.cloneNode(true);
        ghost.classList.add("drag-ghost");
        ghost.style.width = r.width + "px";
        document.body.appendChild(ghost);
        card.classList.add("card-lifted");
        start.offX = start.x - r.left;
        start.offY = start.y - r.top;
      }

      ghost.style.left = e.clientX - start.offX + "px";
      ghost.style.top = e.clientY - start.offY + "px";

      ghost.style.visibility = "hidden";
      const under = document.elementFromPoint(e.clientX, e.clientY);
      ghost.style.visibility = "";
      const col = under && under.closest ? under.closest("[data-col]") : null;
      if (col !== hot) {
        clearHot();
        hot = col;
        if (hot) hot.classList.add("col-hot");
      }
    });

    card.addEventListener("pointerup", async (e) => {
      if (!start) return;
      const wasDrag = start.moved;
      const id = start.id;
      const target = hot && hot.dataset.col;
      finish();

      if (!wasDrag) {
        openLead(id);
        return;
      }
      if (!target) return;

      const lead = leads.find((l) => l.id === id);
      if (!lead || lead.stage === target) return;

      const previous = lead.stage;
      lead.stage = target;          // move it now, the UI should not wait
      render();
      try {
        await api(`leads?id=eq.${id}`, {
          method: "PATCH",
          body: JSON.stringify({ stage: target }),
        });
      } catch (err) {
        lead.stage = previous;      // put it back if the save failed
        render();
        alert("Could not move that lead. It has been put back.");
      }
    });

    card.addEventListener("pointercancel", finish);
  });
}


/* ------------------------------------------------------------ manual lead */

function openAddLead() {
  const owner = $("a-owner");
  owner.innerHTML =
    '<option value="">Unassigned</option>' +
    staff
      .map((s) => `<option value="${esc(s.id)}">${esc(s.name || s.email)}</option>`)
      .join("");
  // Whoever is adding it is usually the one who will chase it.
  if (session && session.user) owner.value = session.user.id;

  $("add-error").classList.add("hidden");
  $("add-form").reset();
  owner.value = session && session.user ? session.user.id : "";
  $("add-modal").classList.remove("hidden");
  $("add-modal").classList.add("flex");
  $("a-first").focus();
}

function closeAddLead() {
  $("add-modal").classList.add("hidden");
  $("add-modal").classList.remove("flex");
}

async function saveNewLead(e) {
  e.preventDefault();
  const err = $("add-error");
  const button = $("add-save");
  const value = (id) => {
    const v = $(id).value.trim();
    return v === "" ? null : v;
  };

  // A lead nobody can contact is not a lead.
  if (!value("a-email") && !value("a-phone")) {
    err.textContent = "Add an email address or a phone number so we can reach them.";
    err.classList.remove("hidden");
    return;
  }

  const row = {
    source: $("a-source").value,
    stage: "new",
    first_name: value("a-first"),
    last_name: value("a-last"),
    email: value("a-email"),
    phone: value("a-phone"),
    budget: value("a-budget"),
    property_name: value("a-interest"),
    message: value("a-message"),
    assigned_to: $("a-owner").value || null,
    raw: { entered_by: session && session.user ? session.user.email : null },
  };

  button.disabled = true;
  button.textContent = "Saving";
  err.classList.add("hidden");
  try {
    await api("leads", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(row),
    });
    closeAddLead();
    leads = await api("leads?select=*&order=created_at.desc");
    render();
  } catch (e2) {
    // The likeliest failure by far is the database refusing the insert, and
    // "42501" on its own tells nobody what to do about it.
    const detail = String(e2.message || e2);
    err.textContent = detail.includes("42501")
      ? "The database is not allowing new leads to be added yet. Run the grant and policy from db/install.sql."
      : "Could not save: " + detail;
    err.classList.remove("hidden");
  } finally {
    button.disabled = false;
    button.textContent = "Save lead";
  }
}




/* --------------------------------------------------------- header tidying */

// Not access control. The newsletter list is simply not the sales team's work,
// so the tab is not drawn for them. Anyone marked admin in staff_roles keeps
// it. If that table cannot be read, everyone keeps it, because losing a tab
// you rely on is worse than seeing one you do not.
async function hideNewsletterForSales() {
  const tab = $("nav-subscribers");
  if (!tab || !session) return;
  try {
    const rows = await api(`staff_roles?user_id=eq.${session.user.id}&select=role`);
    const admin = Array.isArray(rows) && rows.length > 0 && rows[0].role === "admin";
    hideNewsletter = !admin;
    tab.classList.toggle("hidden", hideNewsletter);
  } catch (err) {
    console.error("crm: could not read role, leaving the header alone", err);
  }
}





/* ------------------------------------------------------------ duplicates */

// Same person, two ads, two rows, two people ringing them. Matching is on
// email or phone, both normalised, because those are the two fields a person
// gives identically twice.
function normalPhone(s) {
  return String(s || "").replace(/[^0-9]/g, "").slice(-8);
}

function duplicatesOf(lead) {
  const email = String(lead.email || "").trim().toLowerCase();
  const phone = normalPhone(lead.phone);
  if (!email && !phone) return [];
  return leads.filter((o) => {
    if (o.id === lead.id) return false;
    const oe = String(o.email || "").trim().toLowerCase();
    const op = normalPhone(o.phone);
    return (email && oe === email) || (phone.length >= 6 && op === phone);
  });
}

function duplicateBanner(lead) {
  const dupes = duplicatesOf(lead);
  if (!dupes.length) return "";
  return `<div class="mb-6 border border-amber-300 bg-amber-50 px-4 py-3">
      <p class="text-[10px] uppercase tracking-[0.2em] text-amber-800 mb-2">
        ${dupes.length === 1 ? "Also in the pipeline" : "Also in the pipeline, " + dupes.length + " times"}
      </p>
      ${dupes
        .map(
          (d) => `<button data-dupe="${d.id}" class="block text-sm text-amber-900 hover:underline text-left">
            <span class="tabular-nums">${esc(leadNo(d))}</span> &middot; ${esc(fullName(d))} &middot; ${esc(SOURCE_LABEL[d.source] || d.source)} &middot; ${esc(when(d.created_at))}
          </button>`
        )
        .join("")}
    </div>`;
}

/* --------------------------------------------------------------- reports */

function renderReports() {
  const cell = (v, cls) => `<td class="py-3 px-5 text-sm ${cls || "text-gray-600"}">${v}</td>`;
  const rate = (won, closed) =>
    closed ? Math.round((won / closed) * 100) + "%" : '<span class="text-gray-300">n/a</span>';

  // --- by source ---
  const bySource = new Map();
  leads.forEach((l) => {
    const k = l.source || "unknown";
    const r = bySource.get(k) || { total: 0, won: 0, lost: 0, value: 0 };
    r.total++;
    if (l.stage === "won") { r.won++; r.value += Number(l.deal_value) || 0; }
    if (l.stage === "lost") r.lost++;
    bySource.set(k, r);
  });
  $("rep-source").innerHTML =
    [...bySource.entries()]
      .sort((a, b) => b[1].total - a[1].total)
      .map(([k, r]) => `
        <tr class="border-b border-brand-stone/40 last:border-0">
          ${cell(esc(SOURCE_LABEL[k] || k), "text-brand-ink")}
          ${cell(r.total)}
          ${cell(r.total - r.won - r.lost)}
          ${cell(r.won, "text-brand-ink font-medium")}
          ${cell(r.lost)}
          ${cell(rate(r.won, r.won + r.lost))}
          ${cell(money(r.value) || '<span class="text-gray-300">nil</span>')}
        </tr>`)
      .join("") ||
    '<tr><td colspan="7" class="py-10 text-center text-sm text-gray-400 font-light">No leads yet.</td></tr>';

  // --- by agency: counted from lead_partners, so it needs no extra view ---
  const byAgency = new Map();
  leadPartners.forEach((lp) => {
    const lead = leads.find((l) => l.id === lp.lead_id);
    if (!lead) return;
    const r = byAgency.get(lp.partner_id) || { total: 0, won: 0, lost: 0 };
    r.total++;
    if (lead.stage === "won") r.won++;
    if (lead.stage === "lost") r.lost++;
    byAgency.set(lp.partner_id, r);
  });
  $("rep-agency").innerHTML =
    partners
      .map((p) => [p, byAgency.get(p.id) || { total: 0, won: 0, lost: 0 }])
      .sort((a, b) => b[1].total - a[1].total || a[0].name.localeCompare(b[0].name))
      .map(([p, r]) => `
        <tr class="border-b border-brand-stone/40 last:border-0">
          ${cell(esc(p.name), "text-brand-ink")}
          ${cell(r.total || '<span class="text-gray-300">none</span>')}
          ${cell(r.total - r.won - r.lost)}
          ${cell(r.won, "text-brand-ink font-medium")}
          ${cell(r.lost)}
        </tr>`)
      .join("") ||
    '<tr><td colspan="5" class="py-10 text-center text-sm text-gray-400 font-light">No agencies yet.</td></tr>';

  // --- by month ---
  const byMonth = new Map();
  leads.forEach((l) => {
    const k = (l.created_at || "").slice(0, 7);
    if (!k) return;
    const r = byMonth.get(k) || { total: 0, won: 0 };
    r.total++;
    if (l.stage === "won") r.won++;
    byMonth.set(k, r);
  });
  $("rep-month").innerHTML =
    [...byMonth.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([k, r]) => {
        const [y, m] = k.split("-");
        const label = new Date(Number(y), Number(m) - 1, 1)
          .toLocaleDateString("en-GB", { month: "long", year: "numeric" });
        return `
        <tr class="border-b border-brand-stone/40 last:border-0">
          ${cell(esc(label), "text-brand-ink")}
          ${cell(r.total)}
          ${cell(r.won, "text-brand-ink font-medium")}
        </tr>`;
      })
      .join("") ||
    '<tr><td colspan="3" class="py-10 text-center text-sm text-gray-400 font-light">No leads yet.</td></tr>';
}

/* ------------------------------------------------------------ deal value */

function money(n) {
  if (n === null || n === undefined || n === "") return "";
  const v = Number(n);
  if (!isFinite(v) || v === 0) return "";
  // 1500000 is 1.5M, not 1.50M, and 2000000 is 2M, not 2.0M.
  if (v >= 1000000)
    return "\u20ac" + (v / 1000000).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (v >= 1000) return "\u20ac" + Math.round(v / 1000) + "k";
  return "\u20ac" + v;
}

function stageValue(key) {
  return leads
    .filter((l) => (key ? l.stage === key : true))
    .reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0);
}

/* ------------------------------------------------------------ gone quiet */

// How long a lead may sit untouched before it counts as neglected. Early
// stages are tighter: somebody who wrote in yesterday and heard nothing is a
// different kind of loss from somebody mid negotiation.
const QUIET_DAYS = { new: 7, contacted: 14, viewing: 14, offer: 14 };

// Latest note per lead, so "when did anyone last do anything" is answerable
// for every lead at once rather than one drawer at a time.
async function loadActivity() {
  try {
    const rows = await api("lead_notes?select=lead_id,created_at&order=created_at.desc");
    lastTouch = new Map();
    rows.forEach((n) => {
      if (!lastTouch.has(n.lead_id)) lastTouch.set(n.lead_id, n.created_at);
    });
  } catch (err) {
    console.error("crm: activity unavailable", err);
    lastTouch = new Map();
  }
}

function lastTouchedAt(l) {
  return lastTouch.get(l.id) || l.created_at;
}

function daysSinceTouch(l) {
  const then = new Date(lastTouchedAt(l)).getTime();
  return Math.floor((Date.now() - then) / 86400000);
}

function isQuiet(l) {
  if (l.stage === "won" || l.stage === "lost") return false;
  const limit = QUIET_DAYS[l.stage];
  if (limit === undefined) return false;
  return daysSinceTouch(l) >= limit;
}

function quietLeadIds() {
  return new Set(leads.filter(isQuiet).map((l) => l.id));
}

function quietFlag(l) {
  if (!isQuiet(l)) return "";
  const d = daysSinceTouch(l);
  return `<span class="text-red-700 font-medium" title="No contact recorded for ${d} days">${d}d quiet</span>`;
}

function renderQuiet() {
  const n = quietLeadIds().size;
  const btn = $("quiet");
  if (!btn) return;
  btn.classList.toggle("hidden", n === 0);
  btn.classList.toggle("flex", n > 0);
  $("quiet-count").textContent = n === 1 ? "1 gone quiet" : `${n} gone quiet`;
  btn.classList.toggle("bg-red-500/20", quietOnly);
}

/* ----------------------------------------------------------------- tasks */

function taskRows() {
  const owner = $("t-filter-owner").value;
  const status = $("t-filter-status").value;
  return tasks.filter((t) => {
    const mine =
      owner === "" ||
      (owner === "__none" && !t.assigned_to) ||
      t.assigned_to === owner;
    const state =
      status === "" || (status === "open" && !t.done) || (status === "done" && t.done);
    return mine && state;
  });
}

function overdue(t) {
  return !t.done && t.due_on && t.due_on < new Date().toISOString().slice(0, 10);
}

function dueLabel(t) {
  if (!t.due_on) return "";
  const today = new Date().toISOString().slice(0, 10);
  if (t.due_on === today) return "Today";
  return new Date(t.due_on).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// Who is carrying what. The whole point of the board: an empty column is as
// informative as a full one.
function renderWorkload() {
  const open = tasks.filter((t) => !t.done);
  const counts = new Map();
  staff.forEach((s) => counts.set(s.id, 0));
  let unassigned = 0;
  open.forEach((t) => {
    if (!t.assigned_to) unassigned++;
    else counts.set(t.assigned_to, (counts.get(t.assigned_to) || 0) + 1);
  });

  const late = (id) =>
    open.filter((t) => t.assigned_to === id && overdue(t)).length;

  let html = staff
    .map((s) => {
      const n = counts.get(s.id) || 0;
      const l = late(s.id);
      return `<div class="flex items-baseline gap-2">
        <span class="inline-block w-2 h-2 rounded-full shrink-0" style="background:${staffColour(s.id)}"></span>
        <span class="text-sm text-brand-ink">${esc(s.name || s.email)}</span>
        <span class="font-serif text-lg" style="color:${staffColour(s.id)}">${n}</span>
        ${l ? `<span class="text-[10px] uppercase tracking-[0.18em] text-red-700">${l} late</span>` : ""}
      </div>`;
    })
    .join("");

  if (unassigned) {
    html += `<div class="flex items-baseline gap-2">
      <span class="inline-block w-2 h-2 rounded-full shrink-0 bg-gray-300"></span>
      <span class="text-sm text-gray-500">Unassigned</span>
      <span class="font-serif text-lg text-gray-500">${unassigned}</span>
    </div>`;
  }
  $("t-workload").innerHTML = html;
}

function renderTasks() {
  if (!$("t-list")) return;
  const rows = taskRows();
  $("t-count").textContent = `${rows.length} task${rows.length === 1 ? "" : "s"}`;

  const empty = $("t-empty");
  empty.classList.toggle("hidden", rows.length > 0);
  if (tasksError) {
    empty.innerHTML =
      '<span class="text-red-700">Tasks could not be loaded.</span><br />' +
      '<span class="text-gray-400">' + esc(tasksError) + "</span><br />" +
      '<span class="text-gray-400">Run db/tasks.sql in the Supabase SQL editor.</span>';
  } else {
    empty.textContent = "Nothing here.";
  }

  // Unassigned first, then by due date, then oldest first.
  rows.sort((a, b) => {
    if (!!a.assigned_to !== !!b.assigned_to) return a.assigned_to ? 1 : -1;
    if (a.due_on !== b.due_on) return (a.due_on || "9999").localeCompare(b.due_on || "9999");
    return a.created_at.localeCompare(b.created_at);
  });

  $("t-list").innerHTML = rows
    .map(
      (t) => `
      <div class="bg-white border ${overdue(t) ? "border-red-300" : "border-brand-stone/60"} px-5 py-4 flex items-start gap-4 ${t.done ? "opacity-50" : ""}">
        <input type="checkbox" data-task-done="${t.id}" ${t.done ? "checked" : ""}
               class="mt-1 shrink-0 accent-brand-gold w-4 h-4 cursor-pointer" />
        <div class="min-w-0 flex-1">
          <p class="text-sm text-brand-ink ${t.done ? "line-through" : ""}">${esc(t.title)}</p>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px]">
            ${
              t.assigned_to
                ? ownerTag(t.assigned_to)
                : '<span class="text-gray-400 uppercase tracking-[0.18em] text-[10px]">Unassigned</span>'
            }
            ${
              t.due_on
                ? `<span class="${overdue(t) ? "text-red-700 font-medium" : "text-gray-500"}">${esc(dueLabel(t))}</span>`
                : ""
            }
            ${
              t.lead_id
                ? (() => {
                    const l = leads.find((x) => x.id === t.lead_id);
                    const label = l ? `Open ${leadNo(l)}` : "Open lead";
                    return `<button data-task-lead="${t.lead_id}" class="text-gray-400 hover:text-brand-ink transition underline underline-offset-2 tabular-nums">${esc(label)}</button>`;
                  })()
                : ""
            }
          </div>
        </div>
        <select data-task-assign="${t.id}"
          class="shrink-0 border border-brand-stone/60 px-2 py-1.5 text-xs bg-white text-gray-600 focus:outline-none focus:border-brand-gold">
        </select>
        <button data-task-del="${t.id}" title="Delete"
          class="shrink-0 text-[10px] uppercase tracking-[0.2em] text-gray-300 hover:text-red-600 transition">Delete</button>
      </div>`
    )
    .join("");

  // Fill every reassign dropdown with the staff list and select the owner.
  $("t-list").querySelectorAll("[data-task-assign]").forEach((sel) => {
    const t = tasks.find((x) => x.id === sel.dataset.taskAssign);
    sel.innerHTML =
      '<option value="">Unassigned</option>' +
      staff.map((s) => `<option value="${esc(s.id)}">${esc(s.name || s.email)}</option>`).join("");
    sel.value = t && t.assigned_to ? t.assigned_to : "";
    sel.addEventListener("change", () => assignTask(sel.dataset.taskAssign, sel.value));
  });

  $("t-list").querySelectorAll("[data-task-done]").forEach((cb) =>
    cb.addEventListener("change", () => completeTask(cb.dataset.taskDone, cb.checked))
  );
  $("t-list").querySelectorAll("[data-task-del]").forEach((b) =>
    b.addEventListener("click", () => deleteTask(b.dataset.taskDel))
  );
  $("t-list").querySelectorAll("[data-task-lead]").forEach((b) =>
    b.addEventListener("click", () => {
      setSection("leads");
      openLead(b.dataset.taskLead);
    })
  );

  renderWorkload();
  renderTaskBadge();
}

// The nav badge counts only what is open and yours, because a number counting
// everyone's work is a number nobody acts on.
function renderTaskBadge() {
  const el = $("nav-tasks-count");
  if (!el || !session) return;
  const mine = tasks.filter((t) => !t.done && t.assigned_to === session.user.id).length;
  el.textContent = mine;
  el.classList.toggle("hidden", mine === 0);
}

async function loadTasks() {
  try {
    tasks = await api("tasks?select=*&order=created_at.desc");
    tasksError = null;
  } catch (err) {
    console.error("crm: tasks unavailable", err);
    tasks = [];
    tasksError = String(err.message || err);
  }
}

async function addTask(e) {
  e.preventDefault();
  const title = $("t-title").value.trim();
  if (!title) return;
  const err = $("t-error");
  err.classList.add("hidden");
  try {
    await api("tasks", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        title,
        assigned_to: $("t-assign").value || null,
        due_on: $("t-due").value || null,
        created_by: session ? session.user.id : null,
      }),
    });
    $("t-title").value = "";
    $("t-due").value = "";
    await loadTasks();
    renderTasks();
  } catch (e2) {
    const detail = String(e2.message || e2);
    err.textContent = detail.includes("42501") || detail.includes("PGRST205")
      ? "The tasks table is not set up yet. Run db/tasks.sql in the Supabase SQL editor."
      : "Could not save: " + detail;
    err.classList.remove("hidden");
  }
}

async function completeTask(id, done) {
  const patch = done
    ? { done: true, done_at: new Date().toISOString(), done_by: session ? session.user.id : null }
    : { done: false, done_at: null, done_by: null };
  const row = tasks.find((t) => t.id === id);
  if (row) Object.assign(row, patch);
  renderTasks();
  try {
    await api(`tasks?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(patch) });
  } catch (err) {
    console.error("crm: could not update task", err);
    await loadTasks();
    renderTasks();
  }
}

async function assignTask(id, owner) {
  const row = tasks.find((t) => t.id === id);
  if (row) row.assigned_to = owner || null;
  renderTasks();
  try {
    await api(`tasks?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify({ assigned_to: owner || null }),
    });
  } catch (err) {
    console.error("crm: could not reassign task", err);
    await loadTasks();
    renderTasks();
  }
}

async function deleteTask(id) {
  if (!confirm("Delete this task?")) return;
  try {
    await api(`tasks?id=eq.${id}`, { method: "DELETE" });
    tasks = tasks.filter((t) => t.id !== id);
    renderTasks();
  } catch (err) {
    console.error("crm: could not delete task", err);
  }
}

function fillTaskSelects() {
  const people = staff
    .map((s) => `<option value="${esc(s.id)}">${esc(s.name || s.email)}</option>`)
    .join("");
  $("t-assign").innerHTML = '<option value="">Unassigned</option>' + people;
  if (session) $("t-assign").value = session.user.id;
  $("t-filter-owner").innerHTML =
    '<option value="">Everyone</option><option value="__none">Unassigned</option>' + people;
}

/* ---------------------------------------------------------- subscribers */

function subscriberRows() {
  const q = ($("s-search").value || "").trim().toLowerCase();
  const status = $("s-status").value;
  return subscribers.filter((s) => {
    const match = !q || (s.email || "").toLowerCase().includes(q);
    const live =
      status === "" ||
      (status === "active" && !s.unsubscribed_at) ||
      (status === "gone" && s.unsubscribed_at);
    return match && live;
  });
}

function renderSubscribers() {
  const rows = subscriberRows();
  $("s-count").textContent = `${rows.length} subscriber${rows.length === 1 ? "" : "s"}`;
  const empty = $("s-empty");
  empty.classList.toggle("hidden", rows.length > 0);
  if (subscribersError) {
    empty.innerHTML =
      '<span class="text-red-700">Subscribers could not be loaded.</span><br />' +
      '<span class="text-gray-400">' + esc(subscribersError) + "</span><br />" +
      '<span class="text-gray-400">Signups are not being saved until this is fixed. ' +
      "Run db/subscribers.sql in the Supabase SQL editor.</span>";
  } else {
    empty.textContent = "No subscribers yet.";
  }

  $("s-rows").innerHTML = rows
    .map(
      (s) => `
      <tr class="border-b border-brand-stone/40 ${s.unsubscribed_at ? "opacity-50" : ""}">
        <td class="py-4 px-5 text-sm">${esc(s.email)}</td>
        <td class="py-4 px-5 text-sm text-gray-500 font-light whitespace-nowrap">${when(s.created_at)}</td>
        <td class="py-4 px-5 text-[10px] uppercase tracking-[0.2em] text-gray-400">${esc(s.signup_source || "site")}</td>
        <td class="py-4 px-5 text-right whitespace-nowrap">
          ${
            s.unsubscribed_at
              ? `<span class="text-[10px] uppercase tracking-[0.2em] text-gray-400">Unsubscribed</span>`
              : `<button data-unsub="${s.id}" class="text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-brand-ink transition">Unsubscribe</button>`
          }
          <button data-forget="${s.id}" class="ml-4 text-[10px] uppercase tracking-[0.2em] text-gray-300 hover:text-red-600 transition" title="Erase this address entirely">Delete</button>
        </td>
      </tr>`
    )
    .join("");

  $("s-rows").querySelectorAll("[data-unsub]").forEach((b) =>
    b.addEventListener("click", () => unsubscribe(b.dataset.unsub))
  );
  $("s-rows").querySelectorAll("[data-forget]").forEach((b) =>
    b.addEventListener("click", () => forgetSubscriber(b.dataset.forget))
  );
}

// Recording the withdrawal rather than deleting is what proves when someone
// opted out, if they ever complain about being contacted.
async function unsubscribe(id) {
  const at = new Date().toISOString();
  try {
    await api(`subscribers?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify({ unsubscribed_at: at }),
    });
    const s = subscribers.find((x) => x.id === id);
    if (s) s.unsubscribed_at = at;
    renderSubscribers();
  } catch {
    alert("Could not update that subscriber.");
  }
}

// For an actual erasure request, where holding the address is itself the problem.
async function forgetSubscriber(id) {
  const s = subscribers.find((x) => x.id === id);
  if (!s) return;
  if (!confirm(`Permanently delete ${s.email}? This cannot be undone.`)) return;
  try {
    await api(`subscribers?id=eq.${id}`, { method: "DELETE" });
    subscribers = subscribers.filter((x) => x.id !== id);
    renderSubscribers();
  } catch {
    alert("Could not delete that subscriber.");
  }
}

function exportSubscribers() {
  const rows = subscriberRows();
  const csv = [["Email", "Signed up", "From", "Unsubscribed"]]
    .concat(rows.map((s) => [s.email || "", s.created_at || "", s.signup_source || "", s.unsubscribed_at || ""]))
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `nql-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------------------------------------------------------------- export */

function exportCsv() {
  const rows = visibleLeads();
  const cols = [
    ["Lead", (l) => l.lead_no],
    ["Received", (l) => l.created_at],
    ["Source", (l) => SOURCE_LABEL[l.source] || l.source],
    ["Stage", (l) => (STAGES.find((s) => s.key === l.stage) || {}).label],
    ["Owner", (l) => staffName(l.assigned_to) || ""],
    ["First name", (l) => l.first_name],
    ["Last name", (l) => l.last_name],
    ["Email", (l) => l.email],
    ["Phone", (l) => l.phone],
    ["Budget", (l) => l.budget],
    ["Property", (l) => l.property_name],
    ["Interest", (l) => l.project_interest],
    ["Message", (l) => l.message],
  ];
  const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [
    cols.map((c) => cell(c[0])).join(","),
    ...rows.map((l) => cols.map((c) => cell(c[1](l))).join(",")),
  ].join("\r\n");

  const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `nql-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ----------------------------------------------------------------- drawer */

async function openLead(id) {
  openLeadId = id;
  const l = leads.find((x) => x.id === id);
  if (!l) return;

  const [notes, reminders] = await Promise.all([
    api(`lead_notes?lead_id=eq.${id}&select=*&order=created_at.desc`),
    api(`lead_reminders?lead_id=eq.${id}&select=*&order=due_at.asc`),
  ]);

  const field = (label, value) =>
    value
      ? `<div class="border-b border-brand-stone/40 py-3 flex justify-between gap-6">
           <span class="text-[10px] uppercase tracking-[0.2em] text-gray-400 shrink-0">${esc(label)}</span>
           <span class="text-sm text-right">${esc(value)}</span>
         </div>`
      : "";

  $("drawer-body").innerHTML = `
    <div class="flex items-start justify-between gap-4 mb-8">
      <div>
        <p class="text-[11px] tracking-[0.2em] text-brand-gold tabular-nums mb-1">${esc(leadNo(l))}</p>
        <h2 class="font-serif text-2xl leading-tight">${esc(fullName(l))}</h2>
        <p class="text-[10px] uppercase tracking-[0.2em] text-gray-400 mt-2">
          ${esc(SOURCE_LABEL[l.source] || l.source)} &middot; ${esc(when(l.created_at))}
        </p>
      </div>
      <button id="drawer-close" class="text-gray-400 hover:text-brand-ink transition p-1" aria-label="Close">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <div class="grid grid-cols-2 gap-3 mb-8">
      <div>
        <label class="block text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">Stage</label>
        <select id="d-stage" class="w-full bg-white border border-brand-stone/60 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-gold">
          ${STAGES.map((s) => `<option value="${s.key}" ${s.key === l.stage ? "selected" : ""}>${esc(s.label)}</option>`).join("")}
        </select>
      </div>
      <div>
        <label class="block text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">Owner</label>
        <select id="d-owner" class="w-full bg-white border border-brand-stone/60 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-gold">
          <option value="">Unassigned</option>
          ${staff.map((s) => `<option value="${s.id}" ${s.id === l.assigned_to ? "selected" : ""} style="color:${staffColour(s.id)}">${esc(s.name)}</option>`).join("")}
        </select>
      </div>
    </div>

    <div class="mb-8">
      ${field("Email", l.email)}
      ${field("Phone", l.phone)}
      <div class="border-b border-brand-stone/40 py-3 flex justify-between items-center gap-6">
        <label for="d-budget" class="text-[10px] uppercase tracking-[0.2em] text-gray-400 shrink-0">Budget</label>
        <input id="d-budget" value="${esc(l.budget || "")}" placeholder="Not stated"
          class="text-sm text-right bg-transparent w-44 py-0.5 border-b border-transparent hover:border-brand-stone/60 focus:border-brand-gold focus:outline-none transition placeholder-gray-300" />
      </div>

      <div class="flex items-center gap-3">
        <label for="d-value" class="text-[10px] uppercase tracking-[0.2em] text-gray-400 shrink-0">Deal value</label>
        <input id="d-value" type="number" min="0" step="1000" value="${l.deal_value ?? ""}" placeholder="Euro, once there is an offer"
          class="flex-1 bg-transparent border-b border-brand-stone/60 py-1 text-sm focus:outline-none focus:border-brand-gold transition" />
      </div>
      ${field("Property", l.property_name)}
      ${field("Interest", l.project_interest)}
      ${field("Meeting", l.meeting_format)}
      ${field("Preferred", [l.preferred_date, l.preferred_time].filter(Boolean).join(" · "))}
    </div>

    <div class="mb-8">
      <div class="flex items-baseline justify-between mb-3">
        <h3 class="text-[10px] uppercase tracking-[0.2em] text-gray-400">Message</h3>
        <span id="d-message-state" class="text-[10px] uppercase tracking-[0.2em] text-gray-300"></span>
      </div>
      <textarea id="d-message" rows="5"
        placeholder="Nothing came with this enquiry. You can write what you know here."
        class="w-full bg-white border border-brand-stone/60 px-3 py-2.5 text-sm text-gray-700 font-light leading-relaxed focus:outline-none focus:border-brand-gold transition">${esc(l.message || "")}</textarea>
    </div>

    <!-- reminders -->
    <div class="mb-8">
      <h3 class="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3">Follow-up</h3>
      <div class="space-y-2 mb-3">
        ${
          reminders.length
            ? reminders
                .map((r) => {
                  const overdue = !r.done && new Date(r.due_at) < new Date();
                  return `<label class="flex items-start gap-3 text-sm ${r.done ? "text-gray-300 line-through" : ""}">
                    <input type="checkbox" data-reminder="${r.id}" ${r.done ? "checked" : ""} class="mt-1 accent-brand-gold" />
                    <span class="flex-1">${esc(r.note || "Follow up")}</span>
                    <span class="text-[10px] uppercase tracking-[0.15em] whitespace-nowrap ${overdue ? "text-red-600" : "text-gray-400"}">
                      ${new Date(r.due_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  </label>`;
                })
                .join("")
            : `<p class="text-sm text-gray-400 font-light">Nothing scheduled.</p>`
        }
      </div>
      <div class="flex gap-2">
        <input id="r-note" placeholder="Remind me to…" class="flex-1 bg-white border border-brand-stone/60 px-3 py-2 text-sm focus:outline-none focus:border-brand-gold" />
        <input id="r-date" type="date" class="bg-white border border-brand-stone/60 px-3 py-2 text-sm text-gray-500 focus:outline-none focus:border-brand-gold" />
        <button id="r-add" class="bg-brand-ink text-white px-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition">Add</button>
      </div>
    </div>

    <!-- partners -->
    <div class="mb-8">
      <h3 class="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3">Agencies on this lead</h3>
      <div class="space-y-2 mb-3" id="lead-partners"></div>
      <div class="flex gap-2">
        <select id="lp-select" class="flex-1 bg-white border border-brand-stone/60 px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-brand-gold"></select>
        <input id="lp-role" placeholder="Role" class="w-32 bg-white border border-brand-stone/60 px-3 py-2 text-sm focus:outline-none focus:border-brand-gold" />
        <button id="lp-add" class="bg-brand-ink text-white px-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition">Add</button>
      </div>
    </div>

    <!-- notes -->
    <div class="mb-8">
      <h3 class="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3">Notes</h3>
      <div class="space-y-4 mb-4">
        ${
          notes.length
            ? notes
                .map(
                  (n) => `<div class="border-l-2 border-brand-stone pl-4">
                    <p class="text-sm text-gray-700 font-light leading-relaxed whitespace-pre-line">${esc(n.body)}</p>
                    <div class="flex items-center justify-between gap-3 mt-2">
                      <p class="text-[10px] uppercase tracking-[0.15em] text-gray-400">
                        ${ownerTag(n.author) || "—"} &middot; ${esc(when(n.created_at))}
                      </p>
                      ${
                        // Only the author may delete a note, so only the author
                        // is offered the button.
                        n.author && session && n.author === session.user.id
                          ? `<button data-delnote="${n.id}" class="text-[10px] uppercase tracking-[0.15em] text-gray-300 hover:text-red-600 transition shrink-0">Delete</button>`
                          : ""
                      }
                    </div>
                  </div>`
                )
                .join("")
            : `<p class="text-sm text-gray-400 font-light">No notes yet.</p>`
        }
      </div>
      <div class="flex flex-wrap gap-2 mb-3">
        ${["Called", "Emailed", "No answer", "Left voicemail"]
          .map(
            (what) =>
              `<button data-log="${what}" class="border border-brand-stone px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 hover:border-brand-ink hover:text-brand-ink transition">${what}</button>`
          )
          .join("")}
      </div>
      <textarea id="n-body" rows="3" placeholder="Add a note…"
        class="w-full bg-white border border-brand-stone/60 px-3 py-2 text-sm focus:outline-none focus:border-brand-gold resize-none"></textarea>
      <button id="n-add" class="mt-2 bg-brand-ink text-white px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition">Save note</button>
    </div>

    <div class="border-t border-brand-stone/40 pt-6">
      <button id="d-delete" class="text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-red-600 transition">
        Delete this lead
      </button>
      <p class="text-[11px] text-gray-400 font-light mt-2 leading-relaxed">
        Removes the record permanently. Use this for erasure requests.
      </p>
    </div>
  `;

  wireDrawer(l);
  showDrawer(true);
  render();
}

function wireDrawer(l) {
  $("drawer-close").addEventListener("click", () => showDrawer(false));

  $("d-stage").addEventListener("change", async (e) => {
    l.stage = e.target.value;
    await api(`leads?id=eq.${l.id}`, { method: "PATCH", body: JSON.stringify({ stage: l.stage }) });
    render();
  });

  $("d-owner").addEventListener("change", async (e) => {
    l.assigned_to = e.target.value || null;
    await api(`leads?id=eq.${l.id}`, {
      method: "PATCH",
      body: JSON.stringify({ assigned_to: l.assigned_to }),
    });
    render();
  });

  renderLeadPartners(l);

  $("lp-add").addEventListener("click", async () => {
    const pid = $("lp-select").value;
    if (!pid) return;
    const row = { lead_id: l.id, partner_id: pid, role: $("lp-role").value.trim() || null };
    await api("lead_partners", { method: "POST", body: JSON.stringify(row) });
    leadPartners = await api("lead_partners?select=*");
    renderLeadPartners(l);
  });

  $("d-message").addEventListener("change", async (e) => {
    const value = e.target.value.trim() || null;
    const state = $("d-message-state");
    state.textContent = "Saving";
    try {
      await api(`leads?id=eq.${l.id}`, {
        method: "PATCH",
        body: JSON.stringify({ message: value }),
      });
      l.message = value;
      const inList = leads.find((x) => x.id === l.id);
      if (inList) inList.message = value;
      state.textContent = "Saved";
      setTimeout(() => {
        if (state.textContent === "Saved") state.textContent = "";
      }, 2000);
      render();
    } catch {
      state.textContent = "";
      alert("Could not save the message.");
      e.target.value = l.message || "";
    }
  });

  $("d-value").addEventListener("change", async (e) => {
    const raw = e.target.value.trim();
    const value = raw === "" ? null : Number(raw);
    if (value !== null && !isFinite(value)) return;
    try {
      await api(`leads?id=eq.${l.id}`, {
        method: "PATCH",
        body: JSON.stringify({ deal_value: value }),
      });
      l.deal_value = value;
      const inList = leads.find((x) => x.id === l.id);
      if (inList) inList.deal_value = value;
      render();
    } catch (err) {
      alert(
        String(err.message || err).includes("deal_value")
          ? "Run db/deal-value.sql in the Supabase SQL editor first."
          : "Could not save the value."
      );
      e.target.value = l.deal_value ?? "";
    }
  });

  $("d-budget").addEventListener("change", async (e) => {
    const value = e.target.value.trim() || null;
    try {
      await api(`leads?id=eq.${l.id}`, {
        method: "PATCH",
        body: JSON.stringify({ budget: value }),
      });
      l.budget = value;
      const inList = leads.find((x) => x.id === l.id);
      if (inList) inList.budget = value;
      render();
    } catch {
      alert("Could not save the budget.");
      e.target.value = l.budget || "";
    }
  });

  document.querySelectorAll("[data-delnote]").forEach((b) =>
    b.addEventListener("click", async () => {
      if (!confirm("Delete this note?")) return;
      try {
        await api(`lead_notes?id=eq.${b.dataset.delnote}`, { method: "DELETE" });
        openLead(l.id);
      } catch {
        alert("Could not delete that note.");
      }
    })
  );

  // One press records that somebody made contact. Typing a note is thirty
  // seconds and so it does not happen, and then nothing knows the lead was
  // touched and the quiet counter lies.
  document.querySelectorAll("[data-dupe]").forEach((b) =>
    b.addEventListener("click", () => openLead(b.dataset.dupe))
  );

  document.querySelectorAll("[data-log]").forEach((b) =>
    b.addEventListener("click", async () => {
      const what = b.dataset.log;
      b.disabled = true;
      try {
        await api("lead_notes", {
          method: "POST",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ lead_id: l.id, body: what, author: session.user.id }),
        });
        // Moving off New the first time somebody makes contact saves a step
        // that is otherwise forgotten, and keeps the stage counts honest.
        if (l.stage === "new" && what !== "No answer") {
          await api(`leads?id=eq.${l.id}`, {
            method: "PATCH",
            body: JSON.stringify({ stage: "contacted" }),
          });
          l.stage = "contacted";
          const inList = leads.find((x) => x.id === l.id);
          if (inList) inList.stage = "contacted";
        }
        await loadActivity();
        openLead(l.id);
        render();
      } catch (err) {
        b.disabled = false;
        alert("Could not log that: " + String(err.message || err));
      }
    })
  );

  $("n-add").addEventListener("click", async () => {
    const body = $("n-body").value.trim();
    if (!body) return;
    await api("lead_notes", {
      method: "POST",
      body: JSON.stringify({ lead_id: l.id, body, author: session.user.id }),
    });
    await loadActivity();
    openLead(l.id);
    render();
  });

  $("r-add").addEventListener("click", async () => {
    const note = $("r-note").value.trim();
    const date = $("r-date").value;
    if (!date) return;
    await api("lead_reminders", {
      method: "POST",
      body: JSON.stringify({
        lead_id: l.id,
        owner: session.user.id,
        due_at: new Date(date + "T09:00:00").toISOString(),
        note,
      }),
    });
    reminders = await api("lead_reminders?select=*&order=due_at.asc");
    openLead(l.id);
  });

  document.querySelectorAll("[data-reminder]").forEach((cb) =>
    cb.addEventListener("change", async () => {
      await api(`lead_reminders?id=eq.${cb.dataset.reminder}`, {
        method: "PATCH",
        body: JSON.stringify({ done: cb.checked }),
      });
      reminders = await api("lead_reminders?select=*&order=due_at.asc");
      openLead(l.id);
    })
  );

  $("d-delete").addEventListener("click", async () => {
    if (!confirm(`Permanently delete the enquiry from ${fullName(l)}?`)) return;
    await api(`leads?id=eq.${l.id}`, { method: "DELETE" });
    leads = leads.filter((x) => x.id !== l.id);
    showDrawer(false);
    render();
  });
}

function renderLeadPartners(l) {
  const mine = leadPartners.filter((lp) => lp.lead_id === l.id);
  const box = $("lead-partners");
  if (!box) return;

  box.innerHTML = mine.length
    ? mine
        .map((lp) => {
          const p = partners.find((x) => x.id === lp.partner_id);
          if (!p) return "";
          return `<div class="flex items-center justify-between gap-3 border-b border-brand-stone/40 pb-2">
            <div>
              <span class="text-sm">${esc(p.name)}</span>
              ${lp.role ? `<span class="text-[10px] uppercase tracking-[0.15em] text-gray-400 ml-2">${esc(lp.role)}</span>` : ""}
            </div>
            <button data-rmpartner="${p.id}" class="text-gray-300 hover:text-red-600 transition text-xs shrink-0">Remove</button>
          </div>`;
        })
        .join("")
    : `<p class="text-sm text-gray-400 font-light">None yet.</p>`;

  const taken = new Set(mine.map((lp) => lp.partner_id));
  $("lp-select").innerHTML =
    `<option value="">Choose an agency…</option>` +
    partners
      .filter((p) => !taken.has(p.id))
      .map((p) => `<option value="${p.id}">${esc(p.name)}</option>`)
      .join("");

  box.querySelectorAll("[data-rmpartner]").forEach((b) =>
    b.addEventListener("click", async () => {
      await api(`lead_partners?lead_id=eq.${l.id}&partner_id=eq.${b.dataset.rmpartner}`, {
        method: "DELETE",
      });
      leadPartners = leadPartners.filter(
        (lp) => !(lp.lead_id === l.id && lp.partner_id === b.dataset.rmpartner)
      );
      renderLeadPartners(l);
    })
  );
}

function showDrawer(open) {
  $("drawer").classList.toggle("translate-x-full", !open);
  $("drawer-bg").classList.toggle("hidden", !open);
  if (!open) {
    openLeadId = null;
    render();
  }
}

/* ------------------------------------------------------------------- boot */

// Names the failing step, so a broken startup says which call broke rather
// than just dropping back to the login form.
async function step(name, fn) {
  try {
    return await fn();
  } catch (err) {
    err.message = `${name}: ${err.message}`;
    throw err;
  }
}

async function start(s) {
  showLoading(true);
  try {
    await load(s);
  } finally {
    // A load that dies half way should look failed, not perpetually busy.
    showLoading(false);
  }
}

async function load(s) {
  persist(s);
  await ensureFresh();

  $("login").classList.add("hidden");
  $("login").classList.remove("flex");
  $("app").classList.remove("hidden");
  applyDensity();
  showLoading(true);
  renderWho(s.user);

  staff = await step("staff", () => api("staff?select=id,email,name"));
  // staffName() needs the staff list, so the disc only knows the real
  // initials on the second pass. The first pass runs anyway: the header
  // should not sit empty while the pipeline loads.
  renderWho(s.user);
  await hideNewsletterForSales();
  fillTaskSelects();
  $("filter-owner").insertAdjacentHTML(
    "beforeend",
    staff.map((x) => `<option value="${x.id}">${esc(x.name)}</option>`).join("")
  );

  leads = await step("leads", () => api("leads?select=*&order=created_at.desc"));
  reminders = await step("reminders", () =>
    api("lead_reminders?select=*&order=due_at.asc")
  );

  // Every lead's newest note, so the first paint knows what has been touched.
  // Without this the opening screen calls everything quiet and the first click
  // of any kind appears to clear the whole board.
  await loadActivity();

  // Partner data is secondary. If it fails, show the pipeline anyway rather
  // than throwing away a working session over the Partners tab.
  await loadTasks();

  try {
    subscribers = await api("subscribers?select=*&order=created_at.desc");
    subscribersError = null;
  } catch (err) {
    // An empty list and a failed query look identical on screen, which is how
    // signups can be quietly lost for weeks. Keep the reason and show it.
    console.error("crm: subscribers unavailable", err);
    subscribers = [];
    subscribersError = String(err.message || err);
  }

  try {
    partners = await api("partners?select=*&order=name.asc");
    partnerContacts = await api("partner_contacts?select=*");
    partnerStaff = await api("partner_staff?select=*").catch(() => []);
    leadPartners = await api("lead_partners?select=*");
  } catch (err) {
    console.error("crm: partner data unavailable", err);
    partners = [];
    partnerContacts = [];
    leadPartners = [];
    partnersError = err && err.message ? err.message : String(err);
  }

  await step("render", async () => setView(view));

  // Beat before reading, so the first paint includes you rather than showing
  // an empty header until the next tick.
  await beat();
  await loadPresence();

  startPolling();
}

/* --------------------------------------------------------------- live data */

// The board is something people leave open all day. Without this, a lead that
// arrives at 10:05 is invisible until someone thinks to reload.
let pollTimer = null;

async function refreshLeads() {
  if (!session || document.hidden) return;
  // Say you are here before asking who else is, so a room with one person in
  // it still shows that person.
  await beat();
  await loadPresence();
  try {
    const fresh = await api("leads?select=*&order=created_at.desc");
    const isNew = fresh.length !== leads.length;
    leads = fresh;
    render();
    if (isNew) flashNewCount(fresh.length);
  } catch (err) {
    // A failed poll is not worth interrupting anyone over; the next one
    // will either succeed or api() will have signed them out already.
    console.error("crm: refresh failed", err);
  }
}

function flashNewCount(total) {
  const el = $("count");
  if (!el) return;
  el.classList.add("text-brand-gold");
  setTimeout(() => el.classList.remove("text-brand-gold"), 2000);
  document.title = `(${total}) Leads | NQL Properties`;
}

function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(refreshLeads, 30000);
  // Coming back to the tab should feel immediate rather than waiting out
  // the rest of the interval.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refreshLeads();
  });
  window.addEventListener("focus", refreshLeads);
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
    }
  });

  $("signout").addEventListener("click", signOut);
  $("drawer-bg").addEventListener("click", () => showDrawer(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") showDrawer(false);
  });
  ["search", "filter-source", "filter-owner"].forEach((id) =>
    $(id).addEventListener("input", render)
  );
  $("export").addEventListener("click", exportCsv);
  $("density").addEventListener("click", toggleDensity);
  $("empty-add").addEventListener("click", openAddLead);
  $("view-list").addEventListener("click", () => setView("list"));
  $("nav-leads").addEventListener("click", () => setSection("leads"));
  $("nav-reports").addEventListener("click", () => setSection("reports"));
  $("nav-partners").addEventListener("click", () => setSection("partners"));
  $("nav-tasks").addEventListener("click", () => setSection("tasks"));
  $("nav-subscribers").addEventListener("click", () => setSection("subscribers"));

  $("t-form").addEventListener("submit", addTask);
  $("t-filter-owner").addEventListener("change", renderTasks);
  $("t-filter-status").addEventListener("change", renderTasks);

  $("add-lead").addEventListener("click", openAddLead);
  $("add-form").addEventListener("submit", saveNewLead);
  document.querySelectorAll("[data-add-close]").forEach((b) =>
    b.addEventListener("click", closeAddLead)
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("add-modal").classList.contains("hidden")) closeAddLead();
  });
  ["s-search", "s-status"].forEach((id) =>
    $(id).addEventListener("input", renderSubscribers)
  );
  $("s-export").addEventListener("click", exportSubscribers);
  $("p-add").addEventListener("click", addPartner);
  ["p-search", "p-status"].forEach((id) => $(id).addEventListener("input", renderPartners));
  $("view-board").addEventListener("click", () => setView("board"));
  $("followups").addEventListener("click", () => {
    dueOnly = !dueOnly;
    if (dueOnly) quietOnly = false;
    render();
  });

  $("quiet").addEventListener("click", () => {
    quietOnly = !quietOnly;
    if (quietOnly) dueOnly = false;
    render();
  });

  $("recover-form").addEventListener("submit", saveNewPassword);

  // A reset link takes precedence over any stored session: the person is here
  // precisely because they could not get in with what was stored.
  if (handleRecoveryLink()) return;

  const saved = localStorage.getItem(SESSION_KEY);
  if (saved) {
    // Show the login screen on failure, but leave the stored session alone:
    // api() already calls signOut() when the token is genuinely rejected, so
    // anything reaching here is a transient error worth surviving.
    start(JSON.parse(saved)).catch((err) => {
      console.error("crm: could not restore session", err);
      showLogin();
      // Say why, on screen. A silent bounce back to the login form is
      // indistinguishable from "the session did not save".
      $("login-error").textContent =
        "Session could not be restored: " + (err && err.message ? err.message : err);
      $("login-error").classList.remove("hidden");
    });
  } else {
    showLogin();
  }
});
