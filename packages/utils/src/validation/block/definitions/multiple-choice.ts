import * as z from 'zod';

import {
  defineBlock,
  fromAgentImageUrl,
  toAgentImageUrl,
  ZAgentImageUrl,
  ZAgentKeepImage,
  ZBlockItemId
} from '../definition';

export const MULTIPLE_CHOICE_MIN_OPTIONS = 2;
export const MULTIPLE_CHOICE_MAX_OPTIONS = 10;
export const MULTIPLE_CHOICE_QUESTION_MAX_LENGTH = 1000;
export const MULTIPLE_CHOICE_OPTION_MAX_LENGTH = 500;

export const ZMultipleChoiceOption = z.object({
  id: ZBlockItemId,
  text: z.string().max(MULTIPLE_CHOICE_OPTION_MAX_LENGTH)
});
export type TMultipleChoiceOption = z.infer<typeof ZMultipleChoiceOption>;

const multipleChoiceFields = {
  question: z.string().max(MULTIPLE_CHOICE_QUESTION_MAX_LENGTH),
  options: z.array(ZMultipleChoiceOption).min(MULTIPLE_CHOICE_MIN_OPTIONS).max(MULTIPLE_CHOICE_MAX_OPTIONS),
  correctOptionId: z.string().min(1).describe('The id of the one correct option.')
};

type TMultipleChoiceFields = { options: TMultipleChoiceOption[]; correctOptionId: string };

function hasUniqueOptionIds(data: TMultipleChoiceFields): boolean {
  return new Set(data.options.map((option) => option.id)).size === data.options.length;
}

function hasCorrectOption(data: TMultipleChoiceFields): boolean {
  return data.options.some((option) => option.id === data.correctOptionId);
}

const uniqueOptionIdsIssue = { message: 'Option ids must be unique', path: ['options'] };
const correctOptionIssue = { message: 'The correct answer must be one of the options', path: ['correctOptionId'] };

export const ZMultipleChoiceBlockData = z
  .object({ ...multipleChoiceFields, imageUrl: z.url().optional() })
  .refine(hasUniqueOptionIds, uniqueOptionIdsIssue)
  .refine(hasCorrectOption, correctOptionIssue);
export type TMultipleChoiceBlockData = z.infer<typeof ZMultipleChoiceBlockData>;

export const ZMultipleChoiceAgentInput = z
  .object({
    ...multipleChoiceFields,
    imageUrl: ZAgentImageUrl.optional().describe('An https image the teacher gave, shown above the question.'),
    keepImage: ZAgentKeepImage
  })
  .refine(hasUniqueOptionIds, uniqueOptionIdsIssue)
  .refine(hasCorrectOption, correctOptionIssue);

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
    inputSchema: ZMultipleChoiceAgentInput,
    toInput: ({ imageUrl, ...data }) => ({ ...data, ...toAgentImageUrl(imageUrl) }),
    fromInput: ({ imageUrl, keepImage, ...input }, previous) => ({
      ...input,
      ...fromAgentImageUrl({ imageUrl, keepImage }, previous?.imageUrl)
    })
  }
});
