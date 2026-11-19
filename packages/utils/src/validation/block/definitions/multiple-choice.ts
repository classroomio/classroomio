import * as z from 'zod';

import { defineBlock, ZBlockItemId } from '../definition';

export const MULTIPLE_CHOICE_MIN_OPTIONS = 2;
export const MULTIPLE_CHOICE_MAX_OPTIONS = 10;
export const MULTIPLE_CHOICE_QUESTION_MAX_LENGTH = 1000;
export const MULTIPLE_CHOICE_OPTION_MAX_LENGTH = 500;

export const ZMultipleChoiceOption = z.object({
  id: ZBlockItemId,
  text: z.string().max(MULTIPLE_CHOICE_OPTION_MAX_LENGTH)
});
export type TMultipleChoiceOption = z.infer<typeof ZMultipleChoiceOption>;

export const ZMultipleChoiceBlockData = z
  .object({
    question: z.string().max(MULTIPLE_CHOICE_QUESTION_MAX_LENGTH),
    options: z.array(ZMultipleChoiceOption).min(MULTIPLE_CHOICE_MIN_OPTIONS).max(MULTIPLE_CHOICE_MAX_OPTIONS),
    correctOptionId: z.string().min(1).describe('The id of the one correct option.'),
    imageUrl: z.url().optional().describe('An https image the teacher gave, shown above the question.')
  })
  .refine((data) => new Set(data.options.map((option) => option.id)).size === data.options.length, {
    message: 'Option ids must be unique',
    path: ['options']
  })
  .refine((data) => data.options.some((option) => option.id === data.correctOptionId), {
    message: 'The correct answer must be one of the options',
    path: ['correctOptionId']
  });
export type TMultipleChoiceBlockData = z.infer<typeof ZMultipleChoiceBlockData>;

export const multipleChoiceBlock = defineBlock({
  key: 'multiple_choice',
  dataSchema: ZMultipleChoiceBlockData,
  localizedContent: false,
  media: null,
  toPublicData: (data) => data,
  agentEditableFields: [],
  agent: {
    purpose:
      'One question with 2 to 10 options and exactly one correct answer, which students check inside the lesson. It is not graded or saved; use create_exercise for a graded quiz.',
    inputSchema: ZMultipleChoiceBlockData,
    toInput: (data) => data,
    fromInput: (input) => input
  }
});
