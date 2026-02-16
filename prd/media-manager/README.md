# Media Manager PRD

## Purpose
Design and deliver an organization-level **Media Manager** so uploaded files become reusable, governable assets instead of content-local JSON blobs.

## Problem Statement
Today, uploads are attached directly inside content payloads (for example `lesson.videos`) and managed only from that local context.

This creates product and technical gaps:
- No organization-wide asset library.
- No reliable reuse across courses/lessons/exercises.
- No global usage map (where each asset is used).
- No global edit propagation (title/thumbnail/metadata updates).
- No accurate organization storage accounting.
- No one-click media export per organization.

## Decision Update
We will use a **separate canonical assets model**:
- `assets` table for organization-scoped asset identity and storage metadata.
- `asset_usages` table for where each asset is used.

`lesson.videos` remains temporarily for compatibility during migration.

## Current-State Audit

Legend: ✅ available now, ⚠️ partial/manual, ❌ missing

| Capability | Availability | Current State | Effort | Should Implement |
| --- | --- | --- | --- | --- |
| Upload media to content | ✅ | Added directly inside content JSON | Low | [x] |
| Reuse existing uploaded media | ⚠️ | Mostly manual copy/re-add flows | Medium | [x] |
| Org-wide asset library | ❌ | No canonical assets table/page | High | [x] |
| Cross-target usage visibility | ❌ | No usage graph | High | [x] |
| Global metadata updates | ❌ | Metadata is duplicated per content item | High | [x] |
| Accurate org storage usage | ❌ | No canonical `byte_size` aggregation | Medium | [x] |
| Safe delete/archive with usage guard | ❌ | Local removal only | Medium | [x] |

## Goals
1. Create canonical org-level assets in `assets`.
2. Support asset kinds beyond video (`document`, `image`, extensible).
3. Allow attaching assets to lessons, exercises, and nested content slots.
4. Provide organization-level browsing/search/filtering and usage visibility.
5. Support global metadata updates with consistent rendering across usages.
6. Enable accurate organization storage metrics from canonical asset rows.
7. Preserve existing lesson UX while migrating incrementally.

## Non-Goals (Initial Release)
- Replacing transcoding pipeline.
- Cross-organization sharing.
- Full billing implementation (we will provide usage metrics for billing).

## Proposed Architecture

### Data Model (New)

#### `assets`
Canonical asset record at organization scope.

Suggested fields:
- `id` (uuid, pk)
- `organization_id` (uuid, fk -> `organization.id`, indexed)
- `kind` (`video` | `document` | `image` | `audio` | `other`)
- `provider` (`upload` | `youtube` | `generic` | `external_url`)
- `storage_provider` (`s3` initially)
- `storage_key` (text, nullable, indexed)
- `source_url` (text, nullable)
- `mime_type` (text, nullable)
- `byte_size` (bigint/int, nullable for external assets, required for uploaded assets)
- `checksum` (text, nullable)
- `title` (text, nullable)
- `description` (text, nullable)
- `thumbnail_url` (text, nullable)
- `duration_seconds` (int, nullable)
- `aspect_ratio` (text, nullable)
- `is_external` (boolean, default false)
- `status` (`active` | `archived`)
- `created_by_profile_id` (uuid, fk -> `profile.id`)
- `created_at`, `updated_at`

Indexes/constraints:
- `(organization_id, created_at desc)`
- `(organization_id, kind, status)`
- `(organization_id, title)`
- `(organization_id, byte_size)`
- unique `(organization_id, provider, storage_key)` where `storage_key` is not null

#### `asset_usages`
Usage graph from asset to content targets.

Suggested fields:
- `id` (uuid, pk)
- `organization_id` (uuid, indexed)
- `asset_id` (uuid, fk -> `assets.id`, indexed)
- `target_type` (`lesson` | `exercise` | `question`)
- `target_id` (uuid)
- `slot_type` (`lesson_video` | `lesson_document` | `exercise_attachment` | `question_prompt_media` | `question_explanation_media` ...)
- `slot_key` (text, nullable; path-like key for nested content, e.g. `questions[2].prompt.media`)
- `position` (int, nullable)
- `created_by_profile_id` (uuid)
- `created_at`

Constraints:
- unique `(asset_id, target_type, target_id, slot_type, slot_key, position)`
- indexes `(target_type, target_id)` and `(asset_id)`
- service-layer scope validation: asset org must equal usage org.

### Storage Accounting
Storage metrics come from `assets`, not `asset_usages`.

Rules:
- Organization total: `sum(byte_size)` for `organization_id`.
- Reuse does not multiply storage.
- External assets (`is_external=true`) are excluded from internal storage totals.

Recommended outputs:
- `totalBytes`
- `bytesByKind`
- `internalBytes`
- `externalAssetCount`

### Backward Compatibility Strategy
- Keep `lesson.videos` during transition.
- Extend lesson media payload with `assetId?: string`.
- For new lesson attachments, write-through to both:
  - canonical `assets` + `asset_usages`
  - compatibility `lesson.videos`
- Read path should prefer canonical metadata when `assetId` exists.

### API Surface (Proposed)

#### Validation (`packages/utils/src/validation/assets/`)
- `ZAssetListQuery`
- `ZAssetCreateUpload`
- `ZAssetAttach`
- `ZAssetDetach`
- `ZAssetUpdate`
- `ZAssetDelete`
- `ZAssetUsageParams`
- `ZAssetExportQuery`
- `ZAssetStorageQuery`

#### DB Queries (`packages/db/src/queries/assets/`)
- `createAsset`
- `getAssetById`
- `listAssetsByOrg`
- `updateAsset`
- `archiveAsset`
- `deleteAsset`
- `createAssetUsage`
- `deleteAssetUsage`
- `listAssetUsagesByAsset`
- `countAssetUsagesByAsset`
- `listAssetsForExport`
- `getAssetStorageSummaryByOrg`

#### Services (`apps/api/src/services/assets/`)
- `createAssetFromUploadService`
- `attachAssetService`
- `detachAssetService`
- `updateAssetService`
- `deleteAssetService`
- `getAssetUsageGraphService`
- `exportOrganizationAssetsService`
- `getOrganizationAssetStorageService`

#### Routes (`apps/api/src/routes/assets/`)
All routes require `authMiddleware` + `orgTeamMemberMiddleware`, except delete/export where admin policy applies.

Proposed endpoints:
- `GET /organization/assets`
- `POST /organization/assets`
- `GET /organization/assets/:assetId`
- `PUT /organization/assets/:assetId`
- `DELETE /organization/assets/:assetId`
- `GET /organization/assets/:assetId/usage`
- `POST /organization/assets/:assetId/attach`
- `POST /organization/assets/:assetId/detach`
- `GET /organization/assets/export`
- `GET /organization/assets/storage`

## Frontend Plan

### Routes
- `apps/dashboard/src/routes/org/[slug]/media/+page.server.ts`
- `apps/dashboard/src/routes/org/[slug]/media/+page.svelte`

### Feature Module
- `apps/dashboard/src/lib/features/media-manager/`
  - `api/media-manager.svelte.ts`
  - `utils/types.ts`
  - `components/media-library.svelte`
  - `components/media-card.svelte`
  - `components/media-usage-drawer.svelte`
  - `components/edit-media-modal.svelte`
  - `components/attach-media-modal.svelte`
  - `components/storage-usage-card.svelte`

### Navigation
- Add item in `apps/dashboard/src/lib/features/ui/navigation/org-navigation.ts`:
  - title key: `org_navigation.media`
  - path: `/media`

### Lesson and Exercise Integration
- Lesson upload completion:
  1. upload file to storage via presign
  2. create/get canonical asset with `kind='video'`
  3. attach usage with `targetType='lesson'`, `targetId=lessonId`, `slotType='lesson_video'`
  4. persist compatibility shape with `assetId` in `lesson.videos`
- Add “Choose from library” tab in lesson add-video modal.
- Add exercise-side attach flow using `targetType='exercise'` and slot metadata.
- Replace delete-by-index with detach behavior when asset has multiple usages.

## Export Design
- v1: JSON manifest + signed download URLs.
- Include:
  - asset metadata (id, kind, provider, key, mimeType, byteSize, title, timestamps)
  - usage entries (`targetType`, `targetId`, `slotType`, `slotKey`, `position`)

## Migration Plan

### Phase 0: Foundation (No UI changes)
1. Add `assets` and `asset_usages` tables + indexes.
2. Add assets queries/services/routes.
3. Add compatibility support for `assetId` in lesson video schema.
4. Add migration script to backfill existing lesson media payloads (videos + documents, internal + external).

### Phase 1: Org Media Manager + Lesson Reuse
1. Add org `/media` page.
2. Add list/search/filter/sort.
3. Add usage drawer.
4. Add attach-from-library flow in lesson editor.

### Phase 2: Exercise Reuse + Global Editing + Export + Storage
1. Add exercise usage attachments via `targetType='exercise'`.
2. Add global metadata editing.
3. Add export endpoint + UI action.
4. Add storage summary endpoint + UI card.

### Phase 3: Hardening
1. Deletion/archival policies.
2. Usage-safe deletion confirmations.
3. Pagination/performance tuning.
4. Reconciliation job for JSON/table drift.

## Migration Script Requirement
A dedicated script is required to migrate existing lesson media payloads into `assets` and `asset_usages`.

Script plan:
- File: `packages/db/src/scripts/backfill-lesson-assets.ts`
- Command: `pnpm --filter @cio/db db:assets-backfill`
- Reference spec: `prd/media-manager/backfill-lesson-videos-to-assets.md`

## Risks and Mitigations
- Drift between content JSON and canonical tables.
  - Mitigation: write-through plus reconciliation report.
- Expired presigned URLs in existing `link` fields.
  - Mitigation: key-based URL regeneration; key is source of truth.
- Shared asset update surprises.
  - Mitigation: explicit UI copy that updates are global.
- Migration edge cases (missing keys, duplicate keys).
  - Mitigation: idempotent script + dry-run + skip report.
- Missing historical file sizes.
  - Mitigation: nullable `byte_size` + follow-up hydration job for unknown sizes.

## Success Metrics
- `% of upload videos with assetId >= 95%` within 2 weeks.
- Median attach-from-library time < 20s.
- Export success rate > 99%.
- Duplicate upload reduction >= 40%.
- `% of internal assets with non-null byte_size >= 98%`.

## Open Questions
1. Should we add size hydration for existing external assets where `byte_size` is unknown?
2. Should delete be admin-only in v1?
3. Should v1 use soft-delete only (`archived`) before hard-delete?
4. Should storage totals exclude archived assets?
5. What is the final controlled vocabulary for `slot_type` values across exercises/questions?

## Kanban Board (Ideation Phase)

| Ticket | Title | Todo | In Progress | Verification | Done |
| --- | --- | --- | --- | --- | --- |
| MM-1 | DB: create `assets` and `asset_usages` tables | [ ] | [ ] | [ ] | [ ] |
| MM-2 | Validation schemas for assets APIs | [ ] | [ ] | [ ] | [ ] |
| MM-3 | DB queries for assets CRUD + usage graph | [ ] | [ ] | [ ] | [ ] |
| MM-4 | Service layer for attach/detach/update/delete/export | [ ] | [ ] | [ ] | [ ] |
| MM-5 | API routes under organization scope (`/organization/assets`) | [ ] | [ ] | [ ] | [ ] |
| MM-6 | Backfill script: lesson media (videos + documents) -> assets + usages | [ ] | [ ] | [ ] | [ ] |
| MM-7 | Dashboard feature module (`media-manager`) | [ ] | [ ] | [ ] | [ ] |
| MM-8 | Org `/media` page with list/search/filter | [ ] | [ ] | [ ] | [ ] |
| MM-9 | Usage drawer with target/slot visibility | [ ] | [ ] | [ ] | [ ] |
| MM-10 | Lesson “Choose from library” attach flow | [ ] | [ ] | [ ] | [ ] |
| MM-11 | Exercise slot attach flow | [ ] | [ ] | [ ] | [ ] |
| MM-12 | Global media edit modal | [ ] | [ ] | [ ] | [ ] |
| MM-13 | Export all assets (manifest + signed URLs) | [ ] | [ ] | [ ] | [ ] |
| MM-14 | Storage summary endpoint + UI | [ ] | [ ] | [ ] | [ ] |
| MM-15 | Permission hardening + audit logs | [ ] | [ ] | [ ] | [ ] |

## Verification Checklist
- [ ] `pnpm --filter @cio/db build`
- [ ] `pnpm --filter @cio/utils build`
- [ ] `pnpm --filter @cio/api build`
- [ ] `pnpm --filter @cio/dashboard build`
- [ ] Backfill dry-run on staging snapshot
- [ ] Manual smoke: upload -> attach elsewhere -> edit metadata -> verify propagation
- [ ] Manual smoke: same asset used in multiple slots of one exercise
- [ ] Manual smoke: storage summary correctness against sample dataset
- [ ] Manual smoke: export output integrity
