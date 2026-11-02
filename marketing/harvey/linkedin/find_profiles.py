#!/usr/bin/env python3
"""Find the public LinkedIn profile of every named Harvey prospect, without
touching LinkedIn: one TinyFish web search per person ("First Last" Company
LinkedIn), keep the linkedin.com/in/ result whose title carries the surname.

Writes the URL into Harvey's own prospects.linkedin_url column and a CSV per
campaign with a connection note and a first message in Mirza's voice, for
him to send by hand. Nothing is sent anywhere. Mirza, 2 Nov 2026: "Can you
scrape linkedin as well but I will send myself."

  python3 find_profiles.py            # all copies, people not yet looked up
  python3 find_profiles.py partners   # one copy
  python3 find_profiles.py --redo     # look everyone up again
"""
import csv, json, os, re, sqlite3, sys, time, urllib.parse, urllib.request
from datetime import date

HOME = os.path.expanduser("~")
COPIES = {"partners": f"{HOME}/harvey", "clients": f"{HOME}/harvey-clients", "companies": f"{HOME}/harvey-companies"}
OUT = os.path.dirname(os.path.abspath(__file__))
SEARCH = "https://api.search.tinyfish.ai"
PACE = 2.1  # seconds between searches: TinyFish allows 30 a minute

NOTE = {  # LinkedIn connection note, 200 characters at most
    "partners": "Hey {first}, I run NQL Group: private houses in about 150 places, the stay looked after. We share 10% of what we earn with the firms that introduce a client. Good to connect.",
    "clients": "Hey {first}, I run NQL Group. We find private houses all over the world and look after the stay, chef and cars included. Good to connect.",
    "companies": "Hey {first}, I run NQL Group. We arrange private houses for teams, this winter in the American mountains, with the chef and the cars sorted. Good to connect.",
}
MESSAGE = {  # first message once connected
    "partners": "Thanks for connecting, {first}. Short version of what we do: NQL Group finds private houses in about 150 places for people who would rather not stay in a hotel, and I look after the stay itself, the chef and the cars included. The houses start around 10,000 euros a night. When a firm like {company} introduces a client, we arrange everything and you receive 10% of what we earn on that client, for as long as they book, with nothing to do after the introduction. Is there anyone on your side this winter I could help with?",
    "clients": "Thanks for connecting, {first}. My name is Mirza, I run a small company called NQL Group. We find private houses all over the world for people who would rather not stay in a hotel, and I look after the stay itself, the chef and the cars included. This winter it's mostly the mountains: Aspen, Vail, Park City. The houses start around 10,000 euros a night, so it's for the weeks that matter, and it costs nothing to ask. Is there anything on the horizon I could help with?",
    "companies": "Thanks for connecting, {first}. My name is Mirza, I run a small company called NQL Group. We find private houses all over the world for companies that want to take the team somewhere better than a hotel, and we look after the trip itself: the house, the chef, the cars, the ski guides. This winter that means Aspen, Vail, Park City or Jackson Hole, and January is the quiet month. The houses start around 10,000 euros a night. Is there a trip like that in {company}'s plans?",
}


def key():
    for line in open(f"{HOME}/.config/nql/tinyfish.env"):
        if line.startswith("TINYFISH_API_KEY="):
            return line.split("=", 1)[1].strip()
    sys.exit("no TINYFISH_API_KEY in ~/.config/nql/tinyfish.env")


def search(q, k):
    url = SEARCH + "?" + urllib.parse.urlencode({"query": q, "page": 0})
    req = urllib.request.Request(url, headers={"X-API-Key": k, "Accept": "application/json"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                return json.load(r).get("results") or []
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(float(e.headers.get("Retry-After", "5")) + 1)
                continue
            raise
    return []


def pick(results, first, last, company):
    """The linkedin.com/in/ result that names the person; company breaks ties."""
    best, best_score = None, 0
    for r in results:
        url = (r.get("url") or "").split("?")[0]
        if not re.search(r"linkedin\.com/in/", url):
            continue
        text = ((r.get("title") or "") + " " + (r.get("snippet") or "")).lower()
        score = 0
        if last.lower() in text: score += 2
        if first.lower() in text: score += 1
        if company and company.lower().split()[0] in text: score += 1
        if score > best_score:
            best, best_score = url, score
    return best if best_score >= 2 else None


def run(campaigns, redo):
    k = key()
    today = date.today().isoformat()
    for camp in campaigns:
        dbp = os.path.join(COPIES[camp], "data", "harvey.db")
        if not os.path.exists(dbp):
            continue
        c = sqlite3.connect(dbp)
        c.row_factory = sqlite3.Row
        rows = c.execute("""select p.id, p.first_name, p.last_name, p.title, p.email, p.status, p.linkedin_url,
                                   co.name as company, co.website, co.location
                              from prospects p left join companies co on co.id = p.company_id
                             where coalesce(p.first_name,'') <> '' and coalesce(p.last_name,'') <> ''
                               and p.status not in ('closed_lost','opted_out')
                             order by co.name, p.last_name""").fetchall()
        found = 0
        out = []
        for r in rows:
            url = r["linkedin_url"]
            if redo or not url:
                q = f'"{r["first_name"]} {r["last_name"]}" {r["company"] or ""} LinkedIn'
                try:
                    url = pick(search(q, k), r["first_name"], r["last_name"], r["company"] or "")
                except Exception as e:
                    print(f"  {camp}: {q} -> {e}")
                    url = None
                c.execute("update prospects set linkedin_url = ?, updated_at = ? where id = ?", (url or "", today, r["id"]))
                c.commit()
                time.sleep(PACE)
            if url:
                found += 1
            out.append({
                "first_name": r["first_name"], "last_name": r["last_name"], "title": r["title"] or "",
                "company": r["company"] or "", "location": r["location"] or "", "website": r["website"] or "",
                "linkedin": url or "", "email": r["email"] or "", "harvey_status": r["status"],
                "connection_note": NOTE[camp].format(first=r["first_name"]),
                "first_message": MESSAGE[camp].format(first=r["first_name"], company=r["company"] or "your firm"),
            })
        path = os.path.join(OUT, f"{camp}-linkedin-{today}.csv")
        with open(path, "w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=list(out[0].keys()) if out else ["first_name"])
            w.writeheader(); w.writerows(out)
        print(f"{camp}: {len(rows)} named people, {found} LinkedIn profiles -> {path}")
        c.close()


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    run(args or list(COPIES), "--redo" in sys.argv)
