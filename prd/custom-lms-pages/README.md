# Custom LMS Pages PRD

## Status

- Draft

## Prototypes — the UX source of truth

UX for this feature will come from the prototype folder, not from prose. Where this document and a prototype disagree on a UI detail, **the prototype wins** and this document must be corrected.

```text
prototypes/custom-lms-pages/index.html
```

Prototypes are not built yet. They are the next step once this scope is agreed (see Implementation Order, phase 0).

| Surface | Prototype file |
| --- | --- |
| Start page / screen map | `prototypes/custom-lms-pages/index.html` (todo) |
| Admin: sidebar builder | `prototypes/custom-lms-pages/sidebar-builder.html` (todo) |
| Admin: page editor (block canvas) | `prototypes/custom-lms-pages/page-editor.html` (todo) |
| Admin: block library | `prototypes/custom-lms-pages/block-library.html` (todo) |
| Learner: custom sidebar and page | `prototypes/custom-lms-pages/learner-page.html` (todo) |

## Purpose

Today every learner in every academy sees the same hardcoded LMS sidebar (`baseNavConfig` in `apps/dashboard/src/lib/features/ui/navigation/lms-navigation.ts`): Home, My Learning, Certificates, Explore, Cohorts, Exercises, Community, Settings. Admins can only toggle two items on or off.

Custom LMS Pages lets an admin design what learners see. They build a sidebar, and each sidebar entry can open a **page** that pulls together courses and individual content blocks (video, note, slides, document, image, and the interactive blocks from the lesson editor) from a reusable **block library**.

The goal is that an academy can feel like its own product: a "Start here" page with a welcome video and the three onboarding courses, a "Resources" page with docs and slides, without every learner wading through a generic catalogue.

## Problem Statement

- The LMS sidebar is identical for every academy. Admins cannot rename, reorder, hide or add entries beyond two on/off flags (`customization.dashboard.exercise` and `.community`).
- Content that is not a course (a welcome video, a policy document, a single slide deck) has nowhere to live. Admins wrap it in a fake one-lesson course.
- Learner Home (`/lms`) shows what the platform decides, not what the academy wants to feature.
- Lesson blocks only exist inside a lesson. They cannot be reused across lessons or shown outside a course.

## Confirmed Decisions

1. **Blocks come from a reusable block library.** Blocks become standalone org-level entities that can be placed on many pages (and later in lessons). Editing a block updates every placement. This is the largest piece of the build; see Technical Design and Risks.
2. **Admin items plus pinned system items.** Admins define the main sidebar. Settings and the account footer menu are always present and cannot be removed, so a learner can always reach profile, notifications and log out. My Learning, Certificates, Explore, Cohorts, Exercises and Community become optional built-in item types that admins can place, rename, reorder or hide.
3. **One sidebar per academy.** Every learner in the org sees the same sidebar. No per-cohort or per-group variants and no per-item audience rules in v1.
4. **Blog posts are out of v1.** The Docs workspace is still an open PRD/PR ([`prd/docs-content-layer`](../docs-content-layer/README.md), PR #1086), so this feature does not depend on it and leaves no placeholder in the model. A `doc` item type is added later as an additive change.
5. **Default is today's sidebar.** An academy that never opens the builder keeps exactly the current navigation. Custom sidebars are opt-in per org.
6. **Pages are published or draft.** Learners only see published pages. Admins can preview a draft as a learner.

### Product calls made without an explicit answer (veto these)

- **Sidebar item types in v1:** `page`, `built-in`, `course`, `link`, `group` (a label with children, one level deep). A `course` item is a shortcut that opens the course directly.
- **Page layout:** a single ordered column of block and course-card entries. No multi-column or free layout in v1.
- **Progress:** a block on a page has no completion tracking. Courses on a page show the learner's existing course progress. Block completion is a later PRD.
- **Who can build:** admins only. Tutors cannot edit the sidebar or pages.

## Current-State Audit

| Capability | Current state | Notes |
| --- | --- | --- |
| LMS sidebar | Hardcoded `baseNavConfig` | `features/ui/navigation/lms-navigation.ts`; rendered by `features/ui/sidebar/lms-sidebar/` |
| Nav visibility controls | Two flags | `organization.customization.dashboard.exercise` / `.community` (json column, `schema.ts` ~L2384) |
| LMS shell | `(app)/lms/+layout.svelte` | `Sidebar.Provider` + `LMSSidebar` + `LmsHeader`; max-w-5xl content column |
| LMS routes | Fixed set | `(app)/lms/{mylearning,certificates,cohorts,exercises,explore,community,settings}` |
| Breadcrumbs / active state | Keyed to the fixed route list | `lms-breadcrumb.ts`, `isActive()` with `matchPattern` regexes. Custom routes need a dynamic path |
| Lesson content blocks | Stored per lesson | `lesson` columns (`note`, `videos`, `slides`, plus document/image per [`prd/lesson-editor-redesign`](../lesson-editor-redesign/README.md)); v2 adds chart, flashcards, tabs, multiple choice, process ([`prd/lesson-editor-redesign-v2`](../lesson-editor-redesign-v2/README.md)). No standalone block entity |
| Block renderer / editor | Lives with the lesson editor | Must be extracted so pages and lessons share one implementation |
| Media assets | Media Manager | `assets` table and asset usage tracking; blocks that hold files must keep recording usage |
| Learning paths in LMS | Open PR #1330 | Touches the same nav and `/lms` routes; coordinate ordering |
| Landing learner menu | Done | `prd/landing-learner-menu [DONE]`; links to `/lms`, `/lms/certificates`, `/lms/settings` which must keep working |

## Product Goals

1. An admin can create a sidebar for their academy in minutes, from the dashboard, without code.
2. An admin can build a page from courses and blocks, and reuse a block on several pages.
3. A learner sees the custom sidebar in the LMS, and system items they must always reach never disappear.
4. Existing academies see no change until an admin opts in.
5. The block renderer is one implementation shared by lessons and pages.

## Non-Goals (v1)

- Blog posts / Docs (Decision 4).
- Per-cohort, per-group or per-item audience rules (Decision 3).
- Multiple sidebars per academy.
- Block completion tracking, quizzes scored outside a lesson, certificates from pages.
- Free-form layouts, columns, custom CSS or HTML.
- Putting library blocks inside lessons. The library is built so this is possible, but v1 only places blocks on pages.
- A public (logged-out) version of custom pages. LMS only.
- Tutor editing rights.

## Functional Requirements

### FR-1 — Sidebar builder (admin)

Location: org settings, "LMS sidebar" (prototype: `sidebar-builder.html`).

- Lists the current sidebar as a reorderable tree (drag handle plus move up/down for accessibility).
- Add item: choose a type (Page, Built-in, Course, Link, Group), then its target and label.
- Each item has: label, icon (from the existing moving-icons set), visibility toggle.
- Built-in items can be renamed, reordered and hidden. Hiding a built-in only hides the nav entry; the route still works by direct link.
- Settings and the account footer are shown at the bottom as locked rows ("Always shown").
- Uses `Page.SettingsActions` for save and discard; saving applies to learners immediately.
- "Reset to default" restores today's sidebar after confirmation.
- States: default (not customised), customised, empty custom sidebar (blocked: at least one item required), invalid target (page deleted or course archived, shown with a warning and skipped for learners).

### FR-2 — Page editor (admin)

Location: `(app)/org/[id]/lms-pages/[pageId]` (prototype: `page-editor.html`).

- A page has a title, slug, optional description and status (Draft / Published).
- Body is an ordered list of entries. Entry types: **Block** (picked from or created in the library), **Course** (card with progress), **Heading** and **Divider** (layout aids).
- Add content menu mirrors the lesson editor's Add content menu. Creating a block opens the same block editor, saves it to the library, and places it.
- Reorder by drag or move up/down; remove from a per-entry menu. Removing an entry never deletes the library block.
- Edit / Preview toggle; Preview is the learner view.
- Autosave with the lesson editor's indicator.

### FR-3 — Block library (admin)

Location: org "Library" tab (prototype: `block-library.html`).

- Grid and list of blocks with type, title, last edited and "used on N pages".
- Search and filter by type.
- Edit a block in place; the editor warns "Used on N pages" and changes apply to all placements.
- Delete is blocked while the block is placed anywhere, and lists where it is used.
- Duplicate creates an independent copy.

### FR-4 — Learner experience

Location: `(app)/lms/**` (prototype: `learner-page.html`).

- The sidebar renders from the org's saved sidebar when customised, otherwise from `baseNavConfig`.
- Custom pages open at `/lms/p/<slug>`. Breadcrumbs show group, then page title.
- Course entries show the existing course card with progress and link into the course.
- Blocks render with the shared block renderer in learner mode (interactive blocks work, learner state is not saved, as in lesson editor v2).
- Draft pages and removed pages return the standard not-found state; a sidebar entry pointing to them is not rendered.
- The page uses `ScrollToTop` per CLAUDE.md since the column can overflow.
- Mobile: sidebar collapses as today; page column is single width.
- States: loading skeleton, empty published page ("Nothing here yet"), course the learner cannot access (card shown as locked per existing course access rules).

## Technical Design

### Data model

```ts
export const lmsBlock = pgTable('lms_block', {
  id: uuid().defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull(),
  type: varchar().notNull(), // video | note | slides | document | image | chart | flashcards | tabs | multiple_choice | process
  title: varchar().notNull(),
  content: jsonb().notNull(),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow()
});

export const lmsPage = pgTable('lms_page', {
  id: uuid().defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull(),
  slug: varchar().notNull(),
  title: varchar().notNull(),
  description: text(),
  status: varchar().notNull().default('draft'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow()
}); // unique (organization_id, slug)

export const lmsPageEntry = pgTable('lms_page_entry', {
  id: uuid().defaultRandom().primaryKey(),
  pageId: uuid('page_id').notNull(),
  position: integer().notNull(),
  kind: varchar().notNull(), // block | course | heading | divider
  blockId: uuid('block_id'),
  courseId: uuid('course_id'),
  text: varchar()
});

export const lmsSidebarItem = pgTable('lms_sidebar_item', {
  id: uuid().defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull(),
  parentId: uuid('parent_id'),
  position: integer().notNull(),
  kind: varchar().notNull(), // page | built_in | course | link | group
  label: varchar().notNull(),
  icon: varchar(),
  isHidden: boolean('is_hidden').notNull().default(false),
  pageId: uuid('page_id'),
  courseId: uuid('course_id'),
  builtInKey: varchar('built_in_key'),
  url: varchar()
});
```

Rules applied:

- Relationships are real FK columns (`blockId`, `courseId`, `pageId`), never ids inside jsonb. FKs on `lmsPageEntry.blockId` use `ON DELETE RESTRICT` so a placed block cannot be deleted.
- A sidebar is "customised" when the org has at least one `lms_sidebar_item` row; no flag column is stored. Reset deletes the rows.
- Block `content` holds only what the author typed and the existing block shapes (no markup, no localised copy). Stored assets keep `assetId` so Media Manager usage tracking continues.
- "Used on N pages" is computed by query, never stored.
- Sidebar `url` is only valid for `kind = 'link'` and must pass `isAllowedHref` from `@cio/utils`.
- Ship as **one migration**; check its `when` against `main` before merge (CLAUDE.md, Database migrations).

### Block extraction

`lesson` holds its content in columns today. Phase 1 extracts the block renderer and editor into a shared module so both the lesson editor and the page editor use it. Lessons are **not** migrated to the library in v1; the library stores its own blocks using the same content shapes. Content shapes are defined once in `packages/utils/src/validation/lms-block/` and reused.

### API

| Method | Route | Purpose | Auth |
| --- | --- | --- | --- |
| GET | `/lms-pages/sidebar` | Learner: effective sidebar for the org (custom or default marker) | member |
| GET | `/lms-pages/:slug` | Learner: published page with resolved entries | member |
| GET/PUT | `/lms-pages/admin/sidebar` | Read and replace the full sidebar tree | admin |
| DELETE | `/lms-pages/admin/sidebar` | Reset to default | admin |
| GET/POST | `/lms-pages/admin/pages` | List, create pages | admin |
| GET/PUT/DELETE | `/lms-pages/admin/pages/:id` | Read, update (including entries), delete | admin |
| GET/POST | `/lms-pages/admin/blocks` | List, create library blocks | admin |
| GET/PUT/DELETE | `/lms-pages/admin/blocks/:id` | Read, update, delete (409 when placed) | admin |

All mounted under one root segment `/lms-pages` via an aggregate router. Each route returns one type. Sidebar save is one service call in one transaction (replace all rows); page save replaces entries in one transaction; cache invalidation happens after commit.

Public API and MCP parity must be reviewed against [`skills/public-api-review/SKILL.md`](../../skills/public-api-review/SKILL.md) before implementation.

### Frontend

- `features/lms-pages/` with `api/`, `utils/types.ts` (types inferred from the RPC client), `utils/` pure helpers, and components.
- `getLmsNavigationItems()` gains a second source: when the org has a custom sidebar, map it into `NavItem[]`; otherwise use `baseNavConfig`. Built-in items resolve through the existing `baseNavConfig` entries by `builtInKey`, so their `show` rules (plan gating on Certificates, flags on Exercises and Community) still apply.
- Active-state and breadcrumbs handle `/lms/p/[slug]` dynamically.
- Sidebar and page data load in an `$effect` waiting on `$currentOrg.id`.
- Card rows use skeletons until the first payload.
- New `@cio/ui` components get Storybook stories in the same change.
- All copy through `en.json`; run `pnpm translate` for other locales.

## Implementation Order

0. Prototypes under `prototypes/custom-lms-pages/` and sign-off on this PRD.
1. Extract the shared block renderer and editor from the lesson editor; no behaviour change.
2. Migration, validation schemas, queries for blocks, pages, entries and sidebar.
3. Services and routes for blocks and pages; build `@cio/api`.
4. Block library UI.
5. Page editor UI.
6. Sidebar builder UI and learner sidebar swap in `lms-navigation.ts`.
7. Learner page route `/lms/p/[slug]`, breadcrumbs, `ScrollToTop`.
8. Public API / MCP parity decision, help centre doc with framed screenshots.

Build verification: `pnpm --filter @cio/api^... build && pnpm --filter @cio/api build`, `pnpm --filter @cio/dashboard^... build && pnpm --filter @cio/dashboard build`, `pnpm format:check`.

## Acceptance Criteria

1. An academy that never customises its sidebar sees today's sidebar and routes, unchanged.
2. An admin can add, rename, reorder, hide and delete sidebar items of each v1 type, and the learner sees the result after a reload.
3. Settings and the account footer menu cannot be removed from the sidebar by any admin action.
4. Hiding a built-in item removes only the nav entry; its route still resolves.
5. Certificates, Exercises and Community keep their existing plan and flag gating when placed as built-ins.
6. An admin can create a page, add courses and blocks, reorder them, and publish; learners see it at `/lms/p/<slug>`.
7. Editing a library block changes it on every page that places it; deleting a placed block is rejected with the list of pages.
8. Draft pages, deleted pages and pages from another org are not reachable by learners.
9. Interactive blocks work for learners on a page exactly as in a lesson.
10. Sidebar `link` items reject `javascript:`, `data:` and `vbscript:` URLs at the API and render time.
11. A failed page save leaves entries unchanged (transaction rollback test).
12. Only admins can call the admin routes; a tutor and a student get 403.
13. The landing-page learner menu links (`/lms`, `/lms/certificates`, `/lms/settings`) still work.
14. Zero regression on existing LMS routes, lesson editor and course pages.
15. All user-facing copy uses translation keys; locales are regenerated and placeholders preserved.

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Block library plus extraction is a large build and could stall the sidebar value | Phases 1 to 3 are separable; the sidebar builder (phase 6) only needs pages, courses and links, so it can ship before the library UI if needed |
| Two block stores (lesson columns and library) drift in shape | One shared Zod schema and renderer; migration of lessons to the library is a separate follow-up PRD |
| Admin hides everything and strands learners | Settings and footer pinned; at least one visible item required to save; Reset to default |
| Stale sidebar entries after a page or course is deleted | Deleting a page removes its sidebar items in the same transaction; archived courses are skipped at render with an admin warning |
| Block files lose Media Manager usage tracking | Library block save and delete go through the same asset-usage recording as lessons |
| Conflict with learning paths PR #1330 touching nav and `/lms` routes | Land #1330 first or coordinate the `lms-navigation.ts` change; learning paths become a built-in item type |
| Docs and blog arrive later and need a slot | Item and entry `kind` are varchars; adding `doc` is additive and needs no table change |
| Org-scoped data loads before `currentOrg.id` is set | Load in `$effect` gated on org id per CLAUDE.md |
