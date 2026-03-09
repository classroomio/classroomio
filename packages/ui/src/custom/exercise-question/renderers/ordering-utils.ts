import type { ExerciseQuestionModel, ExerciseQuestionOption } from '@cio/question-types';
import type { AnswerData } from '@cio/question-types';

export interface OrderingRenderItem {
  id: string;
  label: string;
  answerValue: string;
}

function normalizeText(value: unknown): string {
  return String(value ?? '').trim();
}

function normalizeToken(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function buildFallbackLabel(index: number): string {
  return String(index + 1);
}

function buildFallbackId(index: number): string {
  return `ordering-${index + 1}`;
}

export function getOrderingItemsFromQuestion(question: ExerciseQuestionModel): OrderingRenderItem[] {
  const options = Array.isArray(question.options) ? question.options : [];
  if (options.length > 0) {
    return options.map((option, index) => {
      const label = normalizeText(option.label ?? option.value) || buildFallbackLabel(index);
      const id =
        normalizeText(option.id ?? option.value ?? option.label ?? buildFallbackId(index)) || buildFallbackId(index);
      const answerValue = normalizeText(option.id ?? option.value ?? option.label ?? id) || id;

      return {
        id,
        label,
        answerValue
      };
    });
  }

  const rawItems = Array.isArray(question.settings?.items) ? question.settings.items : [];
  return rawItems.map((rawItem, index) => {
    const label = normalizeText(rawItem) || buildFallbackLabel(index);
    const id = buildFallbackId(index);

    return {
      id,
      label,
      answerValue: label
    };
  });
}

export function toOrderingQuestionOptions(items: OrderingRenderItem[]): ExerciseQuestionOption[] {
  return items.map((item, index) => ({
    id: item.id || buildFallbackId(index),
    label: item.label,
    value: item.label,
    isCorrect: false
  }));
}

export function toOrderingSettings(items: OrderingRenderItem[]): string[] {
  return items.map((item) => item.label);
}

function getOrderedValues(answer: AnswerData | string[] | null | undefined): string[] {
  if (answer && typeof answer === 'object' && 'type' in answer && answer.type === 'ORDERING') {
    return Array.isArray(answer.orderedValues) ? answer.orderedValues : [];
  }
  return Array.isArray(answer) ? answer : [];
}

export function applyOrderingAnswer(
  items: OrderingRenderItem[],
  answer: AnswerData | string[] | null | undefined
): OrderingRenderItem[] {
  const orderedValues = getOrderedValues(answer);
  if (orderedValues.length === 0) {
    return items;
  }

  const answerTokens = orderedValues.map((entry) => normalizeToken(entry)).filter(Boolean);
  if (answerTokens.length === 0) {
    return items;
  }

  const usedItemIds = new Set<string>();
  const orderedItems: OrderingRenderItem[] = [];

  answerTokens.forEach((token) => {
    const matchingItem = items.find((item) => {
      if (usedItemIds.has(item.id)) return false;
      const candidates = [item.id, item.answerValue, item.label].map((candidate) => normalizeToken(candidate));
      return candidates.includes(token);
    });

    if (!matchingItem) return;
    usedItemIds.add(matchingItem.id);
    orderedItems.push(matchingItem);
  });

  const remainingItems = items.filter((item) => !usedItemIds.has(item.id));
  return [...orderedItems, ...remainingItems];
}

export function areSameOrdering(left: OrderingRenderItem[], right: OrderingRenderItem[]): boolean {
  if (left.length !== right.length) return false;

  return left.every((item, index) => {
    const other = right[index];
    return other ? item.answerValue === other.answerValue : false;
  });
}
