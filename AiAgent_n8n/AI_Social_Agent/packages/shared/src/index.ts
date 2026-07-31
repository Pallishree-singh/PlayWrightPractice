import { z } from "zod";

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

export type TopicCategory = (typeof TOPIC_CATEGORIES)[number];

export const contentEntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  category: z.enum(TOPIC_CATEGORIES),
  topic: z.string(),
  linkedinPost: z.string().optional(),
  imagePath: z.string().optional(),
  status: z.enum(["PENDING", "TOPIC_GENERATED", "POST_GENERATED", "IMAGE_GENERATED", "COMPLETED", "FAILED"]),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type ContentEntryDto = z.infer<typeof contentEntrySchema>;

export const generateContentRequestSchema = z.object({
  date: z.string().optional()
});

export type GenerateContentRequest = z.infer<typeof generateContentRequestSchema>;
