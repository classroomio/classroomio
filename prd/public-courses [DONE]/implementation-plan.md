# Public Courses Implementation Plan

## Scope Lock

1. **Course type**: add `PUBLIC` to `COURSE_TYPE` enum, change default to `SELF_PACED`.
2. **Everyone is a guest**: no auth-based branching on public courses.
3. **Content access**: entire tree + per-item content readable without auth when `course.type === 'PUBLIC'` and `course.isPublished === true`.
4. **Gating**: reuse existing `lesson.isUnlocked` / `exercise.isUnlocked`. Locked items show the creator callout in place of content.
5. **Grading**: exercises on public courses are graded entirely client-side. Answer keys ship to the client. No server submissions.
6. **Question types**: only `autoGradable` question types allowed in public courses. Enforced in UI picker, API writes, and type-conversion checks.
7. **URLs**: `(org-site)/course/[courseSlug]` (tree) and `(org-site)/course/[courseSlug]/lesson/[itemSlug]` (content). Single `/lesson/` segment for both lessons and exercises.
8. **Slugs**: new `slug` columns on `lesson` and `exercise`. Auto-generated from title, editable when course is `PUBLIC`. Unique per course across lesson + exercise.
9. **Callout**: new `callout` JSONB on `course` with `{ title, description, buttonLabel, buttonUrl }`. Optional.
10. **Out of scope**: analytics, donations, live viewer counts, feature flag, localStorage progress, directory tab, discussion, progress tracking of any kind.

## Delivery Phases

### Phase A — Data model + validation (Days 1–2)
Schema changes, migrations, slug backfill, validation schemas.

### Phase B — API: public read endpoints + slug + callout (Days 3–5)
Public-facing GET endpoints for the tree and item content; PATCH endpoints accept slug and callout; guard writes against non-auto-gradable question types.

### Phase C — Creator UI (Days 6–8)
Course type picker adds `PUBLIC`; question-type picker filters by `autoGradable` for public courses; slug field in lesson / exercise settings; callout settings panel.

### Phase D — Public course UI in Storybook (Days 9–12)
**Storybook first.** Build every component with its stories in `packages/ui` + `packages/storybook` so desktop and mobile layouts can be reviewed in isolation before wiring up the routes. Includes: `PublicCourseShell`, `PublicCourseSidebar`, `PublicCourseSidebarRow`, `PublicCourseBottomNav`, `PublicCourseMobileSheet`, `PublicLessonView`, `PublicExerciseView`, `PublicCourseCallout`, plus a composed `PublicCoursePage` story.

### Phase E — Wire routes + polish (Days 13–14)
Mount the storybook-ready components at `(org-site)/course/[slug]` and `(org-site)/course/[slug]/lesson/[itemSlug]`. SEO meta tags, canonical URLs, locked-state rendering, a11y pass, manual QA against the reference designs.

---

## Ticket Breakdown

| ID | Area | Task | Key Files | Dependencies | Done When |
|----|------|------|-----------|--------------|-----------|
| PC-A1 | DB | Add `PUBLIC` to `COURSE_TYPE` enum; change default to `SELF_PACED` | `packages/db/src/schema.ts`, new migration | None | Migration applied; enum accepts `PUBLIC`; default is `SELF_PACED` |
| PC-A2 | DB | Add `callout JSONB NULL` column on `course` | `packages/db/src/schema.ts`, migration | PC-A1 | Column exists; type matches `CourseCallout` shape |
| PC-A3 | DB | Add `slug VARCHAR NULL` to `lesson` and `exercise` | `packages/db/src/schema.ts`, migration | None | Columns exist on both tables |
| PC-A4 | DB | Backfill slugs for existing `lesson` and `exercise` rows (kebab-case from title, collision-resolved per course) | Migration SQL or one-shot script | PC-A3 | All rows have non-null slug; uniqueness holds per course |
| PC-A5 | DB | Follow-up migration making `lesson.slug` and `exercise.slug` `NOT NULL` | Migration | PC-A4 | Columns are `NOT NULL` |
| PC-A6 | DB queries | Update lesson / exercise queries to return `slug` | `packages/db/src/queries/course/**/*.ts` | PC-A3 | Queries project the new column |
| PC-A7 | Utils | Slug validator (Zod: kebab-case, 1–80 chars) | `packages/utils/src/validation/shared/slug.ts` | None | Schema exported and unit-tested |
| PC-A8 | Utils | Callout validator (Zod for `{ title, description, buttonLabel, buttonUrl }`) | `packages/utils/src/validation/course/callout.ts` | None | Schema exported; URL validated |
| PC-A9 | Utils | Extend course validation schemas to accept `type: 'PUBLIC'`, `callout`, and `slug` fields on lesson / exercise | `packages/utils/src/validation/course/**`, `lesson/**`, `exercise/**` | PC-A7, PC-A8 | Schemas accept new fields |
| PC-A10 | Question types | Expose an `autoGradable` filter helper for pickers (if not already exported) | `packages/question-types/src/question-type-capabilities.ts` | None | Helper available via `isAutoGradableQuestionType` / registry filter |
| PC-B1 | API service | `slugFromTitle(title, existingSlugsInCourse)` utility (generate + collision-resolve) | `apps/api/src/services/course/slug.ts` | PC-A7 | Pure function; unit tests cover collision cases |
| PC-B2 | API service | On lesson / exercise create, auto-generate `slug` if not provided | `apps/api/src/services/course/lesson.ts`, `apps/api/src/services/exercise/exercise.ts` | PC-B1 | New items get slugs automatically |
| PC-B3 | API service | On lesson / exercise update, accept slug edit; enforce per-course uniqueness across lessons + exercises | Same services | PC-B1 | Conflicting slugs are rejected with a clear error code |
| PC-B4 | API service | Block non-auto-gradable question types on public courses (create + update) | `apps/api/src/services/exercise/exercise.ts` | PC-A10 | Attempts rejected with `QUESTION_TYPE_NOT_ALLOWED_IN_PUBLIC_COURSE` |
| PC-B5 | API service | `convertCourseType(courseId, newType)` — when converting **to** `PUBLIC`, reject if any attached question is non-auto-gradable; return list of offenders | `apps/api/src/services/course/course.ts` | PC-A10 | Conversion blocked with actionable error; passes when all questions are auto-gradable |
| PC-B6 | API service | Accept `callout` on course update | `apps/api/src/services/course/course.ts` | PC-A8 | Callout round-trips through create/update/read |
| PC-B7 | API route | `GET /org-site/course/:courseSlug` (no auth) returns course + section tree + item metadata incl. slugs | `apps/api/src/routes/org-site/course.ts` (new file) | PC-A6 | Anonymous requests succeed when course is public + published; 404 otherwise |
| PC-B8 | API route | `GET /org-site/course/:courseSlug/item/:itemSlug` (no auth) returns one of two shapes with discriminator `kind: 'lesson' \| 'exercise'` | Same router | PC-B7 | Returns lesson body or exercise payload (with answer keys) |
| PC-B9 | API route | Register the new router in `app.ts`; ensure `authMiddleware` is NOT applied to this router | `apps/api/src/app.ts` | PC-B7, PC-B8 | Router mounted; smoke test as anonymous user succeeds |
| PC-C1 | Dashboard | Add `PUBLIC` option to course type picker at course creation | `apps/dashboard/src/lib/features/course/components/course-create/*` (existing) | PC-A9 | Creator can pick `Public` and create a course with `type: 'PUBLIC'` |
| PC-C2 | Dashboard | Filter question-type picker to `autoGradable` only when `course.type === 'PUBLIC'` | `apps/dashboard/src/lib/features/ui/question/constants.ts`, `packages/ui/src/custom/question-type-picker/*` | PC-A10 | Non-auto-gradable types are hidden from the picker in public courses |
| PC-C3 | Dashboard | Add slug editor to lesson and exercise settings (visible only when course is `PUBLIC`) | Lesson / exercise settings components under `features/course/components/...` | PC-A7 | Creator can edit slug; server validation errors surface inline |
| PC-C4 | Dashboard | Add **Callout Settings** panel on the course settings page (visible only when `PUBLIC`) | `apps/dashboard/src/lib/features/course/components/settings/callout-settings.svelte` (new) | PC-B6 | Creator can set / clear title, description, button label, button URL |
| PC-C5 | Dashboard | Warn in UI when switching a course **to** `PUBLIC` with non-auto-gradable questions (surface server error nicely) | Course settings type picker | PC-B5 | Clear error modal listing offending items |
| PC-D1 | UI | `PublicCourseShell` — responsive two-column layout. Desktop: sidebar + content. Mobile: hides sidebar, reserves bottom padding for the bottom bar. Accepts `sidebar`, `bottomNav`, `main` slots. | `packages/ui/src/custom/public-course/shell.svelte` | None | Component renders correctly at both breakpoints; bottom padding reserved on mobile |
| PC-D2 | UI | `PublicCourseSidebarRow` — number badge + title + lock indicator. Variants: default, hover, active (uses `--primary`), locked. | `packages/ui/src/custom/public-course/sidebar-row.svelte` | None | Matches `design/sidebar-active-state.png`; no hard-coded orange |
| PC-D3 | UI | `PublicCourseSidebar` — sections with muted headings and their rows. Per-section numbering resets across lessons + exercises interleaved by `order`. | `packages/ui/src/custom/public-course/sidebar.svelte` | PC-D2 | Sections render in order; numbering resets per section |
| PC-D4 | UI | `PublicCourseBottomNav` — mobile-only fixed bottom bar with prev / center / next. Emits `onPrev`, `onNext`, `onCenterTap`. Disables prev / next at boundaries. | `packages/ui/src/custom/public-course/bottom-nav.svelte` | None | Three regions render; disabled states work; `--primary` used for accent |
| PC-D5 | UI | `PublicCourseMobileSheet` — vaul-based drawer that slides up with the full sidebar tree inside. Drag-to-dismiss. Auto-closes on item tap. | `packages/ui/src/custom/public-course/mobile-sheet.svelte` (uses `@cio/ui/base/drawer`) | PC-D3 | Opens on center-tap; swipe-down dismisses; tapping a row navigates + closes |
| PC-D6 | UI | `PublicLessonView` — video → section label → title → body → inline callout. Video slot omitted entirely when no video. | `packages/ui/src/custom/public-course/lesson-view.svelte` | PC-D8 | Matches `design/lesson-page-full.png` |
| PC-D7 | UI | `PublicExerciseView` — renders exercise questions in client-grading mode. Uses existing question-type render contract. No server submit. | `packages/ui/src/custom/public-course/exercise-view.svelte` | None | Exercises grade locally; "you got X / Y" displayed; refresh resets state |
| PC-D8 | UI | `PublicCourseCallout` — inline variant (below body) and full variant (replaces body for locked items). | `packages/ui/src/custom/public-course/callout.svelte` | None | Both variants render; button opens URL in new tab |
| PC-D9 | Storybook | `PublicCourseSidebarRow` stories: default, hover, active, locked. | `packages/storybook/src/molecules/public-course/sidebar-row.stories.svelte` | PC-D2 | All four variants selectable |
| PC-D10 | Storybook | `PublicCourseSidebar` stories: default, with locked item, many sections. | `...sidebar.stories.svelte` | PC-D3 | Three scenarios render correctly |
| PC-D11 | Storybook | `PublicCourseBottomNav` stories: first item (prev disabled), middle item, last item (next disabled). | `...bottom-nav.stories.svelte` | PC-D4 | Three position states selectable |
| PC-D12 | Storybook | `PublicCourseMobileSheet` stories: closed, open (default), open-at-section. | `...mobile-sheet.stories.svelte` | PC-D5 | Stories demonstrate drag-to-dismiss and row-tap close |
| PC-D13 | Storybook | `PublicLessonView` stories: with video, without video, long body, short body. | `...lesson-view.stories.svelte` | PC-D6 | Four stories render |
| PC-D14 | Storybook | `PublicExerciseView` stories: unanswered, mid-answer, after-grade. | `...exercise-view.stories.svelte` | PC-D7 | Three stories render; after-grade shows correct/incorrect marks |
| PC-D15 | Storybook | `PublicCourseCallout` stories: inline, full (locked), no-callout fallback. | `...callout.stories.svelte` | PC-D8 | Three variants render |
| PC-D16 | Storybook | **Composed** `PublicCoursePage` story — mounts `Shell` + `Sidebar` + `LessonView` + `BottomNav`. Use Storybook's viewport addon to switch desktop / tablet / mobile. This is the primary review surface for design sign-off. | `...public-course-page.stories.svelte` | PC-D1..PC-D8 | Desktop shows two columns (no bottom bar); mobile hides sidebar and shows bottom bar; center-tap opens sheet |
| PC-D17 | Dashboard types | Frontend types for public tree + item responses (inferred from API). | `apps/dashboard/src/lib/features/public-course/utils/types.ts` (new feature folder) | PC-B7, PC-B8 | Typed responses usable in routes |
| PC-D18 | Dashboard route | `(org-site)/course/[slug]/+layout.server.ts` — SSR fetch of the tree, exposes to child routes. | New file | PC-D17 | Tree available via layout data |
| PC-D19 | Dashboard route | `(org-site)/course/[slug]/+page.svelte` — overview page linking into items by slug. | New file | PC-D18 | Renders overview; links use `itemSlug` |
| PC-D20 | Dashboard route | `(org-site)/course/[slug]/lesson/[itemSlug]/+page.server.ts` — SSR fetch for item content. | New file | PC-B8 | Server-rendered content on first paint |
| PC-D21 | Dashboard route | `(org-site)/course/[slug]/lesson/[itemSlug]/+page.svelte` — composes `Shell` + `Sidebar` + `LessonView` / `ExerciseView` + `BottomNav` + `MobileSheet`. | New file | PC-D16, PC-D20 | Page matches the composed Storybook story behavior |
| PC-D22 | Dashboard | Locked-item rendering: when `isUnlocked === false`, swap body for the full-variant callout. | Inside `+page.svelte` or container component | PC-D8 | Locked items render the callout; sidebar shows lock icon |
| PC-D23 | Dashboard | Wire prev / next navigation (both desktop keyboard shortcuts and mobile bottom bar) to `goto()` the next / previous `itemSlug`. | New util: `features/public-course/utils/navigation.ts` | PC-D4 | Arrow keys and bottom bar both navigate; disabled at boundaries |
| PC-E1 | SEO | Set `<title>`, `<meta description>`, canonical, and OG tags on public lesson pages. | `+page.svelte` head blocks | PC-D21 | View-source shows correct tags |
| PC-E2 | i18n | All new user-facing strings in `apps/dashboard/src/lib/utils/translations/en.json` (callout settings, locked-state fallback text, prev / next labels for a11y, etc.). | translations file | PC-C4, PC-D22 | No hardcoded English in new components |
| PC-E3 | a11y | Keyboard + screen-reader review: sidebar rows are links, bottom-nav buttons have labels, sheet traps focus while open. | All new components | PC-D16, PC-D21 | `axe` passes on the composed story and on a live page |
| PC-E4 | Tests | Service + route tests for public GET endpoints, slug uniqueness, non-auto-gradable rejection, type-conversion guard. | `apps/api/src/**/__tests__/public-course*.test.ts` | PC-B* | Tests pass |

---

## Schema Snippets

### Migration: enum + default + columns

```sql
-- Add PUBLIC to the existing COURSE_TYPE enum
ALTER TYPE "COURSE_TYPE" ADD VALUE IF NOT EXISTS 'PUBLIC';

-- Change default
ALTER TABLE "course" ALTER COLUMN "type" SET DEFAULT 'SELF_PACED';

-- Callout
ALTER TABLE "course" ADD COLUMN "callout" JSONB;

-- Slugs (nullable first; NOT NULL after backfill)
ALTER TABLE "lesson"   ADD COLUMN "slug" VARCHAR;
ALTER TABLE "exercise" ADD COLUMN "slug" VARCHAR;
```

Backfill (pseudo):

```ts
// For each course, iterate lessons + exercises ordered by order,
// generate kebab-case slugs from titles, resolve collisions per course
// by appending -2, -3, ... across the union of both tables.
```

Follow-up migration:

```sql
ALTER TABLE "lesson"   ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "exercise" ALTER COLUMN "slug" SET NOT NULL;
```

(No per-course unique constraint in SQL; enforced in application code.)

---

## API Response Shapes

### Tree response

```ts
GET /org-site/course/:courseSlug
// 200
{
  success: true,
  data: {
    course: {
      id: string;
      slug: string;
      title: string;
      description: string | null;
      bannerImage: string | null;
      callout: {
        title: string;
        description: string;
        buttonLabel: string;
        buttonUrl: string;
      } | null;
    };
    sections: Array<{
      id: string;
      title: string;
      order: number;
      items: Array<
        | { kind: 'lesson';   id: string; slug: string; title: string; order: number; isUnlocked: boolean; hasVideo: boolean }
        | { kind: 'exercise'; id: string; slug: string; title: string; order: number; isUnlocked: boolean }
      >;
    }>;
  }
}
// 404 if course is not public or not published
```

### Item response (single type, discriminator)

```ts
GET /org-site/course/:courseSlug/item/:itemSlug
// 200
{
  success: true,
  data:
    | {
        kind: 'lesson';
        id: string;
        slug: string;
        title: string;
        sectionTitle: string;
        isUnlocked: boolean;
        video: { type: 'youtube' | 'upload' | 'generic' | 'google_drive'; link: string } | null;
        body: string; // rich text / HTML
      }
    | {
        kind: 'exercise';
        id: string;
        slug: string;
        title: string;
        sectionTitle: string;
        isUnlocked: boolean;
        questions: ExercisePayloadWithAnswerKeys; // uses question-types render contract
      };
}
// 404 if course not public/published or item not found
```

---

## Acceptance Criteria

### Phase A
- [ ] `COURSE_TYPE` enum includes `PUBLIC`.
- [ ] `course.type` default is `SELF_PACED` for new rows.
- [ ] `course.callout` column exists and accepts null or full object.
- [ ] `lesson.slug` and `exercise.slug` exist, backfilled, and `NOT NULL`.
- [ ] Slug validator rejects invalid shapes (spaces, uppercase, >80 chars).

### Phase B
- [ ] `GET /org-site/course/:courseSlug` returns the tree anonymously for public + published courses.
- [ ] `GET /org-site/course/:courseSlug/item/:itemSlug` returns lesson or exercise content with `kind` discriminator.
- [ ] Anonymous request on a non-public or unpublished course returns 404.
- [ ] Creating / updating a question with a non-auto-gradable type on a PUBLIC course is rejected with a clear error.
- [ ] Converting a course to `PUBLIC` fails when non-auto-gradable questions exist; error lists the offending items.
- [ ] Lesson / exercise PATCH accepts `slug` edits and enforces per-course uniqueness across both tables.

### Phase C
- [ ] Creator can select `PUBLIC` as a course type.
- [ ] Question-type picker hides non-auto-gradable types when the course is `PUBLIC`.
- [ ] Slug field is visible and editable on lesson / exercise settings (only when course is `PUBLIC`).
- [ ] Callout settings panel is visible on the course settings page (only when `PUBLIC`) and round-trips the callout object.

### Phase D
- [ ] Every new component in `packages/ui/src/custom/public-course/*` has at least one Storybook story (listed in PC-D9..PC-D16).
- [ ] The composed `PublicCoursePage` story renders correctly at desktop, tablet, and mobile viewports (via Storybook's viewport addon).
- [ ] Desktop: two columns, no bottom bar, sidebar visible.
- [ ] Mobile: sidebar hidden, fixed bottom bar visible with prev / center / next regions; center tap opens a drag-dismissible bottom sheet containing the full sidebar tree; tapping a row navigates and closes the sheet.
- [ ] Sidebar numbers reset per section; active state uses `--primary`; hover state matches the reference designs.
- [ ] Locked items render the creator callout in place of content; sidebar shows a lock indicator.
- [ ] Exercises grade entirely client-side; no network request on answer submit.
- [ ] No hard-coded orange anywhere; all accents resolve to `--primary`.
- [ ] `(org-site)/course/[slug]` renders the course overview.
- [ ] `(org-site)/course/[slug]/lesson/[itemSlug]` matches the composed Storybook story on a live browser.
- [ ] Anonymous visitors see the same experience regardless of auth state.

### Phase E
- [ ] View-source on a public lesson page shows the item title, description, canonical URL, and OG tags.
- [ ] All user-facing strings are translation keys.
- [ ] Keyboard navigation works on desktop (`←` / `→` move through items); bottom-nav buttons have a11y labels; the mobile sheet traps focus while open.
- [ ] `axe` passes on both the composed Storybook story and a live public lesson page.
- [ ] API tests pass.

---

## Verification Commands

```bash
pnpm --filter @cio/utils build
pnpm --filter @cio/question-types build
pnpm --filter @cio/db build
pnpm --filter @cio/api build
pnpm --filter @cio/ui build
pnpm --filter @cio/dashboard build

pnpm --filter @cio/api test public-course
pnpm --filter @cio/dashboard check
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Slug collisions during backfill | Two-pass backfill script: generate all candidates, resolve collisions per course, then write. Wrap in a transaction and dry-run in staging first. |
| Answer keys shipped to the client | Accepted trade-off (public courses are marketing surfaces). Documented in the PRD. |
| Converting a course with many non-auto-gradable questions to `PUBLIC` is painful | Server error lists every offending question with its exercise + section so the creator can fix them in one pass. |
| SEO duplicate content between `(app)/courses/[id]/lessons/[lessonId]` and the new public URL | Canonical URL on public pages points at the `(org-site)` URL. `(app)` URLs remain auth-gated and are not indexed. |
| Hard-coded orange in screenshots leaking into the build | Explicit rule in the PRD: all accents use `--primary`. Reviewer should grep new components for raw orange hex values. |
