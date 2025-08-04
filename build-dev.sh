#!/bin/bash

# Check if Docker is available
command -v docker >/dev/null 2>&1 || {
    echo "❌ Error: Docker is not available. Please install Docker and try again."
    exit 1
}

# Check if Docker daemon is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Error: Docker daemon is not running!"
    echo "Please start Docker Desktop or Docker daemon and try again."
    exit 1
fi

echo "✅ Docker daemon is running"

# Enable BuildKit
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Build and run development services
docker compose -f docker/development/compose.yml up --build 