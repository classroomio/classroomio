# OpenAPI Spec Generator Script

This script generates the OpenAPI specification for the public API routes only and optionally uploads it to a Cloudflare R2 bucket.

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

Optional — purge Cloudflare CDN cache for `api.cdn.clsrio.com` (after R2 upload):

```bash
CLOUDFLARE_API_TOKEN=your_api_token   # Zone → Cache Purge → Purge
CLOUDFLARE_ZONE_ID=your_zone_id
OPENAPI_SKIP_CDN_PURGE=1              # skip purge when set
```

## Output

The script will:

1. **Generate** the OpenAPI specification from your Hono app routes
2. **Filter** the output to `/public-api/v1/*`
3. **Save locally** to `dist/openapi/public-api/openapi.json`
4. **Upload to R2** (if credentials provided):
   - `openapi/public-api/openapi-YYYY-MM-DD.json` (dated version)
   - `openapi/public-api/openapi-latest.json` (latest version)
5. **Purge Cloudflare CDN** (if `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ZONE_ID` are set) for both public URLs, after upload

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

2. **Optional secrets** (CDN cache purge for `api.cdn.clsrio.com`):
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ZONE_ID`

## Features

- ✅ Automatic OpenAPI spec generation from Hono routes
- ✅ Local file generation for development
- ✅ Cloudflare R2 upload with versioning
- ✅ Optional Cloudflare CDN cache purge (after upload)
- ✅ GitHub Action integration
- ✅ Environment-specific deployments
- ✅ PR previews and artifacts
- ✅ Error handling and logging
- ✅ CLI help with `--help` flag

# Claim email-only memberships

`claim-email-only-memberships.ts` links email-only course, cohort and program rows to the active joined organization member with the same email. It runs the same claim step as the accept, SSO and token sign-in, and join paths: a row the profile already has wins and the email-only duplicate is dropped, claimed cohort students are enrolled in the cohort's courses, and compliance records are created through the shared compliance service. It does not accept invitations and sends no webhooks or emails. Rows with no active joined member for their email are reported as pending and left alone. That covers people who have not joined yet, whose rows are linked when they join, and archived members. The script loads `apps/api/.env`, so run it with the API's database settings in place.

Dry run (counts claimable and pending rows; changes nothing):

```bash
pnpm --filter @cio/api claim:email-only-memberships
```

Apply, optionally for one organization:

```bash
pnpm --filter @cio/api claim:email-only-memberships -- --execute
pnpm --filter @cio/api claim:email-only-memberships -- --execute --org=<orgId>
```

Only members that still have claimable rows are visited, in batches of 500, with progress printed about every 30 seconds. Re-running is safe and finds nothing to do. Run it once in production after deploying the invites-and-membership changes.
