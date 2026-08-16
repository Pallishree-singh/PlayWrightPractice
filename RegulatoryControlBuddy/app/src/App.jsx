import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import JSZip from "jszip";

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
  const [countryCode, setCountryCode]   = useState("");
  const [dosDecision, setDosDecision]   = useState("EL");
  const [embargoFile, setEmbargoFile]   = useState(null);
  const [sanctionFile, setSanctionFile] = useState(null);
  const [dosFile, setDosFile]           = useState(null);
  const [status, setStatus]             = useState("idle"); // idle | running | done | error
  const [log, setLog]                   = useState([]);
  const [summary, setSummary]           = useState(null);
  const [error, setError]               = useState("");

  const canGenerate = countryCode.trim() && embargoFile && sanctionFile && dosFile;

  function addLog(msg) {
    setLog(prev => [...prev, msg]);
  }

  async function handleGenerate() {
    setStatus("running");
    setLog([]);
    setSummary(null);
    setError("");

    try {
      const cc = countryCode.trim().toUpperCase();
      addLog(`Reading reference files for ${cc}…`);

      const [embargoCtries, sanctionCtries, dosEcns] = await Promise.all([
        readColumnFromFile(embargoFile, 1),
        readColumnFromFile(sanctionFile, 1),
        readColumnFromFile(dosFile, 0),
      ]);

      addLog(`Embargo countries: ${embargoCtries.length}`);
      addLog(`Sanction countries: ${sanctionCtries.length}`);
      addLog(`DOS-Y ECCNs: ${dosEcns.length}`);
      addLog("Building scenarios…");

      const scenarios = buildScenarios(embargoCtries, sanctionCtries, dosEcns, cc, dosDecision);
      const zip = new JSZip();
      const results = [];

      for (const scenario of scenarios) {
        if (!scenario.rows.length) {
          addLog(`SKIP ${scenario.code} (no rows)`);
          continue;
        }
        const fileName = `LREQ_${cc}_${scenario.code}_${scenario.title}_S000001-S${String(scenario.rows.length).padStart(6,"0")}.xls`;
        const xlsData  = buildXls(scenario);
        zip.folder(scenario.folder).file(fileName, xlsData);
        addLog(`✓ ${scenario.folder}/${fileName}  (${scenario.rows.length.toLocaleString()} rows)`);
        results.push({ code: scenario.code, title: scenario.title, folder: scenario.folder, rows: scenario.rows.length, decision: scenario.decision });
      }

      addLog("Creating ZIP…");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `LREQ_${cc}_Scenarios.zip`;
      a.click();
      URL.revokeObjectURL(url);

      setSummary(results);
      setStatus("done");
      addLog(`Done — ZIP downloaded.`);
    } catch (err) {
      setError(err.message || "Unexpected error");
      setStatus("error");
    }
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
        {/* Left config panel */}
        <aside className="sidebar">
          <div className="section">
            <div className="section-title">
              <span className="dot dot-purple" /> Country Config
            </div>
            <div className="section-body">
              <label className="field-label">
                COUNTRY CODE
                <input
                  className="field-input"
                  value={countryCode}
                  onChange={e => setCountryCode(e.target.value.toUpperCase())}
                  placeholder="e.g. HK, FR, JP"
                  maxLength={3}
                />
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
            <div className="section-title">
              <span className="dot dot-blue" /> Reference Files
            </div>
            <div className="section-body">
              <FileCard
                label="Absolute Embargo Countries"
                hint="Click to upload .xlsx  (col B = IMP_COUNTRY)"
                accept=".xlsx,.xls"
                file={embargoFile}
                onChange={setEmbargoFile}
              />
              <FileCard
                label="Sanction Country List"
                hint="Click to upload .xlsx  (col B = IMP_COUNTRY)"
                accept=".xlsx,.xls"
                file={sanctionFile}
                onChange={setSanctionFile}
              />
              <FileCard
                label="ECCNUM with DOS=Y"
                hint="Click to upload .xlsx  (col A = ECCNUM)"
                accept=".xlsx,.xls"
                file={dosFile}
                onChange={setDosFile}
              />
            </div>
          </div>

          <div className="sidebar-footer">
            <button
              className="btn-generate"
              onClick={handleGenerate}
              disabled={!canGenerate || status === "running"}
            >
              {status === "running" ? "Generating…" : "Generate & Download ZIP"}
            </button>
          </div>
        </aside>

        {/* Right output panel */}
        <main className="main">
          {/* Scenario map */}
          <div className="output-panel">
            <div className="output-header">
              <span className="dot dot-green" />
              Generated Scenarios
            </div>
            <div className="output-body">
              {status === "idle" && (
                <div className="empty-state">
                  <div className="empty-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#7f6df2" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                  </div>
                  <div className="empty-title">8 Scenarios Ready to Generate</div>
                  <div className="empty-sub">
                    Upload your 3 reference Excel files, set the country code and DOS decision, then click Generate.
                    A ZIP with all scenario XLS files will be downloaded automatically.
                  </div>
                  <div className="scenario-legend">
                    {[
                      { code:"S1", folder:"Embargo",  decision:"EL",  desc:"Full Embargo = Y" },
                      { code:"S2", folder:"Sanction", decision:"EL",  desc:"Sanction + Military" },
                      { code:"S3", folder:"Sanction", decision:"?",   desc:"Sanction + DOS=Y" },
                      { code:"S4", folder:"Sanction", decision:"NLR", desc:"Sanction + NOCLASS" },
                      { code:"S5", folder:"Sanction", decision:"EL",  desc:"Sanction + Classified" },
                      { code:"S6", folder:"DOS",      decision:"?",   desc:"Non-Sanction + DOS=Y" },
                      { code:"S7", folder:"NoClass",  decision:"NLR", desc:"Non-Sanction + NOCLASS" },
                      { code:"S8", folder:"NoClass",  decision:"EL",  desc:"Non-Sanction + Classified" },
                    ].map(s => (
                      <div key={s.code} className="legend-row">
                        <span className="legend-code">{s.code}</span>
                        <span className={`legend-folder folder-${s.folder.toLowerCase()}`}>{s.folder}</span>
                        <span className="legend-desc">{s.desc}</span>
                        <span className={`legend-decision dec-${s.decision.toLowerCase()}`}>{s.decision === "?" ? dosDecision : s.decision}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Log output */}
              {(status === "running" || status === "done" || status === "error") && (
                <div className="log-area">
                  {log.map((l, i) => (
                    <div key={i} className={`log-line${l.startsWith("✓") ? " log-ok" : l.startsWith("SKIP") ? " log-skip" : ""}`}>
                      {l}
                    </div>
                  ))}
                  {error && <div className="log-line log-error">✗ {error}</div>}
                </div>
              )}

              {/* Summary table */}
              {summary && (
                <div className="summary">
                  <div className="summary-title">Summary — {countryCode.toUpperCase()}</div>
                  <table className="summary-table">
                    <thead>
                      <tr><th>Scenario</th><th>Title</th><th>Folder</th><th>Decision</th><th>Rows</th></tr>
                    </thead>
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
                      <tr className="summary-total">
                        <td colSpan={4}>Total</td>
                        <td>{summary.reduce((a,s) => a+s.rows, 0).toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
