import {
  activeOptionsOf,
  settingsOf,
  stringListSetting,
  stringSetting
} from '@/feature/exercise/helpers/question-model';
import type { ExerciseQuestion } from '@/feature/exercise/types/exercise';

export type ArrangeItem = { id: string; label: string; value: string };

function normalize(value: unknown) {
  return String(value ?? '').trim();
}

/** Ordering items with the value the API scores, matching `getOrderingItemsFromQuestion` on the web. */
export function orderingItemsOf(question: ExerciseQuestion): ArrangeItem[] {
  const options = activeOptionsOf(question);

  if (options.length > 0) {
    return options.map((option, index) => {
      const fallback = `ordering-${index + 1}`;
      const label = normalize(option.label ?? option.value) || String(index + 1);
      const id = normalize(option.id ?? option.value ?? option.label) || fallback;

      return { id, label, value: id };
    });
  }

  return stringListSetting(question, 'items').map((raw, index) => {
    const label = normalize(raw) || String(index + 1);

    return { id: `ordering-${index + 1}`, label, value: label };
  });
}

/** Reorders items to follow a saved answer; unknown values are dropped and missing items keep their place at the end. */
export function applyOrder(items: ArrangeItem[], orderedValues: string[] | undefined) {
  if (!orderedValues || orderedValues.length === 0) return items;

  const byValue = new Map(items.map((item) => [item.value.toLowerCase(), item]));
  const ordered: ArrangeItem[] = [];

  for (const value of orderedValues) {
    const item = byValue.get(normalize(value).toLowerCase());
    if (item && !ordered.includes(item)) ordered.push(item);
  }

  return [...ordered, ...items.filter((item) => !ordered.includes(item))];
}

export type MatchingPair = { left: string; right: string };

export function matchingPairsOf(question: ExerciseQuestion): MatchingPair[] {
  const raw = settingsOf(question).pairs;
  if (!Array.isArray(raw)) return [];

  return raw
    .filter(
      (pair): pair is MatchingPair => Boolean(pair) && typeof pair === 'object' && 'left' in pair && 'right' in pair
    )
    .map((pair) => ({ left: normalize(pair.left), right: normalize(pair.right) }));
}

function seededRandom(seed: number) {
  let state = seed || 1;

  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;

    return state / 4294967296;
  };
}

function hashOf(text: string) {
  let hash = 0;
  for (let index = 0; index < text.length; index++) hash = (hash * 31 + text.charCodeAt(index)) >>> 0;

  return hash;
}

/** Deterministic shuffle so the same question always starts in the same order on this device. */
export function stableShuffle<T>(items: T[], seedText: string) {
  const random = seededRandom(hashOf(seedText));
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex] as T, copy[index] as T];
  }

  return copy;
}

export type WordBankSegment = { type: 'text'; value: string } | { type: 'blank'; index: number };

export type WordBankChip = { id: string; label: string };

const BLANK_PATTERN = /_{3,}/g;

export function wordBankOf(question: ExerciseQuestion) {
  const template = stringSetting(question, 'template');
  const parts = template.split(BLANK_PATTERN);
  const segments: WordBankSegment[] = [];

  parts.forEach((part, index) => {
    if (part.length > 0) segments.push({ type: 'text', value: part });
    if (index < parts.length - 1)
      segments.push({ type: 'blank', index: segments.filter((s) => s.type === 'blank').length });
  });

  const blankCount = segments.filter((segment) => segment.type === 'blank').length;
  const correct = stringListSetting(question, 'correctAnswers').map((label, index) => ({
    id: `correct-${index}`,
    label: label.trim()
  }));
  const distractors = stringListSetting(question, 'distractors')
    .map((label, index) => ({ id: `distractor-${index}`, label: label.trim() }))
    .filter((chip) => chip.label.length > 0);
  const chips = stableShuffle([...correct, ...distractors], `${question.id}:${template}`);

  return { segments, blankCount, chips };
}

/** Maps saved blank values back to chip ids, using each chip at most once. */
export function placementsFromAnswer(filledBlanks: string[], chips: WordBankChip[], blankCount: number) {
  const used = new Set<string>();

  return Array.from({ length: blankCount }, (_, index) => {
    const target = normalize(filledBlanks[index]).toLowerCase();
    if (!target) return null;

    const chip = chips.find((candidate) => !used.has(candidate.id) && candidate.label.toLowerCase() === target);
    if (!chip) return null;

    used.add(chip.id);

    return chip.id;
  });
}
