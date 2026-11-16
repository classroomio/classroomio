import { describe, expect, it } from 'vitest';

import {
  annotateGraphAnswer,
  fromApiPayload,
  gradeGraphPlot,
  gradeGraphRead,
  matchPlotElements,
  plotElementError,
  readGraphBoardSettings,
  readGraphPlotSettings,
  readGraphReadSettings,
  readPlotElements,
  scoreAnswerForQuestion,
  snapGraphCoordinate,
  toApiPayload,
  QUESTION_TYPE_KEY,
  type AnswerData,
  type ExerciseQuestionModel,
  type PlotElement
} from '../src';
import { getAnswerClusterKey } from '../src/answer-clusters';
import { compileGraphFunction } from '../src/graph-functions';

const BOARD = { xMin: -10, xMax: 10, yMin: -10, yMax: 10, grid: true, snap: 1, xLabel: 'x', yLabel: 'y' };

const point = (x: number, y: number): PlotElement => ({ kind: 'point', x, y });
const line = (x1: number, y1: number, x2: number, y2: number): PlotElement => ({
  kind: 'line',
  from: { x: x1, y: y1 },
  to: { x: x2, y: y2 }
});
const segment = (x1: number, y1: number, x2: number, y2: number): PlotElement => ({
  kind: 'segment',
  from: { x: x1, y: y1 },
  to: { x: x2, y: y2 }
});
const parabola = (vx: number, vy: number, px: number, py: number): PlotElement => ({
  kind: 'parabola',
  vertex: { x: vx, y: vy },
  through: { x: px, y: py }
});

const plotQuestion = (expected: PlotElement[], extra: Record<string, unknown> = {}): ExerciseQuestionModel => ({
  id: 1,
  title: 'Plot',
  questionType: QUESTION_TYPE_KEY.GRAPH_PLOT,
  points: 4,
  settings: { board: BOARD, expected, ...extra }
});

const readQuestion = (answer: Record<string, unknown>): ExerciseQuestionModel => ({
  id: 2,
  title: 'Read',
  questionType: QUESTION_TYPE_KEY.GRAPH_READ,
  points: 2,
  settings: { board: BOARD, curves: [{ expression: 'x^2-4' }], answer }
});

const plotAnswer = (...elements: PlotElement[]): AnswerData => ({ type: 'GRAPH_PLOT', elements });

describe('plotElementError', () => {
  it('measures point distance', () => {
    expect(plotElementError(point(1, 2), point(4, 6), BOARD)).toBe(5);
  });

  it('never matches different kinds', () => {
    expect(plotElementError(point(0, 0), line(0, 0, 1, 1), BOARD)).toBe(Number.POSITIVE_INFINITY);
    expect(plotElementError(segment(0, 0, 1, 1), line(0, 0, 1, 1), BOARD)).toBe(Number.POSITIVE_INFINITY);
    expect(plotElementError(parabola(0, 0, 1, 1), point(0, 0), BOARD)).toBe(Number.POSITIVE_INFINITY);
  });

  it('treats a segment drawn in either direction as the same', () => {
    expect(plotElementError(segment(0, 0, 4, 4), segment(4, 4, 0, 0), BOARD)).toBe(0);
  });

  it('measures a segment by its worst endpoint', () => {
    expect(plotElementError(segment(0, 0, 4, 0), segment(0, 0, 4, 3), BOARD)).toBe(3);
  });

  it('accepts a line through the same points drawn from other points on it', () => {
    expect(plotElementError(line(0, 0, 1, 1), line(-3, -3, 5, 5), BOARD)).toBeCloseTo(0);
  });

  it('accepts a vertical line', () => {
    expect(plotElementError(line(2, 0, 2, 5), line(2, -4, 2, 9), BOARD)).toBeCloseTo(0);
  });

  it('rejects a line with the wrong slope', () => {
    expect(plotElementError(line(0, 0, 4, 4), line(0, 0, 4, 2), BOARD)).toBeGreaterThan(1);
  });

  it('gives a degenerate student line infinite error', () => {
    expect(plotElementError(line(0, 0, 4, 4), line(1, 1, 1, 1), BOARD)).toBe(Number.POSITIVE_INFINITY);
  });

  it('gives identical parabolas no error', () => {
    expect(plotElementError(parabola(0, -4, 2, 0), parabola(0, -4, 2, 0), BOARD)).toBeCloseTo(0);
  });

  it('accepts the same parabola defined by another point on it', () => {
    expect(plotElementError(parabola(0, -4, 2, 0), parabola(0, -4, 3, 5), BOARD)).toBeCloseTo(0);
  });

  it('rejects a parabola with a moved vertex', () => {
    expect(plotElementError(parabola(0, -4, 2, 0), parabola(1, -4, 3, 0), BOARD)).toBeGreaterThan(0.5);
  });

  it('rejects a parabola that opens the other way', () => {
    expect(plotElementError(parabola(0, 0, 2, 4), parabola(0, 0, 2, -4), BOARD)).toBeGreaterThan(1);
  });

  it('gives a vertical student parabola infinite error', () => {
    expect(plotElementError(parabola(0, 0, 2, 4), parabola(1, 1, 1, 5), BOARD)).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('matchPlotElements', () => {
  it('pairs each expected element with a distinct student element', () => {
    const settings = readGraphPlotSettings({ board: BOARD, expected: [point(1, 1), point(3, 3)], tolerance: 0.5 });
    const matches = matchPlotElements(settings, [point(3.1, 3), point(1, 1.1)]);

    expect(matches.map((match) => [match.expectedIndex, match.studentIndex]).sort()).toEqual([
      [0, 1],
      [1, 0]
    ]);
  });

  it('does not let one student point satisfy two expected points', () => {
    const settings = readGraphPlotSettings({ board: BOARD, expected: [point(1, 1), point(1.2, 1)], tolerance: 0.5 });

    expect(matchPlotElements(settings, [point(1.1, 1)])).toHaveLength(1);
  });

  it('prefers the closest pair', () => {
    const settings = readGraphPlotSettings({ board: BOARD, expected: [point(0, 0)], tolerance: 1 });
    const [match] = matchPlotElements(settings, [point(0.8, 0), point(0.1, 0)]);

    expect(match.studentIndex).toBe(1);
  });
});

describe('gradeGraphPlot', () => {
  const settings = (expected: PlotElement[], tolerance = 0.25) =>
    readGraphPlotSettings({ board: BOARD, expected, tolerance });

  it('is not set without an expected element', () => {
    expect(gradeGraphPlot(settings([]), [point(1, 1)]).reason).toBe('not_set');
  });

  it('is missing without student elements', () => {
    expect(gradeGraphPlot(settings([point(1, 1)]), [])).toMatchObject({ reason: 'missing', fraction: 0 });
  });

  it('is correct for an exact answer', () => {
    expect(gradeGraphPlot(settings([point(1, 1), line(0, 0, 1, 1)]), [point(1, 1), line(0, 0, 2, 2)])).toMatchObject({
      reason: 'correct',
      matched: 2,
      total: 2,
      extra: 0,
      fraction: 1
    });
  });

  it('is correct within the tolerance and wrong outside it', () => {
    expect(gradeGraphPlot(settings([point(2, 2)], 0.5), [point(2.3, 2)]).reason).toBe('correct');
    expect(gradeGraphPlot(settings([point(2, 2)], 0.5), [point(2.6, 2)]).reason).toBe('wrong');
  });

  it('gives partial credit for part of the answer', () => {
    expect(gradeGraphPlot(settings([point(1, 1), point(5, 5)]), [point(1, 1)])).toMatchObject({
      reason: 'partial',
      matched: 1,
      fraction: 0.5
    });
  });

  it('shrinks credit for extra elements', () => {
    expect(gradeGraphPlot(settings([point(1, 1)]), [point(1, 1), point(9, 9)])).toMatchObject({
      reason: 'extra',
      matched: 1,
      extra: 1,
      fraction: 0.5
    });
  });

  it('scores nothing for plotting everywhere', () => {
    const scatter = Array.from({ length: 9 }, (_, index) => point(index - 4, 7));
    const grade = gradeGraphPlot(settings([point(1, 1)]), scatter);

    expect(grade.reason).toBe('wrong');
    expect(grade.fraction).toBe(0);
  });

  it('grades a parabola by its shape', () => {
    const expected = [parabola(1, -2, 3, 2)];

    expect(gradeGraphPlot(settings(expected, 0.3), [parabola(1, -2, 2, 0)]).reason).toBe('wrong');
    expect(gradeGraphPlot(settings(expected, 0.3), [parabola(1, -2, 3, 2)]).reason).toBe('correct');
  });

  it('requires the right kind of element', () => {
    expect(gradeGraphPlot(settings([segment(0, 0, 4, 4)]), [line(0, 0, 4, 4)]).reason).toBe('wrong');
  });
});

describe('gradeGraphRead', () => {
  it('is not set without a key', () => {
    expect(gradeGraphRead(readGraphReadSettings({}), { value: 1 }).reason).toBe('not_set');
  });

  it('grades a value within the tolerance', () => {
    const settings = readGraphReadSettings({ answer: { kind: 'value', value: 3, tolerance: 0.2 } });

    expect(gradeGraphRead(settings, { value: 3.2 }).reason).toBe('correct');
    expect(gradeGraphRead(settings, { value: 3.21 }).reason).toBe('wrong');
    expect(gradeGraphRead(settings, {}).reason).toBe('missing');
  });

  it('grades an exact value when no tolerance is set', () => {
    const settings = readGraphReadSettings({ answer: { kind: 'value', value: -2, tolerance: 0 } });

    expect(gradeGraphRead(settings, { value: -2 }).reason).toBe('correct');
    expect(gradeGraphRead(settings, { value: -2.01 }).reason).toBe('wrong');
  });

  it('grades a point by distance', () => {
    const settings = readGraphReadSettings({ answer: { kind: 'point', x: 2, y: -1, tolerance: 0.5 } });

    expect(gradeGraphRead(settings, { point: { x: 2.3, y: -1.3 } }).reason).toBe('correct');
    expect(gradeGraphRead(settings, { point: { x: 3, y: -1 } }).reason).toBe('wrong');
    expect(gradeGraphRead(settings, { value: 2 }).reason).toBe('missing');
  });
});

describe('scoring', () => {
  it('awards a share of the points for a partly right plot', () => {
    const question = plotQuestion([point(1, 1), point(5, 5)]);

    expect(scoreAnswerForQuestion(question, plotAnswer(point(1, 1)))).toBe(2);
    expect(scoreAnswerForQuestion(question, plotAnswer(point(1, 1), point(5, 5)))).toBe(4);
  });

  it('scores 0 when the answer type does not match the question', () => {
    expect(scoreAnswerForQuestion(plotQuestion([point(1, 1)]), { type: 'GRAPH_READ', value: 1 })).toBe(0);
    expect(scoreAnswerForQuestion(readQuestion({ kind: 'value', value: 1 }), plotAnswer(point(1, 1)))).toBe(0);
  });

  it('awards all points for a right reading and none for a wrong one', () => {
    const question = readQuestion({ kind: 'value', value: 5, tolerance: 0.1 });

    expect(scoreAnswerForQuestion(question, { type: 'GRAPH_READ', value: 5.05 })).toBe(2);
    expect(scoreAnswerForQuestion(question, { type: 'GRAPH_READ', value: 6 })).toBe(0);
  });
});

describe('annotateGraphAnswer', () => {
  it('attaches the grading to a plot answer', () => {
    const annotated = annotateGraphAnswer(plotQuestion([point(1, 1)]), plotAnswer(point(1, 1), point(8, 8)));

    expect(annotated).toMatchObject({ grading: { reason: 'extra', matched: 1, total: 1, extra: 1 } });
  });

  it('attaches the grading to a read answer', () => {
    const annotated = annotateGraphAnswer(readQuestion({ kind: 'value', value: 5, tolerance: 0 }), {
      type: 'GRAPH_READ',
      value: 5
    });

    expect(annotated).toMatchObject({ grading: { reason: 'correct' } });
  });

  it('leaves other answers alone', () => {
    const answer: AnswerData = { type: 'NUMERIC', value: 1 };

    expect(annotateGraphAnswer(plotQuestion([point(1, 1)]), answer)).toBe(answer);
  });
});

describe('settings readers', () => {
  it('falls back to the default board for an inverted range', () => {
    expect(readGraphBoardSettings({ xMin: 5, xMax: 1 })).toMatchObject({ xMin: -10, xMax: 10 });
  });

  it('reads board options', () => {
    expect(readGraphBoardSettings({ xMin: 0, xMax: 20, grid: false, snap: 0.5, xLabel: 't' })).toMatchObject({
      xMin: 0,
      xMax: 20,
      grid: false,
      snap: 0.5,
      xLabel: 't'
    });
  });

  it('defaults to every tool and keeps only known ones in order', () => {
    expect(readGraphPlotSettings({}).tools).toEqual(['point', 'line', 'segment', 'parabola']);
    expect(readGraphPlotSettings({ tools: ['parabola', 'nonsense', 'point'] }).tools).toEqual(['point', 'parabola']);
  });

  it('drops malformed elements', () => {
    expect(
      readPlotElements([point(1, 2), { kind: 'point', x: 'a', y: 1 }, { kind: 'blob' }, null, { kind: 'line' }])
    ).toEqual([point(1, 2)]);
  });

  it('rejects coordinates that are not finite or are absurdly large', () => {
    expect(
      readPlotElements([
        { kind: 'point', x: Infinity, y: 0 },
        { kind: 'point', x: 1e9, y: 0 }
      ])
    ).toEqual([]);
  });

  it('reads curves, points and the answer key', () => {
    const settings = readGraphReadSettings({
      curves: [{ expression: ' x^2 ', label: ' f ' }, { expression: '' }],
      points: [
        { x: 1, y: 2, label: 'A' },
        { x: 'a', y: 2 }
      ],
      answer: { kind: 'value', value: '3', tolerance: '0.5' }
    });

    expect(settings.curves).toEqual([{ expression: 'x^2', label: 'f' }]);
    expect(settings.points).toEqual([{ x: 1, y: 2, label: 'A' }]);
    expect(settings.answer).toEqual({ kind: 'value', value: 3, tolerance: 0.5 });
  });

  it('has no answer key for an unknown kind', () => {
    expect(readGraphReadSettings({ answer: { kind: 'wat', value: 1 } }).answer).toBeNull();
  });
});

describe('snapGraphCoordinate', () => {
  it('snaps to the step and clamps to the range', () => {
    expect(snapGraphCoordinate(2.6, 1, -10, 10)).toBe(3);
    expect(snapGraphCoordinate(2.6, 0.5, -10, 10)).toBe(2.5);
    expect(snapGraphCoordinate(14, 1, -10, 10)).toBe(10);
    expect(snapGraphCoordinate(2.34, 0, -10, 10)).toBe(2.34);
  });
});

describe('codecs', () => {
  const plotQuestionModel = plotQuestion([point(1, 1)]);

  it('round-trips a plot answer', () => {
    const answer: AnswerData = plotAnswer(point(1, 2), line(0, 0, 3, 3), parabola(0, 0, 1, 1));
    const payload = toApiPayload(answer, 1);

    expect(fromApiPayload('GRAPH_PLOT', payload, plotQuestionModel)).toEqual(answer);
  });

  it('round-trips a read answer', () => {
    expect(fromApiPayload('GRAPH_READ', toApiPayload({ type: 'GRAPH_READ', value: 2.5 }, 2), readQuestion({}))).toEqual(
      {
        type: 'GRAPH_READ',
        value: 2.5
      }
    );
    expect(
      fromApiPayload('GRAPH_READ', toApiPayload({ type: 'GRAPH_READ', point: { x: 1, y: 2 } }, 2), readQuestion({}))
    ).toEqual({ type: 'GRAPH_READ', point: { x: 1, y: 2 } });
  });

  it('keeps the stored grading', () => {
    const grading = { reason: 'partial' as const, matched: 1, total: 2, extra: 0 };
    const stored = toApiPayload({ type: 'GRAPH_PLOT', elements: [point(1, 1)], grading }, 1);

    expect(fromApiPayload('GRAPH_PLOT', stored, plotQuestionModel)).toMatchObject({ grading });
  });

  it('rejects an empty or malformed answer', () => {
    expect(
      fromApiPayload(
        'GRAPH_PLOT',
        { questionId: 1, answer: JSON.stringify({ type: 'GRAPH_PLOT', elements: [] }) },
        plotQuestionModel
      )
    ).toBeNull();
    expect(fromApiPayload('GRAPH_PLOT', { questionId: 1, answer: 'nope' }, plotQuestionModel)).toBeNull();
    expect(
      fromApiPayload('GRAPH_READ', { questionId: 2, answer: JSON.stringify({ type: 'GRAPH_READ' }) }, readQuestion({}))
    ).toBeNull();
    expect(
      fromApiPayload(
        'GRAPH_PLOT',
        { questionId: 1, answer: JSON.stringify({ type: 'GRAPH_PLOT', elements: [{ kind: 'point', x: 'a', y: 1 }] }) },
        plotQuestionModel
      )
    ).toBeNull();
  });

  it('has no answer cluster', () => {
    expect(getAnswerClusterKey(plotQuestionModel, plotAnswer(point(1, 1)))).toBeNull();
  });
});

describe('compileGraphFunction', () => {
  it('evaluates a polynomial', () => {
    expect(compileGraphFunction('x^2-4')?.(3)).toBeCloseTo(5);
  });

  it('accepts a y= or f(x)= prefix', () => {
    expect(compileGraphFunction('y=2x+1')?.(2)).toBeCloseTo(5);
    expect(compileGraphFunction('f(x)=x^{3}')?.(2)).toBeCloseTo(8);
  });

  it('evaluates trigonometric and rational functions', () => {
    expect(compileGraphFunction('\\sin(x)')?.(Math.PI / 2)).toBeCloseTo(1);
    expect(compileGraphFunction('\\frac{1}{x}')?.(4)).toBeCloseTo(0.25);
  });

  it('returns NaN where the value is not real', () => {
    expect(compileGraphFunction('\\sqrt{x}')?.(-4)).toBeNaN();
  });

  it('returns null for an empty expression', () => {
    expect(compileGraphFunction('')).toBeNull();
  });
});
