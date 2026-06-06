import React, { useMemo, useState } from "react";

const DEFAULT_STATE = {
  jiraBaseUrl: "",
  jiraEmail: "",
  jiraToken: "",
  groqApiKey: "",
  groqModel: "openai/gpt-oss-120b",
  jiraIssueKey: "TA-143840",
  manualSummary: "",
  manualDescription: "",
  manualAcceptanceCriteria: ""
};

function App() {
  const [form, setForm] = useState(DEFAULT_STATE);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [jiraTest, setJiraTest] = useState(null);

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
    event.preventDefault();
    setError("");
    setResult(null);
    setJiraTest(null);
    setLoading(true);

    try {
      const response = await fetch("/api/generate-test-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          settings: {
            jira: {
              baseUrl: form.jiraBaseUrl.trim(),
              email: form.jiraEmail.trim(),
              token: form.jiraToken.trim()
            },
            groq: {
              apiKey: form.groqApiKey.trim(),
              model: form.groqModel.trim()
            }
          },
          request: {
            jiraIssueKey: form.jiraIssueKey.trim()
          },
          manualIssue: {
            summary: form.manualSummary,
            description: form.manualDescription,
            acceptanceCriteria: form.manualAcceptanceCriteria
          }
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Failed to generate test plan.");
      }

      setResult(payload);
    } catch (requestError) {
      setError(requestError.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  async function handleTestJira() {
    setError("");
    setJiraTest(null);
    setTesting(true);

    try {
      const response = await fetch("/api/test-jira-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          settings: {
            jira: {
              baseUrl: form.jiraBaseUrl.trim(),
              email: form.jiraEmail.trim(),
              token: form.jiraToken.trim()
            }
          },
          request: {
            jiraIssueKey: form.jiraIssueKey.trim()
          }
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Failed to test Jira access.");
      }

      setJiraTest(payload);
    } catch (requestError) {
      setError(requestError.message || "Unexpected error");
    } finally {
      setTesting(false);
    }
  }

  function downloadMarkdown() {
    if (!result?.testPlanMarkdown) {
      return;
    }

    const blob = new Blob([result.testPlanMarkdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${result.meta.jiraIssueKey}-test-plan.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page">
      <div className="bg-shape bg-shape-one" />
      <div className="bg-shape bg-shape-two" />
      <main className="card">
        <header>
          <h1>BLAST Test Plan Generator</h1>
          <p>Connect Jira + GROQ, enter a Jira ID, and auto-generate a structured test plan.</p>
        </header>

        <form onSubmit={handleGenerate} className="form-grid">
          <label>
            Jira Base URL
            <input
              name="jiraBaseUrl"
              value={form.jiraBaseUrl}
              onChange={updateField}
              placeholder="https://your-domain.atlassian.net"
            />
          </label>

          <label>
            Jira Email ID
            <input name="jiraEmail" value={form.jiraEmail} onChange={updateField} placeholder="name@company.com" />
          </label>

          <label>
            Jira Token
            <input
              name="jiraToken"
              type="password"
              value={form.jiraToken}
              onChange={updateField}
              placeholder="Jira API token"
            />
          </label>

          <label>
            GROQ API Key
            <input
              name="groqApiKey"
              type="password"
              value={form.groqApiKey}
              onChange={updateField}
              placeholder="gsk_..."
            />
          </label>

          <label>
            GROQ Model
            <input name="groqModel" value={form.groqModel} onChange={updateField} placeholder="openai/gpt-oss-120b" />
          </label>

          <label>
            Jira ID
            <input name="jiraIssueKey" value={form.jiraIssueKey} onChange={updateField} placeholder="TA-143840" />
          </label>

          <label className="full-width">
            Manual Fallback Summary (optional)
            <input
              name="manualSummary"
              value={form.manualSummary}
              onChange={updateField}
              placeholder="Use when Jira issue access fails"
            />
          </label>

          <label className="full-width">
            Manual Fallback Description (optional)
            <textarea
              name="manualDescription"
              value={form.manualDescription}
              onChange={updateField}
              placeholder="Paste Jira description here if API access is blocked"
              rows={4}
            />
          </label>

          <label className="full-width">
            Manual Acceptance Criteria (optional, one per line)
            <textarea
              name="manualAcceptanceCriteria"
              value={form.manualAcceptanceCriteria}
              onChange={updateField}
              placeholder="AC1&#10;AC2&#10;AC3"
              rows={3}
            />
          </label>

          <div className="actions">
            <button type="button" onClick={handleTestJira} disabled={!canTestJira || testing || loading}>
              {testing ? "Testing Jira..." : "Test Jira Access"}
            </button>
            <button type="submit" disabled={!canSubmit || loading || testing}>
              {loading ? "Generating..." : "Generate Test Plan"}
            </button>
          </div>
        </form>

        {error ? <p className="error">{error}</p> : null}

        {jiraTest ? (
          <section className={`jira-test ${jiraTest.authOk && jiraTest.issueOk ? "jira-test-ok" : "jira-test-warn"}`}>
            <p>
              <strong>Jira Check:</strong> {jiraTest.message}
            </p>
            <p>
              Auth: <strong>{jiraTest.authOk ? "OK" : "FAILED"}</strong> | Issue Access: <strong>{jiraTest.issueOk ? "OK" : "FAILED"}</strong>
            </p>
          </section>
        ) : null}

        {result ? (
          <section className="result">
            <div className="result-head">
              <h2>Generated Test Plan</h2>
              <button onClick={downloadMarkdown}>Download Markdown</button>
            </div>
            <p>
              Issue: <strong>{result.meta.jiraIssueKey}</strong>
            </p>
            <p>
              Source: <strong>{result.meta.source}</strong>
            </p>
            <pre>{result.testPlanMarkdown}</pre>
          </section>
        ) : null}
      </main>
    </div>
  );
}

export default App;
