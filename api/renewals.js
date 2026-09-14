// Renewal alerts for partner agreements.
//
// Vercel runs this once a day (see vercel.json). For every fixed term
// agreement it looks at the contract end date and the notice deadline, and at
// 120, 60 and 30 days out it sends one email and records that it did, so the
// same warning never goes twice.
//
// Environment:
//   SUPABASE_URL, SUPABASE_SERVICE_KEY   as for api/lead.js
//   CRON_SECRET                          Vercel sends it as a bearer token
//   RENEWAL_ALERT_TO                     comma separated recipients
//                                        (default: oskar@nordicql.com, info@nordicql.com)
//   RESEND_API_KEY, RENEWAL_ALERT_FROM   if set, mail goes out through Resend
//                                        to those recipients; otherwise it goes
//                                        through the Formspree contact form,
//                                        which delivers to the form's owner.

const MILESTONES = [120, 60, 30];

// Which alerts are due today for one agreement. Pure, so it can be tested.
// An alert is due when the milestone has been reached and not yet sent; the
// job runs daily, so "reached" is "at or below", which also covers a day the
// job did not run.
function milestonesDue(a, today, sent) {
  const out = [];
  const day = (iso) => Math.round((new Date(iso) - new Date(today)) / 86400000);
  for (const [field, key] of [["contract_end_date", "end"], ["notice_deadline", "notice"]]) {
    if (!a[field]) continue;
    const left = day(a[field]);
    for (const m of MILESTONES) {
      const tag = `${key}-${m}`;
      if (left <= m && left > (MILESTONES[MILESTONES.indexOf(m) + 1] || -1) && !sent.has(tag))
        out.push({ tag, field, left, milestone: m });
    }
  }
  return out;
}

function subject(a, d) {
  const what = d.field === "notice_deadline" ? "notice deadline" : "contract end";
  return `${a.partner_name}: ${what} in ${d.left} day${d.left === 1 ? "" : "s"}`;
}

function body(a, d) {
  const lines = [
    `${a.partner_name} (${a.agreement_type}, ${a.term_type.replace("_", " ")})`,
    ``,
    `Contract end date: ${a.contract_end_date}`,
    `Notice deadline:   ${a.notice_deadline || "none"}${a.notice_is_internal ? " (internal review trigger, not contractual)" : ""}`,
    `Auto renews by:    ${a.auto_renew_months || "?"} months if no notice is given`,
    ``,
    d.field === "notice_deadline"
      ? `Written notice must be given by ${a.notice_deadline} to stop the renewal.`
      : `The current term ends on ${a.contract_end_date}.`,
    a.warnings ? `` : null,
    a.warnings ? `Warning on file: ${a.warnings}` : null,
    ``,
    `Open the agreement in the CRM: https://nqlproperties.com/crm/`,
  ].filter((l) => l !== null);
  return lines.join("\n");
}

async function send(env, to, subj, text) {
  if (env.RESEND_API_KEY) {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.RENEWAL_ALERT_FROM || "NQL CRM <crm@nqlproperties.com>",
        to, subject: subj, text,
      }),
    });
    if (!r.ok) throw new Error(`resend ${r.status}: ${await r.text()}`);
    return "resend";
  }
  // The contact form's Formspree endpoint, the same channel leads use. It
  // delivers to whoever owns that form, which is the office inbox.
  const r = await fetch("https://formspree.io/f/mkjwkbzq", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: "crm@nqlproperties.com", message: text, _subject: `[Renewal] ${subj}`, _replyto: to[0] }),
  });
  if (!r.ok) throw new Error(`formspree ${r.status}`);
  return "formspree";
}

export default async function handler(req, res) {
  const env = process.env;
  if (env.CRON_SECRET && req.headers.authorization !== `Bearer ${env.CRON_SECRET}`)
    return res.status(401).json({ ok: false, error: "unauthorised" });
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY)
    return res.status(500).json({ ok: false, error: "supabase environment missing" });

  const headers = { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` };
  const get = async (path) => {
    const r = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { headers });
    if (!r.ok) throw new Error(`${path}: ${r.status}`);
    return r.json();
  };

  const rows = await get(
    "partner_agreements?select=id,agreement_type,term_type,status,contract_end_date,notice_deadline,auto_renew_months,notice_is_internal,warnings,partners(name)" +
    "&term_type=eq.fixed_auto_renew&status=in.(active,unsigned)&contract_end_date=not.is.null"
  );
  const alerts = await get("agreement_alerts?select=agreement_id,milestone");
  const sentFor = new Map();
  alerts.forEach((x) => { if (!sentFor.has(x.agreement_id)) sentFor.set(x.agreement_id, new Set()); sentFor.get(x.agreement_id).add(x.milestone); });

  const to = String(env.RENEWAL_ALERT_TO || "oskar@nordicql.com, info@nordicql.com").split(",").map((s) => s.trim()).filter(Boolean);
  const today = new Date().toISOString().slice(0, 10);
  const report = [];

  for (const row of rows) {
    const a = { ...row, partner_name: row.partners ? row.partners.name : "Partner" };
    for (const d of milestonesDue(a, today, sentFor.get(a.id) || new Set())) {
      try {
        const via = await send(env, to, subject(a, d), body(a, d));
        const r = await fetch(`${env.SUPABASE_URL}/rest/v1/agreement_alerts`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({ agreement_id: a.id, milestone: d.tag, sent_to: to.join(", ") }),
        });
        report.push({ partner: a.partner_name, alert: d.tag, via, recorded: r.ok });
      } catch (err) {
        report.push({ partner: a.partner_name, alert: d.tag, error: String(err.message || err) });
      }
    }
  }
  res.status(200).json({ ok: true, today, checked: rows.length, sent: report });
}

export { milestonesDue };
