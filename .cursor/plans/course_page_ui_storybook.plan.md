---
name: ""
overview: ""
todos: []
isProject: false
---

# Course Page UI Extraction and Storybook Integration (Detailed Plan)

## Overview

Extract the course page UI (sidebar + content shell) into a reusable `CoursePage` component in `packages/ui`, add a Storybook story under `Pages/CoursePage` that accepts JSON to form the whole page, and wire the dashboard layout to use it. **Content rendering in Storybook is view-mode only** (lesson and exercise). Edit mode stays in the dashboard and is out of scope.

---

## Part 0: Prerequisites and Reference Files to Read

Before starting, a junior dev should read these files to understand the patterns:

1. **Exercise Question pattern** (how JSON fixtures drive UI):
  - `[packages/storybook/src/molecules/exercise-question/exercise-question.stories.svelte](packages/storybook/src/molecules/exercise-question/exercise-question.stories.svelte)`
  - `[packages/storybook/src/molecules/exercise-question/question-fixtures.ts](packages/storybook/src/molecules/exercise-question/question-fixtures.ts)`
  - `[packages/ui/src/custom/exercise-question/question-renderer.svelte](packages/ui/src/custom/exercise-question/question-renderer.svelte)`
2. **Current course layout** (what we are extracting):
  - `[apps/dashboard/src/routes/courses/[id]/+layout.svelte](apps/dashboard/src/routes/courses/[id]/+layout.svelte)`
  - `[apps/dashboard/src/lib/features/course/components/sidebar/course-sidebar-navigation.svelte](apps/dashboard/src/lib/features/course/components/sidebar/course-sidebar-navigation.svelte)`
3. **View vs Edit mode** (view mode only in Storybook):
  - Exercise view: `[apps/dashboard/src/lib/features/course/components/exercise/view-mode.svelte](apps/dashboard/src/lib/features/course/components/exercise/view-mode.svelte)` uses `ExerciseQuestion.QuestionList` with `mode: 'view'`
  - Lesson view: `[apps/dashboard/src/lib/features/course/components/lesson/utils.ts](apps/dashboard/src/lib/features/course/components/lesson/utils.ts)` – Note, Slide, Video, Document in view mode

---

## Part 1: Define the JSON Config Schema

### Step 1.1: Create the types file

**Create file**: `packages/ui/src/custom/course-page/course-page-types.ts`

**Purpose**: Define the shape of the JSON that drives the CoursePage. No imports from dashboard or API.

**Contents** (copy and adapt):

```typescript
/**
 * JSON config for CoursePage. Used by Storybook (fixtures) and Dashboard (built from course/org state).
 */
export interface CoursePageConfig {
  course: { id: string; title: string };
  sidebar: CourseSidebarConfig;
  /** Used by Storybook for view-mode content. Dashboard uses content snippet instead. */
  content?: CourseContentViewConfig;
}

export interface CourseSidebarConfig {
  backUrl: string;
  backLabel: string;
  navItems: CourseNavItem[];
}

export interface CourseNavItem {
  id: string;
  title: string;
  url: string;
  isActive: boolean;
  isLesson?: boolean;
  icon?: CourseNavIconKey;
  contentTree?: CourseContentTreeSection[];
  contentCount?: { lessons: number; exercises: number };
}

export type CourseNavIconKey =
  | 'newsfeed'
  | 'content'
  | 'analytics'
  | 'attendance'
  | 'submissions'
  | 'marks'
  | 'certificates'
  | 'landingpage'
  | 'people'
  | 'settings'
  | 'section';

export interface CourseContentTreeSection {
  id: string;
  title: string;
  items: CourseContentTreeItem[];
}

export interface CourseContentTreeItem {
  id: string;
  title: string;
  type: 'LESSON' | 'EXERCISE';
  url?: string;
  isComplete?: boolean;
  isUnlocked?: boolean;
}

/**
 * View-mode content config for Storybook. Dashboard does NOT use this – it renders route children.
 */
export type CourseContentViewConfig =
  | { type: 'lesson'; data: LessonViewData }
  | { type: 'exercise'; data: ExerciseViewData }
  | { type: 'placeholder'; data: { label: string } };

export interface LessonViewData {
  title: string;
  note?: string; // HTML string
  slideUrl?: string;
  videos?: { link: string; type: string; metadata?: Record<string, unknown> }[];
  documents?: { title: string; url: string }[];
}

export interface ExerciseViewData {
  title: string;
  questions: Record<string, unknown>[];
  answersByKey?: Record<string, unknown>;
}
```

**Check**: File compiles with `pnpm exec tsc --noEmit` in `packages/ui`.

---

## Part 2: Create the CoursePage UI Components

### Step 2.1: Icon lookup map

**Create file**: `packages/ui/src/custom/course-page/icon-map.ts`

**Purpose**: Map string keys from config to the actual icon components.

**Contents**:

```typescript
import type { Component } from 'svelte';
import TableOfContentsIcon from '@lucide/svelte/icons/table-of-contents';
import {
  NewsFeedIcon,
  ContentIcon,
  AnalyticsIcon,
  AttendanceIcon,
  SubmissionIcon,
  MarksIcon,
  CertificateIcon,
  LandingPageIcon,
  PeopleIcon,
  SettingsIcon
} from '@cio/ui/custom/moving-icons';
import type { CourseNavIconKey } from './course-page-types';

export const COURSE_NAV_ICON_MAP: Record<CourseNavIconKey, Component> = {
  section: TableOfContentsIcon,
  newsfeed: NewsFeedIcon,
  content: ContentIcon,
  analytics: AnalyticsIcon,
  attendance: AttendanceIcon,
  submissions: SubmissionIcon,
  marks: MarksIcon,
  certificates: CertificateIcon,
  landingpage: LandingPageIcon,
  people: PeopleIcon,
  settings: SettingsIcon
};

export function getCourseNavIcon(key: CourseNavIconKey | undefined): Component | null {
  if (!key) return null;
  return COURSE_NAV_ICON_MAP[key] ?? null;
}
```

**Check**: Imports resolve. Moving-icons live at `packages/ui/src/custom/moving-icons`.

---

### Step 2.2: Course page sidebar

**Create file**: `packages/ui/src/custom/course-page/course-page-sidebar.svelte`

**Purpose**: Renders the sidebar from `CourseSidebarConfig`. No dashboard/API deps.

**Logic**:

- Use `@cio/ui/base/sidebar` primitives: `Sidebar.Root`, `Sidebar.Header`, `Sidebar.Content`, `Sidebar.Group`, `Sidebar.Menu`, `Sidebar.MenuItem`, `Sidebar.MenuButton`, `Sidebar.MenuSub`, `Sidebar.MenuSubItem`, `Sidebar.MenuSubButton`, `Sidebar.Rail`.
- For each `navItem`: if `isLesson` and `contentTree` exists and item `isActive`, render the collapsible tree; otherwise render a simple link.
- Use `getCourseNavIcon(navItem.icon)` for icons.
- Back button: link to `config.sidebar.backUrl` with label `config.sidebar.backLabel`.
- Sidebar header: render a simple "Course" placeholder (or accept a `sidebarHeader` snippet later).
- Use `resolve` from `$app/paths` for URLs – but CoursePage is in packages/ui which may not have SvelteKit. **Alternative**: pass `basePath` or use plain `href={item.url}` since URLs come from config.

**Note**: `packages/ui` typically does NOT have `$app/paths` (SvelteKit). Use `item.url` directly as `href={item.url}` since config supplies full URLs.

**Content tree for Lessons**: Use `Collapsible.Root` + `Collapsible.Trigger` + `Collapsible.Content` from `@cio/ui/base/collapsible`. Each section maps to a collapsible; items inside link to `item.url`. Reuse `LessonIcon` and `ExerciseIcon` from `@cio/ui/custom/moving-icons` for item types.

**Structure** (pseudocode):

```
Sidebar.Root collapsible="icon"
  Sidebar.Header
    slot or "Course"
  Sidebar.Content
    Sidebar.Group
      Button/link back: backLabel -> backUrl
      Sidebar.Menu
        for each navItem
          if isLesson && isActive && contentTree
            render link + CourseContentTree (collapsible sections)
          else
            render link only
  Sidebar.Rail
```

**CourseContentTree for config**: Create a small component that renders sections/items from `contentTree` (from config, not courseApi). Each item links to `item.url` or builds path from `courseId` + `item.id` + `item.type`. For Storybook we can use `item.url` from the fixture.

---

### Step 2.3: Course page header

**Create file**: `packages/ui/src/custom/course-page/course-page-header.svelte`

**Purpose**: Simple header: Sidebar.Trigger + course title. No Search/notifications (dashboard keeps those).

**Props**: `title: string`

**Contents**:

```svelte
<script lang="ts">
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { Separator } from '@cio/ui/base/separator';

  interface Props { title?: string; }
  let { title = '' }: Props = $props();
</script>
<header class="...">
  <Sidebar.Trigger />
  <Separator orientation="vertical" />
  <p class="...">{title}</p>
</header>
```

Copy classes from `[CourseHeader](apps/dashboard/src/lib/features/course/components/course-header.svelte)`.

---

### Step 2.4: View-mode content renderer (Lesson + Exercise)

**Create file**: `packages/ui/src/custom/course-page/course-content-view.svelte`

**Purpose**: Renders view-mode content from `CourseContentViewConfig`. Used only in Storybook.

**Props**: `config: CourseContentViewConfig`

**Logic**:

- If `config.type === 'lesson'`: render `LessonViewContent` with `config.data`
- If `config.type === 'exercise'`: render `ExerciseQuestion.QuestionList` (or `QuestionRenderer` per question) with `mode: 'view'`, `questions`, `answersByKey`, `disabled: true`
- If `config.type === 'placeholder'`: render a simple card with `config.data.label`

**Create file**: `packages/ui/src/custom/course-page/lesson-view-content.svelte`

**Purpose**: Read-only lesson view. Accepts `LessonViewData` as props.

**Rendering** (copy structure from dashboard view mode, but data-driven):

- **Note**: Use `sanitizeHtml` from `@cio/ui/tools/sanitize` + `<div>{@html sanitized}</div>`. If `!data.note`, render nothing.
- **Slide**: If `data.slideUrl`, render `<iframe src={slideUrl} title="Slides" width="100%" height="569" class="..." allowfullscreen />`. Add `?embed` for Canva URLs (see `slide.svelte`).
- **Videos**: For each `data.videos`, render `MediaPlayer` with `source: { type: video.type, url: video.link, metadata: video.metadata }`, `options: { maxHeight: '569px', width: '100%', controls: true }`.
- **Documents**: Simple list: for each `data.documents`, render `<a href={doc.url}>{doc.title}</a>`. No inline PDF viewer (dashboard keeps that).

Keep it minimal – we are matching view-mode output, not edit UI.

**Exercise view**: Use `ExerciseQuestion.QuestionList` with:

- `contract: { mode: 'view', questions: data.questions, answersByKey: data.answersByKey ?? buildFromAnswers(data), labels, disabled: true }`
- `questions` must be `ExerciseQuestionModel[]` (same shape as `[question-fixtures](packages/storybook/src/molecules/exercise-question/question-fixtures.ts)` – id, key, title, questionType, options, settings).
- `answersByKey`: map from `getExerciseQuestionContractKey(question, index)` to answer value. Either pass in fixture or build from `{ questionKey: answer }` map.
- `labels`: Use empty object `{}` – `getExerciseQuestionLabel` in `@cio/question-types` has fallbacks. Alternatively add `labels?: ExerciseQuestionLabels` to `ExerciseViewData` so fixtures can override.

---

### Step 2.5: Main CoursePage component

**Create file**: `packages/ui/src/custom/course-page/course-page.svelte`

**Purpose**: Root layout. `Sidebar.Provider` → `CoursePageSidebar` + `Sidebar.Inset` (header + content).

**Props**:

- `config: CoursePageConfig` (required)
- `content?: Snippet` (optional) – when provided, render this instead of `CourseContentView`. Dashboard passes `{@render children()}`.
- `sidebarHeader?: Snippet` (optional) – override header inside sidebar
- `sidebarFooter?: Snippet` (optional)

**Structure**:

```svelte
<Sidebar.Provider>
  <CoursePageSidebar config={config.sidebar} {sidebarHeader} {sidebarFooter} />
  <Sidebar.Inset>
    <CoursePageHeader title={config.course.title} />
    <Page.Root class="...">
      {#if content}
        {@render content()}
      {:else if config.content}
        <CourseContentView config={config.content} />
      {:else}
        <Empty variant="page" ... />
      {/if}
    </Page.Root>
  </Sidebar.Inset>
</Sidebar.Provider>
```

---

### Step 2.6: Index and exports

**Create file**: `packages/ui/src/custom/course-page/index.ts`

```typescript
export { default as CoursePage } from './course-page.svelte';
export { default as CoursePageSidebar } from './course-page-sidebar.svelte';
export { default as CoursePageHeader } from './course-page-header.svelte';
export { default as CourseContentView } from './course-content-view.svelte';
export { default as LessonViewContent } from './lesson-view-content.svelte';
export * from './course-page-types';
export * from './icon-map';
```

**Update**: `packages/ui/src/index.ts` – add:

```typescript
export * as CoursePage from './custom/course-page';
```

---

## Part 3: Storybook Fixtures and Stories

### Step 3.1: Create course page fixtures

**Create file**: `packages/storybook/src/pages/course-page/course-page-fixtures.ts`

**Purpose**: JSON configs that form the whole course page. Include sidebar + view-mode content.

**Fixtures**:

1. `LESSON_VIEW_FIXTURE`: `content.type === 'lesson'` with sample note HTML, 1 video, 1 document.
2. `EXERCISE_VIEW_FIXTURE`: `content.type === 'exercise'` with 2–3 questions from `question-fixtures` (reuse RADIO_FIXTURE, CHECKBOX_FIXTURE questions) and matching answers.
3. `FULL_INSTRUCTOR_FIXTURE`: All nav items, Lessons active with content tree, `content.type === 'placeholder'` with label "Lessons list" (actual list rendering deferred).
4. `STUDENT_MINIMAL_FIXTURE`: News Feed, Lessons (with tree), Certificates. Content = placeholder.

**Example** (LESSON_VIEW_FIXTURE):

```typescript
import type { CoursePageConfig } from '@cio/ui/custom/course-page';

export const LESSON_VIEW_FIXTURE: CoursePageConfig = {
  course: { id: 'course-1', title: 'Introduction to Svelte' },
  sidebar: {
    backUrl: '/org/acme/courses',
    backLabel: 'Courses',
    navItems: [
      { id: 'newsfeed', title: 'News Feed', url: '/courses/course-1', isActive: false, icon: 'newsfeed' },
      { id: 'lessons', title: 'Content', url: '/courses/course-1/lessons', isActive: true, isLesson: true, icon: 'content', contentTree: [...], contentCount: { lessons: 3, exercises: 2 } }
    ]
  },
  content: {
    type: 'lesson',
    data: {
      title: 'Getting Started',
      note: '<p>Welcome to the course...</p>',
      videos: [{ link: 'https://...', type: 'youtube', metadata: {} }],
      documents: [{ title: 'PDF', url: '#' }]
    }
  }
};
```

---

### Step 3.2: Create Storybook stories

**Create file**: `packages/storybook/src/pages/course-page/course-page.stories.svelte`

**Structure**:

- Title: `Pages/CoursePage`
- Parameters: `layout: 'fullscreen'`
- Stories:
  1. **LessonView** – uses `LESSON_VIEW_FIXTURE`, no content snippet → `CourseContentView` renders lesson view.
  2. **ExerciseView** – uses `EXERCISE_VIEW_FIXTURE`, no content snippet → `CourseContentView` renders exercise view (QuestionList with mode 'view').
  3. **InstructorFull** – uses `FULL_INSTRUCTOR_FIXTURE`, content placeholder.
  4. **StudentMinimal** – uses `STUDENT_MINIMAL_FIXTURE`.

**Pattern** (same as exercise-question):

```svelte
<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { CoursePage } from '@cio/ui';
  import { LESSON_VIEW_FIXTURE } from './course-page-fixtures';

  const { Story } = defineMeta({
    title: 'Pages/CoursePage',
    component: CoursePage.CoursePage,
    parameters: { layout: 'fullscreen' },
    tags: ['autodocs']
  });
</script>

<Story name="LessonView">
  {#snippet template()}
    <CoursePage.CoursePage config={LESSON_VIEW_FIXTURE} />
  {/snippet}
</Story>
```

**Important**: Do NOT pass a content snippet for Lesson/Exercise stories – the config drives `CourseContentView` in view mode only. Edit mode is not in scope.

---

## Part 4: Dashboard Integration

### Step 4.1: Config adapter

**Create file**: `apps/dashboard/src/lib/features/course/utils/course-page-config.ts`

**Purpose**: Build `CoursePageConfig` from real course/org state.

**Function**: `buildCoursePageConfig(params: { course, path, courseId, isStudent, ... }): CoursePageConfig`

**Logic**:

- Copy the nav item logic from `course-sidebar-navigation.svelte` (which items to show, `isActive`, urls).
- Use `getNavItemRoute`, `getLessonsRoute` from `$features/course/utils/functions`.
- Use `getCourseContent(course)` for content tree and counts.
- `content` in config: leave undefined (dashboard uses content snippet, not config.content).
- Use `$t(...)` for labels.

---

### Step 4.2: Update layout

**Update file**: `apps/dashboard/src/routes/courses/[id]/+layout.svelte`

**Changes**:

- When `isCourseReady`: call `buildCoursePageConfig(...)` to get config.
- Import `CoursePage` from `@cio/ui`.
- Replace the current layout structure with:

```svelte
  <CoursePage.CoursePage config={config} content={children}>
    {@render children?.()}
  </CoursePage.CoursePage>
  

```

  (Or pass `content` as a snippet that renders `children`.)

- Keep: `Dialog.Root` (not permitted), `ContentCreateModal`, `Confetti` for exercise page.
- Pass `sidebarHeader` = OrgLogo, `sidebarFooter` = UpgradePoweredBy when applicable.

**Alternative (incremental)**: Keep `CourseSidebar` and `CourseHeader` in the dashboard initially. Only replace the shell (Provider + Inset + Page.Root) with `CoursePage` and pass the existing sidebar as a slot. Then migrate sidebar to use config in a follow-up.

---

## Part 5: Out of Scope (Document for Later)

- **Edit mode**: Lesson edit (Note, Slide, Video, Document tabs) and Exercise edit (EditMode, add question, etc.) remain in dashboard only. Do not add edit UI to `CoursePage` or Storybook.
- **ContentCreateModal**: Stays in dashboard. Optional: add a placeholder in CoursePage for "add content" if config says so.
- **Search / Notifications**: Stay in dashboard header.
- **Actual Lessons list page** (list of sections/items): Can be a placeholder in Storybook for now. Full rendering can be broken down later.

---

## Part 6: Verification Checklist

- `pnpm --filter @cio/ui build` passes
- `pnpm --filter @cio/storybook dev` runs, story `Pages/CoursePage` shows all 4 stories
- LessonView story shows sanitized note, video, document in view mode
- ExerciseView story shows questions in view mode (read-only, with sample answers)
- Dashboard `courses/[id]` layout uses `CoursePage` and renders correctly
- No edit-mode UI (pencil, add question, etc.) in Storybook

---

## File Summary (Execution Order)


| Order | Action | Path                                                                  |
| ----- | ------ | --------------------------------------------------------------------- |
| 1     | Create | `packages/ui/src/custom/course-page/course-page-types.ts`             |
| 2     | Create | `packages/ui/src/custom/course-page/icon-map.ts`                      |
| 3     | Create | `packages/ui/src/custom/course-page/lesson-view-content.svelte`       |
| 4     | Create | `packages/ui/src/custom/course-page/course-content-view.svelte`       |
| 5     | Create | `packages/ui/src/custom/course-page/course-page-sidebar.svelte`       |
| 6     | Create | `packages/ui/src/custom/course-page/course-page-header.svelte`        |
| 7     | Create | `packages/ui/src/custom/course-page/course-page.svelte`               |
| 8     | Create | `packages/ui/src/custom/course-page/index.ts`                         |
| 9     | Update | `packages/ui/src/index.ts`                                            |
| 10    | Create | `packages/storybook/src/pages/course-page/course-page-fixtures.ts`    |
| 11    | Create | `packages/storybook/src/pages/course-page/course-page.stories.svelte` |
| 12    | Create | `apps/dashboard/src/lib/features/course/utils/course-page-config.ts`  |
| 13    | Update | `apps/dashboard/src/routes/courses/[id]/+layout.svelte`               |


