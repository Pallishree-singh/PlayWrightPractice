import { testJiraAccess, validateJiraRequest } from "./_lib/jiraCommon.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = parseBody(req.body);
    const parsed = validateJiraRequest(body);
    const jiraAccess = await testJiraAccess(parsed);
    res.status(200).json(jiraAccess);
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
