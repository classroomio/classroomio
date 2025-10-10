FROM node:20.19.3-slim AS app

# Add build arguments
ARG PUBLIC_SUPABASE_ANON_KEY
ARG PUBLIC_SUPABASE_URL
ARG CLOUDFLARE_BUCKET_DOMAIN
ARG CLOUDFLARE_ACCESS_KEY
ARG CLOUDFLARE_SECRET_ACCESS_KEY
ARG CLOUDFLARE_ACCOUNT_ID
ARG CLOUDFLARE_BUCKET_ID
ARG SMTP_HOST
ARG SMTP_USER
ARG SMTP_PASSWORD
ARG SMTP_PORT
ARG SMTP_SENDER
ARG CLOUDFLARE_RENDERING_API_KEY
ARG REDIS_URL

RUN mkdir /app
WORKDIR /app

# Install pnpm and healthcheck tools
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY turbo.json ./
COPY packages/tsconfig ./packages/tsconfig
COPY packages/shared ./packages/shared

# Copy the api package.json
COPY apps/api/package.json ./apps/api/package.json

RUN pnpm install

# Copy app source
COPY . .

# Set environment variables from build args
ENV NODE_ENV=production \
    PUBLIC_SUPABASE_ANON_KEY=$PUBLIC_SUPABASE_ANON_KEY \
    PUBLIC_SUPABASE_URL=$PUBLIC_SUPABASE_URL \
    CLOUDFLARE_BUCKET_DOMAIN=$CLOUDFLARE_BUCKET_DOMAIN \
    CLOUDFLARE_ACCESS_KEY=$CLOUDFLARE_ACCESS_KEY \
    CLOUDFLARE_SECRET_ACCESS_KEY=$CLOUDFLARE_SECRET_ACCESS_KEY \
    CLOUDFLARE_ACCOUNT_ID=$CLOUDFLARE_ACCOUNT_ID \
    CLOUDFLARE_BUCKET_ID=$CLOUDFLARE_BUCKET_ID \
    CLOUDFLARE_RENDERING_API_KEY=$CLOUDFLARE_RENDERING_API_KEY \
    SMTP_HOST=$SMTP_HOST \
    SMTP_USER=$SMTP_USER \
    SMTP_PASSWORD=$SMTP_PASSWORD \
    SMTP_PORT=$SMTP_PORT \
    SMTP_SENDER=$SMTP_SENDER \
    REDIS_URL=$REDIS_URL \
    PORT=3002

RUN pnpm build --filter @cio/api

EXPOSE 3002

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3002 || exit 1

RUN ls -la /app/apps/api

CMD ["node", "apps/api/dist/index.js"]
