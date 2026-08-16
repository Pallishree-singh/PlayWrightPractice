# LREQ Automation Script Generator — How-To Guide

This guide explains how to generate LREQ automation test scripts for any country, following the same process used for **China (CN)** and **Hong Kong (HK)**.

---

## What This Does

Given a country's export control flowchart and reference data files, this tool generates Excel (`.xls`) test datasets organised by scenario — Embargo, Sanction, DOS, and NoClass — ready to be loaded into the ACTS execution tool.

---

## Prerequisites

### 1. Python environment
```bash
# Activate the virtual environment
.venv\Scripts\activate

# Install required packages (one-time)
pip install openpyxl pdfplumber pywin32
```

### 2. Microsoft Excel must be installed
The script uses Excel COM automation (`win32com`) to write `.xls` files using the approved template format.

---

## Folder Structure

```
LREQ/
├── FR_ECN-CA1-Y_COI_CA1-N.xls          ← Master template (DO NOT modify)
├── generate_cn_all_scenarios_complete.py ← CN generator (DB-based)
├── generate_hk_all_scenarios.py          ← HK generator (Excel-based)
├── LREQ_Generic_Agent_Prompt_1.md        ← AI agent prompt reference
├── HK/                                   ← HK reference data
│   ├── HK_Flowchart.pdf
│   ├── HK_ABSOLUTE EMBARGO CountryList.xlsx
│   ├── Sanction country list.xlsx
│   └── ECCNUM with DOS-Y.xlsx
└── README.md                             ← This file

Final automation scripts/
├── CN/
│   ├── Embargo/    → S1
│   ├── Sanction/   → S2, S3, S4, S5
│   ├── DOS/        → S6
│   └── NoClass/    → S7, S8
└── HK/
    ├── Embargo/    → S1
    ├── Sanction/   → S2, S3, S4, S5
    ├── DOS/        → S6
    └── NoClass/    → S7, S8
```

---

## The 8 Standard Scenarios

Every country generates the same 8 scenario files, derived from the standard export control flowchart:

| Scenario | Branch Condition | Expected Decision |
|----------|-----------------|-------------------|
| **S1** | Full Embargo = Y (ABSOLUTE flag) | EL (DOC Hold) |
| **S2** | Embargo=N, Sanction=Y, Military/Mil-Intel End Use=Y | EL (DOC Hold) |
| **S3** | Embargo=N, Sanction=Y, Military=N, DOS=Y | Depends on country* |
| **S4** | Embargo=N, Sanction=Y, Military=N, DOS=N, NOCLASS=Y | NLR |
| **S5** | Embargo=N, Sanction=Y, Military=N, DOS=N, NOCLASS=N | EL (DOC Hold) |
| **S6** | Embargo=N, Sanction=N, DOS=Y | Depends on country* |
| **S7** | Embargo=N, Sanction=N, DOS=N, NOCLASS=Y | NLR |
| **S8** | Embargo=N, Sanction=N, DOS=N, NOCLASS=N | EL (DOC Hold) |

> **\* Always read the country flowchart PDF carefully.**
> - CN uses `EL (DOS Hold)` for S3 and S6.
> - HK uses `ML (DOS Hold)` for S3 and S6.
> - This may differ for each country.

---

## Steps to Add a New Country

### Step 1 — Prepare the reference data folder

Create a folder: `LREQ/<COUNTRY_CODE>/`

Inside it, place these 4 files:

| File | What it contains |
|------|-----------------|
| `<CC>_ABSOLUTE EMBARGO CountryList.xlsx` | List of absolute embargo import countries (`EXP_COUNTRY`, `IMP_COUNTRY`, `ABSOLUTE` columns) |
| `Sanction country list.xlsx` | List of sanctioned import countries (`EXP_COUNTRY`, `IMP_COUNTRY`, `SANCTION` columns) |
| `ECCNUM with DOS-Y.xlsx` | ECCNs where DOS flag = Y / Munitions List items (`ECCNUM`, `DOS` columns) |
| `<CC>_Flowchart.pdf` | The regulatory flowchart for this country |

> Column names must match exactly. Row 1 = header, data starts from Row 2.

---

### Step 2 — Read the flowchart PDF

Open the flowchart PDF and note:
1. What decision is returned for the **DOS=Y** path (S3 and S6)?
   - Is it `EL`, `ML`, or something else?
2. Are there any extra branches or conditions unique to this country?
3. Does the sanction path flow the same way (Military check → Sanctions comment)?

---

### Step 3 — Copy and adapt the HK generator script

```bash
# Copy the HK script as a starting point
copy generate_hk_all_scenarios.py  generate_<CC>_all_scenarios.py
```

Open the new script and update these values at the top:

```python
COUNTRY_CODE = "XX"          # Replace with your 2-letter country code
LREQ_CODE    = "XX_MOC_ECN"  # Replace XX with country code
```

Update the S3 and S6 decisions to match the flowchart:

```python
ScenarioDef("S3", "EmbargoN_SanctionY_MilitaryN_DOSY",  "EL",  ...),  # change "EL" if needed
ScenarioDef("S6", "EmbargoN_SanctionN_DOSY",            "EL",  ...),  # change "EL" if needed
```

Update the reference file paths in `load_reference_data()`:

```python
def load_reference_data(cc_dir: Path):
    embargo_countries = _read_column(cc_dir / "XX_ABSOLUTE EMBARGO CountryList.xlsx", col_index=1)
    sanction_countries = _read_column(cc_dir / "Sanction country list.xlsx", col_index=1)
    dos_ecns_raw = _read_column(cc_dir / "ECCNUM with DOS-Y.xlsx", col_index=0)
```

Update the `hk_dir` path in `main()`:

```python
def main():
    base_dir = Path(__file__).parent
    cc_dir   = base_dir / "XX"        # Replace XX with country code
```

---

### Step 4 — Run the script

```bash
python generate_XX_all_scenarios.py
```

Expected output:
```
Loading reference data …
  Embargo countries  : XX
  Sanction countries : XX
  DOS-Y ECCNs        : XX
  NOCLASS ECCNs      : 1
  Other ECCNs        : XX

Writing XLS files …
generated=LREQ_XX_S1_EmbargoY_S000001-SXXXXXX.xls  rows=XXXX
...

Files generated: 8
  LREQ\XX\Embargo\LREQ_XX_S1_...xls
  LREQ\XX\Sanction\LREQ_XX_S2_...xls
  ...
```

---

### Step 5 — Verify the output files

Before moving files, open 1–2 XLS files from each scenario folder and check:
- Column D = LREQ code (`XX_MOC_ECN`)
- Column E & F = Country code (`XX`)
- Column H = Import country (from your reference list)
- Column K = ECCNUM (from your reference files or NOCLASS)
- Column N = Decision (`EL`, `ML`, `NLR` — must match your flowchart)

---

### Step 6 — Move to Final automation scripts

```powershell
$final = "c:\PW3X\RegulatoryControlBuddy\TestAutomation\Final automation scripts"
$src   = "c:\PW3X\RegulatoryControlBuddy\TestAutomation\LREQ\XX"

New-Item -ItemType Directory "$final\XX" -Force
Move-Item "$src\Embargo"  "$final\XX\Embargo"
Move-Item "$src\Sanction" "$final\XX\Sanction"
Move-Item "$src\DOS"      "$final\XX\DOS"
Move-Item "$src\NoClass"  "$final\XX\NoClass"
```

> Replace `XX` with your country code in both paths.

---

## Countries Completed

| Country | Code | Script | DOS Decision | Files |
|---------|------|--------|-------------|-------|
| China | CN | `generate_cn_all_scenarios_complete.py` | EL (DOS Hold) | `Final automation scripts/CN/` |
| Hong Kong | HK | `generate_hk_all_scenarios.py` | ML (DOS Hold) | `Final automation scripts/HK/` |

---

## Common Issues

| Issue | Fix |
|-------|-----|
| `ModuleNotFoundError: openpyxl` | Run `pip install openpyxl` |
| `ModuleNotFoundError: win32com` | Run `pip install pywin32` |
| `FileNotFoundError: template` | Ensure `FR_ECN-CA1-Y_COI_CA1-N.xls` is in the `LREQ/` folder |
| `KeyError: 'input'` | The template sheet must be named exactly `input` |
| Excel opens visibly during run | Normal — script closes it automatically when done |
| `0 rows` for S3 or S6 | Your `ECCNUM with DOS-Y.xlsx` may be empty — check the file |
| Wrong decision in output | Re-read the flowchart PDF and correct S3/S6 decision values in the script |
