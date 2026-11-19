import {
  MULTIPLE_CHOICE_MAX_OPTIONS,
  MULTIPLE_CHOICE_MIN_OPTIONS,
  type TMultipleChoiceBlockData
} from '@cio/utils/validation/block';

export interface MultipleChoiceExampleCopy {
  question: string;
  correctOption: string;
  otherOptions: string[];
}

export function createOptionId(): string {
  return crypto.randomUUID();
}

/**
 * The block a menu click inserts: the question with the correct option first and already marked.
 */
export function createExampleMultipleChoice(copy: MultipleChoiceExampleCopy): TMultipleChoiceBlockData {
  const correctOption = { id: createOptionId(), text: copy.correctOption };
  const otherOptions = copy.otherOptions.map((text) => ({ id: createOptionId(), text }));

  return {
    question: copy.question,
    options: [correctOption, ...otherOptions],
    correctOptionId: correctOption.id
  };
}

export function setQuestion(data: TMultipleChoiceBlockData, question: string): TMultipleChoiceBlockData {
  return { ...data, question };
}

export function setOptionText(
  data: TMultipleChoiceBlockData,
  optionId: string,
  text: string
): TMultipleChoiceBlockData {
  const options = data.options.map((option) => (option.id === optionId ? { ...option, text } : option));

  return { ...data, options };
}

export function markCorrectOption(data: TMultipleChoiceBlockData, optionId: string): TMultipleChoiceBlockData {
  if (!data.options.some((option) => option.id === optionId)) return data;

  return { ...data, correctOptionId: optionId };
}

/**
 * Appends an option. Returns the data unchanged at the option limit.
 */
export function addOption(
  data: TMultipleChoiceBlockData,
  text: string,
  optionId: string = createOptionId()
): TMultipleChoiceBlockData {
  if (data.options.length >= MULTIPLE_CHOICE_MAX_OPTIONS) return data;

  return { ...data, options: [...data.options, { id: optionId, text }] };
}

/**
 * Removes an option, keeping at least the minimum. Removing the correct option makes the first remaining option correct.
 */
export function removeOption(data: TMultipleChoiceBlockData, optionId: string): TMultipleChoiceBlockData {
  if (data.options.length <= MULTIPLE_CHOICE_MIN_OPTIONS) return data;

  const options = data.options.filter((option) => option.id !== optionId);
  if (options.length === data.options.length) return data;

  const correctOptionId = data.correctOptionId === optionId ? options[0].id : data.correctOptionId;

  return { ...data, options, correctOptionId };
}

export function setImage(data: TMultipleChoiceBlockData, imageUrl: string | null): TMultipleChoiceBlockData {
  const { imageUrl: _previous, ...rest } = data;

  return imageUrl ? { ...rest, imageUrl } : rest;
}
