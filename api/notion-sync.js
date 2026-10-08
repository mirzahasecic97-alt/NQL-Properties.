// CRM to Notion, one way, nightly.
//
// Mirza keeps his own view of the partners in Notion. The CRM is where facts
// are typed; this job copies every partner into the "NQL Partners" database
// there, updating rows that exist (matched on CRM id) and adding new ones.
// The columns that are his, Notes, Last contact and My next step, are never
// written by this job, so nothing he types in Notion is lost.
//
// Environment:
//   SUPABASE_URL, SUPABASE_SERVICE_KEY   as for api/lead.js
//   NOTION_TOKEN                         an internal integration's secret,
//                                        with the database shared to it
//   NOTION_PARTNERS_DB                   the data source id of NQL Partners
//   CRON_SECRET                          Vercel sends it as a bearer token;
//                                        ?key=<CRON_SECRET> runs it by hand
//   CRM_URL                              where partner cards live
//                                        (default https://www.nqlgroup.com/crm)

const NOTION = "https://api.notion.com/v1";
const COUNTRIES = ["Italy", "Spain", "France", "UAE", "Cyprus", "Norway", "Iceland"];
const LINE_LABEL = { buy: "Buy", invest: "Invest", rent: "Rent", sell: "Sell", exp: "Experience", ops: "Demand" };
const AGREEMENT = { "Signed": "Signed", "Agreed, not signed": "Agreed not signed", "Not signed": "Not signed" };

function countryOf(p) {
  const c = String(p.country || "").trim();
  if (!c) return "Other";
  const hit = COUNTRIES.find((x) => x.toLowerCase() === c.toLowerCase());
  if (hit) return hit;
  if (/dubai|emirates/i.test(c)) return "UAE";
  if (/cyprus/i.test(c)) return "Cyprus";
  return "Other";
}

// The Notion page properties for one partner: facts only, never the columns
// that belong to Mirza.
function propertiesFor(p, contact, rows, crmUrl, today) {
  const lines = [...new Set(rows.map((r) => LINE_LABEL[r.line]).filter(Boolean))];
  const signedRow = rows.find((r) => AGREEMENT[r.contract]);
  const agreement = p.agreement_signed ? "Signed" : signedRow ? AGREEMENT[signedRow.contract] : "None";
  const owner = (rows.find((r) => r.owner) || {}).owner || "";
  const text = (s) => ({ rich_text: [{ text: { content: String(s || "").slice(0, 1900) } }] });
  const props = {
    "Name": { title: [{ text: { content: p.name || "Partner" } }] },
    "Country": { select: { name: countryOf(p) } },
    "City": text(p.city),
    "Line": { multi_select: lines.map((n) => ({ name: n })) },
    "Status": { select: { name: ["active", "paused", "former"].includes(p.status) ? p.status : "active" } },
    "Agreement": { select: { name: agreement } },
    "Contact": text(contact ? [contact.name, contact.role].filter(Boolean).join(", ") : ""),
    "CRM": { url: `${crmUrl}#partner=${p.id}` },
    "CRM id": text(p.id),
    "Last synced": { date: { start: today } },
  };
  if (owner) props["NQL owner"] = { select: { name: owner } };
  const phone = (contact && contact.phone) || p.phone; if (phone) props["Phone"] = { phone_number: String(phone) };
  const email = (contact && contact.email) || p.email; if (email) props["Email"] = { email: String(email) };
  if (p.website) props["Website"] = { url: /^https?:/.test(p.website) ? p.website : `https://${p.website}` };
  return props;
}

export default async function handler(req, res) {
  const env = process.env;
  // The key may arrive as a query helper or only in the raw URL, and a
  // secret pasted into Vercel can carry a stray space or newline.
  const secret = String(env.CRON_SECRET || "").trim();
  let key = String((req.query && req.query.key) || "").trim();
  if (!key) { const m = /[?&]key=([^&]+)/.exec(req.url || ""); if (m) key = decodeURIComponent(m[1]).trim(); }
  const bearer = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  if (secret && bearer !== secret && key !== secret)
    return res.status(401).json({ error: "not allowed", hint: secret ? "the key does not match CRON_SECRET" : "" });
  for (const name of ["SUPABASE_URL", "SUPABASE_SERVICE_KEY", "NOTION_TOKEN", "NOTION_PARTNERS_DB"])
    if (!env[name]) return res.status(500).json({ error: `${name} is not set` });

  const sb = { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` };
  const read = async (path) => {
    const r = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { headers: sb });
    if (!r.ok) throw new Error(`supabase ${path}: ${r.status} ${await r.text()}`);
    return r.json();
  };
  const notion = async (path, method, body) => {
    const r = await fetch(`${NOTION}${path}`, {
      method, headers: { Authorization: `Bearer ${env.NOTION_TOKEN}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const j = await r.json();
    if (!r.ok) throw new Error(`notion ${method} ${path}: ${r.status} ${j.message || ""}`);
    return j;
  };

  const out = { added: 0, updated: 0, skipped: 0, errors: [] };
  try {
    const [partners, contacts, connections] = await Promise.all([
      read("partners?select=*&order=name.asc"),
      read("partner_contacts?select=*"),
      read("business_connections?select=*").catch(() => []),
    ]);

    // Everything already in Notion, by CRM id, in one pass.
    const existing = new Map();
    let cursor;
    do {
      const page = await notion(`/databases/${env.NOTION_PARTNERS_DB}/query`, "POST", { page_size: 100, start_cursor: cursor });
      for (const pg of page.results) {
        const id = ((pg.properties["CRM id"] || {}).rich_text || []).map((t) => t.plain_text).join("");
        if (id) existing.set(id, pg.id);
      }
      cursor = page.has_more ? page.next_cursor : undefined;
    } while (cursor);

    const today = new Date().toISOString().slice(0, 10);
    const crmUrl = env.CRM_URL || "https://www.nqlgroup.com/crm";
    for (const p of partners) {
      try {
        const contact = contacts.filter((c) => c.partner_id === p.id).sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))[0];
        const rows = connections.filter((r) => String(r.partner || "").trim().toLowerCase() === String(p.name || "").trim().toLowerCase());
        const properties = propertiesFor(p, contact, rows, crmUrl, today);
        const pageId = existing.get(p.id);
        if (pageId) { await notion(`/pages/${pageId}`, "PATCH", { properties }); out.updated++; }
        else { await notion("/pages", "POST", { parent: { database_id: env.NOTION_PARTNERS_DB }, properties }); out.added++; }
      } catch (err) { out.errors.push(`${p.name}: ${err.message}`); }
    }
  } catch (err) {
    return res.status(500).json({ error: err.message, ...out });
  }
  return res.status(200).json(out);
}

export { propertiesFor, countryOf };
