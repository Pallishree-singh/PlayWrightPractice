import { prisma } from "../db/prisma.js";
import { logger } from "../config/logger.js";
import { topicGeneratorAgent } from "../agents/topic-generator.agent.js";
import { postGeneratorAgent } from "../agents/post-generator.agent.js";
import { imageGeneratorAgent } from "../agents/image-generator.agent.js";
import { dateKey, endOfDay, startOfDay } from "./date-utils.js";
import { excelManagerService } from "./excel-manager.service.js";
import { type ContentStatus } from "../types/content.js";

const ContentStatusValue: Record<ContentStatus, ContentStatus> = {
  PENDING: "PENDING",
  TOPIC_GENERATED: "TOPIC_GENERATED",
  POST_GENERATED: "POST_GENERATED",
  IMAGE_GENERATED: "IMAGE_GENERATED",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED"
};

export class ContentOrchestratorService {
  async generateForDate(date: Date = new Date()) {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const existing = await prisma.contentEntry.findFirst({
      where: { date: { gte: dayStart, lte: dayEnd } }
    });
    if (existing?.status === ContentStatusValue.COMPLETED) {
      return existing;
    }

    const base =
      existing ??
      (await prisma.contentEntry.create({
        data: {
          date: dayStart,
          category: "QA",
          topic: "Pending topic",
          status: ContentStatusValue.PENDING
        }
      }));

    try {
      const { category, topic } = await topicGeneratorAgent.run(dayStart);
      const topicUpdated = await prisma.contentEntry.update({
        where: { id: base.id },
        data: { category, topic, status: ContentStatusValue.TOPIC_GENERATED }
      });

      const linkedinPost = await postGeneratorAgent.run(topicUpdated.topic, topicUpdated.category);
      const postUpdated = await prisma.contentEntry.update({
        where: { id: base.id },
        data: { linkedinPost, status: ContentStatusValue.POST_GENERATED }
      });

      const { imagePath } = await imageGeneratorAgent.run(postUpdated.topic, postUpdated.category);
      const final = await prisma.contentEntry.update({
        where: { id: base.id },
        data: { imagePath, status: ContentStatusValue.COMPLETED }
      });

      await excelManagerService.upsertRow({
        date: dateKey(final.date),
        category: final.category,
        topic: final.topic,
        linkedinPost: final.linkedinPost ?? "",
        imagePath: final.imagePath ?? "",
        status: final.status,
        createdAt: final.createdAt.toISOString(),
        updatedAt: final.updatedAt.toISOString()
      });

      return final;
    } catch (error) {
      logger.error("Content generation pipeline failed", { error });
      await prisma.contentEntry.update({
        where: { id: base.id },
        data: { status: ContentStatusValue.FAILED }
      });
      throw error;
    }
  }
}

export const contentOrchestrator = new ContentOrchestratorService();
