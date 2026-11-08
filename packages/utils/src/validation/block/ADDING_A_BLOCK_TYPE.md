# Adding a block type

A block is one piece of content in an ordered list (a lesson today). Every block type lives in two places, and each place has one file or folder per type and one registry line.

| Layer | Where | What it owns |
| --- | --- | --- |
| Contract | `packages/utils/src/validation/block/definitions/<type>.ts` | Data schema, capabilities, public projection |
| Dashboard | `apps/dashboard/src/lib/features/block/components/<type>/` | View, edit, optional picker, example data |

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
  toPublicData: (data) => data
});
```

- `dataSchema` validates `block.data` on every write. Store what the author chose, never markup or copy (see "Persisted columns store data" in `CLAUDE.md`).
- `localizedContent: true` stores per-locale HTML in `block_locale` with version history, like a note. Use it for text the author writes.
- `media: 'video' | 'document'` makes the API check the asset belongs to the org, track it in asset usage, and sign its URL. The asset id must be `data.assetId`.
- `toPublicData` is what an anonymous public-course viewer receives. Return `null` to keep the type off public pages.

Then add the type to `BLOCK_DEFINITIONS` in `registry.ts` and export the file from `index.ts`. Add a create sample to `packages/utils/tests/block-registry.test.ts`; the test fails until you do.

## 2. Dashboard: `features/block/components/<type>/`

```
<type>-view.svelte    what a learner sees            BlockViewProps<'<type>'>
<type>-edit.svelte    what an author sees            BlockEditProps<'<type>'>
<type>-picker.svelte  optional source picker         BlockPickerProps<'<type>'>
<type>-utils.ts       optional example data, helpers
```

- The view only reads `block.data` and `block.content`. It must not import editor code, because the public lesson page renders it.
- The edit file reports changes with `onDataChange(data)` and `onContentChange(html)`. It never calls the store or an API directly. When edit is "view plus a button", render the view inside it.
- A picker is for types whose data comes from somewhere (a library, an upload, an embed). It calls `onPick(items)` with validated data for each item and `onClose()` when dismissed. When a type has a picker, the editor passes `onRequestSource` to its edit file for the "Change" action.
- Presentational parts belong in `@cio/ui/custom/block/block-<type>.svelte`, with a story in `packages/storybook/src/blocks/`. Add one only when the type needs new visuals.

Register the type in both registries:

- `utils/block-view-registry.ts` — `BLOCK_VIEWS`
- `utils/block-edit-registry.ts` — `BLOCK_EDITORS`, with its add-menu icon and `createInitial()`. Return the data a menu click inserts, or `null` to open the picker first.

Both registries are typed against `TBlockType`, so a type registered in `registry.ts` without a view or an editor does not compile.

## 3. Copy

Add the menu label at `course.navItem.lessons.materials.blocks.types.<type>` in `apps/dashboard/src/lib/utils/translations/en.json`, plus any strings the view or edit file shows, then run `pnpm translate` from `apps/dashboard`.

## Optional

- **Public API.** `packages/utils/src/validation/public-api/course-lesson-block.ts` lists the types API keys may create, each with a friendlier payload. Add a variant only if integrations should create the type.
- **Asset-backed playback.** A new `media` kind needs a branch in `enrichBlocksMedia` (`packages/core/src/services/block/block-view.ts`) and a slot in `LESSON_MEDIA_SLOTS` (`block.ts`).

## Rendering on a new surface

Blocks render anywhere through `BlockReader` (view) and `BlockEditor` (edit) from `features/block/components/`:

- Give the reader a `BlockViewHost`. It supplies the one thing that differs per surface, the video player.
- Give the editor a `BlockListApi` loaded with a `BlockOwner`. `createLessonBlockOwner` in `features/course/utils/lesson-block-owner.ts` is the lesson implementation. A new owner implements the same interface against its own endpoints.

Placements are stored per lesson today (`block_placement.lesson_id`). A second owner needs its own nullable foreign-key column on `block_placement`, with a check that exactly one owner column is set, plus routes that reuse `packages/core/src/services/block/block.ts`.
