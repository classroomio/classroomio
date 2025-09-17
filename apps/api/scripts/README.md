# OpenAPI Spec Generator Script

This script generates the OpenAPI specification from your Hono application and optionally uploads it to a Cloudflare R2 bucket.

## Usage

### Generate and Upload OpenAPI spec

```bash
pnpm run upload:openapi
```

### Direct script usage
```bash
tsx scripts/upload-openapi-spec.ts
```

## Examples

```bash
# Generate spec locally only
pnpm upload:openapi
```

## Environment Variables

For R2 upload functionality, set these environment variables:

```bash
CLOUDFLARE_ACCESS_KEY=your_access_key
CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_key
CLOUDFLARE_ACCOUNT_ID=your_account_id
```

## Output

The script will:

1. **Generate** the OpenAPI specification from your Hono app routes
2. **Save locally** to `dist/openapi/openapi.json`
3. **Upload to R2** (if credentials provided):
   - `openapi/openapi-YYYY-MM-DD.json` (dated version)
   - `openapi/openapi-latest.json` (latest version)

## GitHub Action Integration

This script is integrated with a GitHub Action that automatically generates and uploads the OpenAPI spec on code changes.

### Automatic Workflow

The GitHub Action runs on:
- **Push to main** - Automatically uploads to R2
- **Pull Requests** - Generates spec for review (no upload)
- **Manual dispatch** - Allows manual triggering with custom parameters

### Setup

1. **Required secrets:**
   - `CLOUDFLARE_ACCESS_KEY`
   - `CLOUDFLARE_SECRET_ACCESS_KEY` 
   - `CLOUDFLARE_ACCOUNT_ID`
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`

## Features

- ✅ Automatic OpenAPI spec generation from Hono routes
- ✅ Local file generation for development
- ✅ Cloudflare R2 upload with versioning
- ✅ GitHub Action integration
- ✅ Environment-specific deployments
- ✅ PR previews and artifacts
- ✅ Error handling and logging
- ✅ CLI help with `--help` flag
