# Docker Usage Guide

This directory contains all Docker-related files for the ClassroomIO project.

## 📁 Directory Structure

```
docker/
├── README.md              # Full publishing guide
├── USAGE.md              # This file - quick usage guide
├── commands.md           # Quick command reference
├── docker-compose.yaml   # Docker Compose configuration
├── docker-push.sh        # Script to publish images to Docker Hub
├── Dockerfile.api        # API service Dockerfile
└── Dockerfile.dashboard  # Dashboard service Dockerfile
```

## 🚀 Quick Start

### Using Docker Compose (Recommended)

```bash
# From the project root
cd docker
docker-compose up -d

# Or from project root
docker-compose -f docker/docker-compose.yaml up -d
```

### Building Individual Images

```bash
# From project root
docker build -f docker/Dockerfile.api -t api .
docker build -f docker/Dockerfile.dashboard -t dashboard .
```

## 📦 Publishing to Docker Hub

```bash
# From project root
./docker/docker-push.sh

# With custom options
DOCKERHUB_USERNAME=your-username VERSION=v1.0.0 ./docker/docker-push.sh
```

## 🔧 Common Commands

### Start Services
```bash
cd docker && docker-compose up -d
```

### Stop Services
```bash
cd docker && docker-compose down
```

### View Logs
```bash
cd docker && docker-compose logs -f
```

### Rebuild Services
```bash
cd docker && docker-compose up -d --build
```

## 📚 Documentation

- **README.md**: Complete Docker Hub publishing guide
- **commands.md**: Quick command reference
- **GitHub Actions**: Automated publishing via `.github/workflows/docker-publish.yml`

## 🌍 Environment Variables

Copy `.env.example` to `.env` in the project root and configure:

```bash
cp ../.env.example ../.env
```

Required variables are listed in `docker-compose.yaml`.

## 🔗 Published Images

- **API**: `classroomio/api` or `classroomio/api`
- **Dashboard**: `classroomio/dashboard` or `classroomio/dashboard`

Pull from Docker Hub:
```bash
docker pull classroomio/api:latest
docker pull classroomio/dashboard:latest
```

## 💡 Tips

1. **Always run builds from project root** - the context needs to be the entire monorepo
2. **Use docker-compose** for local development
3. **Use published images** for production deployments
4. **Check logs** if services fail to start: `docker-compose logs -f`

## 🐛 Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose logs -f

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Port conflicts
```bash
# Check if ports are in use
lsof -i :3002  # API
lsof -i :3082  # Dashboard

# Change ports in docker-compose.yaml if needed
```

### Build failures
```bash
# Clean up Docker
docker system prune -a

# Try building again
docker-compose build --no-cache
```

## 📞 Support

For more detailed information, see:
- `README.md` - Full Docker Hub publishing guide
- `commands.md` - Quick command reference
- Project main README for general setup
