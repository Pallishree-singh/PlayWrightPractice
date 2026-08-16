# CN LREQ Agent Run Template v1

Use this document to run the published LREQ Generic Agent with minimal effort.

## Step 1: Fill Required Values

Replace all placeholders wrapped in angle brackets.

- TARGET_COUNTRY: CN
- AGENCY_CODE: MOC
- TEMPLATE_FILE_PATH: C:\Users\pallishree.singh\OneDrive - WiseTech Global\Pallishree_Backup\D-Drive_Backup_Final\EXPORT_TRADE\26.4\LREQ\FR_ECN-CA1-Y_COI_CA1-N.xls
- OUTPUT_FOLDER_PATH: C:\Users\pallishree.singh\OneDrive - WiseTech Global\Pallishree_Backup\D-Drive_Backup_Final\EXPORT_TRADE\26.4\LREQ
- OUTPUT_FORMAT: xls
- EFFECTIVE_DATE_MODE: SYSDATE
- EFFECTIVE_DATE_VALUE: 
- DECISION_VALUES_ALLOWED: EL,NLR
- COMBINATION_TOOL_NAME: acts_gui_2.9
- COMBINATION_TOOL_CALL_METHOD: java -jar acts_gui_2.9.jar
- COMBINATION_TOOL_INPUT_FORMAT: TABLE

## Step 2: Provide Regulatory Decision Logic

Paste the full CN rule logic in this exact structure:

### CN_FLOW_RULES
1. Rule ID: CN_R1_FULL_EMBARGO
   - Condition: Is destination a full embargo country (absolute)?
   - If Yes: Decision = Embargo; License = EL (DOC Hold)
   - If No: Go to CN_R2_SANCTION_COUNTRY
2. Rule ID: CN_R2_SANCTION_COUNTRY
   - Condition: Is destination a sanction country?
   - If Yes: Go to CN_R3_MIL_END_USE
   - If No: Go to CN_R4_ECN_DOS
3. Rule ID: CN_R3_MIL_END_USE
   - Condition: Is end use military or military intelligence?
   - If Yes: License = EL (DOC Hold); add comment: Sanctions may apply
   - If No: Add comment: Sanctions may apply; then go to CN_R4_ECN_DOS
4. Rule ID: CN_R4_ECN_DOS
   - Condition: Is ECN.DOS = Y (Munitions List number)?
   - If Yes: License = EL (DOS Hold)
   - If No: Go to CN_R5_NOCLASS
5. Rule ID: CN_R5_NOCLASS
   - Condition: Is ECN = NOCLASS?
   - If Yes: Decision = NLR (No Dual Use License Required)
   - If No: License = EL (DOC Hold)

### CN_FOOTNOTE_MAPPING
1. Superscript: Note-1
   - Meaning: ECN.DOS flag is set to Y for items classified under Military Goods List.
   - SQL or Rule Impact: Rule CN_R4_ECN_DOS must use ECN.DOS field to identify munitions-list items.
2. Superscript: Note-2
   - Meaning: Absolute embargo is captured in LCS_ABSOLUTE_EMBARGO table where ABSOLUTE flag = Y.
   - SQL or Rule Impact: Rule CN_R1_FULL_EMBARGO should evaluate destination against LCS_ABSOLUTE_EMBARGO with ABSOLUTE='Y'.
3. Superscript: Note-3
   - Meaning: Sanctions are captured in LCS_ABSOLUTE_EMBARGO table where ABSOLUTE flag = N.
   - SQL or Rule Impact: Rule CN_R2_SANCTION_COUNTRY should evaluate destination against LCS_ABSOLUTE_EMBARGO with ABSOLUTE='N'.
4. Superscript: General-Note
   - Meaning: Perform both ECN (Dual Use Goods) based and HS-based export controls for China.
   - SQL or Rule Impact: Keep rule engine extensible for HS checks in addition to ECN checks.

## Step 3: Paste SQL Templates

### IMPORT_COUNTRY_SQL
```sql
SELECT
      a.country_id
FROM lcs_country_chart_global a
WHERE a.export_country_id = 'CN'
   AND a.CB1 = 'Y'
   AND a.rec_status = 'A'
   AND a.effective_date = (
            SELECT MAX(b.effective_date)
            FROM lcs_country_chart_global b
            WHERE a.export_country_id = b.export_country_id
               AND a.export_cntry_group = b.export_cntry_group
               AND a.country_id = b.country_id
               AND b.effective_date <= SYSDATE
   );
```

### ECN_SQL
```sql
SELECT
      a.eccnum,
      a.control_attribute16,
      a.cb1,
      a.rs2
FROM lcs_ECCN_chart_global a
WHERE a.export_country_id = 'CN'
   AND a.cb1 = 'Y'
   AND a.rs2 IS NULL
   AND a.rec_status = 'A'
   AND a.effective_date = (
            SELECT MAX(b.effective_date)
            FROM lcs_ECCN_chart_global b
            WHERE a.export_country_id = b.export_country_id
               AND a.export_cntry_group = b.export_cntry_group
               AND a.eccnum = b.eccnum
               AND b.effective_date <= SYSDATE
   );
```

### EMBARGO_SANCTIONS_SQL
```sql
SELECT
      country_id,
      absolute
FROM lcs_absolute_embargo
WHERE export_country_id = 'CN'
   AND rec_status = 'A';
```

## Step 4: Agent Execution Prompt (Copy-Paste)

Use this with the agent LREQ Generic Agent:

"""
Run LREQ automation for the following country setup.

Country setup:
- Target country: CN
- Agency code: MOC
- Decision values allowed: EL,NLR

Template and output:
- Template file path: C:\Users\pallishree.singh\OneDrive - WiseTech Global\Pallishree_Backup\D-Drive_Backup_Final\EXPORT_TRADE\26.4\LREQ\FR_ECN-CA1-Y_COI_CA1-N.xls
- Output folder path: C:\Users\pallishree.singh\OneDrive - WiseTech Global\Pallishree_Backup\D-Drive_Backup_Final\EXPORT_TRADE\26.4\LREQ
- Output format: xls

Date behavior:
- Effective date mode: SYSDATE
- Effective date value: blank

Combination tool:
- Tool name: acts_gui_2.9
- Call method: java -jar acts_gui_2.9.jar
- Input format: TABLE

SQL templates:
- Import country SQL:
SELECT
      a.country_id
FROM lcs_country_chart_global a
WHERE a.export_country_id = 'CN'
   AND a.CB1 = 'Y'
   AND a.rec_status = 'A'
   AND a.effective_date = (
            SELECT MAX(b.effective_date)
            FROM lcs_country_chart_global b
            WHERE a.export_country_id = b.export_country_id
               AND a.export_cntry_group = b.export_cntry_group
               AND a.country_id = b.country_id
               AND b.effective_date <= SYSDATE
   );

- ECN SQL:
SELECT
      a.eccnum,
      a.control_attribute16,
      a.cb1,
      a.rs2
FROM lcs_ECCN_chart_global a
WHERE a.export_country_id = 'CN'
   AND a.cb1 = 'Y'
   AND a.rs2 IS NULL
   AND a.rec_status = 'A'
   AND a.effective_date = (
            SELECT MAX(b.effective_date)
            FROM lcs_ECCN_chart_global b
            WHERE a.export_country_id = b.export_country_id
               AND a.export_cntry_group = b.export_cntry_group
               AND a.eccnum = b.eccnum
               AND b.effective_date <= SYSDATE
   );

Regulatory rules:
- Flow rules:
CN_R1_FULL_EMBARGO: If destination is in full embargo (absolute), set Decision=Embargo and License=EL (DOC Hold), else CN_R2_SANCTION_COUNTRY.
CN_R2_SANCTION_COUNTRY: If destination is a sanction country, go to CN_R3_MIL_END_USE, else CN_R4_ECN_DOS.
CN_R3_MIL_END_USE: If end use is military/military intelligence, set License=EL (DOC Hold) and add comment Sanctions may apply; if No, add comment Sanctions may apply and continue to CN_R4_ECN_DOS.
CN_R4_ECN_DOS: If ECN.DOS = Y (Munitions List), set License=EL (DOS Hold), else CN_R5_NOCLASS.
CN_R5_NOCLASS: If ECN=NOCLASS, set Decision=NLR (No Dual Use License Required), else License=EL (DOC Hold).

- Footnote mappings:
Note-1: ECN.DOS=Y identifies Military Goods List items.
Note-2: Full embargo lookup is from LCS_ABSOLUTE_EMBARGO with ABSOLUTE='Y'.
Note-3: Sanctions lookup is from LCS_ABSOLUTE_EMBARGO with ABSOLUTE='N'.
General-Note: Apply both ECN-based and HS-based controls for CN.

Execution requirements:
1. Preserve template structure and non-Input sheets.
2. Populate Input sheet with CN-specific values:
   - LREQ = CN_MOC_ECN
   - LREQ Ctry = CN
   - Export Ctry = CN
   - Import Ctry from Import country SQL result
   - ECN from ECN SQL result
   - Expected Results-Decision from rule evaluation
3. Generate country-ECN pairs using provided combination tool.
4. Remove duplicates by LREQ + Export Ctry + Import Ctry + ECN.
5. Save output file and provide run summary with counts and decision distribution.
6. If any mandatory input is missing, stop and list missing fields.
"""

## Step 5: Output Validation Checklist

After run, verify:
1. Output file created in output folder.
2. Input rows generated with CN values and ECN values.
3. No duplicate key rows.
4. Decision column fully populated.
5. PARTNER, GPM, Transaction sheets unchanged.

## Optional: Minimal Example Values

- TARGET_COUNTRY: CN
- AGENCY_CODE: MOC
- OUTPUT_FORMAT: xls
- EFFECTIVE_DATE_MODE: SYSDATE
