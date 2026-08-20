// ---------------------------------------------------------------------------
// Lead ingest — receives a form submission and files it in the CRM.
//
// Formspree POSTs here on every submission. Deliberately dependency-free:
// it talks to Supabase over its REST API with fetch, so the project needs no
// package.json and no build step.
//
// Environment variables (set in Vercel, never in the repo):
//   SUPABASE_URL          https://<project>.supabase.co
//   SUPABASE_SERVICE_KEY  service_role key — server only, bypasses RLS
//   INGEST_SECRET         shared secret, sent as ?token= on the webhook URL
// ---------------------------------------------------------------------------

const SOURCE_BY_SUBJECT = {
  "new contact enquiry": "contact",
  "new property enquiry": "property",
  "meeting request": "meeting",
  "new footer enquiry": "footer",
  "new newsletter signup": "newsletter",
};

function detectSource(payload) {
  if (payload.enquiry_type === "Meeting request") return "meeting";
  if (payload.property_name) return "property";

  const subject = String(payload._subject || "").toLowerCase();
  for (const [needle, source] of Object.entries(SOURCE_BY_SUBJECT)) {
    if (subject.includes(needle)) return source;
  }
  // a lone email and nothing else is the newsletter box
  if (payload.email && !payload.message && !payload.first_name) return "newsletter";
  return "contact";
}

// Formspree sends either a flat object or { data: {...} } depending on setup.
function unwrap(body) {
  if (body && typeof body === "object" && body.data && typeof body.data === "object") {
    return { ...body.data, _meta: body };
  }
  return body || {};
}

function asDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function trim(value, max = 4000) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_KEY, INGEST_SECRET } = process.env;

  // Report which names are absent, never their values. The names are already
  // public knowledge — crm/app.js names the Supabase project openly — and
  // without this a misconfiguration is invisible from outside Vercel.
  const missing = [
    ["SUPABASE_URL", SUPABASE_URL],
    ["SUPABASE_SERVICE_KEY", SUPABASE_SERVICE_KEY],
    ["INGEST_SECRET", INGEST_SECRET],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length) {
    console.error("ingest: missing environment variables:", missing.join(", "));
    return res.status(500).json({ error: "Not configured", missing });
  }

  // Shared secret on the query string. Without it anyone who finds the URL
  // could write rows into the pipeline. Fails closed: INGEST_SECRET being
  // absent is treated above as a misconfiguration, not as "no auth needed".
  const token =
    (req.query && req.query.token) ||
    (req.headers["x-ingest-token"] || "").toString();
  if (token !== INGEST_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const payload = unwrap(req.body);

  const lead = {
    source: detectSource(payload),
    page_url: trim(payload._page || payload.page_url || payload._referrer, 500),

    first_name: trim(payload.first_name, 120),
    last_name: trim(payload.last_name, 120),
    email: trim(payload.email, 320),
    phone: trim(payload.phone, 60),
    budget: trim(payload.budget, 200),
    message: trim(payload.message),

    property_name: trim(payload.property_name, 300),

    meeting_format: trim(payload.meeting_format, 100),
    preferred_date: asDate(payload.preferred_date),
    preferred_time: trim(payload.preferred_time, 100),
    project_interest: trim(payload.project_interest, 200),

    raw: payload,
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(lead),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("ingest: supabase rejected the insert", response.status, detail);
      // 200 back to Formspree regardless: retrying will not help, and the
      // submitter has already had their confirmation email.
      return res.status(200).json({ stored: false });
    }

    const [row] = await response.json();
    return res.status(200).json({ stored: true, id: row && row.id });
  } catch (err) {
    console.error("ingest: could not reach supabase", err);
    return res.status(200).json({ stored: false });
  }
}
