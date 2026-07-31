import cron, { type ScheduledTask } from "node-cron";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { contentOrchestrator } from "./content-orchestrator.service.js";

export class SchedulerService {
  private task: ScheduledTask | null = null;
  private lastRunAt: string | null = null;

  start() {
    if (this.task) {
      return;
    }

    this.task = cron.schedule(
      env.CRON_TIME,
      async () => {
        this.lastRunAt = new Date().toISOString();
        logger.info("Scheduled content generation started", { at: this.lastRunAt });
        await contentOrchestrator.generateForDate(new Date());
      },
      {
        timezone: env.TIMEZONE
      }
    );

    logger.info("Scheduler started", { cron: env.CRON_TIME, timezone: env.TIMEZONE });
  }

  getStatus() {
    return {
      enabled: Boolean(this.task),
      cron: env.CRON_TIME,
      timezone: env.TIMEZONE,
      lastRunAt: this.lastRunAt
    };
  }
}

export const schedulerService = new SchedulerService();
