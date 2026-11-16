import { describe, expect, it } from 'vitest';
import {
  correctValueToLatex,
  isWithinTolerance,
  latexToCorrectValue,
  latexToNumber
} from '../../../../../../../../packages/ui/src/custom/exercise-question/renderers/numeric/numeric-utils';
import {
  orderRightItems,
  readMatchingPairs
} from '../../../../../../../../packages/ui/src/custom/exercise-question/renderers/matching/matching-utils';

describe('numeric utils', () => {
  it('evaluates fractions, roots and pi', async () => {
    expect(await latexToNumber('\\frac{3}{4}')).toBe(0.75);
    expect(await latexToNumber('2\\sqrt{2}')).toBeCloseTo(2.828427, 5);
    expect(await latexToNumber('\\pi')).toBeCloseTo(Math.PI, 8);
  });

  it('returns null for text that is not a number', async () => {
    expect(await latexToNumber('x+1')).toBeNull();
    expect(await latexToNumber('  ')).toBeNull();
  });

  it('stores a plain number as a number and anything else as LaTeX', () => {
    expect(latexToCorrectValue('3.5')).toBe(3.5);
    expect(latexToCorrectValue('\\frac{3}{4}')).toBe('\\frac{3}{4}');
    expect(latexToCorrectValue('')).toBeUndefined();
    expect(correctValueToLatex(2)).toBe('2');
  });

  it('applies absolute and relative tolerance', () => {
    expect(isWithinTolerance(10.4, 10, { tolerance: 0.5 })).toBe(true);
    expect(isWithinTolerance(10.6, 10, { tolerance: 0.5 })).toBe(false);
    expect(isWithinTolerance(104, 100, { relativeTolerance: 0.05 })).toBe(true);
  });
});

describe('matching utils', () => {
  const question = {
    id: 7,
    title: '',
    questionType: 'MATCHING',
    settings: { pairs: [{ left: 'a', right: '1' }, { left: 'b', right: '2' }, { left: 'bad' }] }
  } as never;

  it('keeps only well formed pairs', () => {
    expect(readMatchingPairs(question)).toEqual([
      { left: 'a', right: '1' },
      { left: 'b', right: '2' }
    ]);
  });

  it('orders right items the same way every time', () => {
    const pairs = readMatchingPairs(question);
    expect(orderRightItems(question, pairs)).toEqual(orderRightItems(question, pairs));
    expect([...orderRightItems(question, pairs)].sort()).toEqual(['1', '2']);
  });
});
