import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import { schedulerService } from "../services/scheduler.service.js";

export const metaRouter = Router();

metaRouter.get("/scheduler/status", (_req, res) => {
  res.json({ data: schedulerService.getStatus() });
});

metaRouter.get("/logs/recent", (_req, res) => {
  const file = path.resolve("apps/api/logs/combined.log");
  if (!fs.existsSync(file)) {
    return res.json({ data: [] });
  }

  const lines = fs.readFileSync(file, "utf8").split("\n").filter(Boolean).slice(-100);
  res.json({ data: lines });
});
