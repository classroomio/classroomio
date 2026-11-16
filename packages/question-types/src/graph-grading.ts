import type { AnswerData } from './answer-data';
import type { ExerciseQuestionModel } from './exercise-types';
import {
  readGraphPlotSettings,
  readGraphReadSettings,
  type GraphBoardSettings,
  type GraphPlotSettings,
  type GraphPoint,
  type GraphReadSettings,
  type PlotElement
} from './graph-settings';
import { QUESTION_TYPE_KEY } from './question-type-keys';

export type GraphGradeReason = 'correct' | 'partial' | 'wrong' | 'missing' | 'extra' | 'not_set';

export type GraphAnswerGrading = {
  reason: GraphGradeReason;
  /** Expected elements the student matched (plot) or 1 when the read answer matched. */
  matched: number;
  /** Elements the teacher expects (plot) or 1 for a read answer. */
  total: number;
  /** Student elements that matched nothing the teacher expects. */
  extra: number;
};

export type PlotMatch = { expectedIndex: number; studentIndex: number; error: number };

export type GraphPlotGrade = GraphAnswerGrading & {
  /** Fraction of the question's points earned, between 0 and 1. */
  fraction: number;
  matches: PlotMatch[];
};

export type GraphReadAnswer = { value?: number; point?: GraphPoint };

const PARABOLA_SAMPLES = 41;
const EPSILON = 1e-9;

function distance(left: GraphPoint, right: GraphPoint): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function distanceToLine(point: GraphPoint, from: GraphPoint, to: GraphPoint): number {
  const length = distance(from, to);
  if (length < EPSILON) return Number.POSITIVE_INFINITY;

  return Math.abs((to.x - from.x) * (from.y - point.y) - (from.x - point.x) * (to.y - from.y)) / length;
}

/** The parabola with the given vertex and one other point on it as a function of x; null when both share an x. */
export function parabolaFunction(vertex: GraphPoint, through: GraphPoint): ((x: number) => number) | null {
  const run = through.x - vertex.x;
  if (Math.abs(run) < EPSILON) return null;

  const curvature = (through.y - vertex.y) / (run * run);
  return (x) => curvature * (x - vertex.x) ** 2 + vertex.y;
}

/** The mean vertical gap between two parabolas over the visible x range, counting only where the expected one is visible. */
function parabolaGap(
  expected: Extract<PlotElement, { kind: 'parabola' }>,
  student: Extract<PlotElement, { kind: 'parabola' }>,
  board: GraphBoardSettings
): number {
  const expectedFunction = parabolaFunction(expected.vertex, expected.through);
  const studentFunction = parabolaFunction(student.vertex, student.through);
  if (!expectedFunction || !studentFunction) return Number.POSITIVE_INFINITY;

  let total = 0;
  let count = 0;
  for (let index = 0; index < PARABOLA_SAMPLES; index += 1) {
    const x = board.xMin + ((board.xMax - board.xMin) * index) / (PARABOLA_SAMPLES - 1);
    const expectedY = expectedFunction(x);
    if (expectedY < board.yMin || expectedY > board.yMax) continue;

    total += Math.abs(expectedY - studentFunction(x));
    count += 1;
  }

  return count === 0 ? Number.POSITIVE_INFINITY : total / count;
}

/** How far a student element is from an expected one in graph units; Infinity when they are different kinds or unusable. */
export function plotElementError(expected: PlotElement, student: PlotElement, board: GraphBoardSettings): number {
  if (expected.kind === 'point' && student.kind === 'point') return distance(expected, student);

  if (expected.kind === 'segment' && student.kind === 'segment') {
    const sameOrder = Math.max(distance(expected.from, student.from), distance(expected.to, student.to));
    const swapped = Math.max(distance(expected.from, student.to), distance(expected.to, student.from));

    return Math.min(sameOrder, swapped);
  }

  if (expected.kind === 'line' && student.kind === 'line') {
    return Math.max(
      distanceToLine(expected.from, student.from, student.to),
      distanceToLine(expected.to, student.from, student.to)
    );
  }

  if (expected.kind === 'parabola' && student.kind === 'parabola') {
    const gap = parabolaGap(expected, student, board);
    return Math.max(distance(expected.vertex, student.vertex), gap / 2);
  }

  return Number.POSITIVE_INFINITY;
}

/**
 * Pairs each expected element with the closest unused student element of the same kind, best pairs first, keeping only
 * pairs within `tolerance`.
 */
export function matchPlotElements(settings: GraphPlotSettings, elements: PlotElement[]): PlotMatch[] {
  const candidates: PlotMatch[] = [];
  settings.expected.forEach((expected, expectedIndex) => {
    elements.forEach((student, studentIndex) => {
      const error = plotElementError(expected, student, settings.board);
      if (error <= settings.tolerance) candidates.push({ expectedIndex, studentIndex, error });
    });
  });
  candidates.sort((left, right) => left.error - right.error);

  const usedExpected = new Set<number>();
  const usedStudent = new Set<number>();
  const matches: PlotMatch[] = [];
  for (const candidate of candidates) {
    if (usedExpected.has(candidate.expectedIndex) || usedStudent.has(candidate.studentIndex)) continue;

    usedExpected.add(candidate.expectedIndex);
    usedStudent.add(candidate.studentIndex);
    matches.push(candidate);
  }

  return matches;
}

/**
 * Grades plotted elements against the teacher's reference. Credit is the share of expected elements matched, shrunk by
 * extra elements so plotting everything cannot score: matched / (expected + extra).
 */
export function gradeGraphPlot(settings: GraphPlotSettings, elements: PlotElement[]): GraphPlotGrade {
  const total = settings.expected.length;
  if (total === 0) return { reason: 'not_set', matched: 0, total: 0, extra: 0, fraction: 0, matches: [] };
  if (elements.length === 0) return { reason: 'missing', matched: 0, total, extra: 0, fraction: 0, matches: [] };

  const matches = matchPlotElements(settings, elements);
  const matched = matches.length;
  const extra = elements.length - matched;
  const fraction = matched / (total + extra);
  const reason: GraphGradeReason =
    matched === total ? (extra === 0 ? 'correct' : 'extra') : matched > 0 ? 'partial' : 'wrong';

  return { reason, matched, total, extra, fraction, matches };
}

/** Grades a value or point read off a graph; a value is compared by absolute difference, a point by distance. */
export function gradeGraphRead(settings: GraphReadSettings, answer: GraphReadAnswer): GraphAnswerGrading {
  const key = settings.answer;
  if (!key) return { reason: 'not_set', matched: 0, total: 1, extra: 0 };

  if (key.kind === 'value') {
    if (answer.value === undefined || !Number.isFinite(answer.value)) {
      return { reason: 'missing', matched: 0, total: 1, extra: 0 };
    }

    const isMatch = Math.abs(answer.value - key.value) <= key.tolerance + EPSILON;
    return { reason: isMatch ? 'correct' : 'wrong', matched: isMatch ? 1 : 0, total: 1, extra: 0 };
  }

  if (!answer.point) return { reason: 'missing', matched: 0, total: 1, extra: 0 };

  const isMatch = distance(answer.point, key) <= key.tolerance + EPSILON;
  return { reason: isMatch ? 'correct' : 'wrong', matched: isMatch ? 1 : 0, total: 1, extra: 0 };
}

/** Grades a `GRAPH_PLOT` or `GRAPH_READ` answer; null for any other question type or answer. */
export function gradeGraphAnswer(
  question: ExerciseQuestionModel,
  answer: AnswerData | null | undefined
): (GraphAnswerGrading & { fraction: number }) | null {
  if (answer?.type === 'GRAPH_PLOT' && question.questionType === QUESTION_TYPE_KEY.GRAPH_PLOT) {
    const { reason, matched, total, extra, fraction } = gradeGraphPlot(
      readGraphPlotSettings(question.settings),
      answer.elements
    );

    return { reason, matched, total, extra, fraction };
  }

  if (answer?.type === 'GRAPH_READ' && question.questionType === QUESTION_TYPE_KEY.GRAPH_READ) {
    const grading = gradeGraphRead(readGraphReadSettings(question.settings), answer);

    return { ...grading, fraction: grading.matched };
  }

  return null;
}

/** Returns a graph answer with its grading attached, so review views show the reason; other answers pass through. */
export function annotateGraphAnswer(question: ExerciseQuestionModel, answer: AnswerData): AnswerData {
  const grade = gradeGraphAnswer(question, answer);
  if (!grade || (answer.type !== 'GRAPH_PLOT' && answer.type !== 'GRAPH_READ')) return answer;

  const { reason, matched, total, extra } = grade;
  return { ...answer, grading: { reason, matched, total, extra } };
}
