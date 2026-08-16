# Prompt Generation Skill

## Objective
Collect structured user inputs and produce a reusable, high-quality prompt tailored to their use case.

## Intake Questions
Ask the user for the following:
1. Objective: What is the main objective?
2. Goal: What do they want to achieve?
3. Role: What role should the AI play?
4. Instructions: What must the AI do (step-by-step or strict rules)?
5. Context: What background, constraints, tools, data, or environment should the AI know?
6. Example: What is an input/output example (if any)?
7. Output and tone: What output format, parameters, and tone are required?

## Prompt Assembly Rules
1. Keep the role explicit and domain-specific.
2. Convert instructions into numbered, testable steps.
3. Include constraints (do and do-not rules).
4. Include expected output schema/format.
5. Include at least one worked example when available.
6. Keep language precise and unambiguous.

## Prompt Template
Use this template after collecting answers:

```text
Role:
You are <ROLE>.

Objective:
<OBJECTIVE>

What to achieve:
<GOAL>

Instructions:
1. <INSTRUCTION_1>
2. <INSTRUCTION_2>
3. <INSTRUCTION_3>

Context:
<CONTEXT>

Constraints:
1. <CONSTRAINT_1>
2. <CONSTRAINT_2>

Example:
Input:
<EXAMPLE_INPUT>

Expected Output:
<EXAMPLE_OUTPUT>

Output Requirements:
- Format: <OUTPUT_FORMAT>
- Required fields/parameters: <OUTPUT_PARAMETERS>
- Tone: <TONE>
- Length/detail: <DETAIL_LEVEL>

Validation Checklist:
1. Output matches requested format.
2. All required parameters are present.
3. Tone is consistent.
4. Instructions and constraints are fully applied.
```

## Deliverable
After intake is complete, generate:
1. Final prompt (copy-paste ready).
2. Optional shorter version for quick runs.
3. Optional strict version with additional guardrails.
