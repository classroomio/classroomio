---
name: Course Page UI Storybook
overview: Extract the course page UI (sidebar + content shell) into a reusable `CoursePage` component in `packages/ui`, add a Storybook story under `Pages/CoursePage` that accepts JSON to form the whole page, and wire the dashboard layout to use it by passing data.
todos: []
isProject: false
---

# Course Page UI Extraction and Storybook Integration

## Current State

- **Layout**: `[apps/dashboard/src/routes/courses/[id]/+layout.svelte](apps/dashboard/src/routes/courses/[id]/+layout.svelte)` uses `Sidebar.Provider` → `CourseSidebar` + `Sidebar.Inset` (CourseHeader + children in `Page.Root`)
- **Sidebar**: `[course-sidebar-navigation.svelte](apps/dashboard/src/lib/features/course/components/sidebar/course-sidebar-navigation.svelte)` has nav items (News Feed, Lessons + content tree, Analytics, Attendance, Submissions, Marks, Certificates, Landing Page, People, Settings) with conditional visibility via `courseApi`, `$currentOrg`, `$globalStore`, etc.
- **Pattern reference**: Exercise questions use `packages/ui` components + `packages/storybook` fixtures (JSON) and `QuestionTypeModes` for different modes; stories under `Molecules/ExerciseQuestion`

## Architecture

```mermaid
flowchart TB
  subgraph packages_ui [packages/ui]
    CoursePage[CoursePage Component]
    CoursePageSidebar[CoursePageSidebar]
    CoursePageTypes[course-page-types.ts]
  end

  subgraph packages_storybook [packages/storybook]
    CoursePageStories[Pages/CoursePage Stories]
    CoursePageFixtures[course-page-fixtures.ts]
  end

  subgraph dashboard [apps/dashboard]
    Layout[courses/[id]/+layout.svelte]
    ConfigAdapter[Config Adapter - build config from course/org state]
  end

  CoursePageFixtures -->|JSON config| CoursePageStories
  CoursePageStories -->|renders| CoursePage
  ConfigAdapter -->|JSON config| Layout
  Layout -->|passes config + children| CoursePage
```



## 1. Define JSON Config Schema

Create `[packages/ui/src/custom/course-page/course-page-types.ts](packages/ui/src/custom/course-page/course-page-types.ts)` with a config-driven shape:

```ts
// Core types - no dashboard/API imports
export interface CoursePageConfig {
  course: { id: string; title: string };
  sidebar: CourseSidebarConfig;
  /** Optional - used by Storybook for mock content; dashboard uses children instead */
  content?: { type: string; data?: unknown };
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
  icon?: 'newsfeed' | 'content' | 'analytics' | 'attendance' | 'submissions' | 'marks' | 'certificates' | 'landingpage' | 'people' | 'settings' | 'section';
  contentTree?: CourseContentTreeSection[];
  contentCount?: { lessons: number; exercises: number };
}

export interface CourseContentTreeSection {
  id: string;
  title: string;
  items: { id: string; title: string; type: 'LESSON' | 'EXERCISE'; url?: string; isComplete?: boolean; isUnlocked?: boolean }[];
}
```

Icon mapping: string keys → existing `@cio/ui/custom/moving-icons` (NewsFeedIcon, ContentIcon, etc.)

## 2. Create CoursePage Component in packages/ui

**Location**: `packages/ui/src/custom/course-page/`

**Components**:

- `course-page.svelte` – Root: `Sidebar.Provider` + `CoursePageSidebar` + `Sidebar.Inset` (header + content slot)
- `course-page-sidebar.svelte` – Renders sidebar from `CourseSidebarConfig` (no `courseApi`, org stores, or translations – uses config only)
- `course-page-header.svelte` – Simple header: Sidebar.Trigger + course title (Search/notifications stay in dashboard for now)

**Props**:

- `config: CoursePageConfig` (required)
- `content` snippet (optional) – dashboard passes `{@render children()}`, Storybook passes a mock renderer

**Sidebar behavior**:

- Uses `@cio/ui/base/sidebar` primitives
- Renders nav items from `config.sidebar.navItems`
- For `isLesson` items, renders expandable content tree from `contentTree`
- No OrgLogo/UpgradePoweredBy in the UI package – use placeholder (e.g. "Org Logo") or accept optional `sidebarHeader` snippet for customization

## 3. Placeholder for Dashboard-Specific Pieces

The current sidebar uses:

- `OrgLogo` (from `$features/ui/sidebar`)
- `UpgradePoweredBy` (org plan)
- `ContentCreateModal`, `ContentCountBadges`, `IconButton` for add content

**Approach**: CoursePage accepts optional snippets:

- `sidebarHeader` – default: simple "Course" text; dashboard overrides with OrgLogo
- `sidebarFooter` – default: empty; dashboard overrides with UpgradePoweredBy when free plan
- For add-content button and ContentCountBadges on the Lessons item: include in config (`showAddButton`, `contentCount`) and render when present; dashboard passes these, Storybook omits or mocks

## 4. Storybook Integration

**New folder**: `packages/storybook/src/pages/course-page/`

**Files**:

- `course-page-fixtures.ts` – JSON fixtures defining full course page configs:
  - `FULL_INSTRUCTOR_FIXTURE` – all nav items, Lessons expanded with 2 sections and sample lessons/exercises
  - `STUDENT_MINIMAL_FIXTURE` – News Feed, Lessons, Certificates only
  - `CONTENT_FOCUS_FIXTURE` – Lessons active with rich content tree
- `course-page.stories.svelte` – Stories under `Pages/CoursePage`:
  - **Default** – uses FULL_INSTRUCTOR_FIXTURE, content area shows placeholder based on `config.content.type`
  - **Student view** – uses STUDENT_MINIMAL_FIXTURE
  - **Lessons expanded** – uses CONTENT_FOCUS_FIXTURE

**Content placeholder**: For Storybook, when `config.content` is present, render a simple card: "Content: {type}" and optionally stringify `data` for inspection. Actual content rendering is out of scope.

## 5. Dashboard Integration

**Adapter**: Create `apps/dashboard/src/lib/features/course/utils/course-page-config.ts`:

- `buildCoursePageConfig(course, path, { isStudent, ... })` – maps real course/org state to `CoursePageConfig`
- Reuses `getCourseContent`, `getNavItemRoute`, `getLessonsRoute`, `NAV_IDS`, translation keys

**Layout update**: `[apps/dashboard/src/routes/courses/[id]/+layout.svelte](apps/dashboard/src/routes/courses/[id]/+layout.svelte)`:

- When `isCourseReady`: compute config via `buildCoursePageConfig`
- Render `CoursePage` from `@cio/ui` with `config` and `content` snippet = `{@render children()}`
- Keep existing logic: `Dialog.Root` (not permitted), `ContentCreateModal`, `Confetti`, loading state
- Dashboard-specific pieces (OrgLogo, UpgradePoweredBy, add-content button) passed as snippets where the adapter indicates they should show

**Alternative (simpler first pass)**: Keep `CourseSidebar` and `CourseHeader` in the dashboard; extract only a "shell" that accepts config. The shell would be the `Sidebar.Provider` + `Sidebar.Inset` + `Page.Root` structure, with sidebar and header as slots. That allows incremental migration.

## 6. Exports and Wiring

- Add `packages/ui/src/custom/course-page/index.ts` and export from `packages/ui/src/index.ts`
- Ensure `packages/storybook` depends on `@cio/ui` (already does)
- Storybook stories path: `../src/pages/course-page/*.stories.svelte` (covered by existing `../src/**/*.stories.@(js|ts|svelte)`)

## 7. Out of Scope (Deferred)

- Actual content renderers (News Feed, Lessons list, Analytics, etc.) driven by JSON – user said "can be broken down later"
- `ContentCreateModal` integration in the CoursePage component
- Search and notifications in the header – remain dashboard-specific for now

## File Summary


| Action | Path                                                                  |
| ------ | --------------------------------------------------------------------- |
| Create | `packages/ui/src/custom/course-page/course-page-types.ts`             |
| Create | `packages/ui/src/custom/course-page/course-page-sidebar.svelte`       |
| Create | `packages/ui/src/custom/course-page/course-page-header.svelte`        |
| Create | `packages/ui/src/custom/course-page/course-page.svelte`               |
| Create | `packages/ui/src/custom/course-page/index.ts`                         |
| Update | `packages/ui/src/index.ts` (export CoursePage)                        |
| Create | `packages/storybook/src/pages/course-page/course-page-fixtures.ts`    |
| Create | `packages/storybook/src/pages/course-page/course-page.stories.svelte` |
| Create | `apps/dashboard/src/lib/features/course/utils/course-page-config.ts`  |
| Update | `apps/dashboard/src/routes/courses/[id]/+layout.svelte`               |


