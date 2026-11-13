export type MathTextSegment = { type: 'text'; text: string } | { type: 'math'; latex: string; display: boolean };

export interface MathToken {
  raw: string;
  latex: string;
  display: boolean;
}

export interface ReadMathTokenOptions {
  /** Also accept `\(…\)` and `\[…\]` delimiters. */
  brackets?: boolean;
}

export type RenderLatex = (latex: string, display: boolean) => string;

const EDITOR_MATH_ELEMENT = /^<(span|div)\b([^>]*\bdata-type="(inline-math|block-math)"[^>]*)>[\s\S]*?<\/\1>/;
const EDITOR_MATH_ELEMENTS = new RegExp(EDITOR_MATH_ELEMENT.source.slice(1), 'g');
const DATA_LATEX_ATTRIBUTE = /\bdata-latex="([^"]*)"/;
const WHITESPACE = /\s/;
const DIGIT = /\d/;

const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#x27;': "'"
};

function decodeHtmlAttribute(value: string): string {
  return value.replace(/&(amp|lt|gt|quot|#39|#x27);/g, (entity) => HTML_ENTITIES[entity] ?? entity);
}

export function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function readEnclosedMath(source: string, open: string, close: string, display: boolean): MathToken | null {
  if (!source.startsWith(open)) return null;

  const closeIndex = source.indexOf(close, open.length);
  if (closeIndex < 0) return null;

  const latex = source.slice(open.length, closeIndex).trim();
  if (!latex) return null;

  return { raw: source.slice(0, closeIndex + close.length), latex, display };
}

function readInlineDollarMath(source: string): MathToken | null {
  const firstChar = source[1];
  if (source[0] !== '$' || !firstChar || firstChar === '$' || WHITESPACE.test(firstChar)) return null;

  for (let index = 1; index < source.length; index += 1) {
    const char = source[index];

    if (char === '\\') {
      index += 1;
      continue;
    }

    if (char === '\n' && source[index + 1] === '\n') return null;
    if (char !== '$') continue;

    const charBefore = source[index - 1];
    const charAfter = source[index + 1];
    if (WHITESPACE.test(charBefore) || (charAfter !== undefined && DIGIT.test(charAfter))) return null;

    return { raw: source.slice(0, index + 1), latex: source.slice(1, index), display: false };
  }

  return null;
}

/**
 * Reads a math token at the start of `source`: `$$…$$`, `$…$` (Pandoc rules, so `$5 and $10` stays text),
 * and with `brackets` also `\[…\]` and `\(…\)`. Returns null when `source` does not start with math.
 */
export function readMathToken(source: string, options: ReadMathTokenOptions = {}): MathToken | null {
  if (source[0] === '$') {
    return readEnclosedMath(source, '$$', '$$', true) ?? readInlineDollarMath(source);
  }

  if (!options.brackets || source[0] !== '\\') return null;

  return readEnclosedMath(source, '\\[', '\\]', true) ?? readEnclosedMath(source, '\\(', '\\)', false);
}

function readEditorMathElement(source: string): MathToken | null {
  const match = EDITOR_MATH_ELEMENT.exec(source);
  if (!match) return null;

  const latex = decodeHtmlAttribute(DATA_LATEX_ATTRIBUTE.exec(match[2])?.[1] ?? '').trim();
  if (!latex) return null;

  return { raw: match[0], latex, display: match[3] === 'block-math' };
}

/**
 * Splits a plain string into text and math segments. Math is `$…$`, `$$…$$` or a rich-text editor
 * `data-latex` element; `\$` is a literal dollar sign.
 */
export function splitMathText(text: string): MathTextSegment[] {
  const segments: MathTextSegment[] = [];
  let pendingText = '';
  let index = 0;

  while (index < text.length) {
    const char = text[index];

    if (char === '\\' && text[index + 1] === '$') {
      pendingText += '$';
      index += 2;
      continue;
    }

    const token =
      char === '$' || char === '<'
        ? (readMathToken(text.slice(index)) ?? readEditorMathElement(text.slice(index)))
        : null;

    if (!token) {
      pendingText += char;
      index += 1;
      continue;
    }

    if (pendingText) segments.push({ type: 'text', text: pendingText });
    pendingText = '';
    segments.push({ type: 'math', latex: token.latex, display: token.display });
    index += token.raw.length;
  }

  if (pendingText) segments.push({ type: 'text', text: pendingText });

  return segments;
}

function wrapLatex(segment: Extract<MathTextSegment, { type: 'math' }>): string {
  const latex = segment.latex.trim();

  return segment.display ? `$$${latex}$$` : `$${latex}$`;
}

function joinSegments(segments: MathTextSegment[], escapeDollars: boolean): string {
  return segments
    .map((segment) => {
      if (segment.type === 'math') return wrapLatex(segment);

      return escapeDollars ? segment.text.replace(/\$/g, '\\$') : segment.text;
    })
    .join('');
}

function listLatex(segments: MathTextSegment[]): string {
  return JSON.stringify(segments.flatMap((segment) => (segment.type === 'math' ? [segment.latex.trim()] : [])));
}

/**
 * Inverse of `splitMathText`: returns a string that splits back into the same math. Dollar signs in text are
 * escaped only when they would otherwise read as math, so `Costs $5` stays unchanged.
 */
export function joinMathText(segments: MathTextSegment[]): string {
  const joined = joinSegments(segments, false);
  if (listLatex(splitMathText(joined)) === listLatex(segments)) return joined;

  return joinSegments(segments, true);
}

export function hasMathText(text: string): boolean {
  return splitMathText(text).some((segment) => segment.type === 'math');
}

/** Returns `text` with math delimiters removed, for surfaces that can only show plain text such as chart axes. */
export function mathTextToPlainText(text: string): string {
  return splitMathText(text)
    .map((segment) => (segment.type === 'math' ? segment.latex : segment.text))
    .join('');
}

/** Returns HTML for `text` with text segments escaped and math segments passed through `renderLatex`. */
export function renderMathText(text: string, renderLatex: RenderLatex): string {
  return splitMathText(text)
    .map((segment) =>
      segment.type === 'math' ? renderLatex(segment.latex, segment.display) : escapeHtmlText(segment.text)
    )
    .join('');
}

/**
 * Fills every rich-text editor math element (`data-type="inline-math"` / `"block-math"`) in trusted HTML with
 * the output of `renderLatex` and marks it `data-math-rendered`. Elements already marked are left alone.
 */
export function renderEditorMath(html: string, renderLatex: RenderLatex): string {
  if (!html.includes('data-latex')) return html;

  return html.replace(EDITOR_MATH_ELEMENTS, (element, tag: string, attributes: string, mathType: string) => {
    if (attributes.includes('data-math-rendered')) return element;

    const latex = decodeHtmlAttribute(DATA_LATEX_ATTRIBUTE.exec(attributes)?.[1] ?? '').trim();
    if (!latex) return element;

    const rendered = renderLatex(latex, mathType === 'block-math');

    return `<${tag}${attributes} data-math-rendered="true">${rendered}</${tag}>`;
  });
}
