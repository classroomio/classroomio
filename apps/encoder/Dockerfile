# The HLS encoder. Runs one job and exits, with no ClassroomIO credentials: it
# receives a presigned source URL and a job token scoped to a single asset.
FROM node:20-bookworm-slim AS build

WORKDIR /app
COPY apps/encoder/package.json ./package.json
RUN npm install --no-audit --no-fund

COPY apps/encoder/tsconfig.json ./tsconfig.json
COPY apps/encoder/src ./src
RUN npx tsc

FROM node:20-bookworm-slim AS runtime

# libx264 comes from Debian's ffmpeg build.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
# package.json comes too: it carries "type": "module", so dist/*.js is ESM by
# declaration rather than by Node's syntax detection, which is experimental and
# off on older runtimes.
COPY apps/encoder/package.json ./package.json
COPY --from=build /app/dist ./dist

# Nothing here needs root, and this process handles untrusted media.
USER node

CMD ["node", "dist/index.js"]
