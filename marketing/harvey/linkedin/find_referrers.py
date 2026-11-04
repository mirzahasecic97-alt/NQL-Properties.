#!/usr/bin/env python3
"""Find people on LinkedIn who could refer clients to NQL Group, by role and
city, without touching LinkedIn: TinyFish web searches such as
  site:linkedin.com/in "luxury real estate" Aspen
keep the linkedin.com/in/ results, one row per person, with a connection note
and a first message in Mirza's voice that points at nqlgroup.com/referral.
Nothing is sent anywhere; Mirza sends by hand.

  python3 find_referrers.py                 # every group, every city
  python3 find_referrers.py realestate      # one group
Then: ~/.local/nql-tools/bin/python find_referrers.py --excel
"""
import csv, json, os, re, sys, time, urllib.parse, urllib.request
from datetime import date

HOME = os.path.expanduser("~")
HERE = os.path.dirname(os.path.abspath(__file__))
SEARCH = "https://api.search.tinyfish.ai"
PACE = 2.1  # TinyFish allows 30 searches a minute

CITIES = ["New York", "Miami", "Palm Beach", "Los Angeles", "Beverly Hills", "San Francisco",
          "Aspen", "Vail", "Park City", "Jackson Hole", "Dallas", "Houston", "Chicago",
          "Greenwich", "The Hamptons", "Naples Florida", "Scottsdale", "Boston",
          "London", "Dubai", "Monaco", "Geneva", "Zurich"]

# group: (label, search phrases, hook line used in the first message)
GROUPS = {
    "realestate": ("Luxury real estate agent",
                   ['"luxury real estate"', '"Sotheby\'s International Realty"', '"Christie\'s International Real Estate"'],
                   "Your buyers and sellers are exactly the people who rent a villa for the summer or need somewhere special to stay while a house is finished."),
    "wealth": ("Private banker / wealth manager",
               ['"private banker"', '"wealth manager" "high net worth"'],
               "Your clients are often the ones asking where to spend the summer, and it helps to have someone you trust to send them to."),
    "familyoffice": ("Family office",
                     ['"family office" director'],
                     "Families you look after travel well and often, and someone usually has to organise it."),
    "travel": ("Luxury travel advisor",
               ['"luxury travel advisor"'],
               "When a client wants a private villa, a superyacht or a jet rather than a hotel, we can take that part off your hands."),
    "yacht": ("Yacht / jet broker",
              ['"yacht broker"', '"private jet" charter broker'],
              "Your clients rarely book just the boat or the flight. The villa, the tables and the cars around it are what we arrange."),
    "concierge": ("Concierge / lifestyle manager",
                  ['"lifestyle manager" OR "private concierge"'],
                  "When a member asks for a villa, a yacht or a race weekend, we can arrange it end to end for you."),
    "relocation": ("Relocation consultant",
                   ['"relocation" consultant executive "high net worth"'],
                   "The families you move often need a house for the first months, and then somewhere for the holidays."),
    "cars": ("Luxury car dealer",
             ['"Ferrari" OR "Rolls-Royce" OR "Bentley" sales consultant'],
             "The people who buy from you are the people who rent the villa in Saint-Tropez and the yacht for the week."),
    "events": ("Luxury event planner",
               ['"luxury event planner" OR "luxury wedding planner"'],
               "Your couples and their families need villas, yachts and transport for the days around the event."),
    "clubs": ("Golf / country club",
              ['"country club" OR "golf club" "membership director"'],
              "Your members travel for the best weeks of the year, and we arrange exactly those weeks."),
}

NOTE = "Hey {first}, I run NQL Group. We arrange villas, yachts, jets and experiences for private clients anywhere, and we reward the people who introduce them. Good to connect."
MESSAGE = ("Thanks for connecting, {first}. NQL Group arranges villas, superyachts, private jets and experiences "
           "for private clients anywhere in the world, with one contact from the first message to the last day. "
           "{hook} Our referral programme is simple: you introduce a client, we arrange everything, and you receive "
           "10% of what we earn on every booking they make, for as long as they book. Nothing to do after the "
           "introduction, and the client never sees the arrangement. Details: nqlgroup.com/referral. "
           "Would that be useful for anyone you work with?")

COLS = ["category", "first_name", "last_name", "title", "company", "location", "linkedin",
        "found_with", "connection_note", "first_message", "sent", "replied", "notes"]


def key():
    for line in open(f"{HOME}/.config/nql/tinyfish.env"):
        if line.startswith("TINYFISH_API_KEY="):
            return line.split("=", 1)[1].strip()
    sys.exit("no TINYFISH_API_KEY in ~/.config/nql/tinyfish.env")


def search(q, k):
    url = SEARCH + "?" + urllib.parse.urlencode({"query": q, "page": 0})
    req = urllib.request.Request(url, headers={"X-API-Key": k, "Accept": "application/json"})
    for _ in range(3):
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                return json.load(r).get("results") or []
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(float(e.headers.get("Retry-After", "5")) + 1)
                continue
            print("  search error", e.code, file=sys.stderr)
            return []
        except Exception as e:
            print("  search error", e, file=sys.stderr)
            time.sleep(3)
    return []


SKIP = re.compile(r"\b(team|group|realty|properties|inc|llc|ltd|company|office|club|official)\b", re.I)


def parse(r):
    url = (r.get("url") or "").split("?")[0].rstrip("/")
    if not re.search(r"linkedin\.com/in/[^/]+$", url):
        return None
    title = re.sub(r"\s*\|\s*LinkedIn.*$", "", r.get("title") or "").strip()
    parts = [p.strip() for p in title.split(" - ")]
    name = parts[0]
    words = name.split()
    if not (2 <= len(words) <= 4) or SKIP.search(name) or any(ch.isdigit() for ch in name):
        return None
    rest = [w.strip(",.") for w in words[1:] if not re.fullmatch(r"\(.*\)|[A-Z]{2,5}|MBA|CFP®?|CPA|CIMA®?|PhD", w.strip(",."))]
    if not rest:
        return None
    words = [words[0].strip(",.")] + rest
    first, last = words[0].title() if words[0].islower() else words[0], " ".join(words[1:])
    if last.islower():
        last = last.title()
    headline = " - ".join(parts[1:]).replace("...", "").replace("…", "").strip(" -·")
    snippet = (r.get("snippet") or "").strip()
    loc = ""
    m = re.match(r"([^·]{3,60}?(United States|United Kingdom|United Arab Emirates|Monaco|Switzerland|Area))\s*·", snippet)
    if m:
        loc = m.group(1).strip()
    company = ""
    m = re.search(r"\bat\s+(.+)$", headline)
    if m:
        company = m.group(1).strip()
    else:
        m = re.search(r"Experience:\s*([^·]+)", snippet)
        if m:
            company = m.group(1).strip()
    return {"first_name": first, "last_name": last, "title": headline[:120], "company": company[:80],
            "location": loc, "linkedin": url.replace("://us.", "://www.").replace("://uk.", "://www.")}


def run(only):
    k = key()
    today = date.today().isoformat()
    out = os.path.join(HERE, f"referrers-linkedin-{today}.csv")
    rows, seen = [], set()
    if os.path.exists(out):
        rows = list(csv.DictReader(open(out)))
        seen = {r["linkedin"] for r in rows}
    groups = {g: v for g, v in GROUPS.items() if not only or g in only}
    total = sum(len(v[1]) for v in groups.values()) * len(CITIES)
    n = 0
    for g, (label, phrases, hook) in groups.items():
        for city in CITIES:
            for phrase in phrases:
                n += 1
                q = f"site:linkedin.com/in {phrase} {city}"
                found = 0
                for r in search(q, k):
                    p = parse(r)
                    if not p or p["linkedin"] in seen:
                        continue
                    if not p["location"]:
                        p["location"] = city  # LinkedIn rarely shows it; the column says "searched"
                    if g == "relocation" and not re.search(r"relocat|mobility|moving|destination services", p["title"], re.I):
                        continue
                    seen.add(p["linkedin"])
                    p.update(category=label, found_with=f"{phrase} {city}",
                             connection_note=NOTE.format(first=p["first_name"]),
                             first_message=MESSAGE.format(first=p["first_name"], hook=hook),
                             sent="", replied="", notes="")
                    rows.append(p)
                    found += 1
                print(f"[{n}/{total}] {label} | {city} | {phrase}: +{found} (total {len(rows)})", flush=True)
                with open(out, "w", newline="") as f:
                    w = csv.DictWriter(f, COLS)
                    w.writeheader()
                    w.writerows(rows)
                time.sleep(PACE)
    print(out)


def excel():
    import glob
    sys.path.insert(0, os.path.dirname(HERE))
    from xlsx_out import write_workbook
    src = sorted(glob.glob(os.path.join(HERE, "referrers-linkedin-*.csv")))[-1]
    rows = list(csv.DictReader(open(src)))
    order = [v[0] for v in GROUPS.values()]
    rows.sort(key=lambda r: (order.index(r["category"]) if r["category"] in order else 99, r["location"], r["last_name"]))
    cols = [("category", "Group", 24), ("first_name", "First name", 14), ("last_name", "Last name", 16),
            ("title", "Title", 40), ("company", "Company", 28), ("location", "City searched (check profile)", 26),
            ("linkedin", "LinkedIn", 46), ("connection_note", "Connection note (under 200 chars)", 70),
            ("first_message", "First message after they accept", 100), ("sent", "Sent?", 8),
            ("replied", "Replied?", 9), ("notes", "Notes", 30)]
    sheets = [("All", cols, rows, {"links": ["linkedin"], "wrap": ["connection_note", "first_message"]})]
    for label in order:
        sub = [r for r in rows if r["category"] == label]
        if sub:
            name = re.sub(r"[^A-Za-z ]", " ", label).strip()[:31]
            sheets.append((name, cols, sub, {"links": ["linkedin"], "wrap": ["connection_note", "first_message"]}))
    out = src.replace(".csv", ".xlsx")
    write_workbook(out, sheets)
    for s in sheets:
        print(f"{s[0]}: {len(s[2])}")
    print(out)


if __name__ == "__main__":
    args = sys.argv[1:]
    if "--excel" in args:
        excel()
    else:
        run(set(args))
