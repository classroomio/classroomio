# Quick Docker Commands Reference

## Login to Docker Hub
```bash
docker login
```

## Build Images Locally

### API
```bash
docker build -f ./docker/Dockerfile.api -t classroomio/api:latest .
```

### Dashboard
```bash
docker build -f ./docker/Dockerfile.dashboard -t classroomio/dashboard:latest .
```

## Push to Docker Hub

### API
```bash
docker push classroomio/api:latest
```

### Dashboard
```bash
docker push classroomio/dashboard:latest
```

## All in One Script
```bash
# Make script executable (first time only)
chmod +x docker-push.sh

# Run the script
./docker-push.sh

# With custom username
DOCKERHUB_USERNAME=your-username ./docker-push.sh

# With version tag
VERSION=v1.0.0 ./docker-push.sh
```

## Pull Published Images
```bash
docker pull classroomio/api:latest
docker pull classroomio/dashboard:latest
```

## Run Published Images
```bash
# API
docker run -d -p 3002:3002 \
  -e PUBLIC_SUPABASE_ANON_KEY=your_key \
  -e PUBLIC_SUPABASE_URL=your_url \
  classroomio/api:latest

# Dashboard
docker run -d -p 3082:3082 \
  -e PUBLIC_SUPABASE_ANON_KEY=your_key \
  -e PUBLIC_SUPABASE_URL=your_url \
  classroomio/dashboard:latest
```

## Useful Commands

### Check local images
```bash
docker images | grep classroomio
```

### Remove local images
```bash
docker rmi classroomio/api:latest
docker rmi classroomio/dashboard:latest
```

### View image details
```bash
docker inspect classroomio/api:latest
```

### Check image size
```bash
docker images classroomio/api:latest --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

