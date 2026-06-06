import cors from "cors";
import express from "express";

const app = express();
const PORT = process.env.PORT || 8787;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "blast-jira-testplan-api" });
});

app.post("/api/generate-test-plan", async (req, res) => {
  try {
    const parsed = validateRequest(req.body);
    let issue;

    try {
      issue = await fetchJiraIssue(parsed);
    } catch (jiraError) {
      const manualIssue = buildManualIssue(req.body, parsed);
      if (!manualIssue) {
        throw jiraError;
      }
      issue = manualIssue;
    }

    const markdown = await generateMarkdownTestPlan(parsed, issue);

    res.json({
      meta: {
        jiraIssueKey: parsed.jiraIssueKey,
        model: parsed.groqModel,
        generatedAt: new Date().toISOString(),
        source: issue.source || "jira-api"
      },
      sourceIssue: issue,
      testPlanMarkdown: markdown
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || "Unexpected server error" });
  }
});

app.post("/api/test-jira-access", async (req, res) => {
  try {
    const parsed = validateJiraRequest(req.body);
    const jiraAccess = await testJiraAccess(parsed);
    res.json(jiraAccess);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || "Unexpected server error" });
  }
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

function validateRequest(body) {
  const jiraParsed = validateJiraRequest(body);
  const jira = body?.settings?.jira || {};
  const groq = body?.settings?.groq || {};

  const required = [
    [groq.apiKey, "GROQ API key is required"],
    [groq.model, "GROQ model is required"]
  ];

  for (const [value, message] of required) {
    if (!value || String(value).trim() === "") {
      throw httpError(400, message);
    }
  }

  return {
    ...jiraParsed,
    groqApiKey: String(groq.apiKey).trim(),
    groqModel: String(groq.model).trim()
  };
}

function validateJiraRequest(body) {
  const jira = body?.settings?.jira || {};
  const jiraIssueKey = body?.request?.jiraIssueKey?.trim();

  const required = [
    [jira.baseUrl, "Jira base URL is required"],
    [jira.email, "Jira email is required"],
    [jira.token, "Jira token is required"],
    [jiraIssueKey, "Jira issue key is required"]
  ];

  for (const [value, message] of required) {
    if (!value || String(value).trim() === "") {
      throw httpError(400, message);
    }
  }

  const normalizedBase = String(jira.baseUrl).trim().replace(/\/+$/, "");
  if (!/^https:\/\//i.test(normalizedBase)) {
    throw httpError(400, "Jira base URL must start with https://");
  }

  return {
    jiraBaseUrl: normalizedBase,
    jiraEmail: String(jira.email).trim(),
    jiraToken: String(jira.token).trim(),
    jiraIssueKey
  };
}

async function fetchJiraIssue(config) {
  const authStrategies = buildAuthStrategies(config);
  const rawIssueKey = config.jiraIssueKey;
  const issueKey = encodeURIComponent(config.jiraIssueKey);
  const candidateUrls = buildCandidateIssueUrls(config.jiraBaseUrl, issueKey);

  let issue = null;
  const failures = [];

  for (const auth of authStrategies) {
    for (const url of candidateUrls) {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          Authorization: auth.header
        }
      });

      if (response.ok) {
        issue = await response.json();
        break;
      }

      const details = await safeErrorBody(response);
      failures.push({ url, status: response.status, details, authType: auth.type });
    }

    if (issue) {
      break;
    }
  }

  if (!issue) {
    const diagnostics = await diagnoseJiraAccess(config);
    const searchHit = await findIssueViaSearch(config, rawIssueKey);

    if (searchHit) {
      issue = searchHit;
    }
  }

  if (!issue) {
    const diagnostics = await diagnoseJiraAccess(config);
    const hint = [
      "Jira request failed for all API variants.",
      diagnostics.some((d) => d.status === 200)
        ? "Auth and API path appear valid, but this issue key may be wrong or inaccessible (missing Browse Project permission)."
        : "Jira API path/auth check failed; verify Jira Base URL and include context path if required (example: https://host/jira).",
      "This app now tries both Basic auth (email+token) and Bearer token automatically.",
      "Quick check: open <base-url>/rest/api/2/serverInfo and verify JSON is returned.",
      `Issue URLs tried: ${failures.map((f) => `${f.authType}:${f.status} ${f.url}`).join(" | ")}`,
      `Auth diagnostics (/myself): ${diagnostics
        .map((item) => `${item.authType}:${item.status} ${item.url}${item.user ? ` user=${item.user}` : ""}`)
        .join(" | ")}`
    ].join(" ");
    throw httpError(failures[0]?.status || 502, hint);
  }

  const fields = issue?.fields || {};
  return {
    key: issue?.key || config.jiraIssueKey,
    summary: fields.summary || "",
    description: extractJiraText(fields.description),
    acceptanceCriteria: fields.customfield_12345 || "",
    priority: fields.priority?.name || "",
    labels: Array.isArray(fields.labels) ? fields.labels : [],
    components: Array.isArray(fields.components) ? fields.components.map((item) => item.name) : []
  };
}

async function findIssueViaSearch(config, rawIssueKey) {
  const jql = encodeURIComponent(`key = \"${rawIssueKey}\"`);
  const fields = encodeURIComponent("summary,description,priority,labels,components,customfield_12345");
  const urls = buildCandidateApiPrefixes(config.jiraBaseUrl).map(
    (prefix) => `${prefix}/search?jql=${jql}&maxResults=1&fields=${fields}`
  );
  const authStrategies = buildAuthStrategies(config);

  for (const auth of authStrategies) {
    for (const url of urls) {
      try {
        const response = await fetch(url, {
          headers: {
            Accept: "application/json",
            Authorization: auth.header
          }
        });

        if (!response.ok) {
          continue;
        }

        const data = await response.json();
        const first = data?.issues?.[0];
        if (!first) {
          continue;
        }

        const fieldsData = first.fields || {};
        return {
          key: first.key || rawIssueKey,
          summary: fieldsData.summary || "",
          description: extractJiraText(fieldsData.description),
          acceptanceCriteria: fieldsData.customfield_12345 || "",
          priority: fieldsData.priority?.name || "",
          labels: Array.isArray(fieldsData.labels) ? fieldsData.labels : [],
          components: Array.isArray(fieldsData.components)
            ? fieldsData.components.map((item) => item.name)
            : []
        };
      } catch (_error) {
        // Continue probing alternate API variants/paths.
      }
    }
  }

  return null;
}

async function generateMarkdownTestPlan(config, issue) {
  const systemPrompt = [
    "You create deterministic QA test plans in markdown.",
    "Use this fixed heading template exactly:",
    "# Test Plan: <Issue Key>",
    "## 1) Objective",
    "## 2) Scope",
    "## 3) Assumptions",
    "## 4) Test Scenarios",
    "## 5) Non-Functional Checks",
    "## 6) Risks",
    "Do not invent product details when missing. Explicitly mark unknown items as 'Not provided in Jira'."
  ].join("\n");

  const userPrompt = JSON.stringify(
    {
      jiraIssue: issue,
      constraints: {
        mustBeMarkdown: true,
        conciseButComplete: true,
        includePriorities: ["P0", "P1", "P2"]
      }
    },
    null,
    2
  );

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.groqApiKey}`
    },
    body: JSON.stringify({
      model: config.groqModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const details = await safeErrorBody(response);
    throw httpError(response.status, `GROQ request failed: ${details}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw httpError(502, "GROQ returned an empty test plan");
  }
  return text;
}

function extractJiraText(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  const chunks = [];
  walkRichText(value, chunks);
  return chunks.join(" ").replace(/\s+/g, " ").trim();
}

function walkRichText(node, output) {
  if (!node) {
    return;
  }

  if (typeof node.text === "string") {
    output.push(node.text);
  }

  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      walkRichText(child, output);
    }
  }
}

async function safeErrorBody(response) {
  const text = await response.text();
  return text.slice(0, 500) || response.statusText || "unknown error";
}

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function buildCandidateIssueUrls(baseUrl, issueKey) {
  return buildCandidateApiPrefixes(baseUrl).map((prefix) => `${prefix}/issue/${issueKey}`);
}

function buildCandidateMyselfUrls(baseUrl) {
  return buildCandidateApiPrefixes(baseUrl).map((prefix) => `${prefix}/myself`);
}

function buildCandidateApiPrefixes(baseUrl) {
  const cleaned = String(baseUrl).replace(/\/+$/, "");
  const parsed = new URL(cleaned);

  // Try current path first, then '/jira' for common Data Center/Server deployments.
  const rootPaths = [parsed.pathname.replace(/\/+$/, "") || "", "/jira"];
  const uniqueRootPaths = [...new Set(rootPaths)];

  const prefixes = [];
  for (const rootPath of uniqueRootPaths) {
    const prefix = `${parsed.origin}${rootPath}`;
    prefixes.push(`${prefix}/rest/api/3`);
    prefixes.push(`${prefix}/rest/api/latest`);
    prefixes.push(`${prefix}/rest/api/2`);
  }

  return [...new Set(prefixes)];
}

async function diagnoseJiraAccess(config) {
  const urls = buildCandidateMyselfUrls(config.jiraBaseUrl);
  const authStrategies = buildAuthStrategies(config);
  const results = [];

  for (const auth of authStrategies) {
    for (const url of urls) {
      try {
        const response = await fetch(url, {
          headers: {
            Accept: "application/json",
            Authorization: auth.header
          }
        });

        let user = "";
        if (response.ok) {
          try {
            const payload = await response.json();
            user = payload?.emailAddress || payload?.name || payload?.displayName || "";
          } catch (_parseError) {
            user = "";
          }
        }

        results.push({ url, status: response.status, authType: auth.type, user });
      } catch (_error) {
        results.push({ url, status: 0, authType: auth.type, user: "" });
      }
    }
  }

  return results;
}

async function testJiraAccess(config) {
  const authStrategies = buildAuthStrategies(config);
  const issueKey = encodeURIComponent(config.jiraIssueKey);
  const issueUrls = buildCandidateIssueUrls(config.jiraBaseUrl, issueKey);
  const myselfUrls = buildCandidateMyselfUrls(config.jiraBaseUrl);

  const myselfResults = [];
  for (const auth of authStrategies) {
    for (const url of myselfUrls) {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          Authorization: auth.header
        }
      });

      let user = "";
      if (response.ok) {
        try {
          const payload = await response.json();
          user = payload?.emailAddress || payload?.name || payload?.displayName || "";
        } catch (_parseError) {
          user = "";
        }
      }

      myselfResults.push({ url, status: response.status, authType: auth.type, user });
    }
  }

  const issueResults = [];
  for (const auth of authStrategies) {
    for (const url of issueUrls) {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          Authorization: auth.header
        }
      });
      issueResults.push({ url, status: response.status, authType: auth.type });
    }
  }

  const authOk = myselfResults.some((item) => item.status === 200);
  const issueOk = issueResults.some((item) => item.status === 200);
  const successfulAuthType = myselfResults.find((item) => item.status === 200)?.authType || "unknown";

  let message = "Jira authentication and issue access look good.";
  if (!authOk) {
    message = "Jira authentication failed. Check Jira email and token.";
  } else if (!issueOk) {
    message = `Authentication succeeded (${successfulAuthType}), but issue is not accessible. Check Jira key, Browse Project permission, or issue-level security.`;
  }

  return {
    authOk,
    issueOk,
    message,
    details: {
      myself: myselfResults,
      issue: issueResults
    }
  };
}

function buildAuthStrategies(config) {
  const basic = Buffer.from(`${config.jiraEmail}:${config.jiraToken}`).toString("base64");
  return [
    { type: "basic", header: `Basic ${basic}` },
    { type: "bearer", header: `Bearer ${config.jiraToken}` }
  ];
}

function buildManualIssue(body, parsed) {
  const manual = body?.manualIssue || {};
  const summary = String(manual.summary || "").trim();
  const description = String(manual.description || "").trim();
  const acceptanceCriteriaText = String(manual.acceptanceCriteria || "").trim();

  if (!summary && !description) {
    return null;
  }

  const acceptanceCriteria = acceptanceCriteriaText
    ? acceptanceCriteriaText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
    : [];

  return {
    key: parsed.jiraIssueKey,
    summary,
    description,
    acceptanceCriteria,
    priority: "",
    labels: [],
    components: [],
    source: "manual-fallback"
  };
}
