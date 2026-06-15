# LLM.md — Project Constitution

## Data Schema
_To be defined after Phase 1 answers_

### Input Shape
```json
{
  "jira_project_key": "",
  "jira_ids": [],
  "filters": {}
}
```

### Output Shape (Test Plan)
```json
{
  "test_plan_id": "",
  "jira_id": "",
  "title": "",
  "scope": "",
  "test_cases": []
}
```

## Behavioral Rules
_To be defined after Phase 1 answers_

## Architectural Invariants
- No code is written until this schema is confirmed
- `.env` holds all secrets — never hardcoded
- All intermediate data goes to `.tmp/`
