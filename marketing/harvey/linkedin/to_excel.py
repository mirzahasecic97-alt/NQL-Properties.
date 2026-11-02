#!/usr/bin/env python3
"""Turn the LinkedIn CSVs into one Excel workbook, one sheet per campaign.
Run with ~/.local/nql-tools/bin/python (openpyxl).
  ~/.local/nql-tools/bin/python to_excel.py                -> linkedin-prospects-YYYY-MM-DD.xlsx
"""
import csv, glob, os, sys
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
COLS = [("first_name", "First name", 14), ("last_name", "Last name", 16), ("title", "Title", 34),
        ("company", "Company", 32), ("location", "Location", 22), ("linkedin", "LinkedIn", 46),
        ("email", "Email", 30), ("website", "Website", 30), ("harvey_status", "Harvey status", 13),
        ("connection_note", "Connection note (under 200 chars)", 70), ("first_message", "First message after they accept", 90),
        ("sent", "Sent?", 8), ("replied", "Replied?", 9), ("notes", "Notes", 30)]


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
    out = os.path.join(HERE, f"linkedin-prospects-{today}.xlsx")
    sys.path.insert(0, os.path.dirname(HERE))
    from xlsx_out import write_workbook
    write_workbook(out, [(n, COLS, rows, {"links": ["linkedin", "website"], "wrap": ["connection_note", "first_message"]}) for n, rows in sheets])
    for n, rows in sheets:
        print(f"{n}: {len(rows)} rows, {sum(1 for r in rows if r['linkedin'])} with a profile")
    print(out)


if __name__ == "__main__":
    main()
