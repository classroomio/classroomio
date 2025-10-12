#!/bin/bash

# Docker Hub Push Script for ClassroomIO
# This script builds and pushes the API and Dashboard images to Docker Hub

set -e  # Exit on error

# Configuration
DOCKERHUB_USERNAME="${DOCKERHUB_USERNAME:-classroomio}"  # Change this to your Docker Hub username
VERSION="${VERSION:-latest}"  # Can be overridden with VERSION env var

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}ClassroomIO Docker Hub Publisher${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Build and push API
echo -e "${GREEN}Building API image...${NC}"
docker build \
    -f docker/Dockerfile.api \
    -t ${DOCKERHUB_USERNAME}/api:${VERSION} \
    -t ${DOCKERHUB_USERNAME}/api:latest \
    .

echo -e "${GREEN}Pushing API image to Docker Hub...${NC}"
docker push ${DOCKERHUB_USERNAME}/api:${VERSION}
docker push ${DOCKERHUB_USERNAME}/api:latest

echo -e "${GREEN}✓ API image published successfully!${NC}"
echo ""

# Build and push Dashboard
echo -e "${GREEN}Building Dashboard image...${NC}"
docker build \
    -f docker/Dockerfile.dashboard \
    -t ${DOCKERHUB_USERNAME}/dashboard:${VERSION} \
    -t ${DOCKERHUB_USERNAME}/dashboard:latest \
    .

echo -e "${GREEN}Pushing Dashboard image to Docker Hub...${NC}"
docker push ${DOCKERHUB_USERNAME}/dashboard:${VERSION}
docker push ${DOCKERHUB_USERNAME}/dashboard:latest

echo -e "${GREEN}✓ Dashboard image published successfully!${NC}"

# Summary
echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}All images published successfully!${NC}"
echo -e "${BLUE}================================${NC}"
echo ""
echo "API Image: ${DOCKERHUB_USERNAME}/api:${VERSION}"
echo "Dashboard Image: ${DOCKERHUB_USERNAME}/dashboard:${VERSION}"
echo ""
echo "To pull these images:"
echo "  docker pull ${DOCKERHUB_USERNAME}/api:${VERSION}"
echo "  docker pull ${DOCKERHUB_USERNAME}/dashboard:${VERSION}
