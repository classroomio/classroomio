import * as z from 'zod';

import { defineBlock } from '../definition';

export const ZNoteBlockData = z.object({}).strict();
export type TNoteBlockData = z.infer<typeof ZNoteBlockData>;

export const noteBlock = defineBlock({
  key: 'note',
  dataSchema: ZNoteBlockData,
  localizedContent: true,
  media: null,
  toPublicData: (data) => data,
  agentEditableFields: []
});
