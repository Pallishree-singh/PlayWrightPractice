import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { contentOrchestrator } from "../services/content-orchestrator.service.js";
import { endOfDay, startOfDay } from "../services/date-utils.js";

const generateSchema = z.object({
  date: z.string().datetime().optional()
});

export const contentRouter = Router();

contentRouter.get("/today", async (_req, res, next) => {
  try {
    const now = new Date();
    const entry = await prisma.contentEntry.findFirst({
      where: {
        date: {
          gte: startOfDay(now),
          lte: endOfDay(now)
        }
      }
    });
    res.json({ data: entry });
  } catch (error) {
    next(error);
  }
});

contentRouter.get("/history", async (_req, res, next) => {
  try {
    const rows = await prisma.contentEntry.findMany({ orderBy: { createdAt: "desc" }, take: 30 });
    res.json({ data: rows });
  } catch (error) {
    next(error);
  }
});

contentRouter.post("/generate", async (req, res, next) => {
  try {
    const input = generateSchema.parse(req.body ?? {});
    const date = input.date ? new Date(input.date) : new Date();
    const entry = await contentOrchestrator.generateForDate(date);
    res.status(201).json({ data: entry });
  } catch (error) {
    next(error);
  }
});
