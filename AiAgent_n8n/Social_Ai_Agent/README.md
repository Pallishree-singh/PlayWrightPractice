# contentForge

Local AI-powered LinkedIn Content Automation Platform built with TypeScript, Express, Prisma, SQLite, Next.js 15, TailwindCSS, and shadcn-style components.

## Features

- Automated daily topic generation at 09:00 AM via `node-cron`
- LinkedIn post generation (800-1200 words target)
- LinkedIn image prompt + image generation pipeline
- Excel archive management with concurrency-safe writes
- Dashboard for today, posts, images, Excel monitoring, scheduler status, logs
- Manual trigger endpoint and UI button
- Dockerized local runtime

## Monorepo Structure

- `apps/api`: backend service, scheduler, agents, Prisma, Excel integration
- `apps/web`: Next.js dashboard
- `packages/shared`: shared schema/types/contracts

## Quick Start

1. Copy `.env.example` to `.env` and fill API keys.
2. Install dependencies:
   - `npm install`
3. Generate Prisma client and migrate:
   - `npm run db:generate`
   - `npm run db:migrate`
4. Run both apps:
   - `npm run dev`

## Docker

- `docker compose up --build`

## API Endpoints

- `GET /health`
- `GET /api/content/today`
- `GET /api/content/history`
- `POST /api/content/generate`
- `GET /api/scheduler/status`
- `GET /api/logs/recent`

