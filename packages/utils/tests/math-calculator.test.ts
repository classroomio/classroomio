import { describe, expect, it } from 'vitest';

import { evaluateCalculatorExpression, formatCalculatorValue } from '../src/math';

const value = (source: string, angleMode?: 'deg' | 'rad') => {
  const result = evaluateCalculatorExpression(source, angleMode);

  return result.ok ? result.value : null;
};

describe('evaluateCalculatorExpression', () => {
  it('follows operator precedence and parentheses', () => {
    expect(value('2+3*4')).toBe(14);
    expect(value('(2+3)*4')).toBe(20);
    expect(value('2^3^2')).toBe(512);
    expect(value('-2^2')).toBe(-4);
  });

  it('reads display symbols and implicit multiplication', () => {
    expect(value('6×7')).toBe(42);
    expect(value('8÷2')).toBe(4);
    expect(value('2(3+4)')).toBe(14);
    expect(value('2pi')).toBeCloseTo(2 * Math.PI);
  });

  it('applies functions, percent and factorial', () => {
    expect(value('sqrt(16)')).toBe(4);
    expect(value('√9')).toBe(3);
    expect(value('50%')).toBe(0.5);
    expect(value('5!')).toBe(120);
    expect(value('log(1000)')).toBeCloseTo(3);
    expect(value('ln(e)')).toBeCloseTo(1);
  });

  it('honours the angle mode for trig functions', () => {
    expect(value('sin(30)', 'deg')).toBeCloseTo(0.5);
    expect(value('sin(pi/2)', 'rad')).toBeCloseTo(1);
    expect(value('asin(1)', 'deg')).toBeCloseTo(90);
  });

  it('rejects syntax errors and non-finite results', () => {
    expect(value('')).toBeNull();
    expect(value('2+')).toBeNull();
    expect(value('1/0')).toBeNull();
    expect(value('foo(2)')).toBeNull();
    expect(value('(-1)!')).toBeNull();
    expect(value('2 $ 3')).toBeNull();
  });
});

describe('formatCalculatorValue', () => {
  it('trims float noise', () => {
    expect(formatCalculatorValue(0.1 + 0.2)).toBe('0.3');
    expect(formatCalculatorValue(1 / 3)).toBe('0.3333333333');
    expect(formatCalculatorValue(0)).toBe('0');
  });
});
