import {
  buildManualIssue,
  fetchJiraIssue,
  generateMarkdownTestPlan,
  validateRequest
} from "./_lib/jiraCommon.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = parseBody(req.body);
    const parsed = validateRequest(body);

    let issue;
    try {
      issue = await fetchJiraIssue(parsed);
    } catch (jiraError) {
      const manualIssue = buildManualIssue(body, parsed);
      if (!manualIssue) {
        throw jiraError;
      }
      issue = manualIssue;
    }

    const markdown = await generateMarkdownTestPlan(parsed, issue);

    res.status(200).json({
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
}

function parseBody(body) {
  if (typeof body === "string") {
    return JSON.parse(body || "{}");
  }
  return body || {};
}
