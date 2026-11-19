import * as z from 'zod';

import {
  defineBlock,
  fromAgentImageUrl,
  toAgentImageUrl,
  ZAgentImageUrl,
  ZAgentKeepImage,
  ZBlockItemId
} from '../definition';

export const PROCESS_MIN_STEPS = 1;
export const PROCESS_MAX_STEPS = 20;
export const PROCESS_HEADING_MAX_LENGTH = 200;
export const PROCESS_BODY_MAX_LENGTH = 2000;

const processStepFields = {
  id: ZBlockItemId,
  heading: z.string().max(PROCESS_HEADING_MAX_LENGTH),
  body: z.string().max(PROCESS_BODY_MAX_LENGTH)
};

export const ZProcessStep = z.object({ ...processStepFields, imageUrl: z.url().optional() });
export type TProcessStep = z.infer<typeof ZProcessStep>;

function hasUniqueStepIds(data: { steps: { id: string }[] }): boolean {
  return new Set(data.steps.map((step) => step.id)).size === data.steps.length;
}

const uniqueStepIdsIssue = { message: 'Step ids must be unique', path: ['steps'] };

export const ZProcessBlockData = z
  .object({
    steps: z.array(ZProcessStep).min(PROCESS_MIN_STEPS).max(PROCESS_MAX_STEPS)
  })
  .refine(hasUniqueStepIds, uniqueStepIdsIssue);
export type TProcessBlockData = z.infer<typeof ZProcessBlockData>;

const ZProcessAgentStep = z.object({
  ...processStepFields,
  imageUrl: ZAgentImageUrl.optional().describe('An https image the teacher gave, shown beside the step.'),
  keepImage: ZAgentKeepImage
});

export const ZProcessAgentInput = z
  .object({
    steps: z.array(ZProcessAgentStep).min(PROCESS_MIN_STEPS).max(PROCESS_MAX_STEPS)
  })
  .refine(hasUniqueStepIds, uniqueStepIdsIssue);
export type TProcessAgentInput = z.infer<typeof ZProcessAgentInput>;

function toAgentStep({ imageUrl, ...step }: TProcessStep) {
  return { ...step, ...toAgentImageUrl(imageUrl) };
}

function fromAgentStep(
  { imageUrl, keepImage, ...step }: TProcessAgentInput['steps'][number],
  previous: TProcessStep | undefined
): TProcessStep {
  return { ...step, ...fromAgentImageUrl({ imageUrl, keepImage }, previous?.imageUrl) };
}

export const processBlock = defineBlock({
  key: 'process',
  dataSchema: ZProcessBlockData,
  localizedContent: false,
  media: null,
  toPublicData: (data) => data,
  agentEditableFields: [],
  agent: {
    purpose: 'Numbered steps students go through one at a time, for a procedure, timeline or how-to.',
    inputSchema: ZProcessAgentInput,
    toInput: (data) => ({ steps: data.steps.map(toAgentStep) }),
    fromInput: (input, previous) => ({
      steps: input.steps.map((step) =>
        fromAgentStep(
          step,
          previous?.steps.find((candidate) => candidate.id === step.id)
        )
      )
    })
  }
});
