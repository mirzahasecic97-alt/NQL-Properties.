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
    "\n;return { infoScore, effectiveScore, matchBand, money, leadKind, isQuiet, mandateMissing, leadNo, waNumber, guessCountry, subscriberExtras, CONTACT_LOG, NOT_CONTACT };"
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

check("meeting and newsletter are not leads; footer is", () => {
  const want = {
    footer: "lead", meeting: "meeting", newsletter: "newsletter",
    mandate: "lead", property: "lead", ads: "lead", contact: "lead",
    manual: "lead", guide: "lead", phone: "lead", referral: "lead",
    partner: "lead", event: "lead",
  };
  const wrong = Object.keys(want).filter((k) => crm.leadKind({ source: k }) !== want[k]);
  return wrong.length ? wrong.join(", ") + " classified wrongly" : null;
});

check("a meeting request can never go quiet", () => {
  // Footer messages used to be the example here. They are leads now, and a
  // lead that nobody has rung since 2020 should be flagged.
  const old = { source: "meeting", stage: "new", created_at: "2020-01-01T00:00:00Z" };
  if (crm.isQuiet(old)) return "a meeting request from 2020 is flagged as a neglected lead";
  const footer = { source: "footer", stage: "new", created_at: "2020-01-01T00:00:00Z" };
  return crm.isQuiet(footer) ? null : "a footer lead from 2020 is not flagged as gone quiet";
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
    // One Cyprus. Habitat sits in the north of the island and the pages say
    // so, but as a country to file a buyer under, splitting it only meant a
    // lead labelled one did not match an agency set to the other.
    [{ project_interest: "Habitat Premium, North Cyprus" }, "Cyprus"],
    [{ property_name: "Villa in Kyrenia" }, "Cyprus"],
    [{ location_detail: "near Paphos" }, "Cyprus"],
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

/* ------------------------------- 13. the leads table has one shape, not three
   Header, row and skeleton are written in three places. Adding a column to
   one and not the others misaligns every row under it. */

check("the leads table columns line up", () => {
  const m = crmHtml.indexOf('<tbody id="rows">');
  const head = crmHtml.slice(crmHtml.lastIndexOf("<thead>", m), m);
  // <thead> itself matches /<th/, so count the closing tags instead.
  const headCells = (head.match(/<\/th>/g) || []).length;

  const row = crmJs.slice(crmJs.indexOf('<tr data-id="${l.id}"'), crmJs.indexOf("</tr>`;"));
  const rowCells = (row.match(/<td/g) || []).length;

  const skelStart = crmJs.indexOf("function skeletonRows");
  const skel = crmJs.slice(skelStart, crmJs.indexOf('.join("");', skelStart));
  const skelCells = (skel.match(/<td/g) || []).length;

  return headCells === rowCells && rowCells === skelCells
    ? null
    : `header ${headCells}, row ${rowCells}, skeleton ${skelCells}`;
});

/* --------------------------------------- 14. the consent email says what it must
   This is the message that makes passing a buyer's details on lawful. If it
   ever stops naming the agency, or stops saying what is being handed over,
   the record says consent was asked for something the buyer was never told. */

check("the consent email names the agency and what is passed on", () => {
  const start = crmJs.indexOf("function consentEmail(");
  const body = crmJs.slice(start, crmJs.indexOf("\n}", start));
  const problems = [];
  if (!/\$\{agency\}/.test(body)) problems.push("does not name the agency");
  if (!/name, email address and telephone number/.test(body))
    problems.push("does not say what is passed on");
  if (!/until you reply/.test(body)) problems.push("does not say nothing happens before they reply");
  if (!/rather we did not/.test(body)) problems.push("does not offer a way to say no");
  if (!/encodeURIComponent/.test(body)) problems.push("does not encode the mailto, so an apostrophe would truncate it");
  return problems.length ? problems.join("; ") : null;
});

/* -------------------------- 15. a report cannot be filed in somebody else's name
   The point of the box is that the owner can go back to whoever wrote it. If
   created_by were free, it would be an anonymous complaint box instead. */

check("fix reports are pinned to their author", () => {
  const sql = read("db/fix-requests.sql");
  const problems = [];

  const ins = /create policy "anyone reports"[\s\S]*?;/.exec(sql);
  if (!ins) problems.push("no insert policy");
  else if (!/created_by = auth\.uid\(\)/.test(ins[0]))
    problems.push("the insert policy does not pin created_by to the author");

  const sel = /create policy "read own or owner"[\s\S]*?;/.exec(sql);
  if (!sel) problems.push("no select policy");
  else if (!/is_owner\(\)/.test(sel[0]) || !/created_by = auth\.uid\(\)/.test(sel[0]))
    problems.push("reading is not limited to the author and the owner");

  const upd = /create policy "owner answers"[\s\S]*?;/.exec(sql);
  if (!upd) problems.push("no update policy");
  else if (!/is_owner\(\)/.test(upd[0]))
    problems.push("anybody can change a status, so people could close their own");

  return problems.length ? problems.join("; ") : null;
});

check("both apps can file a report", () => {
  const problems = [];
  [["crm/app.js", "crm"], ["partner/app.js", "portal"]].forEach(([f, where]) => {
    const js = read(f);
    if (!/api\("fix_requests"/.test(js)) problems.push(f + " cannot send one");
    if (!new RegExp('from_where: "' + where + '"').test(js))
      problems.push(f + " does not say it came from the " + where);
    if (!/created_by: session\.user\.id/.test(js))
      problems.push(f + " does not put the author on it");
  });
  return problems.length ? problems.join("; ") : null;
});

/* ------------------------------------ 16. every editable field appears once
   based_in was written into two sections while grouping the drawer, which
   renders two inputs with the same id, and the second silently wins. */

check("no lead field is rendered twice in the drawer", () => {
  const cols = [...crmJs.matchAll(/\$\{editable\("(\w+)"/g)].map((m) => m[1]);
  const twice = cols.filter((c, i) => cols.indexOf(c) !== i);
  return twice.length ? "rendered twice: " + [...new Set(twice)].join(", ") : null;
});

check("hidden table columns are hidden in all three places", () => {
  // A column hidden in the header but not in the row shifts every cell after
  // it one to the left, which looks like corrupt data rather than a layout
  // bug.
  const problems = [];
  ["col-source", "col-received"].forEach((cls) => {
    const inHead = (crmHtml.match(new RegExp(cls, "g")) || []).length;
    const inJs = (crmJs.match(new RegExp(cls, "g")) || []).length;
    if (inHead < 1) problems.push(cls + " is not on the header cell");
    if (inJs < 2) problems.push(cls + " is on " + inJs + " of the row and skeleton cells, needs 2");
  });
  if (!/\.col-source \{ display: none/.test(crmHtml))
    problems.push("no media query hides them");
  return problems.length ? problems.join("; ") : null;
});

/* --------------------------------------- 17. WhatsApp numbers and what counts
   wa.me takes digits only, and the international prefix is not the country
   code: 0047 is Norway written for a phone, 47 is Norway written for a link. */

check("WhatsApp numbers are normalised", () => {
  const cases = [
    ["+47 984 84 738", "4798484738"],
    ["0047 984 84 738", "4798484738"],
    ["(+45) 40-55-21-08", "4540552108"],
    ["12345", null],
    ["", null],
    [null, null],
  ];
  const wrong = cases.filter(([input, want]) => String(crm.waNumber(input)) !== String(want));
  return wrong.length
    ? wrong.map(([i, w]) => JSON.stringify(i) + " should be " + w + ", got " + crm.waNumber(i)).join("; ")
    : null;
});

check("no answer is not contact", () => {
  const problems = [];
  if (!crm.CONTACT_LOG.includes("WhatsApp")) problems.push("WhatsApp is not a way to log contact");
  if (!crm.NOT_CONTACT.includes("No answer"))
    problems.push("No answer counts as contact, so ringing once would move a lead off New");
  crm.NOT_CONTACT.forEach((n) => {
    if (!crm.CONTACT_LOG.includes(n)) problems.push(n + " is excluded but is not a button");
  });
  return problems.length ? problems.join("; ") : null;
});

/* ------------------------------------------- 18. the agency loop holds together
   An agency writes into three places now. Each one has to be pinned to their
   own agency, or one partner could report on another's leads. */

check("an agency can only write its own rows", () => {
  const sql = read("db/agency-loop.sql");
  const problems = [];

  const outcome = /create policy "agency reports outcome"[\s\S]*?;/.exec(sql);
  if (!outcome) problems.push("no outcome policy");
  else if (!/partner_id = public\.my_partner_id\(\)/.test(outcome[0]))
    problems.push("an agency could report on another agency's introduction");

  const seen = /create policy "agency marks seen"[\s\S]*?;/.exec(sql);
  if (!seen) problems.push("no last-seen policy");
  else if (!/user_id = auth\.uid\(\)/.test(seen[0]))
    problems.push("an agency user could rewrite somebody else's row");

  const offer = /create policy "agency offers"[\s\S]*?;/.exec(sql);
  if (!offer) problems.push("no offer policy");
  else if (!/partner_id = public\.my_partner_id\(\)/.test(offer[0]) ||
           !/user_id = auth\.uid\(\)/.test(offer[0]))
    problems.push("an offer is not pinned to its author and agency");

  return problems.length ? problems.join("; ") : null;
});

check("the portal's sections all exist", () => {
  const js = read("partner/app.js");
  const html = read("partner/index.html");
  const list = /const SECTIONS = \[([^\]]*)\]/.exec(js);
  if (!list) return "SECTIONS is gone";
  const names = [...list[1].matchAll(/"(\w+)"/g)].map((m) => m[1]);
  const missing = [];
  names.forEach((n) => {
    if (!html.includes(`id="section-${n}"`)) missing.push("section-" + n);
    if (!html.includes(`id="nav-${n}"`)) missing.push("nav-" + n);
  });
  return missing.length ? "no markup for " + missing.join(", ") : null;
});

check("the request cap is a number, not a hope", () => {
  const js = read("partner/app.js");
  if (!/OPEN_REQUEST_LIMIT/.test(js)) return "no cap on open requests";
  if (!/openRequestCount\(\) >= OPEN_REQUEST_LIMIT/.test(js))
    return "the cap is defined but never checked before the button is drawn";
  return null;
});

/* --------------------------- 19. a reminder that was acted on stops nagging
   Jon rang two leads and the header still said two were due, because the
   badge counted unticked boxes rather than unanswered leads. */

check("contact after the due date clears a reminder", () => {
  const day = 86400000;
  const now = Date.now();
  const iso = (d) => new Date(now + d * day).toISOString();

  const sandbox = load("crm/app.js");
  // The module keeps reminders and lastTouch at its top level, so the check
  // has to run inside it rather than against exported functions.
  const run = new Function(
    `var localStorage = { getItem:function(){return null;}, setItem:function(){}, removeItem:function(){} };
     var document = { addEventListener:function(){}, getElementById:function(){return null;}, querySelectorAll:function(){return [];} };
     var window = { addEventListener:function(){} };` +
      read("crm/app.js") +
      `
    reminders = arguments[0];
    lastTouch = arguments[1];
    return dueReminders().map(function (r) { return r.id; }).join(",");
    `
  );

  const got = run(
    [
      { id: "called-since", lead_id: "L1", due_at: iso(-2), done: false },
      { id: "nothing-since", lead_id: "L2", due_at: iso(-2), done: false },
      { id: "ticked", lead_id: "L3", due_at: iso(-2), done: true },
      { id: "not-yet-due", lead_id: "L4", due_at: iso(3), done: false },
      { id: "called-before", lead_id: "L5", due_at: iso(-5), done: false },
    ],
    new Map([["L1", iso(-1)], ["L5", iso(-6)]])
  );

  return got === "nothing-since,called-before"
    ? null
    : "counted " + got + ", expected nothing-since,called-before";
});

/* ------------------------------- 20. the agency drawer writes real columns
   Every field on it PATCHes partners by the column named in data-pcol. A
   typo there is a write that fails on save, long after the field looked
   fine. */

check("every agency field names a real column", () => {
  // Two forms: written out, and built by pField from its first argument.
  const direct = [...crmJs.matchAll(/data-pcol="(\w+)"/g)].map((m) => m[1]);
  const viaHelper = [...crmJs.matchAll(/\$\{pField\("(\w+)"/g)].map((m) => m[1]);
  const cols = [...new Set([...direct, ...viaHelper])];
  if (cols.length < 8) return "only found " + cols.length + " editable agency fields, expected at least 8";

  const sql = read("db/partners.sql");
  const block = sql.slice(
    sql.indexOf("create table if not exists partners"),
    sql.indexOf("\n);", sql.indexOf("create table if not exists partners"))
  );
  const have = [...block.matchAll(/^\s{2}(\w+)\s/gm)].map((m) => m[1]);
  const missing = cols.filter((c) => !have.includes(c));
  return missing.length ? "not columns on partners: " + missing.join(", ") : null;
});

/* ------------------------------ 21. sales carries no count of anybody's work
   The header counts reminders due and leads gone quiet across the whole
   pipeline. A salesperson works their own list, and those totals are not
   theirs to answer. */

check("the pipeline counts are hidden from sales", () => {
  const problems = [];
  if (!/function seesPipelineAlerts/.test(crmJs))
    problems.push("no rule about who carries the header counts");
  if (!/myRole !== "sales"/.test(crmJs))
    problems.push("sales is not excluded from them");
  ["renderFollowUps", "renderQuiet"].forEach((fn) => {
    const i = crmJs.indexOf("function " + fn);
    const body = crmJs.slice(i, i + 700);
    if (!/seesPipelineAlerts\(\)/.test(body)) problems.push(fn + " does not check it");
  });
  return problems.length ? problems.join("; ") : null;
});

check("the role functions read the table that is maintained", () => {
  const sql = read("db/sales-notes-reminders.sql");
  if (!sql) return "db/sales-notes-reminders.sql is missing";
  const problems = [];

  // Four policies from db/roles.sql depend on can_see_lead, so it can only be
  // replaced, never dropped, and create or replace cannot rename an argument.
  // roles.sql called it `target`.
  if (/drop function[^\n]*can_see_lead/.test(sql))
    problems.push("drops can_see_lead, which four policies depend on and which is what failed");
  if (!/can_see_lead\(target uuid\)/.test(sql))
    problems.push("renames can_see_lead's argument, which create or replace cannot do");

  // The whole point: roles must come from nql_staff, not the abandoned
  // staff_roles table, which is why is_admin returned false for everybody.
  const isAdmin = /create or replace function public\.is_admin\(\)[\s\S]*?\$\$;/.exec(sql);
  if (!isAdmin) problems.push("is_admin is not redefined, so the old policies keep asking staff_roles");
  else if (/staff_roles/.test(isAdmin[0]))
    problems.push("is_admin still reads staff_roles, which nothing writes to");

  const full = /create or replace function public\.is_full_staff\(\)[\s\S]*?\$\$;/.exec(sql);
  if (!full || !/nql_staff/.test(full[0]))
    problems.push("is_full_staff does not read nql_staff");

  if (!/security definer/.test(sql))
    problems.push("the functions are not security definer, so they will recurse");

  return problems.length ? problems.join("; ") : null;
});

/* --------------------------------- 22. exclusivity is the thing being sold
   Two agencies exclusive in the same country is the one mistake here that
   cannot be undone with an apology. */

check("only one agency can be exclusive in a country", () => {
  const sql = read("db/agency-tiers.sql");
  if (!sql) return "db/agency-tiers.sql is missing";
  const problems = [];

  if (!/unique index[^;]*partner_countries \(country\) where tier = 'exclusive'/s.test(sql))
    problems.push("nothing stops the same country being sold twice");
  if (!/check \(tier in \('exclusive', 'shared', 'waiting'\)\)/.test(sql))
    problems.push("the three tiers are not constrained");

  // The head start IS the product. If shared saw briefs at once, exclusivity
  // would be worth nothing.
  const view = sql.slice(sql.indexOf("create view partner_board"));
  if (!/pc\.tier = 'exclusive'/.test(view))
    problems.push("the board does not let an exclusive agency in at once");
  if (!/pc\.tier = 'shared' and l\.created_at < now\(\) - public\.head_start\(\)/.test(view))
    problems.push("a shared agency is not held back, so exclusivity buys nothing");

  return problems.length ? problems.join("; ") : null;
});

check("adding a country to an agency is one action", () => {
  const problems = [];
  // The grid of 144 squares with four states expressed "Romolini does Italy"
  // in the most complicated way available. Two plain verbs replaced it.
  if (/cycleAgencyCountry|TIER_CELL|describeReach/.test(crmJs))
    problems.push("the cycling grid is back");
  ["addAgencyCountry", "removeAgencyCountry"].forEach((fn) => {
    if (!new RegExp("function " + fn).test(crmJs)) problems.push(fn + " is missing");
  });
  // Both screens must go through the same two, or they drift.
  const uses = (crmJs.match(/addAgencyCountry\(/g) || []).length;
  if (uses < 3) problems.push("only " + uses + " references to addAgencyCountry; both screens should use it");
  return problems.length ? problems.join("; ") : null;
});

check("the control panel keeps all five of its sections", () => {
  // Replacing a block between two markers once deleted the section that sat
  // between them, and nothing noticed until an id went missing.
  const want = ["c-staff", "c-agency", "c-vis", "c-fix", "c-health"];
  const missing = want.filter((id) => !crmHtml.includes('id="' + id + '"'));
  return missing.length ? "gone from Control: " + missing.join(", ") : null;
});

/* ----------------------------------- 23. a buyer may be introduced to several
   The model is that two or three agencies pitch and the best house wins. A
   single intro_partner_id on the lead cannot express that. */

check("consent lives on the link, not on a single name", () => {
  const sql = read("db/competing-agencies.sql");
  if (!sql) return "db/competing-agencies.sql is missing";
  const problems = [];

  if (!/alter table lead_partners add column if not exists granted\b/.test(sql))
    problems.push("lead_partners cannot record which agencies hold a lead");

  const view = sql.slice(sql.indexOf("create view partner_leads"));
  if (!/lp\.granted/.test(view.slice(0, view.indexOf("grant select"))))
    problems.push("partner_leads does not gate on the link");
  if (/intro_partner_id = public\.my_partner_id/.test(view))
    problems.push("partner_leads still allows one agency per lead");

  // A brief must stay on other boards while they could still pitch.
  const board = sql.slice(sql.indexOf("create view partner_board"));
  if (!/lp\.partner_id = public\.my_partner_id\(\)\s*\n\s*and lp\.granted/.test(board))
    problems.push("the board hides a brief from everyone once anyone wins it");

  return problems.length ? problems.join("; ") : null;
});

/* ------------------------- 24. a file that drops the board must be able to
   rebuild it. Several dropped partner_board and then created it using a
   function from a different file. When that function was missing the drop
   succeeded, the create failed, and the portal had no board at all. */

check("no board file drops the view without being able to rebuild it", () => {
  /* Three separate files have now dropped partner_board and then failed to
     create it, because a column or a function lived in a different migration.
     The drop succeeds, the create does not, and the portal has no board.
     Any file that drops it must create everything the new view uses. */
  const problems = [];
  const files = ["simple-board.sql", "rebuild-board.sql", "connect-everything.sql"];
  files.forEach((f) => {
    const sql = read("db/" + f);
    if (!sql) { problems.push(f + " is missing"); return; }
    const at = sql.indexOf("create view partner_board");
    if (at < 0) { problems.push(f + " does not create the board"); return; }
    const head = sql.slice(0, at);
    const body = sql.slice(at, sql.indexOf("  from leads l", at));

    // These two come from partner-portal.sql, the file that makes agency
    // accounts exist at all: without it there is nobody to show a board to.
    const given = ["my_partner_id", "is_partner_user"];
    const used = [...new Set([...body.matchAll(/public\.(\w+)\(/g)].map((m) => m[1]))];
    const made = [...head.matchAll(/create or replace function public\.(\w+)/g)].map((m) => m[1]);
    used.filter((u) => !made.includes(u) && !given.includes(u))
        .forEach((u) => problems.push(f + " calls " + u + "() without creating it"));

    if (!/add column if not exists sees_leads/.test(head) && /p\.sees_leads/.test(body))
      problems.push(f + " reads sees_leads without adding it");
  });
  return problems.length ? problems.join("; ") : null;
});

check("something can always rebuild the board from nothing", () => {
  const sql = read("db/rebuild-board.sql");
  if (!sql) return "db/rebuild-board.sql is missing";

  const viewAt = sql.indexOf("create view partner_board");
  if (viewAt < 0) return "it does not create partner_board";

  const body = sql.slice(viewAt);
  const needs = [...new Set([...body.matchAll(/public\.(\w+)\(/g)].map((m) => m[1]))];
  const madeHere = [...sql.slice(0, viewAt).matchAll(/create or replace function public\.(\w+)/g)]
    .map((m) => m[1]);

  // my_partner_id and is_partner_user come from partner-portal.sql, which is
  // the file that makes agency accounts exist at all: without it there is
  // nobody to show a board to.
  const fromPortal = ["my_partner_id", "is_partner_user"];
  const missing = needs.filter((n) => !madeHere.includes(n) && !fromPortal.includes(n));
  return missing.length
    ? "rebuild-board.sql uses " + missing.join(", ") + " without creating them"
    : null;
});

/* ----------------------------- 25. a recreated view keeps nothing of its old
   privileges. The portal came back with

     403  42501  permission denied for view partner_board

   because a file dropped the view, created it again, and the grant that goes
   with it never ran. Every country setting was correct and made no difference,
   because the door itself was shut. A file that creates one of the relations
   the portal reads must hand it to authenticated in the same file. */

check("a file that creates a portal relation also grants it", () => {
  const RELS = ["partner_board", "partner_leads", "partner_offers",
                "partner_countries", "partner_interest", "fix_requests"];
  const problems = [];
  const app = ObjC.unwrap(
    $.NSFileManager.defaultManager.contentsOfDirectoryAtPathError(ROOT + "/db", null)
  ).map((f) => ObjC.unwrap(f)).filter((f) => f.endsWith(".sql"));

  app.forEach((f) => {
    const sql = read("db/" + f);
    if (!sql) return;
    RELS.forEach((rel) => {
      const creates = new RegExp("create (or replace )?(view|table)( if not exists)? " + rel + "\\b").test(sql);
      if (!creates) return;
      const grants = new RegExp("grant [^;]*\\bon " + rel + "\\b[^;]*to authenticated").test(sql);
      if (!grants) problems.push(f + " creates " + rel + " and never grants it");
    });
  });
  return problems.length ? problems.join("; ") : null;
});

check("there is a repair that only grants", () => {
  const sql = read("db/portal-grants.sql");
  if (!sql) return "db/portal-grants.sql is missing";
  if (/\bdrop\b/i.test(sql)) return "it drops something, which is the whole thing it exists to avoid";
  if (/create (or replace )?(view|table)/i.test(sql)) return "it creates something";
  if (!/partner_board/.test(sql)) return "it does not mention partner_board";
  if (!/to_regclass/.test(sql)) return "it grants without checking the object exists first";
  return null;
});


/* ------------------------ 26. build the new board beside the old one. Three
   separate files dropped partner_board and then failed to create it, and each
   time the portal had no board at all until somebody noticed. A file that
   replaces the board must compile the replacement first and only then swap. */

check("the board is replaced by swap, not by drop and hope", () => {
  const sql = read("db/connect-everything.sql");
  if (!sql) return "db/connect-everything.sql is missing";

  const newAt  = sql.indexOf("create view partner_board_new");
  const dropAt = sql.indexOf("drop view if exists partner_board;");
  const swapAt = sql.indexOf("alter view partner_board_new rename to partner_board");

  if (newAt < 0)  return "it does not build the replacement under its own name";
  if (dropAt < 0) return "it never drops the old board";
  if (swapAt < 0) return "it never swaps the new board in";
  if (!(newAt < dropAt && dropAt < swapAt))
    return "it drops the live board before the replacement has compiled";

  // Italy has to mean Italy. That is the whole point of the control panel.
  const body = sql.slice(newAt, dropAt);
  if (!/pc\.country from partner_countries pc/.test(body))
    return "the board does not filter on the countries the control panel sets";
  if (!/grant select on partner_board to authenticated/.test(sql))
    return "it creates the board and never grants it";
  return null;
});

check("the CRM counts a board the same way the board does", () => {
  const app = read("crm/app.js");
  if (!app) return "crm/app.js is missing";
  const at = app.indexOf("function agencyBoardCount");
  if (at < 0) return "agencyBoardCount is gone";
  const fn = app.slice(at, app.indexOf("\n}", at));
  // Strict, because the board is strict: a country chip means that country.
  if (/!l\.country/.test(fn))
    return "it counts leads with no country, which the board does not show";
  if (!/on\.includes\(l\.country\)/.test(fn))
    return "it does not match on the countries the control panel sets";
  return null;
});


/* --------------------------- 27. null is not true. The control panel counted
   twenty leads onto a board the portal was never going to show, because it
   asked whether sees_leads was false while the view asked whether it was true,
   and a null switch answers no to both. */

check("the control panel treats an unset switch as off, like the board does", () => {
  const app = read("crm/app.js");
  if (!app) return "crm/app.js is missing";
  if (/sees_leads === false/.test(app))
    return "somewhere still tests sees_leads === false, which lets null read as on";
  const at = app.indexOf("function agencyBoardCount");
  if (at < 0) return "agencyBoardCount is gone";
  if (!/sees_leads !== true/.test(app.slice(at, app.indexOf("\n}", at))))
    return "agencyBoardCount does not require the switch to be true";
  return null;
});


/* --------------------------- 28. the country the CRM files a lead under. The
   whole portal hangs off this: a lead with no country reaches no agency that
   has a country set, and almost every lead had none. */

check("a lead is filed under the country it is plainly about", () => {
  const { guessCountry } = load("crm/app.js")();
  const cases = [
    [{ property_name: "Villa in Cortona" },                          "Italy"],
    [{ project_interest: "Habitat" },                                "Cyprus"],
    [{ location_detail: "Esentepe" },                                "Cyprus"],
    [{ page_url: "https://nqlproperties.com/lp-italy-no" },          "Italy"],
    [{ message: "we are looking around Marbella" },                  "Spain"],
    [{ property_name: "Umbria - Church" },                           "Italy"],
    // What the lead is about beats what it mentions in passing.
    [{ property_name: "Tuscan farmhouse", message: "saw Spain too" }, "Italy"],
    // Nothing to go on stays unfiled rather than guessing.
    [{ message: "please call me" },                                  null],
    [{},                                                             null],
  ];
  const wrong = cases
    .map(([lead, want]) => {
      const got = guessCountry(lead);
      return got === want ? null : JSON.stringify(lead) + " gave " + got + ", wanted " + want;
    })
    .filter(Boolean);
  return wrong.length ? wrong.join("; ") : null;
});


/* --------------------------- 29. the board must not run as the agency. With
   security_invoker on, a view reads the leads table under the caller's own
   row rules. An agency may only read leads already introduced to it, and the
   board excludes exactly those, so it returned zero rows with no error while
   every setting looked right. Supabase's security advisor suggests turning
   security_invoker on, which is how it happened. Every definition says no. */

check("every board and partner_leads definition pins security_invoker off", () => {
  const files = ObjC.unwrap(
    $.NSFileManager.defaultManager.contentsOfDirectoryAtPathError(ROOT + "/db", null)
  ).map((f) => ObjC.unwrap(f)).filter((f) => f.endsWith(".sql"));
  const problems = [];
  files.forEach((f) => {
    const sql = read("db/" + f);
    if (!sql) return;
    const re = /create view (partner_board(?:_new)?|partner_leads)\n([^\n]*)/g;
    let m;
    while ((m = re.exec(sql))) {
      if (!/security_invoker = false/.test(m[2]))
        problems.push(f + " creates " + m[1] + " without security_invoker = false");
    }
  });
  return problems.length ? problems.join("; ") : null;
});


/* ------------------------------ 30. no newsletter popup, and every form on
   the site posts under a key the API knows. The popup opened twelve seconds
   into the homepage over the one button that matters, and was removed from
   all thirty six pages at once; a page that grows one back is a regression.
   A form with an unknown _form key is silently refused by api/lead.js. */

check("no page carries the newsletter popup", () => {
  const files = ObjC.unwrap(
    $.NSFileManager.defaultManager.contentsOfDirectoryAtPathError(ROOT, null)
  ).map((f) => ObjC.unwrap(f)).filter((f) => f.endsWith(".html"));
  const bad = files.filter((f) => /id="nl-pop"|nql:newsletter/.test(read(f) || ""));
  return bad.length ? bad.join(", ") + " still carry the popup" : null;
});

check("every _form value on the site is one api/lead.js accepts", () => {
  const api = read("api/lead.js");
  const known = new Set([...api.matchAll(/^\s{2}(\w+): \{ source:/gm)].map((m) => m[1]));
  const files = ObjC.unwrap(
    $.NSFileManager.defaultManager.contentsOfDirectoryAtPathError(ROOT, null)
  ).map((f) => ObjC.unwrap(f)).filter((f) => f.endsWith(".html"));
  const problems = [];
  files.forEach((f) => {
    const html = read(f) || "";
    for (const m of html.matchAll(/name="_form" value="([^"]+)"/g))
      if (!known.has(m[1])) problems.push(f + " posts as " + m[1]);
  });
  return problems.length ? problems.join("; ") : null;
});

check("the listings pages ask for an email inline", () => {
  const files = ObjC.unwrap(
    $.NSFileManager.defaultManager.contentsOfDirectoryAtPathError(ROOT, null)
  ).map((f) => ObjC.unwrap(f)).filter((f) => f === "properties.html" || f.startsWith("property-"));
  const missing = files.filter((f) => !/name="_form" value="listings"/.test(read(f) || ""));
  return missing.length ? missing.join(", ") + " have no inline signup" : null;
});


/* ----------------------------- 31. the agency page is reachable from every
   header, desktop and phone, and the homepage's Partner button goes there
   rather than to the contact form. Agencies arrive from a message and a
   header link is how they find their way back. */

check("every page with a nav links to the agency page from desktop and mobile", () => {
  const files = ObjC.unwrap(
    $.NSFileManager.defaultManager.contentsOfDirectoryAtPathError(ROOT, null)
  ).map((f) => ObjC.unwrap(f)).filter((f) => f.endsWith(".html"));
  const problems = [];
  files.forEach((f) => {
    const html = read(f) || "";
    const navContacts = [...html.matchAll(/href="contact\.html"\s+class="([^"]*)"\s*>Contact</g)]
      .filter((m) => /decoration-1/.test(m[1]) || /^text-3xl font-serif/.test(m[1])).length;
    if (!navContacts) return; // landing pages have no nav
    const agencyLinks = [...html.matchAll(/href="for-agencies\.html"\s+class="([^"]*)"\s*>For agencies</g)]
      .filter((m) => /decoration-1/.test(m[1]) || /^text-3xl font-serif/.test(m[1])).length;
    if (agencyLinks !== navContacts)
      problems.push(f + " has " + navContacts + " nav Contact links and " + agencyLinks + " For agencies links");
  });
  return problems.length ? problems.join("; ") : null;
});

check("the homepage Partner with us button goes to the agency page", () => {
  const html = read("index.html");
  const i = html.indexOf(">Partner with us</a");
  if (i < 0) return "the button is gone";
  const before = html.slice(Math.max(0, i - 600), i);
  return /href="for-agencies\.html"/.test(before) ? null : "it still points at the contact form";
});


/* ------------------------------ 32. the live feed reads what the poll loads.
   It is drawn from lead_notes, leads and partner_interest, all of which the
   30 second refresh already fetches, so it needs no table of its own. The
   note query has to bring the author back or nobody is named. */

check("the live feed has a slot, a renderer, and authors on the notes", () => {
  const app = read("crm/app.js"); const html = read("crm/index.html");
  if (!/id="feed"/.test(html)) return "crm/index.html has no #feed";
  if (!/function renderFeed\(/.test(app)) return "renderFeed is missing";
  if (!/lead_notes\?select=[^"]*\bauthor\b/.test(app)) return "lead_notes is loaded without the author";
  const la = app.slice(app.indexOf("async function loadActivity"), app.indexOf("\n}", app.indexOf("async function loadActivity")));
  if (!/renderFeed\(\)/.test(la)) return "loadActivity does not redraw the feed, so a logged call would not appear";
  return null;
});


/* ------------------------------ 33. footer is a lead everywhere, and the feed
   is for management. If the CRM counts footer as a buyer and the board file
   still excludes it, the control panel promises leads the portal never
   shows, which is the exact disagreement that cost a day in September. */

check("no board file excludes footer any more", () => {
  const files = ObjC.unwrap(
    $.NSFileManager.defaultManager.contentsOfDirectoryAtPathError(ROOT + "/db", null)
  ).map((f) => ObjC.unwrap(f)).filter((f) => f.endsWith(".sql"));
  const bad = files.filter((f) => /'footer',\s*'meeting'/.test(read("db/" + f) || ""));
  return bad.length ? bad.join(", ") + " still exclude footer from the board" : null;
});

check("the live feed is hidden from sales", () => {
  const app = read("crm/app.js");
  const at = app.indexOf("function renderFeed");
  if (at < 0) return "renderFeed is missing";
  const fn = app.slice(at, app.indexOf("\n}", at));
  return /myRole === "sales"/.test(fn) ? null : "renderFeed does not check for sales";
});


/* ---------------------------- 34. a subscriber who wrote something is shown
   to have written it. The newsletter forms have only an email box, so a name
   or a message on a subscriber came by an older route and is the one thing
   that says they wanted a house, not a newsletter. It sat in the raw column,
   unseen. */

check("a subscriber's extra fields are surfaced, without the form plumbing", () => {
  const { subscriberExtras } = load("crm/app.js")();
  const got = subscriberExtras({ raw: {
    email: "a@b.c", _form: "x", _next: "/", _gotcha: "", privacy_agreement: "on",
    name: "Torill Pettersen", message: "Looking for a house in Umbria",
  }});
  const keys = got.map(([k]) => k);
  if (!keys.includes("name") || !keys.includes("message")) return "name or message dropped: " + keys.join(",");
  if (keys.some((k) => /^_|email|privacy/.test(k))) return "plumbing leaked through: " + keys.join(",");
  if (subscriberExtras({ raw: null }).length) return "a null raw should give nothing";
  return null;
});

check("a subscriber can be made into a lead as a contact enquiry", () => {
  const app = read("crm/app.js");
  const at = app.indexOf("async function makeLead");
  if (at < 0) return "makeLead is missing";
  const fn = app.slice(at, app.indexOf("\n}", at));
  if (!/source: "contact"/.test(fn)) return "it does not file the lead as a contact enquiry";
  if (!/return=representation/.test(fn)) return "it does not read the row back, so a silent refusal would look like success";
  if (!/data-makelead/.test(app)) return "the button is not rendered";
  return null;
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

/* The runner reads this line to set its exit code. A suite that always
   succeeds as far as the shell is concerned cannot stop a commit, which is
   the whole reason it exists: this file failed and the push went ahead. */
out += failures.length ? "RESULT: FAIL\n" : "RESULT: PASS\n";
out;
