# Course Templates PRD

## Status

- Draft (rewrite of the March 2026 draft: manual sync, convert vs save, a Docs-style template row and gallery, and ClassroomIO global templates)

## Prototypes — the UX source of truth

The UX for this feature lives in the prototype folder. When this document and a prototype disagree on a UI detail, **the prototype wins** and this document should be updated.

```
prototypes/course-templates/index.html
```

| Surface | Files |
| --- | --- |
| Courses page: "Create a new course" template row, course grid, empty state | `courses.html` |
| Template gallery (`/org/[slug]/courses/templates`) + template preview | `templates.html` |
| Save as template / convert (one dialog) | `save-as-template.html` |
| A template, opened (same as a course) | `template.html` |
| Linked course · Content: updates alert | `course-content.html` |
| Linked course · Settings: Template section + review sheet | `course-settings.html` |

## Design principle

Google Docs / Slides template gallery, kept minimal. Reference: the Docs and Slides home screens ("Start a new document" row of small template cards above the list; "Template gallery" opens a full page of sections).

- The **courses page** keeps the app nav bar but drops its title/subtitle header; a **Create a new course** row of small cards sits on top, the course grid below. Template cards are deliberately smaller and carry less content than course cards.
- The **Template gallery** is one page of stacked sections — no tabs.
- Clicking any template opens a **preview**; nothing is created until **Use template**.
- The course **⋯ menu** gains **Save as template…**.
- A linked course shows an `Alert` on its Content page when its template has changed; syncing happens from a **Template** section in course Settings.
- A template opened in the editor looks exactly like a course.

## Purpose

Let an org turn any course into a reusable template, start new courses from it, and — when the template improves later — pull selected changes into courses made from it. Pulling is manual and selective: a template never changes a course on its own.

## Problem Statement

- The only reuse today is Clone, which makes an unlinked copy; improvements to the original never reach the copies.
- Orgs running the same course for many clients or cohorts fix a typo or add a lesson once per copy.
- There is no way to mark a course as a blueprint, so blueprints sit among live courses and can be published by mistake.
- `course.is_template` exists but defaults to `true` on every course and is read nowhere.
- New orgs start from an empty courses page with no example of what a good ClassroomIO course looks like, so features like the AI tutor, compliance renewals and public courses go undiscovered.

## Confirmed Decisions

1. **A template is a course with `is_template = true`.** It is edited in the normal course editor, has no students, cannot be published, and never appears on public or learner surfaces.
2. **`is_template` is reused.** Backfill every row to `false` and change the default to `false` in the same migration.
3. **Two ways to make a template, one dialog.** From a course's ⋯ menu → **Save as template…**:
   - **Save a copy as template** — the course stays as it is; a template copy is created.
   - **Convert this course** — the course itself becomes a template. Only allowed when it has no students.
   There is no "new blank template" entry point: to build a template from scratch, create a course and convert it.
4. **Starting a course happens in the template row.** The courses page loses its `Page.Header` (title/subtitle); the app nav bar stays. The top band **Create a new course** holds a **Blank course** card (opens today's new-course modal) and small template cards, with **Template gallery** on the right. There is no separate Create Course button or combo button.
5. **Only courses created from a template are linked.** Clone stays an unlinked copy.
6. **Copy the latest content only.** Creating from a template copies each lesson's current content per locale, not its version history.
7. **Sync is a manual pull with checkboxes, started from course Settings.** A linked course shows an alert when the template has changes. The review sheet lists every change — content and course settings — as a checkbox. **Every checkbox is off by default**; the admin ticks what to pull.
8. **Change detection uses timestamps, not hashes.** Each copied lesson, exercise and section remembers when it was last pulled. A template item changed if it was edited after that; the course's copy was edited locally if *it* was edited after that (shown as a warning, not blocked).
9. **Sync only adds and updates. It never deletes.** Items removed from the template stay in linked courses.
10. **Exercises with any submission are frozen.** They appear in the review sheet as locked and cannot be pulled. Lessons are always updatable, including completed ones, and are never deleted.
11. **Course settings are pullable** (off by default, like everything else). Identity and audience settings are never synced: title, course link/slug, published state, course type, tags, students, cohorts/sessions, and landing-page reviews.
12. **No undo and no detach.** The review sheet is the safeguard; lesson version history still records every pulled lesson. Ignoring the alert is the same as detaching.
13. **Plan limit:** free plan (`BASIC`) orgs can have **1 template**; more requires an upgrade. Marketplace imports (see `prd/marketplace`) count toward it.
14. **Admins only** can save/convert, create from template, and pull updates.
15. **Compliance courses** get no special handling.
16. **Deleting a template** leaves linked courses intact; their Template section says the template was deleted.
17. **Template gallery** lives at `/org/[slug]/courses/templates` and follows the standard page structure: page title and subtitle, a body header with search on the right, then one grid. No tabs, no sections, no categories.
18. **Click → preview.** Clicking a template (row or gallery) opens a preview dialog; **Use template** asks only for a course name, then creates and opens the course.
19. **Templates are not in the course grid.** They live in the row and the gallery only; no Template filter chip and no template card style in the grid.
20. **ClassroomIO global templates.** A template course flagged `public_for_all` in the platform org (id in env `PLATFORM_TEMPLATES_ORG_ID`) is offered to every org. The flag is set in the database only — no UI or API writes it. Content is authored in that org through the normal dashboard, so edits show up for everyone immediately.
21. **Seeding.** When `PLATFORM_TEMPLATES_ORG_ID` is set, the jobs app seeds that org once (idempotent) with the launch templates, on cloud and self-hosted. It never overwrites existing content.
22. **Global templates sync like org templates.** Courses created from a global template are linked and can pull later edits through the same Settings → Template flow, across orgs.
23. **Global templates don't count** toward an org's template limit, and other orgs can't edit or delete them.
24. **Four launch templates**, each built to show off different ClassroomIO features: Customer onboarding, Product training, Free lead-gen mini course, Annual compliance training (see Launch templates).
25. **The empty state points to templates.** With no courses, the grid area says to pick a template and links to the gallery.
26. **The org's own templates come first, everywhere.** ClassroomIO templates are the default set; as an org creates or imports its own, those are listed first (most recently used, then newest) in both the row and the gallery, and ClassroomIO templates follow. The row shows **Blank course + up to 5 templates**: the org's own fill the slots first, and ClassroomIO templates fill whatever is left.

## Current-State Audit

| Capability | Current state | Notes |
| --- | --- | --- |
| `course.is_template` | Exists, defaults to `true`, never read | Backfill to `false`, default `false`. |
| Clone | `apps/api/src/services/course/clone.ts` deep-copies sections, lessons, lesson languages, exercises, exercise sections, questions, options | No link to the source. Reused for create-from-template with an options object. |
| Courses page header | `routes/(app)/org/[slug]/courses/+page.svelte`: `Page.Header` with title "Courses", subtitle, and `CreateCourseButton` in `Page.Action`; toolbar (search, filter, view toggle) in `Page.BodyHeader` | Header removed; replaced by the template row. The toolbar stays above the grid under a "Your courses" heading. |
| Create Course button | `features/course/components/create-course-button.svelte` — opens `new-course-modal.svelte` via `?create=true` | Replaced on this page by the **Blank course** card, which opens the same modal (`?create=true` keeps working). The empty state's button becomes **Browse templates**. |
| Course ⋯ menu | `course-context-menu-content.svelte`: View course site / Publish course, Clone, Share, Invite, Delete | Add "Save as template…" after Clone. |
| Course settings | `features/course/pages/settings.svelte`: `SettingsCard` sections General, Course type, Content, Access, Delete | Add a `Template` section on linked courses. |
| Alert | `@cio/ui/base/alert` (`default`, `destructive`, `warning`, `information`) | Used for the Content-page alert and inside the Template section. |
| Course card | `@cio/ui/custom/course-card`: 200px banner, type badge, title, description, tags, publish badge, counts | Unchanged. Template cards are a new, smaller `template-card` (thumbnail + title + one muted line). |
| Courses empty state | `courses.svelte`: `Empty` "No Courses Created" + `CreateCourseButton` | Copy points to templates; button **Browse templates** → gallery. |
| Jobs app | `apps/jobs` BullMQ worker; env in `apps/jobs/src/config/env.ts` | Adds a one-off seed step for the platform templates org. |
| Course header | `course-header.svelte`: active nav label, Public/Published badges, Assistant, [View Course Site \| ⋯] | Unchanged for templates except a Template badge in the Published badge slot. |
| `updated_at` | Bumped on `course_section`, `lesson`, `exercise`, `exercise_section` updates; **not** on `question`/`option` updates or lesson/exercise section moves | Sync needs every content write to bump it (implementation phase 1). |
| `lesson_language` | No timestamps | Add `updated_at`. |
| Deletes | Lessons, sections, exercises are hard-deleted; courses soft-delete via `status = 'DELETED'` | A lesson deleted locally shows up again as "New" in review (unchecked). |
| Submissions | `submission.exercise_id` | "Frozen" = at least one `submission` row for the exercise. |
| Naming | `exercise_template` table and `queries/template/template.ts` already exist | Use `course-template` in file names. |

## Product Goals

1. Any admin can turn a course into a template in two clicks, keeping or converting the original.
2. Creating a course from a template takes one click to preview and one name field.
6. Every new org sees four polished ClassroomIO templates that demonstrate the product's distinctive features.
3. A linked course tells its admins when its template changed, and lets them pull exactly the changes they want.
4. Pulling never removes content and never touches graded work.
5. Nothing new appears in the UI for orgs that don't use templates.

## Non-Goals (v1)

- Automatic or scheduled sync; pushing from the template to all linked courses.
- Deleting items via sync; syncing reorders or moves between sections.
- Side-by-side diffs of lesson content (the sheet links to the template's version instead).
- Undo of a pull; detaching a course.
- Org-defined template categories and template search (the gallery is small enough to scan); org-to-org sharing (see `prd/marketplace`).
- A UI for flagging templates `public_for_all`, or for choosing which global templates an org sees.
- Hiding the template row.
- Syncing into exercises that have submissions.

## Functional Requirements

### 1. Courses page (`courses.html`)

- **The app nav bar (`AppHeader`: sidebar trigger, breadcrumbs, setup progress, Open Academy, Search, notifications) stays unchanged.** Only the page's `Page.Header` (title "Courses" and subtitle) is removed. Under the nav bar, the page opens with a full-width muted band:
  - Left: **Create a new course**. Right: **Template gallery** (text button with an up/down chevron icon) → `/org/[slug]/courses/templates`.
  - A row of 6 small cards (horizontal scroll on narrow screens): **Blank course** first (a plus on an empty thumbnail; opens the existing new-course modal), then up to 5 templates in the order from Confirmed Decision 26. With 5 or more own templates, no ClassroomIO template shows in the row; they stay one click away in the gallery.
  - **Template card** (smaller than a course card, deliberately light): 16:10 thumbnail (the template's cover image), title (one line, truncated), one muted line — "by ClassroomIO" for global templates, "Your template · Used Sep 20" for the org's own. The course-type badge sits bottom-left on the image, exactly as on course cards (Self paced, Live class, Compliance, Public). No counts, tags, publish badge or footer. Clicking opens the preview (section 2).
- Below the band: **Your courses** heading with the existing toolbar on the right (Find Course, filter, grid/list toggle), then the unchanged course grid. Templates never appear in it.
- **Empty state** (no courses): the band stays — for a new org with no templates of its own it shows Blank course plus the ClassroomIO templates; the grid area shows `Empty` — title "No courses yet", description "Pick a template to see what a great ClassroomIO course looks like, or start from a blank course.", button **Browse templates**.
- A normal course's ⋯ menu gains **Save as template…** after Clone.

### 2. Template gallery and preview (`templates.html`)

- Route `/org/[slug]/courses/templates`, inside the normal app shell (sidebar + app nav bar, breadcrumbs "Courses / Template gallery"). Same page structure as other dashboard pages (`@cio/ui/base/page`):
  - `Page.Header`: title **Template gallery**, subtitle "Start a course from one of your templates or one built by ClassroomIO."
  - `Page.BodyHeader` aligned right: a **scope filter** (`@cio/ui/base/select`: All templates · My templates · ClassroomIO) beside the **Find template** search (filters by title as you type). Both combine and are kept in the URL (`?scope=org&q=…`).
  - My templates with none: "You haven’t made any templates yet. Save any course as a template from its ⋯ menu." ClassroomIO hides the Blank course card.
  - `Page.Body`: one grid of template cards — **Blank course** first, then the org's own templates, then ClassroomIO templates (Confirmed Decision 26). No sections, no category headings.
- Own templates' cards have a ⋯ menu: Open, Duplicate, Delete. ClassroomIO cards have none.
- Search hides Blank course and shows "No templates match “…”" when nothing matches.
- With no own templates, the grid is Blank course followed by the ClassroomIO templates.
- **Preview dialog** (opens from any template card, in the row or the gallery; URL `?preview=<id>` so it's linkable):
  - Left: cover image and the section → lesson/exercise outline (icons by type; exercise question counts).
  - Right: title, "by ClassroomIO" or "Your template", course-type badge, the description, a **Shows off** list for global templates (e.g. "AI tutor in hint-only mode", "Certificate on completion") with a short line each, and counts ("4 sections · 14 lessons · 5 exercises").
  - Footer: **Course name** field (prefilled with the template title) and **Use template**. For the org's own templates, also **Open template** (secondary).
  - Use template → creates the course (linked to the template), shows "Copying…", then opens `/courses/{id}/lessons` with a toast "Course created from ‹Template›".
- The new course inherits the template's type, description and settings, is unpublished, and has no students.

### 3. Save as template (`save-as-template.html`)

- Dialog with two options (radio):
  - **Save a copy as template** (default) — "‹Course› stays as it is."
  - **Convert this course** — "‹Course› becomes a template. It stops being a course you can publish." Disabled when the course has students: "Has 42 students — save a copy instead."
- Name field only for the copy option (prefilled "‹Course›").
- At the plan limit: the dialog body is replaced by "Your plan includes 1 template" with Upgrade and "Manage templates" (opens the gallery).
- Converting a published course unpublishes it; the dialog says so.

### 4. A template, opened (`template.html`)

- **Identical to a normal course.** Same shell, header, content page and editors. The only differences:
  - The header shows a **Template** badge in the slot where the Published badge sits.
  - The sidebar omits sections that need students: People, Analytics, Submissions, Marks (Attendance and Compliance already depend on course type).
  - Settings omits Publish and enrollment access.
  - The existing ⋯ menu gains **Create course from template**.

### 5. Linked course — updates (`course-content.html`, `course-settings.html`)

- **Alert on Content:** when the template has changes, the Content page shows `@cio/ui/base/alert` (`variant="information"`): title "Template has 6 updates", description "Customer Onboarding Academy changed since you last pulled on Sep 12. Review in settings" linking to `settings#template`. No alert when up to date.
- **Template section in Settings** (`SettingsCard id="template"`, placed after Access and before Delete; only on linked courses): template thumbnail and name (links to the template), "Last pulled ‹date›", and a secondary **Review updates** button. Below it, an information `Alert` "6 updates available — 3 lessons, 1 exercise and 2 settings changed…". States: up to date ("Up to date with the template.", no button) and template deleted (default `Alert`: "…This course keeps all its content; there's nothing left to pull.").
- **Syncing only starts here.** There is no sync entry in the course ⋯ menu or on course cards.
- **Review sheet** (right side sheet), grouped under plain headings with "Select all" per group:
  - **Content** — rows per section / lesson / exercise, each with a checkbox, a `New` or `Updated` tag, the item name and where it lives ("Lesson · 2. Set up your account"). Updated lessons show what changed in one muted line ("Content · French added").
  - **Settings** — one row per changed setting, "Template: Sequential · Yours: Free".
  - **Locked rows** (exercise with submissions): disabled checkbox, "12 submissions — can't be updated".
  - **Edited locally** rows: amber line "You edited this on Sep 20 — pulling replaces your changes."
  - **Removed locally** new rows: "You deleted this from your course."
- **Parent dependencies:** ticking a New lesson or exercise whose section (or lesson) is also New ticks that parent too, with a muted line "Also adds section ‹name›". Unticking a New parent unticks its New children. The service enforces the same rule.
- Footer: "3 selected" and **Pull 3 changes** (disabled at 0). After pulling: toast "Pulled 3 changes from Customer Onboarding Academy", "Last pulled" updates, pulled rows disappear and unselected ones stay for next time.

### 6. ClassroomIO global templates

- Shown to every org in the row and the gallery after the org's own templates, marked "by ClassroomIO".
- Preview and **Use template** work the same as for org templates. The resulting course lives in the user's org and links to the global template.
- Other orgs can't open a global template in the editor, duplicate it as a template, or delete it. The preview is the only view.
- The platform team edits global templates by signing in to the platform org like any admin. Title, description, cover and content changes show in every org's gallery right away, and linked courses see them as pullable updates.

## Launch templates

Four global templates ship with the feature. Each is a real, usable course (no lorem ipsum) and a guided tour of what ClassroomIO can do. Every one starts with a locked lesson, **How this template is built** (`is_unlocked = false`, so learners never see it). It lists each feature the template uses and where to find it ("Student progression → Settings › Content"), and tells the admin to delete it before publishing.

### 1. Customer Onboarding Academy — Self paced

- **For:** SaaS and product teams onboarding new customers.
- **Preset:** sequential progression; content grouping on; lesson comments on; AI tutor on (friendly persona, hint-only during exercises, grounded in the course); certificate at 100% completion with final-exercise minimum score 80%; landing page filled in; welcome email; self-enrollment on.
- **Outline:**
  1. Welcome aboard — "Why you're here, in two minutes", "How this academy works", "Meet your success team"; exercise *Quick check* (RADIO, TRUE_FALSE).
  2. Set up your account — "Create your workspace", "Connect your data", "Roles and permissions"; exercise *Setup checklist* (CHECKBOX, ORDERING: put the setup steps in order).
  3. Your first workflow — "The core loop", "Shortcuts that save hours", "Common mistakes"; exercises *Scenario quiz* (MATCHING, FILL_BLANK) and *Prove it* (LINK: paste a link to the first thing you built; FILE_UPLOAD alternative).
  4. Bring your team — "Inviting teammates", "Where to get help"; exercise *Final review* (final exercise) and *How did we do?* (STAR, THUMBS).
- **Shows off:** sequential progression, AI tutor in hint-only mode, eight question types including proof-of-work answers, certificate rules, landing page, welcome email.

### 2. Product Training: Power User Path — Self paced

- **For:** existing customers, internal teams or partners going deeper than onboarding.
- **Preset:** free progression; AI tutor Socratic persona; lesson download on; lessons in English and French (shows translations); manual grading on.
- **Outline:**
  1. Pick your path — exercise *Which describes you?* with exercise sections that branch (`go_to_section`) to an Admin or an Analyst track.
  2. Admin track — "Permissions at scale", "Single sign-on and provisioning", "Audit logs"; exercise *Find it* (HOTSPOT on a settings screenshot).
  3. Analyst track — "Building advanced reports", "Automations"; exercise *Crunch the numbers* (NUMERIC, WORD_BANK).
  4. Show what you know — exercise *Record a walkthrough* (VIDEO_RECORDING, 90 seconds, tutor-graded) and *Case study* (TEXTAREA, tutor-graded with feedback).
- **Shows off:** branching exercise sections, multi-language lessons, video-recording and hotspot questions, tutor grading in Submissions and Marks, Socratic AI tutor.

### 3. Customer Education 101 (free mini course) — Public

- **For:** lead generation: a free, no-signup course that brings prospects in and ends with a call to action.
- **Preset:** Public course type (no signup, SEO-indexable pages, editable per-lesson slugs); callout "Book a demo" with button URL placeholder; copy-as-Markdown on; landing page filled in.
- **Outline:** five short lessons — "Why customers stop using products", "Map the first-week journey", "Write lessons people finish", "Measure what matters", "Turn learners into advocates" — each followed by a 3-question auto-graded quiz (RADIO, TRUE_FALSE, CHECKBOX; public courses allow auto-graded types only). The last lesson ends on the callout.
- **Shows off:** public courses, SEO slugs, callout CTA, copy-as-Markdown, course widget embed (the builder notes explain how to embed it on a website).

### 4. Annual Security & Privacy Awareness — Compliance

- **For:** HR and IT teams that must train every employee every year.
- **Preset:** Compliance course type; renewal every 12 months; completion deadline 30 days after assignment; retakes allowed; reminders on; final-exercise minimum score 80%; certificate with renewal date.
- **Outline:**
  1. Why this matters — one short lesson with a real-incident story.
  2. Spotting phishing — lesson + exercise *Spot the red flags* (HOTSPOT on an email screenshot).
  3. Passwords and multi-factor authentication — lesson + TRUE_FALSE check.
  4. Handling customer data — lesson + exercise *Classify it* (MATCHING data types to handling rules).
  5. Reporting an incident — lesson + ORDERING (put the reporting steps in order).
  6. Final assessment — 10 auto-graded questions (final exercise) and *Policy attestation* (CHECKBOX "I have read and agree to the acceptable-use policy").
- **Shows off:** compliance renewals, deadlines, retakes and reminders, attestation, compliance reporting, certificates with renewal dates.

### Template backlog (brainstorm)

| Template | Course type | Why it's interesting |
| --- | --- | --- |
| Employee Onboarding: First 30 Days | Self paced | Pairs with Programs; week-by-week sections; manager sign-off via FILE_UPLOAD |
| Partner Certification | Self paced | Final exam with minimum score, certificate, lesson download for offline study |
| Sales Pitch Practice | Self paced | VIDEO_RECORDING pitch answers graded by a tutor with feedback |
| Live Cohort Bootcamp (4 weeks) | Live class | Scheduled sessions, attendance, newsfeed, weekly graded projects |
| Monthly Webinar Series | Live class | Session reminders, recordings added as lessons after each session |
| Harassment Prevention | Compliance | Scenario branching with exercise sections, annual renewal |
| HIPAA Essentials | Compliance | Attestation, deadlines, audit-ready certificates |
| IELTS Writing Task 2 | Self paced | TEXTAREA essays with tutor feedback, band rubric in lessons, AI tutor hint-only |
| Conversational Spanish A1 | Self paced | Multi-language lessons, audio, WORD_BANK and FILL_BLANK drills |
| Release Notes Micro-course | Public | Short public lessons per release; widget embed in the product |
| Support Agent Certification | Self paced | Macros and SOPs as lessons, ORDERING and MATCHING checks |
| Course Feedback Survey | Self paced | STAR, THUMBS and TEXTAREA only; shows exercises as forms |

## Technical Design

### Data model (one migration)

```ts
// course
isTemplate: boolean('is_template').default(false).notNull(),          // backfilled to false
templateId: uuid('template_id').references((): AnyPgColumn => course.id, { onDelete: 'set null' }),
publicForAll: boolean('public_for_all').default(false).notNull(),   // set in the DB only; never in any Zod schema or update query

// course_section, lesson, exercise (the three sync units)
sourceId: uuid('source_id'),                 // the template row this was copied from; FK to the same table, on delete set null
sourceSyncedAt: timestamp('source_synced_at', { withTimezone: true, mode: 'string' }),

// template_highlight (the "Shows off" list in the preview; authored per template)
export const templateHighlight = pgTable('template_highlight', {
  id: uuid().defaultRandom().primaryKey(),
  courseId: uuid('course_id').notNull().references(() => course.id, { onDelete: 'cascade' }),
  position: integer().notNull(),
  title: varchar({ length: 80 }).notNull(),
  description: varchar({ length: 200 })
});

// course_template_setting_sync (one row per setting a linked course has pulled)
export const courseTemplateSettingSync = pgTable('course_template_setting_sync', {
  courseId: uuid('course_id').notNull().references(() => course.id, { onDelete: 'cascade' }),
  settingKey: varchar('setting_key').notNull(),          // a SYNCABLE_SETTINGS key
  syncedAt: timestamp('synced_at', { withTimezone: true, mode: 'string' }).notNull()
}, (table) => [primaryKey({ columns: [table.courseId, table.settingKey] })]);

// lesson_language
updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
```

```sql
UPDATE course SET is_template = false;
ALTER TABLE course ALTER COLUMN is_template SET DEFAULT false;
CREATE INDEX course_template_id_idx ON course(template_id) WHERE template_id IS NOT NULL;
CREATE INDEX lesson_source_id_idx ON lesson(source_id) WHERE source_id IS NOT NULL;
-- same partial index for course_section.source_id and exercise.source_id
```

`sourceId` lives only on the three sync units. Exercise sections, questions and options are pulled together with their exercise; lesson languages together with their lesson (matched by locale).

Computed values are never stored: "Used by N", update counts, and "last pulled" per course are aggregated at read time.

### Change detection

```
changedAt(lesson)   = max(lesson.updated_at, max(lesson_language.updated_at))
changedAt(exercise) = max(exercise.updated_at, its exercise_section/question/option updated_at)
changedAt(section)  = section.updated_at

for each template unit T in course.templateId:
  C = unit in this course with sourceId = T.id
  if no C                                  → New   (flag "removed locally" if C was deleted: T.created_at <= course.created_at)
  elif changedAt(T) > C.sourceSyncedAt     → Updated
      editedLocally = changedAt(C) > C.sourceSyncedAt
      locked        = C is exercise and exists(submission where exercise_id = C.id)

settings: for each SYNCABLE_SETTINGS key K
          syncedAt = course_template_setting_sync(course, K).synced_at ?? course.created_at
          if template.updated_at > syncedAt and template[K] != course[K] → row K
```

Skipped rows keep their old `sourceSyncedAt` (units) or have no newer `course_template_setting_sync` row (settings), so they stay in the list until pulled. Settings are tracked per key for this reason: one shared timestamp would hide every skipped setting after any pull. Template units deleted in the template are ignored.

`SYNCABLE_SETTINGS`: description, cover image, welcome email, completion deadline, minimum completion %, final exercise (+ minimum score; the exercise id is mapped through `sourceId`), lessons tab order, content grouping, student progression, lesson comments, self-enrollment, Markdown export, lesson/course download, landing page (requirements, description, goals, skills/tools, instructor, pricing), certificate design and rules, AI tutor overrides. Never synced: see Confirmed Decision 11.

### Pull

```
pullTemplateChanges(courseId, { unitIds, settingKeys }, actor):
  assert actor is ADMIN; course.templateId not null
  now = new Date()
  tx:
    add missing parents: a selected New unit whose template parent (section for a lesson; section or lesson for an exercise) is also New and unselected pulls that parent in too
    for each selected unit, parents first (re-run detection inside tx; reject locked or stale selections)
      New section  → insert after the course copy of its preceding template section, else last
      New lesson/exercise → insert into the course copy of its template parent, after its preceding sibling's copy, else last
      Updated lesson    → overwrite lesson fields + upsert lesson_language per locale (records a lesson version)
      Updated exercise  → overwrite exercise fields; replace its exercise sections, questions, options (safe: no submissions)
      Updated section   → overwrite title
      set sourceId, sourceSyncedAt = now, updatedAt = now
    for each selected setting K → copy the value; upsert course_template_setting_sync(course, K, synced_at = now)
  after commit: invalidate course caches
```

Setting `updatedAt = now` together with `sourceSyncedAt = now` keeps pulled rows from reading as "edited locally".

### Global templates

- **Config:** `PLATFORM_TEMPLATES_ORG_ID` in `@cio/core/config/env` (read by `apps/api` for listing and access) and `apps/jobs/src/config/env.ts` (read for seeding). Unset → no global templates anywhere.
- **What counts as global:** `is_template = true AND public_for_all = true AND status = 'ACTIVE'` **and** the course belongs to `PLATFORM_TEMPLATES_ORG_ID`. Both conditions are required, so a stray flag in a customer org does nothing.
- **Access rule** (`canUseTemplate(template, orgId)`): the template is in `orgId`, or it is global. Preview, create-from, update detection and pull all go through it. Only the platform org's own admins can open a global template in the editor.
- **Seeding** (`apps/jobs/src/services/platform-templates/seed.ts`, run once at worker boot behind a Redis lock): if the env var is set, upsert the organization row with that id ("ClassroomIO", siteName `classroomio-templates`). Then, for each launch template fixture in `packages/db/src/utils/seed/platform-templates/*.ts`, insert it with `is_template = true` and `public_for_all = true` **only if** no course in that org already has the fixture's `slug`. Existing courses are never updated, so dashboard edits survive every deploy.
- **Media:** fixture images upload to the platform org's media on first seed. The platform org's assets must not be deleted while a global template uses them; `deleteAssetService` refuses assets with usages in global templates.

### Create from template / save / convert

- **Create from template:** assert `canUseTemplate`; `cloneCourse(templateId, { organizationId, isTemplate: false, publicForAll: false, templateId, setSourceIds: true, now })` — every copied section/lesson/exercise gets `sourceId` and `sourceSyncedAt = now`. No setting-sync rows are written; `course.created_at` is the settings baseline. For a **global** template (another org), lesson `teacherId` is set to `null` and lesson `callUrl` is cleared, so no platform-org user or meeting link is copied into the customer's org.
- **Save a copy as template:** `cloneCourse(courseId, { isTemplate: true, isPublished: false })`, no students, no source links.
- **Convert:** assert no group members with the STUDENT role; `is_template = true`, `is_published = false`.
- Plan limit: add `templates` to `PLAN_LIMIT_RESOURCES` in `packages/utils/src/plans/limits.ts` (BASIC 1, EARLY_ADOPTER 25, ENTERPRISE unlimited); usage = non-deleted courses in the org with `is_template = true` (global templates never count).

### API routes

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/course/template?organizationId=` | `{ org: TemplateCard[], global: TemplateCard[] }` for the row and gallery (title, cover, type, lastUsedAt); `org` sorted by last used then created, `global` by platform order |
| GET | `/course/template/:templateId/preview?organizationId=` | Outline, counts and "shows off" list for the preview dialog (`canUseTemplate`) |
| POST | `/course/:courseId/template` | Save a copy as template `{ title }` |
| POST | `/course/:courseId/template/convert` | Convert in place |
| POST | `/course/template/:templateId/course` | Create course from template `{ title, organizationId }` (`canUseTemplate`) |
| GET | `/course/:courseId/template-updates` | Detected changes for a linked course |
| POST | `/course/:courseId/template-updates/pull` | Pull `{ unitIds, settingKeys }` |

All admin-only (`orgAdminMiddleware` on the requesting org), each returns a single type. The "shows off" list is stored as template data: a `template_highlight` table (`course_id`, `position`, `title`, `description`) authored in the platform org, not a jsonb blob.

### Frontend plan

- Validation: `packages/utils/src/validation/course/course-template.ts`.
- Queries: `packages/db/src/queries/course/course-template.ts` (template list, linked courses, detection reads), plus `updatedAt` bumps in every content update query.
- Service: `apps/api/src/services/course/course-template.ts` (save, convert, create-from, detect, pull in one transaction).
- Dashboard: `features/course/api/course-template.svelte.ts`, types in `features/course/utils/types.ts`, route `routes/(app)/org/[slug]/courses/templates/+page.svelte`; components `template-row.svelte`, `template-card.svelte`, `template-preview-dialog.svelte`, `save-as-template-dialog.svelte`, `template-updates-alert.svelte`, `template-settings-card.svelte`, `template-updates-sheet.svelte`. The courses page drops `Page.Header` and renders `template-row.svelte` above the grid; the Blank course card reuses `new-course-modal.svelte`. `template-card` is a new `@cio/ui/custom/template-card` component with a Storybook story (default, blank, global, loading).
- All copy in `en.json` → `pnpm translate`.

## Implementation Order

1. **Timestamps:** add `lesson_language.updated_at`; bump `updatedAt` in every content write (question, option, lesson language, section moves) — with a test per query.
2. **Migration:** `is_template` backfill/default, `course.template_id`, `course.public_for_all`, the `course_template_setting_sync` and `template_highlight` tables, `source_id`/`source_synced_at` on the three unit tables. Check the journal `when` against `main`.
3. **Clone refactor:** options object; source-id stamping.
4. **Templates:** save/convert/create-from + plan limit; `template-card` + story; courses page template row and empty state; gallery page and preview dialog; menu item; template header badge.
5. **Global templates:** `public_for_all` + `template_highlight`, env, `canUseTemplate`, ClassroomIO templates after own templates in the row and gallery, jobs seed with the four launch-template fixtures.
6. **Sync:** detection + pull service with rollback test (failure mid-pull leaves nothing pulled); Content alert, Settings Template section and review sheet.
7. **Marketplace hookup:** marketplace imports land as templates (`prd/marketplace`).

```bash
export PATH="$HOME/.nvm/versions/node/v20.19.3/bin:$PATH"
pnpm --filter @cio/api^... build && pnpm --filter @cio/api build
pnpm --filter @cio/dashboard^... build && pnpm --filter @cio/dashboard build
pnpm format:check
```

## Acceptance Criteria

1. After migration every existing course has `is_template = false`; new courses default to `false`.
2. Save a copy creates an unpublished template with no students; the original is unchanged.
3. Convert is rejected (UI and API) for a course with students; for a published course it unpublishes.
4. A free-plan org with 1 template cannot save, convert, or import another; the API returns a plan-limit error.
5. Create from template copies the template's current lesson content per locale (no version history) and links every section, lesson and exercise.
6. Templates never appear on the public site, learner LMS, or enrollment flows, and cannot be published.
7. Editing a template lesson makes it appear as `Updated` in every linked course; untouched lessons don't.
8. Nothing is pre-selected in the review sheet; pulling only selected rows changes only those rows.
9. Skipped changes still appear on the next review.
10. An exercise with at least one submission is shown locked and the API rejects pulling it.
11. A lesson with completions can be updated; its completions are preserved.
12. Deleting a lesson in the template never deletes it in a linked course.
13. A locally edited item shows the "you edited this" warning; pulling it replaces the local edits and records a lesson version.
14. Title, course link, published state, course type, tags, students, sessions and reviews are never changed by a pull.
15. Non-admins get 403 on every template route.
16. Zero regression on Clone, course creation, and the course list filters.
17. All new copy uses translation keys; every locale file is updated.
18. The courses page has no page header; the Create a new course row shows Blank course plus up to 5 templates (org's recent first, then ClassroomIO), and templates never appear in the course grid.
19. Clicking any template opens the preview; nothing is created until Use template, which creates the course and opens its Content page.
20. The gallery at `/org/[slug]/courses/templates` uses the standard page header, a right-aligned search, and one grid (Blank course, own templates, then ClassroomIO) with no tabs, sections or categories; `?preview=<id>` opens the preview directly.
21. With `PLATFORM_TEMPLATES_ORG_ID` set, every org sees that org's `public_for_all` templates; with it unset, none. A `public_for_all` course in any other org is never shown.
22. No API route or validation schema accepts `public_for_all`.
23. The jobs seed is idempotent: running it twice creates each launch template once, and it never changes a template edited in the dashboard.
24. Editing a global template's title or cover in the platform org shows up in every org's gallery on next load; content edits appear as pullable updates in linked courses in other orgs.
25. Other orgs cannot open a global template in the editor, delete it, or read it through any route other than preview/create/pull.
26. Global templates don't count toward the template plan limit.
27. The empty state reads "No courses yet…" and Browse templates opens the gallery.
28. Pulling some settings and skipping others leaves the skipped settings listed on the next review.
29. Selecting a New lesson or exercise whose parent is also New pulls the parent too; the API applies the same rule when called directly.
30. A course created from a global template has no lesson `teacherId` or `callUrl` copied from the platform org.

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| A content write path forgets to bump `updated_at`, so a template change is missed | Phase 1 audits every update query with a test each; detection also compares `lesson_language` and question/option timestamps. |
| Pulled lessons replace local edits by accident | Nothing is pre-selected; edited-locally rows carry a warning; lesson version history keeps the replaced content. |
| Replacing questions breaks grading | Exercises with any submission are locked in UI and rejected in the service. |
| Setting rows show local customizations after any template settings save | A setting row appears only when the template changed since that setting was last pulled (per-key `course_template_setting_sync`) and still differs; rows are unchecked by default. |
| Converting the wrong course | Convert is disabled when there are students and is a separate, explicit option from the default copy. |
| New-item placement looks wrong after heavy local reordering | Items are placed after their nearest pulled neighbor; admins can move them after pulling. |
| A wrong edit to a global template reaches every org's gallery at once | Only the platform team can sign in to the platform org; content changes still reach courses only when each org pulls them. |
| A `public_for_all` flag set in a customer org leaks their content | Global = flag **and** platform org id; enforced in the one `canUseTemplate` helper with a test. |
| Seed overwrites the platform team's edits | Seed inserts only when no course with the fixture slug exists; it never updates. |
| Platform-org media deleted while templates use it | Asset deletion is refused when a global template uses the asset. |
| Showcase templates drift from the product (a renamed setting) | The locked "How this template is built" lesson is reviewed with each release that touches a showcased feature. |
