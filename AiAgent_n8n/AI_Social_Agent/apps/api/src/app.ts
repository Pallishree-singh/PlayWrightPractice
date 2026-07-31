import cors from "cors";
import express from "express";
import { logger } from "./config/logger.js";
import { contentRouter } from "./routes/content.routes.js";
import { metaRouter } from "./routes/meta.routes.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "2mb" }));
  app.use("/generated-images", express.static("apps/api/public/generated-images"));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "contentforge-api" });
  });

  app.use("/api/content", contentRouter);
  app.use("/api", metaRouter);

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error("Unhandled API error", { error });
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
