# BLAST Jira Test Plan Generator

Lightweight React application with an Express API to generate a Test Plan from a Jira issue key (for example TA-143840) using GROQ.

## Features

- Jira settings input: base URL, email, token
- GROQ settings input: API key, model (default: openai/gpt-oss-120b)
- Jira issue key input
- Automatic Jira fetch and test-plan generation
- Fixed markdown template output
- Download generated markdown as file

## Run Locally

1. Install dependencies:

   npm install

2. Start frontend and backend together:

   npm run dev

3. Open:

   http://localhost:5173

## API Endpoint

- POST /api/generate-test-plan

Request body shape:

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
    "jiraIssueKey": "TA-143840"
  }
}
