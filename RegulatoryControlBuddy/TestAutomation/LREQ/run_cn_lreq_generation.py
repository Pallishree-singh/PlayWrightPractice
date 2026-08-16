from __future__ import annotations

import math
import os
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

import oracledb
import win32com.client as win32


MAX_XLS_DATA_ROWS = 60000  # Keep below .xls row limit with safety margin.


@dataclass(frozen=True)
class RowData:
    import_ctry: str
    ecn: str
    decision: str


def fetch_cn_data(conn: oracledb.Connection) -> tuple[list[str], list[tuple[str, str | None]], set[str], set[str]]:
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


def derive_decision(import_ctry: str, ecn: str, control_attr16: str | None, full_embargo: set[str], sanctions: set[str]) -> str:
    ecn_norm = ecn.strip().upper()
    dos_flag = (control_attr16 or "").strip().upper() == "Y"

    if import_ctry in full_embargo:
        return "EL"
    if import_ctry in sanctions:
        return "EL"
    if dos_flag:
        return "EL"
    if ecn_norm == "NOCLASS":
        return "NLR"
    return "EL"


def build_rows(import_countries: list[str], ecn_rows: list[tuple[str, str | None]], full_embargo: set[str], sanctions: set[str]) -> list[RowData]:
    rows: list[RowData] = []
    seen: set[tuple[str, str, str, str]] = set()

    for import_ctry in import_countries:
        for ecn, control_attr16 in ecn_rows:
            key = ("CN_MOC_ECN", "CN", import_ctry, ecn)
            if key in seen:
                continue
            seen.add(key)
            decision = derive_decision(import_ctry, ecn, control_attr16, full_embargo, sanctions)
            rows.append(RowData(import_ctry=import_ctry, ecn=ecn, decision=decision))

    return rows


def write_workbook_parts(template_path: Path, output_dir: Path, rows: list[RowData]) -> list[Path]:
    ts = datetime.now().strftime("%Y%m%d")
    total_parts = max(1, math.ceil(len(rows) / MAX_XLS_DATA_ROWS))
    output_files: list[Path] = []

    excel = win32.DispatchEx("Excel.Application")
    excel.Visible = False
    excel.DisplayAlerts = False
    excel.ScreenUpdating = False
    excel.EnableEvents = False

    try:
        for part in range(total_parts):
            start = part * MAX_XLS_DATA_ROWS
            end = min(start + MAX_XLS_DATA_ROWS, len(rows))
            part_rows = rows[start:end]

            output_name = f"LREQ_CN_{ts}_part{part + 1}.xls"
            output_path = output_dir / output_name
            output_files.append(output_path)

            wb = excel.Workbooks.Open(str(template_path))
            ws = wb.Worksheets("input")

            # Clear existing body rows while preserving headers and template columns.
            ws.Range("A3:W65536").ClearContents()

            if part_rows:
                start_row = 3
                end_row = start_row + len(part_rows) - 1
                base_scenario = start + 1

                scenario_vals = [[i] for i in range(base_scenario, base_scenario + len(part_rows))]
                org_vals = [["SYSTEM"] for _ in part_rows]
                lreq_vals = [["CN_MOC_ECN"] for _ in part_rows]
                cn_vals = [["CN"] for _ in part_rows]
                import_vals = [[r.import_ctry] for r in part_rows]
                ecn_vals = [[r.ecn] for r in part_rows]
                decision_vals = [[r.decision] for r in part_rows]

                ws.Range(f"B{start_row}:B{end_row}").Value = scenario_vals
                ws.Range(f"C{start_row}:C{end_row}").Value = org_vals
                ws.Range(f"D{start_row}:D{end_row}").Value = lreq_vals
                ws.Range(f"E{start_row}:E{end_row}").Value = cn_vals
                ws.Range(f"F{start_row}:F{end_row}").Value = cn_vals
                ws.Range(f"H{start_row}:H{end_row}").Value = import_vals
                ws.Range(f"K{start_row}:K{end_row}").Value = ecn_vals
                ws.Range(f"N{start_row}:N{end_row}").Value = decision_vals

            print(
                f"part={part + 1}/{total_parts} rows={len(part_rows)} output={output_path.name}",
                flush=True,
            )

            wb.SaveAs(str(output_path), FileFormat=56)  # 56 = Excel 97-2003 Workbook (.xls)
            wb.Close(SaveChanges=False)

    finally:
        excel.Quit()

    return output_files


def main() -> None:
    template_path = Path(r"c:\Users\pallishree.singh\OneDrive - WiseTech Global\Pallishree_Backup\D-Drive_Backup_Final\EXPORT_TRADE\26.4\LREQ\FR_ECN-CA1-Y_COI_CA1-N.xls")
    output_dir = Path(r"c:\Users\pallishree.singh\OneDrive - WiseTech Global\Pallishree_Backup\D-Drive_Backup_Final\EXPORT_TRADE\26.4\LREQ")

    if not template_path.exists():
        raise FileNotFoundError(f"Template file not found: {template_path}")

    db_user = os.getenv("DB_USER", "GK_GTM_OWNER")
    db_password = os.getenv("DB_PASSWORD", "GK_WORLD")
    db_host = os.getenv("DB_HOST", "lin020.dev.e2open.com")
    db_port = int(os.getenv("DB_PORT", "1521"))
    db_sid = os.getenv("DB_SID", "GTM")

    dsn = oracledb.makedsn(db_host, db_port, sid=db_sid)
    con = oracledb.connect(user=db_user, password=db_password, dsn=dsn)

    try:
        import_countries, ecn_rows, full_embargo, sanctions = fetch_cn_data(con)
    finally:
        con.close()

    rows = build_rows(import_countries, ecn_rows, full_embargo, sanctions)
    output_files = write_workbook_parts(template_path, output_dir, rows)

    decision_counts: dict[str, int] = {}
    for row in rows:
        decision_counts[row.decision] = decision_counts.get(row.decision, 0) + 1

    print("SUMMARY")
    print(f"import_country_count={len(import_countries)}")
    print(f"ecn_count={len(ecn_rows)}")
    print(f"full_embargo_count={len(full_embargo)}")
    print(f"sanctions_count={len(sanctions)}")
    print(f"generated_combinations={len(rows)}")
    print("decision_distribution=" + str(decision_counts))
    print("output_files=")
    for path in output_files:
        print(str(path))


if __name__ == "__main__":
    main()
