// ---------------------------------------------------------------------------
// Lead capture — the site's forms post here directly.
//
// The CRM comes first: the lead is written to Supabase, then the submission is
// forwarded to Formspree so the email notifications and their archive carry on
// unchanged. If Formspree is slow or down, the lead is still captured; if
// Supabase is down, the email still goes out. Neither can silently swallow an
// enquiry the way the webhook did.
//
// This runs in a browser context, so there is no shared secret to check — the
// token would be readable in the page source. It is a public write endpoint,
// like any contact form, and defended accordingly: a honeypot, an origin
// check, required fields and hard length caps.
//
// Environment variables (Vercel only):
//   SUPABASE_URL
//   SUPABASE_SERVICE_KEY   service_role — bypasses RLS
// ---------------------------------------------------------------------------

const ALLOWED_HOSTS = [
  "nqlproperties.com",
  "www.nqlproperties.com",
  "localhost",
  "127.0.0.1",
];

// Which Formspree form each submission belongs to, and what it means. Keyed by
// the hidden _form field so a page cannot ask us to forward somewhere else.
const FORMS = {
  mkjwkbzq: { source: "contact", subject: "New contact enquiry - NQL Properties" },
  mwleabqa: { source: "property", subject: "New property enquiry - NQL Properties" },
  mnpalvzy: { source: "newsletter", subject: "New newsletter signup - NQL Properties" },
  xjybjroq: { source: "footer", subject: "New footer enquiry - NQL Properties" },
};

function trim(value, max = 4000) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
}

function asDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function detectSource(payload, form) {
  if (payload.enquiry_type === "Buyer mandate") return "mandate";
  if (payload.enquiry_type === "Country guide") return "guide";
  if (payload.enquiry_type === "Meeting request") return "meeting";
  if (payload.property_name) return "property";
  if (form && FORMS[form]) return FORMS[form].source;
  if (payload.email && !payload.message && !payload.first_name) return "newsletter";
  return "contact";
}

// Never bounce a visitor somewhere a form field asked for. Only our own pages.
function safeRedirect(next, req) {
  const fallback = "/success";
  if (!next) return fallback;
  try {
    const url = new URL(String(next), `https://${req.headers.host}`);
    if (url.protocol !== "https:" && url.protocol !== "http:") return fallback;
    if (!ALLOWED_HOSTS.includes(url.hostname)) return fallback;
    return url.pathname + url.search;
  } catch {
    return fallback;
  }
}

function fromOurSite(req) {
  const origin = req.headers.origin || req.headers.referer || "";
  if (!origin) return false;
  try {
    return ALLOWED_HOSTS.includes(new URL(origin).hostname);
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const wantsJson = String(req.headers.accept || "").includes("application/json");

  const done = (status, payload, redirectTo) => {
    if (wantsJson) return res.status(status).json(payload);
    return res.redirect(303, redirectTo);
  };

  const next = safeRedirect(body._next, req);

  // Honeypot. Bots fill every field they find; the field is hidden, so anything
  // in it means this was not a person. Answer as though it worked.
  if (trim(body._gotcha)) {
    return done(200, { ok: true }, next);
  }

  if (!fromOurSite(req)) {
    return done(403, { error: "Forbidden" }, next);
  }

  const form = trim(body._form, 32);
  const known = FORMS[form];

  if (!trim(body.email)) {
    return done(400, { error: "Email is required" }, next);
  }

  const lead = {
    source: detectSource(body, form),
    page_url: trim(body.page_url || req.headers.referer, 500),

    first_name: trim(body.first_name, 120),
    last_name: trim(body.last_name, 120),
    email: trim(body.email, 320),
    phone: trim(body.phone, 60),
    budget: trim(body.budget, 200),
    message: trim(body.message),

    property_name: trim(body.property_name, 300),

    meeting_format: trim(body.meeting_format, 100),
    preferred_date: asDate(body.preferred_date),
    preferred_time: trim(body.preferred_time, 100),
    project_interest: trim(body.project_interest, 200),

    raw: body,
  };

  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

  // The CRM write and the Formspree forward are independent on purpose:
  // whichever one fails, the other still happened.
  // A newsletter signup is not a lead. It goes to its own table, and a repeat
  // signup updates nothing rather than creating a second row.
  const isSubscriber = lead.source === "newsletter";

  const table = isSubscriber ? "subscribers" : "leads";
  const record = isSubscriber
    ? {
        email: lead.email,
        page_url: lead.page_url,
        signup_source: trim(body._form, 32),
        raw: body,
      }
    : lead;

  const toSupabase = (async () => {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error("lead: Supabase environment variables are missing");
      return false;
    }
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          "Content-Type": "application/json",
          // Signing up twice is not an error worth showing anyone.
          Prefer: isSubscriber
            ? "return=minimal,resolution=ignore-duplicates"
            : "return=minimal",
        },
        body: JSON.stringify(record),
      });
      if (!r.ok) {
        console.error(`lead: supabase rejected the ${table} insert`, r.status, await r.text());
        return false;
      }
      return true;
    } catch (err) {
      console.error("lead: could not reach supabase", err);
      return false;
    }
  })();

  const toFormspree = (async () => {
    if (!known) return false;
    try {
      const { _gotcha, _next, _form, ...fields } = body;
      const r = await fetch(`https://formspree.io/f/${form}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...fields, _subject: fields._subject || known.subject }),
      });
      if (!r.ok) console.error("lead: formspree rejected the forward", r.status);
      return r.ok;
    } catch (err) {
      console.error("lead: could not reach formspree", err);
      return false;
    }
  })();

  const [stored, emailed] = await Promise.all([toSupabase, toFormspree]);

  // The visitor is told it worked as long as we hold their enquiry somewhere.
  if (!stored && !emailed) {
    return done(502, { error: "Could not deliver" }, next);
  }
  return done(200, { ok: true, stored, emailed }, next);
}
