# Build stage using prebuilt dependency image
FROM chifez4u/backend-deps:18.18.0 AS build
WORKDIR /app
COPY src ./src
COPY tsconfig.json ./
RUN pnpm --filter backend build

# Development stage
FROM chifez4u/backend-deps:18.18.0 AS development
WORKDIR /app
COPY src ./src
COPY tsconfig.json ./
EXPOSE 3002
ENV NODE_ENV=development
CMD ["pnpm", "--filter", "backend", "dev"]

# Production stage
FROM gcr.io/distroless/nodejs18-debian11 AS production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 3002
CMD ["dist/index.js"]