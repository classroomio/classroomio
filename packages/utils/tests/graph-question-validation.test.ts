import { describe, expect, it } from 'vitest';

import { QUESTION_TYPE_IDS } from '@cio/question-types';

import { ZExerciseQuestionTypeId, getQuestionOptionIssues } from '../src/validation/exercise';
import { ZPublicApiQuestionTypeId } from '../src/validation/public-api/course-exercise';

const board = { xMin: -5, xMax: 5, yMin: -5, yMax: 5, grid: true, snap: 1 };
const plotIssues = (settings: Record<string, unknown>) =>
  getQuestionOptionIssues({ questionTypeId: QUESTION_TYPE_IDS.GRAPH_PLOT, settings });
const readIssues = (settings: Record<string, unknown>) =>
  getQuestionOptionIssues({ questionTypeId: QUESTION_TYPE_IDS.GRAPH_READ, settings });

describe('graph question type ids', () => {
  it('accepts both graph types in the dashboard and public API schemas', () => {
    for (const id of [QUESTION_TYPE_IDS.GRAPH_PLOT, QUESTION_TYPE_IDS.GRAPH_READ]) {
      expect(ZExerciseQuestionTypeId.safeParse(id).success).toBe(true);
      expect(ZPublicApiQuestionTypeId.safeParse(id).success).toBe(true);
    }
  });

  it('keeps HOTSPOT out of the public API', () => {
    expect(ZPublicApiQuestionTypeId.safeParse(QUESTION_TYPE_IDS.HOTSPOT).success).toBe(false);
  });
});

describe('GRAPH_PLOT settings validation', () => {
  it('requires an expected element', () => {
    expect(plotIssues({})).toHaveLength(1);
    expect(plotIssues({ expected: [] })).toEqual(['Draw at least one element as the correct answer']);
  });

  it('accepts every element kind', () => {
    const expected = [
      { kind: 'point', x: 1, y: 2 },
      { kind: 'line', from: { x: 0, y: 0 }, to: { x: 1, y: 1 } },
      { kind: 'segment', from: { x: 0, y: 0 }, to: { x: 3, y: 1 } },
      { kind: 'parabola', vertex: { x: 0, y: -1 }, through: { x: 2, y: 3 } }
    ];

    expect(plotIssues({ board, tools: ['point', 'parabola'], expected, tolerance: 0.5 })).toEqual([]);
  });

  it('rejects an unknown kind, a missing coordinate and a non-finite number', () => {
    expect(plotIssues({ expected: [{ kind: 'circle', x: 1, y: 1 }] })).toHaveLength(1);
    expect(plotIssues({ expected: [{ kind: 'point', x: 1 }] })).toHaveLength(1);
    expect(plotIssues({ expected: [{ kind: 'point', x: 1e12, y: 1 }] })).toHaveLength(1);
  });

  it('rejects an inverted board range, an unknown tool and a negative tolerance', () => {
    const expected = [{ kind: 'point', x: 1, y: 1 }];

    expect(plotIssues({ expected, board: { ...board, xMin: 6 } })).toHaveLength(1);
    expect(plotIssues({ expected, tools: ['compass'] })).toHaveLength(1);
    expect(plotIssues({ expected, tolerance: -1 })).toHaveLength(1);
  });

  it('rejects too many elements', () => {
    expect(plotIssues({ expected: Array.from({ length: 41 }, () => ({ kind: 'point', x: 0, y: 0 })) })).toHaveLength(1);
  });
});

describe('GRAPH_READ settings validation', () => {
  const answer = { kind: 'value', value: 3, tolerance: 0.1 };

  it('requires a graph to read and an answer', () => {
    expect(readIssues({ answer })).toEqual(['Add a function or a point to the graph students read']);
    expect(readIssues({ curves: [{ expression: 'x^2' }] })).toHaveLength(1);
  });

  it('accepts a function or a marked point with a value or point answer', () => {
    expect(readIssues({ board, curves: [{ expression: 'x^2-4', label: 'f' }], answer })).toEqual([]);
    expect(
      readIssues({ points: [{ x: 1, y: 2, label: 'A' }], answer: { kind: 'point', x: 1, y: 2, tolerance: 0.2 } })
    ).toEqual([]);
  });

  it('rejects a blank expression and an unknown answer kind', () => {
    expect(readIssues({ curves: [{ expression: '  ' }], answer })).toHaveLength(1);
    expect(readIssues({ curves: [{ expression: 'x' }], answer: { kind: 'text', value: 1 } })).toHaveLength(1);
  });
});
