import type { ExerciseQuestionModel } from '@cio/question-types';

export type MatchingPair = { left: string; right: string };

export function readMatchingPairs(question: ExerciseQuestionModel): MatchingPair[] {
  const raw = question.settings?.pairs;
  if (!Array.isArray(raw)) return [];

  return raw
    .filter(
      (pair): pair is MatchingPair => Boolean(pair) && typeof pair.left === 'string' && typeof pair.right === 'string'
    )
    .map((pair) => ({ left: pair.left, right: pair.right }));
}

function hashText(text: string): number {
  let hash = 5381;
  for (const char of text) hash = (hash * 33) ^ char.charCodeAt(0);

  return hash >>> 0;
}

/** Orders the right-hand items the same way on every render, so a match is never next to its own item by design. */
export function orderRightItems(question: ExerciseQuestionModel, pairs: MatchingPair[]): string[] {
  const seed = String(question.id ?? question.key ?? '');
  const rights = [...new Set(pairs.map((pair) => pair.right).filter(Boolean))];

  return rights.sort((first, second) => hashText(seed + first) - hashText(seed + second));
}
