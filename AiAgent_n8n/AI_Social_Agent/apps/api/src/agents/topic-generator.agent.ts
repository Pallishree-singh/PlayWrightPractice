import { subDays } from "../services/date-utils.js";
import { prisma } from "../db/prisma.js";
import { aiService } from "../services/ai.service.js";
import { pickCategory } from "../services/topic-catalog.js";

export class TopicGeneratorAgent {
  async run(targetDate: Date): Promise<{ category: string; topic: string }> {
    const category = pickCategory();

    const prompt = [
      `Generate one unique and practical LinkedIn topic in category: ${category}.`,
      "The topic must be specific, educational, and relevant to working professionals in AI and QA automation.",
      "Return only the topic title in one line."
    ].join("\n");

    const topic = (await aiService.generateText(prompt)).split("\n")[0]?.trim() ?? `Practical insights in ${category}`;

    const duplicateSince = subDays(targetDate, 90);
    const duplicate = await prisma.contentEntry.findFirst({
      where: {
        topic,
        date: {
          gte: duplicateSince,
          lte: targetDate
        }
      }
    });

    if (duplicate) {
      const timestamp = new Date().toISOString().slice(0, 10);
      return { category, topic: `${topic} (${timestamp})` };
    }

    return { category, topic };
  }
}

export const topicGeneratorAgent = new TopicGeneratorAgent();
