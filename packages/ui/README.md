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

### Action popover (`src/custom/action-popover/`)

Popover with a scrollable body, an optional search bar, and a pinned full-width action button in the footer. Import as `import { ActionPopover } from '@cio/ui/custom/action-popover'`. The default trigger is an outline icon `Button` with a plus icon; pass a `trigger` snippet (receives `{ props }` to spread on your own control) to replace it. Content is passed via the `children` snippet and scrolls at `max-h-64` (override with `bodyClass`). When `buttonText` is set, the footer renders below a border; clicking it awaits `onAction` (showing a spinner when it returns a Promise) and closes the popover unless `closeOnAction` is false. Omitting `buttonText` renders no footer. All copy comes from props, so dashboard wrappers supply translated strings.

Passing `searchPlaceholder` renders a search input above the scrollable body — independent of `title`, so it works with or without a heading. The component does not filter content itself; bind `searchQuery` (cleared automatically when the popover closes) and filter your list in the consumer.

| Prop                | Description                                                  |
| ------------------- | ------------------------------------------------------------ |
| `title`             | Optional heading rendered above the scrollable body          |
| `buttonText`        | Footer button label; omit to render no footer                |
| `onAction`          | Footer button handler; may return a Promise (shows loading)  |
| `buttonDisabled`    | Disables the footer button                                   |
| `buttonLoading`     | Forces the footer loading state                              |
| `closeOnAction`     | Close the popover after the action resolves (default `true`) |
| `align`             | Popover alignment (default `start`)                          |
| `contentClass`      | Extra classes on `Popover.Content` (e.g. width)              |
| `bodyClass`         | Extra classes on the padded body wrapper                     |
| `searchPlaceholder` | Show a search bar when provided; used as its placeholder     |
| `searchQuery`       | Bindable search query; cleared when the popover closes       |
| `open`              | Bindable open state                                          |
| `trigger`           | Optional snippet replacing the default plus-icon trigger     |
| `children`          | Snippet with the popover body content                        |

See `Molecules/ActionPopover` in Storybook.

### Vimeo link form (`src/custom/vimeo-link-form/`)

Form component for validating, normalizing, and attaching Vimeo video links (standard, channels, showcases, and unlisted URLs with privacy hashes). Displays domain-level privacy guidance with a one-click host copy button and a direct link to Vimeo's official domain privacy documentation.

| Prop                  | Purpose                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `inputLabel`          | Text label for the link input                                                                    |
| `inputPlaceholder`    | Placeholder text inside the input                                                                |
| `addButtonLabel`      | Label for the submit button                                                                      |
| `invalidVimeoMessage` | Error text displayed when the input contains invalid Vimeo links                                 |
| `privacyHintPrefix`   | Optional leading text before the copyable domain badge                                           |
| `privacyHintSuffix`   | Optional trailing text after the copyable domain badge                                           |
| `disabled`            | Disables the input and submit button                                                             |
| `onSubmit`            | Callback `(links: string[]) => Promise<void> \| void` invoked with deduplicated, canonical links |
| `onInputChange`       | Optional callback when the raw input text changes                                                |

See `Molecules/VimeoLinkForm` in Storybook.

### Media player (`src/custom/media-player/`)

Unified video player component supporting HTML5 video (direct MP4 and HLS via `hls.js`), YouTube embeds, and Vimeo videos via the official `@vimeo/player` SDK.

**Features:**

- **Native Vimeo SDK Integration**: Seamless playback with strict-origin referrer policy and unlisted privacy hash support (`?h=...`).
- **Domain Privacy Error Recovery**: Automatically detects Vimeo `PrivacyError` events on domain-restricted videos, providing instructors with the exact host to whitelist and a live Retry button, while displaying a learner-friendly notice in learner mode.
- **HLS Adaptive Streaming**: Plays master manifests via signed cookies or token auth with automatic rendition selection.
- **YouTube Embeds**: Lightweight iframe embed with responsive aspect-ratio wrappers.

| Option                    | Purpose                                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `source`                  | `VideoSource` object (`type: 'upload' \| 'hls' \| 'youtube' \| 'vimeo' \| 'generic'`, `url`, `metadata`, `tracks`) |
| `options.isLearnerView`   | When `true`, displays learner-friendly fallback messages instead of technical configuration hints                  |
| `options.onTimeUpdate`    | Callback invoked as playback position advances                                                                     |
| `options.onPlayerReady`   | Callback invoked when the underlying player SDK is initialized                                                     |
| `options.vimeoRetryLabel` | Optional label override for the Vimeo playback retry button                                                        |

### Combo button (`src/custom/combo-button/`)

A split button: a labelled primary action joined to a chevron that opens a menu of alternatives. Import as `import { ComboButton, type ComboButtonItem } from '@cio/ui/custom/combo-button'`.

Use it when there is a genuine default worth one click, and **label the primary half with the action it performs** — `Export as CSV`, not `Export`. An unlabelled primary silently picks one of the alternatives for the user. When no option dominates, use a plain `Button` with a `DropdownMenu` instead.

Each item owns its own handler, so the component carries no behaviour: the consumer passes `onSelect` for the primary and one per item. Copy comes from props, so dashboard callers supply translated strings.

| Prop        | Description                                                      |
| ----------- | ---------------------------------------------------------------- |
| `label`     | Primary button label; name the action, not a category            |
| `onSelect`  | Primary button handler; may return a Promise                     |
| `items`     | Menu entries (`ComboButtonItem[]`), each with its own `onSelect` |
| `menuLabel` | Accessible name for the chevron, which has no visible text       |
| `icon`      | Optional lucide icon for the primary half                        |
| `variant`   | Button variant applied to both halves (default `outline`)        |
| `size`      | `sm` \| `default` \| `lg` (default `sm`)                         |
| `disabled`  | Disables both halves                                             |
| `loading`   | Spinner on the primary half; also disables the menu              |
| `align`     | Menu alignment (default `end`)                                   |
| `testId`    | Primary `data-testid`; the chevron gets `${testId}-menu`         |

`ComboButtonItem` takes `id`, `label`, and `onSelect`, plus optional `icon`, `description` (rendered muted beneath the label — use it to say _why_ an item is disabled rather than hiding it), `disabled` and `destructive`.

See `Molecules/ComboButton` in Storybook.

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
| `Page.FloatingBar`             | Shell for the bar that rises from the bottom of a page       |
| `Page.SettingsActions`         | Compact save/discard card for dirty settings forms           |

**`Page.FloatingBar`** owns the dark pill itself: sticky at the bottom, centered, `z-50`, with a `pointer-events: none` wrapper so it does not block clicks beside it. `Page.SettingsActions` is built on it, and so is the audience selection bar, which is why the two look identical without either re-implementing the pill. Pass `show`, a `status` string (also announced to screen readers, since the bar appearing *is* the notification), an optional `badge` snippet before the status, and the buttons as children.

Set `fixed` to pin it to the viewport instead of sticking it to the end of the page content. **Anything rendered through `Page.Body`'s `child` snippet must use `fixed`**, because `Page.Body` sets `overflow-x-hidden` and a sticky bar inside a scroll container has no travel. It is a boolean rather than a `'sticky' | 'fixed'` union deliberately: the `ui:` prefix script rewrites class-like string literals, and turns `position === 'fixed'` into `position === 'ui:fixed'`, which never matches.

See `Molecules/PageFloatingBar` in Storybook.

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

## Test hooks (`testId`)

Optional `testId` props on form wrappers and buttons render `data-testid` for Playwright. Prefer roles/labels first; use `testId` when a flow needs a stable, locale-independent hook.

Supported today: `InputField`, `TextareaField`, `CheckboxField`, `Button`. Fixed ids on `Page.SettingsActions` (`page-settings-save`, `page-settings-discard`).

```svelte
<InputField testId="course-settings-title" label="Title" bind:value={title} />
<Button testId="course-create-submit">Create</Button>
```

Registry and naming rules: `e2e/README.md` and AGENTS.md § E2E test hooks.

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
