import { describe, expect, it } from 'vitest';
import { calculateStudentAverage, calculateStudentTotal } from './marks-utils';

const exercises = [
  { id: 'a', title: 'A', points: 2 },
  { id: 'b', title: 'B', points: 2 }
];

describe('marks with fractional points', () => {
  it('adds decimal marks without truncating them', () => {
    expect(calculateStudentTotal({ a: '0.5', b: '1.25' })).toBe(1.75);
  });

  it('averages decimal marks', () => {
    expect(calculateStudentAverage({ a: '1.5', b: '1.5' }, exercises)).toBe(75);
  });
});
