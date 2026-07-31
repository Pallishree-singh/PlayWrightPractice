import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { schedulerService } from "./services/scheduler.service.js";

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(`contentForge API running on port ${env.PORT}`);
  schedulerService.start();
});
