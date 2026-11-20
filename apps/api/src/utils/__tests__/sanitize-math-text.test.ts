import { describe, expect, it } from 'vitest';

import {
  sanitizeHtml,
  sanitizeMathText,
  sanitizeQuestionSettings
} from '../../../../../packages/core/src/utils/sanitize-html';

describe('sanitizeMathText', () => {
  it('keeps < > & inside math untouched', () => {
    expect(sanitizeMathText('Solve $x<5$ and $y>2$')).toBe('Solve $x<5$ and $y>2$');
    expect(sanitizeMathText('Row $a&b$')).toBe('Row $a&b$');
    expect(sanitizeMathText('$\\begin{matrix} 1 & 2 \\\\ 3 & 4 \\end{matrix}$')).toBe(
      '$\\begin{matrix} 1 & 2 \\\\ 3 & 4 \\end{matrix}$'
    );
  });

  it('keeps a bare less-than or ampersand in plain text', () => {
    expect(sanitizeMathText('Is 3 < 5 & 4 > 2?')).toBe('Is 3 < 5 & 4 > 2?');
  });

  it('blocks HTML injection outside math', () => {
    expect(sanitizeMathText('Hi <script>alert(1)</script>there')).toBe('Hi there');
    expect(sanitizeMathText('<img src=x onerror=alert(1)>Pick')).toBe('Pick');
    expect(sanitizeMathText('<b>bold</b>')).toBe('bold');
  });

  it('neutralises tag-like markup inside math', () => {
    expect(sanitizeMathText('$a<b$')).toBe('$a\\lt b$');
    expect(sanitizeMathText('$x<script>alert(1)</script>$')).not.toContain('<script');
  });

  it('does not turn escaped markup in text back into a tag', () => {
    expect(sanitizeMathText('&lt;script&gt;alert(1)&lt;/script&gt;')).not.toContain('<script');
  });

  it('keeps an escaped dollar sign', () => {
    expect(sanitizeMathText('Costs \\$5 and \\$10')).toBe('Costs \\$5 and \\$10');
  });
});

describe('sanitizeQuestionSettings', () => {
  it('keeps answer keys and feedback math-safe and sanitizes the description as HTML', () => {
    const result = sanitizeQuestionSettings({
      description: '<p>Hi</p><script>alert(1)</script>',
      acceptedAnswers: ['x<5', 'a&b'],
      wrongAnswerFeedback: [{ answer: 'x<3', feedback: 'Flip the sign when $x<5$' }]
    });

    expect(result.description).toBe(sanitizeHtml('<p>Hi</p><script>alert(1)</script>'));
    expect(result.description).not.toContain('script');
    expect(result.acceptedAnswers).toEqual(['x<5', 'a&b']);
    expect(result.wrongAnswerFeedback).toEqual([{ answer: 'x<3', feedback: 'Flip the sign when $x<5$' }]);
  });

  it('neutralises tag-like LaTeX in answer keys', () => {
    expect(sanitizeQuestionSettings({ acceptedAnswers: ['<script>'] }).acceptedAnswers[0]).not.toContain('<script');
  });
});
