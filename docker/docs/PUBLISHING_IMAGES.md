# Publishing ClassroomIO Docker Images to Docker Hub

This guide explains how to publish the ClassroomIO API and Dashboard Docker images to Docker Hub.

## Prerequisites

1. **Docker Hub Account**: Create an account at https://hub.docker.com if you don't have one
2. **Docker Installed**: Make sure Docker is installed and running on your machine
3. **Docker Hub Access Token**: Create a personal access token at https://hub.docker.com/settings/security

## Method 1: Manual Publishing (Local)

### Step 1: Login to Docker Hub

```bash
docker login
# Enter your Docker Hub username and password/token when prompted
```

### Step 2: Build and Push Images

Use the provided script to build and push both images:

```bash
# Default (uses 'classroomio' as username and 'latest' as version)
./docker/docker-push.sh

# Custom username
DOCKERHUB_USERNAME=your-username ./docker/docker-push.sh

# Specific version
VERSION=v0.1.0 ./docker/docker-push.sh

# Both custom username and version
DOCKERHUB_USERNAME=classroomio VERSION=v0.1.0 ./docker/docker-push.sh
```

### Step 3: Verify Images

Check your Docker Hub repository at:
- https://hub.docker.com/r/classroomio/api
- https://hub.docker.com/r/classroomio/dashboard

## Method 2: GitHub Actions (Automated)

### Setup (One-time)

1. **Add Docker Hub Secrets to GitHub**:
   - Go to your GitHub repository → Settings → Secrets and variables → Actions
   - Add two secrets:
     - `DOCKERHUB_USERNAME`: Your Docker Hub username
     - `DOCKERHUB_TOKEN`: Your Docker Hub access token

2. **Push the workflow file** (already created at `.github/workflows/docker-publish.yml`)

### Publishing via GitHub Actions

The workflow will automatically publish images when:

1. **Push to main/master branch**: Creates a `latest` tag
2. **Create a version tag**: Creates versioned tags
3. **Manual trigger**: Use the Actions tab in GitHub

#### Create a version tag and push:

```bash
git tag v0.1.0
git push origin v0.1.0
```

#### Manual trigger from GitHub:

1. Go to Actions tab in your repository
2. Select "Publish Docker Images" workflow
3. Click "Run workflow"
4. Enter optional version tag (or leave default 'latest')

## Method 3: Individual Image Building

### Build API Image

```bash
docker build -f docker/Dockerfile.api -t classroomio/api:latest .
docker push classroomio/api:latest
```

### Build Dashboard Image

```bash
docker build -f docker/Dockerfile.dashboard -t classroomio/dashboard:latest .
docker push classroomio/dashboard:latest
```

## Using Published Images

### Pull Images

```bash
docker pull classroomio/api:latest
docker pull classroomio/dashboard:latest
```

### Deploy with Compose

Use the production compose file (`docker/docker-compose.prod.yaml`) with pinned image tags.

1. Copy the production env template:

```bash
cp docker/.env.prod.example docker/.env.prod
```

2. Set pinned images in `docker/.env.prod`:

```bash
CIO_API_IMAGE=classroomio/api:v0.1.0
CIO_DASHBOARD_IMAGE=classroomio/dashboard:v0.1.0
```

3. Deploy:

```bash
docker compose -p classroomio --env-file docker/.env.prod -f docker/docker-compose.prod.yaml pull
docker compose -p classroomio --env-file docker/.env.prod -f docker/docker-compose.prod.yaml up -d
```

The `db-init` service also uses `CIO_API_IMAGE` so schema setup always matches the API build you deploy.

For local source builds, keep using `docker/docker-compose.yaml`.

## Versioning Strategy

### Recommended Tags:

- `latest`: Most recent stable build
- `v0.1.0`: Specific semantic version
- `v1.0`: Minor version
- `v1`: Major version
- `main`: Latest main branch build
- `dev`: Development builds

### Example: Publishing a new version

```bash
# Build with multiple tags
docker build -f docker/Dockerfile.api \
  -t classroomio/api:latest \
  -t classroomio/api:v1.2.0 \
  -t classroomio/api:v1.2 \
  -t classroomio/api:v1 \
  .

# Push all tags
docker push classroomio/api:latest
docker push classroomio/api:v1.2.0
docker push classroomio/api:v1.2
docker push classroomio/api:v1
```

## Image Sizes and Build Times

- **API Image**: ~400-600 MB (Node.js Alpine + dependencies)
- **Dashboard Image**: ~600-800 MB (Node.js Alpine + SvelteKit build)
- **Build Time**: 5-10 minutes per image (depending on your machine)

## Multi-Architecture Support

The GitHub Actions workflow builds for both `linux/amd64` and `linux/arm64` platforms, making the images compatible with:
- x86_64 servers
- ARM-based servers (like AWS Graviton)
- Apple Silicon Macs (M1/M2/M3)

## Troubleshooting

### "unauthorized: authentication required"
- Run `docker login` again
- Check your Docker Hub token hasn't expired

### "denied: requested access to the resource is denied"
- Make sure you're pushing to your own username
- Repository might need to be created first on Docker Hub

### Build failures
- Check Dockerfile syntax
- Ensure all build arguments are provided
- Check available disk space: `docker system df`

### Clean up old images
```bash
# Remove dangling images
docker image prune

# Remove all unused images
docker image prune -a
```

## Security Best Practices

1. **Never commit secrets** to the repository
2. **Use Docker Hub access tokens** instead of passwords
3. **Enable 2FA** on your Docker Hub account
4. **Scan images** for vulnerabilities:
   ```bash
   docker scan classroomio/api:latest
   ```
5. **Use specific version tags** in production, not `latest`

## Support

For issues with publishing, please check:
- Docker Hub status: https://status.docker.com
- GitHub Actions logs in your repository
- Docker daemon logs: `docker info`

## References

- [Docker Hub Documentation](https://docs.docker.com/docker-hub/)
- [GitHub Actions for Docker](https://docs.github.com/en/actions/publishing-packages/publishing-docker-images)
- [Docker Build Documentation](https://docs.docker.com/engine/reference/commandline/build/)
