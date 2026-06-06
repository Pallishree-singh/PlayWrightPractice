# Project Constitution

## Authority

This file defines the operating constitution for the project. gemini.md stores the active project map, data schemas, and state tracking.

## Core Rules

- Follow the BLAST protocol: Blueprint, Link, Architect, Stylize, Trigger.
- Use the A.N.T. 3-layer architecture: Architecture SOPs, Navigation, Tools.
- Never guess business logic.
- Define and confirm data schemas before implementation.
- Keep deterministic business logic in tools, not in the reasoning layer.
- Store temporary/intermediate files in .tmp/.
- Store API keys and secrets in .env only.
- Update architecture SOPs before changing corresponding tool logic.

## Current Invariants

- tools/ untouched; implementation uses React frontend and Express backend.
- No external connection testing begins until integrations and credentials are known.
- No production trigger or deployment is configured until the payload destination is confirmed.

## Behavioral Rules

Approved behavior:

- Ask for Jira and GROQ configuration through a settings UI, not hardcoded values.
- Accept Jira issue key input (example: TA-143840) and generate Test Plan output deterministically where possible.
- Keep provider/model values configurable so GROQ model choice can be changed later.
- Display clear validation errors for missing credentials, invalid Jira IDs, and failed API calls.
- Enforce fixed markdown heading template in generated output.
- Do not silently invent missing Jira details; mark missing data clearly.

## Architecture State

Architecture approved and implemented in frontend + API service.
