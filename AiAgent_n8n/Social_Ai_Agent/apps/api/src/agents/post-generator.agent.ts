import { aiService } from "../services/ai.service.js";

export class PostGeneratorAgent {
  async run(topic: string, category: string): Promise<string> {
    const prompt = [
      "Write a professional LinkedIn post.",
      `Category: ${category}`,
      `Topic: ${topic}`,
      "Style: educational, engaging, human-like, practical, concise but detailed.",
      "Structure required:",
      "1) Hook",
      "2) Problem Statement",
      "3) Explanation",
      "4) Practical Example",
      "5) Key Takeaways",
      "6) CTA",
      "7) Hashtags",
      "Length: 800-1200 words"
    ].join("\n");

    return aiService.generateText(prompt);
  }
}

export const postGeneratorAgent = new PostGeneratorAgent();
