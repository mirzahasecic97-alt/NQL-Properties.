/* ---------------------------------------------------------------------------
   NQL Properties — the checks that run before a push.
   Run with:  ./test/run

   Not a test suite. A list of the things that have actually broken, so that
   each one breaks loudly once and never quietly again. Every assertion below
   corresponds to a real bug that reached the live site.

   No framework, because there is no build step and adding one to run thirty
   assertions would be the tail wagging the dog.
   --------------------------------------------------------------------------- */

ObjC.import("Foundation");

const ROOT = "/Users/mirzahasecic/Downloads/NQL";

function read(rel) {
  const s = $.NSString.stringWithContentsOfFileEncodingError(
    ROOT + "/" + rel, $.NSUTF8StringEncoding, null
  );
  return s ? ObjC.unwrap(s) : null;
}

let failures = [];
let passes = 0;

function check(name, fn) {
  try {
    const problem = fn();
    if (problem) failures.push(name + "\n      " + problem);
    else passes++;
  } catch (e) {
    failures.push(name + "\n      threw: " + e.message);
  }
}

/* Load a browser file into a scope with the globals it touches at load time,
   so its functions can be called directly. */
function load(rel) {
  const stubs = `
    var localStorage = { getItem:function(){return null;}, setItem:function(){}, removeItem:function(){} };
    var document = { addEventListener:function(){}, getElementById:function(){return null;}, querySelectorAll:function(){return [];} };
    var window = { addEventListener:function(){} };
  `;
  // Function declarations inside a new Function are local to it, so they have
  // to be handed back by name rather than fished out of `this`.
  return new Function(
    stubs + read(rel) +
    "\n;return { infoScore, effectiveScore, matchBand, money, leadKind, isQuiet, mandateMissing, leadNo };"
  );
}

const crmJs = read("crm/app.js");
const crmHtml = read("crm/index.html");
const partnerJs = read("partner/app.js");
const partnerHtml = read("partner/index.html");

/* ------------------------------------------------------------ 1. it parses */

["crm/app.js", "partner/app.js"].forEach((f) =>
  check(f + " parses", () => {
    new Function(read(f));
    return null;
  })
);

check("api/lead.js parses", () => {
  new Function(read("api/lead.js").replace(/^export default /m, ""));
  return null;
});

/* ------------------------------------------- 2. every $("id") exists in the DOM
   Caught nothing yet, but it is the cheapest guard against a renamed element. */

function danglingIds(js, html) {
  const used = new Set([...js.matchAll(/\$\("([^"]+)"\)/g)].map((m) => m[1]));
  const declared = new Set([
    ...html.matchAll(/id="([^"]+)"/g),
    ...js.matchAll(/id="([^"]+)"/g),
  ].map((m) => m[1]));
  const missing = [...used].filter((id) => !declared.has(id));
  return missing.length ? "not in the page: " + missing.join(", ") : null;
}

check("crm ids all exist", () => danglingIds(crmJs, crmHtml));
check("portal ids all exist", () => danglingIds(partnerJs, partnerHtml));

/* --------------------------------------------- 3. the loaders are actually called
   loadActivity, loadRequests and loadControl have each shipped uncalled,
   because they were inserted by anchoring on a line that appears many times.
   Every one of those was silent: the feature simply did nothing. */

check("every loader runs at sign in", () => {
  const start = crmJs.indexOf("async function load(s)");
  const end = crmJs.indexOf("\n/* ------", start);
  const body = crmJs.slice(start, end);
  const wanted = ["loadActivity", "loadTasks", "loadRequests", "loadControl", "loadPresence"];
  const missing = wanted.filter((n) => !body.includes("await " + n + "()"));
  return missing.length ? "never called from load(): " + missing.join(", ") : null;
});

/* ------------------------------------- 4. no function reads a variable it lacks
   openPartner called duplicateBanner(l) for days. There is no l in that
   scope, so every click on an agency threw and the drawer never opened. */

check("openPartner has no free variables", () => {
  const start = crmJs.indexOf("function openPartner");
  const end = crmJs.indexOf("\nasync function addPartner");
  const body = crmJs.slice(start, end);
  return /duplicateBanner\(l\)/.test(body)
    ? "calls duplicateBanner(l), and there is no l here"
    : null;
});

/* --------------------------------------------------- 5. the numbers are right */

const crm = load("crm/app.js")();

check("a full mandate scores 100", () => {
  const full = {
    first_name: "Patrick", last_name: "Campi", email: "p@x.com", phone: "+41",
    country: "Italy", budget: "1.5M", property_name: "Villa", message: "Hello",
  };
  const n = crm.infoScore(full);
  return n === 100 ? null : "got " + n;
});

check("an empty lead scores 0", () => {
  const n = crm.infoScore({ first_name: "  ", email: "" });
  return n === 0 ? null : "got " + n;
});

check("a hand set score beats the count", () => {
  const n = crm.effectiveScore({ email: "a@b.c", match_score: 95 });
  return n === 95 ? null : "got " + n;
});

check("bands fall where the SQL says", () => {
  const cases = [[100, "hot"], [80, "hot"], [79, "warm"], [50, "warm"], [49, "limited"], [1, "limited"], [0, null]];
  const wrong = cases.filter(([n, want]) => crm.matchBand(n) !== want);
  return wrong.length ? wrong.map(([n, w]) => n + " should be " + w + ", got " + crm.matchBand(n)).join("; ") : null;
});

check("money reads the way people say it", () => {
  const cases = [[850, "€850"], [4500, "€5k"], [999999, "€1M"],
                 [1000000, "€1M"], [1450000, "€1.45M"], [2000000, "€2M"], [0, ""]];
  const wrong = cases.filter(([n, want]) => crm.money(n) !== want);
  return wrong.length ? wrong.map(([n, w]) => n + " should be " + w + ", got " + crm.money(n)).join("; ") : null;
});

check("footer and meeting are not leads", () => {
  const want = {
    footer: "message", meeting: "meeting", newsletter: "newsletter",
    mandate: "lead", property: "lead", ads: "lead", contact: "lead",
    manual: "lead", guide: "lead", phone: "lead", referral: "lead",
    partner: "lead", event: "lead",
  };
  const wrong = Object.keys(want).filter((k) => crm.leadKind({ source: k }) !== want[k]);
  return wrong.length ? wrong.join(", ") + " classified wrongly" : null;
});

check("a message can never go quiet", () => {
  const old = { source: "footer", stage: "new", created_at: "2020-01-01T00:00:00Z" };
  return crm.isQuiet(old) ? "a footer message from 2020 is flagged as a neglected lead" : null;
});

/* ------------------------------------------------- 6. country detection works */

const leadSrc = read("api/lead.js");
const detect = new Function(
  "function trim(v,m){ if(v==null) return null; var s=String(v).trim(); return s?s:null; }\n" +
  leadSrc.slice(leadSrc.indexOf("const COUNTRIES = ["), leadSrc.indexOf("// Never bounce a visitor")) +
  "\nreturn detectCountry;"
)();

check("country is found from every route", () => {
  const cases = [
    [{ country: "Greece" }, "Greece"],
    [{ project_interest: "Habitat Premium, North Cyprus" }, "Northern Cyprus"],
    [{ property_name: "Casa Icaro", location_detail: "Tuscany, Arezzo, Cortona" }, "Italy"],
    [{ property_name: "Frescoed apartment", location_detail: "Umbria, Perugia, Todi" }, "Italy"],
    [{ page_url: "https://nqlproperties.com/lp-italy-en" }, "Italy"],
    [{ country: "Narnia" }, null],
    [{ message: "hello" }, null],
  ];
  const wrong = cases.filter(([p, want]) => (detect(p) || null) !== want);
  return wrong.length ? wrong.map(([p, w]) => JSON.stringify(p) + " should be " + w).join("; ") : null;
});

/* --------------------------------------- 7. the SQL defines before it references
   partner_board was created above the table it counts, so the whole migration
   stopped there and none of the policies after it ran. */

check("every migration defines things before using them", () => {
  const files = ["partner-portal.sql", "lead-match.sql", "partner-countries.sql",
                 "board-leads-only.sql", "lead-info-score.sql", "retention.sql"];
  const problems = [];
  files.forEach((f) => {
    const sql = read("db/" + f);
    if (!sql) return;
    [...sql.matchAll(/create table if not exists (\w+)/g)].forEach((m) => {
      const first = sql.indexOf(m[1]);
      if (first < m.index - 60) problems.push(f + ": " + m[1] + " is used before it is created");
    });
  });
  return problems.length ? problems.join("; ") : null;
});

/* ------------------------------- 8. the two board definitions cannot disagree
   Running one file after the other silently dropped a column from the board. */

function boardColumns(file) {
  const sql = read("db/" + file);
  const i = sql.indexOf("create view partner_board");
  if (i < 0) return [];
  const body = sql.slice(i, sql.indexOf("  from leads l", i));
  // A column is either "<something> as name" or a bare l.column. The alias
  // often lands on the line that closes a multi line expression, so a filter
  // that skips lines beginning with ")" loses match_band and asked, and does
  // it identically in both files, which is how the mistake stayed invisible.
  return body.split("\n").map((l) => l.trim().replace(/,$/, ""))
    .map((l) => {
      const alias = l.match(/\bas (\w+)$/);
      if (alias) return alias[1];
      return /^l\.\w+$/.test(l) ? l.slice(2) : null;
    })
    .filter(Boolean);
}

check("every partner_board definition matches", () => {
  // Three files now create this view. Running any of them after another must
  // not silently strip a column the portal draws.
  // Only the current definition is authoritative. The earlier files are kept
  // for a fresh project and are superseded in order, so they are checked
  // against their own successor rather than against each other.
  const files = ["mandate-fields.sql"];
  const seen = files.map((f) => [f, boardColumns(f).join(",")]);
  const first = seen[0][1];
  const off = seen.filter(([, cols]) => cols !== first);
  return off.length
    ? seen.map(([f, c]) => f + ": " + c).join("\n      ")
    : null;
});

/* ------------------------------------------------ 9. the portal leaks nothing */

check("the portal never queries the leads table", () => {
  return /api\(\s*[`"']leads/.test(partnerJs)
    ? "partner/app.js reads `leads` directly; it must go through the views"
    : null;
});

check("the board returns nothing that names the person", () => {
  // What matters is what the view outputs, not what it reads: info_score()
  // reads the phone number to count whether one was given, which is not the
  // same as handing it to an agency.
  //
  // `message` is back on this list and stays there. It is free text, so it
  // carries whatever the buyer chose to type, their name and telephone number
  // included, and it is also where we keep what they said to us rather than
  // what they want. The structured answers say everything an agency needs.
  // page_url stays out because a campaign tag can identify somebody to whoever
  // placed the ad, and raw because it is a complete copy of the submission.
  const forbidden = ["first_name", "last_name", "email", "phone", "message", "raw", "page_url"];
  const boards = ["mandate-fields.sql"];
  const bad = [];
  boards.forEach((f) => {
    boardColumns(f).filter((c) => forbidden.includes(c))
      .forEach((c) => bad.push(f + " returns " + c));
  });
  return bad.length ? bad.join("; ") : null;
});

check("the board still returns what the portal draws", () => {
  const need = ["id", "lead_no", "country", "budget_band", "match_band", "stage",
                "asked", "budget", "location_detail", "property_kinds",
                "bedrooms", "land", "must_haves", "dealbreakers", "purpose",
                "timeline", "based_in"];
  const have = boardColumns("mandate-fields.sql");
  const missing = need.filter((c) => !have.includes(c));
  return missing.length ? "the portal reads " + missing.join(", ") + ", which the board no longer returns" : null;
});

/* ---------------------------------------- 10. the restriction is in the database
   Hiding a tab is not access control. If a policy ever goes back to letting
   any signed-in staff read every lead, this is the check that says so. */

check("a salesperson is restricted by policy, not by the interface", () => {
  const sql = read("db/staff-restricted.sql");
  const problems = [];

  const leadRead = /create policy "staff read leads"[\s\S]*?;/.exec(sql);
  if (!leadRead) problems.push("no read policy on leads");
  else if (!/assigned_to = auth\.uid\(\)/.test(leadRead[0]))
    problems.push("the leads read policy does not test assigned_to");

  ["lead_notes", "lead_reminders"].forEach((t) => {
    if (!new RegExp('on ' + t + ' for select[\\s\\S]*?can_see_lead').test(sql))
      problems.push(t + " does not go through can_see_lead");
  });

  ["subscribers", "partner_interest"].forEach((t) => {
    if (!new RegExp(t + '[\\s\\S]{0,400}?is_full_staff').test(sql))
      problems.push(t + " is not limited to full staff");
  });

  if (!/security definer/.test(sql)) problems.push("can_see_lead is not security definer, so it will recurse");

  return problems.length ? problems.join("; ") : null;
});

check("the role names agree between the CRM and the database", () => {
  const sql = read("db/staff-restricted.sql");
  const inSql = (/check \(role in \(([^)]+)\)\)/.exec(sql) || [])[1] || "";
  const wanted = ["owner", "admin", "sales"];
  const missing = wanted.filter((r) => !inSql.includes("'" + r + "'"));
  if (missing.length) return "the constraint does not allow " + missing.join(", ");

  const js = read("crm/app.js");
  const roles = [...js.matchAll(/\["(owner|admin|sales)", "/g)].map((m) => m[1]);
  const off = wanted.filter((r) => !roles.includes(r));
  return off.length ? "the panel does not offer " + off.join(", ") : null;
});

/* --------------------------- 11. a write that changes nothing is not a success
   PostgREST answers an update whose rows fail the policy with 204 and an empty
   body. Every control on the panel took that as success and redrew the old
   value, which is how assigning somebody to Sales did nothing and said
   nothing. */

check("every control-panel write checks that it changed something", () => {
  const js = read("crm/app.js");
  const start = js.indexOf("function setRole(");
  const end = js.indexOf("async function addStaffByEmail");
  const body = js.slice(start, end);
  const writes = [...body.matchAll(/withControl\([^,]+,\s*\(\)\s*=>\s*\n?\s*(\w+)\(/g)]
    .map((m) => m[1]);
  const raw = writes.filter((w) => w !== "mustAffect");
  return raw.length
    ? raw.length + " write(s) still call " + [...new Set(raw)].join(", ") + " directly, so a refusal reads as success"
    : null;
});

/* ------------------------------------- 12. one list decides what a role sees
   Every tab used to carry its own flag, repeated inside navClass because
   rebuilding className wipes what was set elsewhere. One of them was missed
   and the Newsletter tab was hidden from the owner for weeks. */

check("tabs are decided in one place", () => {
  const js = read("crm/app.js");
  const problems = [];

  const roles = /const TABS_BY_ROLE = \{([\s\S]*?)\n\};/.exec(js);
  if (!roles) return "TABS_BY_ROLE is gone";

  ["owner", "admin", "sales"].forEach((r) => {
    if (!new RegExp(r + ":").test(roles[1])) problems.push("no tabs listed for " + r);
  });

  const sales = /sales: \[([^\]]*)\]/.exec(roles[1]);
  if (sales) {
    const has = [...sales[1].matchAll(/"(\w+)"/g)].map((m) => m[1]).sort().join(",");
    if (has !== "leads,partners") problems.push("sales sees " + has + ", expected leads,partners");
  }

  // The old per tab flags must not creep back.
  if (/hideNewsletter|hideRequests/.test(js))
    problems.push("a per tab flag is back; they are what caused the bug");

  // navClass and setSection must both consult it.
  if (!/canSee\(name\)/.test(js)) problems.push("navClass does not use canSee");
  if (!/canSee\(next\)/.test(js)) problems.push("setSection does not use canSee");

  return problems.length ? problems.join("; ") : null;
});

/* --------------------------------------------------------------- 10. report */

const line = "─".repeat(60);
let out = "\n" + line + "\n";
if (failures.length) {
  out += "  " + failures.length + " FAILED, " + passes + " passed\n" + line + "\n\n";
  failures.forEach((f) => (out += "  ✗ " + f + "\n\n"));
} else {
  out += "  all " + passes + " checks passed\n";
}
out += line + "\n";
out;
