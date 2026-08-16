from __future__ import annotations

import re
from pathlib import Path

from openpyxl import Workbook


def parse_row_count(name: str) -> int:
    m = re.search(r"_S(\d{6})-S(\d{6})\.xls$", name)
    if not m:
        return 0
    s = int(m.group(1))
    e = int(m.group(2))
    return e - s + 1


def parse_scenario(name: str) -> tuple[str, str]:
    m = re.search(r"LREQ_CN_(S\d+)_([^_]+(?:_[^_]+)*)", name)
    if not m:
        return "", ""
    code = m.group(1)
    title = m.group(2)
    return code, title


def parse_part(name: str) -> str:
    m = re.search(r"_P(\d+)_", name)
    return f"P{m.group(1)}" if m else "Single"


def main() -> None:
    base = Path(r"c:\Users\pallishree.singh\OneDrive - WiseTech Global\Pallishree_Backup\D-Drive_Backup_Final\EXPORT_TRADE\26.4\LREQ")
    files = sorted(base.glob("LREQ_CN_S*.xls"))
    if not files:
        raise FileNotFoundError("No complete scenario files found.")

    wb = Workbook()
    ws = wb.active
    ws.title = "Complete Scenario Coverage"

    headers = [
        "Scenario Code",
        "Scenario Title",
        "Part",
        "Rows In File",
        "File Name",
        "File Path",
    ]
    ws.append(headers)

    for f in files:
        code, title = parse_scenario(f.name)
        part = parse_part(f.name)
        rows = parse_row_count(f.name)
        ws.append([code, title, part, rows, f.name, str(f)])

    # Width format
    for col in ws.columns:
        width = 0
        letter = col[0].column_letter
        for cell in col:
            val = "" if cell.value is None else str(cell.value)
            width = max(width, len(val))
        ws.column_dimensions[letter].width = min(width + 2, 90)

    out = base / "CN_Complete_Scenario_File_Mapping_1.xlsx"
    wb.save(out)
    print(f"MAPPING_CREATED: {out}")


if __name__ == "__main__":
    main()
