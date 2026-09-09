# Docs as Content Layer — Implementation Plan

Companion to [`README.md`](./README.md). Written against `cursor/notes-foundation-6d09` (the Docs workspace branch), because every phase below builds on `org_doc`.

Every claim in "Verified starting point" was checked against the code on that branch, not inferred from the PRD.

---

## Verified starting point

| PRD assumption | Reality on the branch | Consequence for the plan |
| --- | --- | --- |
| `org_doc` exists | Yes — `packages/db/src/schema.ts`, migration `packages/db/src/migrations/0005_docs.sql`. Tree (`parent_id`, `sort_order`), `visibility`, `slug`, tags, templates, versions, comments, favorites, shares, soft delete | Phase 1 needs no new doc infrastructure |
| Doc content is a document | It is a **HTML string** in `org_doc.content`, plus derived `org_doc.plain_text`. TipTap → `getHTML()` | Lesson bodies are also HTML, so linking is a low-risk swap, and `plain_text` is already a search column |
| Lesson has a body we can point at a Doc | Body lives in **`lesson_language.content`, one row per locale**, with legacy fallback `lesson.note`. There is no `lesson.doc_id` | Phase 1 adds the column and one body resolver; **`org_doc` has no locale**, so see decision D4 |
| "Progress is per course enrollment, not global" | `lesson_completion` is unique on **`(lesson_id, profile_id)`** | Already correct *because* reuse links at the lesson row: Course A and Course B have separate `lesson` rows, so separate completion rows. No progress work in Phase 1 |
| Docs link to lessons | Only the reverse exists: `org_doc.lesson_id` / `org_doc.course_id`, used for `origin = 'lesson_capture'` (a learner's private notes on a lesson) | Do not reuse those columns for authored reuse — different meaning, and there is a partial unique index on `(owner_id, lesson_id)` for captures |
| Learning paths can hold Doc items | **There is no learning-path or path-item table.** `program_*` is legacy, `cohort_*` is the live product, and both link **courses only** (`cohort_course`) | Split PRD §4: cohort materials are buildable now, path items are blocked on a product that does not exist |
| Landing page can gain a blog section | Sections are **fixed singletons** (`hero`, `navigation`, `links`, `embed`, `callout`, `footer`), hardcoded in each of **10 theme `org.svelte` composers**, with 3 lazy switches + 1 eager map in the dashboard | "Docs as blog" as written costs 10 theme edits and yields exactly one blog section. See decision D6 |
| Media needs a `link` kind for bookmarks | `assets.kind` (Zod, not a PG enum) is `video \| document \| image \| audio \| other`; **`provider` already has `external_url`** and `is_external` exists | Bookmarks are mostly built — this is a small kind + filter change, not a feature |
| Search can include Docs | `/organization/search` fans out to courses, cohorts, widgets, tags, audience — **all `ILIKE '%term%'`, no `tsvector` anywhere** | Adding Docs is one query function; do the `tsvector` upgrade in the same migration while `plain_text` is the only new column being indexed |
| Public Docs render | **Broken.** `apps/dashboard/src/routes/(org-site)/doc/[slug]/+page.server.ts` calls `classroomio['org-site'].note[':docSlug']`, but `apps/api/src/app.ts` mounts the router at `/org-site/doc`. There is no `/org-site/note` route | Phase 0. This blocks the public reader and therefore the blog phase |

---

## Decisions

### D1 — Link at the host row and *derive* usage. Do not build `doc_placement`.

The PRD proposes one polymorphic table:

```
doc_placement (doc_id, surface, target_id, position, title_override)
```

Do not build it. `target_id` cannot carry a foreign key, so nothing enforces that the lesson/cohort/section it names still exists. Rows go stale the first time `deleteLesson()` runs — and `deleteLesson()` already exists and would know nothing about placements. A "Used in" panel built on a table that drifts is worse than no panel, because authors will trust it.

There is a precedent in the repo — `asset_usages` (`target_type`, `target_id`, `slot_type`) — and it is fine there, because every asset mount is the same shape: drop a file into a lesson slot. Doc surfaces are not the same shape. A lesson mount needs ordering, unlocking, and completion; a catalog listing needs visibility and an excerpt; a blog entry needs a date and a cover. A shared table would be mostly-null columns plus a `surface` switch in every reader.

Instead, model each surface the way the repo already models that surface, and derive usage from the real relationships:

| Surface | Mechanism | Why |
| --- | --- | --- |
| Course lesson | `lesson.doc_id` — real FK to `org_doc` | Lesson row already owns order, section, unlock, completion |
| Cohort material | `cohort_material` table | Mirrors the existing `cohort_course` junction |
| Catalog listing | Columns on `org_doc` | Being listable is a property of the Doc, not a placement of it |
| Blog / resources | Landing-page JSON: a query (tag or folder) + layout | Zero rows to keep in sync; the collection re-resolves on every render |
| **Usage graph** | **Derived** `getDocUsage(docId)` — union over the above | Cannot drift, because it reads the same rows the surfaces read |

### D2 — Learner read access derives from the host surface, never from `org_doc.visibility`.

`resolveNoteAccess()` in `apps/api/src/services/docs/access.ts` grants read when the Doc is `visibility = 'team'` or `'public'`. A Doc used as a lesson must be readable by enrolled students even when it is `private`, and linking a Doc into a course must **not** flip its visibility (that would publish staff drafts to `GET /doc/:docId`).

So the lesson body path does not call `resolveNoteAccess` at all. `courseMemberMiddleware` and the public-course service already authorize the *lesson*; the resolver then reads `org_doc.content` by id as trusted data.

Related gap worth fixing on its own: `visibility = 'team'` currently means *every org member including students* can read the Doc by id (listing is safe — `listAccessibleDocs` forces `scope = 'mine'` for non-team roles — but direct id reads are not). That is tolerable while Docs are staff scratchpads. It stops being tolerable the moment Docs carry all customer-education content and learners legitimately hold Doc ids from lessons. Recommend splitting `team` into `staff` (admin/tutor) and `members` before Phase 3.

### D3 — One body resolver, one precedence rule.

```
1. lesson.doc_id set and that org_doc is not soft-deleted → org_doc.content
2. lesson_language[requested locale].content
3. first non-empty lesson_language.content
4. lesson.note   (legacy, pre-i18n)
5. ''
```

Rules 2–4 are today's behaviour, currently duplicated inline in `packages/db/src/queries/course/public-course.ts`. Adding rule 1 in five places invites drift, so the precedence becomes one pure function and the existing inline copy is deleted.

### D4 — Doc-backed lessons are single-locale in v1, loudly.

`lesson_language` is keyed by locale; `org_doc` has no locale column. Linking a Doc therefore replaces a *translated* body with an untranslated one. Silently dropping a customer's translations is not acceptable, so:

- Linking a Doc into a lesson that already has **more than one** non-empty `lesson_language` row is rejected (`409`, with the locale list). The author must unlink or accept explicitly.
- Existing `lesson_language` rows are never deleted on link. Unlinking restores them.
- The lesson editor shows the Doc's single-locale state instead of the locale switcher.
- Follow-up (own PRD): `org_doc_language`, mirroring `lesson_language`, so a reusable Doc can be translated once and reused everywhere in every locale. That is the version of this feature that actually sells to multinational customer-education teams.

### D5 — The display title derives at render time.

Repo convention (`AGENTS.md`, "Persisted columns store data, not presentation") forbids copying a title out of another row into a persisted column. So the Doc title is never written into `lesson.title`. `lesson.title` stays the author's own override; when it is empty the reader falls back to `org_doc.title`:

```ts
const displayTitle = lesson.title.trim() || doc.title;
```

`lesson.title` is `varchar NOT NULL`, so an empty string is the sentinel and no nullability migration is needed. `ZLessonCreate.title` relaxes from `min(1)` to "empty allowed when `docId` is present".

### D6 — "Docs as blog" needs a landing-page block model first.

The org landing page has no section list. Each theme's `org.svelte` hardcodes the order — see `packages/ui/src/custom/org-landing-page/minimal/org.svelte`: hero → catalog → links → embed → callout → footer. `LandingSectionKey` is a closed union in `edit-context.ts`, and per `.cursor/rules/add-landing-template.mdc` the dashboard keeps **three lazy switches plus one eager map** that all must agree.

Adding "docs collection" as a seventh singleton means editing 10 theme composers, the union, the normalizer, and four registries — to ship one blog section that a customer cannot move, duplicate, or turn into a changelog *and* a resources list.

So Phase 6 lands an ordered, typed block list first:

```ts
landingpage.sections: Array<
  | { id: string; kind: 'hero';            ... }
  | { id: string; kind: 'catalog';         filter?: {...} }
  | { id: string; kind: 'docs-collection'; source: { tagId?: string; folderId?: string }; layout: 'blog' | 'list' | 'cards' }
  | { id: string; kind: 'callout' | 'embed' | 'links'; ... }
>
```

Themes keep owning chrome (tokens, nav, hero, cards); a shared renderer walks `sections` and picks the themed component per block. The existing six singletons migrate into a default `sections` array, so old JSON keeps rendering. After that, every future section — including docs collections — is one block type and zero theme edits.

---

## Phase 0 — Unblock the public Doc reader

Small, but the blog phase and every "share this page" story sit on top of it.

`apps/dashboard/src/routes/(org-site)/doc/[slug]/+page.server.ts`:

```ts
// was: classroomio['org-site'].note[':docSlug']
type GetPublicDocRequest = (typeof classroomio)['org-site']['doc'][':docSlug']['$get'];
```

…and the call site plus the `error(404, 'Note not found')` copy. Then confirm `GET /org-site/doc/:docSlug?siteName=…` renders a published Doc end to end.

Add a regression guard so this class of drift fails CI rather than production: `pnpm --filter @cio/dashboard check` (svelte-check) catches the bad RPC path, and it is not currently in the pre-commit gate.

---

## Phase 1 — Reusable Doc lessons + usage graph (the wedge)

Delivers the PRD's one-line promise: *write the intro once, use it in every course, edit it once.*

### 1.1 Migration — `packages/db/src/migrations/0006_doc_lessons.sql`

```sql
ALTER TABLE "lesson" ADD COLUMN "doc_id" uuid;

ALTER TABLE "lesson" ADD CONSTRAINT "lesson_doc_id_fkey"
  FOREIGN KEY ("doc_id") REFERENCES "public"."org_doc"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;

CREATE INDEX "idx_lesson_doc_id" ON "lesson" USING btree ("doc_id");
```

`ON DELETE SET NULL` is a backstop, not the product behaviour: a hard delete must never leave a dangling lesson. The real guard is service-level (1.4) — a Doc in use cannot be deleted without detaching first. Regenerate the Drizzle snapshot with `pnpm --filter @cio/db db:generate`.

### 1.2 Drizzle schema — `packages/db/src/schema.ts`

Add `docId: uuid('doc_id')` to `lesson` plus the FK and index in the table's second argument. `orgDoc` is declared later in the file, so reference it with a lazy `foreignKey({ ... })` entry in the same style as `lesson_course_id_fkey`. Add the `lesson` ↔ `orgDoc` pair to `packages/db/src/relations.ts`.

### 1.3 Queries — `packages/db/src/queries/`

**`lesson/lesson.ts`**

- `getLessonById` — add a `LEFT JOIN org_doc ON org_doc.id = lesson.doc_id AND org_doc.deleted_at IS NULL`, returning `docId`, `docTitle`, `docContent`, `docUpdatedAt`.
- `updateLesson` — accept `docId` (including explicit `null` to unlink).
- `getLessonLocalesWithContent(lessonId)` — the non-empty locale list D4 needs to refuse a lossy link.

**`docs/usage.ts` (new)** — the derived usage graph, one query per surface, unioned in the service:

```ts
listDocLessonUsage(docId): Promise<Array<{
  lessonId: string; lessonTitle: string; lessonSlug: string | null;
  courseId: string; courseTitle: string; courseSlug: string | null; isPublished: boolean;
}>>

countDocUsage(docIds: string[]): Promise<Map<string, number>>   // for list/sidebar badges
```

`countDocUsage` takes an array so the sidebar and list views stay one round trip.

**`course/content.ts`** — `getCourseContentItems` computes `hasNoteContent` in raw SQL from `lesson.note` and `lesson_language`. A doc-backed lesson would show as empty in the content tree and in "lesson has content" checks. Extend the expression:

```sql
OR EXISTS (
  SELECT 1 FROM org_doc
  WHERE org_doc.id = lesson.doc_id
    AND org_doc.deleted_at IS NULL
    AND length(trim(COALESCE(org_doc.plain_text, ''))) > 0
)
```

**`course/public-course.ts`** — `getPublicCourseItem` joins `org_doc` and stops resolving the body inline; it hands the raw parts to the resolver from 1.4.

### 1.4 Core + services

**New pure function — `packages/core/src/services/lesson/lesson-body.ts`**

```ts
export type LessonBodySource = 'doc' | 'locale' | 'fallback-locale' | 'legacy-note' | 'empty';

export function resolveLessonBody(params: {
  doc: { content: string; title: string; deletedAt: string | null } | null;
  languages: Array<{ locale: TLocale; content: string | null }>;
  requestedLocale: TLocale;
  legacyNote: string | null;
}): { body: string; source: LessonBodySource };
```

Returning `source` (not just the string) is what lets the player render "synced from Doc" chrome and lets the tests assert precedence directly. Unit-test all five branches.

**`packages/core/src/services/lesson/lesson.ts`**

- `getLesson` — resolve through `resolveLessonBody`; include `doc: { id, title, updatedAt }` in the response so the editor can render the link banner.
- `linkLessonToDocService(courseId, lessonId, docId, { allowTranslationLoss })` — assert the Doc is in the same org; reject when `getLessonLocalesWithContent` returns more than one locale and `allowTranslationLoss` is false (`409`, `ErrorCodes.LESSON_DOC_TRANSLATIONS_EXIST`); set `doc_id`; leave `lesson_language` rows untouched.
- `unlinkLessonFromDocService(courseId, lessonId, { keepCopy })` — clear `doc_id`. When `keepCopy` is true, snapshot the current Doc HTML into `lesson_language` for the active locale first, so "stop tracking, keep the text" works. That is the escape hatch that makes authors willing to link in the first place.
- `upsertLessonLanguageService` — reject writes to a doc-backed lesson (`409`). Otherwise an autosave silently writes a body nobody will ever see.

**`apps/api/src/services/docs/usage.ts` (new)**

- `getDocUsageService(orgId, userId, roleId, docId)` — read-gate the Doc through the existing `resolveNoteAccess`, then union the surface queries into `{ lessons: [...], cohorts: [], catalog: null, blog: [] }`. Phase 1 fills `lessons`; later phases fill the rest without changing the response shape.

**`apps/api/src/services/docs/docs.ts`**

- `deleteDocService` — if `countDocUsage` is non-zero, throw `409` with the usage list instead of soft-deleting. This is the PRD's "warn with usage list" acceptance criterion, enforced server-side rather than only in the dialog.
- `permanentDeleteNoteService` — same guard.

### 1.5 Routes

`apps/api/src/routes/course/lesson.ts`:

| Method | Path | Service |
| --- | --- | --- |
| `PUT` | `/:lessonId/doc` | `linkLessonToDocService` |
| `DELETE` | `/:lessonId/doc` | `unlinkLessonFromDocService` |

`apps/api/src/routes/docs/docs.ts`:

| Method | Path | Service |
| --- | --- | --- |
| `GET` | `/:docId/usage` | `getDocUsageService` |

`/doc/usage` (org plan usage) already exists, so the per-doc route must be `/:docId/usage` — Hono would otherwise shadow it.

### 1.6 Validation — `packages/utils/src/validation/lesson/lesson.ts`

```ts
export const ZLinkLessonDoc = z.object({
  docId: z.string().uuid(),
  allowTranslationLoss: z.boolean().optional().default(false)
});

export const ZUnlinkLessonDoc = z.object({
  keepCopy: z.boolean().optional().default(true)
});
```

Relax `ZLessonCreate.title` per D5 (empty allowed when `docId` is present) and add optional `docId` to `ZLessonCreate` / `ZLessonUpdate`.

### 1.7 Dashboard

**Create flow** — `apps/dashboard/src/lib/features/course/components/content/`

- `constants.ts` — `CONTENT_OPTIONS` gains **Lesson from Doc**, next to Section / Lesson / Exercise.
- `lesson-from-doc-stepper.svelte` (new) — pick an existing Doc or create a blank one, then create the lesson with `docId`. Reuse the existing Doc search rather than building a second picker: `$features/docs/components/doc-search-modal.svelte`.

**Lesson editor** — `apps/dashboard/src/lib/features/course/components/lesson/note/note.svelte`

Today it renders `TextEditor` in edit mode and `SafeHtmlContent` in view mode from `lessonApi.translations`. For a doc-backed lesson it must instead render a read-only body plus a banner: Doc title, last updated, "Edit in Docs" (deep link to `/org/[slug]/docs/[docId]`), "Used in N places", and "Unlink". No inline editing — one editor for a Doc, in Docs. Two editors for one row is how divergence starts.

Keep `note.svelte` thin: put the banner in `lesson/note/doc-linked-note.svelte` and branch on `lessonApi.lesson?.doc`.

**Docs editor** — `apps/dashboard/src/lib/features/docs/components/doc-usage-panel.svelte` (new)

"Used in" list, grouped by course, each row linking to the lesson. Mount in `doc-page-chrome.svelte`. Register as a side panel alongside the existing AI and comments panels (`features/docs/panel.ts`) so it obeys the same layout rules.

**API classes** — `linkDoc` / `unlinkDoc` on `features/course/api/lesson.svelte.ts`; `getUsage` on `features/docs/api/docs.svelte.ts`. Request types go in the feature `utils/types.ts`, never in the `.svelte.ts` files.

**Guard** — `lessonApi.save()` currently always calls `upsertLanguage`. Skip that call when the lesson is doc-backed, or every autosave takes a `409`.

**Copy** — new keys in `apps/dashboard/src/lib/utils/translations/en.json`, then `cd apps/dashboard && pnpm translate` for the other locales.

### 1.8 Public course path

`packages/db/src/queries/course/public-course.ts` joins `org_doc`; `apps/api/src/services/course/public-course.ts` resolves through `resolveLessonBody`. `packages/ui/src/custom/public-course/lesson-view.svelte` needs no change — it renders `lesson.body`, which is the point of resolving centrally.

### 1.9 Other body consumers

Each of these reads lesson content and must go through the resolver, or a doc-backed lesson looks blank to it:

| Consumer | File |
| --- | --- |
| AI tutor (student tools) | `apps/api/src/services/agent/student-tools.ts` |
| Agent chat tools | `packages/core/src/services/agent/chat-tools.ts` |
| MCP course drafts | `packages/mcp/src/tools/course-drafts.ts` |
| Public API v1 courses | `apps/api/src/routes/v1/courses.ts` |
| Lesson PDF export | `generateLessonPdf` (`apps/api/src/routes/course/lesson.ts`) |
| Course import | `apps/api/src/services/course-import/course-import.ts` (writes only — no change) |

This list is also the Phase 3 argument: once these read through one resolver, Docs reach the AI tutor, the MCP server, and the public API for free.

### 1.10 Tests

- `resolveLessonBody` — all five precedence branches (`packages/core`).
- `linkLessonToDocService` — cross-org Doc rejected; multi-locale lesson rejected without `allowTranslationLoss`; `lesson_language` rows preserved.
- `deleteDocService` — `409` with usage list when in use.
- Integration: one Doc in two courses, edit once, both `getLesson` responses change; completing it in Course A leaves Course B incomplete (the `(lesson_id, profile_id)` key makes this true, and a test pins it).

### 1.11 Acceptance (from the PRD)

- [ ] One Doc in two courses; edit the heading; both players update.
- [ ] Removing the lesson from a course does not delete the Doc.
- [ ] Deleting a Doc in use warns with the usage list.
- [ ] Progress is independent per course.
- [ ] Unlink with "keep a copy" leaves an editable lesson body behind.

---

## Phase 2 — Unified search, and stop using `ILIKE`

`apps/api/src/services/organization/search.ts` fans out to five `ILIKE '%term%'` queries. Adding Docs makes it six, on the largest table, unindexed.

`org_doc.plain_text` already exists and is maintained server-side by `htmlToPlainText()`, so the upgrade is cheap:

```sql
ALTER TABLE "org_doc" ADD COLUMN "search_vector" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title,'') || ' ' || coalesce(plain_text,''))
  ) STORED;

CREATE INDEX "idx_org_doc_search_vector" ON "org_doc" USING gin ("search_vector");
```

- `packages/db/src/queries/docs/search.ts` — `searchOrgDocs(orgId, term, limit)` (staff scope) and `searchLmsDocs(orgId, profileId, term, limit)` (catalog Docs plus Docs backing lessons in the learner's enrolled courses, via `lesson.doc_id`).
- `searchOrganization` / `searchLmsOrganization` gain a `docs` key; `ZSearchOrganization` is unchanged.
- `command-palette.svelte` and `features/search/utils/types.ts` gain a `doc` result type with the existing icon conventions.

Do courses next in the same shape if the `tsvector` path proves out. Ranked results across content types is the difference between "we have search" and "search is why the academy is usable".

---

## Phase 3 — Docs where the product already reaches

Cheapest large win in this plan, because the channels exist and only the content layer is missing. After Phase 1 these are mostly wiring:

- **Public API v1** — `GET /public-api/v1/docs`, `GET /public-api/v1/docs/:slug`. Customers who want their help centre in their own frontend get the same source of truth.
- **MCP** (`packages/mcp`) — expose Docs as readable/writable resources next to the existing course-authoring tools, so "update the SSO Doc from this changelog" is an agent action, not a roadmap item.
- **AI tutor / agent retrieval** — Phase 1.9 already makes doc-backed lesson bodies visible to `student-tools.ts` and `chat-tools.ts`. Add catalog Docs to retrieval so the tutor can answer from a page the learner never opened.
- **Course widget** (`prd/course-widget-embed [DONE]`) — allow a Doc as widget content, so the in-app help panel and the academy lesson are the same page.

None of this needs new primitives. It is the difference between a content layer and a wiki.

---

## Phase 4 — Catalog one-off lessons

```sql
ALTER TABLE "org_doc"
  ADD COLUMN "show_in_catalog" boolean DEFAULT false NOT NULL,
  ADD COLUMN "catalog_excerpt" varchar,
  ADD COLUMN "catalog_audience" varchar DEFAULT 'public' NOT NULL;  -- public | logged_in | enrolled

CREATE INDEX "idx_org_doc_catalog"
  ON "org_doc" ("organization_id", "show_in_catalog")
  WHERE "deleted_at" IS NULL;
```

`catalog_audience` is deliberately separate from `visibility`: "listed in the academy catalogue" and "readable by anyone with the URL" are different questions, and collapsing them is how a private draft ends up indexed.

- `GET /organization/docs/public` mirroring `getPublicCourses` — same pagination and tag filtering (`doc_tag_assignment` already exists, sharing the `tag` table with courses, so catalog filters work across both content types with no new tag work).
- `(org-site)/courses/+page.server.ts` fetches both and merges into one typed list. Per repo convention each route returns a single type, so keep two endpoints and merge in the loader, not one union endpoint.
- Add a content-type filter (`lessons | courses | paths`) beside the existing tags / types / search / pricing params.
- Catalog Doc reading reuses the Phase 0 public reader, wrapped in academy chrome rather than the Docs workspace.

Requires D2's `staff` / `members` visibility split first.

---

## Phase 5 — Cohort materials

Cohorts are the live product (`cohort`, `cohort_course`, `cohort_member`, `cohort_goal`); learning paths do not exist. So build the half that is real:

```sql
CREATE TABLE "cohort_material" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "cohort_id" uuid NOT NULL,
  "doc_id" uuid NOT NULL,
  "position" integer DEFAULT 0 NOT NULL,
  "created_by_profile_id" uuid,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT "cohort_material_cohort_doc_key" UNIQUE("cohort_id","doc_id")
);
-- FKs: cohort_id → cohort(id) CASCADE, doc_id → org_doc(id) CASCADE,
--      created_by_profile_id → profile(id) SET NULL
CREATE INDEX "idx_cohort_material_cohort_position" ON "cohort_material" ("cohort_id","position");
```

Follows `cohort_course` exactly, so the queries, `cohortMemberMiddleware`, and the dashboard cohort feature all extend rather than change. Cohort members read the Doc through cohort membership (D2), not through `org_doc.visibility`.

**Remove path items from this PRD.** They belong in a learning-paths PRD, and that PRD should design `path_item` as heterogeneous from day one (`course | doc | exercise`) — the mistake `program_course` and `cohort_course` both made was assuming a path only holds courses.

---

## Phase 6 — Landing-page blocks, then Docs collections

Per D6, in order:

1. **Block model.** `landingpage.sections: LandingBlock[]` with a Zod discriminated union in `packages/utils/src/validation/organization/`. Migrate the six existing singletons into a default array at read time (`normalizeLandingPageSettings` already normalizes legacy shapes, so this is the same job again). Nothing on disk has to change until the org saves.
2. **Shared renderer.** `packages/ui/src/custom/org-landing-page/sections.svelte` walks `sections` and resolves each block to a themed component. Each theme's `org.svelte` becomes "chrome + `<Sections/>`". This is where the 10-theme edit cost gets paid once instead of once per future section.
3. **Editor.** `landingpage-editor.svelte` swaps its fixed array for add / remove / reorder over `sections`. `LandingSectionKey` stops being a closed union.
4. **`docs-collection` block.** Source = tag or folder; layout = `blog | list | cards`. Routes: `/blog/[slug]` and `/resources/[slug]` both resolve to the Phase 0 Doc reader with a canonical `/doc/[slug]` and redirects from the aliases (PRD open question 3). Every href through `safeHref()` per the landing-page rule.
5. Confirm unpublished / non-catalog Docs never render publicly — a test, not a review note.

---

## Phase 7 — Freshness (the actual "product changed" answer)

The PRD calls product-change staleness "cross-cutting, not a feature" and relies on reuse alone. Reuse fixes *propagation*; it does not tell anyone *which* of 200 Docs went stale when Billing shipped. Cheap, high-signal additions:

```sql
ALTER TABLE "org_doc"
  ADD COLUMN "reviewed_at" timestamp with time zone,
  ADD COLUMN "review_interval_days" integer,
  ADD COLUMN "steward_profile_id" uuid;   -- → profile(id) SET NULL
```

- "Needs review" filter in the Docs workspace, driven by `reviewed_at + review_interval_days`.
- On save of a Doc used in N lessons, surface "this updates N lessons across M courses" — the derived usage query from Phase 1 already answers it.
- Optional digest to the steward via the existing notification system.

This is the one thing in the plan a generic LMS does not have and a customer-education team feels weekly.

---

## Phase 8 — URL bookmarks

Mostly done. `assets.provider` already includes `external_url` and `is_external` exists. Add `'link'` to the `AssetKind` Zod enum (`packages/utils/src/validation/assets/assets.ts`), add it to `ASSET_KIND_OPTIONS` (`features/media/utils/constants.ts`), relax the `storageKey` / `byteSize` refinements for links, and allow a link asset in a lesson slot. Keep it explicitly secondary to Docs, per PRD §6.

---

## Ordering

| Phase | Ships | Unblocked today? | Cost driver |
| --- | --- | --- | --- |
| 0 | Public Doc reader works | Yes | One import path + a CI guard |
| 1 | Reusable Doc lessons + derived usage | Yes | One column; body resolver in ~6 call sites |
| 2 | Docs in search, `tsvector` | Yes | One generated column + two query functions |
| 3 | Docs in public API, MCP, AI tutor, widget | After 1 | Wiring existing channels |
| 4 | Catalog one-off lessons | Needs D2 split | Public endpoint + catalog merge |
| 5 | Cohort materials | Yes | Mirrors `cohort_course` |
| 6 | Landing blocks → blog / changelog / resources | Needs 0 | Touches 10 themes + 4 registries once |
| 7 | Freshness / stewardship | After 1 | Three columns + one filter |
| 8 | URL bookmarks | Yes | Enum + filter |

Phases 0, 1, 2, and 5 are independent of each other and of the landing-page work. Phase 6 is the only expensive one, and D6 is why it should be paid as a platform change rather than a seventh hardcoded section.

---

## Risks

| Risk | Mitigation |
| --- | --- |
| Doc-backed lessons drop translations (D4) | Refuse lossy links; never delete `lesson_language` rows; ship `org_doc_language` as the real fix |
| Two editors for one body | Doc-backed lessons are read-only in the course editor; `upsertLessonLanguageService` rejects writes |
| A Doc is deleted while in use | Service-level `409` with usage list; `ON DELETE SET NULL` as the last-resort backstop |
| Staff drafts leak to learners | D2 `staff` / `members` visibility split before Phase 4 |
| Doc-backed lessons look empty in the content tree | Extend the `hasNoteContent` SQL in `getCourseContentItems` (1.3) |
| `plain_text` drifts from `content` | Already derived server-side on every write; the `tsvector` is generated, so it cannot drift separately |
| Plan limits count reused Docs oddly | `assertOrganizationDocCreationAllowed` counts Docs per owner, so reuse is free by construction — a good pricing story, worth keeping |
| Landing block migration breaks live pages | Normalize legacy JSON into `sections` at read time; write only on save |

---

## Open questions from the README, answered

1. **Doc-only lesson vs material tab** — Doc replaces the *note* material; video, slides, documents, and exercises stay siblings on the same lesson. No new lesson type, no loss of mixed materials.
2. **Progress** — nothing to decide. `lesson_completion` is `(lesson_id, profile_id)` and each course has its own lesson row, so per-course progress already falls out. A catalog Doc read with no lesson row needs its own record; deferred to Phase 4.
3. **Blog URL vs Doc URL** — canonical `/doc/[slug]`; `/blog/[slug]` and `/resources/[slug]` are aliases that 301 to it. One page, one canonical URL, no split SEO.
4. **Who can attach** — admin for public surfaces (catalog, blog); tutors may attach to lessons in courses they teach. Matches `isOrgTeamRole` today.
5. **Landing filters** — extend `/courses` with a content-type filter rather than adding an "All learning" page. It already has server-side tags / types / search / pricing / pagination, and a second catalog would fork all of it.
