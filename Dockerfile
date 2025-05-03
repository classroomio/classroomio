# Build stage
FROM node:18-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@9.15.4 && \
    pnpm config set use-git-checks false && \
    pnpm config set git-checks false && \
    apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy workspace package files
COPY apps/dashboard/package.json ./apps/dashboard/
COPY packages/shared/package.json ./packages/shared/
COPY packages/tsconfig/package.json ./packages/tsconfig/

# Set environment variables for build
ENV IS_SELFHOSTED=true
ENV DEPLOYMENT_PROVIDER=docker
ENV NODE_OPTIONS="--max-old-space-size=40960"
ENV VITE_DISABLE_GIT=true
ENV SENTRY_DISABLE_GIT=true
ENV GIT_TERMINAL_PROMPT=0
ENV GIT_ASKPASS=/bin/true
ENV VITE_DEBUG=true

# Install all dependencies (including dev dependencies)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

RUN echo "Root node_modules contents:" && \
    ls -la ./node_modules && \
    echo "\nDashboard node_modules contents:" && \
    ls -la ./apps/dashboard/node_modules

# Set production environment for build
ENV NODE_ENV=production
ENV DEPLOYMENT_PROVIDER=docker
ENV IS_SELFHOSTED=true

RUN git init && \
    git config --global user.email "noreply@getcrom.com" && \
    git config --global user.name "Crom CI" && \
    git add . && \
    git commit -m "Initial commit for build"

# Build the application with increased timeout
RUN pnpm build --filter=dashboard -- --timeout 600000

# Production stage
FROM node:18-alpine AS runner

# Install pnpm
RUN npm install -g pnpm@9.15.4

# Set working directory
WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/apps/dashboard/build ./apps/dashboard/build
COPY --from=builder /app/apps/dashboard/package.json ./apps/dashboard/
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/tsconfig ./packages/tsconfig

# Install production dependencies only
RUN pnpm i --prod --filter=dashboard

# Set environment variables
ENV NODE_ENV=production
ENV IS_SELFHOSTED=true
ENV DEPLOYMENT_PROVIDER=docker
ENV PUBLIC_SUPABASE_URL=$PUBLIC_SUPABASE_URL
ENV PUBLIC_SUPABASE_ANON_KEY=$PUBLIC_SUPABASE_ANON_KEY
ENV PRIVATE_SUPABASE_SERVICE_ROLE=$PRIVATE_SUPABASE_SERVICE_ROLE
ENV PRIVATE_APP_HOST=$PRIVATE_APP_HOST
ENV PRIVATE_APP_SUBDOMAINS=$PRIVATE_APP_SUBDOMAINS
ENV UNSPLASH_API_KEY=$UNSPLASH_API_KEY
ENV OPENAI_API_KEY=$OPENAI_API_KEY
ENV PUBLIC_SERVER_URL=$PUBLIC_SERVER_URL
ENV PUBLIC_IP_REGISTRY_KEY=$PUBLIC_IP_REGISTRY_KEY
ENV NODE_OPTIONS="--max-old-space-size=40960"

# Expose port
EXPOSE 5000

# Set working directory for the application
WORKDIR /app/apps/dashboard

# Start the application
CMD ["node", "build"] 