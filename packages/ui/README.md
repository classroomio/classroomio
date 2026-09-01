# @cio/ui

UI component library for ClassroomIO, built with Svelte 5 and Tailwind CSS.

## Package Information

- **Name**: `@cio/ui`
- **Type**: Svelte component library
- **Framework**: Svelte 5
- **Styling**: Tailwind CSS with custom `ui` prefix

## Folder Structure

```
packages/ui/
├── src/
│   ├── base/          # Components from shadcn-svelte
│   ├── custom/        # Components from other sources or built on top of base components
│   ├── hooks/         # Reusable Svelte hooks
│   ├── tools/         # Utility functions (cn, sanitize, etc.)
│   ├── index.css      # Global styles
│   └── index.ts       # Main export file
├── package.json
├── components.json    # shadcn-svelte configuration
└── jsrepo.json        # jsrepo configuration
```

## Storybook

We maintain a Storybook instance at `packages/storybook` to make it easy to browse, visualize, and reuse every UI component in the app. Instead of digging through source code or guessing how a component looks, you can see each piece rendered in isolation with its variants, props, and states documented.

This is especially useful when you're building a new feature and need to find the right existing component — check Storybook first before creating something from scratch.

<img alt="Storybook Preview" src="https://brand.cdn.clsrio.com/storybook-preview.png" />

To run it locally:

```bash
cd packages/storybook && pnpm dev
```

See `packages/storybook/README.md` for detailed instructions on creating stories and publishing.

## Content Structure

### Base Components (`src/base/`)

All components in the `base` directory are primarily from [shadcn-svelte](https://www.shadcn-svelte.com/). These are the foundational UI components that follow the shadcn design system.

**Guidelines:**

- Any new component from shadcn-svelte should be added to the `base` directory
- Components are organized in their own folders with an `index.ts` file for exports
- Each component folder typically contains the main component file(s) and an `index.ts` export file

**Examples:**

- `base/button/` - Button component from shadcn-svelte
- `base/dialog/` - Dialog component from shadcn-svelte
- `base/tooltip/` - Tooltip component from shadcn-svelte

### Custom Components (`src/custom/`)

Components in the `custom` directory come from various sources or are built on top of base components:

1. **External Sources:**
   - Components from [shadcn-svelte-extras](https://www.shadcn-svelte-extras.com/)
   - Components from [Edra Editor](http://edra.tsuzat.com/) (rich text editor)
   - Other third-party component libraries

2. **Extended Components:**
   - Any component that builds on top of shadcn-svelte base components
   - Custom implementations that extend base component functionality

**Examples:**

- `custom/code/` - From shadcn-svelte-extras (syntax-highlighted code block with copy and overflow)
- `custom/underline-tabs/` - From shadcn-svelte-extras
- `custom/editor/` - Rich text editor based on Edra/Tiptap
- `custom/image-cropper/` - Custom image cropping component
- `custom/checkbox-field/` - Field component built on top of base Checkbox
- `custom/newsfeed-reactions/` - Newsfeed reaction picker and summary used by course and program feeds
- `custom/course-creator/` - ChatGPT-style course creation input with level and type selects

### Exercise question (`src/custom/exercise-question/`)

Learner and author UIs for exercise questions (take, preview, review, submission, edit per question type).

- **`renderers/shared/`** — Cross-type presentation pieces reused by multiple question families (for example `labeled-value-row.svelte`, `mcq-preview-option-row.svelte`, `submission-response-pie-chart.svelte`). Mode entry files stay thin; add new shared pieces here when two or more types need the same markup.
- **`renderers/<question-type>/`** — One folder per type (`radio`, `numeric`, …) containing `take.svelte`, `preview.svelte`, and optional `review.svelte`, `submission.svelte`, `edit.svelte`, plus type-specific fragments (for example `numeric-expected-fields.svelte`, `ordering-display.svelte`).
- **`renderers/option-image.svelte`**, **`renderers/submission-utils.ts`** — Existing shared helpers at the `renderers/` root; keep importing from there unless consolidating in a later pass.

**Types with heavier or distinct UIs** (textarea editor, file upload, matching/hotspot authoring, link lists) intentionally keep separate `take` / `preview` implementations until a second consumer (for example a dedicated `review` mode) justifies extracting more shared fragments.

### Question type picker (`src/custom/question-type-picker/`)

Marketing / demo widget: left-hand list of question types and a live **take**-mode preview using `ExerciseQuestion.QuestionRenderer`. Copy is English-only (no dashboard i18n). Also consumed by the **`@cio/embeds`** app as a CDN bundle (`apps/embeds`).

### Attachment list (`src/custom/attachment-list/`)

Presentational list for lesson (or similar) file attachments with **view** and **edit** modes. View mode shows a header (paperclip + title + file count) and rows with view/download icon buttons. Edit mode shows sortable rows (when `onReorder` is provided) with a drag handle, view, and delete actions. Copy is passed via the `labels: AttachmentListLabels` prop (including `reorder` for the drag handle) so dashboard wrappers can supply translated strings. `AttachmentListFile.type` accepts a file extension or MIME type for icon styling. See `Molecules/AttachmentList` in Storybook.

### Public course Copy Page (`src/custom/public-course/copy-page-button.svelte`)

Split button used on public lesson pages when the course has Markdown export enabled. Primary action copies the lesson Markdown; the chevron menu offers View as Markdown, Open in ChatGPT, and Open in Claude. Copy is passed via `labels: CopyPageLabels`. The host app supplies `markdownUrl` plus ChatGPT/Claude URLs (see `buildStudyPrompt`, `buildChatGptUrl`, `buildClaudeUrl`) and snackbar callbacks. Render it through `PublicLessonView`'s `titleActions` snippet so it sits beside the lesson title **on viewports below `lg`**. See `Molecules/PublicCourse` → **Lesson · Copy Page split button** in Storybook.

### Public course outline rail actions (`src/custom/public-course/outline-rail-actions.svelte`)

Muted icon+label links rendered **under** `PageOutline`, separated by a top border. Matches the docs-site pattern (copy, share, open in chat):

- **Copy as Markdown** — same fetch as Copy Page; only when `markdownUrl` is set.
- **Share on social media** — dropdown for Facebook, LinkedIn, and X (intent URLs). Instagram copies the page URL (there is no web share intent) and the host shows a snackbar via `onInstagramCopied`.
- **Open in chat** — dropdown for ChatGPT and Claude when those URLs are passed.

Pass copy via `labels: OutlineRailActionLabels`. Render through `PublicLessonView` / `PublicExerciseView`'s `outlineActions` snippet. Share-only is valid for exercises. See `Molecules/PublicCourse` → **Lesson · outline rail actions**.

### Page outline (`src/custom/page-outline/`)

Sticky in-page table of contents for long-form content (public lessons, exercises, docs). Pass `items: PageOutlineItem[]` (`id`, `title`, `level` 1–3). Clicking an item updates the URL hash, restores that hash on reload, and highlights the active heading via `IntersectionObserver`. Hierarchy is shown with left-border indent (`h1` / `h2` / `h3`).

**Hidden on mobile by default.** `hideBelow` defaults to `lg` (`hidden` below that breakpoint). Pass `never` when the parent already hides the rail (for example `PublicLessonView`'s `aside`). Pin the rail to the **page** edge (a full-width flex sibling of the article column), not next to a centered content max-width. Put copy / share / chat links under the outline via `OutlineRailActions` (see **Public course outline rail actions**). Helpers: `injectHeadingIds(html)` rewrites `h1`–`h3` with unique ids and returns outline entries; `withPageTitle` prefixes the page title; `outlineFromSections` builds a title + subsection list. See `Molecules/PageOutline` in Storybook.

### Comment tree (`src/custom/comment-tree/`)

Presentational parts for an arbitrarily deep comment thread. All copy is passed in, so dashboard wrappers supply translated strings. See `Molecules/CommentTree` in Storybook.

- `Root` / `Item` — layout wrappers.
- `Node` — the recursive node. It renders one comment via the `body` snippet, then recurses over `node.children`. It imports its own file to recurse (`svelte:self` is deprecated in Svelte 5). Indent is applied as an inline `padding-left` from `indentStep` rather than a class, because a composed `ui:pl-*` string would never be emitted. At `indentCap` (default 5) indenting stops and `onContinueThread` is offered instead, so deep chains stay readable on narrow screens. Collapse state is not held by the node — pass `isCollapsed(id)` and `onToggleCollapse(id)` so it survives remounts and sibling appends.
- `CollapseToggle` — the `[−]` / `[+]` control. Carries `aria-expanded` and `aria-controls` pointing at the children container.
- `ThreadLine` — the vertical rail beside a nesting level; a real `<button>` so it is a keyboard-safe target, with `tabindex="-1"` to avoid a duplicate tab stop per level.
- `MoreReplies` — one control for both "N more replies" (`kind="more"`) and "Continue this thread" (`kind="continue"`).
- `Header` — avatar, name, optional `roleBadge`, date, and an edit/delete dropdown gated by `canEdit` / `canDelete`.
- `Content` — sanitizes and renders comment HTML.
- `Actions` — reply button plus an optional delete dropdown.
- `Input` — the composer, with optional "replying to" chrome that is live UI state and never persisted.
- `ReplyingTo` — the "↳ Replying to @X" line. Only for rows written before replies carried a real parent, where the visual parent is the thread root rather than the comment being answered.
- `Replies` — superseded by `Node`; kept for compatibility and no longer used.

### Live session card (`src/custom/live-session-card/`)

Presentational card for a live-class lesson with three states (`live`, `upcoming`, `ended`) derived from `lessonAt` + `durationMinutes`, or forced via the `status` prop (used by Storybook). Shows a join/copy action set when live, an "Add to calendar" combo button (Google, Outlook.com, Office 365, Yahoo, plus an `.ics` download for Apple) and a countdown when upcoming. All copy is passed in via the `labels: LiveSessionLabels` prop, so the dashboard wrapper supplies translated strings; `onCopyLink` fires after the link is copied (e.g. for a snackbar). See `Molecules/LiveSessionCard` in Storybook.

### Hooks (`src/hooks/`)

Reusable Svelte hooks are located in the `src/hooks/` directory. These are Svelte 5 runes-based utilities that can be used across components.

**Available Hooks:**

- `is-mobile.svelte.ts` - Media query hook for mobile breakpoints
- `use-clipboard.svelte.ts` - Clipboard copy functionality with state management

**Usage:**

```svelte
<script lang="ts">
  import { isMobileStore } from '@cio/ui/hooks/is-mobile.svelte';
  import { UseClipboard } from '@cio/ui/hooks/use-clipboard.svelte';
</script>
```

### Tools (`src/tools/`)

Utility functions and helpers are located in `src/tools/`. The main utility is the `cn` function for class name merging.

### Page layout (`src/base/page/`)

Composable page shell used across dashboard list and settings screens. Import as `import * as Page from '@cio/ui/base/page'`.

| Export                         | Purpose                                                      |
| ------------------------------ | ------------------------------------------------------------ |
| `Page.Root`                    | Flex column wrapper with minimum viewport height             |
| `Page.Header`                  | Title row; pass `isSticky` to pin the header while scrolling |
| `Page.HeaderContent`           | Title + subtitle column                                      |
| `Page.Title` / `Page.Subtitle` | Page heading and description                                 |
| `Page.Action`                  | Right-aligned header actions                                 |
| `Page.Body`                    | Main content area (`child` snippet)                          |
| `Page.BodyHeader`              | Toolbar inside the body                                      |
| `Page.SettingsActions`         | Compact save/discard card for dirty settings forms           |

**Settings pages:** Place `Page.SettingsActions` as the last child inside `Page.Root`, after `Page.Body`. The card uses `position: sticky; bottom: 0` so it stays pinned to the viewport bottom while you scroll, then settles into normal flow at the end of the page. Do not put `overflow` on `Page.Root` that would break sticky positioning (horizontal overflow on `Page.Body` is fine). The card is compact and centered (not full width) and **only renders when `hasChanges` is true**. Pass translated `statusLabel`, `discardLabel`, and `saveLabel` props from the dashboard. Save is a primary button; Discard is a secondary button. Use `disabled` to block Save only (Discard still follows `loading`). Use `contentClass` for extra classes on the inner card when needed.

**`Page.Root` can come from a layout.** "Last child of `Page.Root`" is a runtime relationship, not a same-file one. Where a `+layout.svelte` owns the `Page.Root` and renders pages into it via `{@render children?.()}`, the page file itself contains only `Page.Header`, `Page.Body`, and `Page.SettingsActions` — that is correct and already satisfies the rule. Do **not** add a second `Page.Root` in the page: nesting them stacks two `min-h-[calc(100vh-48px)]` containers, drops the layout's width constraints, and shortens the sticky bar's containing block so it stops floating. Pages that rely on a layout-owned `Page.Root`:

- `routes/(app)/org/[slug]/settings/+page.svelte` and `settings/org/+page.svelte`, `settings/customize-lms/+page.svelte`, `settings/notifications/+page.svelte` → `routes/(app)/org/[slug]/settings/+layout.svelte`
- `routes/(app)/lms/settings/+page.svelte`, `routes/(app)/lms/settings/notifications/+page.svelte` → `routes/(app)/lms/settings/+layout.svelte`

**Never render `Page.SettingsActions` from inside `Page.Body`.** That includes rendering it from a feature component that a route passes into `Page.Body`'s `child` snippet. `Page.Body` sets `overflow-x-hidden`, and CSS computes `overflow-y` to `auto` whenever the other axis is not `visible` — so `Page.Body` is a scroll container. It is sized by its content and never scrolls internally, so a sticky bar inside it has no travel and renders flat at the end of the content. Keep the bar a sibling of `Page.Body` and lift the dirty/saving state up to the route with `bind:this` and `bind:hasUnsavedChanges`, the way `routes/(app)/courses/[id]/settings/+page.svelte` does.

The card also sits at `z-50`, matching the editor root so it paints above editor content (later in DOM wins the tie) while staying below body-portaled dialogs and sheets. The sticky wrapper is full width with `pointer-events: none` so it does not block clicks beside the compact card.

| Prop           | Description                                            |
| -------------- | ------------------------------------------------------ |
| `hasChanges`   | When true, shows the floating save/discard card        |
| `loading`      | Shows loading state on Save                            |
| `disabled`     | Disables Save only (e.g. while not initialized)        |
| `contentClass` | Extra classes on the inner card (width, padding, etc.) |
| `statusLabel`  | Left-side status text (e.g. "Unsaved changes")         |
| `discardLabel` | Discard button label                                   |
| `saveLabel`    | Save button label                                      |
| `onSave`       | Save handler                                           |
| `onDiscard`    | Discard handler                                        |

```svelte
<Page.Root>
  <Page.Header>...</Page.Header>
  <Page.Body>
    {#snippet child()}
      <!-- form sections -->
    {/snippet}
  </Page.Body>
  <Page.SettingsActions
    hasChanges={hasUnsavedChanges}
    loading={isSaving}
    statusLabel={$t('common.unsaved_changes.label')}
    discardLabel={$t('common.discard')}
    saveLabel={$t('common.save_changes')}
    onSave={handleSave}
    onDiscard={handleDiscard}
  />
</Page.Root>
```

See `Molecules/Page` → **Settings Actions** in Storybook.

## Importing `cn`

The `cn` utility function is used throughout the codebase for merging Tailwind CSS classes. It combines `clsx` and `tailwind-merge` to handle class conflicts intelligently.

**Import:**

```typescript
import { cn } from '../../tools';
```

**Example usage:**

```svelte
<script lang="ts">
  import { cn } from '../../tools';

  let { class: className } = $props();
</script>

<div class={cn('ui:bg-primary ui:text-white', className)}>Content</div>
```

The `cn` function is exported from `src/tools/index.ts` and is also available as a named export from the main package:

```typescript
import { cn } from '@cio/ui';
```

## Tailwind Prefix

All Tailwind CSS classes in this package use a custom prefix: **`ui`**

This ensures that styles don't conflict with other Tailwind configurations in consuming applications.

**Usage:**

```svelte
<div class="ui:bg-primary ui:text-primary-foreground ui:rounded-md">Content</div>
```

**Note:** When adding new components or styles, always use the `ui:` prefix for all Tailwind classes.

## Component Exports

Components are exported from the main `src/index.ts` file in an alphabetical order. There are two main export patterns:

### Base Components

Base components are exported as namespaced exports:

```typescript
export * as Button from './base/button';
export * as Dialog from './base/dialog';
export * as Tooltip from './base/tooltip';
```

**Usage:**

```svelte
<script lang="ts">
  import { Button, Dialog, Tooltip } from '@cio/ui';
</script>

<Button.Root>Click me</Button.Root>
<Dialog.Root>...</Dialog.Root>
```

### Custom Components

Custom components may use namespaced exports or direct exports depending on their structure:

```typescript
// Namespaced
export * as UnderlineTabs from './custom/underline-tabs';

// Direct exports
export { Chip } from './custom/chip';
export { IconButton } from './custom/icon-button';
```

**Usage:**

```svelte
<script lang="ts">
  import { UnderlineTabs, Chip, IconButton } from '@cio/ui';
</script>
```

### Component Index Files

Each component directory contains an `index.ts` file that exports the component and its types:

```typescript
// base/button/index.ts
import Root, { type ButtonProps, buttonVariants } from './button.svelte';

export { Root, Root as Button, type ButtonProps, buttonVariants };
```

## Adding New Components

When adding a new component to this package, follow these steps:

1. **Determine the location:**
   - If it's from shadcn-svelte → add to `src/base/`
   - If it's from another source or extends base components → add to `src/custom/`

2. **Create the component structure:**
   - Create a folder with the component name (kebab-case)
   - Add the component file(s)
   - Create an `index.ts` file for exports

3. **Export from main index:**
   - Add the export to `src/index.ts`

4. **Add Tailwind prefix:**
   - Run `pnpm prefix` to automatically add the `ui:` prefix to all Tailwind classes

5. **Create a Storybook story:**
   - **Required:** After adding a new component, you must add a story for it in `packages/storybook`
   - See `packages/storybook/README.md` for detailed instructions on how to create stories
   - Stories help document component usage and enable visual testing

## Development

### Scripts

- `pnpm generate-css` - Generate CSS from Tailwind
- `pnpm build` - Build the package
- `pnpm dev` - Watch mode for CSS generation
- `pnpm format` - Format code with Prettier
- `pnpm prefix:list` - List files that need the `ui:` prefix (dry-run, exit 0)
- `pnpm prefix:check` - Fail if any file under `src/` needs the `ui:` prefix
- `pnpm prefix:check:staged` - Fail if **staged** `packages/ui` files need the prefix (pre-commit)
- `pnpm prefix:check:changed` - Fail if **changed** `packages/ui` files need the prefix (CI; set `UI_PREFIX_GIT_BASE`)
- `pnpm prefix` - Add `ui:` prefix to all Tailwind classes and format

### Configuration

- `components.json` - shadcn-svelte configuration
- `jsrepo.json` - jsrepo configuration for component installation
- `svelte.config.js` - Svelte configuration
- `tsconfig.json` - TypeScript configuration
