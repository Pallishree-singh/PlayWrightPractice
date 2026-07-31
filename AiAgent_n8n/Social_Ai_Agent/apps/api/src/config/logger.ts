import { createLogger, format, transports } from "winston";
import path from "node:path";
import fs from "node:fs";
import { env } from "./env.js";

const logDir = path.resolve("apps/api/logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

export const logger = createLogger({
  level: env.LOG_LEVEL,
  format: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
  defaultMeta: { service: "contentforge-api" },
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple())
    }),
    new transports.File({ filename: path.join(logDir, "combined.log") }),
    new transports.File({ filename: path.join(logDir, "error.log"), level: "error" })
  ]
});
