# Test Plan Generation SOP

## Goal

Generate a deterministic markdown test plan for a Jira issue key such as TA-143840 by combining Jira issue fields with GROQ model output.

## Inputs

- Jira base URL
- Jira email
- Jira token
- GROQ API key
- GROQ model
- Jira issue key

## Flow

1. Validate request payload and required fields.
2. Fetch Jira issue via Jira REST API v3 using Basic auth.
3. Extract normalized issue fields.
4. Send structured issue JSON to GROQ OpenAI-compatible chat endpoint.
5. Return markdown test plan and metadata.

## Deterministic Constraints

- Enforce fixed heading template in model instructions.
- Do not continue on missing required credentials.
- Return explicit errors for Jira/GROQ failures.
- Use low temperature for stable output.

## Edge Cases

- Invalid Jira base URL format.
- Unknown Jira issue key.
- Jira description in rich text document format.
- GROQ response with empty content.
