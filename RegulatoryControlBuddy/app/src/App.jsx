import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import JSZip from "jszip";

/* ── CSV escape helper ──────────────────────────────── */
function csvCell(v) {
  const s = String(v ?? "").replace(/"/g, '""');
  return /[,"\n\r]/.test(s) ? `"${s}"` : s;
}
function csvRow(cells) { return cells.map(csvCell).join(","); }

/* ── Test Case Generator ────────────────────────────── */
function generateTestCases(cc, embargoCtries, sanctionCtries, dosEcns, dosDecision) {
  const CC = cc.toUpperCase();
  const embargoSample  = embargoCtries.slice(0,3).join(", ") || "TZ";
  const sanctionSample = sanctionCtries.slice(0,3).join(", ") || "CF";
  const nonSancSample  = "JP, AU, DE";
  const dosEcnSample   = dosEcns.slice(0,2).join(", ") || "ML1";
  const regEcnSample   = "3A001, 5A002";

  const rows = [
    // Header
    ["Test Case ID","Test Suite","Test Module","Test Case Title","Test Case Description","Pre-Conditions","Test Steps","Test Data (Input)","Expected Result","Actual Result","Status","Priority","Remarks"],

    // ── Full Embargo ──
    [`TC-${CC}-001`,"Export Controls","Full Embargo Check",
     `${CC}: Destination is a Full Embargo Country`,
     `Verify that when the destination has ABSOLUTE flag = Y the system returns Embargo decision with EL license.`,
     `LCS_ABSOLUTE_EMBARGO table contains destination country with ABSOLUTE = Y.`,
     `1. Create order with Export Ctry = ${CC}. 2. Set Import Ctry to a full embargo country (${embargoSample}). 3. Run License Determination. 4. Check decision and license.`,
     `Export=${CC}, Import=${embargoSample}, ECN=NOCLASS, DOS=N`,
     `Decision = Embargo; License = EL; Hold = DOC Hold`,
     "","Not Executed","Critical","ABSOLUTE=Y in LCS_ABSOLUTE_EMBARGO"],

    [`TC-${CC}-002`,"Export Controls","Full Embargo Check",
     `${CC}: Destination is NOT a Full Embargo Country`,
     `Verify that a non-embargo destination proceeds to the Sanction check.`,
     `Destination country is NOT in LCS_ABSOLUTE_EMBARGO with ABSOLUTE = Y.`,
     `1. Create order with Export Ctry = ${CC}. 2. Set Import Ctry = ${nonSancSample.split(",")[0].trim()}. 3. Run License Determination. 4. Verify flow proceeds past embargo check.`,
     `Export=${CC}, Import=${nonSancSample.split(",")[0].trim()}, ECN=NOCLASS, DOS=N`,
     `System does not return Embargo decision; proceeds to Sanction check.`,
     "","Not Executed","High",""],

    // ── Sanction ──
    [`TC-${CC}-003`,"Export Controls","Sanction Check",
     `${CC}: Sanction Country + Military End Use`,
     `Verify that a sanction destination with Military end use returns EL DOC Hold with Sanctions may apply comment.`,
     `Destination has ABSOLUTE=N in LCS_ABSOLUTE_EMBARGO. Order has Military end use.`,
     `1. Create order Export=${CC}. 2. Set Import Ctry = ${sanctionSample.split(",")[0].trim()} (sanction). 3. Set End Use = Military. 4. Run License Determination.`,
     `Export=${CC}, Import=${sanctionSample.split(",")[0].trim()}, EndUse=Military, ECN=NOCLASS, DOS=N`,
     `License = EL; Hold = DOC Hold; Comments include "Sanctions may apply"`,
     "","Not Executed","Critical",""],

    [`TC-${CC}-004`,"Export Controls","Sanction Check",
     `${CC}: Sanction Country + Military Intelligence End Use`,
     `Verify Military Intelligence end use (added 08/03/21) is treated same as Military for sanction countries.`,
     `Destination is sanction country (ABSOLUTE=N). Order has Military Intelligence end use.`,
     `1. Create order Export=${CC}. 2. Set Import Ctry = ${sanctionSample.split(",")[0].trim()}. 3. Set End Use = Military Intelligence. 4. Run License Determination.`,
     `Export=${CC}, Import=${sanctionSample.split(",")[0].trim()}, EndUse=Military Intelligence, ECN=NOCLASS, DOS=N`,
     `License = EL; Hold = DOC Hold; Comments include "Sanctions may apply"`,
     "","Not Executed","Critical","Military Intelligence check added 08/03/21"],

    [`TC-${CC}-005`,"Export Controls","Sanction Check",
     `${CC}: Sanction Country + Non-Military + DOS=Y (Munitions List)`,
     `Verify sanction + non-military + DOS=Y returns ${dosDecision} DOS Hold with Sanctions may apply comment.`,
     `Destination is sanction country. Item has ECN.DOS=Y. End use = Commercial.`,
     `1. Create order Export=${CC}. 2. Import = ${sanctionSample.split(",")[0].trim()} (sanction). 3. EndUse=Commercial. 4. ECN=${dosEcnSample.split(",")[0].trim()} (DOS=Y). 5. Run License Determination.`,
     `Export=${CC}, Import=${sanctionSample.split(",")[0].trim()}, ECN=${dosEcnSample.split(",")[0].trim()}, DOS=Y, EndUse=Commercial`,
     `License = ${dosDecision}; Hold = DOS Hold; Comments include "Sanctions may apply"`,
     "","Not Executed","Critical",""],

    [`TC-${CC}-006`,"Export Controls","Sanction Check",
     `${CC}: Sanction Country + Non-Military + DOS=N + NOCLASS`,
     `Verify sanction + non-military + NOCLASS ECN returns NLR with Sanctions may apply comment.`,
     `Destination is sanction country. ECN.DOS=N. ECN=NOCLASS. EndUse=Commercial.`,
     `1. Create order Export=${CC}. 2. Import = ${sanctionSample.split(",")[0].trim()}. 3. EndUse=Commercial. 4. ECN=NOCLASS DOS=N. 5. Run License Determination.`,
     `Export=${CC}, Import=${sanctionSample.split(",")[0].trim()}, ECN=NOCLASS, DOS=N, EndUse=Commercial`,
     `Decision = NLR; Comments include "Sanctions may apply"`,
     "","Not Executed","High","Sanctions comment flows through even for NLR"],

    [`TC-${CC}-007`,"Export Controls","Sanction Check",
     `${CC}: Sanction Country + Non-Military + DOS=N + Classified ECN`,
     `Verify sanction + non-military + classified ECN returns EL DOC Hold with Sanctions may apply comment.`,
     `Destination is sanction country. ECN.DOS=N. ECN is a specific dual-use code. EndUse=Commercial.`,
     `1. Create order Export=${CC}. 2. Import = ${sanctionSample.split(",")[0].trim()}. 3. EndUse=Commercial. 4. ECN=${regEcnSample.split(",")[0].trim()} DOS=N. 5. Run.`,
     `Export=${CC}, Import=${sanctionSample.split(",")[0].trim()}, ECN=${regEcnSample.split(",")[0].trim()}, DOS=N, EndUse=Commercial`,
     `License = EL; Hold = DOC Hold; Comments include "Sanctions may apply"`,
     "","Not Executed","High",""],

    [`TC-${CC}-008`,"Export Controls","Sanction Check",
     `${CC}: Non-Sanction Country — No Sanctions Comment`,
     `Verify that non-sanction destination does not get Sanctions may apply comment.`,
     `Destination is NOT in LCS_ABSOLUTE_EMBARGO.`,
     `1. Create order Export=${CC}. 2. Import = ${nonSancSample.split(",")[0].trim()} (non-sanction). 3. EndUse=Commercial. 4. ECN=NOCLASS. 5. Run.`,
     `Export=${CC}, Import=${nonSancSample.split(",")[0].trim()}, ECN=NOCLASS, DOS=N, EndUse=Commercial`,
     `No Sanctions may apply comment; Decision = NLR`,
     "","Not Executed","High",""],

    // ── DOS / Munitions ──
    [`TC-${CC}-009`,"Export Controls","ECN.DOS Check",
     `${CC}: ECN.DOS = Y — Munitions List Item`,
     `Verify that when ECN.DOS=Y the system returns ${dosDecision} with DOS Hold.`,
     `Item is classified under Military Goods List (ECN.DOS=Y). Destination is non-sanction, non-embargo.`,
     `1. Create order Export=${CC}. 2. Import = ${nonSancSample.split(",")[0].trim()}. 3. Use item with ECN.DOS=Y (${dosEcnSample.split(",")[0].trim()}). 4. Run.`,
     `Export=${CC}, Import=${nonSancSample.split(",")[0].trim()}, ECN=${dosEcnSample.split(",")[0].trim()}, DOS=Y`,
     `License = ${dosDecision}; Hold = DOS Hold`,
     "","Not Executed","Critical",""],

    [`TC-${CC}-010`,"Export Controls","ECN.DOS Check",
     `${CC}: ECN.DOS = N — Proceeds to NOCLASS Check`,
     `Verify that ECN.DOS=N does not trigger DOS Hold and flow continues to NOCLASS check.`,
     `Item is NOT on Munitions List (ECN.DOS=N). Destination is non-sanction, non-embargo.`,
     `1. Create order Export=${CC}. 2. Import = ${nonSancSample.split(",")[0].trim()}. 3. ECN=NOCLASS DOS=N. 4. Run.`,
     `Export=${CC}, Import=${nonSancSample.split(",")[0].trim()}, ECN=NOCLASS, DOS=N`,
     `No DOS Hold; system proceeds to ECN = NOCLASS check`,
     "","Not Executed","High",""],

    // ── NOCLASS ──
    [`TC-${CC}-011`,"Export Controls","ECN Classification",
     `${CC}: ECN = NOCLASS — No Dual Use License Required`,
     `Verify that ECN=NOCLASS returns NLR (No License Required).`,
     `Item ECN=NOCLASS. ECN.DOS=N. Non-sanction, non-embargo destination.`,
     `1. Create order Export=${CC}. 2. Import = ${nonSancSample.split(",")[0].trim()}. 3. ECN=NOCLASS DOS=N. 4. EndUse=Commercial. 5. Run.`,
     `Export=${CC}, Import=${nonSancSample.split(",")[0].trim()}, ECN=NOCLASS, DOS=N`,
     `Decision = NLR (No Dual Use License Required)`,
     "","Not Executed","Critical","Primary happy path"],

    [`TC-${CC}-012`,"Export Controls","ECN Classification",
     `${CC}: ECN has Classified Code (Not NOCLASS) — EL DOC Hold`,
     `Verify that a specific dual-use ECN code returns EL with DOC Hold.`,
     `Item has specific ECN code (not NOCLASS). ECN.DOS=N. Non-sanction, non-embargo.`,
     `1. Create order Export=${CC}. 2. Import = ${nonSancSample.split(",")[0].trim()}. 3. ECN=${regEcnSample.split(",")[0].trim()} DOS=N. 4. Run.`,
     `Export=${CC}, Import=${nonSancSample.split(",")[0].trim()}, ECN=${regEcnSample.split(",")[0].trim()}, DOS=N`,
     `License = EL; Hold = DOC Hold`,
     "","Not Executed","Critical",""],

    [`TC-${CC}-013`,"Export Controls","ECN Classification",
     `${CC}: ECN = NULL — Should NOT Return NLR`,
     `Verify that NULL/empty ECN does not get treated as NOCLASS — must be held for review.`,
     `Item has no ECN classification. ECN.DOS=N.`,
     `1. Create order Export=${CC}. 2. Import = ${nonSancSample.split(",")[0].trim()}. 3. ECN=NULL. 4. Run.`,
     `Export=${CC}, Import=${nonSancSample.split(",")[0].trim()}, ECN=NULL, DOS=N`,
     `License = EL; Hold = DOC Hold (NULL must NOT return NLR)`,
     "","Not Executed","Critical","Security-critical: unclassified items must not be released"],

    // ── End-to-End ──
    [`TC-${CC}-014`,"Export Controls","End-to-End",
     `${CC}: E2E Happy Path — NLR`,
     `Full end-to-end: non-embargo, non-sanction destination with NOCLASS item returns NLR.`,
     `All master data configured. Destination has no embargo/sanction flags.`,
     `1. Export=${CC}. 2. Import=${nonSancSample.split(",")[0].trim()} (clean). 3. ECN=NOCLASS DOS=N. 4. EndUse=Commercial. 5. Run.`,
     `Export=${CC}, Import=${nonSancSample.split(",")[0].trim()}, ECN=NOCLASS, DOS=N, EndUse=Commercial`,
     `Decision = NLR; No holds; No comments`,
     "","Not Executed","Critical","Primary happy path"],

    [`TC-${CC}-015`,"Export Controls","End-to-End",
     `${CC}: E2E Full Embargo — Stops at First Check`,
     `Full end-to-end: absolute embargo country stops processing immediately.`,
     `Destination in LCS_ABSOLUTE_EMBARGO with ABSOLUTE=Y.`,
     `1. Export=${CC}. 2. Import=${embargoSample.split(",")[0].trim()} (full embargo). 3. ECN=NOCLASS. 4. Run. 5. Verify no ECN processing happens.`,
     `Export=${CC}, Import=${embargoSample.split(",")[0].trim()}, ECN=NOCLASS, DOS=N`,
     `Decision = Embargo; License = EL; Hold = DOC Hold; No further processing`,
     "","Not Executed","Critical","Embargo check must be the first gate"],

    [`TC-${CC}-016`,"Export Controls","End-to-End",
     `${CC}: E2E Non-Sanction + DOS=Y — ${dosDecision} DOS Hold`,
     `Full end-to-end: non-sanction destination with Munitions List item returns ${dosDecision} DOS Hold.`,
     `Destination NOT in any embargo/sanction list. ECN.DOS=Y.`,
     `1. Export=${CC}. 2. Import=${nonSancSample.split(",")[0].trim()}. 3. ECN=${dosEcnSample.split(",")[0].trim()} DOS=Y. 4. EndUse=Commercial. 5. Run.`,
     `Export=${CC}, Import=${nonSancSample.split(",")[0].trim()}, ECN=${dosEcnSample.split(",")[0].trim()}, DOS=Y`,
     `License = ${dosDecision}; Hold = DOS Hold; No sanctions comment`,
     "","Not Executed","Critical",""],

    // ── Edge Cases ──
    [`TC-${CC}-017`,"Export Controls","Edge Cases",
     `${CC}: ECN NOCLASS Case Sensitivity`,
     `Verify whether ECN = 'noclass' (lowercase) is handled consistently.`,
     `Item with ECN = lowercase 'noclass'.`,
     `1. Export=${CC}. 2. Import=${nonSancSample.split(",")[0].trim()}. 3. ECN='noclass' (lowercase). 4. Run. 5. Compare with ECN=NOCLASS.`,
     `Export=${CC}, Import=${nonSancSample.split(",")[0].trim()}, ECN=noclass (lowercase), DOS=N`,
     `Document actual behavior — if case-sensitive: EL/DOC Hold; if case-insensitive: NLR`,
     "","Not Executed","Medium","Data quality edge case"],

    [`TC-${CC}-018`,"Export Controls","Edge Cases",
     `${CC}: Multiple Lines with Different ECN Values`,
     `Verify that license determination runs per-line and each line gets its own decision.`,
     `Order has multiple lines with different ECN classifications.`,
     `1. Create order Export=${CC}. 2. Import=${nonSancSample.split(",")[0].trim()}. 3. Line1: ECN=NOCLASS. 4. Line2: ECN=${regEcnSample.split(",")[0].trim()}. 5. Run.`,
     `Export=${CC}, Import=${nonSancSample.split(",")[0].trim()}, Line1: ECN=NOCLASS, Line2: ECN=${regEcnSample.split(",")[0].trim()}`,
     `Line1 = NLR; Line2 = EL (DOC Hold); Results are per-line`,
     "","Not Executed","High",""],

    [`TC-${CC}-019`,"Export Controls","Edge Cases",
     `${CC}: Real-Time Embargo Table Update`,
     `Verify that adding a new country to LCS_ABSOLUTE_EMBARGO is effective immediately.`,
     `System is live. New country being added to embargo table.`,
     `1. Process order for CountryX — verify no embargo. 2. Add CountryX to LCS_ABSOLUTE_EMBARGO (ABSOLUTE=Y). 3. Process new order for CountryX. 4. Verify embargo decision without restart.`,
     `Export=${CC}, Import=CountryX (newly embargoed), ECN=NOCLASS`,
     `New order returns Embargo decision immediately after table update`,
     "","Not Executed","High","Tests real-time table-driven configuration"],

    [`TC-${CC}-020`,"Export Controls","Edge Cases",
     `${CC}: ECN with Trailing Spaces Should Not Match NOCLASS`,
     `Verify 'NOCLASS ' (with trailing space) does NOT incorrectly trigger NLR.`,
     `ECN field may contain data with spaces due to data entry.`,
     `1. Export=${CC}. 2. Import=${nonSancSample.split(",")[0].trim()}. 3. ECN='NOCLASS ' (trailing space). 4. Run.`,
     `Export=${CC}, Import=${nonSancSample.split(",")[0].trim()}, ECN='NOCLASS ' (trailing space), DOS=N`,
     `System should trim OR return EL/DOC Hold — must NOT return NLR for malformed NOCLASS`,
     "","Not Executed","Medium","Security edge case — malformed NOCLASS must not release"],
  ];

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
function FileCard({ label, hint, accept, file, onChange }) {
  const ref = useRef();
  return (
    <div className={`file-card${file ? " file-card--loaded" : ""}`} onClick={() => ref.current.click()}>
      <input ref={ref} type="file" accept={accept} style={{ display: "none" }} onChange={e => onChange(e.target.files[0] || null)} />
      <div className="file-card-icon">{file ? "✓" : "↑"}</div>
      <div className="file-card-info">
        <div className="file-card-label">{label}</div>
        <div className="file-card-hint">{file ? file.name : hint}</div>
      </div>
    </div>
  );
}

/* ── Main App ───────────────────────────────────────── */
export default function App() {
  const [activeTab, setActiveTab]       = useState("testcases"); // testcases | scripts
  const [countryCode, setCountryCode]   = useState("");
  const [dosDecision, setDosDecision]   = useState("EL");
  const [embargoFile, setEmbargoFile]   = useState(null);
  const [sanctionFile, setSanctionFile] = useState(null);
  const [dosFile, setDosFile]           = useState(null);

  // Test Case Generator state
  const [tcStatus, setTcStatus]   = useState("idle");
  const [tcError, setTcError]     = useState("");
  const [tcCount, setTcCount]     = useState(0);
  const [tcPreview, setTcPreview] = useState([]);

  // XLS Script Generator state
  const [status, setStatus]   = useState("idle");
  const [log, setLog]         = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError]     = useState("");

  const canGenerate = countryCode.trim() && embargoFile && sanctionFile && dosFile;

  function addLog(msg) { setLog(prev => [...prev, msg]); }

  /* ── Test Case Generator ── */
  async function handleGenerateTestCases() {
    setTcStatus("running"); setTcError(""); setTcCount(0); setTcPreview([]);
    try {
      const cc = countryCode.trim().toUpperCase();
      const [embargoCtries, sanctionCtries, dosEcns] = await Promise.all([
        readColumnFromFile(embargoFile, 1),
        readColumnFromFile(sanctionFile, 1),
        readColumnFromFile(dosFile, 0),
      ]);
      const csv = generateTestCases(cc, embargoCtries, sanctionCtries, dosEcns, dosDecision);
      const lines = csv.split("\r\n");
      const count = lines.length - 1; // exclude header
      setTcCount(count);
      // Preview first 5 data rows
      setTcPreview(lines.slice(1, 6).map(l => l.split(",").map(c => c.replace(/^"|"$/g,""))));

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
    setStatus("running"); setLog([]); setSummary(null); setError("");
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
      const zip = new JSZip(); const results = [];
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
      const a = document.createElement("a"); a.href = url; a.download = `LREQ_${cc}_Scenarios.zip`; a.click();
      URL.revokeObjectURL(url);
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
                <div className="field-hint">Read from your country flowchart PDF (S3 & S6)</div>
              </label>
            </div>
          </div>

          <div className="section">
            <div className="section-title"><span className="dot dot-blue" /> Reference Files</div>
            <div className="section-body">
              <FileCard label="Absolute Embargo Countries" hint="Click to upload .xlsx  (col B = IMP_COUNTRY)" accept=".xlsx,.xls" file={embargoFile} onChange={setEmbargoFile} />
              <FileCard label="Sanction Country List"      hint="Click to upload .xlsx  (col B = IMP_COUNTRY)" accept=".xlsx,.xls" file={sanctionFile} onChange={setSanctionFile} />
              <FileCard label="ECCNUM with DOS=Y"          hint="Click to upload .xlsx  (col A = ECCNUM)"      accept=".xlsx,.xls" file={dosFile}      onChange={setDosFile} />
            </div>
          </div>

          <div className="sidebar-footer">
            <button className="btn-generate" onClick={activeTab === "testcases" ? handleGenerateTestCases : handleGenerateScripts}
              disabled={!canGenerate || status === "running" || tcStatus === "running"}>
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
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#7f6df2" strokeWidth="1.5">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                      </div>
                      <div className="empty-title">20 Test Cases — All Flowchart Paths</div>
                      <div className="empty-sub">Upload the 3 reference Excel files, set country code and DOS decision, then click Generate Test Cases CSV.</div>
                      <div className="tc-coverage">
                        {[
                          { mod:"Full Embargo Check",   tcs:2, color:"#f87171" },
                          { mod:"Sanction Check",       tcs:6, color:"#fbbf24" },
                          { mod:"ECN.DOS Check",        tcs:2, color:"#818cf8" },
                          { mod:"ECN Classification",   tcs:3, color:"#34d399" },
                          { mod:"End-to-End Paths",     tcs:3, color:"#60a5fa" },
                          { mod:"Edge Cases",           tcs:4, color:"#a78bfa" },
                        ].map(m => (
                          <div key={m.mod} className="coverage-row">
                            <span className="cov-dot" style={{background:m.color}} />
                            <span className="cov-mod">{m.mod}</span>
                            <span className="cov-count">{m.tcs} TCs</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {tcStatus === "running" && <div className="log-area"><div className="log-line">Generating test cases…</div></div>}
                  {tcError && <div className="log-area"><div className="log-line log-error">✗ {tcError}</div></div>}
                  {tcStatus === "done" && (
                    <div className="tc-result">
                      <div className="tc-result-banner">
                        <span className="tc-result-count">{tcCount}</span>
                        <span className="tc-result-label">Test Cases generated and downloaded as CSV</span>
                      </div>
                      <div className="tc-preview-title">Preview (first 5 rows)</div>
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
                      <div className="summary-title">Summary — {countryCode.toUpperCase()}</div>
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
