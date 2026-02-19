# Backfill Script Spec: Lesson Media -> Assets

## Goal
Migrate existing lesson media JSON (`lesson.videos` and `lesson.documents`) into canonical `assets` and `asset_usages`.

This backfill is **not video-only**. It handles:
- uploaded media (`provider='upload'`)
- external links (`youtube`, `generic`, `external_url`)
- inferred asset kinds (`video`, `document`, `image`, `audio`, `other`)

Usage rows are created with:
- `target_type='lesson'`
- `slot_type='lesson_video'` for `lesson.videos`
- `slot_type='lesson_document'` for `lesson.documents`

## Script Location
- `packages/db/src/scripts/backfill-lesson-assets.ts`

## Script Command
- `packages/db/package.json`
  - `"db:assets-backfill": "tsx src/scripts/backfill-lesson-assets.ts"`

## Scope
Include lesson media where:
- `lesson.videos[]` entries can be normalized to known provider + key/link
- `lesson.documents[]` entries can be normalized to key/link

Skip and report records where:
- media item is malformed
- key/link requirements are missing
- media type/provider cannot be resolved
- lesson has missing org/course linkage

## Canonical Mapping

### From `lesson.videos[]`
- Provider mapping:
  - `upload` -> `provider='upload'`
  - `youtube` -> `provider='youtube'`
  - `generic` -> `provider='generic'`
- `storage_key` from `video.key` for uploaded items
- `source_url` from `video.link`
- `mime_type` inferred from metadata or filename/url
- `kind` inferred from `mime_type`; fallback to `video`

### From `lesson.documents[]`
- Provider mapping:
  - with `key` -> `provider='upload'`
  - without `key` and with link -> `provider='external_url'`
- `storage_key` from `document.key`
- `source_url` from `document.link`
- `mime_type` inferred from explicit type, metadata, filename, or url extension
- `kind` inferred from `mime_type`; fallback to `document`

### Common Fields
For each created/reused asset:
- `organization_id`
- `kind`
- `provider`
- `storage_provider` (`s3` for upload, `external` for external)
- `storage_key`
- `source_url`
- `mime_type`
- `byte_size`
- `title`
- `description`
- `thumbnail_url`
- `duration_seconds`
- `aspect_ratio`
- `is_external`
- `status='active'`
- `metadata`

## Idempotency Rules
1. Reuse by existing `assetId` first (if valid for org + natural key match).
2. Fallback natural-key reuse:
- upload: `(organization_id, provider='upload', storage_key)`
- external: `(organization_id, provider, source_url, kind, is_external=true)`
3. Usage uniqueness:
- `(asset_id, target_type, target_id, slot_type, slot_key, position)`
4. Re-running script must not create duplicate assets/usages.
5. Lesson payload patch only updates `assetId` when missing or stale.

## Dry-Run Mode
- Default behavior is dry-run unless `--execute` is provided.
- Dry-run performs reads and decisioning but does not write.
- Outputs summary counters and sample rows.

## Write Mode Behavior
For each qualifying lesson media item:
1. Resolve organization id from lesson -> course -> group.
2. Resolve or create canonical asset.
3. Resolve or create canonical usage row with lesson target and slot metadata.
4. Patch lesson JSON item with canonical `assetId`.

Patch behavior:
- preserve existing content payload shape
- only mutate `assetId` field where needed

## Handling Missing Historical Size
Historical rows may not include file size.

Policy:
- Write `byte_size=null` when unknown.
- Track `assetsMissingByteSize` in summary output.
- Follow up later with optional size hydration job.

## Performance
- Batch lessons (`limit/offset` with configurable batch size).
- Use per-lesson transaction in execute mode.
- Log progress every processed batch.

## Suggested Output Summary
- `lessonsScanned`
- `mediaItemsScanned`
- `mediaItemsEligible`
- `assetsCreated`
- `assetsReused`
- `usagesCreated`
- `usagesReused`
- `lessonItemsPatchedWithAssetId`
- `assetsWithByteSize`
- `assetsMissingByteSize`
- `skippedMalformed`
- `skippedMissingKey`
- `skippedMissingLink`
- `skippedUnsupportedType`
- `errors`

## Safety
- Default dry-run.
- Require `--execute` for writes.
- Exit non-zero on unhandled failures.

## Verification
1. Run dry-run on staging snapshot and inspect summary/sample rows.
2. Run execute mode.
3. Validate:
- expected assets/usages were created or reused
- no uniqueness regressions
- `assetId` patching present in lesson payloads
- supported kinds include non-video where applicable
4. Re-run execute mode and confirm near-zero new writes.
