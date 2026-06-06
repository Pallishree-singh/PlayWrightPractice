# Project Map & State Tracking

## Project State

- Current Phase: Phase 2 / Phase 3 implementation
- Blueprint Approval: Approved
- Data Schema Status: Defined and implemented
- Tool Implementation: Active (React + API)

## Objective

Build a lightweight React application that captures Jira and GROQ configuration, accepts a Jira issue key (current target: TA-143840), fetches issue details from Jira, and generates a Test Plan automatically.

## JSON Data Schema

### Input Schema

Implemented v1.

```json
{
	"settings": {
		"jira": {
			"baseUrl": "https://your-domain.atlassian.net",
			"email": "user@example.com",
			"token": "<secret>"
		},
		"groq": {
			"apiKey": "<secret>",
			"model": "openai/gpt-oss-120b"
		}
	},
	"request": {
		"jiraIssueKey": "TA-143840",
		"projectContext": "optional string",
		"testPlanStyle": "concise|standard|detailed"
	}
}
```

### Output Schema

Implemented v1.

```json
{
	"meta": {
		"jiraIssueKey": "TA-143840",
		"generatedAt": "ISO-8601",
		"model": "openai/gpt-oss-120b"
	},
	"source": {
		"jiraSummary": "string",
		"jiraDescription": "string",
		"jiraAcceptanceCriteria": ["string"]
	},
	"testPlan": {
		"title": "string",
		"scope": "string",
		"assumptions": ["string"],
		"testScenarios": [
			{
				"id": "TP-001",
				"name": "string",
				"priority": "P0|P1|P2",
				"preconditions": ["string"],
				"steps": ["string"],
				"expectedResult": "string"
			}
		],
		"nonFunctionalChecks": ["string"],
		"risks": ["string"]
	},
	"status": {
		"success": true,
		"error": null
	}
}
```

## Behavioral Rules

- Enforce fixed markdown heading template.
- Fail fast for missing required credentials and Jira key.
- Return explicit integration errors from Jira and GROQ.
- Do not fabricate missing Jira fields; annotate missing values.

## Integrations

- Jira Cloud REST API (email + token + base URL).
- GROQ API for LLM-based Test Plan generation.

## Source of Truth

Implemented fields: summary, description, acceptance criteria (customfield_12345 if available), priority, labels, components.

## Delivery Payload

Confirmed: Render generated Test Plan in React UI and provide downloadable Markdown output with fixed template.

## Maintenance Log

- 2026-06-06: Initialized gemini.md as the active project map. Schema not yet defined.
- 2026-06-06: Added draft v1 input/output schema from objective. Awaiting user confirmation in Phase 1.
- 2026-06-06: Updated target Jira issue key to TA-143840. Confirmed credentials readiness and fixed markdown template requirement.
- 2026-06-06: Implemented React UI and Express API for Jira fetch + GROQ generation with markdown download.
