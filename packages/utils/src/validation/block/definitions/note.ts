import * as z from 'zod';

import { defineBlock } from '../definition';

export const NOTE_BLOCK_STYLES = ['default', 'info', 'tip', 'important', 'warning', 'highlight'] as const;
export type TNoteBlockStyle = (typeof NOTE_BLOCK_STYLES)[number];

export const ZNoteBlockData = z
  .object({
    style: z.enum(NOTE_BLOCK_STYLES).optional()
  })
  .strict();
export type TNoteBlockData = z.infer<typeof ZNoteBlockData>;

export const noteBlock = defineBlock({
  key: 'note',
  dataSchema: ZNoteBlockData,
  localizedContent: true,
  media: null,
  toPublicData: (data) => data
});
