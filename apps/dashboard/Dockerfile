# ----------- Build Stage -----------
FROM node:18.18.0-alpine AS builder

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

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy monorepo files
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY apps/dashboard/package.json apps/dashboard/
COPY packages/tsconfig ./packages/tsconfig
COPY packages/shared ./packages/shared

# Install all dependencies (monorepo context)
RUN pnpm install

# Copy the rest of the dashboard app
COPY apps/dashboard ./apps/dashboard

# Set env vars for SvelteKit to use Node adapter
ENV IS_SELFHOSTED=true \
    DEPLOYMENT_PROVIDER=docker \
    PUBLIC_SUPABASE_URL=$PUBLIC_SUPABASE_URL \
    PUBLIC_SUPABASE_ANON_KEY=$PUBLIC_SUPABASE_ANON_KEY \
    PRIVATE_SUPABASE_SERVICE_ROLE=$PRIVATE_SUPABASE_SERVICE_ROLE \
    PRIVATE_APP_HOST=$PRIVATE_APP_HOST \
    PRIVATE_APP_SUBDOMAINS=$PRIVATE_APP_SUBDOMAINS \
    UNSPLASH_API_KEY=$UNSPLASH_API_KEY \
    OPENAI_API_KEY=$OPENAI_API_KEY \
    PUBLIC_SERVER_URL=$PUBLIC_SERVER_URL \
    PUBLIC_IP_REGISTRY_KEY=$PUBLIC_IP_REGISTRY_KEY

# Build the dashboard app
WORKDIR /cio/apps/dashboard
RUN pnpm install
RUN NODE_OPTIONS=--max-old-space-size=4096 pnpm build

# ----------- Production Stage -----------
FROM node:18.18.0-alpine AS runner

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only production node_modules for dashboard
COPY --from=builder ./cio/node_modules ./node_modules
COPY --from=builder ./cio/package.json ./package.json
COPY --from=builder ./cio/apps/dashboard/node_modules ./apps/dashboard/node_modules
COPY --from=builder ./cio/apps/dashboard/package.json ./apps/dashboard/package.json
COPY --from=builder ./cio/apps/dashboard/build ./apps/dashboard/build

# Expose the port (default for SvelteKit Node adapter)
EXPOSE 3000

# Set environment variables for production
ENV NODE_ENV=production \
    IS_SELFHOSTED=true \
    DEPLOYMENT_PROVIDER=docker \
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
CMD ["pnpm", "dashboard:start"] 