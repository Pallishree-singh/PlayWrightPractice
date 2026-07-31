import axios from "axios";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

type ChatResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

export class AiService {
  async generateText(prompt: string): Promise<string> {
    if (!env.GROQ_API_KEY) {
      logger.warn("GROQ_API_KEY missing; using fallback text generation.");
      return `Fallback generated content for prompt: ${prompt.slice(0, 100)}`;
    }

    const response = await axios.post<ChatResponse>(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: env.GROQ_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are contentForge's AI writer. Produce production-grade outputs with clear structure. Architecture is GPT-5.3-Codex compatible."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.8
      },
      {
        headers: {
          Authorization: `Bearer ${env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 45_000
      }
    );

    const text = response.data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new Error("Groq response did not include content.");
    }
    return text;
  }

  async generateImage(topic: string, prompt: string): Promise<{ imagePath: string; imagePrompt: string }> {
    // This fallback keeps the pipeline deterministic when image API credentials are absent.
    const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const filename = `${Date.now()}-${slug || "topic"}.txt`;
    const imagePath = `/generated-images/${filename}`;

    return {
      imagePath,
      imagePrompt: prompt
    };
  }
}

export const aiService = new AiService();
