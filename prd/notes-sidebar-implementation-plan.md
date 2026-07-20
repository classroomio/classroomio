# Notes Sidebar — Implementation Plan

Companion to [`notes-sidebar-prd.md`](./notes-sidebar-prd.md). Execute phases in order on branch `cursor/notes-workspace-feedback-6d09`.

---

## Phase 1: Schema + queries + access

### 1.1 Migration SQL (`packages/db/src/migrations/0005_notes.sql`)

Append after existing `org_note` table definition (or ALTER if table already created in same file — prefer inline columns in CREATE TABLE):

```sql
-- In org_note CREATE TABLE, add:
"parent_id" uuid,
"sort_order" integer DEFAULT 0 NOT NULL,

-- After org_note table, add FK + indexes:
ALTER TABLE "org_note" ADD CONSTRAINT "org_note_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "public"."org_note"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
CREATE INDEX "idx_org_note_parent_sort" ON "org_note" USING btree ("parent_id","sort_order");
CREATE INDEX "idx_org_note_org_parent" ON "org_note" USING btree ("organization_id","parent_id");

CREATE TYPE "public"."note_share_permission" AS ENUM('read', 'write');

CREATE TABLE "org_note_favorite" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "profile_id" uuid NOT NULL,
  "note_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT "org_note_favorite_profile_note_key" UNIQUE("profile_id","note_id")
);
ALTER TABLE "org_note_favorite" ADD CONSTRAINT "org_note_favorite_profile_id_fkey"
  FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE CASCADE;
ALTER TABLE "org_note_favorite" ADD CONSTRAINT "org_note_favorite_note_id_fkey"
  FOREIGN KEY ("note_id") REFERENCES "public"."org_note"("id") ON DELETE CASCADE;
CREATE INDEX "idx_org_note_favorite_profile" ON "org_note_favorite" ("profile_id");

CREATE TABLE "org_note_share" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "note_id" uuid NOT NULL,
  "profile_id" uuid NOT NULL,
  "shared_by" uuid NOT NULL,
  "permission" "note_share_permission" DEFAULT 'read' NOT NULL,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT "org_note_share_note_profile_key" UNIQUE("note_id","profile_id")
);
ALTER TABLE "org_note_share" ADD CONSTRAINT "org_note_share_note_id_fkey"
  FOREIGN KEY ("note_id") REFERENCES "public"."org_note"("id") ON DELETE CASCADE;
ALTER TABLE "org_note_share" ADD CONSTRAINT "org_note_share_profile_id_fkey"
  FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE CASCADE;
ALTER TABLE "org_note_share" ADD CONSTRAINT "org_note_share_shared_by_fkey"
  FOREIGN KEY ("shared_by") REFERENCES "public"."profile"("id") ON DELETE CASCADE;
CREATE INDEX "idx_org_note_share_profile" ON "org_note_share" ("profile_id");
CREATE INDEX "idx_org_note_share_note" ON "org_note_share" ("note_id");
```

Post-deploy data migration (script or SQL in seed):

```sql
INSERT INTO org_note_favorite (profile_id, note_id, created_at)
SELECT owner_id, id, COALESCE(updated_at, created_at)
FROM org_note WHERE is_pinned = true AND deleted_at IS NULL
ON CONFLICT DO NOTHING;
```

### 1.2 Drizzle schema

`packages/db/src/schema.ts`:

- `orgNote.parentId`, `orgNote.sortOrder`
- Self-FK on `parentId`
- `orgNoteFavorite` table
- `orgNoteShare` table + `noteSharePermission` enum

Regenerate `0005_snapshot.json` via `pnpm --filter @cio/db db:generate` if repo workflow requires.

### 1.3 New query modules

**`packages/db/src/queries/notes/favorite.ts`**

- `addNoteFavorite(profileId, noteId)`
- `removeNoteFavorite(profileId, noteId)`
- `listFavoriteNoteIds(profileId)`
- `isNoteFavorited(profileId, noteId)`

**`packages/db/src/queries/notes/share.ts`**

- `listNoteShares(noteId)`
- `replaceNoteShares(noteId, sharedBy, grants[])`
- `listNotesSharedWithUser(organizationId, profileId)`

**Extend `packages/db/src/queries/notes/note.ts`**

- Add `parentId`, `sortOrder` to `noteListSelect`
- `listNotesForSidebar(params)` — joins favorites, computes accessible set
- `listNoteChildren(noteId)` — direct children ordered by sortOrder
- `listTrashedNotes(ownerId, organizationId)`
- `restoreNote(noteId)`
- `hardDeleteNote(noteId)`
- `cascadeNoteVisibility(noteId, visibility)`
- `wouldCreateCycle(noteId, newParentId)` — walk ancestors

### 1.4 Access rewrite (`apps/api/src/services/notes/access.ts`)

Replace owner-only write with:

```ts
export function resolveNoteAccess(params): { canRead: boolean; canWrite: boolean } {
  // owner → read+write
  // team + isOrgTeamRole → read+write
  // team + student → read only
  // share read → read only
  // share write → read+write
  // public → read only (unless owner)
}
```

Update all services to use `resolveNoteAccess` instead of separate assert functions where `canWrite` matters.

**Current bug:** line 29-30 returns `canWrite: false` for team notes for team members — change to `canWrite: isOrgTeamRole(roleId)`.

---

## Phase 2: API routes

File: `apps/api/src/routes/notes/notes.ts`

| Route | Service function |
| --- | --- |
| `GET /sidebar` | `listNotesSidebarService` |
| `POST /:id/favorite` | `favoriteNoteService` |
| `DELETE /:id/favorite` | `unfavoriteNoteService` |
| `GET /:id/shares` | `listNoteSharesService` |
| `PUT /:id/shares` | `replaceNoteSharesService` |
| `GET /trash` | `listTrashedNotesService` |
| `POST /:id/restore` | `restoreNoteService` |
| `DELETE /:id/permanent` | `permanentDeleteNoteService` |

Extend existing:

- `createNoteService` — accept `parentId`, validate parent access + visibility inherit
- `updateNoteService` — accept `parentId`, `sortOrder`; cycle + visibility checks
- `updateNoteVisibilityService` — cascade visibility
- `getNoteService` — include `children` array

Validation: `packages/utils/src/validation/notes/notes.ts`

---

## Phase 3: Sidebar UI

### Component tree

```
NoteListSidebar
├── NoteSidebarSearch (opens modal on click; shows ⌘K hint)
├── NoteSidebarNewNote (full-width row)
├── scroll area
│   ├── NoteSidebarSection (favorites)
│   ├── NoteSidebarSection (private)
│   │   └── NoteSidebarTree
│   ├── NoteSidebarSection (shared)
│   └── NoteSidebarSection (workspace)
└── NoteSidebarFooter (templates, trash)
```

### `note-tree-utils.ts`

```ts
buildNoteTree(flat: SidebarNote[]): TreeNode[]
partitionSidebarSections(flat, userId): { favorites, private, shared, workspace }
getExpandedStorageKey(orgId): string
```

### `notes-workspace-page.svelte` changes

- Remove `listScope`, `selectedTagFilter` state passed to sidebar
- Call `notesApi.listSidebar()` instead of `listNotes({ scope })`
- Remove tab-change handlers

### Selection style

```ts
selectedNoteId === note.id ? 'bg-primary/10 text-foreground' : 'hover:bg-muted/60'
```

---

## Phase 4: SUB-PAGES

**`note-subpages.svelte`**

Props: `noteId`, `children`, `canWrite`, `onCreateChild`

Render card list; click → `goto(/org/[slug]/notes/[id])`

**`note-editor-page.svelte`**

- Fetch children on load (from getNote or separate call)
- Render `NoteSubpages` below editor
- "New sub-page" calls API with `parentId: noteId`

---

## Phase 5: Search modal

**`note-search-modal.svelte`**

- Dialog from `@cio/ui/base/dialog`
- `Command` pattern optional; minimum: Input + tag chips + result list
- Debounce search 250ms
- `svelte:window onkeydown` for ⌘K when notes layout mounted (`notes/+layout.svelte`)

Register shortcut in `apps/dashboard/src/routes/(app)/org/[slug]/notes/+layout.svelte`.

---

## Phase 6: Share dialog

**`note-share-dialog.svelte`**

When visibility = private:

- List current grants from `GET /notes/:id/shares`
- Org member combobox (reuse team member list from `orgApi.getOrgTeam()`)
- Permission select: read / write
- Save → `PUT /notes/:id/shares`

---

## Phase 7: Templates page

Replaces `NoteTemplatesBrowser` modal and `note-builtin-templates.ts` with a dedicated full-page experience.

### 7.1 Template catalog (`utils/note-course-templates.ts`)

```ts
export type CourseTemplateId =
  | 'cohort_bootcamp'
  | 'self_paced_video'
  | 'single_workshop'
  | 'semester_course'
  | 'certification_prep'
  | 'blank_course';

export type CourseTemplate = {
  id: CourseTemplateId;
  title: string;
  emoji: string;
  gradient: string; // Tailwind classes, e.g. 'from-violet-500 to-blue-500'
  description: string;
  modules: string[]; // child note titles
  introHtml?: string; // optional parent body placeholder
};

export const NOTE_COURSE_TEMPLATES: CourseTemplate[] = [ /* 6 entries per PRD */ ];
```

Module titles per template — see PRD § Templates page → Module titles.

### 7.2 API

**`apps/api/src/routes/notes/notes.ts`**

| Route | Service |
| --- | --- |
| `POST /from-course-template` | `createNoteFromCourseTemplateService` |

**`apps/api/src/services/notes/create-from-course-template.ts`**

1. Validate `templateId` against shared catalog
2. Assert org admin/tutor role
3. In one transaction:
   - Insert root `org_note` (`parent_id = null`, `sort_order = 0`)
   - Insert N children with `parent_id = root.id`, `sort_order = 0..N-1`
4. Return `{ note: rootNote, children }`

Validation: `packages/utils/src/validation/notes/notes.ts` — `courseTemplateIdSchema`.

### 7.3 Dashboard route + page

| File | Purpose |
| --- | --- |
| `routes/(app)/org/[slug]/notes/templates/+page.svelte` | Route shell |
| `pages/note-templates-page.svelte` | Page layout: title, subtitle, grid, your-templates |
| `components/note-template-card.svelte` | Gradient banner card + CTA |

**Layout:** Reuse notes `+layout.svelte` — sidebar stays visible; main panel renders templates page.

**Grid:** `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`

**Apply flow:**

```ts
async function useTemplate(templateId: CourseTemplateId) {
  const { note } = await notesApi.createFromCourseTemplate({ templateId });
  goto(`/org/${orgSlug}/notes/${note.id}`);
}
```

### 7.4 Your templates section

- Fetch `GET /notes/templates` on page load
- Render below built-in grid under heading **Your templates**
- Simpler cards (title + preview snippet); CTA calls existing `POST /notes/from-template`
- Empty state: "Save a note as a template to reuse it here."

### 7.5 Sidebar footer wiring

**`note-sidebar-footer.svelte`**

```svelte
<a
  href="/org/{orgSlug}/notes/templates"
  class:active={page.url.pathname.endsWith('/notes/templates')}
>
  Templates
</a>
```

Active state: `bg-primary/10 text-foreground`.

### 7.6 Deprecations

| Remove / replace | After |
| --- | --- |
| `NoteTemplatesBrowser.svelte` | Templates page ships |
| `note-builtin-templates.ts` | `note-course-templates.ts` |
| `showTemplatesBrowser` in `notes-workspace-page.svelte` | Navigate to `/notes/templates` |
| Empty-state "Templates" picker action | `goto(/notes/templates)` |

### 7.7 Verification

- [ ] `/org/[slug]/notes/templates` renders 6 cards with correct gradients + copy
- [ ] Cohort Bootcamp → 1 parent + 4 children in PRIVATE tree
- [ ] Editor SUB-PAGES block lists module children
- [ ] Org-saved template appears in Your templates
- [ ] Sidebar Templates footer highlights on templates route
- [ ] Modal no longer opens anywhere

---

## i18n keys (`notes.sidebar.*`)

Add to all files in `apps/dashboard/src/lib/utils/translations/*.json`:

```
notes.sidebar.search_placeholder
notes.sidebar.search_modal_title
notes.sidebar.new_note
notes.sidebar.sections.favorites
notes.sidebar.sections.private
notes.sidebar.sections.shared_with_me
notes.sidebar.sections.workspace
notes.sidebar.footer.templates
notes.sidebar.footer.trash
notes.subpages.heading
notes.subpages.new
notes.subpages.empty
notes.trash.title
notes.trash.empty
notes.trash.restore
notes.trash.delete_forever
notes.trash.confirm_delete
notes.favorite.add
notes.favorite.remove
notes.share.people_heading
notes.share.permission_read
notes.share.permission_write
```

### i18n keys (`notes.templates.*`)

```
notes.templates.page_title
notes.templates.page_subtitle
notes.templates.use_template
notes.templates.modules_included
notes.templates.your_templates_heading
notes.templates.your_templates_description
notes.templates.your_templates_empty
```

---

## Files to delete or gut after Phase 3

- `buildNoteListSections` usage in sidebar (keep function if used elsewhere)
- `listScope` / `scopeOptions` in workspace page
- `formatPinnedNoteDate`, `formatRecentNoteMeta` in sidebar rows (use simple title truncate)
- Pin via `isPinned` in editor menu → favorite toggle

---

## Verification commands

```bash
pnpm --filter @cio/db db:setup
pnpm api:dev
pnpm dashboard:dev
# Login admin@test.com / 123456
# /org/udemy-test/notes
```

---

## PR checklist

- [ ] `0005_notes.sql` only (no 0006)
- [ ] Access tests: team write for admin, read-only for student
- [ ] Favorites migration from is_pinned
- [ ] Screenshots of all four sections
- [ ] Trash restore flow
- [ ] Templates page: 6 built-ins + Your templates section
- [ ] `NoteTemplatesBrowser` modal removed
- [ ] i18n all locales
