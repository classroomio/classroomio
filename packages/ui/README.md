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
- `base/dialog/` - Dialog component from shadcn-svelte (see [Dialog button hierarchy](#dialog-button-hierarchy) below)
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
- `custom/attention-highlight/` - Prop-driven focus pulse and smooth scroll wrapper to draw user attention to specific items
- `custom/question-type-picker/` - Question type picker modal and QuestionTypeIcon glyph/icon component
- `custom/org-landing-page/` - 11-theme org and course landing page system, including `LearnerMenu` authenticated popover
- `custom/add-block/` - the add-content entry points for lessons (`Menu` between-block plus, `Grid` tile grid, `Row` floating add bar, `AiButton` Ask AI trigger, `AiLauncher` empty-state Ask AI, `Item` choice button)
- `custom/block/` - lesson block container (ordering, gap menus, rail) and presentational blocks (image, document, slide, video, note, chart, flashcards, tabs, multiple choice, process, HTML)

### Question type icon (`src/custom/question-type-picker/question-type-icon.svelte`)

Renders a question type glyph tile or Lucide icon based on `key` (QuestionTypeKey) or `typeId` (number), matching the design system from the question type picker.

| Prop        | Type                        | Default | Description                                          |
| ----------- | --------------------------- | ------- | ---------------------------------------------------- |
| `key`       | `QuestionTypeKey \| string` | `null`  | Question type key (e.g. `'RADIO'`, `'SHORT_ANSWER'`) |
| `typeId`    | `number`                    | `null`  | Numeric question type ID                             |
| `class`     | `string`                    | `''`    | Additional classes for the container tile            |
| `iconClass` | `string`                    | `''`    | Additional classes for the inner Lucide icon         |

```svelte
<QuestionTypeIcon typeId={offender.typeId} />
<QuestionTypeIcon key="SHORT_ANSWER" class="ui:size-8" />
```

### Attention highlight (`src/custom/attention-highlight/`)

Wrapper component that highlights its content with an animated focus pulse ring and smooth scrolls into view when triggered.

| Prop          | Type                    | Default     | Description                                                                     |
| ------------- | ----------------------- | ----------- | ------------------------------------------------------------------------------- |
| `highlight`   | `boolean`               | `false`     | When true, triggers the pulse animation and auto-scroll                         |
| `trigger`     | `number`                | `0`         | Incremental counter to imperatively trigger the pulse animation and auto-scroll |
| `duration`    | `number`                | `3`         | Duration of the pulse animation in seconds                                      |
| `autoScroll`  | `boolean`               | `true`      | Whether to smoothly scroll the element into view on trigger                     |
| `scrollBlock` | `ScrollLogicalPosition` | `'center'`  | Scroll alignment (`'center'`, `'start'`, `'nearest'`, `'end'`)                  |
| `id`          | `string`                | `undefined` | Optional DOM element id                                                         |
| `class`       | `string`                | `''`        | Additional CSS classes                                                          |
| `onComplete`  | `() => void`            | `undefined` | Callback fired when the duration timer completes                                |

```svelte
<!-- Declarative (e.g. from URL / state) -->
<AttentionHighlight highlight={isHighlighted} duration={3}>
  <div class="rounded border p-4">Content to highlight</div>
</AttentionHighlight>

<!-- Imperative (e.g. from button click) -->
<AttentionHighlight trigger={triggerCount} duration={3}>
  <div class="rounded border p-4">Content to highlight</div>
</AttentionHighlight>
```

### Brand wash (`src/custom/animation/brand-wash/`)

Decorative background layer: a top-down gradient tinted from `--primary` with an optional faded dot grid. Because it reads `--primary`, it renders in ClassroomIO blue on the app and in the org's theme colour on org sites. Place it as the first child of a `relative` container; later siblings stack above it.

| Prop    | Type      | Default     | Description                 |
| ------- | --------- | ----------- | --------------------------- |
| `dots`  | `boolean` | `true`      | Show the masked dot grid    |
| `class` | `string`  | `undefined` | Additional classes on layer |

```svelte
<div class="relative">
  <BrandWash />
  <div class="relative">Content</div>
</div>
```

### Block skyline (`src/custom/animation/block-skyline/`)

Ambient brand animation: notch blocks drop in one at a time and stack. By default they clear together and repeat on a 10s loop; with `loop={false}` they drop in once and stay. Hidden from assistive tech and static under `prefers-reduced-motion`. Tones come from `--muted` and `--primary`. Use it for ClassroomIO-branded surfaces only, not org sites.

| Prop     | Type      | Default     | Description                                                          |
| -------- | --------- | ----------- | -------------------------------------------------------------------- |
| `loop`   | `boolean` | `true`      | Clear and repeat every 10s; `false` drops in once and stays          |
| `repeat` | `number`  | `1`         | Repeats the column pattern across the width (extra copies from `md`) |
| `rows`   | `number`  | `3`         | Tallest stack; values above 3 add same-size blocks to every column   |
| `class`  | `string`  | `undefined` | Width / placement                                                    |

```svelte
<BlockSkyline class="w-full max-w-[400px]" />

<!-- Taller stacks -->
<BlockSkyline rows={6} class="w-full" />

<!-- Full-width page footer -->
<BlockSkyline loop={false} repeat={3} class="absolute inset-x-0 bottom-0 px-4" />
```

### Notch cutout utility (`ui:notch-cutout`)

Cuts the brand notch (a trapezoid with flared top corners and rounded bottom corners) out of an element's top edge with a CSS mask, so it reads correctly over gradients and images. Tune it with `--notch-x` (default `2.5rem`), `--notch-w` (`46px`) and `--notch-h` (`11px`). Masks clip `box-shadow`, so put shadows on a wrapper with `drop-shadow`.

```svelte
<div class="drop-shadow-md">
  <Card.Root class="ui:notch-cutout">…</Card.Root>
</div>
```

### Exercise question (`src/custom/exercise-question/`)

Learner and author UIs for exercise questions (take, preview, review, submission, edit per question type).

- **`renderers/shared/`** — Cross-type presentation pieces reused by multiple question families (for example `labeled-value-row.svelte`, `mcq-preview-option-row.svelte`, `submission-response-pie-chart.svelte`). Mode entry files stay thin; add new shared pieces here when two or more types need the same markup.
- **`renderers/<question-type>/`** — One folder per type (`radio`, `numeric`, …) containing `take.svelte`, `preview.svelte`, and optional `review.svelte`, `submission.svelte`, `edit.svelte`, plus type-specific fragments (for example `numeric-expected-fields.svelte`, `ordering-display.svelte`).
- **`renderers/option-image.svelte`**, **`renderers/submission-utils.ts`** — Existing shared helpers at the `renderers/` root; keep importing from there unless consolidating in a later pass.

**Types with heavier or distinct UIs** (textarea editor, file upload, matching/hotspot authoring, link lists) intentionally keep separate `take` / `preview` implementations until a second consumer (for example a dedicated `review` mode) justifies extracting more shared fragments.

### Image lightbox (`src/custom/image-lightbox/`)

Full-screen image viewer for screenshots and other detailed images. `ZoomableImage` renders an image uncropped (`object-contain`) as a button with a hover "enlarge" hint. `ImageLightbox` opens one image or a gallery: click or `+`/`-` to zoom (up to 300%), arrow keys or the side buttons to move between images, Esc or a click on the backdrop to close. Both `open` and `index` are bindable. Copy is passed via `labels: ImageLightboxLabels` (`close`, `zoomIn`, `zoomOut`, `previous`, `next`). Exercise question and option images use both in every non-edit mode. See `Molecules/ImageLightbox` in Storybook.

```svelte
<ZoomableImage {src} {alt} enlargeLabel="Click to enlarge" onclick={() => (open = true)} />
<ImageLightbox images={[{ src, alt }]} {labels} bind:open />
```

### Board frame (`src/custom/board-frame/`)

`BoardFrame` wraps one image in the ClassroomIO browser board used for help screenshots: browser chrome with three dots and a URL pill, the paper-colored board, a shelf and two feet. It mirrors the geometry in `apps/help/scripts/frame-screenshot.mjs`, so a framed image looks the same whether it is composited at build time or loaded at runtime. Pass `src`, `alt`, and optionally `url` (the text in the address pill, truncated with an ellipsis). The frame scales with its container width, and the image keeps its aspect ratio uncropped. See `Molecules/BoardFrame` in Storybook.

```svelte
<BoardFrame src={coverUrl} alt={title} url="feedback.classroomio.com/updates" />
```

### Video guide (`src/custom/video-guide/`)

Entry points for a short YouTube walkthrough of a feature. All three open the same dialog component, which plays the video from `youtube-nocookie.com` with autoplay. They take a YouTube `videoId` rather than a URL. Pass every label from the host app (`closeLabel` falls back to an untranslated "Close").

- `VideoGuideCard`: a thumbnail card with a play button, optional `badgeLabel` and `actionLabel`, and a `description`. Use it in an empty state or under a setup guide. It is centred with `max-w-md`; pass `align="start"` to keep it at the start of its container.
- `VideoGuideButton`: a button with a play icon and a `label`. Takes the `Button` `variant` (default `outline`) and `size`.
- `VideoGuideDialog`: the dialog on its own, for a custom trigger. Bind `open`.

`title` is the dialog title and the iframe title, and `closeLabel` is its close button. The card and the button own their dialog, and `open` is bindable on both. See `Molecules/VideoGuide` in Storybook.

```svelte
<VideoGuideCard
  videoId="9hpGCqzypLk"
  title={$t('video_guide.lesson_blocks.title')}
  description={$t('video_guide.lesson_blocks.description')}
  badgeLabel={$t('video_guide.new_badge')}
  actionLabel={$t('video_guide.watch_video')}
  closeLabel={$t('video_guide.close')}
/>
```

### Coach mark (`src/custom/coach-mark/`)

`CoachMark` is a small primary-colored tip with a pointer that sits under the control it introduces. Render it inside a `relative` wrapper around that control. It takes a `title`, an optional `description`, a `dismissLabel`, and an optional `actionLabel` with `onAction` and an `actionIcon` snippet. `align` (`end` by default, or `start`) picks which edge of the wrapper the tip and its pointer line up with; `class` and `arrowClass` override the position, for example at a breakpoint.

Pass `storageKey` to show the tip once: it is stored in `localStorage` when the tip is dismissed, when its action runs, or when the tip is removed from the page, and the tip stays hidden afterwards. Without `storageKey` it shows on every mount. See `Molecules/CoachMark` in Storybook.

```svelte
<div class="relative">
  <LessonModeToggle {mode} onToggle={toggleMode} />
  <CoachMark
    title={$t('video_guide.lesson_blocks.coach_title')}
    description={$t('video_guide.lesson_blocks.coach_description')}
    dismissLabel={$t('video_guide.dismiss')}
    actionLabel={$t('video_guide.watch_video')}
    storageKey="classroomio:lesson-blocks-coach-mark-seen"
    onAction={() => (videoOpen = true)}
  />
</div>
```

### Changelog cover (`src/custom/changelog-cover/`)

`ChangelogCover` is the fallback image for a changelog entry that has no cover. It draws a 1600×838 SVG in the brand style (sand background, the blue ClassroomIO mark and wordmark, a heavy Geist title with tight tracking, Geist Mono labels and a hairline) from `title`, with optional `label` (top right, default "Changelog") and `footer` (bottom left, for example a date). SVG text cannot wrap, so `layoutChangelogTitle` from `@cio/utils/functions/changelog-cover` wraps the title and steps the font size down for long ones, cutting a very long title with an ellipsis. The SVG fills its container (`preserveAspectRatio="xMidYMin slice"`, so a wide crop keeps the top row and trims from the bottom), so give the parent the aspect ratio. It inherits the page's Geist when loaded and falls back to system fonts otherwise. See `Molecules/ChangelogCover` in Storybook.

```svelte
<div class="aspect-video w-full overflow-hidden rounded-md border">
  <ChangelogCover {title} footer="Oct 5, 2026" />
</div>
```

### Question type picker (`src/custom/question-type-picker/`)

Marketing / demo widget: left-hand list of question types and a live **take**-mode preview using `ExerciseQuestion.QuestionRenderer`. Copy is English-only (no dashboard i18n). Also consumed by the **`@cio/embeds`** app as a CDN bundle (`apps/embeds`).

### Attachment list (`src/custom/attachment-list/`)

Presentational list for lesson (or similar) file attachments with **view** and **edit** modes. View mode shows a header (paperclip + title + file count) and rows with view/download icon buttons. Edit mode shows sortable rows (when `onReorder` is provided) with a drag handle, view, and delete actions. Copy is passed via the `labels: AttachmentListLabels` prop (including `reorder` for the drag handle) so dashboard wrappers can supply translated strings. `AttachmentListFile.type` accepts a file extension or MIME type for icon styling. See `Molecules/AttachmentList` in Storybook.

### Upload file card (`src/custom/upload-file-card/`)

One compact row (about 52px) for a file that is uploading or has uploaded, meant to be stacked into an upload queue next to `FileDropZone`. A file-type badge (`PDF`, `CSV`, `XLSX`, `IPYNB`, `PY`, …) sits on the left, with the file name and a one-line status beside it. While the file is in flight the card fills with a gradient that sweeps to `progress` and a 2px bar tracks the same value along the bottom edge. `status` is `queued`, `uploading`, `done` or `error`: `queued` shows `labels.queued` until the queue starts the file, `uploading` shows the percentage, `done` fades the fill and shows a green check, and `error` shows `labels.failed` followed by `errorMessage` (or the file size when there is none), with a Retry button when `onRetry` is passed. `onRemove` renders an icon-only secondary button on every state except `done`, so a finished file is never deleted by accident. Copy is passed via `labels: UploadFileCardLabels`, including the `uploading(percent)` and `transferred(uploaded, total)` formatters, so the host supplies translated strings. `size` is in bytes and formatted with `formatSize` (default `formatFileSize`). `FileTypeBadge` is the primary-tinted tile with the file extension (`size="sm"` or `"md"`); use it on its own for file pickers such as the lesson document library. See `Molecules/UploadFileCard` in Storybook.

```svelte
<UploadFileCard
  name={item.file.name}
  size={item.file.size}
  status={item.status}
  progress={item.progress}
  {labels}
  onRemove={() => queue.remove(item.id)}
  onRetry={() => queue.retry(item.id)}
/>
```

### Slide embed (`src/custom/slide-embed/`)

Guided picker, added-embed card, and 16:9 iframe for lesson slide decks. Copy is passed via `labels` so the dashboard can translate. The picker accepts a **full iframe** and offers a one-click switch when the pasted embed belongs to a different platform than the selected tab; pasted width/height are ignored and the frame always uses `aspect-video`. Platform marks use the official product logos (Google Slides, Canva, PowerPoint, Keynote, Figma, Prezi, Pitch, Gamma, SlideShare, Beautiful.ai). See `Molecules/SlideEmbed` in Storybook.

### Lesson blocks (`src/custom/block/`, `add-block/`)

The lesson block canvas is split into a reusable **container** and **block bodies**, so any host can render an ordered, draggable list of mixed content. Import via `import * as AddBlock from '@cio/ui/custom/add-block'` and `import * as Block from '@cio/ui/custom/block'` (legacy names such as `BlockList`, `ImageBlock`, `AddContentMenu` remain exported as aliases inside those namespaces).

**Container**

- `Block.List` hosts ordering (drag and drop via `svelte-dnd-action`), the gap `+` rows, the scroll rail and active-block tracking, the insert highlight, and the drag hint. It is generic over `T extends { id: string }` and takes `items`, `editable`, `spacingClass`, `addChoices`, `onAdd(type, index)`, optional `addAiLabel` / `addAiShortcut` / `onAddAi()` for the gap menu's Ask AI button, `addNewLabel` for the New badge on `isNew` choices, `gapTestId` for the gap `+`, `onReorder(items)`, and a `renderItem({ item, index, total, highlighted })` snippet. While a gap menu is open the other blocks dim. With no items it shows an `Empty` card illustrated with `MachineBlankLesson`; pass `emptyMachineHeading` with the translated label drawn on the machine (defaults to `LESSON`), or `emptyIcon` to show an icon instead. `emptyTitle` and `emptyDescription` show in both modes. Pass `emptyAction` for the editable empty state, and `showRail={false}` when the list is embedded in a narrow panel.
- `Block.Shell` renders a single block's frame: optional drag handle, type label, example badge, actions dropdown (`menuItems`), and the `highlighted` ring.
- `AddBlock.Menu` is the between-block `+` row that opens a popover with a small `AddBlock.Grid` of every choice and, when `aiLabel` and `onAi` are passed, an "Ask AI instead" `AddBlock.AiButton`. The popover opens above the `+` when it fits, below when only that side fits, and otherwise on the roomier side with a height cap so it scrolls instead of leaving the viewport. The `+` is always visible; the guide lines beside it appear when the row is hovered or focused.
- `AddBlock.Grid` is a grid of choice tiles with neutral icons (`choices`, `label`, `size`, `newLabel`, `testId`, `onSelect`). A choice with `isNew` shows a `newLabel` pill on the tile's top edge; `AddBlock.Item` and `AddBlock.Menu` take the same `newLabel`. Pass `moreLabel` and `onMore` (with `moreOpen`) to append an All blocks tile, which switches the grid to six columns. `size="lg"` is the lesson empty state: five columns (six with All blocks), two (three) when the grid is narrower than 480px. `size="sm"` is the gap menu: five columns, three below 380px.
- `AddBlock.Catalog` is the searchable All blocks list (`choices`, `label`, `searchLabel`, `noResultsLabel`, `newLabel`, `comingSoonLabel`, `autofocus`, `testId`, `onSelect`). It lists choices under their `group` heading in order of first appearance, three tiles per row (two below 400px), each with an icon, the label, an inline `newLabel` or `comingSoonLabel` pill, and the `description`. A `comingSoon` choice is disabled. The search matches label, description and group.
- `AddBlock.AiLauncher` is the Ask AI pill under the empty-state grid (`label`, `panelLabel`, `shortcut`, `open`, `onOpen`, `panel` snippet, test ids). Opening it grows the pill to its open width, then reveals the `panel` snippet from the trigger outwards with the same clip-path timing as `AddBlock.Row`; closing plays both steps in reverse and returns focus to the trigger.
- `AddBlock.AiButton` is the Ask AI trigger (`label`, `shortcut`, `variant`, `expanded`, `testId`, `onclick`): `variant="pill"` is the raised pill under the empty-state grid with the shortcut as keycaps, and `variant="menu"` is the full-width button at the bottom of the gap menu.
- `AddBlock.Item` is one choice button: an icon above a label, with `compact`, `hideLabelOnMobile`, and `testId` props. `AddBlock.Row` renders it at 12px with the label hidden on mobile.
- `AddBlock.Row` is the floating add bar shown once a lesson has blocks: Ask AI trigger, choice buttons, and the AI panel shell. `aiOpen` drives an animated clip-path reveal of the `aiPanel` snippet, keeps the toolbar `inert` while open, and restores focus to the trigger on close. Pass `moreChoices` (with `moreLabel`, `searchLabel`, `noResultsLabel`, `comingSoonLabel`) to add an All blocks button after the pinned `choices`; it opens an `AddBlock.Catalog` of every choice above the bar, which closes on select, Escape or an outside click.

Labels are individual props with English defaults, so the dashboard overrides them with translated copy. All blocks live in `src/custom/block/`:

| Block                                         | Props worth knowing                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Story                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| `Block.Image` (+ `Block.ImageSettingsDialog`) | `url`, `alt`, `fit`, `editable`, `changeLabel`, `onChange`, `onSaveSettings`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `Blocks/ImageBlock`          |
| `Block.Document`                              | `file`, `editable`, `labels` (`view`, `download`), `changeLabel`, `onView`, `onDownload`, `onChange` — one file per block, shown as a single card                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `Blocks/DocumentBlock`       |
| `Block.Slide`                                 | `slide`, `isExample`, `editable`, `frameTitle`, `changeLabel`, `onChange`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `Blocks/SlideBlock`          |
| `Block.Video`                                 | `title`, `thumbnailUrl`, `fallbackThumbnailUrl`, `durationLabel`, `channelLine`, `metaLine`, `changeLabel`, `onChange`, plus `actions`, `status`, `notice`, and `player` snippets                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `Blocks/VideoBlock`          |
| `Block.Note`                                  | `editable`, `contentHtml`, `empty`, `emptyLabel`, plus `editor` and `view` snippets                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `Blocks/NoteBlock`           |
| `Block.ChangeButton`                          | `label`, `onclick`, `disabled` — the hover "Change …" action the source blocks overlay on their media                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `Blocks/BlockChangeButton`   |
| `Block.InlineText`                            | `value`, `editable`, `multiline`, `placeholder`, `maxLength`, `tag`, `onInput`, bindable `ref` — plain text typed straight into a block (titles, questions, card text); Enter ends a single-line field                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `Blocks/BlockInlineText`     |
| `Block.Chart`                                 | `title`, `type` (`bar`, `line`, `pie`, `donut`), `points`, `editable`, `maxPoints` (12), `maxValue`, `titleMaxLength`, `labelMaxLength`, `labels`, plus `on*` callbacks for each edit — one chart drawn in HTML and SVG (no chart library, so it is safe to render on the server) with a summary line, round axis steps for bar and line, and a legend with percentages for pie and donut; it animates in when it scrolls into view. In edit mode the title is typed in place, a `Tabs` list (one tooltip per type) switches the type, and "Edit data" opens a label/value table that redraws the chart as you type                                                                                          | `Blocks/ChartBlock`          |
| `Block.Flashcards`                            | `cards`, `editable`, `maxCards` (100), `textMaxLength`, `labels`, `onQuestionInput`, `onAnswerInput`, `onAddCard`, `onRemoveCard` — a deck shown one card at a time; the card flips between question and answer, arrows and the arrow keys step through it, and in edit mode a trash button beside the flip button removes the card on screen (hidden on the last card), and a numbered strip lists every card, wrapping onto more rows, to jump to one or add one. Nothing a learner does is saved                                                                                                                                                                                                          | `Blocks/FlashcardsBlock`     |
| `Block.Tabs`                                  | `tabs`, `align` (`left`, `center`, `right`), `editable`, `maxTabs` (10), `nameMaxLength`, `noteMaxLength`, `labels`, a `content` snippet that renders the open tab's image or video, plus `on*` callbacks for each edit — a row of named tabs built on the base `Tabs`, each with a note. In edit mode the open tab's name is typed in place, an X removes it, "Add tab" adds one and selects its name, and a `ToggleGroup` sets the row's position                                                                                                                                                                                                                                                          | `Blocks/TabsBlock`           |
| `Block.MultipleChoice`                        | `question`, `options`, `correctOptionId`, `imageUrl`, `editable`, `minOptions` (2), `maxOptions` (10), `questionMaxLength`, `optionMaxLength`, `labels`, plus `on*` callbacks for each edit — one question with one correct answer; learners pick, check and try again, and their answer is never saved                                                                                                                                                                                                                                                                                                                                                                                                      | `Blocks/MultipleChoiceBlock` |
| `Block.Process`                               | `steps`, `editable`, `maxSteps` (20), `headingMaxLength`, `bodyMaxLength`, `labels`, plus `on*` callbacks for each edit — a walkthrough shown one step at a time under a numbered stepper (passed steps show a tick); Back, Next and Start over move through it and nothing a learner does is saved. In edit mode the heading and body are typed in place, the toolbar adds the current step's image (an X on the image removes it) and deletes the step, and "Add step" appends one                                                                                                                                                                                                                         | `Blocks/ProcessBlock`        |
| `Block.Html` (+ `Block.HtmlSourceDialog`)     | `src` (signed page URL; nothing renders when null), `downloadHref` (optional; hides **Download HTML** when absent), `name`, `width` (% of the column), `height` (px), `editable`, `generating`, `labels`, `onResize`, `onChange`, `onEditWithAi` — renders an author's HTML page in a sandboxed iframe (`allow-scripts allow-modals allow-popups`, no same-origin, lazy-loaded) pointed at `src`. The page is inert until **Interact** is clicked, and leaves interact mode on Escape or an outside click; full screen opens it in a dialog. In edit mode the corner handles resize the width symmetrically and the bottom bar resizes the height, saved once on release. `HtmlSourceDialog` is the Add HTML picker: upload a file, generate with AI from a template or a prompt, or paste code | `Blocks/HtmlBlock`           |

`Block.Video` and `Block.Note` are presentational: the host injects its own player, editor, dropdown, and math-rendering wrapper through snippets, while the block owns layout, chrome, and the example states.

### Reading density (`src/custom/density-control/`)

`DensityControl` pairs a compact segmented toggle with a live gap swatch, mirroring the lesson-editor prototype: picking Compact / Comfortable / Spacious updates the swatch gaps (4 / 7 / 11px) with a short transition. It takes `value`, `options` (`{ value, label }[]`, labels injected by the host so copy stays translated), `onChange`, `groupLabel`, and an optional `testIdPrefix` for per-option hooks. See `Molecules/DensityControl` in Storybook.

### Public course Copy Page (`src/custom/public-course/copy-page-button.svelte`)

Split button used on public lesson pages when the course has Markdown export enabled. Primary action copies the lesson Markdown; the chevron menu offers View as Markdown, Open in ChatGPT, and Open in Claude. Both halves use `variant="secondary"`. Copy is passed via `labels: CopyPageLabels`. The host app supplies `markdownUrl` plus ChatGPT/Claude URLs (see `buildStudyChatUrl`) and snackbar callbacks. Render it through `PublicLessonView`'s `titleActions` snippet (its `content` snippet replaces the default video and body with host-rendered content, which the dashboard uses for lesson blocks) so it sits beside the lesson title at every breakpoint, with `ShareButton` to its right. The outline rail still has the matching copy / share / chat actions. See `Molecules/PublicCourse` → **Lesson · Copy Page split button** in Storybook.

### Public course Share button (`src/custom/public-course/share-button.svelte`)

Icon-only secondary share control for the public lesson/exercise title row. Opens the same Facebook / LinkedIn / X / Instagram menu as `OutlineRailActions`. Copy is passed via `labels: ShareActionLabels`. Instagram copies the page URL and the host shows a snackbar via `onInstagramCopied`. The outline rail keeps its own share row on `lg+`.

### Public course outline rail actions (`src/custom/public-course/outline-rail-actions.svelte`)

Muted icon+label links rendered **under** `PageOutline`, separated by a top border. Matches the docs-site pattern (copy, share, open in chat):

- **Copy as Markdown** — same fetch as Copy Page; only when `markdownUrl` is set.
- **Share on social media** — dropdown for Facebook, LinkedIn, and X (intent URLs). Instagram copies the page URL (there is no web share intent) and the host shows a snackbar via `onInstagramCopied`.
- **Open in chat** — dropdown for ChatGPT and Claude when those URLs are passed.

Pass copy via `labels: OutlineRailActionLabels`. Render through `PublicLessonView` / `PublicExerciseView`'s `outlineActions` snippet. Share-only is valid for exercises. See `Molecules/PublicCourse` → **Lesson · outline rail actions**.

### Page outline (`src/custom/page-outline/`)
