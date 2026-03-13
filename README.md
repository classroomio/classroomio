<a href="https://classroomio.com/">
  <img alt="ClassroomIO is a no-code tool that allows you build and scale your online bootcamp with ease." src="https://raw.githubusercontent.com/classroomio/classroomio/main/apps/website/static/classroomio-opengraph-image.png" />
  <h1 align="center">ClassroomIO.com</h1>
  <p align="center">
    The Open Source Learning Management System for Companies
    <br />
    <a href="https://classroomio.com">Website</a>  |  <a href="https://dub.sh/ciodiscord">Join Discord community</a>
  </p>
</a>

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/629e2bb8994345729513c4d69ccbe3d5)](https://app.codacy.com/gh/classroomio/classroomio?utm_source=github.com&utm_medium=referral&utm_content=classroomio/classroomio&utm_campaign=Badge_Grade)

## ✨ About ClassroomIO.com

<img alt="ClassroomIO Courses page" src="https://raw.githubusercontent.com/classroomio/classroomio/main/apps/website/static/classroomio-courses.png" />

Streamline training for everyone with ClassroomIO.com. Our all-in-one platform empowers bootcamps, educators, and businesses to manage training programs easily. With our platform, anyone can run multiple classes and cohorts all from one UI. The application is mobile-first, which means that students can access your lesson materials from any device.

### Mission: Provide Students with the Best Learning Experience

At ClassroomIO, our mission is to provide students with the best possible learning experience. We believe in empowering educators with the tools they need to deliver high-quality education that is accessible, engaging, and effective.

### Key Features

1. **📚 Advanced Course Management:** You can create unlimited courses, create lessons, invite students, add assignments, grade their assignments, and even generate certificates.
2. **👨‍👩‍👦 Multi-Teacher Management:** You can invite other teachers into your organization and assign them individual courses.
3. **🤖 AI Integration:** We've got OpenAI integration for quick course creation where you can generate course content, lesson outlines, and even generate assignments right from your lesson notes.
4. **💬 Forum:** Students can ask questions in your dedicated community and get answers from either you or other students.
5. **💻 Dedicated Student Dashboard:** Once you create an account, you get a dedicated dashboard where your students can access all their courses, assignments, and more.
6. **🔒 Fully open source:** You can self-host the entire stack on your servers.

### Roadmap Features

1. **Forms:** Instead of using Google Forms to collect vital information from your students, you will be able to create forms directly within the dashboard.
2. **Course Templates:** You can clone a full course or share templates with other people.
3. **Analytics:** You can track data about your students across multiple courses.
4. **Run Courses on Messengers:** Students can just join a channel on slack/discord/telegram and a bot automatically sends daily lesson content to your students without you doing anything.

Please reach out to me on [twitter](https://x.com/rotimi_best) if you have any feature request.

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
     - `apps/dashboard/.env`: `PUBLIC_SERVER_URL`, `PRIVATE_SERVER_KEY`, `PUBLIC_IS_SELFHOSTED`
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

### Docker Compose (Full Stack)

```bash
cp .env.example .env   # copy env template, edit for your domain
./run-docker-full-stack.sh
```

The script reads root `.env` via `docker compose --env-file .env` and auto-generates secure values for `AUTH_BEARER_TOKEN` and `PRIVATE_SERVER_KEY` when missing.

See [`.env.example`](.env.example) for the full list of environment variables with required/optional grouping, and [`docker/docs/SELF_HOST.md`](docker/docs/SELF_HOST.md) for the complete Docker self-hosting guide.
