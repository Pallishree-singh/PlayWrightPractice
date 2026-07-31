import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH ?? ".env" });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default("openai/gpt-oss-120b"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_IMAGE_MODEL: z.string().default("gemini-2.0-flash-preview-image-generation"),
  EXCEL_FILE_PATH: z.string().default("./apps/api/data/content-archive.xlsx"),
  CRON_TIME: z.string().default("0 9 * * *"),
  TIMEZONE: z.string().default("Asia/Kolkata"),
  LOG_LEVEL: z.string().default("info"),
  PUBLIC_BASE_URL: z.string().default("http://localhost:4000")
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // Fail fast on invalid env for predictable production behavior.
  throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
}

export const env = parsed.data;
