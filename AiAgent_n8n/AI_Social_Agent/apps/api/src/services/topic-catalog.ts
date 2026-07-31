export const TOPIC_CATEGORIES = [
  "QA",
  "MCP",
  "RAG",
  "LLM",
  "AI Agents",
  "n8n",
  "LangFlow",
  "CrewAI",
  "DeepEval",
  "LangChain",
  "AI Harness",
  "LLM Evaluation",
  "Playwright",
  "Selenium",
  "API Testing",
  "Automation Framework",
  "Prompt Engineering",
  "Agentic AI",
  "AI Testing"
] as const;

export function pickCategory(): (typeof TOPIC_CATEGORIES)[number] {
  const index = Math.floor(Math.random() * TOPIC_CATEGORIES.length);
  return TOPIC_CATEGORIES[index] ?? "QA";
}
