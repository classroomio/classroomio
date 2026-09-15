# Video Library PRD

## Status

- Draft

## Prototypes — the UX source of truth

Every screen in this PRD is drawn in `prototypes/video-library/`. **When this document and a prototype disagree on a UI detail, the prototype wins** and this document must be corrected.

```
prototypes/video-library/index.html
```

| Surface | Persona | Prototype file |
| --- | --- | --- |
| Media library with upload + publish state | Admin | `media-library.html` |
| Add video dialog (YouTube / Embed / Upload / Library / Drive) | Admin | `add-video-dialog.html` |
| Publish video panel (slug, tags, description) | Admin | `publish-video.html` |
| Landing page → Videos section editor | Admin | `settings-videos-section.html` |
| Video widget editor | Admin | `widget-editor.html` |
| Per-video analytics | Admin | `video-analytics.html` |
| Org landing page with Videos section + nav item | Public visitor | `landing-with-videos.html` |
| `/videos` index — search, tag filters, empty state | Public visitor | `public-videos-index.html` |
| `/videos/[slug]` watch page with transcript | Public visitor | `public-video-watch.html` |
| LMS → Videos tab | Learner | `lms-videos.html` |
| Embedded video widget (grid + carousel) | External site | `widget-embed.html` |

## Purpose

Let an organization publish standalone videos — release notes, feature walkthroughs, webinar replays, quick "how do I X" clips — without wrapping each one in a course. Today the only publishing path for a video is `course → lesson → video`, which is six steps of ceremony for a 90-second clip. That friction is why customer-education teams park this content in Loom, YouTube and Wistia: outside their brand, their domain, and ClassroomIO's analytics.

The reference experiences are the video libraries that sit beside a real academy — Intercom's video guides, Vimeo/Wistia channels, HubSpot Academy's lesson-length clips — plus the "resource hub" pattern already half-present in this product via `landingpage.links`.

## Problem Statement

- **No standalone publishing.** `/org/[slug]/media` lists assets but has no upload entry point at all; every asset in the table got there through a lesson editor.
- **No way to surface a video publicly.** A video reaches a visitor only inside a published course lesson. There is no shareable, indexable URL for a single video.
- **Assets are untaggable.** `tag_assignment.course_id` is `NOT NULL`, so the shipped taxonomy covers courses only. Media has kind/status filters and free-text search, nothing topical.
- **Short-form content has nowhere to live.** A 2-minute release-notes video is a bad course and a worse lesson, so it never gets made.
- **The landing page can't show video.** `landingpage` supports hero, courses, links, embed, callout, faq, footer — nothing for a curated set of videos.
- **No customer-facing video analytics.** `lesson_video_progress` only exists for enrolled learners on lessons; a marketing video has no view or watch-through signal.
- **Widgets are course-only.** `widget_course` is the only join table, so the shipped embed pipeline can't carry a video shelf.

## Confirmed Decisions

1. **A publishable video is not a new content entity.** Publishing adds columns to the existing `assets` row (`is_published`, `slug`, `published_at`, `published_by_profile_id`). The Videos surfaces are queries over `assets`, not a new CMS. Rejected: a `video` table, and modelling a one-off as a hidden single-lesson course.
2. **Both self-hosted uploads and YouTube/external videos can be published.** `assets.provider` already supports `upload | youtube | external_url | generic`.
3. **Upload is plan-gated exactly as it is in lessons; YouTube/embed/Drive/library are not.** The lesson Add-video dialog already gates the Upload tab behind `$isFreePlan` (`add-video-modal.svelte:56`, tab `value === 3`). The media-page dialog reuses that same component and therefore that same gate. No new plan-limit resource, no new billing concept; storage accounting stays as it is today.
4. **Public surface is section + index + watch page.** Landing-page Videos section (teaser) → `/videos` (searchable, tag-filterable index) → `/videos/[slug]` (watch page with transcript). The section alone would not earn its keep.
5. **Curation is a pinned ordered list plus an optional auto-fill rule.** Admin pins an ordered set; an optional rule (`tags`, `limit`) fills the remainder with the newest matching published videos. Predictable at the top, self-maintaining below.
6. **A video used inside a course lesson can be published, with explicit per-asset opt-in.** This enables preview/teaser clips from paid courses. The public HLS cookie route must therefore authorize on **the asset's own `is_published` flag**, never on course enrollment.
7. **Admin-only.** Only `ROLE.ADMIN` publishes a video, tags a video, configures the landing section, and creates tags — consistent with the shipped tags governance.
8. **`tag_assignment` is migrated to a polymorphic shape** — `(entity_type, entity_id)` replacing `course_id NOT NULL` — rather than adding a parallel `asset_tag` table. One assignment table serves courses, videos, and whatever becomes taggable next; a cross-entity question stays one query instead of a `UNION` per entity type. Done now, while `tag_assignment` has a single consumer and one table of rows to backfill. Rejected: a second join table, which is cheaper this release and more expensive at the third taggable entity.
9. **Analytics in v1 = views + watch-through**, anonymous-safe, per video, shown on the media page and in a per-video analytics panel.
10. **Learners get an LMS `Videos` nav entry**, visible to signed-in members of the org, listing the same published set. No separate members-only visibility state in v1.
11. **Videos are embeddable through the shipped widget system.** `widget` gains a `content_kind` (`course | video`) and a `widget_video` join table; the editor, versioning, publish/rollback, public payload endpoint and `@cio/embeds` runtime are all reused.
12. **The system never writes into `landingpage.navItems`.** The Videos nav entry is its own config (`landingpage.videos.navLabel`) rendered by each theme's nav. The label is org-editable copy — orgs will call it Webinars, Product Tours, or Release Notes.
13. **The Videos section is theme-agnostic.** One shared `videos.svelte` reading `--landing-*` variables, following the `embed.svelte` precedent, rather than eleven per-theme implementations.

### Assumptions made without an explicit answer (flag if wrong)

- **A1.** Publishing generates a slug from the asset title (`release-notes-march-2026`), editable before publish, unique per org. Changing the slug after publish breaks existing links; v1 warns and allows it, with no redirect table.
- **A2.** Standalone uploads count toward org storage exactly like lesson videos. No published-video count cap.
- **A3.** `document` / `image` / `audio` assets are **not** publishable in v1 — video only. The columns are on `assets`, so extending later is additive.
- **A4.** The `/videos` index and watch page live on the org public site (custom domain / tenant subdomain), not the admin app.

## Current-State Audit

Legend: ✅ available now, ⚠️ partial, ❌ missing

| Capability | State | Where it lives / what's missing |
| --- | --- | --- |
| Org-scoped canonical assets | ✅ | `assets` table — kind, provider, HLS keys, thumbnails, duration, byte size, status |
| Asset usage graph | ✅ | `asset_usages` (`target_type`, `target_id`, `slot_type`) |
| HLS upload pipeline | ✅ | `POST /organization/assets/hls/init` → `presign` → `finalize`; browser encoder in `hls-encoder.ts` |
| Signed HLS playback for anonymous visitors | ⚠️ | Exists but keyed to a **public lesson**: `POST /org-site/course/:slug/item/:itemSlug/hls-cookie`. Needs an asset-keyed sibling. |
| Media library page | ⚠️ | `/org/[slug]/media` lists, filters (kind/status/search), edits, shows usage, manages thumbnails, exports. **No upload entry point.** |
| Multi-source video picker | ✅ | `add-video-modal.svelte` — YouTube, Embed link, Upload (plan-gated), Library, Google Drive |
| Transcripts | ✅ | `media_transcripts`, `video_transcripts`, `transcript-panel.svelte` |
| Org taxonomy (tags, groups, governance) | ✅ | `tag`, `tag_group`; admin-only CRUD |
| Tagging non-course entities | ❌ | `tag_assignment.course_id NOT NULL`. Five query functions in `packages/db/src/queries/tag/tag.ts` (`getCourseIdsByTagSlugs`, `getCourseTagsForOrganization`, `getCourseTagsByCourseIdsForOrganization`, `replaceCourseTagAssignments`, `getTagGroupsWithTags`) and their callers in `services/tag.ts`, `organization.ts`, `widget-payload.ts`, `course-import.ts` are the full blast radius of migrating it |
| Landing page section system | ✅ | `organization.landingpage` jsonb: `hero`, `courses`, `links`, `embed`, `callout`, `faq`, `footer`, `navItems` |
| Theme-agnostic landing section pattern | ✅ | `embed.svelte`, `links.svelte`, `callout.svelte` + `theme-style.ts` `--landing-*` vars; 11 themes |
| Landing section editor pattern | ✅ | `features/settings/pages/landingpage-editor/*-section.svelte` |
| Public org-site routes | ⚠️ | `(org-site)/` has `/courses` and `/course/[slug]` only |
| LMS nav | ✅ | `baseNavConfig` in `lms-navigation.ts` with per-item `show()` plan gating |
| Embeddable widgets | ⚠️ | Full pipeline (editor, versions, publish/rollback, `/widgets/:publicKey/payload`, `@cio/embeds`) but **course-only** |
| Public video analytics | ❌ | `lesson_video_progress` is enrolled-learner + lesson scoped |
| Cached read aggregates | ✅ | Redis with versioned invalidation (org stats, commit `2ebb544a8`) — reuse for view counts |

## Product Goals

1. Make an admin able to get a video from their desktop (or YouTube) to a public, shareable URL in under a minute.
2. Give every published video a durable, indexable page with a transcript — the support-deflection asset.
3. Let orgs curate a Videos section on their landing page that keeps working after they stop maintaining it.
4. Keep one taxonomy across courses and videos, so a tag means the same thing everywhere.
5. Answer "which videos are working?" with views and watch-through.
6. Reuse the shipped asset, tag, landing-theme and widget systems rather than growing parallel ones.

## Non-Goals (v1)

- Progress tracking, completion, or certificates for standalone videos. If a video needs to be *completed*, it belongs in a lesson.
- Playlists, series, or ordered video sequences. That is what courses and programs are for.
- Members-only / unlisted videos. Published means visible to everyone.
- Publishing documents, images, or audio.
- Comments or reactions on videos.
- Chaptering, captions editing, or in-video CTAs.
- Slug-change redirects.
- Cross-organization video sharing.
- AI-suggested tags or auto-generated video descriptions.

## Functional Requirements

### Admin — Media library (`prototypes/video-library/media-library.html`)

Extends `/org/[slug]/media` (`features/media/pages/media.svelte`).

- **Add video** button in `Page.Header`, admin-only, opens the Add-video dialog.
- Filters gain a **Published** control (`all | published | unpublished`) beside the existing kind/status filters in `media-filters.svelte`.
- `asset-card.svelte` shows a **Published** badge with the video's tag chips, and the dropdown gains `Publish…` / `Unpublish` / `View public page` / `Analytics`.
- **States:** empty library (existing `Empty` component, now with an Add-video CTA); asset uploading (progress, disabled actions); asset processing (HLS finalize pending — publish disabled with a tooltip); unpublished; published; published-and-used-in-a-course (badge shows both, since decision 6 allows it).
- Storage cards unchanged.

### Admin — Add video dialog (`add-video-dialog.html`)

Reuses `add-video-modal.svelte` verbatim, relocated to `$features/media/components/add-video-dialog/` and imported by both the lesson editor and the media page. The lesson-specific upload store is passed in as a prop rather than imported, so the media page can supply its own.

- Tabs: YouTube link, Embed link, **Upload** (plan-gated — Zap icon and upgrade affordance on free plans, exactly as today), Library, Google Drive.
- The **Library** tab is hidden on the media page (you are already in the library).
- On success from the media page, no `asset_usages` row is created — the asset exists with zero usages. This is the definition of a "one-off" video.
- **States:** free plan (upload tab gated); upload in progress (cancel available, dialog non-dismissable); upload failed (retry); invalid YouTube URL; duplicate storage key (existing `assets_org_provider_storage_key_unique` — surface "this video is already in your library" and select it).

### Admin — Publish video (`publish-video.html`)

A dialog (or a section inside `edit-asset-dialog.svelte`) with: title, description, **slug** (prefilled from title, editable, live-validated for org uniqueness), thumbnail (reuses `manage-thumbnails-dialog.svelte`), and **tags** (multi-select grouped by `tag_group`, admin-only, with a link to tag settings when the org has no tags yet).

- Publishing an asset that has course usages shows an explicit warning: *"This video is used in N lessons. Publishing makes it viewable by anyone with the link, including people not enrolled in those courses."* Requires a confirm.
- **States:** unpublished (Publish button); published (Unpublish, Copy link, View page); slug taken; asset still processing (disabled); no tags exist in org (empty-state with a link to create them).

### Admin — Landing page Videos section (`settings-videos-section.html`)

New `videos-section.svelte` in `features/settings/pages/landingpage-editor/`, following the `links-section.svelte` shape and the `Field.Group` / `Field.Set` / `Field.Legend` form convention.

- **Show this section** switch, **Nav label** input (default translated "Videos", org-editable per decision 12), **Heading**, **Description**, **"See all" link** switch.
- **Pinned videos**: an ordered list with drag reorder and remove, plus an **Add videos** picker — a searchable dialog over published videos with tag filters. (There is deliberately no "filter by course": a video's course association is a usage, not a property, and offering it nudges admins toward publishing paid content by accident. Usage is shown as a badge inside the picker instead, so it is visible without being a filter.)
- **Auto-fill**: switch, tag multi-select, and a count. Fills the section with the newest published videos matching any selected tag, excluding already-pinned ones.
- Live preview reuses the settings-page preview path (`landing-page-components.ts` eager maps).
- **States:** section off; on with no pins and no rule (preview shows the section empty-state and the editor warns it will be hidden on the live site); pins only; rule only; both; a pinned video that was later unpublished (shown struck-through with "unpublished — will not render").

### Admin — Video analytics (`video-analytics.html`)

Per-video panel: total views, unique viewers, average watch-through %, a watch-through distribution, and views over time. Reached from the asset card dropdown. Read path is cached in Redis with versioned invalidation, mirroring the org-stats pattern.

- **States:** no views yet; fewer than N views (hide the distribution, show the count); YouTube/external provider (watch-through unavailable — show views only, with an explanatory note, since we do not control that player's timeupdate).

### Public — Landing page section and nav (`landing-with-videos.html`)

- One shared `packages/ui/src/custom/org-landing-page/videos.svelte`, wrapped in `EditableLandingSection sectionKey="videos"`, reading only `--landing-*` variables. Per-theme branches only where a theme demonstrably needs one (`terminal`, `editorial`), following `embed.svelte`.
- A shared `video-card.svelte`: thumbnail with duration overlay, title, tag chips, and a play affordance. Clicking navigates to `/videos/[slug]` — it does not open a lightbox, because the watch page is the point.
- Each theme's `nav.svelte` renders the Videos entry when `landingpage.videos.show` is true, using `videos.navLabel`, positioned after the Courses entry and before user-defined `navItems`.
- **States:** section hidden; section on but resolving to zero videos (section does not render at all, and the nav entry does not render either); 1–2 videos (grid does not stretch); many videos (capped, "See all" link to `/videos`).

### Public — `/videos` index (`public-videos-index.html`)

New `(org-site)/videos/+page.svelte`, rendered inside the org's theme chrome the same way `(org-site)/courses` is (`importThemeNavHero`).

- Search box (title + description), tag filter aside grouped by `tag_group`, sort (newest / most viewed), pagination.
- Only tag groups the admin marked public appear as filters, matching the `/courses` behavior established in the tags PRD.
- **States:** no published videos (empty state, no crawlable filter links); search with no results (clear-filters affordance); filtered; loading.

### Public — `/videos/[slug]` watch page (`public-video-watch.html`)

New `(org-site)/videos/[slug]/+page.svelte`.

- Player: `media-player.svelte` for HLS uploads (after minting the asset-keyed public HLS cookie), the YouTube/embed player for external providers.
- Below: title, description, tag chips, publish date, transcript panel (collapsible, reusing `transcript-panel.svelte`) when a transcript exists.
- Right rail / footer: related videos sharing a tag, and — when the video has course usages **and** that course is published — a "Watch the full course" card. This is derived from `asset_usages` at render time, never stored.
- Full SEO head: title, description, canonical, OG image from the thumbnail, and `VideoObject` JSON-LD with `transcript` when present.
- `ScrollToTop` per the repo convention (the transcript makes this page long).
- **States:** unpublished or unknown slug (404); external provider (no transcript, no watch-through); processing; no transcript; no related videos.

### Learner — LMS Videos tab (`lms-videos.html`)

New `(app)/lms/videos/+page.svelte` and a `baseNavConfig` entry in `lms-navigation.ts` (`titleKey: 'lms_navigation.videos'`, `path: '/videos'`, `matchPattern: '^/lms/videos(/.*)?$'`).

- Same list UI as `/videos`, inside LMS chrome. Playback navigates to the public watch page in the same tab.
- `show()` returns false when the org has no published videos, so the nav entry does not appear for orgs not using the feature.

### Embeddable — Video widget (`widget-editor.html`, `widget-embed.html`)

- `/org/[slug]/widgets` gains a content-kind choice at creation: **Courses** or **Videos**. Existing widgets are `course` by default.
- The video widget editor mirrors the course one: left panel `Select Videos` / `Widgets` (layout) / `Design`; local iframe preview; save/discard; publish/rollback.
- Layouts for v1: `card_grid`, `carousel`, `compact_list`, `tag_filter`, and a new `featured_video`.
- Clicking a video in an embed opens the public watch page in a new tab.
- **States:** draft with no videos selected; unpublished changes; published; a selected video later unpublished (dropped from the payload on next publish, flagged in the editor).

## Technical Design

### Data model

Additive columns on the shipped `assets` table — no migration of existing rows beyond defaults:

```ts
// packages/db/src/schema.ts — added to `asset`
isPublished: boolean('is_published').default(false).notNull(),
slug: text(),
publishedAt: timestamp('published_at', { withTimezone: true, mode: 'string' }),
publishedByProfileId: uuid('published_by_profile_id'),

// added to the table's index/constraint list
uniqueIndex('assets_org_slug_unique').on(table.organizationId, table.slug).where(sql`slug is not null`),
index('idx_assets_org_published').on(table.organizationId, table.isPublished, table.publishedAt),
foreignKey({
  columns: [table.publishedByProfileId],
  foreignColumns: [profile.id],
  name: 'assets_published_by_profile_id_fkey'
}).onDelete('set null')
```

Tagging — `tag_assignment` becomes polymorphic. This is a change to a shipped table, so it runs as one migration with a backfill:

```sql
-- 1. widen
ALTER TABLE tag_assignment ADD COLUMN entity_type varchar;
ALTER TABLE tag_assignment ADD COLUMN entity_id uuid;

-- 2. backfill every existing row as a course assignment
UPDATE tag_assignment SET entity_type = 'course', entity_id = course_id WHERE entity_id IS NULL;

-- 3. lock it down
ALTER TABLE tag_assignment ALTER COLUMN entity_type SET NOT NULL;
ALTER TABLE tag_assignment ALTER COLUMN entity_id SET NOT NULL;
ALTER TABLE tag_assignment DROP CONSTRAINT tag_assignment_tag_course_key;
ALTER TABLE tag_assignment DROP CONSTRAINT tag_assignment_course_id_fkey;
ALTER TABLE tag_assignment DROP COLUMN course_id;
CREATE UNIQUE INDEX tag_assignment_tag_entity_key ON tag_assignment (tag_id, entity_type, entity_id);
CREATE INDEX idx_tag_assignment_entity ON tag_assignment (entity_type, entity_id);
```

`entity_type` is a `varchar`, not a `pgEnum`. Adding `'program'` or `'cohort'` later should be a code change, not an `ALTER TYPE` — the same choice `assets.kind` and `assets.provider` already make. The allowed values are constrained in Zod (`ZTagEntityType`), so the discriminator is still typed everywhere it matters.

```ts
// packages/db/src/schema.ts — tagAssignment, after the migration
export const tagAssignment = pgTable(
  'tag_assignment',
  {
    id: uuid().default(sql`gen_random_uuid()`).primaryKey().notNull(),
    tagId: uuid('tag_id').notNull(),
    entityType: varchar('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .default(sql`timezone('utc'::text, now())`)
      .notNull()
  },
  (table) => [
    foreignKey({ columns: [table.tagId], foreignColumns: [tag.id], name: 'tag_assignment_tag_id_fkey' }).onDelete('cascade'),
    index('idx_tag_assignment_tag_id').on(table.tagId),
    index('idx_tag_assignment_entity').on(table.entityType, table.entityId),
    unique('tag_assignment_tag_entity_key').on(table.tagId, table.entityType, table.entityId)
  ]
);
```

**`entity_id` carries no foreign key**, because it points at two different tables. Referential integrity therefore moves into the query layer:

- `deleteTagAssignmentsForEntity(entityType, entityId)` is called from course deletion and asset deletion, so rows never orphan.
- A weekly `jobs` sweep deletes assignments whose `entity_id` no longer resolves, as a backstop for any path that forgets. Orphan count is logged so a forgotten call site is visible rather than silent.
- Deleting a `tag` still cascades, because `tag_id` keeps its foreign key.

This is the one real cost of the polymorphic shape and it must not be skipped — `ON DELETE CASCADE` was doing this work for courses before the migration.

**Every existing tag query is rewritten to take an entity discriminator**, and the course-specific helpers become thin wrappers so their five call sites keep compiling:

| Existing function | After |
| --- | --- |
| `getCourseIdsByTagSlugs(orgId, tagSlugs)` | `getEntityIdsByTagSlugs(orgId, 'course', tagSlugs)` |
| `getCourseTagsForOrganization(orgId, courseId)` | `getTagsForEntity(orgId, 'course', courseId)` |
| `getCourseTagsByCourseIdsForOrganization(orgId, courseIds)` | `getTagsForEntities(orgId, 'course', entityIds)` |
| `replaceCourseTagAssignments(courseId, tagIds, tx)` | `replaceTagAssignments('course', entityId, tagIds, tx)` |
| `getTagGroupsWithTags(orgId, …)` | unchanged signature; its assignment-count join gains an `entity_type` filter so course counts stay course counts |

`packages/db/src/relations.ts` loses the `tagAssignment → course` relation (a polymorphic column cannot express one) and `packages/db/src/types.ts` picks up the new inferred types. `apps/db-agent/src/lib/database-context.ts` line 116 documents tags as course-only and must be updated.

Landing-section curation. **Relational ids never go in jsonb**, so pins and auto-fill tags are real tables; the jsonb block holds only copy and toggles:

```ts
export const orgVideoSectionPin = pgTable(
  'org_video_section_pin',
  {
    id: uuid().default(sql`gen_random_uuid()`).primaryKey().notNull(),
    organizationId: uuid('organization_id').notNull(),
    assetId: uuid('asset_id').notNull(),
    position: integer().default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({ columns: [table.organizationId], foreignColumns: [organization.id], name: 'org_video_section_pin_organization_id_fkey' }).onDelete('cascade'),
    foreignKey({ columns: [table.assetId], foreignColumns: [asset.id], name: 'org_video_section_pin_asset_id_fkey' }).onDelete('cascade'),
    index('idx_org_video_section_pin_org').on(table.organizationId, table.position),
    unique('org_video_section_pin_org_asset_key').on(table.organizationId, table.assetId)
  ]
);

export const orgVideoSectionTag = pgTable(
  'org_video_section_tag',
  {
    id: uuid().default(sql`gen_random_uuid()`).primaryKey().notNull(),
    organizationId: uuid('organization_id').notNull(),
    tagId: uuid('tag_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({ columns: [table.organizationId], foreignColumns: [organization.id], name: 'org_video_section_tag_organization_id_fkey' }).onDelete('cascade'),
    foreignKey({ columns: [table.tagId], foreignColumns: [tag.id], name: 'org_video_section_tag_tag_id_fkey' }).onDelete('cascade'),
    unique('org_video_section_tag_org_tag_key').on(table.organizationId, table.tagId)
  ]
);
```

```ts
// organization.landingpage jsonb — copy and toggles only, no ids
videos?: {
  show: boolean;
  navLabel: string;
  heading: string;
  description?: string;
  showAllLink: boolean;
  autoFill: { enabled: boolean; limit: number };
};
```

Analytics. Anonymous-safe, one row per viewing session per video. `duration_seconds` already lives on `assets` and watch-through % is derived at read time — **never stored**:

```ts
export const assetViewSession = pgTable(
  'asset_view_session',
  {
    id: uuid().default(sql`gen_random_uuid()`).primaryKey().notNull(),
    organizationId: uuid('organization_id').notNull(),
    assetId: uuid('asset_id').notNull(),
    /** Anonymous first-party session id; null profile means not signed in. */
    sessionKey: text('session_key').notNull(),
    profileId: uuid('profile_id'),
    watchedSeconds: integer('watched_seconds').default(0).notNull(),
    referrer: text(),
    countryCode: varchar('country_code', { length: 2 }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({ columns: [table.organizationId], foreignColumns: [organization.id], name: 'asset_view_session_organization_id_fkey' }).onDelete('cascade'),
    foreignKey({ columns: [table.assetId], foreignColumns: [asset.id], name: 'asset_view_session_asset_id_fkey' }).onDelete('cascade'),
    foreignKey({ columns: [table.profileId], foreignColumns: [profile.id], name: 'asset_view_session_profile_id_fkey' }).onDelete('set null'),
    index('idx_asset_view_session_asset_created').on(table.assetId, table.createdAt),
    unique('asset_view_session_asset_session_key').on(table.assetId, table.sessionKey)
  ]
);
```

Widget extension:

```ts
export const widgetContentKind = pgEnum('WIDGET_CONTENT_KIND', ['course', 'video']);
// widget: contentKind: widgetContentKind('content_kind').default('course').notNull()
// widgetLayoutType: add 'featured_video'

export const widgetVideo = pgTable(
  'widget_video',
  {
    id: uuid().default(sql`gen_random_uuid()`).primaryKey().notNull(),
    widgetId: uuid('widget_id').notNull(),
    assetId: uuid('asset_id').notNull(),
    order: integer().default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({ columns: [table.widgetId], foreignColumns: [widget.id], name: 'widget_video_widget_id_fkey' }).onDelete('cascade'),
    foreignKey({ columns: [table.assetId], foreignColumns: [asset.id], name: 'widget_video_asset_id_fkey' }).onDelete('cascade'),
    index('idx_widget_video_widget_id').on(table.widgetId),
    unique('widget_video_widget_asset_key').on(table.widgetId, table.assetId)
  ]
);
```

### Core logic

**Resolving the landing section's video list** (pins first, then auto-fill, never duplicated):

```
resolveVideoSection(orgId):
  config = org.landingpage.videos
  if not config?.show: return null

  pinnedAssetIds = orgVideoSectionPin rows for orgId, ordered by position
  pinned = published video assets in pinnedAssetIds, preserving pin order

  filled = []
  if config.autoFill.enabled:
    tagIds = orgVideoSectionTag rows for orgId
    remaining = config.autoFill.limit - pinned.length
    if remaining > 0:
      filled = published video assets for orgId
               having any tag in tagIds (or any tag when tagIds is empty)
               excluding pinnedAssetIds
               ordered by published_at desc
               limit remaining

  videos = pinned ++ filled
  if videos is empty: return null   // section and nav entry both hide
  return { config, videos }
```

**Public HLS authorization** — authorize on the asset, not on enrollment:

```
issuePublicVideoHlsCookie(orgSiteName, slug):
  org   = organization by siteName or customDomain
  asset = assets where organization_id = org.id and slug = slug
  if not asset: throw AppError NOT_FOUND 404
  if not asset.isPublished: throw AppError FORBIDDEN 403     // the whole paywall guard
  if not asset.hlsManifestKey: throw AppError BAD_REQUEST 400
  return signHlsCookie(asset.id)
```

This is deliberately independent of `asset_usages`. A video used in a paid lesson is streamable publicly **only** because an admin flipped `is_published` on it, and unpublishing revokes that immediately — cookies are 15-minute HMAC tokens, so the blast radius of a revoke is one cookie lifetime.

**Watch-through recording** — one upsert per session, monotonic:

```
recordProgress(slug, sessionKey, watchedSeconds):
  asset = published asset by org + slug           // 403 if unpublished
  clamped = min(watchedSeconds, asset.durationSeconds or watchedSeconds)
  upsert asset_view_session on (asset_id, session_key):
    insert  -> watched_seconds = clamped
    conflict-> watched_seconds = greatest(existing, clamped), updated_at = now()
  bump the org's video-analytics Redis version key
```

Percent watched is computed at read time as `watched_seconds / assets.duration_seconds`. Heartbeat every 10s and on `pagehide`; throttled server-side per session.

### API routes

Mounted per the single-root-segment rule: asset routes extend the existing `organization/assets` router; public routes are composed into `routes/org-site/index.ts`.

| Method | Path | Auth | Returns |
| --- | --- | --- | --- |
| GET | `/organization/assets` | admin/member | existing list, gains `published` + `tagIds` query params |
| POST | `/organization/assets/:assetId/publish` | admin | the published asset (slug, publishedAt) |
| POST | `/organization/assets/:assetId/unpublish` | admin | the asset |
| GET | `/organization/assets/slug-available` | admin | `{ available: boolean }` |
| PUT | `/organization/assets/:assetId/tags` | admin | the asset's tag list (full replace) |
| GET | `/organization/assets/:assetId/analytics` | admin | views, unique viewers, avg watch-through, distribution, timeseries |
| GET | `/organization/videos/section` | admin | section config + resolved pins + auto-fill tags |
| PUT | `/organization/videos/section` | admin | the saved section config |
| GET | `/org-site/videos` | public | paginated published videos + public tag facets |
| GET | `/org-site/videos/:slug` | public | one video + transcript + related + course usage |
| POST | `/org-site/videos/:slug/hls-cookie` | public | `{ expiresAt }`, sets `cio_hls` |
| POST | `/org-site/videos/:slug/view` | public | `{ sessionKey }` |
| PUT | `/org-site/videos/:slug/progress` | public | `{ ok: true }` |
| GET | `/widgets/:publicKey/payload` | public | existing route; payload gains the video shape |

Every route returns a single type. `/org-site/videos/:slug` returns one shape whose optional fields (`transcript`, `courseUsage`) are nullable rather than a union.

### Layering

Following the repo's validation → queries → services → routes → feature types → API class order.

| Layer | Files |
| --- | --- |
| Validation | `packages/utils/src/validation/tag/tag.ts` (`ZTagEntityType`), `packages/utils/src/validation/assets/publish.ts` (`ZAssetPublish`, `ZAssetTagsUpdate`, `ZAssetSlugQuery`), `packages/utils/src/validation/video-section/video-section.ts` (`ZVideoSectionUpdate`), `packages/utils/src/validation/org-site/videos.ts` (`ZPublicVideoListQuery`, `ZPublicVideoBySlugParam`, `ZPublicVideoProgress`) |
| Queries | `packages/db/src/queries/assets/assets.ts` (publish/unpublish, slug lookup, published list), `.../assets/asset-analytics.ts`, **rewritten** `packages/db/src/queries/tag/tag.ts` (polymorphic assignments + `deleteTagAssignmentsForEntity`), `packages/db/src/queries/organization/video-section.ts`, `packages/db/src/queries/widget/widget-video.ts` |
| Services | `apps/api/src/services/assets/publish.ts`, `.../assets/analytics.ts`, `apps/api/src/services/org/video-section.ts`, `apps/api/src/services/org-site/videos.ts`, extend `apps/api/src/services/widget-payload.ts` |
| Routes | extend `apps/api/src/routes/organization/assets.ts`; new `apps/api/src/routes/organization/videos.ts`; new `apps/api/src/routes/org-site/videos.ts` composed in `routes/org-site/index.ts` |
| Frontend types | `apps/dashboard/src/lib/features/media/utils/types.ts`, `.../features/settings/utils/types.ts`, `.../features/org/utils/types.ts` — all inferred from the RPC client, never from `@cio/db/queries` |
| Frontend API | extend `features/media/api/media-manager.svelte.ts`; new `features/settings/api/video-section.svelte.ts` |
| UI package | `packages/ui/src/custom/org-landing-page/videos.svelte`, `video-card.svelte` (+ `ui:`-prefixed classes, `--landing-*` colors, Storybook stories in `packages/storybook/src/templates/org-landing-page/`), nav branches in the 11 theme `nav.svelte` files |
| Public routes | `(org-site)/videos/+page.{svelte,ts,server.ts}`, `(org-site)/videos/[slug]/+page.{svelte,ts,server.ts}` |
| LMS | `(app)/lms/videos/+page.svelte`, entry in `features/ui/navigation/lms-navigation.ts` |
| Embeds | `apps/embeds/src/widgets/video-widget/`, wired into `apps/embeds/scripts/upload-embeds.ts` |

All copy goes through `apps/dashboard/src/lib/utils/translations/en.json` (`$t` in markup, `t.get` in plain functions); the UI package takes strings via a `labels` prop and never owns copy.

## Implementation Order

Each phase is shippable and leaves the product working.

**Phase 1 — Standalone upload (no public surface).**
1. Relocate `add-video-modal.svelte` to `$features/media/components/add-video-dialog/`, taking the upload store as a prop; update the lesson editor import. No behavior change, plan gate intact.
2. Add the **Add video** button to the media page; wire the dialog so success creates an asset with no `asset_usages` row.
3. Verify: `pnpm --filter @cio/dashboard^... build && pnpm --filter @cio/dashboard build`

**Phase 2 — Tagging.** The `tag_assignment` migration lands and is verified against course tagging *before* any video tagging is wired up, so a regression is attributable to one step.

4. Migrate `tag_assignment` to `(entity_type, entity_id)`: add columns → backfill existing rows as `entity_type = 'course'` → set `NOT NULL`, drop `course_id`, its FK and the old unique constraint, add the new unique index and entity index. Update `packages/db/src/schema.ts`, `relations.ts` and `types.ts`.
5. Rewrite the five tag queries to take an entity discriminator (`getEntityIdsByTagSlugs`, `getTagsForEntity`, `getTagsForEntities`, `replaceTagAssignments`, plus the `entity_type` filter on `getTagGroupsWithTags`' count join). Add `deleteTagAssignmentsForEntity` and call it from course deletion and asset deletion. Update the call sites in `services/tag.ts`, `services/organization.ts`, `services/widget-payload.ts` and `services/course-import/course-import.ts`.
6. **Regression gate — course tagging must be untouched from the outside:** assign/remove course tags, `/courses` public tag filtering, the org courses page tag filter, tag group counts in tag settings, a course widget carrying tags, and course-import tag round-trip. Delete a course and confirm its assignments are gone.
7. Add the weekly orphan sweep in `apps/jobs` and log the orphan count.
8. Now the video side: `PUT /organization/assets/:assetId/tags`, `tagIds` filter on the asset list route.
9. Tag multi-select in `edit-asset-dialog.svelte`, tag chips on `asset-card.svelte`, tag filter in `media-filters.svelte`.
10. Update `apps/db-agent/src/lib/database-context.ts` line 116, which currently documents tags as course-only.
11. Verify: `pnpm --filter @cio/api^... build && pnpm --filter @cio/api build`

**Phase 3 — Publishing and public pages.**
12. `assets` publish columns + indexes; publish/unpublish/slug-availability queries, services and routes.
13. Publish panel UI with the course-usage warning.
14. `POST /org-site/videos/:slug/hls-cookie` authorizing on `is_published`.
15. `(org-site)/videos` index and `(org-site)/videos/[slug]` watch page, inside theme chrome, with transcript, related videos, SEO head, JSON-LD, and `ScrollToTop`.
16. Verify both builds.

**Phase 4 — Landing section and nav.**
17. `org_video_section_pin` / `org_video_section_tag` tables + `landingpage.videos` type; `resolveVideoSection`; `GET`/`PUT /organization/videos/section`.
18. `packages/ui` `videos.svelte` + `video-card.svelte` + Storybook stories; nav entry in all 11 theme navs; `pnpm --filter @cio/ui prefix` then `pnpm --filter @cio/ui build`.
19. `videos-section.svelte` editor with pin picker, drag reorder and auto-fill rule; register in the landing editor and both preview maps.
20. Verify: dashboard build + `npx --no-install svelte-check --workspace=packages/ui --no-tsconfig`

**Phase 5 — Analytics.**
21. `asset_view_session` table; view/progress public routes with throttling; analytics query with Redis versioned caching.
22. Player instrumentation on the watch page; per-video analytics panel.
23. Verify both builds.

**Phase 6 — LMS tab.**
24. `(app)/lms/videos` page + `baseNavConfig` entry with a `show()` that hides it when the org has no published videos.

**Phase 7 — Video widget.**
25. `WIDGET_CONTENT_KIND` enum, `widget.content_kind`, `widget_video`, `featured_video` layout; extend widget queries, services and payload computation.
26. Content-kind choice at widget creation; video variant of the editor's Select panel.
27. `apps/embeds/src/widgets/video-widget/` runtime + build/upload plumbing.
28. Verify: api build, dashboard build, embeds build.

**Every phase:** `cd apps/dashboard && pnpm translate` after touching `en.json` (checking `{}` placeholders survived), then `pnpm format:changed` and `pnpm format:check`.

## Acceptance Criteria

1. An admin can upload a video from `/org/[slug]/media` without creating a course or lesson, and the resulting asset has zero `asset_usages` rows.
2. On a free plan the Upload tab in the media Add-video dialog is gated exactly as it is in the lesson editor, while YouTube, Embed link and Google Drive remain usable.
3. An admin can assign and remove org tags on a video, and filter the media library by tag; non-admins cannot create tags. Courses and videos draw from the same `tag` / `tag_group` taxonomy through one `tag_assignment` table.
4. Publishing a video produces a unique per-org slug, and `/videos/[slug]` renders it on the org's public site with title, description, tags, thumbnail, OG tags and `VideoObject` JSON-LD.
5. An unpublished (or never-published) slug returns 404, and `POST /org-site/videos/:slug/hls-cookie` returns 403 for an unpublished asset — **including** an asset that is used by a published course lesson.
6. Publishing a video that has course usages requires an explicit confirmation naming the number of lessons affected.
7. Unpublishing a video removes it from the landing section, `/videos`, the LMS tab, and every widget payload on next publish, and new HLS cookies are refused immediately.
8. `/videos` supports title/description search, tag filtering limited to public tag groups, sorting, and pagination, with a distinct empty state and a distinct no-results state.
9. The landing Videos section renders correctly in all 11 themes in light and dark, using only `--landing-*` colors, and its cards link to the watch page.
10. The Videos nav entry appears in every theme's nav when enabled, uses the org's configured label, and **`landingpage.navItems` is never written to by the system**.
11. With the section enabled but resolving to zero videos, neither the section nor the nav entry renders.
12. Pinned order is respected exactly; auto-fill appends newest-first matching videos and never duplicates a pinned one.
13. A per-video analytics panel reports views, unique viewers and average watch-through for uploaded videos; for YouTube/external providers it reports views and explains that watch-through is unavailable.
14. Watch-through is derived from `watched_seconds / assets.duration_seconds` at read time; no percentage is persisted.
15. Signed-in org members see a Videos entry in the LMS nav when the org has at least one published video, and it is absent otherwise.
16. An admin can create, preview, publish and roll back a video widget, and the published embed renders on an external page via `@cio/embeds`.
17. All new user-facing copy resolves from translation keys in `en.json` with every locale file updated and `{}` placeholders preserved.
18. **The `tag_assignment` migration is invisible from the outside.** After it runs: every pre-existing assignment survives as `entity_type = 'course'` with the same `tag_id` and the same course, row counts match before and after, course tag assign/remove works, `/courses` public tag filtering returns the same courses for the same tag slugs, the org courses page tag filter is unchanged, tag group counts in tag settings are unchanged, a published course widget still carries its tags, and course-import round-trips tags.
19. **No orphaned assignments.** Deleting a course removes its tag assignments; deleting an asset removes its tag assignments; deleting a tag still removes all of its assignments. The weekly sweep reports zero orphans on a healthy database and logs a non-zero count rather than failing silently.
20. **Zero regression elsewhere:** existing lesson video add/upload/library flows, `asset_usages` behavior, the media library's kind/status/search filters, every existing landing theme and section, and every existing course widget behave exactly as before.
21. `pnpm format:check`, the api build and the dashboard build all pass.

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| **Paid course content leaks publicly.** Someone publishes a lesson video without realizing it becomes streamable by anyone. | Authorization is on `assets.is_published` alone, never enrollment. Publish requires an explicit confirmation that counts the affected lessons. The media card badges "Published + in N courses". Unpublish revokes within one 15-minute cookie lifetime. |
| **Videos become a second content primitive** and drift toward playlists, completion and certificates. | v1 explicitly non-goals progress, completion, playlists and series. The model is an asset flag, not an entity — there is no table to hang a lifecycle on. If a video must be *completed*, the product answer is a lesson, and the docs must say so. |
| **Eleven themes × one new section = visual regressions.** | One shared theme-agnostic component reading `--landing-*` only, per the `embed.svelte` precedent; Storybook stories for every theme; the prototype locks the design before any Svelte is written; `pnpm --filter @cio/ui prefix:check` in CI. |
| **Curated sections rot.** Admin pins three videos and never returns. | Auto-fill by tag is in v1, not deferred. Unpublished pins are surfaced struck-through in the editor rather than silently dropped. |
| **Migrating a shipped `tag_assignment` breaks course tagging.** Five query functions and call sites in four services touch it, and course tags appear on `/courses`, the org courses page, tag settings counts, course widgets and course import. | The migration is additive-then-narrowing (add columns → backfill → drop `course_id`), so the intermediate state is valid. Phase 2 lands and verifies it against course tagging **before** any video tagging is wired up, behind an explicit regression gate (acceptance criterion 18), so a failure is attributable to one step. Course-specific helpers survive as thin wrappers, so unrelated call sites keep compiling. |
| **`entity_id` has no foreign key**, so a deleted course or asset can orphan its tag assignments — work `ON DELETE CASCADE` used to do for free. | `deleteTagAssignmentsForEntity` is called from course deletion and asset deletion; `tag_id` keeps its FK so tag deletion still cascades; a weekly `jobs` sweep deletes unresolvable rows and **logs the count**, so a forgotten call site surfaces as a number instead of silent drift. Acceptance criterion 19 tests all three paths. |
| **Slug changes break shared links.** | Slug is prefilled and editable *before* publish; editing after publish warns explicitly. Redirects are a named non-goal, so the warning must be blunt. |
| **Anonymous progress heartbeats become an abuse vector.** | `sessionKey` is a first-party random id; `watched_seconds` is clamped to the asset's duration and only ever increases via `greatest()`; the unique `(asset_id, session_key)` constraint means one row per session; per-session server-side throttling. |
| **`/videos` becomes a slow page on large libraries.** | Index on `(organization_id, is_published, published_at)`; tag facets and view aggregates read through Redis with versioned invalidation (the org-stats pattern); pagination from the first release. |
| **Widget payload divergence.** Two content kinds in one versioned payload shape. | `content_kind` is discriminated in the payload and validated in `packages/utils/src/validation/widget`; existing course widgets default to `course` and their payload shape is unchanged; the video runtime is a separate entry in `apps/embeds` so a video-widget bug cannot break shipped course widgets. |
| **"Videos" is the wrong word for most orgs.** | The nav label, section heading and description are all org-editable copy from day one; the default is a translation key, not a hardcoded string. |
| **The feature ships as marketing garnish** and never earns the customer-education claim. | The watch page — indexable URL plus transcript — is in the same release as the section, not deferred. Acceptance criteria 4 and 13 make SEO metadata and analytics non-optional. |
