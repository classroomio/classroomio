FROM node:20-bookworm-slim AS base

# ffmpeg is needed for media probe / thumbnail / audio-extract / transcode tasks.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy workspace manifest and lockfile first for cache reuse.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/jobs/package.json apps/jobs/
COPY packages/jobs/package.json packages/jobs/
COPY packages/db/package.json packages/db/
COPY packages/utils/package.json packages/utils/
COPY packages/tsconfig/package.json packages/tsconfig/
COPY packages/email/package.json packages/email/
COPY packages/question-types/package.json packages/question-types/

RUN pnpm install --frozen-lockfile --filter @cio/jobs-worker...

COPY . .

RUN pnpm --filter @cio/utils build \
    && pnpm --filter @cio/db build \
    && pnpm --filter @cio/jobs build \
    && pnpm --filter @cio/jobs-worker build

# Run all worker entrypoints by default. Override CMD to scale media / transcribe
# / maintenance independently.
CMD ["node", "apps/jobs/dist/index.js"]
