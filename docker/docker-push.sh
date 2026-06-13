#!/bin/bash

# Docker Hub Push Script for ClassroomIO
# Builds and pushes the API, Dashboard, and Jobs worker images to Docker Hub.
# Uses buildx for native multi-arch (linux/amd64 + linux/arm64).

set -e  # Exit on error

# Configuration
DOCKERHUB_USERNAME="${DOCKERHUB_USERNAME:-classroomio}"  # Change this to your Docker Hub username
VERSION="${VERSION:-latest}"  # Can be overridden with VERSION env var
PUBLIC_IS_SELFHOSTED="${PUBLIC_IS_SELFHOSTED:-true}"
PLATFORMS="${PLATFORMS:-linux/amd64,linux/arm64}"

# Only a real semver release should also move the `latest` tag — building edge/main/dev
# must NOT clobber the stable `latest` pointer (mirrors docker-publish.yml's tag policy).
# Use `if` (not `&&`) so the function always returns 0 even when it emits no tag — a helper
# returning non-zero inside a $(...) argument is fragile under `set -e` / inherit_errexit.
is_release_version() { [[ "${VERSION}" =~ ^v?[0-9]+\.[0-9]+\.[0-9]+$ ]]; }
latest_arg() { if is_release_version; then printf -- '-t %s:latest' "$1"; fi; }

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}ClassroomIO Docker Hub Publisher${NC}"
echo -e "${BLUE}================================${NC}"
echo ""
echo "Platforms: ${PLATFORMS}"
echo ""

# Ensure a buildx builder exists (multi-arch requires buildx + QEMU).
if ! docker buildx inspect cio-builder >/dev/null 2>&1; then
  echo -e "${GREEN}Creating buildx builder 'cio-builder'...${NC}"
  docker buildx create --name cio-builder --use >/dev/null
else
  docker buildx use cio-builder
fi

# Build and push API (multi-arch images must be pushed in one buildx step).
echo -e "${GREEN}Building + pushing API image...${NC}"
docker buildx build \
    --platform "${PLATFORMS}" \
    -f docker/Dockerfile.api \
    -t ${DOCKERHUB_USERNAME}/api:${VERSION} \
    $(latest_arg ${DOCKERHUB_USERNAME}/api) \
    --push \
    .
echo -e "${GREEN}✓ API image published successfully!${NC}"
echo ""

# Build and push Dashboard
echo -e "${GREEN}Building + pushing Dashboard image...${NC}"
echo "Dashboard build arg PUBLIC_IS_SELFHOSTED=${PUBLIC_IS_SELFHOSTED}"
docker buildx build \
    --platform "${PLATFORMS}" \
    -f docker/Dockerfile.dashboard \
    --build-arg PUBLIC_IS_SELFHOSTED=${PUBLIC_IS_SELFHOSTED} \
    -t ${DOCKERHUB_USERNAME}/dashboard:${VERSION} \
    $(latest_arg ${DOCKERHUB_USERNAME}/dashboard) \
    --push \
    .
echo -e "${GREEN}✓ Dashboard image published successfully!${NC}"
echo ""

# Build and push Jobs worker (required for video/transcription/AI-generation/email).
echo -e "${GREEN}Building + pushing Jobs worker image...${NC}"
docker buildx build \
    --platform "${PLATFORMS}" \
    -f apps/jobs/Dockerfile \
    -t ${DOCKERHUB_USERNAME}/jobs:${VERSION} \
    $(latest_arg ${DOCKERHUB_USERNAME}/jobs) \
    --push \
    .
echo -e "${GREEN}✓ Jobs image published successfully!${NC}"

# Summary
echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}All images published successfully!${NC}"
echo -e "${BLUE}================================${NC}"
echo ""
echo "API Image:       ${DOCKERHUB_USERNAME}/api:${VERSION}"
echo "Dashboard Image: ${DOCKERHUB_USERNAME}/dashboard:${VERSION}"
echo "Jobs Image:      ${DOCKERHUB_USERNAME}/jobs:${VERSION}"
echo ""
echo "To pull these images:"
echo "  docker pull ${DOCKERHUB_USERNAME}/api:${VERSION}"
echo "  docker pull ${DOCKERHUB_USERNAME}/dashboard:${VERSION}"
echo "  docker pull ${DOCKERHUB_USERNAME}/jobs:${VERSION}"
