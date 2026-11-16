import type { AnswerData } from './answer-data';
import { describeClusterAnswer } from './cluster-answer-label';
import { readClusterOverrides, type ClusterOverrideRule } from './cluster-override';
import type { ExerciseQuestionModel } from './exercise-types';
import { normaliseMathAnswer, parseMathNumber } from './math-engine';
import { readMathExpressionSettings } from './math-settings';
import { roundPoints } from './points';
import { QUESTION_TYPE_KEY } from './question-type-keys';

const SECTION_SEPARATOR = '\u241f';

function textKey(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function numericKey(answer: Extract<AnswerData, { type: 'NUMERIC' }>): string | null {
  const value = answer.latex?.trim() ? parseMathNumber(answer.latex) : answer.value;
  if (typeof value !== 'number') return null;
  if (!Number.isFinite(value)) return `raw:${answer.latex?.replace(/\s+/g, '') ?? ''}`;

  return `num:${Number(value.toPrecision(10))}`;
}

function compareJson(left: unknown, right: unknown): number {
  return JSON.stringify(left).localeCompare(JSON.stringify(right));
}

function withPlainNumbers(node: unknown): unknown {
  if (Array.isArray(node)) {
    const operands = node.map(withPlainNumbers);

    return node[0] === 'Equal' ? [operands[0], ...operands.slice(1).sort(compareJson)] : operands;
  }
  if (typeof node !== 'object' || node === null) return node;

  const literal = (node as { num?: unknown }).num;
  if (typeof literal === 'string') {
    const value = Number(literal);

    return Number.isFinite(value) && Math.abs(value) < 1e15 ? value : node;
  }

  return node;
}

function mathKey(
  question: ExerciseQuestionModel,
  answer: Extract<AnswerData, { type: 'MATH_EXPRESSION' | 'WORKED_SOLUTION' }>
) {
  const latex = answer.latex?.trim() ?? '';
  if (!latex) return null;

  const mathjson =
    answer.mathjson ?? normaliseMathAnswer(latex, readMathExpressionSettings(question.settings).variables);

  if (!mathjson) return `raw:${latex.replace(/\s+/g, '')}`;

  return `math:${JSON.stringify(withPlainNumbers(JSON.parse(mathjson)))}`;
}

function baseKey(question: ExerciseQuestionModel, answer: AnswerData): string | null {
  switch (answer.type) {
    case 'MATH_EXPRESSION':
    case 'WORKED_SOLUTION':
      return mathKey(question, answer);
    case 'NUMERIC':
      return numericKey(answer);
    case 'RADIO':
      return `option:${answer.optionId}`;
    case 'CHECKBOX':
      return answer.optionIds.length > 0 ? `options:${[...answer.optionIds].sort((a, b) => a - b).join(',')}` : null;
    case 'TRUE_FALSE':
      return `bool:${answer.value}`;
    case 'SHORT_ANSWER':
      return textKey(answer.text) ? `text:${textKey(answer.text)}` : null;
    case 'FILL_BLANK':
      return answer.values.some((value) => textKey(value))
        ? `blanks:${answer.values.map(textKey).join(SECTION_SEPARATOR)}`
        : null;
    case 'WORD_BANK':
      return answer.filledBlanks.some((value) => textKey(value))
        ? `blanks:${answer.filledBlanks.map(textKey).join(SECTION_SEPARATOR)}`
        : null;
    case 'ORDERING':
      return answer.orderedValues.length > 0
        ? `order:${answer.orderedValues.map(textKey).join(SECTION_SEPARATOR)}`
        : null;
    case 'MATCHING':
      return answer.pairs.length > 0
        ? `pairs:${answer.pairs
            .map((pair) => `${textKey(pair.left)}=${textKey(pair.right)}`)
            .sort()
            .join(SECTION_SEPARATOR)}`
        : null;
    default:
      return null;
  }
}

/**
 * The key equal answers share: math by canonical MathJSON, numbers by value, choices by option, text trimmed and
 * lowercased. A parameterised question's key also carries the student's seed, because the same answer is right for one
 * instance and wrong for another. Returns null for a blank answer or a type that cannot be grouped.
 */
export function getAnswerClusterKey(
  question: ExerciseQuestionModel,
  answer: AnswerData | null | undefined
): string | null {
  if (!answer) return null;

  const key = baseKey(question, answer);
  if (!key) return null;

  return answer.seed ? `seed:${answer.seed}|${key}` : key;
}

/** True for answer types that can be grouped into clusters. */
export function isClusterableQuestionType(questionType: string): boolean {
  return (
    questionType !== QUESTION_TYPE_KEY.TEXTAREA &&
    questionType !== QUESTION_TYPE_KEY.FILE_UPLOAD &&
    questionType !== QUESTION_TYPE_KEY.GRAPH_PLOT &&
    questionType !== QUESTION_TYPE_KEY.GRAPH_READ
  );
}

export type ClusterEntry = {
  submissionId: string;
  studentId: string | null;
  studentName: string | null;
  answer: AnswerData | null;
  points: number;
};

export type AnswerClusterGrade = 'full' | 'partial' | 'wrong' | 'mixed';

export type AnswerCluster = {
  key: string;
  /** One member's answer as text for `MathText`. */
  label: string;
  count: number;
  studentNames: string[];
  /** Profile ids of the members, aligned with `studentNames`; empty for a member without a profile. */
  studentIds: string[];
  grade: AnswerClusterGrade;
  /** Points every member holds, or null when members differ. */
  points: number | null;
  /** The grader's reason for the first member, set for math answers. */
  reason: string | null;
  override: ClusterOverrideRule | null;
};

/** Whether stored points are full marks, none, or in between. */
export function gradePoints(points: number, maxPoints: number): Exclude<AnswerClusterGrade, 'mixed'> {
  if (maxPoints > 0 && points >= maxPoints) return 'full';

  return points > 0 ? 'partial' : 'wrong';
}

/** Groups answers to one question by their cluster key, largest group first, with each group's grade and override. */
export function buildAnswerClusters(question: ExerciseQuestionModel, entries: ClusterEntry[]): AnswerCluster[] {
  const rules = new Map(readClusterOverrides(question.settings).map((rule) => [rule.key, rule]));
  const groups = new Map<string, ClusterEntry[]>();

  for (const entry of entries) {
    const key = getAnswerClusterKey(question, entry.answer);
    if (!key) continue;

    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }

  return [...groups]
    .map(([key, members]): AnswerCluster => {
      const [first] = members;
      const pointValues = new Set(members.map((member) => roundPoints(member.points)));
      const points = pointValues.size === 1 ? roundPoints(first.points) : null;
      const grades = new Set(members.map((member) => gradePoints(member.points, Number(question.points ?? 0))));
      const grading = first.answer && 'grading' in first.answer ? first.answer.grading : undefined;

      return {
        key,
        label: first.answer ? describeClusterAnswer(question, first.answer) : '',
        count: members.length,
        studentNames: members.map((member) => member.studentName ?? ''),
        studentIds: members.map((member) => member.studentId ?? ''),
        grade: grades.size === 1 ? [...grades][0] : 'mixed',
        points,
        reason: grading?.reason ?? null,
        override: rules.get(key) ?? null
      };
    })
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}
