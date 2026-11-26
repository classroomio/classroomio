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

1. **Push to `main`**: Publishes the **`latest`** tag (the freshest `main` build).
2. **Push a version tag `vX.Y.Z`**: Publishes `X.Y.Z` (immutable) plus `X.Y` and `X` (moved to each new patch). The weekly release job runs this for you; see [Cutting a release](#cutting-a-release).
3. **Manual trigger**: Use the Actions tab in GitHub.

#### Create a version tag and push:

```bash
git tag v0.1.0
git push origin v0.1.0
```

#### Manual trigger from GitHub:

1. Go to Actions tab in your repository
2. Select "Publish Docker Images" workflow
3. Click "Run workflow"
4. Choose the ref to build: `main` publishes `latest`; a `vX.Y.Z` tag publishes `X.Y.Z`, `X.Y` and `X`. The version input is not used.

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

For self-hosting with Docker Compose, see [SELF_HOST.md](SELF_HOST.md). The setup uses a single root `.env` file and `docker-compose.yaml`.

## Versioning Strategy (rolling `latest` + pinned releases)

The published tags and what they mean:

| Tag | Published by | Meaning |
|-----|--------------|---------|
| `1.4.2` (exact) | a `v1.4.2` git tag | Immutable, pinned release — **what production should pin** |
| `1.4`, `1` | a `v1.4.2` git tag | Latest patch/minor of that line |
| `latest` | every push to `main` | The freshest `main` build (rolling; may include unreleased code) |

The key rule: **`latest` moves on every merge to `main`**, so it can change under you. Self-hosters
pin `CIO_VERSION` (see [SELF_HOST.md](SELF_HOST.md)) and upgrade on their own schedule.

### Cutting a release

Patch releases are automatic. Every Monday at 08:00 UTC, `.github/workflows/weekly-release.yml`
checks `main` for commits since the newest `vX.Y.Z` tag. If there are any, it creates the next
patch release (`v1.0.0` → `v1.0.1`) as a GitHub Release with auto-generated notes, then runs this
workflow on the new tag to push `X.Y.Z`/`X.Y`/`X`. To release early, run "Weekly Patch Release"
from the Actions tab.

For a minor or major release, push the tag yourself; the weekly job then patches from it:

```bash
git tag v1.1.0 origin/main
git push origin v1.1.0
```

To publish manually from a laptop instead, `./docker/docker-push.sh` builds + pushes all three
images multi-arch (set `VERSION=1.4.2`).

## Image Sizes and Build Times

- **API Image**: ~400-600 MB (Node.js Debian slim + dependencies)
- **Dashboard Image**: ~600-800 MB (Node.js Debian slim + SvelteKit build)
- **Jobs Image**: ~500-700 MB (Node.js Debian slim + ffmpeg + dependencies)
- **Build Time**: 5-10 minutes per image (depending on your machine). Multi-arch (amd64 + arm64) builds take longer.

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
- The only required build argument is `PUBLIC_IS_SELFHOSTED` (defaults to `true`)
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
