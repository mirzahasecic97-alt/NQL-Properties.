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

/* How much of the mandate a buyer actually gave us.

   Seven things are asked for, each worth a seventh, and the badge follows the
   count. Nobody has to maintain it: the score moves on its own as a lead is
   worked, so it is never stale. Somebody who answered everything is hot;
   somebody who left an email and nothing else is limited.

   Mirrors public.info_score() in db/lead-info-score.sql. Kept in both places
   because the drawer has to relabel a lead the instant a field is filled,
   before the row has been saved and read back. If one changes, change both. */
const MANDATE = [
  ["Name",        (l) => l.first_name || l.last_name],
  ["Email",       (l) => l.email],
  ["Phone",       (l) => l.phone],
  ["Country",     (l) => l.country],
  ["Budget",      (l) => l.budget || l.deal_value],
  ["Looking for", (l) => l.property_kinds || l.property_name || l.project_interest],
  ["Their words", (l) => l.message],
];

function mandateMissing(l) {
  return MANDATE.filter(([, has]) => {
    const v = has(l);
    return !(v !== null && v !== undefined && String(v).trim() !== "");
  }).map(([label]) => label);
}

function infoScore(l) {
  return Math.round((100 * (MANDATE.length - mandateMissing(l).length)) / MANDATE.length);
}

// A number typed in by hand wins. Left alone, the count decides.
function effectiveScore(l) {
  return l.match_score === null || l.match_score === undefined
    ? infoScore(l)
    : Number(l.match_score);
}

/* The thresholds are repeated from db/lead-match.sql on purpose, for the same
   reason. If one ever changes, change both. */
function matchBand(score) {
  if (score === null || score === undefined || score === "") return null;
  const n = Number(score);
  if (!isFinite(n)) return null;
  if (n >= 80) return "hot";
  if (n >= 50) return "warm";
  if (n >= 1) return "limited";
  return null;
}

// A lead nobody has assessed shows nothing at all. That is a different state
// from a thin one, which now says so, and the difference matters: an agency
// can act on "we looked and it is limited" but not on silence.
const HEAT = {
  hot:     ["Hot",     "heat-hot"],
  warm:    ["Warm",    "heat-warm"],
  limited: ["Limited", "heat-limited"],
};

/* Redraws the completeness block in place. Editing a field has to move the
   count, the chips and the badge at once, or the drawer contradicts itself
   until it is reopened. */
function refreshCompleteness(l) {
  const chips = $("d-mandate");
  if (!chips) return;
  chips.innerHTML = MANDATE.map(([label, has]) => {
    const v = has(l);
    const ok = v !== null && v !== undefined && String(v).trim() !== "";
    return `<span class="text-[9px] uppercase tracking-[0.12em] px-2 py-1 ${
      ok
        ? "bg-[#EDEAE3] text-[#5C5548]"
        : "bg-white border border-dashed border-brand-stone text-gray-300"
    }">${esc(label)}</span>`;
  }).join("");

  const out = $("d-match-out");
  if (out) out.textContent = `${MANDATE.length - mandateMissing(l).length} of ${MANDATE.length}`;
  const tag = $("d-match-tag");
  if (tag) tag.innerHTML = matchTag(l);
}

function matchTag(l, tone) {
  if (leadKind(l) !== "lead") return "";
  const score = effectiveScore(l);
  const h = HEAT[matchBand(score)];
  if (!h) return "";
  const size = tone === "small" ? " heat-sm" : "";
  const missing = mandateMissing(l);
  const why =
    l.match_score !== null && l.match_score !== undefined
      ? `Set by hand to ${score}%`
      : missing.length
      ? `${MANDATE.length - missing.length} of ${MANDATE.length} answered. Missing: ${missing.join(", ")}`
      : "Everything we asked for";
  return `<span class="${h[1]}${size}" title="${esc(why)}">${h[0]}</span>`;
}

/* Not everything that arrives is a lead.
 *
 * Somebody using the footer form is asking a question. Somebody asking for a
 * meeting is asking for a meeting. Neither has told us they want to buy a
 * house, and treating them as pipeline makes the pipeline lie: the counts are
 * wrong, the conversion rate is wrong, and half the board goes quiet because
 * nobody is chasing a man who wanted a brochure.
 *
 * Derived from the source rather than stored, so it can never disagree with
 * where the thing actually came from.
 */
const KINDS = {
  footer: "message",
  meeting: "meeting",
  newsletter: "newsletter",
  // An agency asking to see the system is not a buyer. It belongs in the CRM,
  // because somebody has to answer it, but not in the pipeline: it would
  // count as a lead, go quiet, and be chased for a house it does not want.
  agency: "agency",
};

function leadKind(l) {
  return KINDS[l.source] || "lead";
}

const KIND_LABEL = {
  lead: "Leads",
  message: "Messages",
  meeting: "Meeting requests",
  newsletter: "Newsletter",
  agency: "Agencies asking",
};

// Where a buyer is looking. This is what the partner board filters on, so a
// lead with no country here is invisible to every agency.
const MED_COUNTRIES = [
  "Italy", "Spain", "Portugal", "France", "Greece", "Cyprus",
  "Malta", "Croatia", "Montenegro", "Turkey", "Morocco",
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
  agency: "Agency wants a demo",
};

let session = null;
let leads = [];
let staff = [];
let reminders = [];
let openLeadId = null;
let dueOnly = false;
let quietOnly = false;
let lastTouch = new Map();
let noteText = new Map();
let view = localStorage.getItem('nql.crm.view') || 'list';
let partners = [];
let partnerContacts = [];
let partnerStaff = [];
let partnerCountries = [];
let leadPartners = [];
let section = 'leads';
let subscribers = [];
let tasks = [];
let myRole = "admin";

/* Which tabs each role gets.
 *
 * One list rather than a flag per tab. The flags were added one at a time as
 * each tab needed hiding, and every one of them had to be repeated inside
 * navClass, because rebuilding className wipes whatever was set elsewhere.
 * That is how the Newsletter tab ended up hidden from the owner.
 *
 * Sales sees the leads assigned to them and the agencies they look after.
 * Everything else on the header is somebody else's job.
 */
const TABS_BY_ROLE = {
  owner: ["leads", "tasks", "reports", "partners", "requests", "subscribers"],
  admin: ["leads", "tasks", "reports", "partners", "requests", "subscribers"],
  sales: ["leads", "partners"],
};

function canSee(name) {
  const allowed = TABS_BY_ROLE[myRole] || TABS_BY_ROLE.admin;
  return allowed.includes(name);
}

/* The two counts in the header are about the pipeline as a whole: how many
   reminders are due across everybody's leads, how many have gone quiet. A
   salesperson works their own list and those numbers are not theirs to
   answer, so they do not carry them. */
function seesPipelineAlerts() {
  return myRole !== "sales";
}
let tasksError = null;
let presence = [];
let presenceOff = false;
let requests = [];
let offers = [];
let requestsError = null;
let kindFilter = localStorage.getItem("nql.crm.kind") || "lead";
let isOwner = false;
let staffAdmin = [];
let agencyLogins = [];
let health = [];
let fixes = [];
let subscribersError = null;
let partnersError = null;

/* ---------------------------------------------------------------- helpers */

const $ = (id) => document.getElementById(id);

/* Something went wrong and somebody should know.
 *
 * Fifteen handlers in this file wrote to a console nobody opens, which is how
 * a table that did not exist went unnoticed for weeks while signups were
 * quietly lost. This puts the same message where it cannot be missed, and
 * keeps writing to the console for whoever does open it.
 *
 * Deliberately not a toast that fades: a fault that disappears on its own
 * teaches people to ignore faults.
 */
function trouble(what, err) {
  console.error("crm: " + what, err);
  const bar = document.getElementById("trouble");
  if (!bar) return;
  const detail = err ? String(err.message || err).slice(0, 200) : "";
  bar.innerHTML =
    `<span class="font-medium">${esc(what)}</span>` +
    (detail ? `<span class="text-red-900/70 ml-2">${esc(detail)}</span>` : "") +
    `<button id="trouble-close" class="ml-auto text-red-900/60 hover:text-red-900 transition" aria-label="Dismiss">&times;</button>`;
  bar.classList.remove("hidden");
  bar.classList.add("flex");
  const close = document.getElementById("trouble-close");
  if (close) close.addEventListener("click", () => {
    bar.classList.add("hidden");
    bar.classList.remove("flex");
  });
}

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
/* What counts as having made contact.
 *
 * WhatsApp is on this list because it is how most of these buyers are
 * actually reached: a Norwegian or Icelandic buyer looking at a house in
 * Umbria answers a message long before they answer a foreign number.
 *
 * "No answer" is on it too and is deliberately not contact: a lead nobody
 * has spoken to should not leave New because somebody rang once. */
const CONTACT_LOG = [
  "Called",
  "WhatsApp",
  "Emailed",
  "No answer",
  "Left voicemail",
];

const NOT_CONTACT = ["No answer"];

/* A number a person typed, as WhatsApp wants it: digits only, no plus, no
   spaces, no brackets. A Norwegian number written 0047 becomes 47, because
   the international prefix and the country code are not the same thing and
   wa.me only understands the second. */
function waNumber(phone) {
  if (!phone) return null;
  let n = String(phone).replace(/[^\d]/g, "");
  if (n.startsWith("00")) n = n.slice(2);
  return n.length >= 8 ? n : null;
}

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
  // Counted within the kind on screen. A tab reading 212 above a list of 34
  // is not a count of anything anyone asked for.
  const kind = $("filter-kind") ? $("filter-kind").value : "";
  const pool = kind ? leads.filter((l) => leadKind(l) === kind) : leads;
  const counts = {};
  pool.forEach((l) => (counts[l.stage] = (counts[l.stage] || 0) + 1));

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
    tab("", "All", pool.length) +
    STAGES.map((s) => tab(s.key, s.label, counts[s.key] || 0)).join("");

  document.querySelectorAll(".stage-tab").forEach((b) =>
    b.addEventListener("click", () => {
      $("stage-tabs").dataset.active = b.dataset.stage;
      render();
    })
  );
}

/* A reminder that has already been acted on should not still be nagging.
 *
 * "Remind me on Tuesday" plus a call logged on Tuesday is a reminder that did
 * its job. Whether somebody remembered to tick the box afterwards says
 * nothing about the lead, and a badge that counts unticked boxes rather than
 * unanswered leads is a badge people learn to ignore.
 *
 * So contact logged after it fell due takes it out of the count. It stays on
 * the lead, unticked, because we cannot know it was the same thing that was
 * meant, and somebody may still want to tick it themselves.
 */
function actedOnSince(reminder) {
  const touched = lastTouch.get(reminder.lead_id);
  if (!touched) return false;
  return new Date(touched) > new Date(reminder.due_at);
}

function dueReminders() {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return reminders.filter(
    (r) => !r.done && new Date(r.due_at) <= end && !actedOnSince(r)
  );
}

function dueLeadIds() {
  return new Set(dueReminders().map((r) => r.lead_id));
}

/* Why each reminder is still on the count.
 *
 * The rule is simple enough to state and was still impossible to check from
 * the outside: a reminder counts until somebody logs contact on that lead
 * AFTER it falls due. So this says, per reminder, when it fell due and when
 * the lead was last touched, and names the reason. */
function renderDuePanel() {
  const panel = $("due-panel");
  if (!panel) return;

  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const open = reminders.filter((r) => !r.done && new Date(r.due_at) <= end);

  $("due-list").innerHTML = open.length
    ? open
        .map((r) => {
          const l = leads.find((x) => x.id === r.lead_id);
          const touched = lastTouch.get(r.lead_id);
          const cleared = actedOnSince(r);
          const why = cleared
            ? "Contact logged after it fell due, so it is not counted."
            : !touched
            ? "No note on this lead at all, so nothing has been logged against it."
            : "The last note is older than the due date, so nothing has been logged since.";
          return `
            <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-brand-stone/40 last:border-0 pb-2 last:pb-0">
              <button data-due-open="${r.lead_id}" class="text-sm hover:text-brand-gold transition text-left">
                <span class="text-xs text-gray-400 tabular-nums">${esc(l ? leadNo(l) : "\u2014")}</span>
                ${esc(l ? fullName(l) : "Lead not found")}
              </button>
              <span class="text-sm text-gray-600 font-light">${esc(r.note || "Follow up")}</span>
              <span class="text-[10px] uppercase tracking-[0.15em] text-gray-400">
                due ${esc(when(r.due_at))}
              </span>
              <span class="text-[10px] uppercase tracking-[0.15em] text-gray-400">
                last note ${touched ? esc(when(touched)) : "never"}
              </span>
              <span class="text-[11px] font-light ml-auto ${cleared ? "text-green-700" : "text-gray-500"}">${esc(why)}</span>
              ${
                cleared
                  ? ""
                  : `<button data-due-tick="${r.id}" class="text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-brand-ink transition">Mark done</button>`
              }
            </div>`;
        })
        .join("")
    : `<p class="text-sm text-gray-400 font-light">Nothing due.</p>`;

  $("due-list").querySelectorAll("[data-due-open]").forEach((b) =>
    b.addEventListener("click", () => openLead(b.dataset.dueOpen))
  );
  $("due-list").querySelectorAll("[data-due-tick]").forEach((b) =>
    b.addEventListener("click", async () => {
      b.disabled = true;
      try {
        await api(`lead_reminders?id=eq.${b.dataset.dueTick}`, {
          method: "PATCH",
          body: JSON.stringify({ done: true }),
        });
        await loadReminders();
        render();
        renderDuePanel();
      } catch (err) {
        b.disabled = false;
        trouble("Could not tick that reminder.", err);
      }
    })
  );
}

function renderFollowUps() {
  const btn = $("followups");
  if (!seesPipelineAlerts()) {
    btn.classList.add("hidden");
    btn.classList.remove("flex");
    const panel = $("due-panel");
    if (panel) panel.classList.add("hidden");
    return;
  }
  const n = dueLeadIds().size;
  btn.classList.toggle("hidden", n === 0);
  btn.classList.toggle("flex", n > 0);
  $("followups-count").textContent =
    n === 1 ? "1 reminder due" : `${n} reminders due`;
  btn.title =
    "Reminders that have fallen due and have had no contact logged since. " +
    "Ringing a lead takes it off this list whether or not anyone ticks the box.";
  btn.classList.toggle("bg-brand-gold/20", dueOnly);
}

function visibleLeads() {
  const q = $("search").value.trim().toLowerCase();
  const src = $("filter-source").value;
  const owner = $("filter-owner").value;
  const stage = $("stage-tabs").dataset.active || "";
  const kind = $("filter-kind").value;
  const due = dueOnly ? dueLeadIds() : null;
  const quiet = quietOnly ? quietLeadIds() : null;

  return leads.filter((l) => {
    if (kind && leadKind(l) !== kind) return false;
    if (due && !due.has(l.id)) return false;
    if (quiet && !quiet.has(l.id)) return false;
    if (stage && l.stage !== stage) return false;
    if (src && l.source !== src) return false;
    if (owner === "__none" && l.assigned_to) return false;
    if (owner && owner !== "__none" && l.assigned_to !== owner) return false;
    if (!q) return true;
    return [
      l.lead_no, l.first_name, l.last_name, l.email, l.phone,
      l.message, l.property_name, l.project_interest,
      l.country, l.location_detail, l.property_kinds, l.must_haves,
      noteText.get(l.id),
    ]
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
        <td class="col-source py-4 px-5 text-xs text-gray-500">${esc(SOURCE_LABEL[l.source] || l.source)}</td>
        <td class="py-4 px-5 text-xs text-gray-500 max-w-[220px] truncate">${esc(interest)}</td>
        <td class="py-4 px-3">
          <!-- Set here rather than in the drawer. Two hundred leads have no
               country, and a country is what decides whether any agency ever
               sees one, so the pass has to be quick. -->
          <select data-country="${l.id}"
            class="row-country w-full bg-transparent text-xs px-1 py-1 border ${
              l.country ? "border-transparent text-gray-600" : "border-dashed border-brand-gold text-brand-gold"
            } hover:border-brand-stone focus:outline-none focus:border-brand-gold transition">
            <option value="">Set country</option>
            ${MED_COUNTRIES.map(
              (c) => `<option value="${esc(c)}" ${c === l.country ? "selected" : ""}>${esc(c)}</option>`
            ).join("")}
          </select>
        </td>
        <td class="py-4 px-5">
          <span class="stage-${l.stage} inline-block text-[9px] font-bold uppercase tracking-[0.18em] px-3 py-1.5">${esc(stage.label)}</span>
          ${matchTag(l, "small")}
        </td>
        <td class="py-4 px-5 text-xs">${
          l.assigned_to
            ? ownerTag(l.assigned_to, "avatar")
            : `<span class="text-gray-300">Unassigned</span>`
        }</td>
        <td class="col-received py-4 px-5 text-xs text-gray-400 whitespace-nowrap">
          ${esc(when(l.created_at))}
          ${isQuiet(l) ? `<div class="mt-1 text-[10px] uppercase tracking-[0.15em]">${quietFlag(l)}</div>` : ""}
        </td>
      </tr>`;
    })
    .join("");

  document.querySelectorAll(".lead-row").forEach((r) =>
    r.addEventListener("click", () => openLead(r.dataset.id))
  );

  // The select sits inside a row that opens the drawer, so its own events
  // must not reach the row or every change would open a lead as well.
  document.querySelectorAll(".row-country").forEach((sel) => {
    sel.addEventListener("click", (e) => e.stopPropagation());
    sel.addEventListener("change", async (e) => {
      e.stopPropagation();
      const id = sel.dataset.country;
      const value = sel.value || null;
      const lead = leads.find((x) => x.id === id);
      const before = lead ? lead.country : null;
      sel.disabled = true;
      try {
        await api(`leads?id=eq.${id}`, {
          method: "PATCH",
          body: JSON.stringify({ country: value }),
        });
        if (lead) lead.country = value;
        render();
      } catch (err) {
        sel.value = before || "";
        sel.disabled = false;
        trouble("Could not set the country on that lead.", err);
      }
    });
  });
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
  // A tab can be hidden and still reached, by a stale click handler or by a
  // button elsewhere that jumps to it. The list decides both.
  if (!canSee(next) && next !== "control") next = "leads";
  section = next;
  const SECTIONS = ["leads", "tasks", "reports", "partners", "requests", "control", "subscribers"];
  const navClass = (name) =>
    "text-[10px] uppercase tracking-luxe pb-1 border-b-2 " +
    (section === name
      ? "text-white font-bold border-brand-gold"
      : "text-white/40 hover:text-white transition border-transparent") +
    // Rebuilding className wipes anything set elsewhere, so whether the tab
    // may be seen at all is decided here as well.
    (canSee(name) ? "" : " hidden");

  SECTIONS.forEach((name) => {
    $("section-" + name).classList.toggle("hidden", name !== next);
    // Control sits on the right of the bar with the alerts rather than in the
    // row of tabs, so it is styled on its own terms.
    $("nav-" + name).className =
      name === "control" ? controlNavClass() : navClass(name);
  });

  // The tab title says where you are, which matters when the CRM is one of
  // fifteen tabs somebody left open.
  const TITLES = {
    leads: "Leads",
    tasks: "Tasks",
    reports: "Reports",
    partners: "Agencies",
    requests: "Requests",
    control: "Control",
    subscribers: "Newsletter",
  };
  document.title = `${TITLES[next] || "Leads"} | NQL Properties`;

  if (next === "leads") render();
  else if (next === "tasks") renderTasks();
  else if (next === "reports") renderReports();
  else if (next === "partners") {
    // Agencies, their people and the links to leads are read once at sign in
    // and never again, so anything written to the database directly, or by a
    // colleague, was invisible until somebody reloaded the whole app. Read
    // them when the tab is opened rather than on the poll: this is four
    // queries and nobody needs them every thirty seconds.
    renderPartners();
    loadPartnerData().then(renderPartners);
  }
  else if (next === "requests") renderRequests();
  else if (next === "control") renderControl();
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
    // Searchable by number too, because "who was it that rang from 0575"
    // is a real question and the number is the only part of it anyone has.
    const numbers = partnerContacts
      .filter((c) => c.partner_id === p.id)
      .map((c) => c.phone)
      .concat(p.phone)
      .filter(Boolean)
      .join(" ");
    return [p.name, p.country, p.city, p.notes, p.email, p.phone, numbers]
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
      // The card carries links now, and an anchor inside a button is invalid
      // markup that browsers resolve however they like. A div with a handler
      // behaves; the links stop the click from reaching it.
      const ring = primary && primary.phone ? primary.phone : p.phone;
      return `
      <div data-partner="${p.id}" role="button" tabindex="0"
        class="p-card text-left bg-white border border-brand-stone/60 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer">
        <div class="flex items-start justify-between gap-3 mb-3">
          <h3 class="font-serif text-lg leading-tight">${esc(p.name)}</h3>
          <span class="${p.agreement_signed ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#FEF3C7] text-[#92400E]"} shrink-0 text-[9px] font-bold uppercase tracking-[0.15em] px-2.5 py-1">${p.agreement_signed ? "Signed" : "Unsigned"}</span>
        </div>
        <div class="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-4">
          ${esc([p.city, p.country].filter(Boolean).join(", ") || "—")}
        </div>
        ${
          primary
            ? `<p class="text-sm text-gray-600 font-light">${esc(primary.name)}${primary.role ? ` &middot; ${esc(primary.role)}` : ""}</p>`
            : `<p class="text-sm text-gray-300 font-light">No contact yet</p>`
        }

        ${
          ring
            ? `<p class="mt-1 mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
                 <span class="text-sm text-gray-600 font-light tabular-nums">${esc(ring)}</span>
                 <a href="tel:${esc(ring.replace(/\s/g, ""))}" data-stop
                    class="text-[10px] uppercase tracking-[0.15em] text-gray-400 hover:text-brand-gold transition">Ring</a>
                 ${
                   waNumber(ring)
                     ? `<a href="https://wa.me/${waNumber(ring)}" target="_blank" rel="noopener noreferrer" data-stop
                          class="text-[10px] uppercase tracking-[0.15em] text-[#128C4A] hover:text-[#25D366] transition inline-flex items-center gap-1">
                          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2zm5.8 14.13c-.24.68-1.4 1.3-1.94 1.38-.5.07-1.12.1-1.81-.11-.42-.13-.95-.31-1.64-.6-2.88-1.25-4.76-4.15-4.9-4.34-.14-.19-1.17-1.56-1.17-2.97s.74-2.11 1-2.4c.26-.29.57-.36.76-.36l.55.01c.17.01.41-.07.64.49.24.57.81 1.98.88 2.12.07.15.12.32.02.51-.1.19-.15.31-.29.48-.15.17-.31.37-.44.5-.15.14-.3.3-.13.59.17.29.75 1.24 1.62 2.01 1.11.99 2.05 1.3 2.34 1.44.29.15.46.12.63-.07.17-.19.72-.85.92-1.14.19-.29.39-.24.65-.14.26.09 1.67.79 1.96.93.29.15.48.22.55.34.07.12.07.7-.17 1.38z"/>
                          </svg>WhatsApp</a>`
                     : ""
                 }
               </p>`
            : `<p class="mt-1 mb-4 text-sm text-gray-300 font-light">No number</p>`
        }
        <div class="border-t border-brand-stone/40 pt-3 flex gap-5 text-[10px] uppercase tracking-[0.15em] text-gray-400">
          <span><span class="text-brand-ink font-bold">${s.total}</span> sent</span>
          <span><span class="text-brand-ink font-bold">${s.open}</span> open</span>
          <span><span class="text-brand-ink font-bold">${s.won}</span> won</span>
        </div>
      </div>`;
    })
    .join("");

  document.querySelectorAll(".p-card").forEach((c) => {
    c.addEventListener("click", () => openPartner(c.dataset.partner));
    // Enter and space, since it is a div pretending to be a button.
    c.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openPartner(c.dataset.partner);
      }
    });
  });

  // Ringing somebody should not also open their drawer.
  document.querySelectorAll(".p-card [data-stop]").forEach((a) =>
    a.addEventListener("click", (e) => e.stopPropagation())
  );
}

function countriesFor(id) {
  return partnerCountries
    .filter((r) => r.partner_id === id)
    .map((r) => r.country);
}

/* How many buyers an agency actually has to look at.

   The control panel could say ITALY in black type while the agency's board sat
   empty, and there was no way to tell from this screen whether that was a
   broken setting, a broken view, or simply no lead filed under Italy. So the
   answer is on the screen now, counted from the same four rules the board
   uses: buyers only, nothing won or lost, and the country has to match.

   Counted here in the browser from leads already loaded, so it costs nothing
   and cannot disagree with what the CRM is showing above it. */
function isBoardBuyer(l) {
  return leadKind(l) === "lead" && l.stage !== "won" && l.stage !== "lost";
}

function boardCount(country) {
  return leads.filter((l) => isBoardBuyer(l) && l.country === country).length;
}

function agencyBoardCount(p) {
  /* Not "is it false" but "is it true". Postgres treats null as not true, so
     a null switch closes the board while this counted it open, and the control
     panel promised twenty leads that the portal was never going to show. */
  if (p.sees_leads !== true) return 0;
  const on = countriesFor(p.id);
  const pool = leads.filter(isBoardBuyer);
  if (!on.length) return pool.length;
  // A buyer nobody has filed under a country reaches every agency. The board
  // works the same way, and when these two disagreed the portal looked broken.
  return pool.filter((l) => !l.country || on.includes(l.country)).length;
}

// Buyers nobody can be shown, because they are filed under no country at all.
function uncountriedBuyers() {
  return leads.filter((l) => isBoardBuyer(l) && !l.country).length;
}

/* Every gate an agency's board passes through, counted here rather than
   guessed at from an empty screen. The portal showing nothing has meant, at
   various times, a missing grant, a null switch, a country nobody is filed
   under, and a view that was not there at all, and none of those look any
   different from the outside. This prints all of them at once. */
function boardAudit() {
  const bySource = {};
  leads.forEach((l) => { bySource[l.source] = (bySource[l.source] || 0) + 1; });

  const buyers = leads.filter(isBoardBuyer);
  const pad = (label) => (label + " ").padEnd(34, ".");
  const out = [];

  out.push(pad("leads in the CRM") + " " + leads.length);
  Object.keys(bySource).sort().forEach((k) =>
    out.push(pad("   source " + k) + " " + bySource[k]));
  out.push(pad("won or lost") + " " +
    leads.filter((l) => l.stage === "won" || l.stage === "lost").length);
  out.push(pad("BUYERS ELIGIBLE FOR ANY BOARD") + " " + buyers.length);
  out.push(pad("   of those, no country set") + " " +
    buyers.filter((l) => !l.country).length);

  const byCountry = {};
  buyers.forEach((l) => {
    if (l.country) byCountry[l.country] = (byCountry[l.country] || 0) + 1;
  });
  Object.keys(byCountry).sort().forEach((c) =>
    out.push(pad("   " + c) + " " + byCountry[c]));

  partners
    .filter((p) => p.status !== "former")
    .forEach((p) => {
      const on = countriesFor(p.id);
      out.push("");
      out.push(p.name);
      out.push(pad("   sees_leads") + " " + JSON.stringify(p.sees_leads));
      out.push(pad("   status") + " " + JSON.stringify(p.status));
      out.push(pad("   countries") + " " +
        (on.length ? on.join(", ") : "none set, so every country"));
      out.push(pad("   logins") + " " +
        partnerStaff.filter((x) => x.partner_id === p.id).length);
      out.push(pad("   THEIR BOARD SHOULD SHOW") + " " + agencyBoardCount(p));
    });

  return out.join("\n");
}

/* Adding and removing a country for an agency. Both the agency card and the
   control panel call these, so the two cannot drift apart.

   The tier stays in the database and defaults to shared, which is what this
   business wants: everybody sees the brief and competes on the house they put
   forward. Exclusivity is a rare arrangement and is set on the agency's own
   card, not here, so the ordinary case stays one click. */
function tierFor(partnerId, country) {
  const row = partnerCountries.find(
    (r) => r.partner_id === partnerId && r.country === country
  );
  return row ? row.tier || "shared" : null;
}

async function addAgencyCountry(partnerId, country) {
  await api("partner_countries", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      partner_id: partnerId,
      country,
      tier: "shared",
      added_by: session.user.id,
    }),
  });
  partnerCountries = await api("partner_countries?select=*");
}

async function setSeesLeads(partnerId, on) {
  await api(`partners?id=eq.${partnerId}`, {
    method: "PATCH",
    body: JSON.stringify({ sees_leads: on }),
  });
  const p = partners.find((x) => x.id === partnerId);
  if (p) p.sees_leads = on;
}

async function removeAgencyCountry(partnerId, country) {
  await api(
    `partner_countries?partner_id=eq.${partnerId}&country=eq.${encodeURIComponent(country)}`,
    { method: "DELETE" }
  );
  partnerCountries = await api("partner_countries?select=*");
}

function countryChips(id) {
  const on = countriesFor(id).sort();
  const spare = MED_COUNTRIES.filter((c) => !on.includes(c));

  return (
    (on.length
      ? on
          .map((c) => {
            const exclusive = tierFor(id, c) === "exclusive";
            return `<button data-country="${esc(c)}"
              title="${exclusive ? "Only they see " + esc(c) + ". Click to remove." : "Click to remove"}"
              class="group inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] pl-2.5 pr-2 py-1.5 transition ${
                exclusive
                  ? "bg-brand-gold text-brand-ink hover:bg-red-700 hover:text-white"
                  : "bg-brand-ink text-white hover:bg-red-700"
              }">${esc(c)}${exclusive ? " \u2605" : ""}<span class="opacity-50 group-hover:opacity-100">&times;</span></button>`;
          })
          .join("")
      : `<span class="text-[11px] uppercase tracking-[0.15em] text-brand-gold">Every country</span>`) +
    (spare.length
      ? `<select id="pc-add"
           class="bg-white border border-brand-stone/60 px-3 py-1.5 text-xs text-gray-500 focus:outline-none focus:border-brand-gold">
           <option value="">Add a country</option>
           ${spare.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join("")}
         </select>`
      : "")
  );
}

function openPartner(id, refreshed) {
  const p = partners.find((x) => x.id === id);
  if (!p) return;

  // Draw immediately from what is in hand, then read again and redraw. The
  // alternative is a drawer that opens a beat late every time.
  if (!refreshed) loadPartnerData().then(() => openPartner(id, true));
  const contacts = partnerContacts.filter((c) => c.partner_id === id);
  const mine = leadPartners.filter((lp) => lp.partner_id === id);
  const s = partnerStats(id);

  /* Everything about an agency can be corrected here, the same way everything
     about a lead can. Half of these were read only, so the only way to fix a
     wrong phone number or a misspelt name was the Supabase table editor, and
     the note on this very agency says the name is spelt wrong. */
  const pField = (column, label, type, placeholder) =>
    `<div class="border-b border-brand-stone/40 py-3 flex justify-between items-center gap-4">
       <label for="p-f-${column}" class="text-[10px] uppercase tracking-[0.2em] text-gray-400 shrink-0">${esc(label)}</label>
       <input id="p-f-${column}" data-pcol="${column}" type="${type || "text"}"
         value="${esc(p[column] ?? "")}" placeholder="${esc(placeholder || "Not stated")}"
         class="partner-field text-sm text-right bg-transparent flex-1 min-w-0 py-0.5 border-b border-transparent hover:border-brand-stone/60 focus:border-brand-gold focus:outline-none transition placeholder-gray-300" />
     </div>`;

  // A link beside the box, so an editable field is still one you can act on.
  const pLink = (href, label) =>
    href
      ? `<a href="${href}" target="_blank" rel="noopener noreferrer"
           class="text-[10px] uppercase tracking-[0.18em] text-gray-400 hover:text-brand-gold transition shrink-0 ml-3">${label}</a>`
      : "";

  $("drawer-body").innerHTML = `
    <div class="flex items-start justify-between gap-4 mb-8">
      <div class="min-w-0 flex-1">
        <input id="p-f-name" data-pcol="name" value="${esc(p.name)}"
          class="partner-field font-serif text-2xl leading-tight w-full bg-transparent border-b border-transparent hover:border-brand-stone/60 focus:border-brand-gold focus:outline-none transition" />
        <p class="text-[10px] uppercase tracking-[0.2em] text-gray-400 mt-2">
          ${esc([p.city, p.country].filter(Boolean).join(", ") || "Where they are")}
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
      <div class="border-b border-brand-stone/40 py-3 flex justify-between items-center gap-4">
        <label for="p-f-country" class="text-[10px] uppercase tracking-[0.2em] text-gray-400 shrink-0">Country</label>
        <select id="p-f-country" data-pcol="country"
          class="partner-field text-sm text-right bg-transparent py-0.5 border-b border-transparent hover:border-brand-stone/60 focus:border-brand-gold focus:outline-none transition">
          <option value="">Not stated</option>
          ${MED_COUNTRIES.map((c) => `<option value="${esc(c)}" ${c === p.country ? "selected" : ""}>${esc(c)}</option>`).join("")}
        </select>
      </div>
      ${pField("city", "Town")}
      <div class="border-b border-brand-stone/40 py-3 flex justify-between items-center gap-4">
        <label for="p-f-website" class="text-[10px] uppercase tracking-[0.2em] text-gray-400 shrink-0">Website</label>
        <input id="p-f-website" data-pcol="website" value="${esc(p.website ?? "")}" placeholder="example.com"
          class="partner-field text-sm text-right bg-transparent flex-1 min-w-0 py-0.5 border-b border-transparent hover:border-brand-stone/60 focus:border-brand-gold focus:outline-none transition placeholder-gray-300" />
        ${pLink(p.website ? "https://" + p.website.replace(/^https?:\/\//, "") : null, "Open")}
      </div>
      <div class="border-b border-brand-stone/40 py-3 flex justify-between items-center gap-4">
        <label for="p-f-email" class="text-[10px] uppercase tracking-[0.2em] text-gray-400 shrink-0">Email</label>
        <input id="p-f-email" data-pcol="email" type="email" value="${esc(p.email ?? "")}" placeholder="Not stated"
          class="partner-field text-sm text-right bg-transparent flex-1 min-w-0 py-0.5 border-b border-transparent hover:border-brand-stone/60 focus:border-brand-gold focus:outline-none transition placeholder-gray-300" />
        ${pLink(p.email ? "mailto:" + p.email : null, "Write")}
      </div>
      <div class="border-b border-brand-stone/40 py-3 flex justify-between items-center gap-4">
        <label for="p-f-phone" class="text-[10px] uppercase tracking-[0.2em] text-gray-400 shrink-0">Phone</label>
        <input id="p-f-phone" data-pcol="phone" type="tel" value="${esc(p.phone ?? "")}" placeholder="Not stated"
          class="partner-field text-sm text-right bg-transparent flex-1 min-w-0 py-0.5 border-b border-transparent hover:border-brand-stone/60 focus:border-brand-gold focus:outline-none transition placeholder-gray-300" />
        ${pLink(p.phone ? "tel:" + p.phone.replace(/\s/g, "") : null, "Ring")}
        ${waNumber(p.phone) ? pLink("https://wa.me/" + waNumber(p.phone), "WhatsApp") : ""}
      </div>
      ${pField("commission", "Commission", "text", "How the deal works, in words")}
    </div>

    <div class="mb-8">
      <div class="flex items-baseline justify-between mb-2">
        <h3 class="text-[10px] uppercase tracking-[0.2em] text-gray-400">Notes</h3>
        <span id="p-notes-state" class="text-[10px] uppercase tracking-[0.2em] text-gray-300"></span>
      </div>
      <textarea id="p-f-notes" data-pcol="notes" rows="4"
        placeholder="Anything worth knowing. Who to ask for, what they are good at, what went wrong last time."
        class="partner-field w-full bg-white border border-brand-stone/60 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-gold transition placeholder-gray-300">${esc(p.notes ?? "")}</textarea>
    </div>

    <div class="mb-8">
      <h3 class="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3">Contacts</h3>
      <div class="space-y-3 mb-4">
        ${
          contacts.length
            ? contacts.map((c) => `
              <div class="border-l-2 border-brand-stone pl-4 flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-sm">${esc(c.name)}${c.is_primary ? ` <span class="text-[9px] uppercase tracking-[0.15em] text-brand-gold ml-1">Primary</span>` : ""}</p>
                  <p class="text-xs text-gray-500 font-light">${esc([c.role, c.email].filter(Boolean).join(" \u00b7 "))}</p>
                  ${
                    c.phone
                      ? `<p class="text-xs text-gray-500 font-light mt-1 flex flex-wrap items-center gap-x-3">
                           <span class="tabular-nums">${esc(c.phone)}</span>
                           <a href="tel:${esc(c.phone.replace(/\s/g, ""))}"
                              class="text-[10px] uppercase tracking-[0.15em] text-gray-400 hover:text-brand-gold transition">Ring</a>
                           ${
                             waNumber(c.phone)
                               ? `<a href="https://wa.me/${waNumber(c.phone)}" target="_blank" rel="noopener noreferrer"
                                    class="text-[10px] uppercase tracking-[0.15em] text-[#128C4A] hover:text-[#25D366] transition inline-flex items-center gap-1">
                                    <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2zm5.8 14.13c-.24.68-1.4 1.3-1.94 1.38-.5.07-1.12.1-1.81-.11-.42-.13-.95-.31-1.64-.6-2.88-1.25-4.76-4.15-4.9-4.34-.14-.19-1.17-1.56-1.17-2.97s.74-2.11 1-2.4c.26-.29.57-.36.76-.36l.55.01c.17.01.41-.07.64.49.24.57.81 1.98.88 2.12.07.15.12.32.02.51-.1.19-.15.31-.29.48-.15.17-.31.37-.44.5-.15.14-.3.3-.13.59.17.29.75 1.24 1.62 2.01 1.11.99 2.05 1.3 2.34 1.44.29.15.46.12.63-.07.17-.19.72-.85.92-1.14.19-.29.39-.24.65-.14.26.09 1.67.79 1.96.93.29.15.48.22.55.34.07.12.07.7-.17 1.38z"/>
                                    </svg>WhatsApp</a>`
                               : ""
                           }
                         </p>`
                      : ""
                  }
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

    <!-- What this agency is allowed to see. Every country is a button: on
         means they see enquiries for it, off means they never do. -->
    <div class="mb-8">
      <h3 class="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1">Countries they work in</h3>
      <p class="text-xs text-gray-400 font-light mb-3">${
        countriesFor(id).length
          ? "Their board shows buyers looking in these countries only. Click one to remove it."
          : "None chosen, so their board shows every country."
      }</p>
      <div id="pc-list" class="flex flex-wrap gap-1.5">${countryChips(id)}</div>
    </div>

    <div class="mb-8">
      <h3 class="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1">Leads sent</h3>
      ${(() => {
        const told = mine.filter((x) => x.outcome).length;
        const moved = mine.filter((x) =>
          ["viewing", "offer", "sold"].includes(x.outcome)
        ).length;
        if (!mine.length) return "";
        // How much of what we sent they have said anything about. An agency
        // that never reports back is one we know nothing about, whatever our
        // own pipeline says.
        return `<p class="text-xs font-light mb-3 ${
          told === 0 ? "text-red-700" : "text-gray-400"
        }">
          ${told} of ${mine.length} answered${moved ? `, ${moved} went somewhere` : ""}${
          told === 0 ? ". They have never told us how one went." : "."
        }
        </p>`;
      })()}
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
                  <span class="flex items-center gap-2 shrink-0">
                    ${
                      lp.outcome
                        ? `<span class="text-[9px] uppercase tracking-[0.12em] text-brand-gold">${esc(
                            OUTCOME_LABEL[lp.outcome] || lp.outcome
                          )}</span>`
                        : ""
                    }
                    <span class="stage-${l.stage} text-[9px] font-bold uppercase tracking-[0.15em] px-2.5 py-1">${esc(st.label)}</span>
                  </span>
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

  /* One handler for every field on the agency, the same shape as the lead
     drawer. Each input carries the column it writes, so adding a field needs
     nothing here. Saved on change, and put back on failure so the screen
     never shows something the database does not have. */
  $("drawer-body").querySelectorAll(".partner-field").forEach((input) =>
    input.addEventListener("change", async (e) => {
      const col = e.target.dataset.pcol;
      const value = e.target.value.trim() || null;
      const before = p[col];

      if (col === "name" && !value) {
        e.target.value = before || "";
        return;
      }

      const state = $("p-notes-state");
      if (col === "notes" && state) state.textContent = "Saving";
      try {
        await api(`partners?id=eq.${p.id}`, {
          method: "PATCH",
          body: JSON.stringify({ [col]: value }),
        });
        p[col] = value;
        if (col === "notes" && state) {
          state.textContent = "Saved";
          setTimeout(() => (state.textContent = ""), 1500);
        }
        // The card behind the drawer shows the name, the town and the status,
        // so it has to be redrawn or it contradicts what is in front of it.
        renderPartners();
      } catch (err) {
        e.target.value = before ?? "";
        if (col === "notes" && state) state.textContent = "";
        trouble(`Could not save the agency's ${col.replace("_", " ")}.`, err);
      }
    })
  );

  $("pc-list").querySelectorAll("[data-country]").forEach((b) =>
    b.addEventListener("click", async () => {
      b.disabled = true;
      try {
        await removeAgencyCountry(id, b.dataset.country);
        openPartner(id, true);
      } catch (err) {
        b.disabled = false;
        trouble("Could not change what this agency sees.", err);
      }
    })
  );

  const pcAdd = $("pc-add");
  if (pcAdd) {
    pcAdd.addEventListener("change", async () => {
      if (!pcAdd.value) return;
      pcAdd.disabled = true;
      try {
        await addAgencyCountry(id, pcAdd.value);
        openPartner(id, true);
      } catch (err) {
        pcAdd.disabled = false;
        trouble("Could not add that country.", err);
      }
    });
  }

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

/* ------------------------------------------------------------ report a fix */

/* Anybody using the CRM or the portal can say what is wrong with it, and the
   owner reads all of them in one place.
   
   The author's name and address are copied onto the row rather than joined
   later: an account can be removed, and a report that loses its author becomes
   an anonymous complaint nobody can follow up. */

function showFix(open) {
  $("fix-bg").classList.toggle("hidden", !open);
  $("fix-modal").classList.toggle("hidden", !open);
  $("fix-modal").classList.toggle("flex", open);
  $("fix-error").classList.add("hidden");
  if (open) {
    $("fix-body").value = "";
    $("fix-body").focus();
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
        from_name: staffName(session.user.id) || session.user.email,
        from_email: session.user.email,
        from_where: "crm",
        body,
      }),
    });
    showFix(false);
    // The report raises a task on the owner, so the count in the header should
    // move now rather than at the next poll.
    await Promise.all([loadFixes(), loadTasks()]);
    renderTaskBadge();
    if (section === "control") renderControl();
    if (section === "tasks") renderTasks();
  } catch (e) {
    err.textContent = String(e.message || e).includes("42P01")
      ? "This is not switched on yet. Run db/fix-requests.sql."
      : String(e.message || e);
    err.classList.remove("hidden");
  } finally {
    button.disabled = false;
    button.textContent = "Send it";
  }
}

async function loadFixes() {
  try {
    fixes = await api("fix_requests?select=*&order=created_at.desc");
  } catch (err) {
    // Missing table is the normal state until the migration is run, and is
    // not worth a banner.
    if (!String(err.message || err).includes("42P01")) {
      console.error("crm: fix requests unavailable", err);
    }
    fixes = [];
  }
}

const FIX_STATUS = {
  open: ["Open", "text-brand-gold"],
  doing: ["In hand", "text-blue-700"],
  done: ["Done", "text-green-700"],
  declined: ["Not doing", "text-gray-400"],
};

function renderFixes() {
  const el = $("c-fix");
  if (!el) return;

  const want = $("f-filter") ? $("f-filter").value : "open";
  const rows = want ? fixes.filter((f) => f.status === want) : fixes;
  $("c-fix-empty").classList.toggle("hidden", rows.length > 0);

  el.innerHTML = rows
    .map((f) => {
      const state = FIX_STATUS[f.status] || [f.status, "text-gray-400"];
      const move = (to, label) =>
        f.status === to
          ? ""
          : `<button data-fix="${f.id}" data-to="${to}"
               class="text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-brand-ink transition">${label}</button>`;

      return `
        <div class="bg-white border border-brand-stone/60 px-5 py-4">
          <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span class="text-sm">${esc(f.from_name || f.from_email || "Somebody")}</span>
            <span class="text-[10px] uppercase tracking-[0.18em] text-gray-400">
              ${f.from_where === "portal" ? esc(f.agency || "An agency") : "NQL"}
            </span>
            <span class="text-[10px] uppercase tracking-[0.18em] text-gray-400">${esc(when(f.created_at))}</span>
            <span class="text-[10px] uppercase tracking-[0.2em] ${state[1]} ml-auto">${esc(state[0])}</span>
          </div>

          <p class="text-sm text-gray-700 font-light leading-relaxed whitespace-pre-line mt-3">${esc(f.body)}</p>

          ${
            f.reply
              ? `<div class="mt-3 border-l-2 border-brand-gold/60 pl-3">
                   <div class="text-[10px] uppercase tracking-[0.18em] text-gray-400 mb-1">You said</div>
                   <p class="text-sm text-gray-600 font-light whitespace-pre-line">${esc(f.reply)}</p>
                 </div>`
              : ""
          }

          <div class="flex flex-wrap items-center gap-4 mt-4">
            ${move("doing", "Take it on")}
            ${move("done", "Done")}
            ${move("declined", "Not doing")}
            ${move("open", "Reopen")}
            <button data-fixreply="${f.id}"
              class="text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-brand-ink transition ml-auto">
              ${f.reply ? "Change the answer" : "Answer"}
            </button>
          </div>
        </div>`;
    })
    .join("");

  el.querySelectorAll("[data-fix]").forEach((b) =>
    b.addEventListener("click", () => setFixStatus(b.dataset.fix, b.dataset.to, b))
  );
  el.querySelectorAll("[data-fixreply]").forEach((b) =>
    b.addEventListener("click", () => replyToFix(b.dataset.fixreply, b))
  );
}

async function refreshTaskCount() {
  await loadTasks();
  renderTaskBadge();
}

function setFixStatus(id, status, button) {
  withControl(button, async () => {
    await mustAffect(
      `fix_requests?id=eq.${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          status,
          decided_at: new Date().toISOString(),
          decided_by: session.user.id,
        }),
      },
      "changing that"
    );
    // Closing a report closes its task, and the other way round.
    await refreshTaskCount();
  });
}

function replyToFix(id, button) {
  const f = fixes.find((x) => x.id === id);
  const answer = prompt(
    `Answer ${f ? f.from_name || "them" : "them"}. They see this next time they open it.`,
    (f && f.reply) || ""
  );
  if (answer === null) return;
  withControl(button, () =>
    mustAffect(
      `fix_requests?id=eq.${id}`,
      { method: "PATCH", body: JSON.stringify({ reply: answer.trim() || null }) },
      "saving that answer"
    )
  );
}

/* --------------------------------------------------------------- control */

/* The owner's panel. Everything here changes who can get in, which is the one
   thing worth gating: the rest of the CRM is work, and work should not need
   permission.

   Creating a login is still done in the Supabase dashboard. A browser holding
   the anon key cannot make an account and should not be able to. This panel
   takes an address that already exists and says what it is allowed to be. */

// What this CRM depends on, and the file that adds each thing. Every check is
// one small query: if it answers, the thing is there.
/* What each role means, in the words the panel uses. Sales is the restricted
   one: the database gives them the leads assigned to them and nothing else. */
const ROLES = [
  ["owner", "Owner"],
  ["admin", "Admin"],
  ["sales", "Sales"],
];

const ROLE_MEANS = {
  owner: "Everything, and can change who has access",
  admin: "Everything except changing access",
  sales: "Only the leads assigned to them",
};

const HEALTH_CHECKS = [
  ["Lead numbers",      "leads?select=lead_no&limit=1",              "db/lead-numbers.sql"],
  ["Deal value",        "leads?select=deal_value&limit=1",           "db/deal-value.sql"],
  ["Country on leads",  "leads?select=country&limit=1",              "db/partner-portal.sql"],
  ["Completeness",      "leads?select=match_score&limit=1",          "db/lead-match.sql"],
  ["Consent trail",     "leads?select=intro_consent&limit=1",        "db/partner-portal.sql"],
  ["Tasks",             "tasks?select=id&limit=1",                   "db/tasks.sql"],
  ["Newsletter",        "subscribers?select=id&limit=1",             "db/subscribers.sql"],
  ["Who is online",     "presence?select=user_id&limit=1",           "db/presence.sql"],
  ["Agency accounts",   "partner_users?select=user_id&limit=1",      "db/partner-portal.sql"],
  ["Introductions",     "partner_interest?select=id&limit=1",        "db/partner-portal.sql"],
  ["Agency countries",  "partner_countries?select=country&limit=1",  "db/partner-countries.sql"],
  ["The agency board",  "partner_board?select=id&limit=1",           "db/partner-countries.sql"],
  ["Staff roles",       "staff_admin?select=role&limit=1",           "db/owner-role.sql"],
  ["The whole brief",   "partner_board?select=message&limit=1",      "db/board-detail.sql"],
  // Retention is a promise rather than a feature, so it is the one check that
  // has to look at an answer rather than at whether the question was allowed.
  // needsRow means an empty result counts as missing.
  ["Deleting old data", "retention_status?select=installed&installed=is.true", "db/retention.sql", true],
];

async function runHealth() {
  health = await Promise.all(
    HEALTH_CHECKS.map(async ([label, path, file, needsRow]) => {
      try {
        const rows = await api(path);
        if (needsRow && (!rows || rows.length === 0)) {
          return { label, file, ok: false, why: "not installed" };
        }
        return { label, file, ok: true };
      } catch (err) {
        const msg = String(err.message || err);
        return {
          label,
          file,
          ok: false,
          // 42P01 is a missing table, 42703 a missing column. Anything else is
          // a different problem and saying so beats "run the file again".
          why: /42P01|42703|PGRST20[0-9]|does not exist/.test(msg)
            ? "not installed"
            : msg.slice(0, 80),
        };
      }
    })
  );
}

function controlNavClass() {
  return (
    "items-center gap-2 border text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 transition " +
    (section === "control"
      ? "border-brand-gold text-brand-gold"
      : "border-white/25 text-white/70 hover:border-white hover:text-white") +
    // Rebuilding className wipes anything set elsewhere, so whether the owner
    // may see it at all has to be decided here too.
    (isOwner ? " flex" : " hidden")
  );
}

async function loadControl() {
  try {
    isOwner = false;
    staffAdmin = await api("staff_admin?select=*&order=role,email");
    const meRow = staffAdmin.find((x) => x.user_id === session.user.id);
    isOwner = !!meRow && meRow.role === "owner";
  } catch (err) {
    console.error("crm: staff list unavailable", err);
    staffAdmin = [];
  }

  try {
    agencyLogins = await api("partner_users_admin?select=*&order=agency,email");
  } catch (err) {
    console.error("crm: agency logins unavailable", err);
    agencyLogins = [];
  }

  await loadFixes();

  const tab = $("nav-control");
  if (tab) tab.className = controlNavClass();
}

function renderControl() {
  const row = (left, right, aside) =>
    `<div class="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 border-b border-brand-stone/40 last:border-0">
       ${left}
       ${
         aside
           ? `<span class="text-[10px] uppercase tracking-[0.18em] ${
               /never/i.test(aside) ? "text-red-700" : "text-gray-400"
             }">${esc(aside)}</span>`
           : ""
       }
       <div class="ml-auto flex items-center gap-2">${right}</div>
     </div>`;

  // ---- the team ----
  $("c-staff-count").textContent = `${staffAdmin.length} with access`;
  $("c-staff").innerHTML =
    staffAdmin
      .map((x) => {
        const isMe = x.user_id === session.user.id;
        /* The owner cannot demote or remove themselves. There is no way back
           from a CRM with nobody who can grant access, and the guard belongs
           here as well as in the database because a disabled control explains
           itself and a rejected request does not. */
        const roleSelect = isMe
          ? `<span class="text-[10px] uppercase tracking-[0.2em] text-gray-300">Owner, you</span>`
          : `<select data-role="${x.user_id}"
               class="bg-white border border-brand-stone/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-600 focus:outline-none focus:border-brand-gold">
               ${ROLES.map(
                 ([value, label]) =>
                   `<option value="${value}" ${value === x.role ? "selected" : ""}>${esc(label)}</option>`
               ).join("")}
             </select>`;

        const actions = isMe
          ? ""
          : roleSelect +
            `<button data-rmstaff="${x.user_id}" class="text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-red-700 transition ml-3">Remove</button>`;
        const roleTag = "";
        return row(
          `<span class="inline-flex items-start gap-2.5">
             <span class="owner-disc mt-0.5" style="background:${staffColour(x.user_id)}">${esc(initials(x.name))}</span>
             <span>
               <span class="text-sm">${esc(x.name)}</span>
               <span class="text-xs text-gray-400 ml-2">${esc(x.email)}</span>
               <span class="block text-[11px] text-gray-400 font-light mt-0.5">${esc(ROLE_MEANS[x.role] || x.role)}</span>
             </span>
           </span>`,
          roleTag + actions
        );
      })
      .join("") ||
    `<p class="px-5 py-10 text-center text-sm text-gray-400 font-light">Nobody listed. Run db/owner-role.sql.</p>`;

  // ---- agency logins ----
  $("c-agency-count").textContent = `${agencyLogins.length} account${agencyLogins.length === 1 ? "" : "s"}`;
  $("c-agency").innerHTML =
    agencyLogins
      .map((x) =>
        row(
          `<span><span class="text-sm">${esc(x.name || x.email)}</span>
             <span class="text-xs text-gray-400 ml-2">${esc(x.email)}</span></span>
           <span class="text-[10px] uppercase tracking-[0.2em] text-brand-gold">${esc(x.agency)}</span>`,
          `<span class="text-[10px] uppercase tracking-[0.2em] ${
            x.status === "active" ? "text-green-700" : "text-gray-400"
          }">${x.status === "active" ? "Active" : "Paused"}</span>
           <button data-agtoggle="${x.user_id}" data-status="${esc(x.status)}"
             class="text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-brand-ink transition ml-3">${
               x.status === "active" ? "Pause" : "Resume"
             }</button>
           <button data-agremove="${x.user_id}"
             class="text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-red-700 transition ml-3">Remove</button>`,
          x.last_sign_in_at
            ? `Last in ${when(x.last_sign_in_at)}`
            : "Never signed in"
        )
      )
      .join("") ||
    `<p class="px-5 py-10 text-center text-sm text-gray-400 font-light">No agency has a login yet.</p>`;

  $("c-agency-pick").innerHTML =
    `<option value="">Which agency</option>` +
    partners
      .map((p) => `<option value="${p.id}">${esc(p.name)}</option>`)
      .join("");

  // ---- which countries each agency covers ----
  //
  // A grid of a hundred and forty four squares to say "Romolini does Italy"
  // was the wrong shape for the question. One line per agency, the countries
  // it covers as chips, and one dropdown to add another.
  const active = partners.filter((p) => p.status !== "former");
  $("c-vis-count").textContent = `${active.length} agenc${active.length === 1 ? "y" : "ies"}`;
  $("c-vis-empty").classList.toggle("hidden", active.length > 0);

  // Buyers with no country go to every agency, because filing them under
  // nobody was how a board set to Italy ended up empty. Say the number here so
  // the reach of a country chip is never a surprise.
  const stranded = uncountriedBuyers();

  $("c-vis").innerHTML = (stranded
    ? `<div class="px-5 py-3 border-b border-brand-stone/40 bg-brand-sand/40 text-xs font-light text-gray-600">
         <strong class="font-medium">${stranded} live buyer${stranded === 1 ? " has" : "s have"} no country recorded</strong>,
         so ${stranded === 1 ? "it goes" : "they go"} to every agency below until somebody files ${stranded === 1 ? "it" : "them"}.
         Setting a country on a lead narrows it to the agencies working there.
       </div>`
    : "") + active
    .map((p) => {
      const on = countriesFor(p.id).sort();
      const spare = MED_COUNTRIES.filter((c) => !on.includes(c));
      const seen = agencyBoardCount(p);
      return `
        <div class="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4 border-b border-brand-stone/40 last:border-0">
          <span class="w-48 shrink-0">
            <span class="block text-sm">${esc(p.name)}</span>
            <span class="block text-[10px] uppercase tracking-[0.12em] ${
              seen ? "text-gray-400" : "text-red-700"
            }">${seen} buyer${seen === 1 ? "" : "s"} on their board</span>
          </span>

          <span class="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
            ${
              p.sees_leads !== true
                ? `<button data-seesall="${p.id}"
                     title="Switch the board back on for ${esc(p.name)}"
                     class="inline-flex items-center gap-1.5 border border-red-300 bg-red-50 text-red-800 text-[10px] uppercase tracking-[0.12em] px-2.5 py-1.5 hover:border-red-700 transition">
                     Sees nothing
                   </button>`
                : on.length
                ? on
                    .map(
                      (c) => `
                      <button data-drop="${p.id}" data-country="${esc(c)}"
                        title="Stop showing ${esc(c)} to ${esc(p.name)}"
                        class="group inline-flex items-center gap-1.5 bg-brand-ink text-white text-[10px] uppercase tracking-[0.12em] pl-2.5 pr-2 py-1.5 hover:bg-red-700 transition">
                        ${esc(c)}
                        <span class="tabular-nums ${
                          boardCount(c) ? "text-white/60" : "text-red-300"
                        }">${boardCount(c)}</span>
                        <span class="text-white/50 group-hover:text-white">&times;</span>
                      </button>`
                    )
                    .join("")
                : `<span class="text-[11px] uppercase tracking-[0.15em] text-brand-gold">Every country</span>`
            }
          </span>

          <select data-add-country="${p.id}"
            class="bg-white border border-brand-stone/60 px-3 py-1.5 text-xs text-gray-500 focus:outline-none focus:border-brand-gold shrink-0">
            <option value="">${spare.length ? "Add a country" : "All of them"}</option>
            ${spare.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join("")}
            ${
              p.sees_leads !== true
                ? ""
                : `<option value="__none">None, show them nothing</option>`
            }
          </select>
        </div>`;
    })
    .join("") +
    `<details class="px-5 py-4 border-t border-brand-stone/40">
       <summary class="cursor-pointer text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-brand-ink">
         Why a board is empty
       </summary>
       <pre class="mt-3 text-[11px] leading-relaxed text-gray-600 whitespace-pre overflow-x-auto">${esc(boardAudit())}</pre>
     </details>`;

  // ---- health ----
  $("c-health").innerHTML = health
    .map((h) =>
      row(
        `<span class="text-sm">${esc(h.label)}</span>`,
        h.ok
          ? `<span class="text-[10px] uppercase tracking-[0.2em] text-green-700">Installed</span>`
          : `<span class="text-[10px] uppercase tracking-[0.2em] text-red-700">${esc(h.why)}</span>
             <code class="text-[11px] text-gray-400 ml-3">${esc(h.file)}</code>`
      )
    )
    .join("");

  wireControl();
}

function wireControl() {
  const el = $("section-control");

  el.querySelectorAll("[data-role]").forEach((sel) =>
    sel.addEventListener("change", () => setRole(sel.dataset.role, sel.value, sel))
  );
  el.querySelectorAll("[data-rmstaff]").forEach((b) =>
    b.addEventListener("click", () => removeStaff(b.dataset.rmstaff, b))
  );
  el.querySelectorAll("[data-agtoggle]").forEach((b) =>
    b.addEventListener("click", () =>
      setAgencyStatus(b.dataset.agtoggle, b.dataset.status === "active" ? "paused" : "active", b)
    )
  );
  el.querySelectorAll("[data-agremove]").forEach((b) =>
    b.addEventListener("click", () => removeAgencyLogin(b.dataset.agremove, b))
  );

  const countryChange = async (control, fn) => {
    control.disabled = true;
    try {
      await fn();
      renderControl();
    } catch (err) {
      control.disabled = false;
      const msg = String(err.message || err);
      alert(
        msg.includes("42501")
          ? "The database is refusing that change. Run db/agency-tiers.sql."
          : msg
      );
    }
  };

  el.querySelectorAll("[data-add-country]").forEach((sel) =>
    sel.addEventListener("change", () => {
      if (!sel.value) return;
      // "None" is a different thing from an empty list. No countries chosen
      // has always meant every country, so one field cannot also mean none:
      // this is its own switch, and it keeps the countries on file so turning
      // an agency back on does not mean remembering what it covered.
      if (sel.value === "__none") {
        countryChange(sel, () => setSeesLeads(sel.dataset.addCountry, false));
        return;
      }
      countryChange(sel, () => addAgencyCountry(sel.dataset.addCountry, sel.value));
    })
  );

  el.querySelectorAll("[data-seesall]").forEach((b) =>
    b.addEventListener("click", () =>
      countryChange(b, () => setSeesLeads(b.dataset.seesall, true))
    )
  );

  el.querySelectorAll("[data-drop]").forEach((b) =>
    b.addEventListener("click", () =>
      countryChange(b, () => removeAgencyCountry(b.dataset.drop, b.dataset.country))
    )
  );
}

/* A write that changes nothing is not a success.
 *
 * PostgREST answers an update whose rows fail the policy's using clause with
 * 204 and an empty body: no error, no rows, nothing to catch. Every control on
 * this panel went through that path, so a change the database quietly refused
 * looked exactly like one it accepted, and the panel redrew the old value.
 *
 * Asking for the rows back turns silence into an answer.
 */
async function mustAffect(path, options, what) {
  const rows = await api(path, {
    ...options,
    headers: { ...(options.headers || {}), Prefer: "return=representation" },
  });
  if (!rows || rows.length === 0) {
    throw new Error(
      `The database accepted the request and changed nothing, which means it refused ${what}. ` +
        `The usual cause is that you are not the owner, or that db/staff-restricted.sql has not been run.`
    );
  }
  return rows;
}

async function withControl(button, fn, errorId) {
  const err = errorId ? $(errorId) : null;
  if (err) err.classList.add("hidden");
  if (button) button.disabled = true;
  try {
    await fn();
    await loadControl();
    await runHealth();
    renderControl();
  } catch (e) {
    if (button) button.disabled = false;
    const msg = String(e.message || e);
    const text = msg.includes("42501")
      ? "Only the owner can change access."
      : msg.includes("23514") || msg.includes("nql_staff_role_check")
      ? "The database does not allow that role yet. Run db/staff-restricted.sql, which is what adds Sales."
      : msg;
    if (err) {
      err.textContent = text;
      err.classList.remove("hidden");
    } else {
      alert(text);
    }
  }
}

function setRole(userId, role, control) {
  const who = staffAdmin.find((x) => x.user_id === userId);
  const name = who ? who.name : "this person";
  const was = who ? who.role : "";

  const warning =
    role === "owner"
      ? `Make ${name} an owner?\n\nThey will be able to change who has access, including removing you.`
      : `Set ${name} to ${role}?\n\n${ROLE_MEANS[role]}.`;

  if (!confirm(warning)) {
    // Put the select back rather than leaving it showing a change that was
    // not made.
    if (control && control.tagName === "SELECT") control.value = was;
    return;
  }

  withControl(control, () =>
    mustAffect(
      `nql_staff?user_id=eq.${userId}`,
      { method: "PATCH", body: JSON.stringify({ role }) },
      `setting ${name} to ${role}`
    )
  );
}

function removeStaff(userId, button) {
  const who = staffAdmin.find((x) => x.user_id === userId);
  if (!confirm(`Take CRM access away from ${who ? who.name : "this person"}?\n\nTheir account stays in Supabase and their notes stay on the leads. They simply stop seeing anything.`))
    return;
  withControl(button, () =>
    mustAffect(`nql_staff?user_id=eq.${userId}`, { method: "DELETE" }, "removing them")
  );
}

function setAgencyStatus(userId, status, button) {
  withControl(button, () =>
    mustAffect(
      `partner_users?user_id=eq.${userId}`,
      { method: "PATCH", body: JSON.stringify({ status }) },
      `setting that login to ${status}`
    )
  );
}

function removeAgencyLogin(userId, button) {
  const who = agencyLogins.find((x) => x.user_id === userId);
  if (!confirm(`Remove ${who ? who.email : "this login"} from ${who ? who.agency : "the agency"}?\n\nThey lose the portal at once. Leads already introduced to that agency stay introduced.`))
    return;
  withControl(button, () =>
    mustAffect(`partner_users?user_id=eq.${userId}`, { method: "DELETE" }, "removing that login")
  );
}

/* Turning an address into the id behind it. auth_accounts is the owner's
   view over auth.users, so this works for an account the dashboard has made
   and nothing else: the browser holds the anon key and cannot, and should
   not, be able to create a login. */
async function findAccount(email) {
  const rows = await api(
    `auth_accounts?email=eq.${encodeURIComponent(email.toLowerCase())}&select=*`
  );
  if (!rows || !rows.length) {
    throw new Error(
      "No account for that address. Create it in Supabase, Authentication, Users, then add it here."
    );
  }
  return rows[0];
}

async function addStaffByEmail() {
  const email = $("c-staff-email").value.trim();
  if (!email) return;
  await withControl(
    $("c-staff-add"),
    async () => {
      const acct = await findAccount(email);
      // Staff or agency, never both. Somebody who is both would be an
      // outsider with a key to the whole pipeline.
      if (acct.is_agency) {
        throw new Error(
          "That address has a portal login. An account is staff or agency, never both. Remove the agency login first."
        );
      }
      await api("nql_staff", {
        method: "POST",
        headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
        body: JSON.stringify({ user_id: acct.id, role: "admin" }),
      });
      $("c-staff-email").value = "";
    },
    "c-staff-error"
  );
}

async function addAgencyByEmail() {
  const email = $("c-agency-email").value.trim();
  const partnerId = $("c-agency-pick").value;
  const err = $("c-agency-error");
  if (!email || !partnerId) {
    err.textContent = "An address and an agency, both.";
    err.classList.remove("hidden");
    return;
  }
  await withControl(
    $("c-agency-add"),
    async () => {
      const acct = await findAccount(email);
      if (acct.is_staff) {
        throw new Error(
          "That address is on the NQL team. Giving it a portal login would take its CRM access away, so it has to be removed from the team first."
        );
      }
      await api("partner_users", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({
          user_id: acct.id,
          partner_id: partnerId,
          name: acct.email.split("@")[0],
          status: "active",
        }),
      });
      $("c-agency-email").value = "";
    },
    "c-agency-error"
  );
}

/* The consent email, written for you.
 *
 * This was the step done from memory, and it is the one that makes the whole
 * arrangement lawful. A message typed fresh each time drifts: it stops naming
 * the agency, or stops saying what is being passed on, and then the record
 * says consent was asked for something the buyer was never told.
 *
 * A mailto rather than a mail service, deliberately. It opens in whatever the
 * person already uses, it goes out from their own address, the reply comes
 * back to them, and there is nothing to fail silently at three in the morning.
 * The cost is that we cannot prove it was sent, which is what the note on the
 * lead is for.
 */
function consentEmail(lead, agency) {
  const name = [lead.first_name, lead.last_name].filter(Boolean).join(" ") || "there";
  const first = lead.first_name || name;
  const about =
    lead.property_name ||
    lead.project_interest ||
    lead.property_kinds ||
    (lead.country ? `a property in ${lead.country}` : "buying abroad");
  const where = lead.country ? ` in ${lead.country}` : "";

  const subject = `An introduction to ${agency}`;

  const body = [
    `Dear ${first},`,
    ``,
    `You wrote to us about ${about}.`,
    ``,
    `We work with ${agency}, a local agency${where}, and they have told us they have properties that fit what you described. We would like to introduce you to them.`,
    ``,
    `That means passing them your name, email address and telephone number so they can contact you directly. Nothing goes to them until you reply to this message and say yes.`,
    ``,
    `If you would rather we did not, simply say so and nothing happens. It makes no difference to anything else we do for you.`,
    ``,
    `Kind regards,`,
    ``,
    `NQL Properties`,
    `info@nordicql.com`,
  ].join("\n");

  return `mailto:${encodeURIComponent(lead.email || "")}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}

/* --------------------------------------------------- agency introductions */

/* The consent trail, and the only route by which an agency ever sees a
   buyer's contact details.

   asked     the agency wants this lead; nobody has looked yet
   declined  we said no, and the buyer was never troubled with it
   pending   the buyer has been asked and has not answered
   granted   the buyer said yes; details are open to that agency
   refused   the buyer said no

   Granting writes three things at once: the request, the consent on the lead
   including which agency was named, and the row in lead_partners. All three
   are what the portal's view checks, so a half finished grant reveals
   nothing rather than something. */

async function loadRequests() {
  try {
    requests = await api(
      "partner_interest?select=*&order=created_at.desc"
    );
    requestsError = null;
  } catch (err) {
    // A missing table is the normal state until db/partner-portal.sql is run.
    if (!String(err.message || err).includes("42P01")) trouble("Introduction requests could not be loaded.", err);
    requests = [];
    requestsError = String(err.message || err).includes("42P01")
      ? "The partner portal is not switched on yet. Run db/partner-portal.sql."
      : String(err.message || err);
  }
  renderRequestBadge();
}

/* What agencies have offered us, and what became of the leads we gave them.
   The second is the only honest measure of an agency: partner_performance
   counts our own stage field, which moves when we move it, and we are not the
   ones at the viewing. */

const OUTCOME_LABEL = {
  spoke: "Spoke to them",
  viewing: "Viewing booked",
  offer: "Offer made",
  sold: "Sold",
  cold: "Went cold",
};

async function loadOffers() {
  try {
    offers = await api("partner_offers?select=*&order=created_at.desc");
  } catch (err) {
    if (!String(err.message || err).includes("42P01")) {
      console.error("crm: offers unavailable", err);
    }
    offers = [];
  }
}

function renderOffers() {
  const el = $("o-list");
  if (!el) return;
  $("o-empty").classList.toggle("hidden", offers.length > 0);

  el.innerHTML = offers
    .map((o) => {
      const decided = o.status !== "new";
      return `
        <div class="bg-white border ${
          o.status === "interested" ? "border-brand-gold" : "border-brand-stone/60"
        } px-4 sm:px-5 py-4">
          <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span class="font-serif text-base">${esc(o.title)}</span>
            <span class="text-[10px] uppercase tracking-[0.18em] text-brand-gold">${esc(partnerName(o.partner_id))}</span>
            <span class="text-[10px] uppercase tracking-[0.18em] text-gray-400">${esc(
              [o.location, o.country].filter(Boolean).join(", ")
            )}</span>
            ${o.price ? `<span class="font-serif text-brand-gold tabular-nums">${esc(money(o.price))}</span>` : ""}
            <span class="text-[10px] uppercase tracking-[0.18em] text-gray-400 ml-auto">${esc(when(o.created_at))}</span>
          </div>

          <div class="text-xs text-gray-500 font-light mt-1">
            ${[o.bedrooms ? o.bedrooms + " bed" : "", o.land].filter(Boolean).join(" &middot; ")}
            ${o.link ? ` &middot; <a href="${esc(o.link)}" target="_blank" rel="noopener noreferrer" class="underline underline-offset-2 hover:text-brand-gold">Look</a>` : ""}
          </div>

          ${
            o.notes
              ? `<p class="text-sm text-gray-600 font-light leading-relaxed whitespace-pre-line mt-2">${esc(o.notes)}</p>`
              : ""
          }

          <div class="flex flex-wrap gap-2 mt-4">
            ${
              decided
                ? `<span class="text-[10px] uppercase tracking-[0.2em] ${
                    o.status === "interested" ? "text-brand-gold" : "text-gray-400"
                  }">${o.status === "interested" ? "We are interested" : "We passed"}</span>`
                : ""
            }
            <button data-offer="${o.id}" data-to="interested"
              class="text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-brand-ink transition">Interested</button>
            <button data-offer="${o.id}" data-to="passed"
              class="text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-brand-ink transition">Pass</button>
            <button data-offerreply="${o.id}"
              class="text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-brand-ink transition sm:ml-auto">
              ${o.reply ? "Change the answer" : "Answer them"}
            </button>
          </div>
        </div>`;
    })
    .join("");

  el.querySelectorAll("[data-offer]").forEach((b) =>
    b.addEventListener("click", async () => {
      b.disabled = true;
      try {
        await api(`partner_offers?id=eq.${b.dataset.offer}`, {
          method: "PATCH",
          body: JSON.stringify({
            status: b.dataset.to,
            decided_at: new Date().toISOString(),
            decided_by: session.user.id,
          }),
        });
        await loadOffers();
        renderOffers();
      } catch (err) {
        b.disabled = false;
        trouble("Could not answer that offer.", err);
      }
    })
  );

  el.querySelectorAll("[data-offerreply]").forEach((b) =>
    b.addEventListener("click", async () => {
      const o = offers.find((x) => x.id === b.dataset.offerreply);
      const answer = prompt("What shall we tell them?", (o && o.reply) || "");
      if (answer === null) return;
      try {
        await api(`partner_offers?id=eq.${b.dataset.offerreply}`, {
          method: "PATCH",
          body: JSON.stringify({ reply: answer.trim() || null }),
        });
        await loadOffers();
        renderOffers();
      } catch (err) {
        trouble("Could not save that answer.", err);
      }
    })
  );
}

function partnerName(id) {
  const p = partners.find((x) => x.id === id);
  return p ? p.name : "Unknown agency";
}

// Only the ones still needing a decision from us count as waiting.
function openRequests() {
  return requests.filter((r) => r.status === "asked" || r.status === "pending");
}

function renderRequestBadge() {
  const el = $("nav-requests-count");
  if (!el) return;
  const n = openRequests().length;
  el.textContent = n ? ` ${n}` : "";
}

function renderRequests() {
  const el = $("r-list");
  if (!el) return;

  // Decisions from March are not work. The ones still needing something from
  // us are, so those are what the tab opens on.
  const show = $("r-filter") ? $("r-filter").value : "open";
  const rows =
    show === "open"
      ? requests.filter((r) => r.status === "asked" || r.status === "pending")
      : show === "done"
      ? requests.filter((r) => r.status !== "asked" && r.status !== "pending")
      : requests;
  $("r-count").textContent = `${rows.length} of ${requests.length}`;

  $("r-error").classList.toggle("hidden", !requestsError);
  if (requestsError) $("r-error").textContent = requestsError;
  $("r-empty").classList.toggle("hidden", rows.length > 0 || !!requestsError);

  /* Grouped by buyer rather than listed by arrival.
   *
   * Two or three agencies pitching for the same person is the point of this,
   * and comparing what they are offering is the moment our judgement is worth
   * most. A flat list by date hides exactly that, putting the thing to compare
   * eleven rows apart. */
  const byLead = new Map();
  rows.forEach((r) => {
    if (!byLead.has(r.lead_id)) byLead.set(r.lead_id, []);
    byLead.get(r.lead_id).push(r);
  });

  // Contested buyers first: those are the ones needing a decision rather than
  // a click.
  const groups = Array.from(byLead.entries()).sort(
    (a, b) =>
      b[1].length - a[1].length ||
      new Date(b[1][0].created_at) - new Date(a[1][0].created_at)
  );

  el.innerHTML = groups
    .map(([leadId, group]) => {
      const l = leads.find((x) => x.id === leadId);
      const contested = group.length > 1;
      const head = `
        <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-3">
          <button data-req="open" data-lead="${leadId}"
            class="font-serif text-lg leading-tight hover:text-brand-gold transition text-left">
            <span class="text-xs text-gray-400 tabular-nums">${esc(l ? leadNo(l) : "\u2014")}</span>
            ${esc(l ? fullName(l) : "Lead not found")}
          </button>
          ${
            l && l.country
              ? `<span class="text-[10px] uppercase tracking-[0.18em] text-gray-400">${esc(l.country)}</span>`
              : ""
          }
          ${l ? matchTag(l, "small") : ""}
          ${
            contested
              ? `<span class="bg-brand-gold text-brand-ink text-[9px] font-bold uppercase tracking-[0.15em] px-2 py-1 ml-auto">${group.length} agencies want them</span>`
              : ""
          }
        </div>`;

      return `<div class="bg-white border ${
        contested ? "border-brand-gold" : "border-brand-stone/60"
      } px-4 sm:px-5 py-4">${head}<div class="${
        contested ? "grid grid-cols-1 lg:grid-cols-2 gap-px bg-brand-stone/40" : ""
      }">${group.map((r) => pitchRow(r, contested)).join("")}</div></div>`;
    })
    .join("");

  renderOffers();

  el.querySelectorAll("[data-req]").forEach((b) =>
    b.addEventListener("click", () => {
      if (b.dataset.req === "open") {
        setSection("leads");
        openLead(b.dataset.lead);
        return;
      }
      decideRequest(b.dataset.req, b.dataset.id, b);
    })
  );
}

/* One agency's pitch. Side by side with its rivals when there is more than
   one, so the note each wrote is read against the others rather than alone. */
/* One agency's pitch. Side by side with its rivals when there is more than
   one, so what each wrote is read against the others rather than alone. The
   lead's own name is on the group heading above, so a pitch says only who is
   asking and what they are offering. */
const PITCH_STATE = {
  asked: ["Waiting on us", "text-brand-gold"],
  pending: ["Waiting on the buyer", "text-blue-700"],
  granted: ["Introduced", "text-green-700"],
  refused: ["Buyer said no", "text-gray-400"],
  declined: ["We declined", "text-gray-400"],
};

function pitchButton(label, action, id, tone) {
  return `<button data-req="${action}" data-id="${id}"
     class="px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition ${
       tone === "primary"
         ? "bg-brand-ink text-white hover:bg-brand-gold hover:text-brand-ink"
         : "border border-brand-stone/60 text-gray-500 hover:border-brand-ink hover:text-brand-ink"
     }">${label}</button>`;
}

function pitchRow(r, contested) {
  // What we can do next depends only on where the request has got to. Asking
  // the buyer is deliberately separate from granting: the gap between them is
  // where the actual conversation happens.
  let actions = "";
  if (r.status === "asked") {
    actions =
      pitchButton("Ask the buyer", "ask", r.id, "primary") +
      pitchButton("Decline", "decline", r.id);
  } else if (r.status === "pending") {
    actions =
      pitchButton("They said yes", "grant", r.id, "primary") +
      pitchButton("They said no", "refuse", r.id);
  }

  const state = PITCH_STATE[r.status] || [r.status, "text-gray-400"];

  return `
    <div class="bg-white ${contested ? "p-4" : "pt-1"}">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span class="text-sm font-medium">${esc(partnerName(r.partner_id))}</span>
        <span class="text-[10px] uppercase tracking-[0.18em] text-gray-400">${esc(when(r.created_at))}</span>
        <span class="text-[10px] uppercase tracking-[0.2em] ${state[1]} sm:ml-auto">${esc(state[0])}</span>
      </div>

      ${
        r.note
          ? `<blockquote class="mt-3 border-l-2 border-brand-gold/60 pl-3 text-sm text-gray-600 font-light leading-relaxed whitespace-pre-line">${esc(r.note)}</blockquote>`
          : `<p class="mt-3 text-xs text-gray-300 font-light">They offered no reason, which is worth weighing against one who did.</p>`
      }

      ${actions ? `<div class="flex flex-wrap gap-2 mt-4">${actions}</div>` : ""}
    </div>`;
}

async function decideRequest(action, id, button) {
  const r = requests.find((x) => x.id === id);
  if (!r) return;
  const l = leads.find((x) => x.id === r.lead_id);

  if (action === "ask" && l) {
    const who = partnerName(r.partner_id);
    if (
      !confirm(
        `Ask ${fullName(l)} whether we may introduce them to ${who}?\n\n` +
          `This records that we asked and opens the email ready to send. Come back and mark what they say.`
      )
    )
      return;
  }

  if (action === "grant" && l) {
    if (
      !confirm(
        `Confirm that ${fullName(l)} agreed to be introduced to ${partnerName(r.partner_id)}.\n\n` +
          `Their name, email, phone and message become visible to that agency.` +
          (leadPartners.filter((x) => x.lead_id === r.lead_id && x.granted).length
            ? `\n\nOthers already hold this buyer, which is fine: they compete on the house they put forward.`
            : "")
      )
    )
      return;
  }

  const now = new Date().toISOString();
  const patch = { decided_at: now, decided_by: session.user.id };

  button.disabled = true;
  try {
    if (action === "ask") {
      patch.status = "pending";
      await api(`leads?id=eq.${r.lead_id}`, {
        method: "PATCH",
        body: JSON.stringify({
          intro_consent: "asked",
          intro_partner_id: r.partner_id,
        }),
      });

      // Written and opened for them. A lead with no address is a lead we
      // cannot ask, and pretending otherwise would record a consent request
      // that never happened.
      if (l && l.email) {
        window.location.href = consentEmail(l, partnerName(r.partner_id));
      } else {
        alert(
          "Recorded as asked, but this lead has no email address, so there is nothing to open. Ring them and mark what they say."
        );
      }
    } else if (action === "decline") {
      patch.status = "declined";
    } else if (action === "refuse") {
      patch.status = "refused";
      await api(`leads?id=eq.${r.lead_id}`, {
        method: "PATCH",
        body: JSON.stringify({ intro_consent: "no", intro_consent_at: now }),
      });
    } else if (action === "grant") {
      patch.status = "granted";

      // The buyer's answer, on the lead: were they asked, and did they agree.
      // intro_partner_id records who was named the first time, and stays put
      // when a second agency is granted: a consent is not rewritten by a
      // later one.
      await api(`leads?id=eq.${r.lead_id}`, {
        method: "PATCH",
        body: JSON.stringify(
          l && l.intro_consent === "yes"
            ? { intro_consent: "yes", intro_consent_at: l.intro_consent_at || now }
            : { intro_consent: "yes", intro_consent_at: now, intro_partner_id: r.partner_id }
        ),
      });

      // Which agencies that answer covers. Several may hold one lead, which
      // is the whole point: they compete on the house they put forward.
      await api("lead_partners", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({
          lead_id: r.lead_id,
          partner_id: r.partner_id,
          role: "Introduced by NQL",
          added_by: session.user.id,
          granted: true,
          granted_at: now,
        }),
      });
      leadPartners = await api("lead_partners?select=*");
    }

    await api(`partner_interest?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });

    leads = await api("leads?select=*&order=created_at.desc");
    await loadRequests();
    renderRequests();
    render();
  } catch (err) {
    button.disabled = false;
    alert("Could not save that: " + (err.message || err));
  }
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
        <td class="col-source py-4 px-5"><span class="skel" style="width:60%;height:8px"></span></td>
        <td class="py-4 px-5"><span class="skel" style="width:80%;height:8px"></span></td>
        <td class="py-4 px-3"><span class="skel" style="width:70px;height:20px"></span></td>
        <td class="py-4 px-5"><span class="skel" style="width:64px;height:18px"></span></td>
        <td class="py-4 px-5"><span class="skel" style="width:24px;height:24px;border-radius:9999px"></span></td>
        <td class="col-received py-4 px-5"><span class="skel" style="width:70%;height:8px"></span></td>
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
      <div class="flex items-center justify-between gap-2">
        <span class="text-[10px] tracking-[0.15em] text-gray-400 tabular-nums">${esc(leadNo(l))}</span>
        ${matchTag(l, "small")}
      </div>
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
/* Which tabs a person can use.
 *
 * This is decoration, not access control: the database refuses the rows
 * either way. What it buys is a salesperson not clicking Newsletter and
 * meeting an empty table that looks like a fault.
 *
 * It reads nql_staff, which is where roles live now. The old staff_roles
 * table is still there and nothing writes to it, which is why this used to
 * hide the Newsletter tab from everybody including the owner.
 */
async function loadMyRole() {
  myRole = "admin";
  if (!session) return;
  try {
    const rows = await api(`nql_staff?user_id=eq.${session.user.id}&select=role`);
    if (Array.isArray(rows) && rows.length) myRole = rows[0].role;
  } catch (err) {
    // Leave the header alone rather than hiding everything on a failed read.
    console.error("crm: could not read role", err);
  }

  // The header is rebuilt from the same list that setSection uses, so a tab
  // cannot be hidden in one place and offered in the other.
  ["leads", "tasks", "reports", "partners", "requests", "subscribers"].forEach(
    (name) => {
      const tab = $("nav-" + name);
      if (tab) tab.classList.toggle("hidden", !canSee(name));
    }
  );

  // Somebody who reloads on a tab they may no longer open lands on the leads
  // rather than on an empty screen with no way back.
  if (!canSee(section)) setSection("leads");
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
  //
  // Rounded to thousands first: 999999 rounds to 1000k, which nobody writes.
  // Anything that reaches four figures of thousands is millions.
  const k = Math.round(v / 1000);
  if (k >= 1000)
    return "\u20ac" + (v / 1000000).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (v >= 1000) return "\u20ac" + k + "k";
  return "\u20ac" + v;
}

function stageValue(key) {
  const kind = $("filter-kind") ? $("filter-kind").value : "";
  return leads
    .filter((l) => (kind ? leadKind(l) === kind : true))
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
async function loadPartnerData() {
  try {
    partners = await api("partners?select=*&order=name.asc");
    partnerContacts = await api("partner_contacts?select=*");
    partnerStaff = await api("partner_staff?select=*").catch(() => []);
    partnerCountries = await api("partner_countries?select=*").catch(() => []);
    leadPartners = await api("lead_partners?select=*");
    partnersError = null;
  } catch (err) {
    console.error("crm: partner data unavailable", err);
    partnersError = err && err.message ? err.message : String(err);
  }
}

async function loadReminders() {
  try {
    reminders = await api("lead_reminders?select=*&order=due_at.asc");
  } catch (err) {
    console.error("crm: reminders unavailable", err);
  }
}

async function loadActivity() {
  try {
    // The body comes back too, so the search box can reach everything anyone
    // has typed since the enquiry arrived. Without it "the one whose wife is
    // from Todi" is unanswerable, because that sentence is in a note and the
    // search only ever saw the original message.
    const rows = await api("lead_notes?select=lead_id,created_at,body&order=created_at.desc");
    lastTouch = new Map();
    noteText = new Map();
    rows.forEach((n) => {
      if (!lastTouch.has(n.lead_id)) lastTouch.set(n.lead_id, n.created_at);
      const had = noteText.get(n.lead_id);
      noteText.set(n.lead_id, had ? had + " " + n.body : n.body);
    });
  } catch (err) {
    trouble("Contact history could not be loaded, so nothing will show as gone quiet.", err);
    lastTouch = new Map();
    noteText = new Map();
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
  if (leadKind(l) !== "lead") return false;
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
  const btn = $("quiet");
  if (!btn) return;
  if (!seesPipelineAlerts()) {
    btn.classList.add("hidden");
    btn.classList.remove("flex");
    return;
  }
  const n = quietLeadIds().size;
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

  /* Nineteen fields in one column is a wall, and this is the screen people
     live in. Grouped, with the two or three that matter open, it becomes
     something to read rather than something to scan past.

     Which sections are open is remembered per person: somebody who never
     books viewings should not have to close Meeting every time. */
  const group = (key, title, openByDefault, inner) => {
    const stored = localStorage.getItem("nql.crm.open." + key);
    const open = stored === null ? openByDefault : stored === "1";
    return `
      <details data-group="${key}" class="mb-6 border-b border-brand-stone/60 pb-2" ${open ? "open" : ""}>
        <summary class="cursor-pointer list-none flex items-center gap-2 py-2 select-none group">
          <span class="text-[10px] uppercase tracking-[0.2em] text-gray-400 group-hover:text-brand-ink transition">${esc(title)}</span>
          <svg class="w-3 h-3 text-gray-300 shrink-0 transition-transform group-open:rotate-90" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
            <path d="M4.5 2.5L8 6l-3.5 3.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </summary>
        <div class="pt-1">${inner}</div>
      </details>`;
  };

  /* Everything on a lead can be corrected here. A phone number typed wrong
     into a form on a Sunday should not need a database console to fix, and a
     read only field quietly invites somebody to keep a second copy of the
     truth in a notebook. */
  const editable = (column, label, type, placeholder) =>
    `<div class="border-b border-brand-stone/40 py-3 flex justify-between items-center gap-6">
       <label for="d-f-${column}" class="text-[10px] uppercase tracking-[0.2em] text-gray-400 shrink-0">${esc(label)}</label>
       <input id="d-f-${column}" data-col="${column}" type="${type || "text"}"
         value="${esc(l[column] ?? "")}" placeholder="${esc(placeholder || "Not stated")}"
         class="lead-field text-sm text-right bg-transparent flex-1 min-w-0 py-0.5 border-b border-transparent hover:border-brand-stone/60 focus:border-brand-gold focus:outline-none transition placeholder-gray-300" />
     </div>`;

  $("drawer-body").innerHTML = `
    ${duplicateBanner(l)}
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

    <div class="grid grid-cols-3 gap-3 mb-8">
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
      <div>
        <!-- Country sits with stage and owner because it decides which
             agencies ever see this lead. Buried in the list below it was
             read as a detail rather than as the switch it is. -->
        <label for="d-country" class="block text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">Looking in</label>
        <select id="d-country" class="w-full bg-white border ${
          l.country ? "border-brand-stone/60" : "border-brand-gold"
        } px-3 py-2.5 text-sm focus:outline-none focus:border-brand-gold">
          <option value="">Not stated</option>
          ${MED_COUNTRIES.map((c) => `<option value="${esc(c)}" ${c === l.country ? "selected" : ""}>${esc(c)}</option>`).join("")}
        </select>
      </div>
    </div>

    ${group("who", "Who they are", true, `
      ${editable("first_name", "First name")}
      ${editable("last_name", "Last name")}
      ${editable("email", "Email", "email")}
      ${editable("phone", "Phone", "tel")}
      ${editable("based_in", "Based in")}
    `)}

    ${group("money", "Money", true, `
      ${editable("budget", "Budget")}

      <div class="border-b border-brand-stone/40 py-3 flex justify-between items-center gap-4">
        <label for="d-value" class="text-[10px] uppercase tracking-[0.2em] text-gray-400 shrink-0">Deal value</label>
        <span class="flex items-center gap-2 min-w-0">
          <!-- The rounded figure beside the box, because 1450000 is hard to
               read back and 1.45M is the number anyone says out loud. -->
          <span id="d-value-money" class="font-serif text-brand-gold tabular-nums">${esc(money(l.deal_value))}</span>
          <span class="text-sm text-gray-400">&euro;</span>
          <input id="d-value" type="number" min="0" step="1000" inputmode="numeric"
            value="${l.deal_value ?? ""}" placeholder="Once there is an offer"
            class="text-sm text-right bg-transparent w-40 py-0.5 border-b border-transparent hover:border-brand-stone/60 focus:border-brand-gold focus:outline-none transition placeholder-gray-300 tabular-nums" />
        </span>
      </div>
      <div class="border-b border-brand-stone/40 py-4">
        <div class="flex items-center justify-between gap-3 mb-3">
          <span class="text-[10px] uppercase tracking-[0.2em] text-gray-400">How complete</span>
          <span class="flex items-center gap-2">
            <span id="d-match-out" class="text-sm tabular-nums">${
              MANDATE.length - mandateMissing(l).length
            } of ${MANDATE.length}</span>
            <span id="d-match-tag">${matchTag(l)}</span>
          </span>
        </div>

        <!-- Which of the seven are answered, and which are not. A tick list
             beats a percentage: it says what to go and ask for. -->
        <div id="d-mandate" class="flex flex-wrap gap-1.5">
          ${MANDATE.map(([label, has]) => {
            const v = has(l);
            const ok = v !== null && v !== undefined && String(v).trim() !== "";
            return `<span class="text-[9px] uppercase tracking-[0.12em] px-2 py-1 ${
              ok ? "bg-[#EDEAE3] text-[#5C5548]" : "bg-white border border-dashed border-brand-stone text-gray-300"
            }">${esc(label)}</span>`;
          }).join("")}
        </div>

        <details class="mt-3" ${l.match_score !== null && l.match_score !== undefined ? "open" : ""}>
          <summary class="text-[10px] uppercase tracking-[0.2em] text-gray-400 cursor-pointer hover:text-brand-ink transition">
            Set it by hand
          </summary>
          <div class="flex items-center gap-3 mt-3">
            <input id="d-match" type="range" min="0" max="100" step="5" value="${effectiveScore(l)}"
              class="flex-1 accent-brand-gold" />
            <span id="d-match-pct" class="text-sm tabular-nums w-10 text-right">${effectiveScore(l)}%</span>
            <button id="d-match-clear" class="text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-brand-ink transition ${
              l.match_score === null || l.match_score === undefined ? "hidden" : ""
            }">Automatic</button>
          </div>
          <input id="d-match-note" value="${esc(l.match_note || "")}" placeholder="Why you overrode it. Never shown to an agency."
            class="w-full mt-2 text-xs bg-transparent py-1 border-b border-transparent hover:border-brand-stone/60 focus:border-brand-gold focus:outline-none transition placeholder-gray-300" />
        </details>
      </div>


    `)}

    ${group("brief", "What they are looking for", true, `
      ${editable("location_detail", "Looking in, precisely")}
      ${editable("property_kinds", "Sort of place")}
      ${editable("bedrooms", "Bedrooms")}
      ${editable("land", "Land")}
      ${editable("must_haves", "Must have")}
      ${editable("dealbreakers", "Would rule it out")}
      ${editable("purpose", "What for")}
      ${editable("timeline", "When")}

      ${editable("property_name", "Property")}
      ${editable("project_interest", "Interest")}
    `)}

    ${group("meeting", "Meeting", false, `
      ${editable("meeting_format", "Format")}
      ${editable("preferred_date", "Preferred date", "date", "")}
      ${editable("preferred_time", "Preferred time")}
    `)}

    <div class="mb-8">
      <div class="flex items-baseline justify-between mb-1">
        <h3 class="text-[10px] uppercase tracking-[0.2em] text-gray-400">Message</h3>
        <span id="d-message-state" class="text-[10px] uppercase tracking-[0.2em] text-gray-300"></span>
      </div>
      <p class="text-[11px] text-gray-400 font-light mb-3">
        Ours. Agencies never see this, only the answers above.
      </p>
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
        ${CONTACT_LOG
          .map(
            (what) =>
              `<button data-log="${what}" class="border border-brand-stone px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 hover:border-brand-ink hover:text-brand-ink transition">${what}</button>`
          )
          .join("")}
        ${
          waNumber(l.phone)
            ? `<a href="https://wa.me/${waNumber(l.phone)}" target="_blank" rel="noopener noreferrer"
                 data-log-after="WhatsApp"
                 class="border border-[#25D366] text-[#128C4A] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-[#25D366]/10 transition inline-flex items-center gap-1.5">
                 <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                   <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2zm5.8 14.13c-.24.68-1.4 1.3-1.94 1.38-.5.07-1.12.1-1.81-.11-.42-.13-.95-.31-1.64-.6-2.88-1.25-4.76-4.15-4.9-4.34-.14-.19-1.17-1.56-1.17-2.97s.74-2.11 1-2.4c.26-.29.57-.36.76-.36l.55.01c.17.01.41-.07.64.49.24.57.81 1.98.88 2.12.07.15.12.32.02.51-.1.19-.15.31-.29.48-.15.17-.31.37-.44.5-.15.14-.3.3-.13.59.17.29.75 1.24 1.62 2.01 1.11.99 2.05 1.3 2.34 1.44.29.15.46.12.63-.07.17-.19.72-.85.92-1.14.19-.29.39-.24.65-.14.26.09 1.67.79 1.96.93.29.15.48.22.55.34.07.12.07.7-.17 1.38z"/>
                 </svg>
                 Open WhatsApp
               </a>`
            : ""
        }
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

  // Live while dragging, saved when let go: a PATCH per pixel would be
  // twenty writes for one decision.
  $("d-match").addEventListener("input", (e) => {
    const v = Number(e.target.value);
    $("d-match-pct").textContent = v + "%";
    $("d-match-tag").innerHTML = matchTag({ ...l, match_score: v });
  });

  const saveScore = async (value) => {
    await api(`leads?id=eq.${l.id}`, {
      method: "PATCH",
      body: JSON.stringify({ match_score: value }),
    });
    l.match_score = value;
    const inList = leads.find((x) => x.id === l.id);
    if (inList) inList.match_score = value;
    $("d-match-tag").innerHTML = matchTag(l);
    $("d-match-clear").classList.toggle("hidden", value === null);
    render();
  };

  // Live while dragging, saved when let go: a PATCH per pixel would be twenty
  // writes for one decision.
  $("d-match").addEventListener("change", (e) => saveScore(Number(e.target.value)));

  // Back to counting. Clearing the override is a real action, not the same as
  // dragging to zero, which would say "this lead has nothing".
  $("d-match-clear").addEventListener("click", async () => {
    await saveScore(null);
    $("d-match").value = infoScore(l);
    $("d-match-pct").textContent = infoScore(l) + "%";
  });

  $("d-match-note").addEventListener("change", async (e) => {
    const value = e.target.value.trim() || null;
    await api(`leads?id=eq.${l.id}`, {
      method: "PATCH",
      body: JSON.stringify({ match_note: value }),
    });
    l.match_note = value;
  });

  $("drawer-body").querySelectorAll("details[data-group]").forEach((d) =>
    d.addEventListener("toggle", () =>
      localStorage.setItem("nql.crm.open." + d.dataset.group, d.open ? "1" : "0")
    )
  );

  $("d-country").addEventListener("change", async (e) => {
    const value = e.target.value || null;
    await api(`leads?id=eq.${l.id}`, {
      method: "PATCH",
      body: JSON.stringify({ country: value }),
    });
    l.country = value;
    const inList = leads.find((x) => x.id === l.id);
    if (inList) inList.country = value;
    // Gold border while it is unset, because an unset country hides the lead
    // from every restricted agency.
    e.target.classList.toggle("border-brand-gold", !value);
    e.target.classList.toggle("border-brand-stone/60", !!value);
    refreshCompleteness(l);
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

  $("d-value").addEventListener("input", (e) => {
    const n = Number(e.target.value);
    $("d-value-money").textContent = isFinite(n) ? money(n) : "";
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
      $("d-value-money").textContent = money(value);
      // Deal value stands in for a stated budget on the completeness count.
      refreshCompleteness(l);
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

  /* One handler for every editable field on the lead. Each input carries the
     column it writes, so adding a field to the list above needs nothing here.

     Saved on change rather than on a button: a drawer with a Save in it grows
     a second state that can be lost by closing it, and this one is closed by
     pressing Escape. On failure the input goes back to what was stored, so
     the screen never shows something the database does not have. */
  $("drawer-body").querySelectorAll(".lead-field").forEach((input) =>
    input.addEventListener("change", async (e) => {
      const col = e.target.dataset.col;
      const value = e.target.value.trim() || null;
      const before = l[col];
      try {
        await api(`leads?id=eq.${l.id}`, {
          method: "PATCH",
          body: JSON.stringify({ [col]: value }),
        });
        l[col] = value;
        const inList = leads.find((x) => x.id === l.id);
        if (inList) inList[col] = value;

        // The heading and the completeness list both read these fields.
        const h = $("drawer-body").querySelector("h2");
        if (h) h.textContent = fullName(l);
        refreshCompleteness(l);
        render();
      } catch (err) {
        e.target.value = before ?? "";
        alert(`Could not save ${col.replace("_", " ")}: ${err.message || err}`);
      }
    })
  );

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

  /* Logging a call and ticking a reminder were two separate acts, so somebody
     could ring a lead, log it, and still be told a follow-up was due on them.
     The badge was right about the reminder; it simply did not know.

     Asked rather than assumed: "remind me to send the survey" is not answered
     by a phone call, so the reminder's own words go in the question and the
     person decides. It only asks when one is actually due, which is rare
     enough not to become a click people learn to dismiss. */
  const closeDueReminders = async (what) => {
    if (NOT_CONTACT.includes(what)) return;

    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const due = reminders.filter(
      (r) => r.lead_id === l.id && !r.done && new Date(r.due_at) <= end
    );
    if (!due.length) return;

    const which = due
      .map((r) => "\u00b7 " + (r.note || "Follow up"))
      .join("\n");
    if (
      !confirm(
        `${fullName(l)} has ${due.length === 1 ? "a follow-up" : due.length + " follow-ups"} due:\n\n${which}\n\nMark ${
          due.length === 1 ? "it" : "them"
        } done?`
      )
    )
      return;

    for (const r of due) {
      await api(`lead_reminders?id=eq.${r.id}`, {
        method: "PATCH",
        body: JSON.stringify({ done: true }),
      });
    }
    reminders = await api("lead_reminders?select=*&order=due_at.asc");
  };

  const logContact = async (what) => {
    await api("lead_notes", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ lead_id: l.id, body: what, author: session.user.id }),
    });
    if (l.stage === "new" && !NOT_CONTACT.includes(what)) {
      await api(`leads?id=eq.${l.id}`, {
        method: "PATCH",
        body: JSON.stringify({ stage: "contacted" }),
      });
      l.stage = "contacted";
      const inList = leads.find((x) => x.id === l.id);
      if (inList) inList.stage = "contacted";
    }
    await closeDueReminders(what);
    await loadActivity();
  };

  const wa = $("drawer-body").querySelector("[data-log-after]");
  if (wa) {
    wa.addEventListener("click", async () => {
      // The link opens in its own tab either way; this only records that it
      // happened. Nobody comes back to a CRM tab to press a button after a
      // conversation, so the button that has to be pressed is never pressed.
      try {
        await logContact("WhatsApp");
        openLead(l.id);
        render();
      } catch (err) {
        trouble("Opened WhatsApp, but could not record it on the lead.", err);
      }
    });
  }

  document.querySelectorAll("[data-log]").forEach((b) =>
    b.addEventListener("click", async () => {
      const what = b.dataset.log;
      b.disabled = true;
      try {
        // One path for every way of logging contact, so the WhatsApp button
        // and these four cannot drift apart again.
        await logContact(what);
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
  await loadMyRole();
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
  await loadRequests();
  await loadOffers();
  await loadControl();

  try {
    subscribers = await api("subscribers?select=*&order=created_at.desc");
    subscribersError = null;
  } catch (err) {
    // An empty list and a failed query look identical on screen, which is how
    // signups can be quietly lost for weeks. Keep the reason and show it.
    trouble("The newsletter list could not be loaded, so signups may not be arriving.", err);
    subscribers = [];
    subscribersError = String(err.message || err);
  }

  try {
    partners = await api("partners?select=*&order=name.asc");
    partnerContacts = await api("partner_contacts?select=*");
    partnerStaff = await api("partner_staff?select=*").catch(() => []);
    partnerCountries = await api("partner_countries?select=*").catch(() => []);
    leadPartners = await api("lead_partners?select=*");
  } catch (err) {
    trouble("Agency data could not be loaded.", err);
    partners = [];
    partnerContacts = [];
    partnerCountries = [];
    leadPartners = [];
    partnersError = err && err.message ? err.message : String(err);
  }

  $("filter-kind").value = kindFilter;
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

    /* The notes come with it. Both the reminder count and the gone quiet
       count are worked out from the newest note on each lead, and that was
       read once at sign in and never again. So a colleague ringing a lead
       cleared nothing on anybody else's screen until they reloaded, and a
       tab left open all day quietly drifted further from the truth the
       longer it stayed open. */
    await loadActivity();
    await loadReminders();
    await loadRequests();
    if (section === "requests") renderRequests();
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
    if (e.key === "Escape") {
      showDrawer(false);
      showFix(false);
    }
  });
  ["search", "filter-source", "filter-owner"].forEach((id) =>
    $(id).addEventListener("input", render)
  );
  $("filter-kind").addEventListener("change", (e) => {
    localStorage.setItem("nql.crm.kind", e.target.value);
    render();
  });
  $("export").addEventListener("click", exportCsv);
  $("density").addEventListener("click", toggleDensity);
  $("empty-add").addEventListener("click", openAddLead);
  $("view-list").addEventListener("click", () => setView("list"));
  $("nav-leads").addEventListener("click", () => setSection("leads"));
  $("nav-reports").addEventListener("click", () => setSection("reports"));
  $("nav-partners").addEventListener("click", () => setSection("partners"));
  $("nav-tasks").addEventListener("click", () => setSection("tasks"));
  $("nav-requests").addEventListener("click", () => setSection("requests"));
  $("r-filter").addEventListener("change", renderRequests);
  $("nav-control").addEventListener("click", async () => {
    setSection("control");
    // The health checks are thirteen requests, so they run when the panel is
    // opened rather than on every sign in.
    if (!health.length) {
      $("c-health").innerHTML =
        '<p class="px-5 py-8 text-center text-sm text-gray-400 font-light">Checking</p>';
      await runHealth();
      renderControl();
    }
  });
  $("c-recheck").addEventListener("click", async () => {
    await runHealth();
    renderControl();
  });
  $("c-staff-add").addEventListener("click", addStaffByEmail);
  $("f-filter").addEventListener("change", renderFixes);
  $("nav-fix").addEventListener("click", () => showFix(true));
  $("fix-cancel").addEventListener("click", () => showFix(false));
  $("fix-bg").addEventListener("click", () => showFix(false));
  $("fix-send").addEventListener("click", sendFix);
  $("c-agency-add").addEventListener("click", addAgencyByEmail);
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
    // Clicking the badge should answer the question it raises.
    renderDuePanel();
    $("due-panel").classList.toggle("hidden", !dueOnly);
    render();
  });

  $("due-close").addEventListener("click", () => {
    $("due-panel").classList.add("hidden");
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
