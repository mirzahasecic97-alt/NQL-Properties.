#!/usr/bin/env python3
"""Turn the LinkedIn CSVs into one Excel workbook, one sheet per campaign.
Standard library only (no openpyxl on this Mac): an .xlsx is a zip of XML.
  python3 to_excel.py                -> linkedin-prospects-YYYY-MM-DD.xlsx
"""
import csv, glob, os, re, zipfile
from datetime import date
from xml.sax.saxutils import escape

HERE = os.path.dirname(os.path.abspath(__file__))
COLS = [("first_name", "First name", 14), ("last_name", "Last name", 16), ("title", "Title", 34),
        ("company", "Company", 32), ("location", "Location", 22), ("linkedin", "LinkedIn", 46),
        ("email", "Email", 30), ("website", "Website", 30), ("harvey_status", "Harvey status", 13),
        ("connection_note", "Connection note (under 200 chars)", 70), ("first_message", "First message after they accept", 90),
        ("sent", "Sent?", 8), ("replied", "Replied?", 9), ("notes", "Notes", 30)]


def col(n):  # 0 -> A
    s = ""
    n += 1
    while n:
        n, r = divmod(n - 1, 26)
        s = chr(65 + r) + s
    return s


def sheet_xml(rows):
    out = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
           '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
           'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
           '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>',
           '<cols>' + "".join(f'<col min="{i+1}" max="{i+1}" width="{w}" customWidth="1"/>' for i, (_, _, w) in enumerate(COLS)) + '</cols>',
           '<sheetData>']
    out.append('<row r="1">' + "".join(
        f'<c r="{col(i)}1" t="inlineStr" s="1"><is><t>{escape(h)}</t></is></c>' for i, (_, h, _) in enumerate(COLS)) + '</row>')
    links = []
    for n, r in enumerate(rows, start=2):
        cells = []
        for i, (k, _, _) in enumerate(COLS):
            v = r.get(k, "") or ""
            if not v:
                continue
            style = ' s="2"' if k == "linkedin" else (' s="3"' if k in ("connection_note", "first_message") else "")
            cells.append(f'<c r="{col(i)}{n}" t="inlineStr"{style}><is><t xml:space="preserve">{escape(v)}</t></is></c>')
            if k == "linkedin":
                links.append((f"{col(i)}{n}", v))
        out.append(f'<row r="{n}">' + "".join(cells) + '</row>')
    out.append('</sheetData>')
    out.append(f'<autoFilter ref="A1:{col(len(COLS)-1)}{max(len(rows)+1, 2)}"/>')
    if links:
        out.append('<hyperlinks>' + "".join(f'<hyperlink ref="{ref}" r:id="rId{j+1}"/>' for j, (ref, _) in enumerate(links)) + '</hyperlinks>')
    out.append('</worksheet>')
    rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            + "".join(f'<Relationship Id="rId{j+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{escape(u)}" TargetMode="External"/>' for j, (_, u) in enumerate(links))
            + '</Relationships>')
    return "\n".join(out), rels


def main():
    today = date.today().isoformat()
    sheets = []
    for camp in ("partners", "clients", "companies"):
        files = sorted(glob.glob(os.path.join(HERE, f"{camp}-linkedin-*.csv")))
        if not files:
            continue
        rows = list(csv.DictReader(open(files[-1])))
        rows.sort(key=lambda r: (r["linkedin"] == "", r["company"].lower(), r["last_name"].lower()))
        sheets.append((camp.capitalize(), rows))
    styles = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
              '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
              '<fonts count="3"><font><sz val="11"/><name val="Calibri"/></font>'
              '<font><b/><sz val="11"/><name val="Calibri"/></font>'
              '<font><u/><sz val="11"/><color rgb="FF0563C1"/><name val="Calibri"/></font></fonts>'
              '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>'
              '<fill><patternFill patternType="solid"><fgColor rgb="FFF2F2F2"/><bgColor indexed="64"/></patternFill></fill></fills>'
              '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
              '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
              '<cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
              '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>'
              '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>'
              '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf>'
              '</cellXfs></styleSheet>')
    out = os.path.join(HERE, f"linkedin-prospects-{today}.xlsx")
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml",
                   '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                   '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
                   '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
                   '<Default Extension="xml" ContentType="application/xml"/>'
                   '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
                   '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
                   + "".join(f'<Override PartName="/xl/worksheets/sheet{i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' for i in range(len(sheets)))
                   + '</Types>')
        z.writestr("_rels/.rels",
                   '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                   '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                   '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
        z.writestr("xl/workbook.xml",
                   '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                   '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'
                   + "".join(f'<sheet name="{escape(n)}" sheetId="{i+1}" r:id="rId{i+1}"/>' for i, (n, _) in enumerate(sheets))
                   + '</sheets></workbook>')
        z.writestr("xl/_rels/workbook.xml.rels",
                   '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                   '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                   + "".join(f'<Relationship Id="rId{i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{i+1}.xml"/>' for i in range(len(sheets)))
                   + f'<Relationship Id="rId{len(sheets)+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>')
        z.writestr("xl/styles.xml", styles)
        for i, (_, rows) in enumerate(sheets):
            xml, rels = sheet_xml(rows)
            z.writestr(f"xl/worksheets/sheet{i+1}.xml", xml)
            z.writestr(f"xl/worksheets/_rels/sheet{i+1}.xml.rels", rels)
    for n, rows in sheets:
        print(f"{n}: {len(rows)} rows, {sum(1 for r in rows if r['linkedin'])} with a profile")
    print(out)


if __name__ == "__main__":
    main()
