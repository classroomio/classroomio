import * as z from 'zod';

import { defineBlock, ZBlockItemId } from '../definition';

export const PROCESS_MIN_STEPS = 1;
export const PROCESS_MAX_STEPS = 20;
export const PROCESS_HEADING_MAX_LENGTH = 200;
export const PROCESS_BODY_MAX_LENGTH = 2000;

export const ZProcessStep = z.object({
  id: ZBlockItemId,
  heading: z.string().max(PROCESS_HEADING_MAX_LENGTH),
  body: z.string().max(PROCESS_BODY_MAX_LENGTH),
  imageUrl: z.url().optional().describe('An https image the teacher gave, shown beside the step.')
});
export type TProcessStep = z.infer<typeof ZProcessStep>;

export const ZProcessBlockData = z
  .object({
    steps: z.array(ZProcessStep).min(PROCESS_MIN_STEPS).max(PROCESS_MAX_STEPS)
  })
  .refine((data) => new Set(data.steps.map((step) => step.id)).size === data.steps.length, {
    message: 'Step ids must be unique',
    path: ['steps']
  });
export type TProcessBlockData = z.infer<typeof ZProcessBlockData>;

export const processBlock = defineBlock({
  key: 'process',
  dataSchema: ZProcessBlockData,
  localizedContent: false,
  media: null,
  toPublicData: (data) => data,
  agentEditableFields: [],
  agent: {
    purpose: 'Numbered steps students go through one at a time, for a procedure, timeline or how-to.',
    inputSchema: ZProcessBlockData,
    toInput: (data) => data,
    fromInput: (input) => input
  }
});
