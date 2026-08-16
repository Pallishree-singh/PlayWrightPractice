from __future__ import annotations

import math
from dataclasses import dataclass
from pathlib import Path

import oracledb
import win32com.client as win32

MAX_XLS_DATA_ROWS = 60000

EUD_LABEL = {
    "C": "CIVIL",
    "M": "MILITARY",
    "MI": "MILITARY_INTELLIGENCE",
}


@dataclass(frozen=True)
class EcnRecord:
    ecn: str
    dos_y: bool
    is_noclass: bool


@dataclass(frozen=True)
class ScenarioDef:
    code: str
    title: str
    expected_decision: str
    euds: tuple[str, ...]


@dataclass(frozen=True)
class ScenarioRow:
    import_ctry: str
    ecn: str
    eud: str
    decision: str
    scenario_desc: str


def fetch_base(conn: oracledb.Connection) -> tuple[list[str], list[EcnRecord], list[str], list[str]]:
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
        SELECT DISTINCT a.eccnum, NVL(a.control_attribute16, 'N')
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
    ecn_records = [
        EcnRecord(ecn=r[0], dos_y=str(r[1]).upper() == "Y", is_noclass=str(r[0]).upper() == "NOCLASS")
        for r in cur.fetchall()
        if r[0]
    ]

    cur.execute(
        """
        SELECT DISTINCT imp_country
        FROM lcs_absolute_embargo
        WHERE exp_country = 'CN'
          AND rec_status = 'A'
          AND absolute = 'Y'
          AND imp_country IS NOT NULL
        ORDER BY imp_country
        """
    )
    embargo_y = [r[0] for r in cur.fetchall()]

    cur.execute(
        """
        SELECT DISTINCT imp_country
        FROM lcs_absolute_embargo
        WHERE exp_country = 'CN'
          AND rec_status = 'A'
          AND absolute = 'N'
          AND imp_country IS NOT NULL
        ORDER BY imp_country
        """
    )
    sanction_y = [r[0] for r in cur.fetchall()]

    cur.close()
    return import_countries, ecn_records, embargo_y, sanction_y


def cartesian_rows(
    countries: list[str],
    ecns: list[EcnRecord],
    euds: tuple[str, ...],
    decision: str,
    scenario_text: str,
) -> list[ScenarioRow]:
    rows: list[ScenarioRow] = []
    for country in countries:
        for rec in ecns:
            for eud in euds:
                rows.append(
                    ScenarioRow(
                        import_ctry=country,
                        ecn=rec.ecn,
                        eud=eud,
                        decision=decision,
                        scenario_desc=f"{scenario_text} | EUD={eud}",
                    )
                )
    return rows


def build_scenarios(
    imports: list[str],
    ecn_records: list[EcnRecord],
    embargo_y: list[str],
    sanction_y: list[str],
) -> dict[ScenarioDef, list[ScenarioRow]]:
    embargo_set = set(embargo_y)
    sanction_set = set(sanction_y)
    sanction_n = [c for c in imports if c not in embargo_set and c not in sanction_set]

    dos_y = [r for r in ecn_records if r.dos_y]
    dos_n = [r for r in ecn_records if not r.dos_y]
    noclass_y = [r for r in dos_n if r.is_noclass]
    noclass_n = [r for r in dos_n if not r.is_noclass]

    fallback_country = sanction_y[0] if sanction_y else (imports[0] if imports else "CN")
    fallback_country_non_sanction = sanction_n[0] if sanction_n else fallback_country
    fallback_ecn = noclass_n[0] if noclass_n else (ecn_records[0] if ecn_records else EcnRecord("NOCLASS", False, True))

    scenarios: list[ScenarioDef] = [
        ScenarioDef("S1", "EmbargoY", "EL", ("C", "M", "MI")),
        ScenarioDef("S2", "EmbargoN_SanctionY_MilitaryY", "EL", ("C", "M", "MI")),
        ScenarioDef("S3", "EmbargoN_SanctionY_MilitaryN_DOSY", "EL", ("C", "M", "MI")),
        ScenarioDef("S4", "EmbargoN_SanctionY_MilitaryN_DOSN_NoClassY", "NLR", ("C", "M", "MI")),
        ScenarioDef("S5", "EmbargoN_SanctionY_MilitaryN_DOSN_NoClassN", "EL", ("C", "M", "MI")),
        ScenarioDef("S6", "EmbargoN_SanctionN_DOSY", "EL", ("C", "M", "MI")),
        ScenarioDef("S7", "EmbargoN_SanctionN_DOSN_NoClassY", "NLR", ("C", "M", "MI")),
        ScenarioDef("S8", "EmbargoN_SanctionN_DOSN_NoClassN", "EL", ("C", "M", "MI")),
    ]

    out: dict[ScenarioDef, list[ScenarioRow]] = {}

    for s in scenarios:
        if s.code == "S1":
            rows = cartesian_rows(
                embargo_y,
                ecn_records,
                s.euds,
                s.expected_decision,
                "Embargo condition = Y",
            )
            if not rows:
                rows = [
                    ScenarioRow(
                        import_ctry=fallback_country,
                        ecn=fallback_ecn.ecn,
                        eud=e,
                        decision=s.expected_decision,
                        scenario_desc="Embargo condition = Y (simulated because ABSOLUTE='Y' countries not present in DB)"
                        + f" | EUD={e}",
                    )
                    for e in s.euds
                ]

        elif s.code == "S2":
            rows = cartesian_rows(
                sanction_y,
                ecn_records,
                s.euds,
                s.expected_decision,
                "Embargo=N, Sanction=Y, Military End Use=Y",
            )

        elif s.code == "S3":
            rows = cartesian_rows(
                sanction_y,
                dos_y,
                s.euds,
                s.expected_decision,
                "Embargo=N, Sanction=Y, Military End Use=N, DOS=Y",
            )
            if not rows:
                rows = [
                    ScenarioRow(
                        import_ctry=fallback_country,
                        ecn=fallback_ecn.ecn,
                        eud=e,
                        decision=s.expected_decision,
                        scenario_desc=f"Embargo=N, Sanction=Y, Military End Use=N, DOS=Y (simulated because DOS=Y ECN not present in DB) | EUD={e}",
                    )
                    for e in s.euds
                ]

        elif s.code == "S4":
            rows = cartesian_rows(
                sanction_y,
                noclass_y,
                s.euds,
                s.expected_decision,
                "Embargo=N, Sanction=Y, Military End Use=N, DOS=N, NoClass=Y",
            )

        elif s.code == "S5":
            rows = cartesian_rows(
                sanction_y,
                noclass_n,
                s.euds,
                s.expected_decision,
                "Embargo=N, Sanction=Y, Military End Use=N, DOS=N, NoClass=N",
            )

        elif s.code == "S6":
            rows = cartesian_rows(
                sanction_n,
                dos_y,
                s.euds,
                s.expected_decision,
                "Embargo=N, Sanction=N, DOS=Y",
            )
            if not rows:
                rows = [
                    ScenarioRow(
                        import_ctry=fallback_country_non_sanction,
                        ecn=fallback_ecn.ecn,
                        eud=e,
                        decision=s.expected_decision,
                        scenario_desc="Embargo=N, Sanction=N, DOS=Y (simulated because DOS=Y ECN not present in DB)"
                        + f" | EUD={e}",
                    )
                    for e in s.euds
                ]

        elif s.code == "S7":
            rows = cartesian_rows(
                sanction_n,
                noclass_y,
                s.euds,
                s.expected_decision,
                "Embargo=N, Sanction=N, DOS=N, NoClass=Y",
            )

        elif s.code == "S8":
            rows = cartesian_rows(
                sanction_n,
                noclass_n,
                s.euds,
                s.expected_decision,
                "Embargo=N, Sanction=N, DOS=N, NoClass=N",
            )

        else:
            rows = []

        out[s] = rows

    return out


def write_scenario_files(template_path: Path, output_dir: Path, scenario_rows: dict[ScenarioDef, list[ScenarioRow]]) -> list[Path]:
    excel = win32.DispatchEx("Excel.Application")
    excel.Visible = False
    excel.DisplayAlerts = False
    excel.ScreenUpdating = False
    excel.EnableEvents = False

    generated: list[Path] = []

    try:
        for scenario, rows in scenario_rows.items():
            if not rows:
                continue

            parts = max(1, math.ceil(len(rows) / MAX_XLS_DATA_ROWS))
            for part_idx in range(parts):
                start = part_idx * MAX_XLS_DATA_ROWS
                end = min(start + MAX_XLS_DATA_ROWS, len(rows))
                part_rows = rows[start:end]

                part_suffix = f"_P{part_idx + 1}" if parts > 1 else ""
                file_name = (
                    f"LREQ_CN_{scenario.code}_{scenario.title}{part_suffix}_"
                    f"S000001-S{len(part_rows):06d}.xls"
                )
                out_path = output_dir / file_name

                wb = excel.Workbooks.Open(str(template_path))
                ws_input = wb.Worksheets("input")
                ws_desc = wb.Worksheets("Test Description")

                ws_input.Range("A3:W65536").ClearContents()

                start_row = 3
                end_row = start_row + len(part_rows) - 1

                scenario_ids = [[i] for i in range(1, len(part_rows) + 1)]
                org_vals = [["SYSTEM"] for _ in part_rows]
                lreq_vals = [["CN_MOC_ECN"] for _ in part_rows]
                cn_vals = [["CN"] for _ in part_rows]
                import_vals = [[r.import_ctry] for r in part_rows]
                ecn_vals = [[r.ecn] for r in part_rows]
                desc_vals = [[r.scenario_desc] for r in part_rows]
                decision_vals = [[r.decision] for r in part_rows]
                exporter_vals = [["EXPORTER"] for _ in part_rows]
                shipto_vals = [["SHIP_TO"] for _ in part_rows]
                enduser_vals = [[r.eud] for r in part_rows]

                ws_input.Range(f"B{start_row}:B{end_row}").Value = scenario_ids
                ws_input.Range(f"C{start_row}:C{end_row}").Value = org_vals
                ws_input.Range(f"D{start_row}:D{end_row}").Value = lreq_vals
                ws_input.Range(f"E{start_row}:E{end_row}").Value = cn_vals
                ws_input.Range(f"F{start_row}:F{end_row}").Value = cn_vals
                ws_input.Range(f"H{start_row}:H{end_row}").Value = import_vals
                ws_input.Range(f"K{start_row}:K{end_row}").Value = ecn_vals
                ws_input.Range(f"M{start_row}:M{end_row}").Value = desc_vals
                ws_input.Range(f"N{start_row}:N{end_row}").Value = decision_vals
                ws_input.Range(f"W{start_row}:W{end_row}").Value = exporter_vals
                ws_input.Range(f"X{start_row}:X{end_row}").Value = shipto_vals
                ws_input.Range(f"Y{start_row}:Y{end_row}").Value = enduser_vals

                eud_in_file = sorted({r.eud for r in part_rows})
                eud_labels = ", ".join(f"{e}={EUD_LABEL.get(e, e)}" for e in eud_in_file)
                ws_desc.Cells(2, 2).Value = (
                    f"{scenario.code}: {scenario.title}"
                    f"\nFlow covered exactly for this scenario branch."
                    f"\nEUD covered in this file: {eud_labels}"
                    f"\nRows in file: {len(part_rows)}"
                )
                ws_desc.Cells(2, 3).Value = scenario.expected_decision

                wb.SaveAs(str(out_path), FileFormat=56)
                wb.Close(SaveChanges=False)
                generated.append(out_path)
                print(f"generated={out_path.name} rows={len(part_rows)}", flush=True)

    finally:
        excel.Quit()

    return generated


def main() -> None:
    base = Path(r"c:\Users\pallishree.singh\OneDrive - WiseTech Global\Pallishree_Backup\D-Drive_Backup_Final\EXPORT_TRADE\26.4\LREQ")
    template = base / "FR_ECN-CA1-Y_COI_CA1-N.xls"

    dsn = oracledb.makedsn("lin020.dev.e2open.com", 1521, sid="GTM")
    con = oracledb.connect(user="GK_GTM_OWNER", password="GK_WORLD", dsn=dsn)
    try:
        imports, ecn_records, embargo_y, sanction_y = fetch_base(con)
    finally:
        con.close()

    scenario_rows = build_scenarios(imports, ecn_records, embargo_y, sanction_y)
    files = write_scenario_files(template, base, scenario_rows)

    print("SUMMARY")
    for scenario, rows in scenario_rows.items():
        print(f"{scenario.code}_{scenario.title}={len(rows)}")
    print("FILES")
    for f in files:
        print(str(f))


if __name__ == "__main__":
    main()
