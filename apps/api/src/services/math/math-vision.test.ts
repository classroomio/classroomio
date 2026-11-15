import { describe, expect, it } from 'vitest';

import { cleanModelLatex } from './convert-image';
import { buildImportedQuestion } from './import-worksheet';

const base = {
  title: 'Compute $\\frac{1}{2}+\\frac{1}{3}$',
  type: 'MATH_EXPRESSION' as const,
  answer: '\\frac{5}{6}',
  options: null,
  correctOptionIndex: null,
  checkExpression: '\\frac{1}{2}+\\frac{1}{3}',
  checkEquation: null,
  points: null
};

describe('cleanModelLatex', () => {
  it('strips code fences and math delimiters', () => {
    expect(cleanModelLatex('```latex\nx^2+1\n```')).toBe('x^2+1');
    expect(cleanModelLatex('$$x^2$$')).toBe('x^2');
    expect(cleanModelLatex('$x^2$')).toBe('x^2');
    expect(cleanModelLatex('\\[x^2\\]')).toBe('x^2');
    expect(cleanModelLatex('\\(x^2\\)')).toBe('x^2');
  });

  it('keeps plain LaTeX unchanged', () => {
    expect(cleanModelLatex(' \\frac{1}{2} ')).toBe('\\frac{1}{2}');
  });
});

describe('buildImportedQuestion', () => {
  it('marks a key the engine confirms as verified', () => {
    const question = buildImportedQuestion(base);

    expect(question.verified).toBe(true);
    expect(question.issues).toEqual([]);
    expect(question.settings).toEqual({ acceptedAnswers: ['\\frac{5}{6}'] });
  });

  it('flags a key the engine disagrees with', () => {
    const question = buildImportedQuestion({ ...base, answer: '\\frac{2}{5}' });

    expect(question.verified).toBe(false);
    expect(question.issues[0]).toContain('does not equal');
  });

  it('flags a key with no independent check', () => {
    const question = buildImportedQuestion({ ...base, checkExpression: null });

    expect(question.verified).toBe(false);
    expect(question.issues.join(' ')).toContain('could not check');
  });

  it('verifies a numeric key against its equation', () => {
    const question = buildImportedQuestion({
      ...base,
      type: 'NUMERIC',
      title: 'Solve $2x+3=11$',
      answer: '4',
      checkExpression: null,
      checkEquation: '2x+3=11'
    });

    expect(question.verified).toBe(true);
    expect(question.settings).toEqual({ correctValue: '4' });
  });

  it('checks the correct option of a multiple choice question', () => {
    const question = buildImportedQuestion({
      ...base,
      type: 'RADIO',
      answer: null,
      options: ['$\\frac{2}{5}$', '$\\frac{5}{6}$'],
      correctOptionIndex: 1
    });

    expect(question.verified).toBe(true);
    expect(question.options.map((option) => option.isCorrect)).toEqual([false, true]);
  });

  it('flags a multiple choice question whose correct option disagrees', () => {
    const question = buildImportedQuestion({
      ...base,
      type: 'RADIO',
      answer: null,
      options: ['$\\frac{2}{5}$', '$\\frac{5}{6}$'],
      correctOptionIndex: 0
    });

    expect(question.verified).toBe(false);
  });

  it('flags a multiple choice question with no identified correct option', () => {
    const question = buildImportedQuestion({
      ...base,
      type: 'RADIO',
      answer: null,
      options: ['$1$'],
      correctOptionIndex: null
    });

    expect(question.verified).toBe(false);
  });
});
