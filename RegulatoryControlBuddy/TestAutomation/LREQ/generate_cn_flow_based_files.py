from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

import oracledb
import win32com.client as win32

MAX_XLS_DATA_ROWS = 60000


@dataclass(frozen=True)
class FlowRow:
    import_ctry: str
    ecn: str
    decision: str
    flow_key: str
    flow_desc: str


def fetch_data(conn: oracledb.Connection) -> tuple[list[str], list[tuple[str, str | None]], set[str], set[str]]:
    cur = conn.cursor()

    cur.execute(
        """
        SELECT DISTINCT a.country_id
        FROM lcs_country_chart_global a
        WHERE a.export_country_id = 'CN'
          AND a.rec_status = 'A'
          AND a.effective_date = (
                SELECT MAX(b.effective_date)
                FROM lcs_country_chart_global b
                WHERE a.export_country_id = b.export_country_id
                  AND a.export_cntry_group = b.export_cntry_group
                  AND a.country_id = b.country_id
                  AND b.effective_date <= SYSDATE
          )
        ORDER BY a.country_id
        """
    )
    import_countries = [r[0] for r in cur.fetchall() if r[0]]

    cur.execute(
        """
        SELECT DISTINCT a.eccnum, a.control_attribute16
        FROM lcs_eccn_chart_global a
        WHERE a.export_country_id = 'CN'
          AND a.rs2 IS NULL
          AND a.rec_status = 'A'
          AND a.effective_date = (
                SELECT MAX(b.effective_date)
                FROM lcs_eccn_chart_global b
                WHERE a.export_country_id = b.export_country_id
                  AND a.export_cntry_group = b.export_cntry_group
                  AND a.eccnum = b.eccnum
                  AND b.effective_date <= SYSDATE
          )
        ORDER BY a.eccnum
        """
    )
    ecn_rows = [(r[0], r[1]) for r in cur.fetchall() if r[0]]

    cur.execute(
        """
        SELECT DISTINCT imp_country
        FROM lcs_absolute_embargo
        WHERE exp_country = 'CN'
          AND rec_status = 'A'
          AND absolute = 'Y'
          AND imp_country IS NOT NULL
        """
    )
    full_embargo = {r[0] for r in cur.fetchall()}

    cur.execute(
        """
        SELECT DISTINCT imp_country
        FROM lcs_absolute_embargo
        WHERE exp_country = 'CN'
          AND rec_status = 'A'
          AND absolute = 'N'
          AND imp_country IS NOT NULL
        """
    )
    sanctions = {r[0] for r in cur.fetchall()}

    cur.close()
    return import_countries, ecn_rows, full_embargo, sanctions


def classify(import_ctry: str, ecn: str, control_attr16: str | None, full_embargo: set[str], sanctions: set[str]) -> tuple[str, str, str]:
    ecn_norm = ecn.strip().upper()
    dos_flag = (control_attr16 or "").strip().upper() == "Y"

    if import_ctry in full_embargo or import_ctry in sanctions:
        return (
            "EmbargoY",
            "Embargo/Sanction flow = Y for CN. Destination is sanctioned or fully embargoed.",
            "EL",
        )

    if dos_flag:
        return (
            "EmbargoN_DOSY",
            "Embargo flow = N and ECN.DOS flow = Y for CN (Munitions List).",
            "EL",
        )

    if ecn_norm == "NOCLASS":
        return (
            "EmbargoN_NoClassY",
            "Embargo flow = N and NoClass flow = Y for CN.",
            "NLR",
        )

    return (
        "EmbargoN_NoClassN",
        "Embargo flow = N and NoClass flow = N for CN.",
        "EL",
    )


def build_rows(import_countries: list[str], ecn_rows: list[tuple[str, str | None]], full_embargo: set[str], sanctions: set[str]) -> dict[str, list[FlowRow]]:
    grouped: dict[str, list[FlowRow]] = {
        "EmbargoY": [],
        "EmbargoN_DOSY": [],
        "EmbargoN_NoClassY": [],
        "EmbargoN_NoClassN": [],
    }
    seen: set[tuple[str, str, str, str]] = set()

    for import_ctry in import_countries:
        for ecn, control_attr16 in ecn_rows:
            key = ("CN_MOC_ECN", "CN", import_ctry, ecn)
            if key in seen:
                continue
            seen.add(key)

            flow_key, flow_desc, decision = classify(import_ctry, ecn, control_attr16, full_embargo, sanctions)
            grouped[flow_key].append(
                FlowRow(
                    import_ctry=import_ctry,
                    ecn=ecn,
                    decision=decision,
                    flow_key=flow_key,
                    flow_desc=flow_desc,
                )
            )

    return grouped


def flow_file_prefix(flow_key: str) -> str:
    mapping = {
        "EmbargoY": "LREQ_CN_Flow_EmbargoY_EL",
        "EmbargoN_DOSY": "LREQ_CN_Flow_EmbargoN_DOSY_EL",
        "EmbargoN_NoClassY": "LREQ_CN_Flow_EmbargoN_NoClassY_NLR",
        "EmbargoN_NoClassN": "LREQ_CN_Flow_EmbargoN_NoClassN_EL",
    }
    return mapping[flow_key]


def write_flow_files(template_path: Path, output_dir: Path, grouped_rows: dict[str, list[FlowRow]]) -> list[Path]:
    generated: list[Path] = []
    excel = win32.DispatchEx("Excel.Application")
    excel.Visible = False
    excel.DisplayAlerts = False
    excel.ScreenUpdating = False
    excel.EnableEvents = False

    try:
        for flow_key, rows in grouped_rows.items():
            if not rows:
                continue

            total_parts = max(1, math.ceil(len(rows) / MAX_XLS_DATA_ROWS))
            prefix = flow_file_prefix(flow_key)
            flow_desc = rows[0].flow_desc
            expected_decision = rows[0].decision

            for part in range(total_parts):
                start = part * MAX_XLS_DATA_ROWS
                end = min(start + MAX_XLS_DATA_ROWS, len(rows))
                part_rows = rows[start:end]
                scenario_start = 1
                scenario_end = len(part_rows)
                part_tag = f"_P{part + 1}" if total_parts > 1 else ""
                name = f"{prefix}{part_tag}_S{scenario_start:06d}-S{scenario_end:06d}.xls"
                out_path = output_dir / name

                wb = excel.Workbooks.Open(str(template_path))
                ws_input = wb.Worksheets("input")
                ws_desc = wb.Worksheets("Test Description")

                ws_input.Range("A3:W65536").ClearContents()

                if part_rows:
                    start_row = 3
                    end_row = start_row + len(part_rows) - 1

                    scenario_vals = [[i] for i in range(1, len(part_rows) + 1)]
                    org_vals = [["SYSTEM"] for _ in part_rows]
                    lreq_vals = [["CN_MOC_ECN"] for _ in part_rows]
                    cn_vals = [["CN"] for _ in part_rows]
                    import_vals = [[r.import_ctry] for r in part_rows]
                    ecn_vals = [[r.ecn] for r in part_rows]
                    scenario_desc_vals = [[r.flow_desc] for r in part_rows]
                    decision_vals = [[r.decision] for r in part_rows]

                    ws_input.Range(f"B{start_row}:B{end_row}").Value = scenario_vals
                    ws_input.Range(f"C{start_row}:C{end_row}").Value = org_vals
                    ws_input.Range(f"D{start_row}:D{end_row}").Value = lreq_vals
                    ws_input.Range(f"E{start_row}:E{end_row}").Value = cn_vals
                    ws_input.Range(f"F{start_row}:F{end_row}").Value = cn_vals
                    ws_input.Range(f"H{start_row}:H{end_row}").Value = import_vals
                    ws_input.Range(f"K{start_row}:K{end_row}").Value = ecn_vals
                    ws_input.Range(f"M{start_row}:M{end_row}").Value = scenario_desc_vals
                    ws_input.Range(f"N{start_row}:N{end_row}").Value = decision_vals

                ws_desc.Cells(2, 2).Value = (
                    f"{flow_desc}"
                    f"\nCovered scenarios in this file: S{scenario_start:06d}-S{scenario_end:06d}"
                    f"\nTotal rows in this file: {len(part_rows)}"
                )
                ws_desc.Cells(2, 3).Value = expected_decision

                wb.SaveAs(str(out_path), FileFormat=56)
                wb.Close(SaveChanges=False)
                generated.append(out_path)

                print(f"generated={out_path.name} rows={len(part_rows)}", flush=True)

    finally:
        excel.Quit()

    return generated


def main() -> None:
    base_dir = Path(r"c:\Users\pallishree.singh\OneDrive - WiseTech Global\Pallishree_Backup\D-Drive_Backup_Final\EXPORT_TRADE\26.4\LREQ")
    template = base_dir / "FR_ECN-CA1-Y_COI_CA1-N.xls"

    dsn = oracledb.makedsn("lin020.dev.e2open.com", 1521, sid="GTM")
    conn = oracledb.connect(user="GK_GTM_OWNER", password="GK_WORLD", dsn=dsn)
    try:
        import_countries, ecn_rows, full_embargo, sanctions = fetch_data(conn)
    finally:
        conn.close()

    grouped = build_rows(import_countries, ecn_rows, full_embargo, sanctions)
    files = write_flow_files(template, base_dir, grouped)

    print("SUMMARY")
    for key in ("EmbargoY", "EmbargoN_DOSY", "EmbargoN_NoClassY", "EmbargoN_NoClassN"):
        print(f"{key}={len(grouped[key])}")
    print("FILES")
    for f in files:
        print(str(f))


if __name__ == "__main__":
    main()
