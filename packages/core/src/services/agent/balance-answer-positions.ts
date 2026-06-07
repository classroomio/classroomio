import { QUESTION_TYPE_IDS } from '@cio/question-types';

/**
 * Balances which option position holds the correct answer across a batch of
 * AI-generated questions, so an exercise never ends up with "B is always the
 * answer". LLMs cannot produce a uniform distribution on instruction alone —
 * this enforces it deterministically at persist time.
 *
 * - RADIO (single correct): each question's correct option is relocated to a
 *   target position drawn from a balanced-then-shuffled assignment, so the
 *   correct position is spread as evenly as possible across the batch (and not
 *   in a predictable A,B,C,D cycle).
 * - CHECKBOX (multiple correct): options are shuffled so the correct set does
 *   not cluster at the top. Round-robin balancing does not apply because the
 *   number of correct answers varies per question.
 *
 * Questions are left untouched when reordering would be unsafe or meaningless:
 * non-RADIO/CHECKBOX types, fewer than two options, a malformed correct-count,
 * position-referential options ("all of the above"), or naturally-ordered
 * option sets (numeric values/ranges).
 *
 * The shuffle is seeded from the batch content, so the result is deterministic
 * and unit-testable — no `Math.random`.
 */

const RADIO_ID = QUESTION_TYPE_IDS.RADIO;
const CHECKBOX_ID = QUESTION_TYPE_IDS.CHECKBOX;

export interface BalanceableOption {
  label: string;
  isCorrect: boolean;
}

type WithOptions = { questionTypeId: number; options: BalanceableOption[] };

// Options whose text refers to other positions ("all of the above", "both A
// and B", …) break if shuffled into the middle, so the question is skipped.
const POSITION_REFERENTIAL = [
  /\ball of the (above|below)\b/,
  /\bnone of the (above|below)\b/,
  /\b(all|none|both|any) of these\b/,
  /\bboth\b.*\band\b/,
  /^(answers?\s+)?[a-d]\s+and\s+[a-d]\b/,
  /^[a-d],\s*[a-d]/
];

function isPositionReferential(label: string): boolean {
  const normalized = label.trim().toLowerCase();

  return POSITION_REFERENTIAL.some((pattern) => pattern.test(normalized));
}

// "0-10 / 11-20 / 21-30" or "1 / 2 / 3" read better in order — don't shuffle.
function leadingNumber(label: string): number | null {
  const match = label
    .trim()
    .replace(/^[^\d-]+/, '')
    .match(/^-?\d+(?:\.\d+)?/);

  return match ? Number(match[0]) : null;
}

function isNaturallyOrdered(options: BalanceableOption[]): boolean {
  const numbers = options.map((option) => leadingNumber(option.label));
  if (numbers.some((value) => value === null)) return false;

  const values = numbers as number[];
  const ascending = values.every((value, i) => i === 0 || value >= values[i - 1]);
  const descending = values.every((value, i) => i === 0 || value <= values[i - 1]);

  return ascending || descending;
}

function correctCount(options: BalanceableOption[]): number {
  return options.reduce((total, option) => total + (option.isCorrect ? 1 : 0), 0);
}

function isShuffleSafe(question: WithOptions): boolean {
  const { options } = question;
  if (options.length < 2) return false;
  if (options.some((option) => isPositionReferential(option.label))) return false;
  if (isNaturallyOrdered(options)) return false;

  return true;
}

// FNV-1a hash → mulberry32 PRNG. Seeded from batch content so identical input
// yields an identical (but well-distributed) layout.
function hashSeed(input: string): number {
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleInPlace<T>(items: T[], random: () => number): void {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
}

// Move the single correct option to `targetIndex`, preserving distractor order.
function relocateCorrect(options: BalanceableOption[], targetIndex: number): BalanceableOption[] {
  const correctIndex = options.findIndex((option) => option.isCorrect);
  const correct = options[correctIndex];
  const rest = options.filter((_, i) => i !== correctIndex);
  rest.splice(targetIndex, 0, correct);

  return rest;
}

export function balanceCorrectAnswerPositions<Q extends WithOptions>(questions: Q[]): Q[] {
  if (questions.length === 0) return questions;

  const seedSource = questions.map((question) => question.options.map((option) => option.label).join('|')).join('||');
  const random = mulberry32(hashSeed(seedSource));

  // RADIO: assign balanced target positions per option-count group so the
  // correct index is spread evenly even when questions have different option
  // counts. Built before any mutation so consumption of `random` is stable.
  const radioTargets = new Map<number, number>();
  const radioGroups = new Map<number, number[]>();
  questions.forEach((question, index) => {
    if (question.questionTypeId !== RADIO_ID) return;
    if (!isShuffleSafe(question) || correctCount(question.options) !== 1) return;

    const group = radioGroups.get(question.options.length) ?? [];
    group.push(index);
    radioGroups.set(question.options.length, group);
  });

  for (const [optionCount, indexes] of radioGroups) {
    const targets = indexes.map((_, position) => position % optionCount);
    shuffleInPlace(targets, random);
    indexes.forEach((questionIndex, position) => radioTargets.set(questionIndex, targets[position]));
  }

  return questions.map((question, index) => {
    if (question.questionTypeId === RADIO_ID && radioTargets.has(index)) {
      return { ...question, options: relocateCorrect(question.options, radioTargets.get(index)!) };
    }

    if (question.questionTypeId === CHECKBOX_ID && isShuffleSafe(question)) {
      const correct = correctCount(question.options);
      if (correct > 0 && correct < question.options.length) {
        const shuffled = [...question.options];
        shuffleInPlace(shuffled, random);

        return { ...question, options: shuffled };
      }
    }

    return question;
  });
}
