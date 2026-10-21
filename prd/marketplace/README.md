# Discover Marketplace PRD

## Status

- Draft

## Prototypes — the UX source of truth

The UX for this feature lives in the prototype folder. When this document and a prototype disagree on a UI detail (layout, copy, states, ordering), **the prototype wins** and this document should be updated to match.

Start page:

```
prototypes/marketplace/index.html
```

| Surface | Persona | Files |
| --- | --- | --- |
| Discover home (featured collections, categories, popular) | Public visitor | `discover.html` |
| Browse / search results (filters, sort, empty state) | Public visitor | `discover-browse.html` |
| Course template listing | Public visitor | `listing-course.html` |
| Image pack / doc / AI skill listing | Public visitor | `listing-other.html` |
| Publisher profile | Public visitor | `publisher.html` |
| Import into my org (org picker, limit reached, no admin org, success) | Org admin | `import.html` |
| Org marketplace page (my listings, statuses, stats) | Org admin (publisher) | `marketplace-listings.html` |
| Publish / submit update dialog | Org admin (publisher) | `publish.html` |
| Imported template (credit banner, rate & review) | Org admin (importer) | `imported-template.html` |
| AI skills library | Org admin | `ai-skills.html` |
| Review queue + collections | ClassroomIO platform admin | `review-queue.html` |

## Purpose

Give ClassroomIO a public marketplace at `classroomio.com/discover` where organizations publish reusable building blocks — course templates, course images, docs, and AI course-creation skills — and other organizations browse and import them for free. The reference experience is a template gallery (Notion templates, Figma Community): open, SEO-indexed browsing, a strong listing page, one-click "use this" that lands a copy in your own workspace, and a publisher profile that credits the author.

## Problem Statement

- Every new ClassroomIO org starts from a blank course. There is no library of proven course structures to start from.
- Orgs that build great onboarding, compliance, or product courses have no way to share them outside their org, and no credit or distribution for doing so.
- Course templates (see `prd/course-templates/README.md`) are org-scoped; there is no path for a template to travel between orgs.
- Course covers are a common blocker; teachers either skip them or leave to find stock images.
- Docs (PR #699) and future AI skills are reusable knowledge with no sharing surface.
- `classroomio.com` has no dynamic, indexable content that demonstrates what is built on ClassroomIO.

## Confirmed Decisions

1. **Import, not enroll.** `/discover` is creator-to-creator. A visitor picks a listing and an org admin imports a copy into their org. Learners never enroll from `/discover`.
2. **Free only in v1.** No prices, payouts, or revenue share. Paid listings are a later PRD.
3. **Any org can publish; every listing is reviewed.** Listings (and each update to a listing) go live only after a ClassroomIO platform admin approves them.
4. **Four listing types in v1:** course templates, image packs, docs, AI skills.
5. **Imports are one-time copies.** No link back to the publisher's content and no sync. (Template sync is an in-org feature of course templates, not of the marketplace.)
6. **AI skills are instruction packs.** A skill is a named markdown instruction file that tells the course AI how to build a kind of course. v1 ships publish, browse, and install into the org's AI skills library; running skills lands with AI skills support.
7. **Publisher profile + license.** Each publishing org gets a public profile on `/discover`. Each listing picks a license. Imported items keep a "From ‹Org› on ClassroomIO" credit, derived at render time from the import record.
8. **Browse open, import signed in.** `/discover` is public and SEO-indexed. "Use this" sends the visitor to sign in / sign up on the dashboard, then pick which org to import into. Only org admins can import.
9. **Template in, template out.** Only course templates can be published as course listings (not live courses). An import lands in the importer's templates (the courses page template row and the gallery's Your templates section) and counts toward the plan's template limit (free plan: 1).
10. **Discovery v1:** search + fixed categories, import counts ("Used by N orgs") with popularity sort, ratings & reviews, and staff-curated featured collections.
11. **Unpublish leaves imports untouched.** Unpublishing or deleting a listing removes its public page; existing imported copies stay.
12. **Admins only.** Publishing, importing, and reviewing on behalf of an org require the org ADMIN role (same rule as template clone/convert/sync).

## Current-State Audit

| Capability | Current state | Notes |
| --- | --- | --- |
| Course templates | PRD only (`prd/course-templates/README.md`), not built | Hard dependency. Templates are `course` rows with `is_template = true` (see `prd/course-templates/README.md`). |
| Course clone | `apps/api/src/services/course/clone.ts` — deep copy, accepts `organizationId` | Copies `metadata` (incl. `reviews`, `instructor`), `cost`, `isPublished`, `teacherId`, media URLs verbatim. Marketplace needs a sanitizing wrapper. |
| Media | `assets` + `asset_usages` (org-scoped), flat storage keys, `packages/core/src/utils/s3.ts` | No `CopyObject` helper. `deleteAssetService` purges storage, so two orgs cannot safely share a key without a provider guard. |
| Docs | Draft PR #699 (`cursor/notes-foundation-6d09`): `org_doc` (TipTap HTML, `parent_id` tree, `is_template`), `BASIC_ORGANIZATION_DOC_LIMIT = 2` | Doc listings depend on this merging. |
| AI assistant | `packages/ai-assistant` — hard-coded `CourseTemplateIdSchema`; prompt built in `apps/api/src/routes/agent/agent.ts` via `buildSystemPrompt` + `buildContextMessage` | No skills store. A skill plugs in later as an option on `buildContextMessage` (user turn, keeps prompt cache). |
| Plan limits | `packages/utils/src/plans/limits.ts` — only `students` | Add `templates` (BASIC: 1). |
| Content reporting | `content_report` table, `POST /report`, `/internal/moderation/*` (API-key guarded) | Add `marketplace_listing` and `marketplace_review` target types. |
| Super admin | Not implemented (`prd/super-admin` is a plan; no `apps/admin`, no profile flag) | v1 needs its own platform-admin gate (see Technical Design). |
| Website | `apps/website` — SvelteKit 2 / Svelte 5 / Tailwind v4, fully prerendered, never calls `apps/api` | `/discover` must opt out of prerender and SSR-fetch a new public API. Shell: `navigation.svelte`, `footer.svelte`, `page-header.svelte`. |
| Auth hand-off | Host-only cookies; dashboard `/login?redirect=` and `/signup?redirect=` supported | Website can't see the session; import happens on the dashboard. |
| Categories / search | None platform-wide; tags are org-scoped; search is `ILIKE` everywhere | Categories are a code constant; search uses Postgres full-text on listing versions. |
| Reviews | `course.metadata.reviews` is hand-authored jsonb | Marketplace reviews are a real table; course reviews are stripped on import. |

## Product Goals

1. A visitor can browse, search, and filter `/discover` without an account, and every listing and publisher page is indexable.
2. An org admin can import a listing into their org in under a minute, landing on the imported item.
3. An org admin can publish a course template, image pack, doc, or AI skill, track its review status, and ship updates.
4. Platform admins can review, approve, request changes, remove, and curate collections from one queue.
5. Publishers are credited on every imported copy and on their public profile.
6. Nothing a publisher has not reviewed-and-submitted can reach another org: imports always come from an approved, frozen snapshot.

## Non-Goals (v1)

- Paid listings, revenue share, payouts, or checkout.
- Learner enrollment from `/discover`.
- Syncing imports with publisher updates.
- Running AI skills in the course assistant (install only).
- Skill attachments / example files (instructions only).
- Publisher replies to reviews, review voting, review moderation by publishers.
- Following publishers, notifications on new listings.
- Individual-creator (non-org) publishers.
- Private or unlisted listings; org-to-org direct sharing.
- Listing analytics beyond import count and rating.
- Localized listing content (listings are single-language; the `/discover` UI is English-only like the website).

## Functional Requirements

### 1. Public — Discover home (`discover.html`)

- Website shell (`navigation.svelte` / `footer.svelte`), with a hero: headline, search box, type tabs (All, Course templates, Images, Docs, AI skills).
- Category chips (fixed taxonomy, see Technical Design).
- Featured collections, each a horizontal row of listing cards with a "See all" link.
- "Popular this month" and "New" grids.
- Listing card: cover, type badge, title, publisher avatar + name, rating (hidden under 3 reviews), "Used by N orgs" (hidden under 5).
- CTA band: "Publish your own" → dashboard marketplace page (sign in if needed).

### 2. Public — Browse / search (`discover-browse.html`)

- URL-driven: `/discover/browse?q=&type=&category=&sort=`. Every filter change updates the URL (shareable, crawlable).
- Left filter rail: type, category, license. Sort: Popular (default), Top rated, Newest.
- Pagination of 24; empty state suggests clearing filters and shows popular listings.
- Category pages `/discover/category/<key>` are the same view with the category preset (SEO landing pages).

### 3. Public — Listing pages (`listing-course.html`, `listing-other.html`)

Common: title, summary, publisher block (links to profile), license badge with a one-line explanation, category, last updated, version number, "Used by N orgs", rating summary + reviews list, **Use this** primary CTA, **Report** link.

- **Course template:** cover, description, "What's inside" outline (sections → lessons/exercises with counts; exercise question counts; no lesson bodies), languages available, "What's not included" (price, reviews, instructor, enrolled students, certificates issued).
- **Image pack:** gallery grid with lightbox; count and dimensions. Importing copies every image into the org's Media library.
- **Doc:** cover, rendered preview of the first page, list of sub-pages.
- **AI skill:** description, the full instruction text (read-only, monospace), "Works with: ClassroomIO AI course assistant", and a notice that skills run once AI skills launch.

States: unpublished/removed listing → 410 page "This listing is no longer available" with related listings; listing with pending update → public page shows the currently approved version only.

### 4. Public — Publisher profile (`publisher.html`)

Org avatar, name, bio, website link, "Published on ClassroomIO since …", total imports, average rating, grid of the org's published listings. No member names or emails.

### 5. Importer — Import flow (`import.html`)

"Use this" links to `app.classroomio.com/marketplace/import/<slug>`. Signed-out users go through `/login?redirect=` (or signup). Then:

- **Org picker:** all of the user's orgs; orgs where they are not ADMIN are listed but disabled ("only admins can import"). Each org shows its plan and template usage. Preselect the most recently used. Shows what will be created ("1 template · 12 lessons · 4 exercises · 9 images").
- **License acknowledgement:** license name + one line, credited to the publisher.
- **States:**
  - Success → lands on the imported item (template settings, media library filtered to the pack, doc, or skill) with a success toast.
  - Template limit reached (free plan, 1 template) → blocked with upgrade CTA; other types still importable.
  - Doc limit reached (free plan doc limit from Docs) → same pattern.
  - No admin org → "You need to be an admin of an organization" with Create organization CTA (onboarding, then back to import).
  - Already imported into this org → allowed, with a note "Imported on Sep 3 — import again as a new copy?"
  - Listing no longer available → error state.

### 6. Importer — Imported item credit and review (`imported-template.html`)

- Every imported template, doc, skill, and image shows a subtle credit: "From ‹Publisher› on ClassroomIO · CC BY" linking to the listing (or to nothing if unpublished).
- **Rate this template** opens a dialog: 1–5 stars (required) and an optional review (max 1,000 chars). One review per org per listing; editable; shown with the org name and reviewer's first name.
- Only orgs with an import record can review.

### 7. Publisher — Marketplace page (`marketplace-listings.html`)

New org sidebar item **Marketplace** (admins only). Tabs: **Published by us**, **Imported**, **Publisher profile**.

- Published by us: table of listings — cover, title, type, status badge, version, imports, rating, updated. Row actions: Edit / Submit update, View public page, Unpublish, Republish, Delete draft.
- Status badges: Draft · In review · Changes requested (shows reviewer note) · Published · Published – update in review · Unpublished · Removed (shows reason, no republish).
- Imported: list of everything this org imported, with source listing and date.
- Publisher profile: bio (max 280) and website URL; preview of the public profile.
- Empty state explains the marketplace and links to publish entry points.

### 8. Publisher — Publish / submit update (`publish.html`)

Entry points: template card menu → **Publish to marketplace**; media library multi-select → **Publish as image pack**; doc menu → **Publish to marketplace**; AI skill row → **Publish**.

Dialog fields: title, summary (max 160), description (plain text, max 2,000), category, license (radio with explanations), cover image (defaults to template banner / first image / doc cover).

- **Sanitization preview** (course templates): "Removed from the published copy: price, payment link, reviews, instructor profile, welcome email, tags." Media on ClassroomIO storage is copied; external embeds (YouTube, Vimeo, Google) stay as links.
- **Terms checkbox:** "I have the rights to share this content under the selected license."
- Submit → status **In review**; the listing is frozen at this point (snapshot). Further edits to the source template do not change the submitted version.
- Updating a published listing opens the same dialog titled **Submit update**, with a "What changed" note (shown on the listing as version notes). The current version stays live until the update is approved.

### 9. AI skills library (`ai-skills.html`)

New page under the org's AI settings: list of skills (name, description, source: "Created by your team" or "From ‹Publisher›"), create/edit a skill (name, description, markdown instructions, max 20,000 chars). Banner: "Skills will run in the AI course assistant when AI skills launch." Publish action per skill.

### 10. Platform admin — Review queue (`review-queue.html`)

- Queue of submitted versions (oldest first) with type, publisher, first submission vs update.
- Review detail: rendered listing preview exactly as it will appear, automated checks (all media copied, sanitized fields cleared, external links listed), full snapshot contents (course outline with lesson bodies openable, images, doc, skill text), diff summary vs previous approved version for updates, publisher history (listings, removals, reports).
- Actions: **Approve** (goes live), **Request changes** (required note, emailed to publisher admins), **Remove** listing (required reason; also used for reported listings).
- Tabs: Queue · Reports (marketplace `content_report` rows) · Collections (create/reorder collections, add/remove listings, feature on home).

## Technical Design

### Categories

Code constant in `packages/utils/src/constants/marketplace.ts`:

```ts
export const MARKETPLACE_CATEGORIES = [
  'onboarding',
  'compliance-safety',
  'sales-customer-success',
  'software-technology',
  'leadership-management',
  'product-education',
  'language-learning',
  'academic',
  'health-wellness',
  'creative',
  'business',
  'other'
] as const;
```

Labels come from translation keys on both the dashboard and website.

### Data model

One migration. Snapshots reuse existing content tables (a hidden course / doc row) so the clone and doc-copy code paths are reused unchanged.

```ts
export const marketplaceListingType = pgEnum('marketplace_listing_type', ['course_template', 'image_pack', 'doc', 'ai_skill']);
export const marketplaceListingStatus = pgEnum('marketplace_listing_status', [
  'draft',
  'in_review',
  'changes_requested',
  'published',
  'unpublished',
  'removed'
]);
export const marketplaceVersionStatus = pgEnum('marketplace_version_status', [
  'draft',
  'in_review',
  'changes_requested',
  'approved',
  'superseded',
  'rejected'
]);
export const marketplaceLicense = pgEnum('marketplace_license', ['free_to_use', 'cc_by', 'cc_by_sa', 'cc_by_nc']);

export const marketplacePublisher = pgTable('marketplace_publisher', {
  organizationId: uuid('organization_id').primaryKey().references(() => organization.id, { onDelete: 'cascade' }),
  bio: varchar({ length: 280 }),
  websiteUrl: text('website_url'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
});

export const marketplaceListing = pgTable('marketplace_listing', {
  id: uuid().defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  type: marketplaceListingType().notNull(),
  status: marketplaceListingStatus().default('draft').notNull(),
  slug: varchar().notNull().unique(),
  category: varchar().notNull(),
  sourceCourseId: uuid('source_course_id').references(() => course.id, { onDelete: 'set null' }),
  sourceDocId: uuid('source_doc_id').references(() => orgDoc.id, { onDelete: 'set null' }),
  sourceSkillId: uuid('source_skill_id').references(() => orgAiSkill.id, { onDelete: 'set null' }),
  liveVersionId: uuid('live_version_id'),
  removedReason: text('removed_reason'),
  createdBy: uuid('created_by').notNull().references(() => profile.id),
  publishedAt: timestamp('published_at', { withTimezone: true, mode: 'string' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
});

export const marketplaceListingVersion = pgTable('marketplace_listing_version', {
  id: uuid().defaultRandom().primaryKey(),
  listingId: uuid('listing_id').notNull().references(() => marketplaceListing.id, { onDelete: 'cascade' }),
  versionNumber: integer('version_number').notNull(),
  status: marketplaceVersionStatus().default('draft').notNull(),
  title: varchar({ length: 120 }).notNull(),
  summary: varchar({ length: 160 }).notNull(),
  description: text().notNull(),
  changeNote: text('change_note'),
  license: marketplaceLicense().notNull(),
  coverStorageKey: text('cover_storage_key'),
  snapshotCourseId: uuid('snapshot_course_id').references(() => course.id),
  snapshotDocId: uuid('snapshot_doc_id').references(() => orgDoc.id),
  skillInstructions: text('skill_instructions'),
  reviewNote: text('review_note'),
  submittedBy: uuid('submitted_by').references(() => profile.id),
  submittedAt: timestamp('submitted_at', { withTimezone: true, mode: 'string' }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'string' }),
  searchVector: tsvector('search_vector').generatedAlwaysAs(
    sql`to_tsvector('english', coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(description,''))`
  )
}, (table) => [
  unique().on(table.listingId, table.versionNumber),
  index('marketplace_listing_version_search_idx').using('gin', table.searchVector)
]);

export const marketplaceVersionImage = pgTable('marketplace_version_image', {
  id: uuid().defaultRandom().primaryKey(),
  versionId: uuid('version_id').notNull().references(() => marketplaceListingVersion.id, { onDelete: 'cascade' }),
  position: integer().notNull(),
  storageKey: text('storage_key').notNull(),
  width: integer(),
  height: integer(),
  altText: text('alt_text')
});

export const marketplaceImport = pgTable('marketplace_import', {
  id: uuid().defaultRandom().primaryKey(),
  listingId: uuid('listing_id').notNull().references(() => marketplaceListing.id, { onDelete: 'cascade' }),
  versionId: uuid('version_id').notNull().references(() => marketplaceListingVersion.id),
  organizationId: uuid('organization_id').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  importedBy: uuid('imported_by').notNull().references(() => profile.id),
  courseId: uuid('course_id').references(() => course.id, { onDelete: 'set null' }),
  docId: uuid('doc_id').references(() => orgDoc.id, { onDelete: 'set null' }),
  skillId: uuid('skill_id').references(() => orgAiSkill.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
}, (table) => [index().on(table.listingId, table.organizationId)]);

export const marketplaceImportAsset = pgTable('marketplace_import_asset', {
  importId: uuid('import_id').notNull().references(() => marketplaceImport.id, { onDelete: 'cascade' }),
  assetId: uuid('asset_id').notNull().references(() => assets.id, { onDelete: 'cascade' })
}, (table) => [primaryKey({ columns: [table.importId, table.assetId] })]);

export const marketplaceReview = pgTable('marketplace_review', {
  id: uuid().defaultRandom().primaryKey(),
  listingId: uuid('listing_id').notNull().references(() => marketplaceListing.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  profileId: uuid('profile_id').notNull().references(() => profile.id),
  rating: smallint().notNull(),
  body: varchar({ length: 1000 }),
  hiddenAt: timestamp('hidden_at', { withTimezone: true, mode: 'string' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
}, (table) => [unique().on(table.listingId, table.organizationId), check('rating_range', sql`${table.rating} between 1 and 5`)]);

export const marketplaceCollection = pgTable('marketplace_collection', {
  id: uuid().defaultRandom().primaryKey(),
  slug: varchar().notNull().unique(),
  title: varchar().notNull(),
  description: text(),
  position: integer().notNull(),
  isFeatured: boolean('is_featured').default(false).notNull()
});

export const marketplaceCollectionItem = pgTable('marketplace_collection_item', {
  collectionId: uuid('collection_id').notNull().references(() => marketplaceCollection.id, { onDelete: 'cascade' }),
  listingId: uuid('listing_id').notNull().references(() => marketplaceListing.id, { onDelete: 'cascade' }),
  position: integer().notNull()
}, (table) => [primaryKey({ columns: [table.collectionId, table.listingId] })]);

export const orgAiSkill = pgTable('org_ai_skill', {
  id: uuid().defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  name: varchar({ length: 80 }).notNull(),
  description: varchar({ length: 280 }).notNull(),
  instructions: text().notNull(),
  createdBy: uuid('created_by').notNull().references(() => profile.id),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' })
});
```

Also in the same migration:

- `course.status` gains the value `'MARKETPLACE_SNAPSHOT'`. Snapshot courses live in the publisher's org and must be excluded everywhere templates are excluded, plus from the template row and gallery, course limits, analytics, search, and public pages.
- `org_doc.origin` gains `'marketplace_snapshot'` (after Docs merges), excluded from doc lists and limits.
- `assets.provider` gains `'marketplace'`: rows pointing at immutable marketplace storage. `deleteAssetService` deletes the row but never purges storage for this provider.
- `content_report` target type gains `marketplace_listing` and `marketplace_review`.

Computed values are never stored: import counts, average rating, and review counts are aggregated at query time (`count(distinct organization_id)` over `marketplace_import`, `avg(rating)` over visible reviews). The `search_vector` generated column is an index input, not a displayed value.

### Core logic

**Submit (snapshot).** Runs when a publisher submits a version.

```
submitVersion(listingId, fields, actor):
  assert actor is ADMIN of listing.organizationId
  assert listing.status not in (removed)
  assert no other version of this listing is in_review
  mediaMap = copyReferencedMedia(source, prefix = `marketplace/${versionId}/`)   // S3 CopyObject, before the transaction
  tx:
    snapshot = type switch
      course_template → cloneCourse(sourceCourseId, …, sanitize = MARKETPLACE_SANITIZE, status = 'MARKETPLACE_SNAPSHOT', rewriteUrls = mediaMap)
      doc             → copyDocTree(sourceDocId, origin = 'marketplace_snapshot', rewriteUrls = mediaMap)
      image_pack      → insert marketplace_version_image rows from mediaMap
      ai_skill        → skillInstructions = skill.instructions
    insert version { status: in_review, versionNumber: max + 1, snapshot ids, submittedAt: now }
    listing.status = listing.liveVersionId ? 'published' : 'in_review'
  after commit: notify platform admins
  on tx failure: enqueue deletion of copied objects
```

`MARKETPLACE_SANITIZE` clears `cost`, `metadata.paymentEnabled`, `metadata.paymentLink`, `metadata.discount`, `metadata.showDiscount`, `metadata.reviews`, `metadata.instructor`, `metadata.welcomeEmailMessage`, sets `isPublished = false`, clears every lesson's `teacherId` and `callUrl` (so no publisher user id or meeting link leaves the publisher's org), and skips tags. URL rewriting only touches URLs under the ClassroomIO media base URL (lesson `note` HTML, `videos`/`documents` JSON, `slideUrl`, `bannerImage`, `logo`); external embeds are left untouched.

**Approve.** `tx: version.status = approved; previous live version → superseded; listing.liveVersionId = version.id; listing.status = published; listing.publishedAt ??= now`. The superseded version's snapshot is kept (imports reference `versionId`) but no longer shown.

**Import.**

```
importListing(slug, organizationId, actor):
  listing = published listing by slug (404 if not published)
  assert actor is ADMIN of organizationId
  version = listing.liveVersionId
  tx:
    type switch
      course_template → assert templates used < getPlanLimit('templates', plan)
                        courseId = cloneCourse(version.snapshotCourseId, org = organizationId, isTemplate = true, status = 'ACTIVE', lessonTeacherId = actor)   // clone copies status; reset it so the import isn't hidden as a snapshot
      doc             → assert doc limit; docId = copyDocTree(version.snapshotDocId, organizationId, visibility = 'private', owner = actor)
      image_pack      → assetIds = insert assets(provider = 'marketplace', storageKey from marketplace_version_image, org = organizationId)
      ai_skill        → skillId = insert org_ai_skill(from version)
    insert marketplace_import { …, courseId | docId | skillId }, marketplace_import_asset rows
  after commit: invalidateOrgStats(organizationId)
  return { type, targetId }
```

Imported media points at the immutable `marketplace/` keys, so imports never copy bytes and never break when the publisher deletes their originals. Marketplace objects are not purged in v1.

**Credit.** The dashboard renders "From ‹Publisher› on ClassroomIO · ‹License›" by joining `marketplace_import` → listing → publisher org; nothing is written into the imported content.

**Platform admin gate.** Super admin is not built. v1 adds `platformAdminMiddleware` that allows a signed-in user whose verified email is in `PLATFORM_ADMIN_EMAILS` (comma-separated env var). This is replaced by the super-admin role when `prd/super-admin` ships.

### API routes

Mounted once in `app.ts` as `.route('/marketplace', marketplaceRouter)` and `.route('/platform', platformRouter)`; sub-routers composed in each domain `index.ts`.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/marketplace/listings` | Public | Search/browse (`q`, `type`, `category`, `license`, `sort`, `page`, `limit`) |
| GET | `/marketplace/listings/:slug` | Public | Listing detail (live version, outline, stats) |
| GET | `/marketplace/listings/:slug/reviews` | Public | Paginated visible reviews |
| GET | `/marketplace/collections` | Public | Featured collections with listing cards |
| GET | `/marketplace/publishers/:siteName` | Public | Publisher profile + published listings |
| GET | `/marketplace/org/:orgId/listings` | Org admin | Org's own listings with all statuses |
| GET | `/marketplace/org/:orgId/imports` | Org admin | Org's imports |
| POST | `/marketplace/org/:orgId/listings` | Org admin | Create a draft listing from a source |
| POST | `/marketplace/org/:orgId/listings/:listingId/versions` | Org admin | Submit a version (snapshot + in_review) |
| POST | `/marketplace/org/:orgId/listings/:listingId/unpublish` | Org admin | Unpublish |
| POST | `/marketplace/org/:orgId/listings/:listingId/republish` | Org admin | Republish the last approved version |
| DELETE | `/marketplace/org/:orgId/listings/:listingId` | Org admin | Delete (drafts only; published listings are unpublished instead) |
| PUT | `/marketplace/org/:orgId/publisher` | Org admin | Update publisher bio / website |
| POST | `/marketplace/org/:orgId/imports` | Org admin | Import `{ listingSlug }` |
| PUT | `/marketplace/org/:orgId/reviews/:listingId` | Org admin with import | Upsert the org's review |
| DELETE | `/marketplace/org/:orgId/reviews/:listingId` | Org admin | Delete the org's review |
| GET/POST/PUT/DELETE | `/organization/:orgId/ai-skills[/:skillId]` | Org admin | AI skills library CRUD |
| GET | `/platform/marketplace/queue` | Platform admin | Versions in review |
| GET | `/platform/marketplace/versions/:versionId` | Platform admin | Full snapshot for review |
| POST | `/platform/marketplace/versions/:versionId/approve` | Platform admin | Approve |
| POST | `/platform/marketplace/versions/:versionId/request-changes` | Platform admin | `{ note }` |
| POST | `/platform/marketplace/listings/:listingId/remove` | Platform admin | `{ reason }` |
| PATCH | `/platform/marketplace/reviews/:reviewId` | Platform admin | Hide/unhide a review |
| GET/POST/PUT/DELETE | `/platform/marketplace/collections[/:id]` | Platform admin | Collections CRUD + ordering |

Public routes set `Cache-Control: public, s-maxage=300, stale-while-revalidate=3600`. Each route returns a single response type.

### Frontend plan

Follows the CLAUDE.md layering: validation → queries → services → routes → feature types → API classes.

- **Validation:** `packages/utils/src/validation/marketplace/` — `ZMarketplaceSearch`, `ZCreateListing`, `ZSubmitVersion`, `ZImportListing`, `ZUpsertReview`, `ZUpdatePublisher`, `ZRequestChanges`, `ZRemoveListing`, `ZAiSkill`.
- **Queries:** `packages/db/src/queries/marketplace/{listing,version,import,review,collection,publisher}.ts`, `packages/db/src/queries/ai-skill/ai-skill.ts`. All accept an optional `DbOrTxClient`.
- **Services:** `apps/api/src/services/marketplace/{submit,review,import,search,publisher}.ts`; `cloneCourse` gains an options object (`status`, `sanitize`, `rewriteUrls`, `teacherId`) instead of more positional args. New `copyObject` helper in `packages/core/src/utils/s3.ts`.
- **Plan limit:** add `templates` to `PLAN_LIMIT_RESOURCES` (BASIC 1, EARLY_ADOPTER 25, ENTERPRISE unlimited) and compute usage in `apps/api/src/services/account/profile.ts`.
- **Dashboard:** `apps/dashboard/src/lib/features/marketplace/{api,components,utils}` with `utils/types.ts` inferring from `classroomio.marketplace.*`. Routes: `/org/[slug]/marketplace` (tabs), `/marketplace/import/[listingSlug]`, `/org/[slug]/settings/ai-skills`, `/platform/marketplace` (platform admins). Entry points added to the template card menu, media library bulk bar, doc menu.
- **Website:** `apps/website/src/routes/discover/` — `+page`, `browse/`, `category/[key]/`, `[slug]/`, `publishers/[siteName]/`, each with `export const prerender = false` and a `+page.server.ts` calling the public API through a small typed fetch client (`PUBLIC_SERVER_URL`). Add `/discover` to the navigation and sitemap; per-page `<title>`, meta description, OpenGraph image (listing cover), and `schema.org/CreativeWork` JSON-LD. Website copy lives in the website's existing copy pattern.
- **Translations:** all dashboard copy in `en.json` → `pnpm translate`.

## Implementation Order

1. **Prerequisite:** ship course templates (`prd/course-templates/README.md`) including the `templates` plan limit.
2. **Schema:** the single marketplace migration; `course.status`/`assets.provider`/`content_report` enum values; verify the journal `when` is newer than `main`.
3. **Clone refactor:** `cloneCourse` options object, sanitize, URL rewrite, `copyObject` helper; tests for sanitize and URL rewrite.
4. **Submit + approve + import** services for `course_template` and `image_pack`; rollback-sensitive integration tests (import fails after clone → no course left behind).
5. **Public API** + website `/discover` pages (home, browse, category, listing, publisher).
6. **Dashboard** marketplace page, publish dialog, import flow, credit banner.
7. **Platform review console** (queue, detail, approve/request changes/remove, collections) behind `PLATFORM_ADMIN_EMAILS`.
8. **Reviews & reporting:** review dialog, public reviews, report targets, review hiding.
9. **AI skills library** + `ai_skill` listings.
10. **Doc listings** once PR #699 merges (`copyDocTree`, `marketplace_snapshot` origin, doc limit).

Verification per phase:

```bash
export PATH="$HOME/.nvm/versions/node/v20.19.3/bin:$PATH"
pnpm --filter @cio/api^... build && pnpm --filter @cio/api build
test -f apps/dashboard/.env || cp apps/dashboard/.env.example apps/dashboard/.env
pnpm --filter @cio/dashboard^... build && pnpm --filter @cio/dashboard build
pnpm --filter @cio/website build
pnpm format:check
```

## Acceptance Criteria

1. A signed-out visitor can load `/discover`, search, filter by type/category/license, sort, and open any published listing and publisher profile; all pages are server-rendered with unique titles and meta descriptions.
2. Unpublished, removed, draft, and in-review listings are never returned by public routes; their slugs return 410 (removed/unpublished) or 404 (never published).
3. An org admin can publish a course template; the snapshot contains no price, payment link, reviews, instructor, welcome email, tags, lesson teacher or lesson call link, and `isPublished = false`.
4. Editing the source template after submission does not change the submitted or live version.
5. A published listing with an update in review keeps serving the previous approved version until approval.
6. Importing a course template creates a template (`is_template = true`, `status = 'ACTIVE'`, never `MARKETPLACE_SNAPSHOT`) in the chosen org with sections, lessons (all locales), exercises, questions, and options identical to the snapshot; media URLs resolve to marketplace storage.
7. A free-plan org that already has 1 template cannot import a course template and sees the upgrade CTA; the API returns a plan-limit error.
8. Non-admins cannot import, publish, or review (403), including via direct API calls.
9. Deleting an imported image in the importer's Media library does not delete the storage object; the publisher deleting their original does not break imports.
10. Snapshot courses and docs never appear in course/doc lists, templates tab, limits, analytics, search, or public org pages.
11. "Used by N orgs" counts distinct importing orgs; average rating excludes hidden reviews; neither is stored.
12. Only orgs with an import can review; one review per org per listing; ratings outside 1–5 are rejected.
13. Imported items show the publisher credit; unpublishing the listing keeps the credit text but removes the link.
14. Platform admins can approve, request changes (note emailed to publisher admins), remove (reason shown to publisher), hide reviews, and manage collections; non-platform-admins get 403 on `/platform/*`.
15. AI skills can be created, edited, deleted, published, and imported; nothing in the AI assistant changes behavior.
16. Zero regression on course clone, course creation, templates, media library, and docs.
17. All dashboard copy uses translation keys and every locale file is updated.

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Snapshot rows (`MARKETPLACE_SNAPSHOT`) leak into course lists, limits, or public pages | Central `excludeHiddenCourseStatuses` filter used by every course query; acceptance test #10 enumerates surfaces; grep review for `status` filters during implementation. |
| Copyright / inappropriate content | Mandatory review before going live, rights checkbox on submit, report link on every listing, platform admin remove with reason. |
| Publisher media hotlinked from imports breaks later | Snapshot copies media to immutable `marketplace/` keys; `marketplace` asset provider never purges storage. |
| Missed media URLs in lesson HTML (e.g. inline images in odd attributes) | URL rewrite scans all string fields in lesson content and JSON columns for the media base URL; reviewer sees the rendered snapshot; unmatched URLs logged on submit. |
| Personal data from the publisher's course leaking (instructor bio, reviews, welcome emails) | Explicit `MARKETPLACE_SANITIZE` list shown to the publisher in the publish dialog; unit tests assert each field is cleared. |
| Review queue backlog blocks publishers | Queue sorted oldest first with age shown; platform admins emailed on submit; clear "In review" status in the dashboard. |
| Website is fully prerendered and has never called the API | `/discover` routes opt out of prerender, use CDN caching headers, and fail soft (render a friendly error, not a 500) if the API is down. |
| Rating manipulation by creating orgs to review | Reviews require an import by that org; one per org; platform admins can hide reviews; ratings hidden under 3 reviews. |
| Platform admin allowlist is a stopgap | Isolated in `platformAdminMiddleware`; swapped for the super-admin role later without touching routes. |
| Docs feature not merged yet | Doc listings are the last phase and gated on PR #699; the type enum ships from day one, the UI hides it until docs is enabled. |
| Storage cost of immutable snapshots grows | Superseded versions with zero imports can be purged later; tracked but out of scope for v1. |
