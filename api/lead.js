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
// check, required fields, hard length caps and a rate limit.
//
// Environment variables (Vercel only):
//   SUPABASE_URL
//   SUPABASE_SERVICE_KEY   service_role — bypasses RLS
// ---------------------------------------------------------------------------

import { DESTINATIONS, DESTINATION_COUNTRIES } from "../lib/destinations.js";

const ALLOWED_HOSTS = [
  "nqlgroup.com",
  "www.nqlgroup.com",
  "localhost",
  "127.0.0.1",
];

// Which form on the site a submission came from, and what it means. Keyed by
// the hidden _form field so a page cannot ask us to forward somewhere else.
// The keys are the IDs of the original Formspree forms, kept as names only:
// where the email goes is decided by FORMSPREE below, not by these.
const FORMS = {
  mkjwkbzq: { source: "contact", subject: "New contact enquiry - NQL Group" },
  mwleabqa: { source: "property", subject: "New property enquiry - NQL Group" },
  mnpalvzy: { source: "newsletter", subject: "New newsletter signup - NQL Group" },
  // The inline block on the listings pages. Same table, its own key, so the
  // subscribers list can say which ask actually earned the address.
  listings: { source: "newsletter", subject: "New newsletter signup - NQL Group" },
  xjybjroq: { source: "footer", subject: "New footer enquiry - NQL Group" },
  // Somebody asking to join the referral programme. Not a buyer, not a
  // client: their own list in the CRM, and the team rings them about terms.
  referrer: { source: "referrer", subject: "New referral programme sign-up - NQL Group" },
};

// Mirza's Formspree account, four forms, set up 30 Oct 2026. The old account
// was cancelled the same day, so nothing may be sent to the old IDs.
const FORMSPREE = {
  invest: "xeaalgzj",
  rent: "xeaalggj",
  buy: "xyeedwjq",
  contact: "xzeeargn",
};

// Which of the four gets the email. Rentals first, whatever else the
// submission says: Mirza wants every rental on the Rent form. Then what the
// visitor chose on the pipeline. Everything a buyer sends goes to Buy: the
// Purchase choice, a property page, the buyer mandate, an ad landing page,
// the country guide. Everything else, sellers, experiences, meeting requests
// and agencies among them, is a contact. Newsletter signups are not
// enquiries and get no email: they are in the subscribers list.
const BUYER_SOURCES = ["property", "mandate", "ads", "guide"];
function formspreeFor(lead, payload) {
  if (lead.source === "newsletter") return null;
  const purpose = String(payload.purpose || "").toLowerCase();
  if (lead.source === "rent" || purpose === "rent" || payload.enquiry_type === "Rental enquiry") return FORMSPREE.rent;
  if (purpose === "invest") return FORMSPREE.invest;
  if (purpose === "purchase" || purpose === "buy" || BUYER_SOURCES.includes(lead.source)) return FORMSPREE.buy;
  return FORMSPREE.contact;
}

function trim(value, max = 4000) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
}

/* A checkbox group posts one value per box, so the body carries an array.
   Joining them is the difference between "Villa, Farmhouse" and the string
   "[object Object]", which is what trim() would have made of it. */
function list(value, max = 400) {
  if (Array.isArray(value)) return trim(value.filter(Boolean).join(", "), max);
  return trim(value, max);
}

/* The trip questions (Mirza, 11 Nov 2026): what an owner needs before they
   hold a house over the holidays. Dates, who is coming, budget, the home, the
   flight, a little about the guest, and whether we are the only ones asked.
   Budget, must-haves and where they live have columns of their own; the rest
   is written as plain lines at the top of the message, so the brief reads
   them under "In their words" without a column for each. */
function day(value) {
  const d = asDate(value);
  if (!d) return null;
  return new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

function stayDates(body) {
  const a = day(body.arrival), b = day(body.departure);
  if (a && b) return `${a} to ${b}`;
  if (a) return `Arriving ${a}`;
  if (b) return `Leaving ${b}`;
  return null;
}

function tripLines(body) {
  const t = (k, max = 200) => trim(body[k], max);
  const lines = [];
  const dates = stayDates(body);
  if (dates) lines.push(`Dates: ${dates}`);

  const who = [];
  const adults = Number(t("adults", 4)), kids = Number(t("children", 4));
  if (adults) who.push(adults === 1 ? "1 adult" : `${adults} adults`);
  if (kids) who.push((kids === 1 ? "1 child" : `${kids} children`) + (t("children_ages") ? ` (ages ${t("children_ages")})` : ""));
  else if (t("children_ages")) who.push(`children aged ${t("children_ages")}`);
  if (t("pets")) who.push(`pets: ${t("pets")}`);
  if (who.length) lines.push(`Travelling: ${who.join(", ")}`);

  const home = [t("home_setting"), t("home_style") && `style: ${t("home_style")}`].filter(Boolean);
  if (home.length) lines.push(`Home: ${home.join(", ")}`);

  const fly = [t("jet_from") && `jet from ${t("jet_from")}`, t("jet_people", 4) && `${t("jet_people", 4)} flying`].filter(Boolean);
  if (fly.length) lines.push(`Flight: ${fly.join(", ")}`);

  const about = [t("age", 4) && `age ${t("age", 4)}`, t("occupation")].filter(Boolean);
  if (about.length) lines.push(`About them: ${about.join(", ")}`);

  if (t("working_with")) lines.push(`Working with: ${t("working_with")}`);
  return lines.length ? lines.join("\n") : null;
}

// Asking for a jet in the flight questions is asking us to arrange one.
function extrasWithJet(body) {
  const extras = Array.isArray(body.extras) ? body.extras.slice() : body.extras ? [body.extras] : [];
  if (trim(body.jet_from) && !extras.some((x) => /jet/i.test(String(x)))) extras.push("Private jet");
  return list(extras);
}

function asDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function detectSource(payload, form) {
  // An agency asking to see the system is not somebody buying a house, and
  // must not land in the pipeline as one.
  // An owner with a house to sell is not a buyer and must not reach the
  // agency board as one.
  if (payload.enquiry_type === "Seller enquiry") return "seller";
  // Somebody who wants a villa or a yacht for a week is not buying a house.
  // Their own list in the CRM, never on the agency board. The purpose check
  // catches any form that says Rent without the hidden field.
  if (payload.enquiry_type === "Rental enquiry" || payload.purpose === "Rent") return "rent";
  if (payload.enquiry_type === "Referral sign-up") return "referrer";
  if (payload.enquiry_type === "Agency demo") return "agency";
  if (payload.enquiry_type === "Ad landing") return "ads";
  if (payload.enquiry_type === "Buyer mandate") return "mandate";
  if (payload.enquiry_type === "Country guide") return "guide";
  if (payload.enquiry_type === "Meeting request") return "meeting";
  if (payload.property_name) return "property";
  if (form && FORMS[form]) return FORMS[form].source;
  if (payload.email && !payload.message && !payload.first_name) return "newsletter";
  return "contact";
}

/* How often one address may post.
 *
 * Without this, anyone with curl can fill the pipeline with rubbish and burn
 * the Formspree quota on the way. A person filling in a form does not submit
 * six times in a minute; something automated does.
 *
 * In memory, which on a serverless host means per warm instance rather than
 * globally. That is a real limit on what it can stop, and it is still enough
 * to make a naive flood pointless. A determined attacker needs a shared store,
 * and that is worth building the day somebody tries.
 */
const RATE_WINDOW_MS = 60000;
const RATE_MAX = 5;
const recent = new Map();

function rateLimited(req) {
  // x-forwarded-for is a list; the first entry is the client as the proxy saw
  // it. Anything further along was set by whoever sent the request.
  const ip = String(req.headers["x-forwarded-for"] || "")
    .split(",")[0]
    .trim() || req.socket?.remoteAddress || "unknown";

  const now = Date.now();
  const hits = (recent.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  hits.push(now);
  recent.set(ip, hits);

  // Keep the map from growing without bound on a long lived instance.
  if (recent.size > 5000) {
    for (const [key, times] of recent) {
      if (!times.length || now - times[times.length - 1] > RATE_WINDOW_MS) {
        recent.delete(key);
      }
    }
  }

  return hits.length > RATE_MAX;
}

/* Where the buyer is looking.
 *
 * The CRM needs this on every lead: an agency restricted to Italy never sees a
 * lead with no country, so a Cyprus enquiry that arrives blank is invisible to
 * the very agencies that should have it.
 *
 * Three passes, most trustworthy first. What the buyer chose beats what we
 * infer from the page they were on, and either beats nothing.
 */
// Everywhere we work: the Mediterranean, where the houses are sold, and the
// 49 countries of the rental list in lib/destinations.js.
const COUNTRIES = [
  "Italy", "Spain", "Portugal", "France", "Greece", "Cyprus",
  "Malta", "Croatia", "Montenegro", "Turkey", "Morocco",
  ...DESTINATION_COUNTRIES,
].filter((c, i, all) => all.indexOf(c) === i);

// The place a visitor picked on the Destinations page arrives as
// location_detail ("Bali, Indonesia"), and names its country outright.
const PLACE_COUNTRY = new Map(
  DESTINATIONS.filter((d) => d.country).map((d) => [d.place.toLowerCase(), d.country])
);

// Words that only appear on one country's pages. The Italian ones are the
// regions and provinces in data.js; the Cyprus ones are the two projects and
// the towns they sit in.
const COUNTRY_HINTS = [
  // One Cyprus. The Habitat project sits in the north of the island and the
  // pages say so, but as a country to file a buyer under it is Cyprus.
  ["Cyprus", /cyprus|habitat|kyrenia|girne|esentepe|iskele|famagusta|limassol|paphos|larnaca/i],
  ["Italy",           /ital(y|ia|ian)|tuscan|toscana|umbria|sicil|campania|puglia|apulia|marche|liguria|lazio|piedmont|assisi|cortona|siena|florence|firenze|perugia|arezzo|grosseto|chianti|maremma|lucca|pisa|todi|montepulciano|volterra|salerno|ragusa|vasanello/i],
  ["Spain",           /spain|espa|andaluc|marbella|mallorca|ibiza|costa del sol|valencia|alicante/i],
  ["Portugal",        /portugal|algarve|lisbon|lisboa|porto|cascais/i],
  ["France",          /france|proven|riviera|c[oô]te d.azur|nice|antibes|c[aâ]nnes/i],
  ["Greece",          /greece|greek|crete|corfu|santorini|mykonos|pelop/i],
  ["Malta",           /malta|gozo|valletta/i],
  ["Croatia",         /croatia|dalmat|split|dubrovnik|istria/i],
  ["Montenegro",      /montenegro|kotor|budva|tivat/i],
  ["Turkey",          /turkey|t[uü]rkiye|bodrum|fethiye|antalya/i],
  ["Morocco",         /morocco|marrakech|essaouira|tangier/i],
  // Then every rental destination: the country's name and each of its places
  // ("Bali" is Indonesia, "Gstaad" is Switzerland). Built from the list, so a
  // new destination is recognised the day it is added to data/destinations.txt.
  ...destinationHints(),
];

function destinationHints() {
  const byCountry = new Map();
  for (const d of DESTINATIONS) {
    if (!d.country) continue;
    const words = byCountry.get(d.country) || new Set([d.country]);
    const town = d.place.split(", ")[0];
    if (town !== d.country && !/^Rest of /.test(town)) words.add(town);
    byCountry.set(d.country, words);
  }
  const escape = (w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [...byCountry].map(([country, words]) => [
    country,
    new RegExp("\\b(" + [...words].map(escape).join("|") + ")\\b", "i"),
  ]);
}

function detectCountry(payload) {
  // 1. What they picked. Only a name we recognise, so a stray value cannot
  //    invent a country no agency can be assigned to.
  const chosen = trim(payload.country, 60);
  if (chosen) {
    const match = COUNTRIES.find((c) => c.toLowerCase() === chosen.toLowerCase());
    if (match) return match;
  }
  const place = trim(payload.location_detail || payload.place, 120);
  if (place && PLACE_COUNTRY.has(place.toLowerCase())) return PLACE_COUNTRY.get(place.toLowerCase());

  // 2. What they were enquiring about. A property in Cortona is Italy whether
  //    or not anybody typed the word.
  const about = [
    payload.property_name,
    payload.project_interest,
    payload.location_detail,
    Array.isArray(payload.kinds) ? payload.kinds.join(" ") : payload.kinds,
  ]
    .filter(Boolean)
    .join(" ");
  for (const [country, pattern] of COUNTRY_HINTS) {
    if (pattern.test(about)) return country;
  }

  // 3. The page they were on. Weakest of the three, which is why it is last:
  //    a landing page says which campaign brought them, not where they want
  //    to buy, and the two usually but not always agree.
  const url = String(payload.page_url || "");
  for (const [country, pattern] of COUNTRY_HINTS) {
    if (pattern.test(url)) return country;
  }

  return null;
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

  if (rateLimited(req)) {
    // 429 rather than a silent success: a real person who double clicked
    // should be told, and a script should be told to stop.
    return done(429, { error: "Too many submissions. Try again in a minute." }, next);
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
    message: trim([tripLines(body), trim(body.message)].filter(Boolean).join("\n\n")),

    property_name: trim(body.property_name, 300),
    country: detectCountry(body),

    meeting_format: trim(body.meeting_format, 100),
    preferred_date: asDate(body.preferred_date),
    preferred_time: trim(body.preferred_time, 100),
    project_interest: trim(body.project_interest, 200),

    // The mandate, one column per question. Folding these into the message
    // made the brief unreadable by anything but a person, and meant the only
    // way to show an agency what somebody wants was to show them the message.
    based_in: trim(body.based_in, 120),
    location_detail: trim(body.location_detail, 500),
    property_kinds: list(body.kinds),
    bedrooms: trim(body.bedrooms, 60),
    land: trim(body.land, 60),
    must_haves: list(body.must_haves),
    // What else to arrange around it: jet, car, chef, boat. Ticked on the
    // contact form; one line on the lead so the right people get briefed.
    extras: extrasWithJet(body),
    dealbreakers: trim(body.dealbreakers, 500),
    timeline: trim(body.timeline, 100) || stayDates(body),

    // Where they came from: the ad link's tags, kept for the visit by
    // js/source.js. Empty for Google, a typed address or a shared link.
    utm_source: trim(body.utm_source, 100),
    utm_medium: trim(body.utm_medium, 100),
    utm_campaign: trim(body.utm_campaign, 100),
    purpose: trim(body.purpose, 120),

    raw: body,
  };

  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

  // The CRM write and the Formspree forward are independent on purpose:
  // whichever one fails, the other still happened.
  // A newsletter signup is not a lead. It goes to its own table, and a repeat
  // signup updates nothing rather than creating a second row.
  const isSubscriber = lead.source === "newsletter";

  // An enquirer who ticked the box joins the mailing list as well as the
  // pipeline. Only when they ticked it: the privacy policy says newsletter
  // addresses rest on consent and are kept apart from enquiries, and adding
  // people silently would make that sentence untrue.
  const alsoSubscribe =
    !isSubscriber &&
    ["on", "true", "yes", "1"].includes(
      String(body.newsletter_opt_in || "").toLowerCase()
    ) &&
    !!lead.email;

  const table = isSubscriber ? "subscribers" : "leads";
  const record = isSubscriber
    ? {
        // Stored lower case so the unique index on lower(email) and the list
        // you export agree about what one address is.
        email: lead.email.toLowerCase(),
        page_url: lead.page_url,
        signup_source: trim(body._form, 32),
        raw: body,
      }
    : lead;

  // The funnel saves as it goes: once an email is in, each later answer is
  // sent again with the rest. A second submission from the same address
  // within two hours updates that lead rather than making another, so a
  // person who stops at question five still exists once, with five answers.
  const partial = String(body.funnel_stage || "") === "partial";
  const sb = { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` };
  // The lead this submission continues, if any: the same address, within two
  // hours, from the same kind of form. The same kind matters. A rental
  // enquiry followed by a footer message is two leads, not one; merging them
  // moved a rental out of the Rentals list on 30 Oct 2026 and renamed it
  // after whichever form came last.
  async function recentLeadId() {
    if (isSubscriber || !lead.email) return null;
    const since = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
    const q = `leads?select=id,source&email=ilike.${encodeURIComponent(lead.email)}&created_at=gte.${encodeURIComponent(since)}&order=created_at.desc&limit=1`;
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, { headers: sb });
    if (!r.ok) return null;
    const rows = await r.json();
    return rows[0] && rows[0].source === lead.source ? rows[0].id : null;
  }

  // Before db/utm.sql has run the leads table has no utm columns, and
  // PostgREST refuses the whole row for one unknown column (PGRST204). Then
  // the lead is written without them; raw still carries the tags.
  const UTM = ["utm_source", "utm_medium", "utm_campaign"];
  const withoutUtm = (o) => { const c = { ...o }; UTM.forEach((k) => delete c[k]); return c; };
  const unknownColumn = (status, detail) => status === 400 && /PGRST204|utm_/.test(detail);

  const toSupabase = (async () => {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error("lead: Supabase environment variables are missing");
      return false;
    }
    try {
      const existing = await recentLeadId();
      if (existing) {
        // Only what was answered this time; never blank a field with null.
        const patch = {};
        for (const [k, v] of Object.entries(record)) if (v !== null && v !== undefined && k !== "raw") patch[k] = v;
        patch.raw = body;
        const merge = (p) => fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${existing}`, {
          method: "PATCH",
          headers: { ...sb, "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify(p),
        });
        let r = await merge(patch);
        if (!r.ok) {
          const detail = await r.text();
          if (unknownColumn(r.status, detail)) r = await merge(withoutUtm(patch));
          if (!r.ok) console.error("lead: supabase rejected the merge", r.status, detail);
        }
        return r.ok;
      }
      const insert = (row) => fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
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
        body: JSON.stringify(row),
      });
      let r = await insert(record);
      if (!r.ok && table === "leads") {
        const first = await r.clone().text();
        if (unknownColumn(r.status, first)) r = await insert(withoutUtm(record));
      }
      if (!r.ok) {
        const detail = await r.text();
        // Someone signing up twice is already on the list, which is the state
        // we wanted. PostgREST cannot infer a conflict target from the index
        // on lower(email), so it raises the unique violation rather than
        // quietly ignoring it. Treat that as the success it is.
        const duplicate =
          isSubscriber && (r.status === 409 || detail.includes("23505"));
        if (duplicate) return true;
        console.error(`lead: supabase rejected the ${table} insert`, r.status, detail);
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
    // A save-as-you-go is not a finished enquiry. The email goes once, at the end.
    if (partial) return false;
    const target = formspreeFor(lead, body);
    if (!target) return false;
    try {
      const { _gotcha, _next, _form, ...fields } = body;
      // Say where it comes from, as a browser would. Without it every
      // forward looked like a bot to Formspree and went to its Spam tab,
      // which sends no email (13 Nov 2026).
      const r = await fetch(`https://formspree.io/f/${target}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Origin: "https://www.nqlgroup.com",
          Referer: lead.page_url && /^https:\/\/(www\.)?nqlgroup\.com\//.test(lead.page_url) ? lead.page_url : "https://www.nqlgroup.com/",
        },
        body: JSON.stringify({ ...fields, _subject: fields._subject || known.subject }),
      });
      if (!r.ok) console.error("lead: formspree rejected the forward", r.status);
      return r.ok;
    } catch (err) {
      console.error("lead: could not reach formspree", err);
      return false;
    }
  })();

  // Runs alongside, and its failure never costs us the enquiry itself.
  const toNewsletter = (async () => {
    if (!alsoSubscribe || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) return false;
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/subscribers`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal,resolution=ignore-duplicates",
        },
        body: JSON.stringify({
          email: lead.email.toLowerCase(),
          page_url: lead.page_url,
          signup_source: "enquiry opt in",
          raw: { consented_with: lead.source },
        }),
      });
      if (r.ok) return true;
      const detail = await r.text();
      return r.status === 409 || detail.includes("23505");
    } catch (err) {
      console.error("lead: could not add the subscriber", err);
      return false;
    }
  })();

  // A text and a short email the moment a lead lands, so somebody can ring
  // them while they are still at their screen (Mirza, 13 Nov 2026). Each
  // channel is off until its keys are set in Vercel:
  //   SMS    TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM (the Twilio
  //          number), LEAD_ALERT_SMS (who gets it, comma separated, +354...)
  //   email  RESEND_API_KEY, LEAD_ALERT_EMAIL (comma separated), and
  //          LEAD_ALERT_FROM if not "NQL Leads <leads@nqlgroup.com>"
  // Five seconds at most, and a failure never costs the enquiry.
  const toAlert = (async () => {
    if (isSubscriber || partial || !known) return false;
    const env = process.env;
    const name = [lead.first_name, lead.last_name].filter(Boolean).join(" ") || lead.email;
    const what = [lead.project_interest || lead.purpose || lead.source, lead.location_detail, lead.timeline]
      .filter(Boolean).join(", ");
    const text = [
      `New lead: ${name}`,
      what,
      lead.phone ? `Call ${lead.phone}` : "No phone given",
      lead.email,
      lead.utm_campaign ? `From the ${lead.utm_campaign} ad` : null,
      "nqlgroup.com/crm",
    ].filter(Boolean).join("\n");
    const list = (v) => String(v || "").split(",").map((x) => x.trim()).filter(Boolean);
    const sent = [];
    const smsTo = list(env.LEAD_ALERT_SMS);
    if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM && smsTo.length) {
      const auth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString("base64");
      for (const to of smsTo) {
        sent.push(fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`, {
          method: "POST",
          headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ To: to, From: env.TWILIO_FROM, Body: text.slice(0, 600) }).toString(),
          signal: AbortSignal.timeout(5000),
        }).then((r) => { if (!r.ok) console.error("lead: twilio refused the text", r.status); return r.ok; }));
      }
    }
    const mailTo = list(env.LEAD_ALERT_EMAIL);
    if (env.RESEND_API_KEY && mailTo.length) {
      sent.push(fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: env.LEAD_ALERT_FROM || "NQL Leads <leads@nqlgroup.com>",
          to: mailTo,
          subject: `New lead: ${name}${lead.phone ? ", " + lead.phone : ""}`,
          text,
        }),
        signal: AbortSignal.timeout(5000),
      }).then((r) => { if (!r.ok) console.error("lead: resend refused the alert", r.status); return r.ok; }));
    }
    if (!sent.length) return false;
    const results = await Promise.allSettled(sent);
    return results.some((r) => r.status === "fulfilled" && r.value);
  })();

  const [stored, emailed] = await Promise.all([toSupabase, toFormspree, toNewsletter, toAlert]);

  // The visitor is told it worked as long as we hold their enquiry somewhere.
  if (!stored && !emailed) {
    return done(502, { error: "Could not deliver" }, next);
  }
  return done(200, { ok: true, stored, emailed }, next);
}
