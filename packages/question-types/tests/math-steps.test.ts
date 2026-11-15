import { describe, expect, it } from 'vitest';

import { checkMathSteps, compareMathExpressions } from '../src/math-steps';

describe('checkMathSteps', () => {
  it('passes a chain of correct steps', () => {
    const result = checkMathSteps(['2x+3=11', '2x=8', 'x=4']);

    expect(result.firstIncorrectIndex).toBeNull();
    expect(result.steps.map((step) => step.status)).toEqual(['consistent', 'consistent', 'consistent']);
  });

  it('points to the first step that does not follow', () => {
    const result = checkMathSteps(['2x+3=11', '2x=14', 'x=7']);

    expect(result.firstIncorrectIndex).toBe(1);
    expect(result.steps[1].status).toBe('inconsistent');
  });

  it('compares the first line with the starting expression', () => {
    const result = checkMathSteps(['2x+2', '2(x+1)'], { startingExpression: '2(x+1)+1' });

    expect(result.firstIncorrectIndex).toBe(0);
  });

  it('checks expression steps by value', () => {
    expect(checkMathSteps(['(x+1)^2', 'x^2+2x+1', 'x^2+1']).firstIncorrectIndex).toBe(2);
  });

  it('skips unreadable lines and keeps checking the rest', () => {
    const result = checkMathSteps(['2x=8', '\\frac{', 'x=5']);

    expect(result.steps[1].status).toBe('unreadable');
    expect(result.firstIncorrectIndex).toBe(2);
  });

  it('accepts an empty list', () => {
    expect(checkMathSteps([])).toEqual({ steps: [], firstIncorrectIndex: null });
  });
});

describe('compareMathExpressions', () => {
  it.each([
    ['2(x+1)', '2x+2', 'equal'],
    ['2(x+1)', '2x+1', 'different'],
    ['x^2-5x+6=0', '(x-2)(x-3)=0', 'equal'],
    ['\\frac{', 'x', 'invalid']
  ])('%s vs %s -> %s', (left, right, expected) => {
    expect(compareMathExpressions(left, right)).toBe(expected);
  });
});
