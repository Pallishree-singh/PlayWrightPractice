import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import JSZip from "jszip";


/* ── CSV escape helper ──────────────────────────────── */
function csvCell(v) {
  const s = String(v ?? "").replace(/"/g, '""');
  return /[,"\n\r]/.test(s) ? `"${s}"` : s;
}
function csvRow(cells) { return cells.map(csvCell).join(","); }

/* ── Test Case Generator — decision-specific ─────────── */
const HDR = ["Test Case ID","Test Suite","Test Module","Test Case Title","Test Case Description",
             "Pre-Conditions","Test Steps","Test Data (Input)","Expected Result",
             "Actual Result","Status","Priority","Remarks"];

function tc(id, mod, title, desc, pre, steps, data, exp, pri, rem = "") {
  return [id,"Export Controls",mod,title,desc,pre,steps,data,exp,"","Not Executed",pri,rem];
}

function generateTestCases(cc, _e, _s, _d, dosDecision) {
  const CC  = cc.toUpperCase();
  const EC  = "TZ";   // sample embargo country
  const SC  = "CF";   // sample sanction country
  const NC  = "JP";   // sample non-sanction country
  const ECN = "ML1";  // sample DOS=Y ECCN
  const REG = "3A001"; // sample dual-use ECCN

  const rows = [HDR];

  if (dosDecision === "EL") {
    rows.push(
      tc(`TC-${CC}-001`,"Full Embargo","Full embargo destination → EL",
        `Verify destination with ABSOLUTE=Y returns EL (DOC Hold).`,
        `${EC} has ABSOLUTE=Y in LCS_ABSOLUTE_EMBARGO.`,
        `1. Export=${CC}. 2. Import=${EC}. 3. ECN=NOCLASS. 4. Run License Determination.`,
        `Export=${CC}, Import=${EC}, ECN=NOCLASS, DOS=N`,
        `Decision=Embargo; License=EL; Hold=DOC Hold`,"Critical","First gate — no further processing"),

      tc(`TC-${CC}-002`,"Sanction Check","Sanction + Military → EL",
        `Verify sanction country with Military end use returns EL (DOC Hold) + Sanctions comment.`,
        `${SC} has ABSOLUTE=N. Order end use = Military.`,
        `1. Export=${CC}. 2. Import=${SC}. 3. EndUse=Military. 4. ECN=NOCLASS DOS=N. 5. Run.`,
        `Export=${CC}, Import=${SC}, EndUse=Military, ECN=NOCLASS, DOS=N`,
        `License=EL; Hold=DOC Hold; Comments="Sanctions may apply"`,"Critical",""),

      tc(`TC-${CC}-003`,"Sanction Check","Sanction + Military Intelligence → EL",
        `Verify Military Intelligence end use (08/03/21 revision) also returns EL + Sanctions comment.`,
        `${SC} has ABSOLUTE=N. Order end use = Military Intelligence.`,
        `1. Export=${CC}. 2. Import=${SC}. 3. EndUse=Military Intelligence. 4. Run.`,
        `Export=${CC}, Import=${SC}, EndUse=Military Intelligence, ECN=NOCLASS, DOS=N`,
        `License=EL; Hold=DOC Hold; Comments="Sanctions may apply"`,"Critical","Added 08/03/21"),

      tc(`TC-${CC}-004`,"Sanction Check","Sanction + Non-Military + Classified ECN → EL",
        `Verify sanction + commercial end use + dual-use ECN returns EL (DOC Hold) + Sanctions comment.`,
        `${SC} sanction country. ECN.DOS=N. ECN=${REG}.`,
        `1. Export=${CC}. 2. Import=${SC}. 3. EndUse=Commercial. 4. ECN=${REG} DOS=N. 5. Run.`,
        `Export=${CC}, Import=${SC}, EndUse=Commercial, ECN=${REG}, DOS=N`,
        `License=EL; Hold=DOC Hold; Comments="Sanctions may apply"`,"High",""),

      tc(`TC-${CC}-005`,"ECN Classification","Non-sanction + Classified ECN → EL",
        `Verify non-sanction destination with classified ECN returns EL (DOC Hold) without sanctions comment.`,
        `${NC} is NOT in embargo/sanction lists. ECN=${REG} DOS=N.`,
        `1. Export=${CC}. 2. Import=${NC}. 3. ECN=${REG} DOS=N. 4. EndUse=Commercial. 5. Run.`,
        `Export=${CC}, Import=${NC}, ECN=${REG}, DOS=N, EndUse=Commercial`,
        `License=EL; Hold=DOC Hold; No sanctions comment`,"Critical",""),

      tc(`TC-${CC}-006`,"ECN Classification","NULL ECN must NOT return NLR → EL",
        `Verify that NULL/empty ECN is held for review as EL and NOT treated as NOCLASS.`,
        `Item has no ECN assigned. Destination is non-sanction.`,
        `1. Export=${CC}. 2. Import=${NC}. 3. ECN=NULL. 4. Run.`,
        `Export=${CC}, Import=${NC}, ECN=NULL, DOS=N`,
        `License=EL; Hold=DOC Hold`,"Critical","Security: unclassified items must never get NLR"),

      tc(`TC-${CC}-007`,"Edge Cases","NOCLASS with trailing space → EL (not NLR)",
        `Verify ECN='NOCLASS ' (trailing space) does NOT trigger NLR — should return EL.`,
        `ECN field contains 'NOCLASS ' with whitespace due to data entry error.`,
        `1. Export=${CC}. 2. Import=${NC}. 3. ECN='NOCLASS ' (trailing space). 4. Run.`,
        `Export=${CC}, Import=${NC}, ECN='NOCLASS ' (trailing space), DOS=N`,
        `System trims OR returns EL/DOC Hold — must NOT return NLR`,"Medium","Security edge case"),

      tc(`TC-${CC}-008`,"End-to-End","E2E: Full embargo → EL (no further processing)",
        `Confirm embargo check is the first gate and stops all further processing.`,
        `Embargo country in LCS_ABSOLUTE_EMBARGO (ABSOLUTE=Y). ECN would qualify for NLR.`,
        `1. Export=${CC}. 2. Import=${EC}. 3. ECN=NOCLASS. 4. Run. 5. Confirm ECN check NOT reached.`,
        `Export=${CC}, Import=${EC}, ECN=NOCLASS, DOS=N`,
        `Decision=Embargo; License=EL; Hold=DOC Hold; System stops`,"Critical",""),

      tc(`TC-${CC}-009`,"End-to-End","E2E: Sanction + Military + any ECN → EL",
        `Confirm sanction + military combination always results in EL regardless of ECN.`,
        `${SC} sanction country. End use = Military.`,
        `1. Export=${CC}. 2. Import=${SC}. 3. EndUse=Military. 4. ECN=${REG} DOS=N. 5. Run.`,
        `Export=${CC}, Import=${SC}, EndUse=Military, ECN=${REG}, DOS=N`,
        `License=EL; Hold=DOC Hold; Comments="Sanctions may apply"`,"Critical",""),

      tc(`TC-${CC}-010`,"End-to-End","E2E: Real-time embargo table update → EL immediate",
        `Verify newly embargoed country triggers EL immediately without system restart.`,
        `CountryX added to LCS_ABSOLUTE_EMBARGO during live run.`,
        `1. Process order for CountryX — no embargo. 2. Add CountryX (ABSOLUTE=Y). 3. New order for CountryX. 4. Verify EL without restart.`,
        `Export=${CC}, Import=CountryX (newly embargoed), ECN=NOCLASS`,
        `New order returns EL Embargo decision immediately`,"High","")
    );

  } else if (dosDecision === "ML") {
    rows.push(
      tc(`TC-${CC}-001`,"ECN.DOS Check","Non-sanction + DOS=Y → ML (DOS Hold)",
        `Verify that when ECN.DOS=Y and destination is non-sanction the system returns ML (DOS Hold).`,
        `${NC} is NOT in embargo/sanction lists. Item ECN=${ECN} with DOS=Y flag.`,
        `1. Export=${CC}. 2. Import=${NC}. 3. ECN=${ECN} DOS=Y. 4. EndUse=Commercial. 5. Run.`,
        `Export=${CC}, Import=${NC}, ECN=${ECN}, DOS=Y, EndUse=Commercial`,
        `License=ML; Hold=DOS Hold`,"Critical",""),

      tc(`TC-${CC}-002`,"Sanction Check","Sanction + Non-Military + DOS=Y → ML + Sanctions comment",
        `Verify sanction country + non-military + DOS=Y returns ML (DOS Hold) with Sanctions may apply.`,
        `${SC} sanction country. Item ECN.DOS=Y. EndUse=Commercial.`,
        `1. Export=${CC}. 2. Import=${SC}. 3. EndUse=Commercial. 4. ECN=${ECN} DOS=Y. 5. Run.`,
        `Export=${CC}, Import=${SC}, ECN=${ECN}, DOS=Y, EndUse=Commercial`,
        `License=ML; Hold=DOS Hold; Comments="Sanctions may apply"`,"Critical",""),

      tc(`TC-${CC}-003`,"ECN.DOS Check","DOS=N must NOT return ML",
        `Verify that when ECN.DOS=N the ML path is NOT triggered — flow continues to NOCLASS check.`,
        `Item ECN.DOS=N. Non-sanction destination.`,
        `1. Export=${CC}. 2. Import=${NC}. 3. ECN=NOCLASS DOS=N. 4. Run.`,
        `Export=${CC}, Import=${NC}, ECN=NOCLASS, DOS=N`,
        `No ML license; system proceeds to ECN NOCLASS check`,"High","Negative test"),

      tc(`TC-${CC}-004`,"ECN.DOS Check","Multiple lines: DOS=Y gets ML, DOS=N does not",
        `Verify per-line evaluation — only the line with DOS=Y gets ML.`,
        `Order has 2 lines: Line1 DOS=Y, Line2 DOS=N. Non-sanction destination.`,
        `1. Export=${CC}. 2. Import=${NC}. 3. Line1: ECN=${ECN} DOS=Y. 4. Line2: ECN=NOCLASS DOS=N. 5. Run.`,
        `Export=${CC}, Import=${NC}, Line1: ECN=${ECN} DOS=Y, Line2: ECN=NOCLASS DOS=N`,
        `Line1=ML (DOS Hold); Line2=NLR`,"High","Per-line evaluation"),

      tc(`TC-${CC}-005`,"ECN.DOS Check","DOS flag case sensitivity (lowercase 'y')",
        `Verify that ECN.DOS='y' (lowercase) is treated same as 'Y' and returns ML.`,
        `ECN.DOS field contains lowercase 'y'.`,
        `1. Export=${CC}. 2. Import=${NC}. 3. ECN.DOS='y' (lowercase). 4. Run. 5. Compare with DOS='Y'.`,
        `Export=${CC}, Import=${NC}, ECN=${ECN}, DOS=y (lowercase)`,
        `System handles both 'y' and 'Y' consistently — returns ML (DOS Hold)`,"Medium",""),

      tc(`TC-${CC}-006`,"Sanction Check","Sanction + Military + DOS=Y → EL (not ML)",
        `Verify Military end use on sanction country returns EL regardless of DOS flag — sanction+military check comes first.`,
        `${SC} sanction country. EndUse=Military. ECN.DOS=Y.`,
        `1. Export=${CC}. 2. Import=${SC}. 3. EndUse=Military. 4. ECN=${ECN} DOS=Y. 5. Run.`,
        `Export=${CC}, Import=${SC}, EndUse=Military, ECN=${ECN}, DOS=Y`,
        `License=EL; Hold=DOC Hold (Military check overrides DOS check for sanction countries)`,"Critical","Order of checks matters"),

      tc(`TC-${CC}-007`,"End-to-End","E2E: Non-sanction + DOS=Y → ML with no extra comments",
        `Full end-to-end: clean destination + munitions item returns ML only (no sanctions comment).`,
        `${NC} non-sanction. ECN.DOS=Y.`,
        `1. Export=${CC}. 2. Import=${NC}. 3. ECN=${ECN} DOS=Y. 4. EndUse=Commercial. 5. Run.`,
        `Export=${CC}, Import=${NC}, ECN=${ECN}, DOS=Y, EndUse=Commercial`,
        `License=ML; Hold=DOS Hold; No sanctions comment`,"Critical",""),

      tc(`TC-${CC}-008`,"End-to-End","E2E: Real-time Munitions List ECCN addition → ML",
        `Verify newly added DOS=Y ECCN triggers ML immediately without restart.`,
        `New ECCN being added to Munitions List in the DB.`,
        `1. Process order with NewECCN — verify no ML. 2. Set NewECCN DOS=Y in system. 3. New order with same ECCN. 4. Verify ML without restart.`,
        `Export=${CC}, Import=${NC}, ECN=NewECCN (newly flagged DOS=Y)`,
        `New order returns ML (DOS Hold) immediately after ECCN update`,"High","Real-time config test"),

      tc(`TC-${CC}-009`,"Edge Cases","Embargo country with DOS=Y item → EL (not ML)",
        `Verify embargo check (first gate) returns EL and never reaches the DOS=Y ML check.`,
        `${EC} full embargo country. Item has DOS=Y.`,
        `1. Export=${CC}. 2. Import=${EC}. 3. ECN=${ECN} DOS=Y. 4. Run.`,
        `Export=${CC}, Import=${EC}, ECN=${ECN}, DOS=Y`,
        `Decision=Embargo; License=EL; Hold=DOC Hold — ML check never reached`,"Critical","First gate always wins"),

      tc(`TC-${CC}-010`,"Edge Cases","NULL ECN.DOS flag → not ML",
        `Verify NULL ECN.DOS flag is treated as N (not Y) and does NOT return ML.`,
        `Item has ECN.DOS=NULL.`,
        `1. Export=${CC}. 2. Import=${NC}. 3. ECN.DOS=NULL. 4. Run.`,
        `Export=${CC}, Import=${NC}, ECN=${ECN}, DOS=NULL`,
        `No ML; system treats NULL DOS as N and proceeds to NOCLASS check`,"Medium","NULL handling")
    );

  } else { // NLR
    rows.push(
      tc(`TC-${CC}-001`,"ECN Classification","NOCLASS ECN → NLR",
        `Verify that ECN=NOCLASS on a non-sanction non-embargo destination returns NLR.`,
        `${NC} is NOT in embargo/sanction lists. ECN=NOCLASS. DOS=N.`,
        `1. Export=${CC}. 2. Import=${NC}. 3. ECN=NOCLASS DOS=N. 4. EndUse=Commercial. 5. Run.`,
        `Export=${CC}, Import=${NC}, ECN=NOCLASS, DOS=N, EndUse=Commercial`,
        `Decision=NLR (No Dual Use License Required)`,"Critical","Primary happy path"),

      tc(`TC-${CC}-002`,"Sanction Check","Sanction + Non-Military + NOCLASS → NLR + Sanctions comment",
        `Verify sanction + non-military + NOCLASS still returns NLR but adds Sanctions may apply comment.`,
        `${SC} sanction country. ECN.DOS=N. ECN=NOCLASS. EndUse=Commercial.`,
        `1. Export=${CC}. 2. Import=${SC}. 3. EndUse=Commercial. 4. ECN=NOCLASS DOS=N. 5. Run.`,
        `Export=${CC}, Import=${SC}, ECN=NOCLASS, DOS=N, EndUse=Commercial`,
        `Decision=NLR; Comments="Sanctions may apply"`,"High","Sanctions comment present even for NLR"),

      tc(`TC-${CC}-003`,"ECN Classification","Classified ECN must NOT return NLR",
        `Verify that a specific dual-use ECN code never returns NLR.`,
        `Item ECN=3A001. Destination non-sanction.`,
        `1. Export=${CC}. 2. Import=${NC}. 3. ECN=3A001 DOS=N. 4. Run.`,
        `Export=${CC}, Import=${NC}, ECN=3A001, DOS=N`,
        `License=EL; Hold=DOC Hold — NOT NLR`,"Critical","Negative test"),

      tc(`TC-${CC}-004`,"ECN Classification","NULL ECN must NOT return NLR",
        `Verify NULL/empty ECN is NOT treated as NOCLASS and does NOT return NLR.`,
        `Item has no ECN assigned.`,
        `1. Export=${CC}. 2. Import=${NC}. 3. ECN=NULL. 4. Run.`,
        `Export=${CC}, Import=${NC}, ECN=NULL, DOS=N`,
        `License=EL; Hold=DOC Hold — NOT NLR`,"Critical","Security-critical"),

      tc(`TC-${CC}-005`,"Edge Cases","NOCLASS with trailing space → NOT NLR",
        `Verify ECN='NOCLASS ' (trailing space) does NOT match NOCLASS and does NOT return NLR.`,
        `ECN field has 'NOCLASS ' with a trailing space.`,
        `1. Export=${CC}. 2. Import=${NC}. 3. ECN='NOCLASS ' (trailing space). 4. Run.`,
        `Export=${CC}, Import=${NC}, ECN='NOCLASS ' (trailing space), DOS=N`,
        `System trims OR returns EL/DOC Hold — must NOT return NLR`,"Medium","Security edge case"),

      tc(`TC-${CC}-006`,"Edge Cases","NOCLASS case sensitivity — lowercase 'noclass'",
        `Verify whether ECN='noclass' (lowercase) is handled consistently with NOCLASS.`,
        `ECN field contains lowercase 'noclass'.`,
        `1. Export=${CC}. 2. Import=${NC}. 3. ECN='noclass' (lowercase). 4. Run.`,
        `Export=${CC}, Import=${NC}, ECN=noclass (lowercase), DOS=N`,
        `Document behavior: if case-insensitive → NLR; if case-sensitive → EL/DOC Hold`,"Medium",""),

      tc(`TC-${CC}-007`,"Edge Cases","Multiple lines: NOCLASS line → NLR, classified line → EL",
        `Verify per-line evaluation — NOCLASS line gets NLR, classified line gets EL.`,
        `Order has 2 lines. Non-sanction destination.`,
        `1. Export=${CC}. 2. Import=${NC}. 3. Line1: ECN=NOCLASS DOS=N. 4. Line2: ECN=3A001 DOS=N. 5. Run.`,
        `Export=${CC}, Import=${NC}, Line1: ECN=NOCLASS, Line2: ECN=3A001`,
        `Line1=NLR; Line2=EL (DOC Hold)`,"High","Per-line evaluation"),

      tc(`TC-${CC}-008`,"End-to-End","E2E: Happy path full NLR flow",
        `Full end-to-end: non-embargo, non-sanction, NOCLASS item returns NLR with no holds or comments.`,
        `All master data configured. Destination clean. Item NOCLASS.`,
        `1. Export=${CC}. 2. Import=${NC}. 3. ECN=NOCLASS DOS=N. 4. EndUse=Commercial. 5. Run.`,
        `Export=${CC}, Import=${NC}, ECN=NOCLASS, DOS=N, EndUse=Commercial`,
        `Decision=NLR; No holds; No comments`,"Critical",""),

      tc(`TC-${CC}-009`,"End-to-End","E2E: Embargo country with NOCLASS item → EL (not NLR)",
        `Verify embargo check (first gate) returns EL even if item would qualify for NLR.`,
        `${EC} full embargo country. ECN=NOCLASS.`,
        `1. Export=${CC}. 2. Import=${EC}. 3. ECN=NOCLASS DOS=N. 4. Run.`,
        `Export=${CC}, Import=${EC}, ECN=NOCLASS, DOS=N`,
        `Decision=Embargo; License=EL — NOCLASS NLR check never reached`,"Critical","First gate always wins"),

      tc(`TC-${CC}-010`,"End-to-End","E2E: DOS=Y item bypasses NOCLASS check → not NLR",
        `Verify DOS=Y item goes to DOS Hold path and NEVER reaches NOCLASS check.`,
        `${NC} non-sanction. ECN.DOS=Y.`,
        `1. Export=${CC}. 2. Import=${NC}. 3. ECN=ML1 DOS=Y. 4. Run.`,
        `Export=${CC}, Import=${NC}, ECN=ML1, DOS=Y`,
        `DOS Hold returned — NOCLASS check bypassed; Decision is NOT NLR`,"High","")
    );
  }

  return rows.map(r => csvRow(r)).join("\r\n");
}




/* ── Constants ─────────────────────────────────────── */
const EUD_LABELS = { C: "CIVIL", M: "MILITARY", MI: "MILITARY_INTELLIGENCE" };
const EUDS = ["C", "M", "MI"];

const NON_SANCTION_FALLBACK = [
  "AU","BR","CA","CN","CZ","DE","DK","ES","FI","FR","GB","GH","GR","HU",
  "ID","IN","IT","JO","JP","KE","KR","KW","MA","MX","MY","NG","NL","NO",
  "NZ","OM","PH","PK","PL","PT","QA","RO","SA","SE","SG","SK","TH","TN",
  "TW","UA","US","VN","ZA","AE","AT","BE","BH","BG","CH","EG","SI",
];

const NON_DOS_NON_NOCLASS = [
  "1A001","1A002","1B001","1C001","1D001","1E001",
  "2B001","2D001","2E001",
  "3A001","3A002","3B001","3C001","3D001","3E001",
  "4A001","4A002","4D001","4E001",
  "5A001","5A002","5B001","5D001","5D002","5E001","5E002",
  "6A001","6A002","6B001","6C001","6D001","6E001",
  "7A001","7A002","7A003","7B001","7D001","7E001",
  "8A001","8A002","8B001","8D001","8E001",
  "9A001","9A002","9A003","9B001","9D001","9E001",
];

/* ── Excel reader helper ────────────────────────────── */
function readColumnFromFile(file, colIndex) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const values = rows.slice(1)
          .map((r) => (r[colIndex] !== undefined ? String(r[colIndex]).trim() : ""))
          .filter((v) => v && !["NULL","null","None","none",""].includes(v));
        resolve(values);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/* ── Row builder ────────────────────────────────────── */
function cartesian(countries, ecns, euds, decision, desc) {
  const rows = [];
  for (const ctry of countries)
    for (const ecn of ecns)
      for (const eud of euds)
        rows.push({ ctry, ecn, eud, decision, desc: `${desc} | EUD=${eud}` });
  return rows;
}

function buildScenarios(embargoCtries, sanctionCtries, dosEcns, countryCode, dosDecision) {
  const embargoSet  = new Set(embargoCtries);
  const sanctionSet = new Set(sanctionCtries);
  const nonSanction = NON_SANCTION_FALLBACK.filter(c => !embargoSet.has(c) && !sanctionSet.has(c));

  const dosY      = dosEcns.map(e => e);
  const noclass   = ["NOCLASS"];
  const dosN_noN  = NON_DOS_NON_NOCLASS;

  const fallbackE = embargoCtries[0]  || "TZ";
  const fallbackS = sanctionCtries[0] || "CF";
  const fallbackN = nonSanction[0]    || "JP";
  const fallbackEcn = dosN_noN[0];

  return [
    {
      code: "S1", title: "EmbargoY", folder: "Embargo", decision: "EL",
      rows: embargoCtries.length
        ? cartesian(embargoCtries, [...dosY, ...noclass, ...dosN_noN], EUDS, "EL", "Embargo condition = Y")
        : EUDS.map(e => ({ ctry: fallbackE, ecn: fallbackEcn, eud: e, decision: "EL", desc: `Embargo condition = Y (simulated) | EUD=${e}` })),
    },
    {
      code: "S2", title: "EmbargoN_SanctionY_MilitaryY", folder: "Sanction", decision: "EL",
      rows: cartesian(sanctionCtries, [...dosY, ...noclass, ...dosN_noN], EUDS, "EL", "Embargo=N, Sanction=Y, Military End Use=Y"),
    },
    {
      code: "S3", title: "EmbargoN_SanctionY_MilitaryN_DOSY", folder: "Sanction", decision: dosDecision,
      rows: dosY.length
        ? cartesian(sanctionCtries, dosY, EUDS, dosDecision, "Embargo=N, Sanction=Y, Military End Use=N, DOS=Y")
        : EUDS.map(e => ({ ctry: fallbackS, ecn: fallbackEcn, eud: e, decision: dosDecision, desc: `Embargo=N, Sanction=Y, Military End Use=N, DOS=Y (simulated) | EUD=${e}` })),
    },
    {
      code: "S4", title: "EmbargoN_SanctionY_MilitaryN_DOSN_NoClassY", folder: "Sanction", decision: "NLR",
      rows: cartesian(sanctionCtries, noclass, EUDS, "NLR", "Embargo=N, Sanction=Y, Military End Use=N, DOS=N, NoClass=Y"),
    },
    {
      code: "S5", title: "EmbargoN_SanctionY_MilitaryN_DOSN_NoClassN", folder: "Sanction", decision: "EL",
      rows: cartesian(sanctionCtries, dosN_noN, EUDS, "EL", "Embargo=N, Sanction=Y, Military End Use=N, DOS=N, NoClass=N"),
    },
    {
      code: "S6", title: "EmbargoN_SanctionN_DOSY", folder: "DOS", decision: dosDecision,
      rows: dosY.length
        ? cartesian(nonSanction, dosY, EUDS, dosDecision, "Embargo=N, Sanction=N, DOS=Y")
        : EUDS.map(e => ({ ctry: fallbackN, ecn: fallbackEcn, eud: e, decision: dosDecision, desc: `Embargo=N, Sanction=N, DOS=Y (simulated) | EUD=${e}` })),
    },
    {
      code: "S7", title: "EmbargoN_SanctionN_DOSN_NoClassY", folder: "NoClass", decision: "NLR",
      rows: cartesian(nonSanction, noclass, EUDS, "NLR", "Embargo=N, Sanction=N, DOS=N, NoClass=Y"),
    },
    {
      code: "S8", title: "EmbargoN_SanctionN_DOSN_NoClassN", folder: "NoClass", decision: "EL",
      rows: cartesian(nonSanction, dosN_noN, EUDS, "EL", "Embargo=N, Sanction=N, DOS=N, NoClass=N"),
    },
  ].map(s => ({ ...s, lreqCode: `${countryCode}_MOC_ECN`, countryCode }));
}

/* ── XLS builder ────────────────────────────────────── */
function buildXls(scenario) {
  const { rows, lreqCode, countryCode, code, title, decision } = scenario;
  const wb = XLSX.utils.book_new();

  // ── input sheet ──
  const header = ["","Scenario#","Org","LREQ","LREQ Ctry","Export Ctry","","Import Ctry","","","ECN","","Scenario Desc","Expected Decision","","","","","","","","","Exporter","ShipTo","End Use"];
  const dataRows = rows.map((r, i) => {
    const row = new Array(25).fill("");
    row[1]  = i + 1;
    row[2]  = "SYSTEM";
    row[3]  = lreqCode;
    row[4]  = countryCode;
    row[5]  = countryCode;
    row[7]  = r.ctry;
    row[10] = r.ecn;
    row[12] = r.desc;
    row[13] = r.decision;
    row[22] = "EXPORTER";
    row[23] = "SHIP_TO";
    row[24] = r.eud;
    return row;
  });

  const wsInput = XLSX.utils.aoa_to_sheet([header, header, ...dataRows]);
  XLSX.utils.book_append_sheet(wb, wsInput, "input");

  // ── Test Description sheet ──
  const eudList = [...new Set(rows.map(r => r.eud))].sort()
    .map(e => `${e}=${EUD_LABELS[e] || e}`).join(", ");
  const wsDesc = XLSX.utils.aoa_to_sheet([
    ["", "Description", "Expected Decision"],
    ["", `${code}: ${title}\nEUD covered: ${eudList}\nRows: ${rows.length}`, decision],
  ]);
  XLSX.utils.book_append_sheet(wb, wsDesc, "Test Description");

  // ── Placeholder sheets ──
  for (const name of ["PARTNER", "GPM", "Transaction"]) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([[name + " sheet"]]), name);
  }

  return XLSX.write(wb, { bookType: "xls", type: "array" });
}

/* ── File upload card ───────────────────────────────── */
function FileCard({ label, hint, accept, file, onChange, iconColor = "#7f6df2" }) {
  const ref = useRef();
  return (
    <div className={`file-card${file ? " file-card--loaded" : ""}`} onClick={() => ref.current.click()}>
      <input ref={ref} type="file" accept={accept} style={{ display: "none" }} onChange={e => onChange(e.target.files[0] || null)} />
      <div className="file-card-icon" style={file ? {} : { color: iconColor }}>{file ? "✓" : "↑"}</div>
      <div className="file-card-info">
        <div className="file-card-label">{label}</div>
        <div className="file-card-hint">{file ? file.name : hint}</div>
      </div>
    </div>
  );
}

/* ── Main App ───────────────────────────────────────── */
export default function App() {
  const [activeTab, setActiveTab]       = useState("testcases");
  const [countryCode, setCountryCode]   = useState("");
  const [dosDecision, setDosDecision]   = useState("EL");
  const [embargoFile, setEmbargoFile]   = useState(null);
  const [sanctionFile, setSanctionFile] = useState(null);
  const [dosFile, setDosFile]           = useState(null);

  // Test Case Generator state
  const [tcStatus, setTcStatus]     = useState("idle");
  const [tcError, setTcError]       = useState("");
  const [tcLog, setTcLog]           = useState([]);
  const [tcCsvText, setTcCsvText]   = useState("");
  const [tcPreview, setTcPreview]   = useState([]);

  // XLS Script Generator state
  const [status, setStatus]   = useState("idle");
  const [log, setLog]         = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError]     = useState("");
  const [zipUrl, setZipUrl]   = useState(null);
  const [zipName, setZipName] = useState("");

  const canGenerateTC      = !!countryCode.trim();
  const canGenerateScripts = countryCode.trim() && embargoFile && sanctionFile && dosFile;

  function addTcLog(msg) { setTcLog(prev => [...prev, msg]); }
  function addLog(msg)   { setLog(prev => [...prev, msg]); }

  /* ── Test Case Generator (template-based) ── */
  async function handleGenerateTestCases() {
    setTcStatus("running"); setTcError(""); setTcLog([]); setTcCsvText(""); setTcPreview([]);
    try {
      const cc = countryCode.trim().toUpperCase();
      addTcLog(`Generating test cases for ${cc}…`);
      const csv = generateTestCases(cc, [], [], [], dosDecision);
      const lines = csv.split(/\r?\n/).filter(l => l.trim());
      addTcLog(`✓ ${lines.length - 1} test cases generated`);
      setTcCsvText(csv);
      const preview = lines.slice(1, 6).map(l => {
        const cells = []; let cur = ""; let inQ = false;
        for (const ch of l) {
          if (ch === '"') { inQ = !inQ; }
          else if (ch === ',' && !inQ) { cells.push(cur); cur = ""; }
          else cur += ch;
        }
        cells.push(cur);
        return cells;
      });
      setTcPreview(preview);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${cc}_Export_Controls_TestCases.csv`; a.click();
      URL.revokeObjectURL(url);
      setTcStatus("done");
    } catch (e) {
      setTcError(e.message); setTcStatus("error");
    }
  }

  /* ── XLS Script Generator ── */
  async function handleGenerateScripts() {
    setStatus("running"); setLog([]); setSummary(null); setError(""); setZipUrl(null);
    try {
      const cc = countryCode.trim().toUpperCase();
      addLog(`Reading reference files for ${cc}…`);
      const [embargoCtries, sanctionCtries, dosEcns] = await Promise.all([
        readColumnFromFile(embargoFile, 1),
        readColumnFromFile(sanctionFile, 1),
        readColumnFromFile(dosFile, 0),
      ]);
      addLog(`Embargo: ${embargoCtries.length}  Sanction: ${sanctionCtries.length}  DOS-Y ECCNs: ${dosEcns.length}`);
      addLog("Building 8 scenarios…");
      const scenarios = buildScenarios(embargoCtries, sanctionCtries, dosEcns, cc, dosDecision);
      const zip = new JSZip();
      const results = [];
      for (const scenario of scenarios) {
        if (!scenario.rows.length) { addLog(`SKIP ${scenario.code}`); continue; }
        const fileName = `LREQ_${cc}_${scenario.code}_${scenario.title}_S000001-S${String(scenario.rows.length).padStart(6,"0")}.xls`;
        zip.folder(scenario.folder).file(fileName, buildXls(scenario));
        addLog(`✓ ${scenario.folder}/${fileName}  (${scenario.rows.length.toLocaleString()} rows)`);
        results.push({ code: scenario.code, title: scenario.title, folder: scenario.folder, rows: scenario.rows.length, decision: scenario.decision });
      }
      addLog("Creating ZIP…");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const fileName = `LREQ_${cc}_Scenarios.zip`;
      const a = document.createElement("a");
      a.href = url; a.download = fileName; a.click();
      setZipUrl(url); setZipName(fileName);
      setSummary(results); setStatus("done"); addLog("Done — ZIP downloaded.");
    } catch (err) { setError(err.message); setStatus("error"); }
  }

  return (
    <div className="page">
      {/* Header */}
      <header className="topbar">
        <div className="brand">
          <div className="brand-logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/>
            </svg>
          </div>
          <div>
            <div className="brand-name">Regulatory Control Buddy</div>
            <div className="brand-sub">LREQ AUTOMATION SCRIPT GENERATOR</div>
          </div>
        </div>
        <div className="brand-badge">v1.0</div>
      </header>

      {/* Body */}
      <div className="body">
        {/* Left sidebar */}
        <aside className="sidebar">
          <div className="section">
            <div className="section-title"><span className="dot dot-purple" /> Country Config</div>
            <div className="section-body">
              <label className="field-label">
                COUNTRY CODE
                <input className="field-input" value={countryCode} onChange={e => setCountryCode(e.target.value.toUpperCase())} placeholder="e.g. HK, FR, JP" maxLength={3} />
              </label>
              <label className="field-label">
                DOS=Y PATH DECISION
                <div className="radio-group">
                  {["EL","ML","NLR"].map(opt => (
                    <label key={opt} className="radio-label">
                      <input type="radio" name="dosDecision" value={opt} checked={dosDecision === opt} onChange={() => setDosDecision(opt)} />
                      {opt}
                    </label>
                  ))}
                </div>
                <div className="field-hint">From your country flowchart (S3 & S6)</div>
              </label>
            </div>
          </div>

          <div className="section">
            <div className="section-title"><span className="dot dot-blue" /> Reference Files <span className="section-note">(XLS generator only)</span></div>
            <div className="section-body">
              <FileCard label="Absolute Embargo Countries" hint="Click to upload .xlsx  (col B = IMP_COUNTRY)" accept=".xlsx,.xls" file={embargoFile} onChange={setEmbargoFile} />
              <FileCard label="Sanction Country List"      hint="Click to upload .xlsx  (col B = IMP_COUNTRY)" accept=".xlsx,.xls" file={sanctionFile} onChange={setSanctionFile} />
              <FileCard label="ECCNUM with DOS=Y"          hint="Click to upload .xlsx  (col A = ECCNUM)"      accept=".xlsx,.xls" file={dosFile}      onChange={setDosFile} />
            </div>
          </div>

          <div className="sidebar-footer">
            <button className="btn-generate"
              onClick={activeTab === "testcases" ? handleGenerateTestCases : handleGenerateScripts}
              disabled={activeTab === "testcases" ? (!canGenerateTC || tcStatus === "running") : (!canGenerateScripts || status === "running")}>
              {(status === "running" || tcStatus === "running") ? "Generating…"
                : activeTab === "testcases" ? "Generate Test Cases CSV"
                : "Generate & Download ZIP"}
            </button>
          </div>
        </aside>

        {/* Right main */}
        <main className="main">
          {/* Tabs */}
          <div className="tabs">
            <button className={`tab${activeTab === "testcases" ? " tab-active-pink" : ""}`} onClick={() => setActiveTab("testcases")}>
              <div className="tab-title">Test Case Generator</div>
              <div className="tab-sub">Flowchart → CSV</div>
            </button>
            <button className={`tab${activeTab === "scripts" ? " tab-active-gray" : ""}`} onClick={() => setActiveTab("scripts")}>
              <div className="tab-title">XLS Script Generator</div>
              <div className="tab-sub">LREQ Automation Files</div>
            </button>
          </div>

          {/* Output panel */}
          <div className="output-panel">
            <div className="output-header">
              <span className="dot dot-green" />
              {activeTab === "testcases" ? "Generated Test Cases" : "Generated Scenarios"}
            </div>
            <div className="output-body">

              {/* ── TEST CASE GENERATOR ── */}
              {activeTab === "testcases" && (
                <>
                  {tcStatus === "idle" && (
                    <div className="empty-state">
                      <div className="empty-icon">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f0abfc" strokeWidth="1.5">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                      </div>
                      <div className="empty-title">Test Case Generator</div>
                      <div className="empty-sub">
                        1. Enter your country code (e.g. <strong>HK</strong>)<br/>
                        2. Select the DOS=Y decision from your flowchart<br/>
                        3. Click <strong>Generate Test Cases CSV</strong>
                      </div>
                      <div className="ai-flow">
                        {["Enter Country", "Select DOS Decision", "Click Generate", "CSV Downloads"].map((step, i, arr) => (
                          <React.Fragment key={step}>
                            <div className="ai-step">{step}</div>
                            {i < arr.length - 1 && <div className="ai-arrow">→</div>}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}
                  {(tcStatus === "running" || tcStatus === "error") && (
                    <div className="log-area">
                      {tcLog.map((l, i) => <div key={i} className={`log-line${l.startsWith("✓") ? " log-ok" : ""}`}>{l}</div>)}
                      {tcStatus === "running" && <div className="log-line log-spin">⏳ Waiting for AI response…</div>}
                      {tcError && <div className="log-line log-error">✗ {tcError}</div>}
                    </div>
                  )}

                  {tcStatus === "done" && (
                    <div className="tc-result">
                      <div className="log-area" style={{marginBottom:"16px"}}>
                        {tcLog.map((l, i) => <div key={i} className={`log-line${l.startsWith("✓") ? " log-ok" : ""}`}>{l}</div>)}
                      </div>
                      <div className="tc-result-banner">
                        <span className="tc-result-count">{tcCsvText.split(/\r?\n/).filter(l=>l.trim()).length - 1}</span>
                        <div>
                          <div className="tc-result-label">Test Cases generated from flowchart PDF</div>
                          <div style={{fontSize:"0.72rem",color:"#4a5470",marginTop:"4px"}}>CSV downloaded automatically</div>
                        </div>
                        <button className="btn-redownload" onClick={() => {
                          const blob = new Blob([tcCsvText], {type:"text/csv;charset=utf-8;"});
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href=url; a.download=`${countryCode}_Export_Controls_TestCases.csv`; a.click();
                          URL.revokeObjectURL(url);
                        }}>↓ Re-download</button>
                      </div>
                      {tcPreview.length > 0 && (
                        <>
                          <div className="tc-preview-title">Preview — first 5 rows</div>
                          <div className="tc-table-wrap">
                            <table className="tc-table">
                              <thead><tr><th>Test Case ID</th><th>Module</th><th>Title</th><th>Expected Result</th><th>Priority</th></tr></thead>
                              <tbody>
                                {tcPreview.map((row, i) => (
                                  <tr key={i}>
                                    <td className="tc-code">{row[0]}</td>
                                    <td>{row[2]}</td>
                                    <td className="tc-title-cell">{row[3]}</td>
                                    <td className="tc-expected">{row[8]}</td>
                                    <td><span className={`pri-chip pri-${(row[11]||"").toLowerCase()}`}>{row[11]}</span></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* ── XLS SCRIPT GENERATOR ── */}
              {activeTab === "scripts" && (
                <>
                  {status === "idle" && (
                    <div className="empty-state">
                      <div className="empty-icon">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3c8cff" strokeWidth="1.5">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                      </div>
                      <div className="empty-title">8 Scenarios Ready to Generate</div>
                      <div className="empty-sub">Generates XLS automation files organised in Embargo / Sanction / DOS / NoClass folders inside a ZIP.</div>
                      <div className="scenario-legend">
                        {[
                          { code:"S1", folder:"Embargo",  decision:"EL",          desc:"Full Embargo = Y" },
                          { code:"S2", folder:"Sanction", decision:"EL",          desc:"Sanction + Military" },
                          { code:"S3", folder:"Sanction", decision:dosDecision,   desc:"Sanction + DOS=Y" },
                          { code:"S4", folder:"Sanction", decision:"NLR",         desc:"Sanction + NOCLASS" },
                          { code:"S5", folder:"Sanction", decision:"EL",          desc:"Sanction + Classified" },
                          { code:"S6", folder:"DOS",      decision:dosDecision,   desc:"Non-Sanction + DOS=Y" },
                          { code:"S7", folder:"NoClass",  decision:"NLR",         desc:"Non-Sanction + NOCLASS" },
                          { code:"S8", folder:"NoClass",  decision:"EL",          desc:"Non-Sanction + Classified" },
                        ].map(s => (
                          <div key={s.code} className="legend-row">
                            <span className="legend-code">{s.code}</span>
                            <span className={`legend-folder folder-${s.folder.toLowerCase()}`}>{s.folder}</span>
                            <span className="legend-desc">{s.desc}</span>
                            <span className={`legend-decision dec-${s.decision.toLowerCase()}`}>{s.decision}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(status === "running" || status === "done" || status === "error") && (
                    <div className="log-area">
                      {log.map((l, i) => <div key={i} className={`log-line${l.startsWith("✓") ? " log-ok" : l.startsWith("SKIP") ? " log-skip" : ""}`}>{l}</div>)}
                      {error && <div className="log-line log-error">✗ {error}</div>}
                    </div>
                  )}
                  {summary && (
                    <div className="summary">
                      <div className="summary-title-row">
                        <div className="summary-title">Summary — {countryCode.toUpperCase()}</div>
                        {zipUrl && (
                          <a className="btn-zip-download" href={zipUrl} download={zipName}>
                            ↓ Download ZIP
                          </a>
                        )}
                      </div>
                      <table className="summary-table">
                        <thead><tr><th>Scenario</th><th>Title</th><th>Folder</th><th>Decision</th><th>Rows</th></tr></thead>
                        <tbody>
                          {summary.map(s => (
                            <tr key={s.code}>
                              <td className="tc-code">{s.code}</td>
                              <td className="tc-title">{s.title}</td>
                              <td><span className={`folder-chip folder-${s.folder.toLowerCase()}`}>{s.folder}</span></td>
                              <td><span className={`dec-chip dec-${s.decision.toLowerCase()}`}>{s.decision}</span></td>
                              <td className="tc-rows">{s.rows.toLocaleString()}</td>
                            </tr>
                          ))}
                          <tr className="summary-total"><td colSpan={4}>Total</td><td>{summary.reduce((a,s)=>a+s.rows,0).toLocaleString()}</td></tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
