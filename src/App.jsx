import React, { useMemo, useState } from "react";

const DEFAULT_STATE = {
  jiraBaseUrl: "",
  jiraEmail: "",
  jiraToken: "",
  groqApiKey: "",
  groqModel: "openai/gpt-oss-120b",
  jiraIssueKey: "KAN-6",
  manualSummary: "",
  manualDescription: "",
  manualAcceptanceCriteria: ""
};

const NAV_ITEMS = [
  { key: "B", label: "Blueprint" },
  { key: "L", label: "Link" },
  { key: "A", label: "Architect" },
  { key: "S", label: "Stylize" },
  { key: "T", label: "Trigger" },
];

function App() {
  const [form, setForm] = useState(DEFAULT_STATE);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [result, setResult] = useState(null);
  const [jiraTest, setJiraTest] = useState(null);
  const [activeTab, setActiveTab] = useState("testplan");
  const [activeNav, setActiveNav] = useState("B");
  const [showApiConfig, setShowApiConfig] = useState(true);
  const [showJiraConfig, setShowJiraConfig] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      form.jiraBaseUrl.trim() &&
      form.jiraEmail.trim() &&
      form.jiraToken.trim() &&
      form.groqApiKey.trim() &&
      form.groqModel.trim() &&
      form.jiraIssueKey.trim()
    );
  }, [form]);

  const canTestJira = useMemo(() => {
    return form.jiraBaseUrl.trim() && form.jiraEmail.trim() && form.jiraToken.trim() && form.jiraIssueKey.trim();
  }, [form]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleGenerate(event) {
    if (event?.preventDefault) event.preventDefault();
    setError(""); setNotice(""); setResult(null); setJiraTest(null); setLoading(true);
    try {
      const response = await fetch("/api/generate-test-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            jira: { baseUrl: form.jiraBaseUrl.trim(), email: form.jiraEmail.trim(), token: form.jiraToken.trim() },
            groq: { apiKey: form.groqApiKey.trim(), model: form.groqModel.trim() }
          },
          request: { jiraIssueKey: form.jiraIssueKey.trim() },
          manualIssue: { summary: form.manualSummary, description: form.manualDescription, acceptanceCriteria: form.manualAcceptanceCriteria }
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to generate.");
      setResult(payload);
      setNotice("Generated successfully.");
    } catch (e) {
      setError(e.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  async function handleTestJira() {
    setError(""); setNotice(""); setJiraTest(null); setTesting(true);
    try {
      const response = await fetch("/api/test-jira-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: { jira: { baseUrl: form.jiraBaseUrl.trim(), email: form.jiraEmail.trim(), token: form.jiraToken.trim() } },
          request: { jiraIssueKey: form.jiraIssueKey.trim() }
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to test Jira.");
      setJiraTest(payload);
      setNotice("Jira check completed.");
    } catch (e) {
      setError(e.message || "Unexpected error");
    } finally {
      setTesting(false);
    }
  }

  function downloadMarkdown() {
    if (!result?.testPlanMarkdown) return;
    const blob = new Blob([result.testPlanMarkdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${result.meta.jiraIssueKey}-test-plan.md`; a.click();
    URL.revokeObjectURL(url);
    setNotice("Downloaded.");
  }

  function saveToBrowserStorage() {
    if (!result?.testPlanMarkdown) return;
    const key = `testplan:${result.meta.jiraIssueKey}:${Date.now()}`;
    localStorage.setItem(key, JSON.stringify({ issue: result.meta.jiraIssueKey, markdown: result.testPlanMarkdown, savedAt: new Date().toISOString() }));
    setNotice("Saved to browser storage.");
  }

  return (
    <div className="blast-page">
      {/* ── Top bar ── */}
      <header className="blast-topbar">
        <div className="blast-brand">
          <div className="blast-logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>
          </div>
          <div>
            <div className="blast-brand-name">B.L.A.S.T.</div>
            <div className="blast-brand-sub">AI TEST INTELLIGENCE</div>
          </div>
        </div>

        <nav className="blast-nav">
          {NAV_ITEMS.map(({ key, label }) => (
            <button key={key} className={`blast-nav-item${activeNav === key ? " active" : ""}`} onClick={() => setActiveNav(key)}>
              <span className="nav-key">{key}</span>
              <span className="nav-sep">–</span>
              <span className="nav-label">{label}</span>
            </button>
          ))}
        </nav>

        <div className="blast-topbar-right">
          <button className="blast-icon-btn" title="Theme">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          </button>
          <button className="blast-settings-btn" onClick={() => setShowSettings(p => !p)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Settings
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="blast-body">
        {/* ── Left sidebar ── */}
        <aside className="blast-sidebar">
          {/* API Configuration */}
          <div className="blast-section">
            <button className="blast-section-header" onClick={() => setShowApiConfig(p => !p)}>
              <span className="section-dot" />
              API Configuration
              <span className="section-chevron">{showApiConfig ? "▲" : "▼"}</span>
            </button>
            {showApiConfig && (
              <div className="blast-section-body">
                <label className="blast-label">
                  JIRA BASE URL
                  <input className="blast-input" name="jiraBaseUrl" value={form.jiraBaseUrl} onChange={updateField} placeholder="https://yourcompany.atlassian.net" />
                </label>
                <label className="blast-label">
                  JIRA EMAIL
                  <input className="blast-input" name="jiraEmail" value={form.jiraEmail} onChange={updateField} placeholder="you@company.com" />
                </label>
                <label className="blast-label">
                  JIRA API TOKEN
                  <input className="blast-input" name="jiraToken" type="password" value={form.jiraToken} onChange={updateField} placeholder="••••••••" />
                </label>
                <label className="blast-label">
                  GROQ API KEY
                  <input className="blast-input" name="groqApiKey" type="password" value={form.groqApiKey} onChange={updateField} placeholder="gsk_..." />
                </label>
              </div>
            )}
          </div>

          {/* Jira Configuration */}
          <div className="blast-section">
            <button className="blast-section-header" onClick={() => setShowJiraConfig(p => !p)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3c8cff" strokeWidth="2" style={{marginRight:6}}><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
              Jira Configuration
              <span className="section-chevron">{showJiraConfig ? "▲" : "▼"}</span>
            </button>
            {showJiraConfig && (
              <div className="blast-section-body">
                <label className="blast-label">
                  TARGET JIRA ID
                  <input className="blast-input" name="jiraIssueKey" value={form.jiraIssueKey} onChange={updateField} placeholder="KAN-6" />
                </label>
                <label className="blast-label">
                  GROQ MODEL
                  <input className="blast-input" name="groqModel" value={form.groqModel} onChange={updateField} placeholder="openai/gpt-oss-120b" />
                </label>
                <div className="blast-sidebar-actions">
                  <button className="blast-btn-ghost" onClick={handleTestJira} disabled={!canTestJira || testing || loading}>
                    {testing ? "Testing…" : "Test Jira"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Advanced (settings) */}
          {showSettings && (
            <div className="blast-section">
              <div className="blast-section-header" style={{cursor:"default"}}>
                <span className="section-dot" style={{background:"#f59e0b"}} />
                Manual Fallback
              </div>
              <div className="blast-section-body">
                <label className="blast-label">
                  Summary
                  <input className="blast-input" name="manualSummary" value={form.manualSummary} onChange={updateField} placeholder="Jira fallback summary" />
                </label>
                <label className="blast-label">
                  Description
                  <textarea className="blast-input" name="manualDescription" value={form.manualDescription} onChange={updateField} placeholder="Paste description" rows={3} />
                </label>
                <label className="blast-label">
                  Acceptance Criteria
                  <textarea className="blast-input" name="manualAcceptanceCriteria" value={form.manualAcceptanceCriteria} onChange={updateField} placeholder="AC1&#10;AC2" rows={3} />
                </label>
              </div>
            </div>
          )}
        </aside>

        {/* ── Right main ── */}
        <main className="blast-main">
          {/* Tab switcher */}
          <div className="blast-tabs">
            <button className={`blast-tab${activeTab === "testplan" ? " active-gray" : ""}`} onClick={() => setActiveTab("testplan")}>
              <div className="tab-title">Test Plan Generator</div>
              <div className="tab-sub">J++ – BLAST Plus</div>
            </button>
            <button className={`blast-tab${activeTab === "testcases" ? " active-pink" : ""}`} onClick={() => setActiveTab("testcases")}>
              <div className="tab-title">Test Case Generator</div>
              <div className="tab-sub">E-Commerce Modules</div>
            </button>
          </div>

          {/* Output panel */}
          <div className="blast-output-panel">
            <div className="blast-output-header">
              <span className="output-dot" />
              Generated {activeTab === "testplan" ? "Test Plan" : "Test Cases"}
              {result && (
                <div className="output-actions">
                  <button className="blast-btn-sm" onClick={downloadMarkdown}>↓ Download</button>
                  <button className="blast-btn-sm" onClick={saveToBrowserStorage}>Save</button>
                </div>
              )}
              <button className="blast-btn-generate" onClick={handleGenerate} disabled={!canSubmit || loading || testing}>
                {loading ? "Generating…" : "Generate"}
              </button>
            </div>

            {/* Status messages */}
            {error  && <div className="blast-msg blast-msg-error">{error}</div>}
            {notice && <div className="blast-msg blast-msg-ok">{notice}</div>}
            {jiraTest && (
              <div className={`blast-msg ${jiraTest.authOk && jiraTest.issueOk ? "blast-msg-ok" : "blast-msg-warn"}`}>
                {jiraTest.message} — Auth: {jiraTest.authOk ? "✓" : "✗"} | Issue: {jiraTest.issueOk ? "✓" : "✗"}
              </div>
            )}

            {/* Content area */}
            {result ? (
              <div className="blast-result">
                <div className="blast-result-meta">
                  <span className="result-badge">{result.meta.jiraIssueKey}</span>
                  <span className="result-source">{result.meta.source} · {result.meta.model}</span>
                </div>
                <pre className="blast-pre">{result.testPlanMarkdown}</pre>
              </div>
            ) : (
              <div className="blast-empty">
                <div className="blast-empty-icon">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#7f6df2" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                </div>
                <div className="blast-empty-title">
                  {activeTab === "testplan" ? "Test Plan Output" : "Test Cases Output"}
                </div>
                <div className="blast-empty-sub">
                  {activeTab === "testplan"
                    ? "Enter a Jira issue key and click Generate to produce a detailed test plan."
                    : "Select modules, test types and priority, then click Generate to produce detailed test cases."}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;