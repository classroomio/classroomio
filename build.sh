#!/bin/bash

# build-optimized.sh - Optimized build script for production

set -e

echo "🚀 Starting optimized build process..."

# Enable BuildKit for better caching and parallel builds
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

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


# Build with maximum parallel jobs and cache optimization
docker compose -f docker/production/compose.yml build \
    --parallel \
    --build-arg BUILDKIT_INLINE_CACHE=1 \
    --progress=plain

echo "✅ Build completed successfully!"


# Optional: Show final image sizes
echo "📊 Final image sizes:"
docker images | grep -E "(dashboard|backend)" | head -5