#!/usr/bin/env python3
"""Forbes' real-time billionaires as an Excel workbook.

  ~/.local/nql-tools/bin/python build.py            # fetches the list, writes billionaires-YYYY-MM-DD.xlsx
  ~/.local/nql-tools/bin/python build.py rtb.json   # from a saved copy of the Forbes JSON

Sheets: "US and UK" (where NQL may approach people directly), "Nordics NL
CH" (LinkedIn by hand only: no cold email to consumers there), "All".
Run with ~/.local/nql-tools/bin/python (openpyxl). Mirza, 2 Nov 2026: "I need people that are billionaires."
"""
import json, os, sys, urllib.request
from datetime import date, datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
API = ("https://www.forbes.com/forbesapi/person/rtb/0/position/true.json?fields="
       "rank,uri,personName,lastName,gender,source,industries,countryOfCitizenship,birthDate,"
       "finalWorth,city,state,country,bios,abouts&limit=4000")
NORDIC = {"Norway", "Sweden", "Denmark", "Iceland", "Finland", "Netherlands", "Switzerland"}
COLS = [("rank", "Rank", 7), ("name", "Name", 26), ("worth", "Net worth $bn", 13), ("source", "Source of wealth", 28),
        ("industry", "Industry", 22), ("age", "Age", 6), ("city", "City", 18), ("state", "State", 14),
        ("country", "Country", 16), ("citizenship", "Citizenship", 16), ("bio", "In one line", 90),
        ("forbes", "Forbes profile", 44), ("linkedin", "LinkedIn", 30), ("family_office", "Family office / who to reach", 34),
        ("sent", "Approached?", 11), ("notes", "Notes", 30)]


def load(path):
    if path:
        return json.load(open(path))
    req = urllib.request.Request(API, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.load(r)


def rows_from(data):
    out = []
    for p in data["personList"]["personsLists"]:
        bd = p.get("birthDate")
        age = ""
        if bd:
            b = datetime.fromtimestamp(bd / 1000, timezone.utc)
            t = date.today()
            age = str(t.year - b.year - ((t.month, t.day) < (b.month, b.day)))
        bios = p.get("bios") or p.get("abouts") or []
        out.append({
            "rank": str(p.get("rank", "")), "name": p.get("personName", ""),
            "worth": f'{p.get("finalWorth", 0) / 1000:.1f}', "source": p.get("source", ""),
            "industry": ", ".join(p.get("industries") or []), "age": age,
            "city": p.get("city", "") or "", "state": p.get("state", "") or "",
            "country": p.get("country", "") or p.get("countryOfCitizenship", "") or "",
            "citizenship": p.get("countryOfCitizenship", "") or "",
            "bio": (bios[0].strip() if bios else ""),
            "forbes": f'https://www.forbes.com/profile/{p.get("uri", "")}/' if p.get("uri") else "",
            "linkedin": "", "family_office": "", "sent": "", "notes": "",
        })
    out.sort(key=lambda r: int(r["rank"] or 99999))
    return out


def write(sheets, out):
    sys.path.insert(0, os.path.dirname(HERE))
    from xlsx_out import write_workbook
    write_workbook(out, [(n, COLS, rows, {"links": ["forbes", "linkedin"], "wrap": ["bio"], "numbers": ["rank", "worth", "age"]}) for n, rows in sheets])


def main():
    data = load(sys.argv[1] if len(sys.argv) > 1 else None)
    rows = rows_from(data)
    usuk = [r for r in rows if r["country"] in ("United States", "United Kingdom") or r["citizenship"] in ("United States", "United Kingdom")]
    nordic = [r for r in rows if r["country"] in NORDIC or r["citizenship"] in NORDIC]
    sheets = [("US and UK", usuk), ("Nordics NL CH", nordic), ("All", rows)]
    out = os.path.join(HERE, f"billionaires-{date.today().isoformat()}.xlsx")
    write(sheets, out)
    for n, rs in sheets:
        print(f"{n}: {len(rs)}")
    print(out)


if __name__ == "__main__":
    main()
