# Quick Docker Commands Reference

## Compose Stack

```bash
# Full stack (recommended; generates/syncs secure auth tokens in root .env)
./run-docker-full-stack.sh

# Full stack without rebuilding images
./run-docker-full-stack.sh --no-build

# Full stack (postgres, redis, db-init, api, dashboard)
docker compose --env-file .env -p classroomio -f docker/docker-compose.yaml up --build -d

# API-only smoke test path (plus required dependencies)
docker compose --env-file .env -p classroomio -f docker/docker-compose.yaml up --build -d postgres redis db-init api

# Service status
docker compose --env-file .env -p classroomio -f docker/docker-compose.yaml ps

# Logs
docker compose --env-file .env -p classroomio -f docker/docker-compose.yaml logs -f api
docker compose --env-file .env -p classroomio -f docker/docker-compose.yaml logs -f dashboard

# Stop services
docker compose --env-file .env -p classroomio -f docker/docker-compose.yaml down

# Stop + remove volumes (deletes local postgres/redis data)
docker compose --env-file .env -p classroomio -f docker/docker-compose.yaml down -v
```

## Compose Stack (Published Images / Production)

```bash
# 1) Copy and edit production env values (including pinned image tags)
cp docker/.env.prod.example docker/.env.prod

# 2) Pull pinned images
docker compose -p classroomio --env-file docker/.env.prod -f docker/docker-compose.prod.yaml pull

# 3) Start stack from published images
docker compose -p classroomio --env-file docker/.env.prod -f docker/docker-compose.prod.yaml up -d

# 4) Inspect status and logs
docker compose -p classroomio --env-file docker/.env.prod -f docker/docker-compose.prod.yaml ps
docker compose -p classroomio --env-file docker/.env.prod -f docker/docker-compose.prod.yaml logs -f api dashboard
```

## Health Checks

```bash
# API should return welcome JSON
curl -sS http://localhost:3081/

# Dashboard should return 200
curl -I http://localhost:3082/
```

## Build Images Locally

```bash
docker build -f docker/Dockerfile.api -t classroomio/api:latest .
docker build -f docker/Dockerfile.dashboard -t classroomio/dashboard:latest .
```

## Push to Docker Hub

```bash
docker push classroomio/api:latest
docker push classroomio/dashboard:latest
```

## All-in-One Publish Script

```bash
# Default username=classroomio version=latest
./docker/docker-push.sh

# Custom username
DOCKERHUB_USERNAME=your-username ./docker/docker-push.sh

# Versioned tag
VERSION=v1.0.0 ./docker/docker-push.sh
```

## Pull Published Images

```bash
docker pull classroomio/api:latest
docker pull classroomio/dashboard:latest
```

## Run Published Images (Manual)

Use compose for local development. If you run manually, include required runtime env:

```bash
# API
docker run -d --name cio-api -p 3081:3081 \
  -e DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/classroomio \
  -e PRIVATE_DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/classroomio \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  -e BETTER_AUTH_SECRET=<strong-random-secret> \
  -e PRIVATE_SERVER_KEY=<dashboard-server-api-key> \
  -e AUTH_BEARER_TOKEN=<optional-other-bearer-token> \
  classroomio/api:latest

# Dashboard
docker run -d --name cio-dashboard -p 3082:3082 \
  -e PUBLIC_SERVER_URL=http://localhost:3081 \
  -e PRIVATE_SERVER_KEY=<dashboard-server-api-key> \
  -e PUBLIC_IS_SELFHOSTED=true \
  classroomio/dashboard:latest
```

## Useful Commands

```bash
# List local images
docker images | grep classroomio

# Remove local images
docker rmi classroomio/api:latest classroomio/dashboard:latest

# Inspect image
docker inspect classroomio/api:latest
```
