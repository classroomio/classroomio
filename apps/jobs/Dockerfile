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

# Patches referenced by package.json#pnpm.patchedDependencies must be present for install.
COPY patches ./patches

RUN pnpm install --frozen-lockfile --filter @cio/jobs-worker...

COPY . .

# Build the worker and all its workspace deps in topological order. A hand-written
# list silently misses transitive deps (e.g. @cio/question-types, consumed by @cio/utils);
# `-r --filter ...` builds the whole closure in the right order (mirrors api/dashboard).
RUN pnpm -r --filter @cio/jobs-worker... build

# Run all worker entrypoints by default. Override CMD to scale media / transcribe
# / maintenance independently.
CMD ["node", "apps/jobs/dist/index.js"]
