# Media Storage Decoupling + MinIO Support PRD

## Purpose
Decouple ClassroomIO media storage from Cloudflare-specific infrastructure so open-source and self-hosted users can control their own media storage backend, with first-class MinIO support.

## Problem Statement
The current media pipeline is tightly coupled to Cloudflare R2 and Cloudflare Browser Rendering APIs. This creates friction for open-source adopters who want full infrastructure ownership, local/private deployments, and non-Cloudflare object storage.

Current tight-coupling points:
- `apps/api/src/utils/s3.ts` hardcodes Cloudflare R2 endpoint and credentials.
- `apps/api/src/services/media.ts` requires `CLOUDFLARE_IMAGE_BUCKET_DOMAIN` for image URLs.
- `apps/api/src/routes/course/presign.ts` directly uses Cloudflare-bound storage utilities.
- `apps/api/src/utils/lesson-media.ts` directly generates download URLs using Cloudflare-bound utilities.
- `apps/api/src/config/env.ts` and `apps/api/src/constants/index.ts` are Cloudflare-first.
- Docker and docs surface only `CLOUDFLARE_*` storage setup paths.

## Goals
1. Introduce provider-based object storage architecture in API code.
2. Preserve current dashboard and API contracts for uploads/downloads.
3. Support Cloudflare R2 through a generic S3-compatible provider.
4. Add MinIO as a required, documented, self-hosted storage option.
5. Keep backward compatibility for existing Cloudflare-based deployments.
6. Maintain canonical asset metadata and usage tracking without regressions.

## Non-Goals (Initial Release)
- Migrating away from presigned URL upload/download flows.
- Replacing current video transcoding strategy.
- Fully decoupling PDF generation from Cloudflare in the same release.
- Per-organization storage-provider selection (initial scope is instance-level).

## Requirements

### Functional Requirements
1. API storage access must go through a provider abstraction layer, not Cloudflare-specific helpers.
2. Existing presign API endpoints and response shapes must remain unchanged.
3. Existing media image upload endpoint response shape must remain unchanged.
4. Download URL generation for lessons/documents must remain transparent to frontend consumers.
5. Existing Cloudflare deployments must continue working with no required immediate migration.

### MinIO Requirements (Must-Have)
1. MinIO support is required in the first release of this decoupling effort.
2. MinIO must work with direct browser uploads via presigned URLs.
3. MinIO must support three buckets equivalent to current model:
- `videos`
- `documents`
- `media`
4. MinIO path-style compatibility must be supported.
5. Docker self-host flow must include an option to run MinIO locally.
6. Self-host docs must include complete MinIO setup steps:
- bucket creation
- credentials
- CORS rules
- required env vars
- verification steps

### Backward Compatibility Requirements
1. If new storage env vars are absent and `CLOUDFLARE_*` vars are present, runtime must auto-map to Cloudflare-compatible mode.
2. Existing frontend flows must not require code changes for basic upload/download behavior.
3. Existing `storageProvider` values in assets should continue to validate and persist.

### Non-Functional Requirements
1. No material latency regression for presign endpoints.
2. Error messages should be provider-agnostic and actionable.
3. Security posture must remain consistent:
- short-lived presigned URLs
- content-type restrictions
- file-size validation
- principle of least privilege for storage credentials

## Current State Audit

| Area | Current State | Gap | Priority |
| --- | --- | --- | --- |
| Object storage client | Cloudflare R2 hardcoded | No provider abstraction | P0 |
| Presigned URLs | Cloudflare-bound utility | Cannot swap provider | P0 |
| Image upload public URL | Cloudflare domain env only | No generic public URL strategy | P0 |
| Env config | `CLOUDFLARE_*` only | No generic object storage config | P0 |
| Docker self-host | No MinIO service path | Hard for OSS users to self-own media | P0 |
| Docs | Cloudflare-first guidance | Missing MinIO-first self-host path | P0 |
| Asset uniqueness constraint | Unique key excludes `storageProvider` | Potential collision if multiple providers introduced later | P1 |
| PDF rendering | Cloudflare-specific browser rendering API | Separate Cloudflare dependency remains | P2 |

## Proposed Architecture

### 1) Storage Provider Abstraction
Create a provider interface under API utils/services layer.

Suggested interface responsibilities:
- `uploadObject`
- `getObject`
- `deleteObject`
- `createUploadPresignedUrl`
- `createDownloadPresignedUrl`
- `buildPublicUrl`

### 2) S3-Compatible Provider
Implement a single S3-compatible provider using AWS SDK v3, configured by env.

This provider should support:
- Cloudflare R2
- MinIO
- AWS S3
- Other S3-compatible object stores

### 3) Config Model
Add provider-neutral env vars in API config:
- `OBJECT_STORAGE_DRIVER` (initial values: `s3-compatible`)
- `OBJECT_STORAGE_REGION`
- `OBJECT_STORAGE_ENDPOINT`
- `OBJECT_STORAGE_PUBLIC_ENDPOINT` (optional; used for browser-facing presigned URLs where needed)
- `OBJECT_STORAGE_ACCESS_KEY_ID`
- `OBJECT_STORAGE_SECRET_ACCESS_KEY`
- `OBJECT_STORAGE_FORCE_PATH_STYLE` (important for MinIO compatibility)
- `OBJECT_STORAGE_BUCKET_VIDEOS`
- `OBJECT_STORAGE_BUCKET_DOCUMENTS`
- `OBJECT_STORAGE_BUCKET_MEDIA`
- `OBJECT_STORAGE_MEDIA_PUBLIC_BASE_URL`
- `OBJECT_STORAGE_PRESIGN_UPLOAD_EXPIRES_SECONDS`
- `OBJECT_STORAGE_PRESIGN_DOWNLOAD_EXPIRES_SECONDS`

Backward-compatible fallback mapping from existing vars:
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_ACCESS_KEY`
- `CLOUDFLARE_SECRET_ACCESS_KEY`
- `CLOUDFLARE_BUCKET_DOMAIN`
- `CLOUDFLARE_IMAGE_BUCKET_DOMAIN`

### 4) API Contract Stability
Keep these contracts unchanged:
- `POST /course/presign/video/upload`
- `POST /course/presign/document/upload`
- `POST /course/presign/video/download`
- `POST /course/presign/document/download`
- `POST /media/image`

### 5) Data Model Considerations
Current assets schema default `storage_provider='s3'` is acceptable for initial rollout.  
If multi-provider-per-instance or migration coexistence is introduced, consider updating unique constraint:
- from `(organization_id, provider, storage_key)`
- to `(organization_id, provider, storage_provider, storage_key)`

## Complexity Assessment

| Workstream | Complexity | Why |
| --- | --- | --- |
| Storage abstraction refactor (`apps/api`) | High | Core upload/download paths and presign generation are central and cross-cutting |
| MinIO support in presign/browser flows | High | Requires endpoint/path-style/CORS correctness across API and browser contexts |
| Env/config migration with backward compatibility | Medium | Needs careful fallback behavior and clear deprecation strategy |
| Docker self-host MinIO integration | Medium | Additional service wiring, bucket bootstrap, and docs updates |
| Dashboard compatibility | Low | Existing frontend contracts can remain unchanged if API contracts are preserved |
| DB uniqueness hardening for future multi-provider | Medium | Requires migration planning and index/constraint rollout |
| Testing and regression coverage | High | Upload/download flows span API, browser, storage service, and content rendering paths |
| PDF rendering decoupling | Out of scope in this release | Separate dependency track and broader decision surface |

## Implementation Plan

### Phase 0: Foundation
1. Introduce provider interface and s3-compatible provider implementation.
2. Replace direct imports from Cloudflare-bound storage utility across:
- `apps/api/src/services/media.ts`
- `apps/api/src/routes/course/presign.ts`
- `apps/api/src/utils/lesson-media.ts`
3. Implement provider-neutral config in env schema and constants.
4. Add Cloudflare fallback mapping and warning logs.

### Phase 1: MinIO Required Path
1. Add MinIO configuration support in API.
2. Add/extend Docker compose for optional MinIO service.
3. Add bucket bootstrap instructions (videos/documents/media).
4. Add CORS guidance specific to browser presigned PUT/GET/HEAD behavior.

### Phase 2: Documentation + Hardening
1. Update self-host docs with MinIO-first workflow.
2. Update Cloudflare docs to show Cloudflare as one provider option.
3. Update `apps/api/.env.example` and docker env templates.
4. Add integration smoke tests for upload/download and media image URL generation.

### Phase 3: Optional Follow-Up
1. Evaluate schema unique constraint expansion to include `storage_provider`.
2. Evaluate PDF rendering provider abstraction (Cloudflare-independent renderer).

## Required File Touchpoints

Core API:
- `apps/api/src/config/env.ts`
- `apps/api/src/constants/index.ts`
- `apps/api/src/utils/s3.ts` (or replacement provider module)
- `apps/api/src/services/media.ts`
- `apps/api/src/routes/course/presign.ts`
- `apps/api/src/utils/lesson-media.ts`

Docs and self-host:
- `apps/docs/content/docs/quickstart/self-hosting.mdx`
- `apps/docs/content/docs/contributor-guides/cloudflare-setup.mdx`
- `apps/api/.env.example`
- `docker/docker-compose.yaml`
- `docker/docker-compose.prod.yaml`
- `docker/.env.prod.example`
- `docker/docs/USAGE.md`
- `docker/docs/SELF_HOST.md`

Optional DB follow-up:
- `packages/db/src/schema.ts`
- corresponding migration files

## Testing Strategy

### Unit Tests
1. Provider config parsing and fallback behavior.
2. Presigned URL generation for upload/download.
3. Public URL generation for media bucket objects.

### Integration Tests
1. Presign video upload endpoint returns valid URL + key.
2. Presign document upload endpoint returns valid URL + key.
3. Presign download endpoints return URL map for provided keys.
4. Media image upload endpoint uploads and returns public URL.

### Manual Verification Matrix
1. Cloudflare R2 existing env-only setup remains functional.
2. MinIO self-host setup works end-to-end for:
- video upload
- document upload
- thumbnail/image upload
- lesson playback/download link resolution

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Presigned URL host mismatch in containerized MinIO setups | Upload/download failures in browser | Support public endpoint config and document deployment topology clearly |
| CORS misconfiguration in MinIO buckets | Browser request failures | Provide explicit CORS examples and startup checklist |
| Hidden reliance on Cloudflare-specific behavior | Runtime regressions | Add compatibility tests and phased rollout with fallback |
| Config ambiguity between old and new env vars | Misconfiguration risk | Define clear precedence, validation, and startup logs |
| Future multi-provider collisions in assets uniqueness | Data integrity risk | Plan optional schema hardening phase with migration |

## Acceptance Criteria
1. A self-hosted deployment can use MinIO without any Cloudflare credentials.
2. Existing Cloudflare deployments continue to work without immediate config rewrite.
3. Dashboard upload/playback/download behavior remains unchanged for users.
4. Docs provide a complete MinIO setup path from zero to working upload/playback.
5. Docker self-host users can run a documented MinIO-backed stack.

## Open Questions
1. Should we support two endpoints in config by default (`internal` for API operations, `public` for presigned browser URLs), or require one endpoint reachable by both?
2. Do we want to enforce a strict enum for `storageProvider` in validation now, or keep it flexible string-based for compatibility?
3. Should PDF rendering decoupling be planned as a separate PRD immediately after this release?
