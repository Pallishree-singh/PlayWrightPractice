from __future__ import annotations

import re
from pathlib import Path

from openpyxl import Workbook


def parse_branch(name: str) -> tuple[str, str, str]:
    if "EmbargoY" in name:
        return "Embargo flow = Y", "EL", "EmbargoY"
    if "EmbargoN_NoClassY" in name:
        return "Embargo flow = N, NoClass flow = Y", "NLR", "EmbargoN_NoClassY"
    if "EmbargoN_NoClassN" in name:
        return "Embargo flow = N, NoClass flow = N", "EL", "EmbargoN_NoClassN"
    if "EmbargoN_DOSY" in name:
        return "Embargo flow = N, DOS flow = Y", "EL", "EmbargoN_DOSY"
    return "Other", "N/A", "Other"


def parse_part(name: str) -> str:
    m = re.search(r"_P(\d+)", name)
    return f"P{m.group(1)}" if m else "Single"


def parse_range(name: str) -> tuple[str, int]:
    m = re.search(r"_(S(\d{6})-S(\d{6}))\.xls$", name)
    if not m:
        return "", 0
    label = m.group(1)
    start = int(m.group(2))
    end = int(m.group(3))
    return label, (end - start + 1)


def main() -> None:
    base = Path(r"c:\Users\pallishree.singh\OneDrive - WiseTech Global\Pallishree_Backup\D-Drive_Backup_Final\EXPORT_TRADE\26.4\LREQ")
    files = sorted(base.glob("LREQ_CN_Flow_*.xls"))
    if not files:
        raise FileNotFoundError("No flow-based CN files found.")

    wb = Workbook()
    ws = wb.active
    ws.title = "Scenario-File Mapping"

    headers = [
        "Scenario Branch",
        "Decision",
        "Flow Key",
        "Part",
        "Scenario Range In File",
        "Rows In File",
        "Generated File Name",
        "Generated File Path",
    ]
    ws.append(headers)

    for f in files:
        branch, decision, flow_key = parse_branch(f.name)
        part = parse_part(f.name)
        scenario_range, rows = parse_range(f.name)
        ws.append([
            branch,
            decision,
            flow_key,
            part,
            scenario_range,
            rows,
            f.name,
            str(f),
        ])

    # Apply simple formatting.
    for col in ws.columns:
        max_len = 0
        col_letter = col[0].column_letter
        for cell in col:
            val = "" if cell.value is None else str(cell.value)
            if len(val) > max_len:
                max_len = len(val)
        ws.column_dimensions[col_letter].width = min(max_len + 2, 80)

    out = base / "CN_Scenario_to_File_Mapping_1.xlsx"
    wb.save(out)
    print(f"MAPPING_FILE_CREATED: {out}")


if __name__ == "__main__":
    main()
