"""One Excel writer for the NQL marketing scripts (openpyxl).

    from xlsx_out import write_workbook
    write_workbook(path, [(sheet_name, COLS, rows, {"links": [...], "wrap": [...], "numbers": [...]})])

COLS is a list of (key, header, width). rows are dicts keyed by `key`.
Run with ~/.local/nql-tools/bin/python (has openpyxl); the system python3 does not.
"""
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter


def write_workbook(path, sheets):
    wb = Workbook()
    wb.remove(wb.active)
    head_font, head_fill = Font(bold=True), PatternFill("solid", fgColor="F2F2F2")
    link_font = Font(color="0563C1", underline="single")
    for name, cols, rows, opts in sheets:
        ws = wb.create_sheet(title=name[:31])
        links, wrap, numbers = set(opts.get("links", [])), set(opts.get("wrap", [])), set(opts.get("numbers", []))
        for i, (_, header, width) in enumerate(cols, start=1):
            c = ws.cell(row=1, column=i, value=header)
            c.font, c.fill = head_font, head_fill
            ws.column_dimensions[get_column_letter(i)].width = width
        for r, row in enumerate(rows, start=2):
            for i, (key, _, _) in enumerate(cols, start=1):
                v = row.get(key, "")
                if v in ("", None):
                    continue
                if key in numbers:
                    try:
                        v = float(v) if "." in str(v) else int(v)
                    except ValueError:
                        pass
                c = ws.cell(row=r, column=i, value=v)
                if key in links and isinstance(v, str) and v.startswith("http"):
                    c.hyperlink, c.font = v, link_font
                if key in wrap:
                    c.alignment = Alignment(wrap_text=True, vertical="top")
        ws.freeze_panes = "A2"
        ws.auto_filter.ref = f"A1:{get_column_letter(len(cols))}{max(len(rows) + 1, 2)}"
    wb.save(path)
    return path
