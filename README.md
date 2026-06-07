<a href="https://classroomio.com/">
  <img alt="ClassroomIO is a no-code tool that allows you build and scale your online bootcamp with ease." src="https://raw.githubusercontent.com/classroomio/classroomio/main/apps/website/static/classroomio-opengraph-image.png" />
  <h1 align="center">ClassroomIO.com</h1>
  <p align="center">
    The Open Source Learning Management System for Companies
    <br />
    <a href="https://classroomio.com">Website</a>  |  <a href="https://dub.sh/ciodiscord">Join Discord community</a>
  </p>
</a>

## ✨ About ClassroomIO.com

<img alt="ClassroomIO Courses page" src="https://assets.cdn.clsrio.com/www/home/ai-course-builder.jpeg" />

ClassroomIO is an open source LMS for companies. Run compliance/employee training, customer education, and partner certification programs — all from one platform. Self-host it on your own infrastructure or use the cloud version.

### Who It's For

| Use Case | What You Get |
|---|---|
| **Compliance Training** | Deadline tracking, renewals & retake intervals, grace periods, waivers, certificates with custom IDs |
| **Customer Education** | Branded academy portal, programs (cohorts with goals), AI lesson tutor, multilingual content |
| **Partner Training** | Partner workspaces, branded certificates, custom domains, embeddable widgets, multilingual support |

### Key Features

**Course & Content**
- **Course management** — unlimited courses, lessons, exercises, grading, and certificates
- **Programs** — group courses into cohorts with goals, team management, and progress tracking
- **AI Course Builder** — generate outlines, lesson content, and assignments (Gemini, GPT-4o, Claude)
- **AI Lesson Tutor** — in-lesson AI assistant that helps learners as they study

**Compliance & Certification**
- **Compliance tracking** — status, deadlines, grace periods, renewals, and waivers
- **Certificates** — issue branded certificates with custom IDs

**Learner & Org Experience**
- **Multi-org & multi-teacher** — invite teachers, assign courses, manage multiple organizations
- **Student dashboard** — learners access all courses, assignments, and progress in one place
- **Multilingual** — deliver content in 10+ languages

**Integrations & Developer Tools**
- **REST API + Webhooks** — enroll users, trigger automations, receive events (`certificate.issued`, `enrollment.completed`, and more)
- **MCP server** — `@classroomio/mcp` on npm for AI-native integrations
- **Embeddable widget** — embed your course catalog on any website

**Platform**
- **Fully open source** — self-host the entire stack on your own servers

For what's coming next, see the [public roadmap](https://classroomio.com/roadmap).

## Built With

- [SvelteKit](https://kit.svelte.dev/?ref=classroomio.com)
- [Hono](https://hono.dev/)
- [PostgreSQL](https://www.postgresql.org/)
- [Better Auth](https://www.better-auth.com/)
- [TailwindCSS](https://tailwindcss.com/?ref=classroomio.com)

## Get a Demo

You can book a quick 15 min demo to see if ClassroomIO is a good fit for you

<a href="https://cal.com/classroomio/demo">
  <img src="https://cal.com/book-with-cal-dark.svg" alt="Book a Call with ClassroomIO.com">
</a>

<!-- GETTING STARTED -->

## Getting Started

To get a local copy up and running, please follow these simple steps.

### Prerequisites

Here is what you need to be able to run ClassroomIO.com

- [Node.js](https://nodejs.org/) (Version: >=20.19.3)
- [pnpm](https://pnpm.io/installation)
- [Docker](https://docs.docker.com/engine/install/)

### Project Structure

This repo is a monorepo that consists of these primary apps:

1. `website`: The landing page of ClassroomIO hosted [here](https://classroomio.com)
2. `api`: The api service that handles PDF, video processing, Emailing and Notifications.
3. `dashboard`: The web application that runs the learning management system hosted [here](https://app.classroomio.com).
4. `docs`: Official documentation of ClassroomIO hosted [here](https://classroomio.com/docs)

The repository also contains shared packages under `packages/` (for example `packages/db`, `packages/utils`, and `packages/ui`).

## Development

### Local Setup

1. Fork the repo, then clone it:

   ```bash
   git clone https://github.com/classroomio/classroomio.git
   ```

2. Go to project folder:

   ```bash
   cd classroomio
   ```

3. Set up Node (using `nvm`):

   ```bash
   nvm use
   ```

   You first might need to install the specific version and then use it:

   ```bash
   nvm install && nvm use
   ```

   You can install nvm from [here](https://github.com/nvm-sh/nvm).

4. Install dependencies:

   ```bash
   pnpm i
   ```

5. Set up your `.env` files:

   - Go to `apps/dashboard` and `apps/api`.
   - Duplicate the `.env.example` file and rename it to `.env`
     - Populate them with required values (at minimum):
     - `apps/api/.env`: `DATABASE_URL`, `REDIS_URL`, `AUTH_BEARER_TOKEN`, `BETTER_AUTH_SECRET`
     - `apps/dashboard/.env`: `PRIVATE_SERVER_URL`, `PRIVATE_SERVER_KEY`, `PUBLIC_IS_SELFHOSTED`, `DASHBOARD_ORIGIN`
   - Optional for self-hosted Enterprise-only features (SSO, token-auth, no-tracking): set `LICENSE_KEY` in `apps/api/.env`

6. Start local infrastructure for API (Postgres + Redis) and seed the DB:

   ```bash
   docker compose -f docker/docker-compose.yaml up -d postgres redis db-init
   ```

   - Connect with `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/classroomio`
   - Connect with `REDIS_URL=redis://localhost:6379`
   - The `db-init` container runs migrations/seed once Postgres is healthy.

7. (Optional) Start MinIO locally for object storage (media/documents):

   ```bash
   docker compose -f docker/docker-compose.yaml --profile minio up -d minio minio-init
   ```

   - Console: http://localhost:9001 (user/pass default `minioadmin` / `minioadmin`)
   - S3 endpoint: http://localhost:9000
   - Buckets created by `minio-init`: `videos`, `documents`, `media`
   - Add to `apps/api/.env` when using MinIO locally:
     - `OBJECT_STORAGE_ENDPOINT=http://localhost:9000`
     - `OBJECT_STORAGE_PUBLIC_ENDPOINT=http://localhost:9000`
     - `OBJECT_STORAGE_ACCESS_KEY_ID=minioadmin`
     - `OBJECT_STORAGE_SECRET_ACCESS_KEY=minioadmin`
     - `OBJECT_STORAGE_FORCE_PATH_STYLE=true`
     - `OBJECT_STORAGE_MEDIA_PUBLIC_BASE_URL=http://localhost:9000/media`

8. Run the local app services in separate terminals:

   ```bash
   pnpm api:dev
   ```

   ```bash
   pnpm dashboard:dev
   ```

9. Default local URLs:

   - `api`: [http://localhost:3002](http://localhost:3002)
   - `dashboard`: [http://localhost:5173](http://localhost:5173)

10. Optional: run other apps:

   - **website**: `pnpm website:dev`
   - **docs**: `pnpm dev --filter=@cio/docs`

11. Login into `dashboard`:

    - Visit [http://localhost:5173/login](http://localhost:5173/login)
    - Enter email: `admin@test.com`
    - Enter password: `123456`

    To learn more about how to login with a dummy account, [go here.](https://classroomio.com/docs/contributor-guides/demo-accounts)

### Enabling the AI Course Assistant

The in-course AI chat (course authoring, plan generation, lesson edits) is **disabled by default**. Enable it by setting at least one provider API key in `apps/api/.env` (or the root `.env` for the Docker stack):

```bash
# Pick one or more — the dashboard model picker exposes Gemini 2.5 Flash and GPT-4o.
OPENAI_API_KEY=sk-...        # enables GPT-4o
GOOGLE_API_KEY=AIza...       # enables Gemini 2.5 Flash (default model in the picker)
ANTHROPIC_API_KEY=sk-ant-... # supported in code; not currently in the picker UI
```

Notes:
- The `GET /agent/status` endpoint flips to `enabled: true` as soon as any of those keys is set, which is what the dashboard checks before showing the AI button on a course.
- Each chat request sends the user-selected `model` (persisted in `localStorage` as `classroomio-ai-chat-model`). The API resolves the provider for that model (`packages/utils/src/agent-models`) and returns 503 `AI_NOT_CONFIGURED` if that provider's key is missing.
- Optional Tinybird observability: set `TINYBIRD_TOKEN` (and optionally `TINYBIRD_BASE_URL`) in `apps/api/.env`. Events are silently skipped when the token is absent.
- More detail on architecture, tools, and routes lives in [`prd/ai-course-assistant [DONE]/README.md`](prd/ai-course-assistant%20[DONE]/README.md).

### Docker Compose (Full Stack)

```bash
cp .env.example .env   # copy env template, edit for your domain
./run-docker-full-stack.sh
```

The script reads root `.env` via `docker compose --env-file .env` and auto-generates secure values for `AUTH_BEARER_TOKEN` and `PRIVATE_SERVER_KEY` when missing.

See [`.env.example`](.env.example) for the full list of environment variables with required/optional grouping, and [`docker/docs/SELF_HOST.md`](docker/docs/SELF_HOST.md) for the complete Docker self-hosting guide.

## Publishing

When cutting releases for hosted assets or the npm MCP package, run:

- **Storybook** — `pnpm --filter @cio/storybook storybook:publish`
- **Course widget embed** — `pnpm --filter @cio/embeds embeds:publish`
- **Question type picker** — `pnpm --filter @cio/embeds embeds:publish` (same script builds and uploads both embeds)
- **MCP (`@classroomio/mcp`)** — bump the version in `packages/mcp/package.json`, then `pnpm mcp:build` and `pnpm --filter @classroomio/mcp publish`
