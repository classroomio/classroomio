import { describe, expect, it } from 'vitest';

import {
  hasMathText,
  joinMathText,
  mathTextToPlainText,
  readMathToken,
  renderEditorMath,
  renderEditorMathToMathml,
  renderLatexToMathml,
  renderMathText,
  renderMathTextToMathml,
  splitMathText
} from '../src/math';

const bracketLatex = (latex: string, display: boolean) => `[${display ? 'block' : 'inline'}:${latex}]`;

describe('splitMathText', () => {
  it('returns a single text segment when there is no math', () => {
    expect(splitMathText('What is the capital of France?')).toEqual([
      { type: 'text', text: 'What is the capital of France?' }
    ]);
  });

  it('splits inline and display math', () => {
    expect(splitMathText('Solve $x^2-5x+6=0$ then $$\\frac{1}{2}$$')).toEqual([
      { type: 'text', text: 'Solve ' },
      { type: 'math', latex: 'x^2-5x+6=0', display: false },
      { type: 'text', text: ' then ' },
      { type: 'math', latex: '\\frac{1}{2}', display: true }
    ]);
  });

  it('leaves currency amounts as text', () => {
    expect(hasMathText('It costs $5 and $10')).toBe(false);
    expect(hasMathText('Between $5-$10')).toBe(false);
    expect(hasMathText('Pay $ 5 now')).toBe(false);
    expect(hasMathText('$5 and $x$')).toBe(true);
  });

  it('treats an escaped dollar as a literal dollar sign', () => {
    expect(splitMathText('\\$x\\$')).toEqual([{ type: 'text', text: '$x$' }]);
  });

  it('reads rich-text editor math elements', () => {
    expect(splitMathText('Area: <span data-type="inline-math" data-latex="\\pi r^2 &amp; more"></span>')).toEqual([
      { type: 'text', text: 'Area: ' },
      { type: 'math', latex: '\\pi r^2 & more', display: false }
    ]);
  });

  it('keeps an unmatched dollar as text', () => {
    expect(splitMathText('$x')).toEqual([{ type: 'text', text: '$x' }]);
  });
});

describe('readMathToken', () => {
  it('reads bracket delimiters only when enabled', () => {
    expect(readMathToken('\\(x+1\\) rest')).toBeNull();
    expect(readMathToken('\\(x+1\\) rest', { brackets: true })).toEqual({
      raw: '\\(x+1\\)',
      latex: 'x+1',
      display: false
    });
    expect(readMathToken('\\[x\\]', { brackets: true })?.display).toBe(true);
  });

  it('does not read empty math', () => {
    expect(readMathToken('$$ $$')).toBeNull();
  });
});

describe('joinMathText', () => {
  it('round-trips text and math', () => {
    const value = 'Solve $x^2=4$ for $$x$$';

    expect(joinMathText(splitMathText(value))).toBe(value);
  });

  it('keeps currency text unchanged', () => {
    expect(joinMathText([{ type: 'text', text: 'Costs $5' }])).toBe('Costs $5');
  });

  it('escapes dollars that would otherwise read as math', () => {
    const joined = joinMathText([
      { type: 'text', text: 'literal $a$ and ' },
      { type: 'math', latex: 'b', display: false }
    ]);

    expect(joined).toBe('literal \\$a\\$ and $b$');
    expect(splitMathText(joined)).toEqual([
      { type: 'text', text: 'literal $a$ and ' },
      { type: 'math', latex: 'b', display: false }
    ]);
  });
});

describe('mathTextToPlainText', () => {
  it('drops delimiters', () => {
    expect(mathTextToPlainText('Value of $x^2$')).toBe('Value of x^2');
  });
});

describe('renderMathText', () => {
  it('escapes text and renders math', () => {
    expect(renderMathText('<b> $x$', bracketLatex)).toBe('&lt;b&gt; [inline:x]');
  });
});

describe('renderEditorMath', () => {
  it('fills editor math elements once', () => {
    const html =
      '<p>A <span data-type="inline-math" data-latex="x^2"></span></p><div data-type="block-math" data-latex="y"></div>';
    const rendered = renderEditorMath(html, bracketLatex);

    expect(rendered).toBe(
      '<p>A <span data-type="inline-math" data-latex="x^2" data-math-rendered="true">[inline:x^2]</span></p><div data-type="block-math" data-latex="y" data-math-rendered="true">[block:y]</div>'
    );
    expect(renderEditorMath(rendered, bracketLatex)).toBe(rendered);
  });

  it('returns html without math unchanged', () => {
    expect(renderEditorMath('<p>Hello</p>', bracketLatex)).toBe('<p>Hello</p>');
  });
});

describe('MathML rendering', () => {
  it('renders LaTeX to MathML', () => {
    expect(renderLatexToMathml('x^2')).toContain('<math');
    expect(renderLatexToMathml('x', true)).toContain('display="block"');
  });

  it('renders strings and editor HTML to MathML', () => {
    expect(renderMathTextToMathml('A & $x$')).toMatch(/^A &amp; <span class="katex"><math/);
    expect(renderEditorMathToMathml('<span data-type="inline-math" data-latex="x"></span>')).toContain('<math');
  });
});
