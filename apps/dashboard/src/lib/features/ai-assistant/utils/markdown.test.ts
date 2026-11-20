import { describe, expect, it } from 'vitest';

import { renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  it('renders inline math in all delimiter styles', () => {
    for (const text of ['Half is $\\frac{1}{2}$.', 'Half is \\(\\frac{1}{2}\\).']) {
      const html = renderMarkdown(text);

      expect(html).toContain('class="katex"');
      expect(html).not.toContain('$');
      expect(html).not.toContain('\\(');
    }
  });

  it('renders display math blocks', () => {
    for (const text of ['$$x^2 + 1$$', '\\[x^2 + 1\\]']) {
      expect(renderMarkdown(text)).toContain('katex-display');
    }
  });

  it('leaves currency, code and escaped dollars alone', () => {
    expect(renderMarkdown('It costs $5 and $10.')).not.toContain('katex');
    expect(renderMarkdown('Use `$x$` in code')).toContain('<code>$x$</code>');
    expect(renderMarkdown('A literal \\$x\\$ here')).not.toContain('katex');
  });

  it('keeps regular markdown working', () => {
    expect(renderMarkdown('**bold** and $x$')).toContain('<strong>bold</strong>');
  });
});
