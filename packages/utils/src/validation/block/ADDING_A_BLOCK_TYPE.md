# Adding a block type

A block is one piece of content in an ordered list (a lesson today). Every block type lives in two places, and each place has one file or folder per type and one registry line.

| Layer     | Where                                                       | What it owns                                 |
| --------- | ----------------------------------------------------------- | -------------------------------------------- |
| Contract  | `packages/utils/src/validation/block/definitions/<type>.ts` | Data schema, capabilities, public projection |
| Dashboard | `apps/dashboard/src/lib/features/block/components/<type>/`  | View, edit, optional picker, example data    |

No migration, route, store, or service change is needed: `block.type` is a free `varchar`, the API validates `data` through the registry, and the editor, reader, and add menu all read the registries.

## 1. Contract: `definitions/<type>.ts`

```ts
import * as z from 'zod';
import { defineBlock } from '../definition';

export const ZQuoteBlockData = z.object({
  attribution: z.string().max(120).optional()
});
export type TQuoteBlockData = z.infer<typeof ZQuoteBlockData>;

export const quoteBlock = defineBlock({
  key: 'quote',
  dataSchema: ZQuoteBlockData,
  localizedContent: true,
  media: null,
  toPublicData: (data) => data,
  agentEditableFields: ['attribution']
});
```

- `dataSchema` validates `block.data` on every write. Store what the author chose, never markup or copy (see "Persisted columns store data" in `CLAUDE.md`).
- `localizedContent: true` stores per-locale HTML in `block_locale` with version history, like a note. Use it for text the author writes.
- `media: 'video' | 'document'` makes the API check the asset belongs to the org, track it in asset usage, and sign its URL. The asset id must be `data.assetId`.
- `embeddedMedia` is for a block that keeps media inside its own data instead, such as a tab's video. `read(data)` lists the media items in a fixed order and `write(data, items)` puts back items of the same order; the API then checks, tracks, signs and polls those videos exactly like a Video block's. Read media through `listBlockMedia(type, data)` rather than branching on a type. Tabs (`definitions/tabs.ts`) uses it.
- `agent` lets the AI assistant create the block and rewrite its whole data with a generated `write_lesson_<type>_block` tool, and shows the data to it when it reads the lesson. `purpose` says when to pick the block, `inputSchema` is what the assistant sends, `toInput(data)` is what it reads, and `fromInput(input, previous)` builds the stored data, keeping from `previous` what the assistant cannot write (Tabs keeps a tab's video this way). Leave it out for blocks that point at uploaded media. Add the new tool name to the dashboard lists in `features/ai-assistant/utils/tool-labels.ts` and `run-summary.ts`, with its `ai_assistant.tool.pending` and `done` copy.
- `toPublicData` is what an anonymous public-course viewer receives. Return `null` to keep the type off public pages.
- `agentEditableFields` lists the `data` fields the AI assistant may change on an existing block (`update_lesson_block_settings`). Leave out fields that point at an uploaded or organization-owned asset, such as `assetId`, `key` or `link`; an external https `url`, like the image block's, may be listed. Use `[]` when the assistant should not edit the block's data.

Then add the type to `BLOCK_DEFINITIONS` in `registry.ts` and export the file from `index.ts`. Add a create sample to `packages/utils/tests/block-registry.test.ts`; the test fails until you do.

## 2. Dashboard: `features/block/components/<type>/`

```
<type>-view.svelte    what a learner sees            BlockViewProps<'<type>'>
<type>-edit.svelte    what an author sees            BlockEditProps<'<type>'>
<type>-picker.svelte  optional source picker         BlockPickerProps<'<type>'>
<type>-utils.ts       optional example data, helpers
```

- The view only reads `block.data` and `block.content`. It must not import editor code, because the public lesson page renders it.
- The edit file reports changes with `onDataChange(data)` and `onContentChange(html)`. Both update the block at once and save after a short pause, so call them on every keystroke. It never calls the store or an API directly. When edit is "view plus a button", render the view inside it.
- `onRequestImage()` opens the shared image picker and resolves with the chosen URL, or `null` when dismissed. Use it for an image that is part of the block's own data.
- A picker is for types whose data comes from somewhere (a library, an upload, an embed). It calls `onPick(items)` with validated data for each item and `onClose()` when dismissed. When a type has a picker, the editor passes `onRequestSource` to its edit file for the "Change" action.
- Presentational parts belong in `@cio/ui/custom/block/block-<type>.svelte`, with a story in `packages/storybook/src/blocks/`. Add one only when the type needs new visuals.

Register the type in both registries:

- `utils/block-view-registry.ts` — `BLOCK_VIEWS`
- `utils/block-edit-registry.ts` — `BLOCK_EDITORS`, with its add-menu icon and `createInitial()`. Return the data a menu click inserts, or `null` to open the picker first.

Both registries are typed against `TBlockType`, so a type registered in `registry.ts` without a view or an editor does not compile.

## 3. Copy

Add the menu label at `course.navItem.lessons.materials.blocks.types.<type>` and the version history label at `course.navItem.lessons.version_history.block_type.<type>` in `apps/dashboard/src/lib/utils/translations/en.json`, plus any strings the view or edit file shows, then run `pnpm translate` from `apps/dashboard`.

## Optional

- **Public API.** `packages/utils/src/validation/public-api/course-lesson-block.ts` lists the types API keys may create, each with a friendlier payload. Add a variant only if integrations should create the type.
- **Asset-backed playback.** A new `media` kind needs a branch in `enrichBlocksMedia` (`packages/core/src/services/block/block-view.ts`) and a slot in `LESSON_MEDIA_SLOTS` (`block.ts`).

## Rendering on a new surface

Blocks render anywhere through `BlockReader` (view) and `BlockEditor` (edit) from `features/block/components/`:

- Give the reader a `BlockViewHost`. It supplies the one thing that differs per surface, the video player.
- Give the editor a `BlockListApi` loaded with a `BlockOwner`. `createLessonBlockOwner` in `features/course/utils/lesson-block-owner.ts` is the lesson implementation. A new owner implements the same interface against its own endpoints. Its `updateData` returns `{ status: 'conflict', reason }` when `expectedVersion` is stale, so the list reloads and retries once, and `{ status: 'failed' }` for any other error, so the list restores the saved block without retrying. On `failed`, the owner shows its own error message.

Placements are stored per lesson today (`block_placement.lesson_id`). A second owner needs its own nullable foreign-key column on `block_placement`, with a check that exactly one owner column is set, plus routes that reuse `packages/core/src/services/block/block.ts`.
