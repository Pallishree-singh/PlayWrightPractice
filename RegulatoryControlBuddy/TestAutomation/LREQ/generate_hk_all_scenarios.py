"""
HK (Hong Kong) LREQ automation script generator.

Data sources (all under HK/ subfolder):
  - HK_ABSOLUTE EMBARGO CountryList.xlsx  → full-embargo import countries
  - Sanction country list.xlsx            → sanction import countries
  - ECCNUM with DOS-Y.xlsx                → DOS=Y ECCNs (Munitions-List)
  - ECCNUM = "NOCLASS"                    → NoClass=Y ECN (hard-coded)

Output subfolders (mirroring CN structure):
  HK/Embargo/   → S1
  HK/Sanction/  → S2, S3, S4, S5
  HK/DOS/       → S6
  HK/NoClass/   → S7, S8
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from pathlib import Path

import openpyxl
import win32com.client as win32

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
COUNTRY_CODE   = "HK"
LREQ_CODE      = "HK_MOC_ECN"
MAX_ROWS       = 60_000

EUD_LABEL = {
    "C":  "CIVIL",
    "M":  "MILITARY",
    "MI": "MILITARY_INTELLIGENCE",
}

# Representative non-DOS, non-NOCLASS EAR/ECCN codes for S5 / S8 scenarios.
# These are common dual-use items regularly controlled for HK exports.
NON_DOS_NON_NOCLASS_ECNS: list[str] = [
    "1A001", "1A002", "1B001", "1C001", "1D001", "1E001",
    "2B001", "2D001", "2E001",
    "3A001", "3A002", "3B001", "3C001", "3D001", "3E001",
    "4A001", "4A002", "4D001", "4E001",
    "5A001", "5A002", "5B001", "5D001", "5D002", "5E001", "5E002",
    "6A001", "6A002", "6B001", "6C001", "6D001", "6E001",
    "7A001", "7A002", "7A003", "7B001", "7D001", "7E001",
    "8A001", "8A002", "8B001", "8D001", "8E001",
    "9A001", "9A002", "9A003", "9B001", "9D001", "9E001",
]

# Non-sanction, non-embargo import countries used for S6 / S7 / S8.
# All verified not to appear in either reference list.
NON_SANCTION_COUNTRIES: list[str] = [
    "AU", "BR", "CA", "CN", "CZ", "DE", "DK", "ES", "FI", "FR",
    "GB", "GH", "GR", "HU", "ID", "IN", "IT", "JO", "JP", "KE",
    "KR", "KW", "MA", "MX", "MY", "NG", "NL", "NO", "NZ", "OM",
    "PH", "PK", "PL", "PT", "QA", "RO", "SA", "SE", "SG", "SK",
    "TH", "TN", "TW", "UA", "US", "VN", "ZA", "AE", "AT", "BE",
    "BH", "BG", "CH", "HR", "EG", "SI",
]


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------
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


# ---------------------------------------------------------------------------
# Readers
# ---------------------------------------------------------------------------

def _read_column(xlsx_path: Path, col_index: int, skip_header: bool = True) -> list[str]:
    wb = openpyxl.load_workbook(xlsx_path, read_only=True, data_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))
    wb.close()
    start = 1 if skip_header else 0
    return [str(r[col_index]).strip() for r in rows[start:] if r[col_index] and str(r[col_index]).strip().upper() not in ("NONE", "NULL", "")]


def load_reference_data(hk_dir: Path) -> tuple[list[str], list[str], list[EcnRecord]]:
    """Return embargo_countries, sanction_countries, ecn_records."""
    embargo_countries = _read_column(hk_dir / "HK_ABSOLUTE EMBARGO CountryList.xlsx", col_index=1)
    sanction_countries = _read_column(hk_dir / "Sanction country list.xlsx", col_index=1)

    dos_ecns_raw = _read_column(hk_dir / "ECCNUM with DOS-Y.xlsx", col_index=0)

    ecn_records: list[EcnRecord] = []
    seen: set[str] = set()

    for ecn in dos_ecns_raw:
        key = ecn.upper()
        if key not in seen:
            seen.add(key)
            ecn_records.append(EcnRecord(ecn=ecn, dos_y=True, is_noclass=False))

    # Add NOCLASS
    ecn_records.append(EcnRecord(ecn="NOCLASS", dos_y=False, is_noclass=True))

    # Add non-DOS non-NOCLASS ECCNs for S5/S8 scenarios
    for ecn in NON_DOS_NON_NOCLASS_ECNS:
        key = ecn.upper()
        if key not in seen:
            seen.add(key)
            ecn_records.append(EcnRecord(ecn=ecn, dos_y=False, is_noclass=False))

    return embargo_countries, sanction_countries, ecn_records


# ---------------------------------------------------------------------------
# Scenario builder (mirrors CN logic exactly)
# ---------------------------------------------------------------------------

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
                rows.append(ScenarioRow(
                    import_ctry=country,
                    ecn=rec.ecn,
                    eud=eud,
                    decision=decision,
                    scenario_desc=f"{scenario_text} | EUD={eud}",
                ))
    return rows


def build_scenarios(
    embargo_countries: list[str],
    sanction_countries: list[str],
    ecn_records: list[EcnRecord],
) -> dict[ScenarioDef, list[ScenarioRow]]:

    embargo_set  = set(embargo_countries)
    sanction_set = set(sanction_countries)

    # Non-sanction, non-embargo countries for S6/S7/S8
    sanction_n = [c for c in NON_SANCTION_COUNTRIES if c not in embargo_set and c not in sanction_set]

    dos_y      = [r for r in ecn_records if r.dos_y]
    dos_n      = [r for r in ecn_records if not r.dos_y]
    noclass_y  = [r for r in dos_n if r.is_noclass]
    noclass_n  = [r for r in dos_n if not r.is_noclass]

    # Fallbacks for empty lists
    fallback_embargo  = embargo_countries[0]  if embargo_countries  else "TZ"
    fallback_sanction = sanction_countries[0] if sanction_countries else "CF"
    fallback_non_sanc = sanction_n[0]         if sanction_n         else "JP"
    fallback_ecn      = noclass_n[0]          if noclass_n          else EcnRecord("3A001", False, False)

    scenarios: list[ScenarioDef] = [
        ScenarioDef("S1", "EmbargoY",                              "EL",  ("C", "M", "MI")),
        ScenarioDef("S2", "EmbargoN_SanctionY_MilitaryY",          "EL",  ("C", "M", "MI")),
        ScenarioDef("S3", "EmbargoN_SanctionY_MilitaryN_DOSY",     "ML",  ("C", "M", "MI")),
        ScenarioDef("S4", "EmbargoN_SanctionY_MilitaryN_DOSN_NoClassY",  "NLR", ("C", "M", "MI")),
        ScenarioDef("S5", "EmbargoN_SanctionY_MilitaryN_DOSN_NoClassN",  "EL",  ("C", "M", "MI")),
        ScenarioDef("S6", "EmbargoN_SanctionN_DOSY",               "ML",  ("C", "M", "MI")),
        ScenarioDef("S7", "EmbargoN_SanctionN_DOSN_NoClassY",      "NLR", ("C", "M", "MI")),
        ScenarioDef("S8", "EmbargoN_SanctionN_DOSN_NoClassN",      "EL",  ("C", "M", "MI")),
    ]

    out: dict[ScenarioDef, list[ScenarioRow]] = {}

    for s in scenarios:
        if s.code == "S1":
            rows = cartesian_rows(
                embargo_countries, ecn_records, s.euds, s.expected_decision,
                "Embargo condition = Y",
            )
            if not rows:
                rows = [ScenarioRow(fallback_embargo, fallback_ecn.ecn, e, s.expected_decision,
                    f"Embargo condition = Y (simulated) | EUD={e}") for e in s.euds]

        elif s.code == "S2":
            rows = cartesian_rows(
                sanction_countries, ecn_records, s.euds, s.expected_decision,
                "Embargo=N, Sanction=Y, Military End Use=Y",
            )

        elif s.code == "S3":
            rows = cartesian_rows(
                sanction_countries, dos_y, s.euds, s.expected_decision,
                "Embargo=N, Sanction=Y, Military End Use=N, DOS=Y",
            )
            if not rows:
                rows = [ScenarioRow(fallback_sanction, fallback_ecn.ecn, e, s.expected_decision,
                    f"Embargo=N, Sanction=Y, Military End Use=N, DOS=Y (simulated) | EUD={e}") for e in s.euds]

        elif s.code == "S4":
            rows = cartesian_rows(
                sanction_countries, noclass_y, s.euds, s.expected_decision,
                "Embargo=N, Sanction=Y, Military End Use=N, DOS=N, NoClass=Y",
            )

        elif s.code == "S5":
            rows = cartesian_rows(
                sanction_countries, noclass_n, s.euds, s.expected_decision,
                "Embargo=N, Sanction=Y, Military End Use=N, DOS=N, NoClass=N",
            )

        elif s.code == "S6":
            rows = cartesian_rows(
                sanction_n, dos_y, s.euds, s.expected_decision,
                "Embargo=N, Sanction=N, DOS=Y",
            )
            if not rows:
                rows = [ScenarioRow(fallback_non_sanc, fallback_ecn.ecn, e, s.expected_decision,
                    f"Embargo=N, Sanction=N, DOS=Y (simulated) | EUD={e}") for e in s.euds]

        elif s.code == "S7":
            rows = cartesian_rows(
                sanction_n, noclass_y, s.euds, s.expected_decision,
                "Embargo=N, Sanction=N, DOS=N, NoClass=Y",
            )

        elif s.code == "S8":
            rows = cartesian_rows(
                sanction_n, noclass_n, s.euds, s.expected_decision,
                "Embargo=N, Sanction=N, DOS=N, NoClass=N",
            )

        else:
            rows = []

        out[s] = rows

    return out


# ---------------------------------------------------------------------------
# Folder routing (mirrors CN subfolder layout)
# ---------------------------------------------------------------------------
SCENARIO_FOLDER: dict[str, str] = {
    "S1": "Embargo",
    "S2": "Sanction",
    "S3": "Sanction",
    "S4": "Sanction",
    "S5": "Sanction",
    "S6": "DOS",
    "S7": "NoClass",
    "S8": "NoClass",
}


# ---------------------------------------------------------------------------
# XLS writer
# ---------------------------------------------------------------------------

def write_scenario_files(
    template_path: Path,
    hk_dir: Path,
    scenario_rows: dict[ScenarioDef, list[ScenarioRow]],
) -> list[Path]:
    # Pre-create output subdirs
    for sub in ("Embargo", "Sanction", "DOS", "NoClass"):
        (hk_dir / sub).mkdir(parents=True, exist_ok=True)

    excel = win32.DispatchEx("Excel.Application")
    excel.Visible = False
    excel.DisplayAlerts = False
    excel.ScreenUpdating = False
    excel.EnableEvents = False

    generated: list[Path] = []

    try:
        for scenario, rows in scenario_rows.items():
            if not rows:
                print(f"SKIP {scenario.code}_{scenario.title} (no rows)", flush=True)
                continue

            sub_dir = hk_dir / SCENARIO_FOLDER[scenario.code]
            parts = max(1, math.ceil(len(rows) / MAX_ROWS))

            for part_idx in range(parts):
                start = part_idx * MAX_ROWS
                end   = min(start + MAX_ROWS, len(rows))
                part_rows = rows[start:end]

                part_suffix = f"_P{part_idx + 1}" if parts > 1 else ""
                file_name = (
                    f"LREQ_HK_{scenario.code}_{scenario.title}{part_suffix}_"
                    f"S000001-S{len(part_rows):06d}.xls"
                )
                out_path = sub_dir / file_name

                wb = excel.Workbooks.Open(str(template_path))
                ws_input = wb.Worksheets("input")
                ws_desc  = wb.Worksheets("Test Description")

                ws_input.Range("A3:W65536").ClearContents()

                s_row = 3
                e_row = s_row + len(part_rows) - 1

                ws_input.Range(f"B{s_row}:B{e_row}").Value = [[i]                    for i in range(1, len(part_rows) + 1)]
                ws_input.Range(f"C{s_row}:C{e_row}").Value = [["SYSTEM"]             for _ in part_rows]
                ws_input.Range(f"D{s_row}:D{e_row}").Value = [[LREQ_CODE]            for _ in part_rows]
                ws_input.Range(f"E{s_row}:E{e_row}").Value = [[COUNTRY_CODE]         for _ in part_rows]
                ws_input.Range(f"F{s_row}:F{e_row}").Value = [[COUNTRY_CODE]         for _ in part_rows]
                ws_input.Range(f"H{s_row}:H{e_row}").Value = [[r.import_ctry]        for r in part_rows]
                ws_input.Range(f"K{s_row}:K{e_row}").Value = [[r.ecn]               for r in part_rows]
                ws_input.Range(f"M{s_row}:M{e_row}").Value = [[r.scenario_desc]      for r in part_rows]
                ws_input.Range(f"N{s_row}:N{e_row}").Value = [[r.decision]           for r in part_rows]
                ws_input.Range(f"W{s_row}:W{e_row}").Value = [["EXPORTER"]           for _ in part_rows]
                ws_input.Range(f"X{s_row}:X{e_row}").Value = [["SHIP_TO"]            for _ in part_rows]
                ws_input.Range(f"Y{s_row}:Y{e_row}").Value = [[r.eud]               for r in part_rows]

                eud_labels = ", ".join(
                    f"{e}={EUD_LABEL.get(e, e)}"
                    for e in sorted({r.eud for r in part_rows})
                )
                ws_desc.Cells(2, 2).Value = (
                    f"{scenario.code}: {scenario.title}"
                    f"\nHK flow — branch covered exactly."
                    f"\nEUD covered: {eud_labels}"
                    f"\nRows in file: {len(part_rows)}"
                )
                ws_desc.Cells(2, 3).Value = scenario.expected_decision

                wb.SaveAs(str(out_path), FileFormat=56)
                wb.Close(SaveChanges=False)
                generated.append(out_path)
                print(f"generated={out_path.name}  rows={len(part_rows)}", flush=True)

    finally:
        excel.Quit()

    return generated


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    base_dir  = Path(__file__).parent
    hk_dir    = base_dir / "HK"
    template  = base_dir / "FR_ECN-CA1-Y_COI_CA1-N.xls"

    if not template.exists():
        raise FileNotFoundError(f"Template not found: {template}")

    print("Loading reference data …", flush=True)
    embargo_countries, sanction_countries, ecn_records = load_reference_data(hk_dir)

    print(f"  Embargo countries  : {len(embargo_countries)}")
    print(f"  Sanction countries : {len(sanction_countries)}")
    print(f"  DOS-Y ECCNs        : {sum(1 for r in ecn_records if r.dos_y)}")
    print(f"  NOCLASS ECCNs      : {sum(1 for r in ecn_records if r.is_noclass)}")
    print(f"  Other ECCNs        : {sum(1 for r in ecn_records if not r.dos_y and not r.is_noclass)}")
    print()

    print("Building scenarios …", flush=True)
    scenario_rows = build_scenarios(embargo_countries, sanction_countries, ecn_records)

    print("\nScenario row counts:")
    for s, rows in scenario_rows.items():
        print(f"  {s.code} {s.title:55s} → {len(rows):>8,} rows")

    total = sum(len(r) for r in scenario_rows.values())
    print(f"  {'TOTAL':57s} → {total:>8,} rows\n")

    print("Writing XLS files …", flush=True)
    generated = write_scenario_files(template, hk_dir, scenario_rows)

    print("\n=== SUMMARY ===")
    for s, rows in scenario_rows.items():
        print(f"  {s.code}_{s.title} = {len(rows)}")
    print(f"\nFiles generated: {len(generated)}")
    for f in generated:
        print(f"  {f}")


if __name__ == "__main__":
    main()
