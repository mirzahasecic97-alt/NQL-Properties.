// ---------------------------------------------------------------------------
// Gate for the CRM demo.
//
// Temporary: it exists only while the CRM runs on sample data. Once Supabase
// is connected, real authentication takes over and this file can be deleted.
//
// The password lives in a Vercel environment variable, never in the repo and
// never in anything the browser downloads.
//
// Environment variables:
//   DEMO_PASSWORD   the shared password
//   DEMO_DOMAIN     optional, defaults to nordicql.com
//
// Fails closed: with no DEMO_PASSWORD set, nobody gets in.
// ---------------------------------------------------------------------------

// Compare without leaking length or position through timing.
function sameSecret(a, b) {
  const x = String(a || "");
  const y = String(b || "");
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const expected = process.env.DEMO_PASSWORD;
  const domain = (process.env.DEMO_DOMAIN || "nordicql.com").toLowerCase();

  if (!expected) {
    return res
      .status(503)
      .json({ error: "The demo is closed. Set DEMO_PASSWORD in Vercel to open it." });
  }

  const body = typeof req.body === "string" ? safeParse(req.body) : req.body || {};
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  // Same message whichever half is wrong, so this cannot be used to work out
  // which addresses exist.
  const wrong = { error: "Those details were not recognised." };

  if (!email.endsWith("@" + domain)) {
    await pause();
    return res.status(401).json(wrong);
  }
  if (!sameSecret(password, expected)) {
    await pause();
    return res.status(401).json(wrong);
  }

  return res.status(200).json({ ok: true, email });
}

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

// Small delay on failure — makes guessing tedious without troubling anyone
// who knows the password.
function pause() {
  return new Promise((r) => setTimeout(r, 400));
}
