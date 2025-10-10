# ----------- Build Stage -----------
FROM node:20.19.3-alpine AS builder

# Add build arguments
ARG PUBLIC_SUPABASE_URL
ARG PUBLIC_SUPABASE_ANON_KEY
ARG PRIVATE_SUPABASE_SERVICE_ROLE
ARG PRIVATE_APP_HOST
ARG PRIVATE_APP_SUBDOMAINS
ARG UNSPLASH_API_KEY
ARG OPENAI_API_KEY
ARG PUBLIC_SERVER_URL
ARG PUBLIC_IP_REGISTRY_KEY

WORKDIR /cio
# Install pnpm globally so it's available in the final container
RUN npm install -g pnpm

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy everything (filtered by .dockerignore)
COPY . .

# Install all dependencies (monorepo context)
RUN pnpm install

RUN ls -la

# Set env vars for SvelteKit to use Node adapter
ENV PUBLIC_IS_SELFHOSTED=true \
    PUBLIC_SUPABASE_URL=$PUBLIC_SUPABASE_URL \
    PUBLIC_SUPABASE_ANON_KEY=$PUBLIC_SUPABASE_ANON_KEY \
    PRIVATE_SUPABASE_SERVICE_ROLE=$PRIVATE_SUPABASE_SERVICE_ROLE \
    PRIVATE_APP_HOST=$PRIVATE_APP_HOST \
    PRIVATE_APP_SUBDOMAINS=$PRIVATE_APP_SUBDOMAINS \
    UNSPLASH_API_KEY=$UNSPLASH_API_KEY \
    OPENAI_API_KEY=$OPENAI_API_KEY \
    PUBLIC_SERVER_URL=$PUBLIC_SERVER_URL \
    PUBLIC_IP_REGISTRY_KEY=$PUBLIC_IP_REGISTRY_KEY \
    PORT=3082

# Build the dashboard app
RUN NODE_OPTIONS="--max-old-space-size=3072" pnpm build --filter @cio/dashboard

# ----------- Production Stage -----------
FROM node:20.19.3-alpine AS runner

WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 cio-user
USER cio-user

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy the entire dashboard app (including build output)
COPY --from=builder --chown=cio-user:nodejs ./cio/apps/dashboard ./apps/dashboard
COPY --from=builder --chown=cio-user:nodejs ./cio/node_modules ./node_modules
COPY --from=builder --chown=cio-user:nodejs ./cio/package.json ./package.json

RUN echo "LS LA DASHBOARD"
RUN ls -la apps/dashboard

RUN echo "LS LA BUILD"
RUN ls -la apps/dashboard/build

# Expose the port (default for SvelteKit Node adapter)
EXPOSE 3082

# Set environment variables for production
ENV NODE_ENV=production \
    PUBLIC_IS_SELFHOSTED=true \
    PUBLIC_SUPABASE_URL=$PUBLIC_SUPABASE_URL \
    PUBLIC_SUPABASE_ANON_KEY=$PUBLIC_SUPABASE_ANON_KEY \
    PRIVATE_SUPABASE_SERVICE_ROLE=$PRIVATE_SUPABASE_SERVICE_ROLE \
    PRIVATE_APP_HOST=$PRIVATE_APP_HOST \
    PRIVATE_APP_SUBDOMAINS=$PRIVATE_APP_SUBDOMAINS \
    UNSPLASH_API_KEY=$UNSPLASH_API_KEY \
    OPENAI_API_KEY=$OPENAI_API_KEY \
    PUBLIC_SERVER_URL=$PUBLIC_SERVER_URL \
    PUBLIC_IP_REGISTRY_KEY=$PUBLIC_IP_REGISTRY_KEY

# Start the app
CMD ["node", "apps/dashboard/build"]