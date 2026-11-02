#!/usr/bin/env python3
"""Forbes' real-time billionaires as an Excel workbook.

  python3 build.py            # fetches the list, writes billionaires-YYYY-MM-DD.xlsx
  python3 build.py rtb.json   # from a saved copy of the Forbes JSON

Sheets: "US and UK" (where NQL may approach people directly), "Nordics NL
CH" (LinkedIn by hand only: no cold email to consumers there), "All".
Standard library only. Mirza, 2 Nov 2026: "I need people that are billionaires."
"""
import json, os, sys, urllib.request, zipfile
from datetime import date, datetime
from xml.sax.saxutils import escape

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
            b = datetime.utcfromtimestamp(bd / 1000)
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


def col(n):
    s = ""; n += 1
    while n:
        n, r = divmod(n - 1, 26); s = chr(65 + r) + s
    return s


def sheet_xml(rows):
    out = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
           '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
           '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>',
           '<cols>' + "".join(f'<col min="{i+1}" max="{i+1}" width="{w}" customWidth="1"/>' for i, (_, _, w) in enumerate(COLS)) + '</cols>', '<sheetData>']
    out.append('<row r="1">' + "".join(f'<c r="{col(i)}1" t="inlineStr" s="1"><is><t>{escape(h)}</t></is></c>' for i, (_, h, _) in enumerate(COLS)) + '</row>')
    links = []
    for n, r in enumerate(rows, start=2):
        cells = []
        for i, (k, _, _) in enumerate(COLS):
            v = r.get(k, "") or ""
            if v == "":
                continue
            if k in ("rank", "worth", "age"):
                cells.append(f'<c r="{col(i)}{n}"><v>{v}</v></c>')
            else:
                style = ' s="2"' if k == "forbes" else ""
                cells.append(f'<c r="{col(i)}{n}" t="inlineStr"{style}><is><t xml:space="preserve">{escape(v)}</t></is></c>')
                if k == "forbes":
                    links.append((f"{col(i)}{n}", v))
        out.append(f'<row r="{n}">' + "".join(cells) + '</row>')
    out.append('</sheetData>')
    out.append(f'<autoFilter ref="A1:{col(len(COLS)-1)}{max(len(rows)+1, 2)}"/>')
    if links:
        out.append('<hyperlinks>' + "".join(f'<hyperlink ref="{ref}" r:id="rId{j+1}"/>' for j, (ref, _) in enumerate(links)) + '</hyperlinks>')
    out.append('</worksheet>')
    rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            + "".join(f'<Relationship Id="rId{j+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{escape(u)}" TargetMode="External"/>' for j, (_, u) in enumerate(links))
            + '</Relationships>')
    return "\n".join(out), rels


STYLES = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
          '<fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font>'
          '<font><u/><sz val="11"/><color rgb="FF0563C1"/><name val="Calibri"/></font></fonts>'
          '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>'
          '<fill><patternFill patternType="solid"><fgColor rgb="FFF2F2F2"/><bgColor indexed="64"/></patternFill></fill></fills>'
          '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
          '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
          '<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
          '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>'
          '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>')


def write(sheets, out):
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
                   '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>'
                   '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
                   '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
                   + "".join(f'<Override PartName="/xl/worksheets/sheet{i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' for i in range(len(sheets))) + '</Types>')
        z.writestr("_rels/.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                   '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
        z.writestr("xl/workbook.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'
                   + "".join(f'<sheet name="{escape(n)}" sheetId="{i+1}" r:id="rId{i+1}"/>' for i, (n, _) in enumerate(sheets)) + '</sheets></workbook>')
        z.writestr("xl/_rels/workbook.xml.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                   + "".join(f'<Relationship Id="rId{i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{i+1}.xml"/>' for i in range(len(sheets)))
                   + f'<Relationship Id="rId{len(sheets)+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>')
        z.writestr("xl/styles.xml", STYLES)
        for i, (_, rows) in enumerate(sheets):
            xml, rels = sheet_xml(rows)
            z.writestr(f"xl/worksheets/sheet{i+1}.xml", xml)
            z.writestr(f"xl/worksheets/_rels/sheet{i+1}.xml.rels", rels)


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
