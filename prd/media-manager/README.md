# Media Manager PRD

## Purpose
Design and deliver an organization-level **Media Manager** so uploaded videos become reusable, governable assets instead of lesson-local JSON entries.

## Problem Statement
Today, video uploads are added directly to `lesson.videos` and managed only inside a single lesson.

This creates product and technical gaps:
- No organization-wide media library.
- No reliable reuse flow across courses/lessons.
- No global usage map (where each video is used).
- No global edit propagation (thumbnail/title/metadata updates).
- No one-click media export per organization.

## Data Sources Checked
- `packages/db/src/schema.ts`
- `packages/db/src/queries/lesson/lesson.ts`
- `packages/utils/src/validation/lesson/lesson.ts`
- `apps/api/src/routes/course/lesson.ts`
- `apps/api/src/services/lesson/lesson.ts`
- `apps/api/src/routes/course/presign.ts`
- `apps/api/src/utils/lesson-media.ts`
- `apps/dashboard/src/lib/features/course/components/lesson/video/upload-video.svelte`
- `apps/dashboard/src/lib/features/course/api/lesson.svelte.ts`
- `apps/dashboard/src/lib/features/course/components/lesson/video/video-card-utils.ts`
- `apps/dashboard/src/lib/features/ui/navigation/org-navigation.ts`
- `apps/api/src/middlewares/org-member.ts`
- `apps/api/src/middlewares/org-team-member.ts`

## Current-State Audit

Legend: ✅ available now, ⚠️ partial/manual, ❌ missing

| Capability | Availability | Current State | Effort | Should Implement |
| --- | --- | --- | --- | --- |
| Upload video to lesson | ✅ | Presigned upload + append into `lesson.videos` JSON | Low | [x] |
| Reuse uploaded video in another lesson | ⚠️ | Possible only by manually re-adding URL/key | Medium | [x] |
| Organization media library view | ❌ | No org-level media table or page | High | [x] |
| Track where media is used | ❌ | No usage relation table | High | [x] |
| Edit thumbnail/title once and propagate everywhere | ❌ | Metadata stored per lesson JSON item; no canonical media row | High | [x] |
| Export all organization media | ❌ | No inventory/export endpoint | Medium | [x] |
| Safe delete with usage checks | ❌ | Only per-lesson item delete by index | Medium | [x] |

## Goals
1. Create a canonical org-level media asset model for uploaded videos.
2. Allow attaching existing media assets to any lesson in the same organization.
3. Provide organization-level media browsing, search, filtering, and usage visibility.
4. Support global metadata updates (title, description, thumbnail) with consistent rendering in all usages.
5. Allow organization export of all media metadata and downloadable links.
6. Preserve existing lesson experience while migrating incrementally.

## Non-Goals (Initial Release)
- Full digital asset management for audio/images/documents in v1.
- Complex transcoding pipeline replacement.
- Public CDN URL permanence changes.
- Cross-organization media sharing.

## Product Scope

### Personas
- Org admin: govern all media, export, delete with safeguards.
- Tutor/team member: upload/reuse media for course authoring.
- Student: read-only playback behavior unchanged.

### Core User Stories
1. As a tutor, I can upload a video once and reuse it in multiple lessons.
2. As an admin, I can open Media Manager and see all videos in the organization.
3. As an admin, I can see all lessons/courses using a selected video.
4. As a tutor/admin, I can edit video title/thumbnail and have every usage reflect it.
5. As an admin, I can export all media metadata and download links.
6. As an admin, I can archive/delete media only when usage constraints are satisfied.

## Proposed Architecture

### Data Model (New)

#### `media_asset`
Canonical video record at organization scope.

Suggested fields:
- `id` (uuid, pk)
- `organization_id` (uuid, fk -> `organization.id`, indexed)
- `type` (`upload` now; extensible for `youtube`/`generic` in later phase)
- `storage_key` (text, unique per org)
- `source_url` (text, nullable; short-lived presigned URL not persisted as source of truth)
- `title` (text, nullable)
- `description` (text, nullable)
- `thumbnail_url` (text, nullable)
- `duration_seconds` (int, nullable)
- `aspect_ratio` (text, nullable)
- `status` (`active` | `archived`)
- `created_by_profile_id` (uuid, fk -> `profile.id`)
- `created_at`, `updated_at`

Indexes:
- `(organization_id, created_at desc)`
- `(organization_id, status)`
- `(organization_id, title)`

#### `media_usage`
Usage graph from media to learning content.

Suggested fields:
- `id` (uuid, pk)
- `organization_id` (uuid, indexed)
- `media_asset_id` (uuid, fk -> `media_asset.id`, indexed)
- `course_id` (uuid, fk -> `course.id`, indexed)
- `lesson_id` (uuid, fk -> `lesson.id`, indexed)
- `position` (int, nullable)
- `created_by_profile_id` (uuid)
- `created_at`

Constraint:
- Unique `(media_asset_id, lesson_id)` to prevent duplicate attach in one lesson.

### Backward Compatibility Strategy
- Keep `lesson.videos` during transition.
- Add `mediaAssetId?: string` to each `lesson.videos[]` item in validation/schema contract.
- For upload attachments, write both:
  - `media_asset` + `media_usage` canonical records.
  - `lesson.videos[]` representation for old clients and existing rendering.
- Read path should prefer canonical media metadata when `mediaAssetId` exists.

### API Surface (Proposed)

#### Validation (`packages/utils/src/validation/media/`)
- `ZMediaListQuery`
- `ZMediaCreateUpload` (metadata only; upload still via presign)
- `ZMediaAttachToLesson`
- `ZMediaDetachFromLesson`
- `ZMediaUpdate`
- `ZMediaDelete`
- `ZMediaUsageParams`
- `ZMediaExportQuery`

#### DB Queries (`packages/db/src/queries/media/`)
- `createMediaAsset`
- `getMediaAssetById`
- `listMediaAssetsByOrg`
- `updateMediaAsset`
- `archiveMediaAsset`
- `deleteMediaAsset`
- `createMediaUsage`
- `deleteMediaUsage`
- `listMediaUsagesByAsset`
- `countMediaUsagesByAsset`
- `listMediaAssetsForExport`

#### Services (`apps/api/src/services/media-manager/`)
- `createMediaAssetFromUploadService`
- `attachMediaToLessonService`
- `detachMediaFromLessonService`
- `updateMediaAssetService`
- `deleteMediaAssetService` (with usage guard)
- `getMediaUsageGraphService`
- `exportOrganizationMediaService`

#### Routes (`apps/api/src/routes/media-manager/`)
All routes require `authMiddleware` + `orgTeamMemberMiddleware` except export/delete which should use `orgAdminMiddleware`.

Proposed endpoints:
- `GET /organization/media`
- `POST /organization/media`
- `GET /organization/media/:mediaId`
- `PUT /organization/media/:mediaId`
- `DELETE /organization/media/:mediaId`
- `GET /organization/media/:mediaId/usage`
- `POST /organization/media/:mediaId/attach`
- `POST /organization/media/:mediaId/detach`
- `GET /organization/media/export`

## Frontend Plan

### Routes
- New org page: `apps/dashboard/src/routes/org/[slug]/media/+page.server.ts`
- New org page: `apps/dashboard/src/routes/org/[slug]/media/+page.svelte`

### Feature Module
- `apps/dashboard/src/lib/features/media-manager/`
  - `api/media-manager.svelte.ts`
  - `utils/types.ts`
  - `components/media-library.svelte`
  - `components/media-card.svelte`
  - `components/media-usage-drawer.svelte`
  - `components/edit-media-modal.svelte`
  - `components/attach-media-modal.svelte`

### Navigation
- Add org sidebar item in `apps/dashboard/src/lib/features/ui/navigation/org-navigation.ts`:
  - title key: `org_navigation.media`
  - path: `/media`

### Lesson Integration
- Replace lesson upload completion behavior:
  - create media asset first (org scope)
  - attach to current lesson
  - write `mediaAssetId` into lesson videos payload
- Add “Choose from library” tab in lesson add-video modal.
- Replace delete-by-index UX with detach behavior when media has shared usage.

## Export Design
- v1 export format: JSON manifest + signed download URLs.
- Manifest fields:
  - media id, title, type, storage key, duration, createdAt, updatedAt
  - usage count
  - usage entries: courseId/courseTitle, lessonId/lessonTitle
- Optional v2: background ZIP packaging job.

## Migration Plan

### Phase 0: Foundation (No UI changes)
1. Add new tables and queries.
2. Add media-manager services/routes.
3. Add compatibility support for `mediaAssetId` in lesson video schema.
4. Backfill script:
- scan `lesson.videos` where `type='upload'` and `key` exists
- deduplicate by `(organizationId, key)`
- create `media_asset`
- create `media_usage`
- patch lesson JSON item with `mediaAssetId`

### Phase 1: Org Media Manager UI + Reuse
1. Add org `/media` page.
2. Add list/search/filter/sort.
3. Add usage drawer.
4. Add attach-from-library flow in lesson editor.

### Phase 2: Global Editing + Export
1. Edit metadata + thumbnail modal.
2. Propagate canonical metadata in lesson cards/player UI.
3. Add org export endpoint + UI action.

### Phase 3: Hardening
1. Deletion/archival policies.
2. Usage-safe deletion confirmations.
3. Pagination/perf tuning and indexes.

## Risks and Mitigations
- Data drift between `lesson.videos` JSON and canonical tables.
  - Mitigation: service-layer write-through + reconciliation job.
- Presigned URL expiry in stored `link` fields.
  - Mitigation: treat key as source of truth; resolve fresh signed URL at read time.
- Shared asset mutation surprises course owners.
  - Mitigation: explicit UX copy: “Changes apply to all usages”.
- Backfill duplicates/missing keys.
  - Mitigation: idempotent script + reporting of skipped records.

## Success Metrics
- `% of uploaded lesson videos with mediaAssetId` >= 95% in 2 weeks.
- Median time to attach existing media to lesson < 20 seconds.
- Export success rate > 99%.
- Reduction in duplicate uploads (same key/file hash) by at least 40%.

## Open Questions
1. Should YouTube/generic links also become canonical media assets in v1, or only uploaded files?
2. Should tutors be allowed to delete shared media, or admin-only?
3. Do we need soft-delete only for first release?
4. Should export include only active assets or also archived assets?
5. Do we need per-course opt-out from global metadata sync?

## Kanban Board (Ideation Phase)

| Ticket | Title | Todo | In Progress | Verification | Done |
| --- | --- | --- | --- | --- | --- |
| MM-1 | DB: create `media_asset` and `media_usage` tables | [ ] | [ ] | [ ] | [ ] |
| MM-2 | Validation schemas for media manager APIs | [ ] | [ ] | [ ] | [ ] |
| MM-3 | DB queries for CRUD + usage graph | [ ] | [ ] | [ ] | [ ] |
| MM-4 | Service layer for attach/detach/update/delete/export | [ ] | [ ] | [ ] | [ ] |
| MM-5 | API routes under organization scope | [ ] | [ ] | [ ] | [ ] |
| MM-6 | Backfill script for existing `lesson.videos` upload entries | [ ] | [ ] | [ ] | [ ] |
| MM-7 | Dashboard feature module (`media-manager`) | [ ] | [ ] | [ ] | [ ] |
| MM-8 | Org `/media` page with list/search/filter | [ ] | [ ] | [ ] | [ ] |
| MM-9 | Usage drawer and cross-course usage visibility | [ ] | [ ] | [ ] | [ ] |
| MM-10 | Lesson “Choose from library” attach flow | [ ] | [ ] | [ ] | [ ] |
| MM-11 | Global media edit modal (title/thumbnail/description) | [ ] | [ ] | [ ] | [ ] |
| MM-12 | Export all media (manifest + signed URLs) | [ ] | [ ] | [ ] | [ ] |
| MM-13 | Permission hardening + audit logs | [ ] | [ ] | [ ] | [ ] |

## Ticket Breakdown (Backend/UI Split)

| Parent Ticket | Backend Ticket | UI Ticket |
| --- | --- | --- |
| MM-1 | MM-1-BE: schema + migration + indexes | MM-1-UI: none |
| MM-2 | MM-2-BE: zod schemas in `packages/utils` | MM-2-UI: request type wiring |
| MM-3 | MM-3-BE: media query module in `packages/db` | MM-3-UI: none |
| MM-4 | MM-4-BE: media manager services | MM-4-UI: none |
| MM-5 | MM-5-BE: routes + registration in API app | MM-5-UI: API class methods |
| MM-6 | MM-6-BE: idempotent backfill job + report | MM-6-UI: migration status view (optional) |
| MM-7 | MM-7-BE: none | MM-7-UI: feature folder + shared components |
| MM-8 | MM-8-BE: paginated list endpoint | MM-8-UI: library grid/table + filters |
| MM-9 | MM-9-BE: usage endpoint | MM-9-UI: usage drawer + deep links |
| MM-10 | MM-10-BE: attach/detach endpoints | MM-10-UI: add-video modal library tab |
| MM-11 | MM-11-BE: update endpoint + propagation contract | MM-11-UI: edit modal + optimistic update |
| MM-12 | MM-12-BE: export endpoint | MM-12-UI: export action + download UX |
| MM-13 | MM-13-BE: role checks + audit logging | MM-13-UI: permission-aware controls |

## Verification Checklist
- [ ] `pnpm --filter @cio/db build`
- [ ] `pnpm --filter @cio/utils build`
- [ ] `pnpm --filter @cio/api build`
- [ ] `pnpm --filter @cio/dashboard build`
- [ ] Backfill dry-run on staging snapshot
- [ ] Manual smoke: upload -> attach elsewhere -> edit metadata -> verify propagation
- [ ] Manual smoke: usage map accuracy for multi-course usage
- [ ] Manual smoke: export output integrity
