# Build stage using prebuilt dependency image
FROM chifez4u/dashboard-deps:18.18.0 AS build
WORKDIR /app
COPY packages/shared ./packages/shared
COPY apps/dashboard ./apps/dashboard
RUN pnpm --filter dashboard build:memory

# Development stage
FROM chifez4u/dashboard-deps:18.18.0 AS development
WORKDIR /app
COPY packages/tsconfig ./packages/tsconfig
COPY packages/shared ./packages/shared
COPY apps/dashboard ./apps/dashboard
EXPOSE 3000
ENV NODE_ENV=development
CMD ["pnpm", "--filter", "dashboard", "dev"]

# Production stage
FROM gcr.io/distroless/nodejs18-debian11 AS production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/dashboard/build ./build
EXPOSE 3000
ENV NODE_ENV=production
CMD ["build"]