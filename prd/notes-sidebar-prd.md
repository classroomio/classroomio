# Notes Sidebar & Hierarchy PRD

> **Location:** This file is the canonical PRD. When disk space allows, move to `prd/notes-sidebar/README.md`.

## Status

- **Phase 0:** Approved — ready for implementation
- **Target branch:** `cursor/notes-workspace-feedback-6d09` (PR **#715**), stacked on `cursor/notes-foundation-6d09` (PR **#699**)
- **Migration rule:** All schema changes go in foundation's single file `packages/db/src/migrations/0005_notes.sql` (do **not** add `0006+` notes migrations)

## Progress

| Phase | Scope | Status |
| --- | --- | --- |
| **1** | Schema + DB queries + access control | ☐ |
| **2** | API routes (tree, favorites, share, trash) | ☐ |
| **3** | Sidebar UI (sections, tree, footer) | ☐ |
| **4** | Editor SUB-PAGES block + create child | ☐ |
| **5** | Search modal (⌘K) + tag filter | ☐ |
| **6** | Individual share UI in share dialog | ☐ |
| **7** | **Templates page** (course-structure templates, replaces modal) | ☐ |

---

## Purpose

Redesign the org workspace **notes list sidebar** to match a Notion-style navigation pattern:

- Hierarchical **notes-with-children** (sub-pages), not separate folders
- Fixed sections: **Favorites**, **Private**, **Shared with me**, **Workspace**
- **Search modal** with text + tag filter (not inline sidebar filters)
- **Trash** with restore and permanent delete
- **Per-user favorites** (so students can favorite team docs)
- **Individual share** grants for "Shared with me"
- **Templates page** — full-page course-structure starters (not the current modal/browser)

This PRD is written so another agent can implement without prior conversation context.

---

## Problem Statement

The current notes sidebar (`note-list-sidebar.svelte`) uses:

- All / Mine / Shared **tabs**
- Inline **search** + **tag dropdown**
- **Date-bucket** sections (Pinned, Previous 7 days, etc.)
- **Flat list** — no parent/child tree
- Global **`is_pinned`** on the note row (not per-user)
- **No** individual share model (only `visibility: team | private | public`)
- **No** trash UI (soft delete exists but notes are unrecoverable in UI)
- Amber selection highlight; templates mixed into filter area
- **Templates:** small modal (`NoteTemplatesBrowser`) with weak built-ins (Blank, TOC, meeting notes) — **replace with dedicated Templates page**

The product goal is a cleaner, Notion-like sidebar where containers are notes with sub-pages, team docs live under Workspace, personally shared notes appear under Shared with me, and **course planning starts from a beautiful Templates page** that seeds a note tree (parent + module sub-pages).

---

## Reference mockup (target UX)

```
┌─────────────────────────┐
│  🔍 Search        ⌘K    │
│  + New note             │
├─────────────────────────┤
│  ▼ FAVORITES            │
│    ★ Grading Rubric     │
├─────────────────────────┤
│  ▼ PRIVATE              │
│    ▶ Course Outline     │  ← parent note (expandable)
│      Module 1           │  ← child (indented)
│      Module 2           │
│    Onboarding Checklist │
│    Lecture Notes — W4   │
├─────────────────────────┤
│  ▼ SHARED WITH ME       │
│    Faculty Meeting Notes│
├─────────────────────────┤
│  ▼ WORKSPACE            │
│    Codex Academy Handbook│
│    Academic Calendar    │
├─────────────────────────┤
│  Templates              │  ← navigates to /notes/templates (active highlight)
│  Trash                  │
└─────────────────────────┘
```

**Templates page** (main content when footer Templates is selected):

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Start a new course                                                      │
│  Pick a template to pre-fill the module structure for the kind of       │
│  course you're building — everything stays editable after.               │
│                                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                      │
│  │ 🚀 gradient │  │ 🎥 gradient │  │ 🛠 gradient │                      │
│  │ Cohort      │  │ Self-Paced  │  │ Single      │                      │
│  │ Bootcamp    │  │ Video Course│  │ Workshop    │                      │
│  │ description │  │ description │  │ description │                      │
│  │ 4 modules   │  │ 5 modules   │  │ 4 modules   │                      │
│  │[Use template]│  │[Use template]│  │[Use template]│                      │
│  └─────────────┘  └─────────────┘  └─────────────┘                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                      │
│  │ Semester    │  │ Cert Prep   │  │ Blank       │                      │
│  │ Course      │  │             │  │ Course      │                      │
│  └─────────────┘  └─────────────┘  └─────────────┘                      │
│                                                                          │
│  ── Your templates (optional section below grid) ──                      │
│  Org-saved note templates (is_template) as smaller cards                 │
└──────────────────────────────────────────────────────────────────────────┘
```

**Note detail (main panel)** also shows:

- Title + visibility subtitle (`Private · only visible to you`)
- Tags row on the note (unchanged — tags stay on note, not in sidebar)
- Body content
- **SUB-PAGES** section listing direct children as navigable cards

**Explicitly NOT in sidebar:**

- COURSES section (removed — do not show converted courses block)
- All / Mine / Shared tabs
- Inline tag filter dropdown
- Date-based groupings (Previous 7 days, etc.)
- Custom per-note emoji/icons (v1)

---

## Confirmed product decisions

| # | Topic | Decision |
| --- | --- | --- |
| 1 | **Favorites** | Pin = favorite. Favorited notes appear **only** under FAVORITES, **not** duplicated in PRIVATE. Use **per-user** favorites table. |
| 2 | **Hierarchy** | Notes with children via `parent_id`. **Unlimited depth**. No folder entity. |
| 3 | **Workspace** | Section = notes with `visibility = 'team'`. |
| 4 | **Shared with me** | Section = individual grants via `org_note_share` where `visibility ≠ 'team'`. |
| 5 | **Tags** | Filter lives in **search modal** only (triggered by sidebar search click or ⌘K). |
| 6 | **Trash** | Soft delete → Trash view → Restore or Delete forever. |
| 7 | **Courses block** | **Removed** from sidebar entirely. |
| 8 | **Child visibility** | **Must match parent.** Enforced on create, move, and visibility change (cascade to descendants). |
| 9 | **Permissions** | Org members (admin/tutor) can **write** team docs. Students can **read** team/public org docs, **write** only own private notes, **favorite** any readable note. Students cannot add/remove/reorder children on team notes. |
| 10 | **Icons** | Skip custom per-note icons in v1 (generic doc/lock/globe only). |
| 11 | **Branch** | Build on PR **#715** (`cursor/notes-workspace-feedback-6d09`). |
| 12 | **Depth** | Unlimited nesting. |
| 13 | **Templates UI** | **Dedicated page** at `/org/[slug]/notes/templates` — **not** a modal/dialog. |
| 14 | **Built-in templates** | Replace current `NOTE_BUILTIN_TEMPLATES` (blank/TOC/meeting) with **course-structure templates** (see below). |
| 15 | **Template apply** | Creates **parent note + child sub-pages** (modules) using `parent_id` tree — not flat HTML-only content. |
| 16 | **User templates** | Org-saved templates (`is_template`) shown in **"Your templates"** section on the same page (secondary to built-ins). |

---

## User stories

| # | As a… | I want to… | So that… |
| --- | --- | --- | --- |
| 1 | Org admin/tutor | See my notes organized in a tree under Private | I can structure curriculum like Course Outline → modules |
| 2 | Org admin/tutor | Create a sub-page under the current note | Child inherits context and visibility |
| 3 | Org admin/tutor | Publish a note to Workspace (`visibility = team`) | All org members can read it |
| 4 | Org admin/tutor | Edit team docs in Workspace | I can maintain shared handbooks |
| 5 | Org admin/tutor | Share a private note with a specific colleague | They see it under Shared with me |
| 6 | Org admin/tutor | Favorite important notes | I can find them quickly under Favorites |
| 7 | Student | Read Workspace docs | I can access org handbooks |
| 8 | Student | Favorite a team doc | It appears in my Favorites without mutating the note for others |
| 9 | Student | Create my own private notes | I have personal space |
| 10 | Any user | Search notes by title/text and filter by tag in a modal | I can find notes without cluttering the sidebar |
| 11 | Note owner | Delete a note to Trash and restore it | Mistakes are recoverable |
| 12 | Note owner | Permanently delete from Trash | I can free space when sure |

---

## Sidebar section rules

A note appears in **exactly one** primary navigational section. **Favorited notes appear only in FAVORITES**, not duplicated elsewhere.

### FAVORITES

```
profile_id IN org_note_favorite WHERE profile_id = current_user
AND note is readable by current_user
AND deleted_at IS NULL
```

- Collapsible section header
- Ordered by `org_note_favorite.created_at DESC` or note `updated_at DESC`

### PRIVATE

```
owner_id = current_user
AND note_id NOT IN current_user favorites
AND deleted_at IS NULL
AND is_template = false
AND origin = 'workspace'
```

- **Root notes only** (`parent_id IS NULL`) at top level; children nested recursively
- Expand/collapse: localStorage `notes-sidebar-expanded:{orgId}`

### SHARED WITH ME

```
EXISTS org_note_share WHERE profile_id = current_user AND note_id = note.id
AND visibility != 'team'
AND owner_id != current_user
AND deleted_at IS NULL
```

### WORKSPACE

```
visibility = 'team'
AND origin = 'workspace'
AND is_template = false
AND deleted_at IS NULL
```

### Footer

- **Templates** → navigate to **`/org/[slug]/notes/templates`** (full page; sidebar footer item shows **active** state when on this route)
- **Trash** → `/org/[slug]/notes/trash`

**Do not** open `NoteTemplatesBrowser` modal from the footer. Deprecate that component after Templates page ships.

---

## Templates page (dedicated route)

### Purpose

Replace the current `NoteTemplatesBrowser` dialog and minimal built-ins (`blank`, `table_of_contents`, `meeting_notes`, `lesson_plan`) with a **marketing-quality full page** for starting structured course notes. Templates seed the **note hierarchy** (parent + module children), aligning with SUB-PAGES and the sidebar tree.

### Route & layout

| Item | Value |
| --- | --- |
| URL | `/org/[slug]/notes/templates` |
| Svelte route | `apps/dashboard/src/routes/(app)/org/[slug]/notes/templates/+page.svelte` |
| Page component | `apps/dashboard/src/lib/features/notes/pages/note-templates-page.svelte` |
| Shell | Same notes workspace layout: **sidebar stays visible**; main panel shows Templates page |
| Sidebar | Footer **Templates** row highlighted (`bg-primary/10`) when `page.url.pathname` ends with `/notes/templates` |

### Page copy (i18n)

| Key | English default |
| --- | --- |
| `notes.templates.page_title` | Start a new course |
| `notes.templates.page_subtitle` | Pick a template to pre-fill the module structure for the kind of course you're building — everything stays editable after. |
| `notes.templates.use_template` | Use this template |
| `notes.templates.modules_included` | {count} modules included |
| `notes.templates.your_templates_heading` | Your templates |
| `notes.templates.your_templates_description` | Notes you saved as templates for this organization. |
| `notes.templates.your_templates_empty` | Save a note as a template to reuse it here. |

### Built-in course templates (v1)

Ship exactly **six** built-ins in a **responsive 3×2 grid** (3 cols desktop, 2 tablet, 1 mobile). Each card:

| Element | Spec |
| --- | --- |
| Top banner | ~120px tall; **CSS gradient** (unique per template); centered **emoji** (decorative, not per-note icon system) |
| Title | `text-lg font-semibold` |
| Description | 2–3 lines muted body copy |
| Stat | `N modules included` |
| CTA | Full-width or card-footer **Use this template** button |

#### Template catalog

| ID | Title | Emoji | Gradient (example) | Modules | Description (EN) |
| --- | --- | --- | --- | --- | --- |
| `cohort_bootcamp` | Cohort Bootcamp | 🚀 | purple → blue | 4 | A structured, cohort-based sprint — everyone moves through it together, week by week. |
| `self_paced_video` | Self-Paced Video Course | 🎥 | blue → cyan | 5 | Async lessons students move through on their own schedule, wherever they are. |
| `single_workshop` | Single Workshop | 🛠️ | green | 4 | One focused live session — in, hands-on, and out in an afternoon. |
| `semester_course` | Semester Course | 🏛️ | red → yellow → orange | 6 | A full academic term with graded units and a midterm checkpoint. |
| `certification_prep` | Certification Prep | 📝 | teal → blue → purple | 4 | Exam-focused review, organized around a certification blueprint. |
| `blank_course` | Blank Course | ✨ | pink → red | 1 | Start from a single empty module and build the structure yourself. |

#### Module titles per template (child sub-pages)

Define in `apps/dashboard/src/lib/features/notes/utils/note-course-templates.ts` (replaces `note-builtin-templates.ts`):

**cohort_bootcamp** (4):

1. Week 1 — Kickoff & Goals
2. Week 2 — Core Skills
3. Week 3 — Projects
4. Week 4 — Demo & Retrospective

**self_paced_video** (5):

1. Introduction & Setup
2. Module 1 — Foundations
3. Module 2 — Practice
4. Module 3 — Advanced Topics
5. Wrap-up & Next Steps

**single_workshop** (4):

1. Pre-work
2. Session — Part 1
3. Session — Part 2
4. Follow-up & Resources

**semester_course** (6):

1. Unit 1
2. Unit 2
3. Midterm Review
4. Unit 3
5. Unit 4
6. Final Project

**certification_prep** (4):

1. Domain 1 — Core concepts
2. Domain 2 — Applied skills
3. Practice exams
4. Exam day checklist

**blank_course** (1):

1. Module 1

Parent note gets optional intro `content` HTML (short placeholder paragraph). Children start with empty or minimal placeholder body.

### Apply template flow

1. User clicks **Use this template** on a card.
2. **API** `POST /notes/from-course-template` with `{ templateId: string }` (or extend `POST /notes` with `courseTemplateId`).
3. Server **in one transaction**:
   - Create root note: `title` from template, `parent_id = null`, `visibility = private` (or org default), `owner_id = current user`
   - Create N child notes: `parent_id = root.id`, `sort_order = 0..N-1`, titles from template module list, same `visibility` as parent
4. Navigate to **`/org/[slug]/notes/[rootNoteId]`** — editor shows parent body + **SUB-PAGES** block with children.
5. Sidebar **PRIVATE** shows expandable parent with module children (per tree rules).

**Permissions:** Org admin/tutor only for built-in course templates. Students use Templates page only if product later allows — **v1: admin/tutor only** (same as workspace note creation limits).

### Your templates section (org-saved)

Below the built-in grid, optional section **Your templates**:

- Lists notes where `is_template = true` for the org (existing `GET /notes/templates` API).
- Card style: simpler than built-ins (no gradient hero required); title + preview + **Use this template**.
- **Use** calls existing `POST /notes/from-template` — copies template note tree (if template has children, copy entire subtree).
- **Save as template** remains in editor ⋮ menu (`convert-to-template`); saved templates appear here.

### What to remove / deprecate

| Current | Action |
| --- | --- |
| `NoteTemplatesBrowser.svelte` (Dialog modal) | Remove after Templates page ships |
| `NOTE_BUILTIN_TEMPLATES` in `note-builtin-templates.ts` | Replace with `NOTE_COURSE_TEMPLATES` |
| Sidebar "Browse templates" in filter area | Already removed in sidebar redesign |
| `notes-workspace-page.svelte` modal binding | Remove `showTemplatesBrowser` |
| Empty page picker → Templates option | Navigate to `/notes/templates` instead of opening modal |

### Empty page picker

When user picks **Templates** from new-note empty state → `goto(/org/[slug]/notes/templates)` instead of modal.

---

## Data model

All in **`packages/db/src/migrations/0005_notes.sql`**.

### Extend `org_note`

```sql
"parent_id" uuid REFERENCES org_note(id) ON DELETE CASCADE,
"sort_order" integer DEFAULT 0 NOT NULL
-- INDEX (parent_id, sort_order)
-- INDEX (organization_id, parent_id)
```

### `org_note_favorite`

```sql
CREATE TABLE "org_note_favorite" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "profile_id" uuid NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
  "note_id" uuid NOT NULL REFERENCES org_note(id) ON DELETE CASCADE,
  "created_at" timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE ("profile_id", "note_id")
);
```

Migrate: `INSERT INTO org_note_favorite SELECT owner_id, id, updated_at FROM org_note WHERE is_pinned = true ON CONFLICT DO NOTHING;`

### `org_note_share`

```sql
CREATE TYPE "note_share_permission" AS ENUM('read', 'write');
CREATE TABLE "org_note_share" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "note_id" uuid NOT NULL REFERENCES org_note(id) ON DELETE CASCADE,
  "profile_id" uuid NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
  "shared_by" uuid NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
  "permission" "note_share_permission" DEFAULT 'read' NOT NULL,
  "created_at" timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE ("note_id", "profile_id")
);
```

---

## Access control

**Fix:** `access.ts` must allow **admin/tutor write** on `visibility = team` notes (not owner-only today).

### Read

| Condition | Read |
| --- | --- |
| Owner | Yes |
| `visibility = team` + org member | Yes (incl. students) |
| `visibility = public` | Yes |
| `org_note_share` grantee | Yes |
| Else | 404 |

### Write

| Condition | Write |
| --- | --- |
| Owner | Yes |
| Team + `isOrgTeamRole` | Yes |
| Share `permission = write` | Yes |
| Student on team note | No |

### Visibility inheritance

- Create child: inherit parent visibility
- Private sub-page: `owner_id = creator`
- Team sub-page: `owner_id = parent.owner_id`
- PATCH visibility: cascade to descendants
- Move: reject visibility mismatch; reject cycles

---

## API

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/notes/sidebar` | Flat list with parentId, sortOrder, isFavorited, canWrite |
| POST | `/notes` | + `parentId` |
| PATCH | `/notes/:id` | + `parentId`, `sortOrder` |
| PUT | `/notes/:id/visibility` | Cascade to children |
| POST/DELETE | `/notes/:id/favorite` | Per-user |
| GET/PUT | `/notes/:id/shares` | Individual grants |
| GET | `/notes/trash` | Owned deleted notes |
| POST | `/notes/:id/restore` | Clear deleted_at |
| DELETE | `/notes/:id/permanent` | Hard delete |
| GET | `/notes/:id` | Include `children[]` for SUB-PAGES |
| POST | `/notes/from-course-template` | `{ templateId }` → creates parent + module children atomically |
| GET | `/notes/templates` | Existing — org-saved templates for "Your templates" section |

### `POST /notes/from-course-template`

Request:

```ts
{ templateId: 'cohort_bootcamp' | 'self_paced_video' | ... }
```

Response:

```ts
{
  rootNote: NoteListItem,
  children: NoteListItem[]
}
```

Implementation: template definitions live in **`packages/core`** or **`packages/utils`** (shared catalog); API imports module title list and creates rows. **Do not** store built-in templates in DB.

---

## Dashboard files

| Component | Path |
| --- | --- |
| Sidebar (refactor) | `apps/dashboard/src/lib/features/notes/components/note-list-sidebar.svelte` |
| New | `note-sidebar-*.svelte`, `note-search-modal.svelte`, `note-subpages.svelte` |
| Utils | `utils/note-tree-utils.ts` |
| Trash route | `routes/(app)/org/[slug]/notes/trash/+page.svelte` |
| **Templates page** | `routes/(app)/org/[slug]/notes/templates/+page.svelte` |
| **Templates UI** | `pages/note-templates-page.svelte`, `components/note-template-card.svelte` |
| **Template catalog** | `utils/note-course-templates.ts` (replaces `note-builtin-templates.ts`) |
| API | `api/notes.svelte.ts` |
| DB | `packages/db/src/queries/notes/{note,favorite,share}.ts` |
| Access | `apps/api/src/services/notes/access.ts` |

### Visual

- `w-72`; blue active row (`bg-primary/10`); uppercase collapsible sections; `pl-4` per tree depth

### Remove

- All/Mine/Shared tabs, inline tag filter, date buckets, COURSES block

### Search modal

- Sidebar search + `⌘K`; text + tags; see `content-ask-ai-bar.svelte` for shortcut pattern

### SUB-PAGES (editor)

- Child cards + "New sub-page" when `canWrite`

---

## Phases

1. **Schema + access** (2–3d)
2. **API** (2–3d)
3. **Sidebar UI** (2–3d)
4. **SUB-PAGES** (1–2d)
5. **Search modal** (1–2d)
6. **Share picker** (1–2d)
7. **Templates page** (2–3d) — built-in grid, apply API, Your templates section, remove modal

---

## Trash behavior (confirmed)

1. Delete → sets `deleted_at` → note leaves sidebar → appears in **Trash**
2. **Restore** → clears `deleted_at`
3. **Delete forever** → hard delete from DB

Trash v1: **owned notes only**.

---

## Test plan

- [ ] Tree unlimited depth; visibility inherit/cascade
- [ ] Admin writes team note; student read-only
- [ ] Favorites deduped from Private
- [ ] Individual share → Shared with me
- [ ] Trash restore + permanent delete
- [ ] Search modal + tags
- [ ] SUB-PAGES
- [ ] No tabs, no COURSES
- [ ] Templates page: all 6 built-ins render with gradients
- [ ] Use template → parent + N children in PRIVATE tree
- [ ] Navigate to root note after apply
- [ ] Your templates section lists org templates
- [ ] `NoteTemplatesBrowser` modal removed
- [ ] Sidebar Templates footer highlights on `/notes/templates`

---

## Agent handoff

1. Branch: `cursor/notes-workspace-feedback-6d09`
2. Read: `note-list-sidebar.svelte`, `access.ts`, `0005_notes.sql`
3. Phases 1–6 in order; **no** `0006` migration
4. Test: `admin@test.com` / `udemy-test`

---

## Changelog

| Date | Change |
| --- | --- |
| 2026-07-19 | Initial PRD |
| 2026-07-19 | Added Templates page spec (course-structure built-ins, replaces modal) |
