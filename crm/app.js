/* --------------------------------------------------------------------------
   NQL Properties CRM

   Talks to Supabase over its REST API with plain fetch — no libraries, no
   build step. Row level security does the access control: the anon key below
   is public by design and grants nothing without a signed-in session.

   To go live, paste your project URL and anon key into CONFIG. Until then the
   app runs on sample data so the interface can be worked on.
   -------------------------------------------------------------------------- */

const CONFIG = {
  url: "PASTE_SUPABASE_URL",
  anonKey: "PASTE_SUPABASE_ANON_KEY",
};

const DEMO = CONFIG.url.startsWith("PASTE_");
const SESSION_KEY = "nql.crm.session";

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
};

let session = null;
let leads = [];
let staff = [];
let reminders = [];
let openLeadId = null;
let dueOnly = false;

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

/* ------------------------------------------------------------------- api */

// Supabase access tokens last about an hour. Rather than dumping people back
// at the login screen mid-task, swap the refresh token for a new one and retry
// the call once.
async function refreshSession() {
  if (DEMO || !session || !session.refresh_token) return false;
  try {
    const res = await fetch(`${CONFIG.url}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { apikey: CONFIG.anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    if (!res.ok) return false;
    const fresh = await res.json();
    session = { ...session, ...fresh };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

async function api(path, options = {}, retried = false) {
  if (DEMO) return demoApi(path, options);
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
  return res.status === 204 ? null : res.json();
}

async function signIn(email, password) {
  if (DEMO) {
    // sign in as whichever staff member matches, so notes are attributed
    const me = demoStaff.find((s) => s.email === (email || "").toLowerCase()) || demoStaff[0];
    return { access_token: "demo", refresh_token: "demo", user: { id: me.id, email: me.email } };
  }
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

function signOut() {
  localStorage.removeItem(SESSION_KEY);
  session = null;
  $("app").classList.add("hidden");
  $("login").classList.remove("hidden");
  $("login").classList.add("flex");
}

/* -------------------------------------------------------------- demo data */

const demoLeads = [
  {
    id: "d1", created_at: iso(-0.4), source: "meeting", stage: "new", assigned_to: null,
    first_name: "Anna", last_name: "Lindqvist", email: "anna.lindqvist@example.se",
    phone: "+46 70 123 4567", budget: null,
    message: "Interested in the Habitat Premium studios. Could we speak this week?",
    property_name: null, meeting_format: "Video call", preferred_date: "2026-08-22",
    preferred_time: "Morning (09:00-12:00)", project_interest: "Habitat, North Cyprus", raw: {},
  },
  {
    id: "d2", created_at: iso(-3), source: "property", stage: "contacted",
    assigned_to: "s2", first_name: "Marcus", last_name: "Bergström",
    email: "m.bergstrom@example.com", phone: "+46 73 998 2211", budget: "€1M - €2M",
    message: "Is the Amalfi villa still available? Looking to view in September.",
    property_name: "Sea-View Luxury Villa (Amalfi Coast)", raw: {},
  },
  {
    id: "d3", created_at: iso(-26), source: "contact", stage: "viewing",
    assigned_to: "s1", first_name: "Elena", last_name: "Rossi",
    email: "elena.rossi@example.it", phone: "+39 340 555 1234", budget: "€2M+",
    message: "Looking for a country estate in Tuscany with vineyard potential.",
    property_name: null, raw: {},
  },
  {
    id: "d4", created_at: iso(-52), source: "newsletter", stage: "new", assigned_to: null,
    first_name: null, last_name: null, email: "j.hartmann@example.de",
    phone: null, message: null, property_name: null, raw: {},
  },
  {
    id: "d5", created_at: iso(-120), source: "property", stage: "offer",
    assigned_to: "s3", first_name: "David", last_name: "Whitmore",
    email: "d.whitmore@example.co.uk", phone: "+44 7700 900123", budget: "£500k - £1M",
    message: "Ready to proceed on the Capraia wine estate. Need to discuss the lease terms.",
    property_name: "Sea-View Organic Wine Estate", raw: {},
  },
  {
    id: "d6", created_at: iso(-200), source: "footer", stage: "won",
    assigned_to: "s2", first_name: "Sofia", last_name: "Nilsen",
    email: "sofia.nilsen@example.no", phone: "+47 900 12 345", budget: null,
    message: "Completed on the Todi villa — thank you.", property_name: null, raw: {},
  },
  {
    id: "d7", created_at: iso(-340), source: "contact", stage: "lost",
    assigned_to: "s1", first_name: "Tom", last_name: "Fischer",
    email: "tfischer@example.at", phone: null, budget: "€500k",
    message: "Budget did not stretch. Revisit next year.", property_name: null, raw: {},
  },
];

const demoStaff = [
  { id: "s1", email: "mirza@nordicql.com", name: "Mirza" },
  { id: "s2", email: "oskar@nordicql.com", name: "Oskar" },
  { id: "s3", email: "eythor@nordicql.com", name: "Eythor" },
  { id: "s4", email: "jonhjaltason@nordicql.com", name: "Jon" },
];

let demoNotes = [
  { id: "n1", lead_id: "d2", author: "s2", body: "Called — wants to view w/c 8 Sept. Sending availability.", created_at: iso(-2) },
  { id: "n2", lead_id: "d5", author: "s3", body: "Lease to 2053 explained. Asked for the Romolini brochure.", created_at: iso(-96) },
];

let demoReminders = [
  { id: "r1", lead_id: "d2", owner: "s2", due_at: iso(24), note: "Send viewing dates", done: false },
  { id: "r2", lead_id: "d5", owner: "s3", due_at: iso(-6), note: "Chase on lease question", done: false },
];

function iso(hoursFromNow) {
  return new Date(Date.now() + hoursFromNow * 3600000).toISOString();
}

function demoApi(path, options) {
  const method = (options.method || "GET").toUpperCase();
  const body = options.body ? JSON.parse(options.body) : null;

  if (path.startsWith("staff")) return Promise.resolve(demoStaff);
  if (path.startsWith("leads")) {
    if (method === "PATCH") {
      const id = /id=eq\.([^&]+)/.exec(path)[1];
      Object.assign(leads.find((l) => l.id === id), body);
      return Promise.resolve([]);
    }
    if (method === "DELETE") {
      const id = /id=eq\.([^&]+)/.exec(path)[1];
      leads = leads.filter((l) => l.id !== id);
      return Promise.resolve([]);
    }
    return Promise.resolve(demoLeads.slice());
  }
  if (path.startsWith("lead_notes")) {
    if (method === "POST") {
      const note = { ...body, id: "n" + Date.now(), created_at: new Date().toISOString() };
      demoNotes.push(note);
      return Promise.resolve([note]);
    }
    const id = /lead_id=eq\.([^&]+)/.exec(path)[1];
    return Promise.resolve(demoNotes.filter((n) => n.lead_id === id));
  }
  if (path.startsWith("lead_reminders")) {
    if (method === "POST") {
      const r = { ...body, id: "r" + Date.now(), done: false };
      demoReminders.push(r);
      return Promise.resolve([r]);
    }
    if (method === "PATCH") {
      const id = /id=eq\.([^&]+)/.exec(path)[1];
      Object.assign(demoReminders.find((r) => r.id === id), body);
      return Promise.resolve([]);
    }
    const m = /lead_id=eq\.([^&]+)/.exec(path);
    return Promise.resolve(m ? demoReminders.filter((r) => r.lead_id === m[1]) : demoReminders);
  }
  return Promise.resolve([]);
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

  return leads.filter((l) => {
    if (due && !due.has(l.id)) return false;
    if (stage && l.stage !== stage) return false;
    if (src && l.source !== src) return false;
    if (owner === "__none" && l.assigned_to) return false;
    if (owner && owner !== "__none" && l.assigned_to !== owner) return false;
    if (!q) return true;
    return [l.first_name, l.last_name, l.email, l.phone, l.message, l.property_name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(q);
  });
}

function render() {
  stageTabs();
  renderFollowUps();
  const rows = visibleLeads();
  $("count").textContent = `${rows.length} of ${leads.length}`;
  $("empty").classList.toggle("hidden", rows.length > 0);
  renderCards(rows);

  $("rows").innerHTML = rows
    .map((l) => {
      const stage = STAGES.find((s) => s.key === l.stage) || STAGES[0];
      const interest = l.property_name || l.project_interest || "—";
      const owner = staffName(l.assigned_to);
      return `
      <tr data-id="${l.id}"
          class="lead-row border-b border-brand-stone/40 last:border-0 hover:bg-[#FBFAF7] cursor-pointer transition ${
            openLeadId === l.id ? "row-active" : ""
          }">
        <td class="py-4 px-5">
          <div class="font-serif text-base leading-tight">${esc(fullName(l))}</div>
          <div class="text-xs text-gray-400 font-light mt-0.5">${esc(subLine(l))}</div>
        </td>
        <td class="py-4 px-5 text-xs text-gray-500">${esc(SOURCE_LABEL[l.source] || l.source)}</td>
        <td class="py-4 px-5 text-xs text-gray-500 max-w-[240px] truncate">${esc(interest)}</td>
        <td class="py-4 px-5">
          <span class="stage-${l.stage} inline-block text-[9px] font-bold uppercase tracking-[0.18em] px-3 py-1.5">${esc(stage.label)}</span>
        </td>
        <td class="py-4 px-5 text-xs ${owner ? "text-gray-600" : "text-gray-300"}">${esc(owner || "Unassigned")}</td>
        <td class="py-4 px-5 text-xs text-gray-400 whitespace-nowrap">${esc(when(l.created_at))}</td>
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
        class="lead-card w-full text-left bg-white border border-brand-stone/60 p-4 ${
          openLeadId === l.id ? "border-brand-gold" : ""
        }">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="font-serif text-base leading-tight truncate">${esc(fullName(l))}</div>
            <div class="text-xs text-gray-400 font-light truncate">${esc(subLine(l))}</div>
          </div>
          <span class="stage-${l.stage} shrink-0 text-[9px] font-bold uppercase tracking-[0.15em] px-2.5 py-1">${esc(stage.label)}</span>
        </div>
        <div class="mt-3 flex items-center gap-3 text-[10px] uppercase tracking-[0.15em] text-gray-400">
          <span>${esc(SOURCE_LABEL[l.source] || l.source)}</span>
          <span>&middot;</span>
          <span>${esc(when(l.created_at))}</span>
          ${owner ? `<span>&middot;</span><span>${esc(owner)}</span>` : ""}
          ${due.has(l.id) ? `<span class="ml-auto text-brand-gold">Due</span>` : ""}
        </div>
      </button>`;
    })
    .join("");

  document.querySelectorAll(".lead-card").forEach((c) =>
    c.addEventListener("click", () => openLead(c.dataset.id))
  );
}

/* ---------------------------------------------------------------- export */

function exportCsv() {
  const rows = visibleLeads();
  const cols = [
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
          ${staff.map((s) => `<option value="${s.id}" ${s.id === l.assigned_to ? "selected" : ""}>${esc(s.name)}</option>`).join("")}
        </select>
      </div>
    </div>

    <div class="mb-8">
      ${field("Email", l.email)}
      ${field("Phone", l.phone)}
      ${field("Budget", l.budget)}
      ${field("Property", l.property_name)}
      ${field("Interest", l.project_interest)}
      ${field("Meeting", l.meeting_format)}
      ${field("Preferred", [l.preferred_date, l.preferred_time].filter(Boolean).join(" · "))}
    </div>

    ${
      l.message
        ? `<div class="mb-8">
             <h3 class="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3">Message</h3>
             <p class="text-sm text-gray-700 font-light leading-relaxed whitespace-pre-line">${esc(l.message)}</p>
           </div>`
        : ""
    }

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
                    <p class="text-[10px] uppercase tracking-[0.15em] text-gray-400 mt-2">
                      ${esc(staffName(n.author) || "—")} &middot; ${esc(when(n.created_at))}
                    </p>
                  </div>`
                )
                .join("")
            : `<p class="text-sm text-gray-400 font-light">No notes yet.</p>`
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

  $("n-add").addEventListener("click", async () => {
    const body = $("n-body").value.trim();
    if (!body) return;
    await api("lead_notes", {
      method: "POST",
      body: JSON.stringify({ lead_id: l.id, body, author: session.user.id }),
    });
    openLead(l.id);
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

function showDrawer(open) {
  $("drawer").classList.toggle("translate-x-full", !open);
  $("drawer-bg").classList.toggle("hidden", !open);
  if (!open) {
    openLeadId = null;
    render();
  }
}

/* ------------------------------------------------------------------- boot */

async function start(s) {
  session = s;
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));

  $("login").classList.add("hidden");
  $("login").classList.remove("flex");
  $("app").classList.remove("hidden");
  $("who").textContent = s.user.email;
  if (DEMO) $("demo-badge").classList.remove("hidden");

  staff = await api("staff?select=id,email,name");
  $("filter-owner").insertAdjacentHTML(
    "beforeend",
    staff.map((x) => `<option value="${x.id}">${esc(x.name)}</option>`).join("")
  );

  leads = await api("leads?select=*&order=created_at.desc");
  reminders = await api("lead_reminders?select=*&order=due_at.asc");
  render();
}

document.addEventListener("DOMContentLoaded", () => {
  if (DEMO) $("demo-hint").classList.remove("hidden");

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
  $("followups").addEventListener("click", () => {
    dueOnly = !dueOnly;
    render();
  });

  const saved = localStorage.getItem(SESSION_KEY);
  if (saved) {
    start(JSON.parse(saved)).catch(signOut);
  } else {
    $("login").classList.remove("hidden");
    $("login").classList.add("flex");
  }
});
