import {
  escapeHtmlText,
  isDisplayMathml,
  isDisplayOmml,
  joinMathText,
  mathmlToLatex,
  ommlToLatex,
  splitMathText,
  type MathTextSegment
} from '@cio/utils/math';

const WORD_EQUATION = /^\[if gte msEquation 12\]>([\s\S]*?)<!\[endif\]\s*$/;
const WORD_EQUATION_FALLBACK_START = '[if !msEquation]';
const WORD_CONDITIONAL_END = '[endif]';
const RENDERED_MATH = '.katex-display, .katex, mjx-container, .mwe-math-element';
const DISPLAY_RENDERED_MATH = '.katex-display, mjx-container[display="true"]';
const EDITOR_MATH = '[data-type="inline-math"], [data-type="block-math"]';
const SKIPPED_TEXT_PARENTS = `code, pre, script, style, math, ${EDITOR_MATH}`;
const DELIMITED_MATH_HINT = /\$|\\\(|\\\[/;
const BLOCK_ELEMENTS = new Set(['P', 'DIV', 'LI', 'BR', 'TR', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE']);

function createMathElement(doc: Document, latex: string, display: boolean): HTMLElement {
  const element = doc.createElement(display ? 'div' : 'span');
  element.setAttribute('data-type', display ? 'block-math' : 'inline-math');
  element.setAttribute('data-latex', latex);

  return element;
}

function listComments(doc: Document): Comment[] {
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_COMMENT);
  const comments: Comment[] = [];

  while (walker.nextNode()) comments.push(walker.currentNode as Comment);

  return comments;
}

function removeWordEquationFallback(start: Comment) {
  let node: ChildNode | null = start;

  while (node) {
    const next: ChildNode | null = node.nextSibling;
    const isEnd = node !== start && node instanceof Comment && node.data === WORD_CONDITIONAL_END;
    node.remove();
    if (isEnd) return;

    node = next;
  }
}

function convertWordEquations(doc: Document): number {
  let converted = 0;
  let previousEquationConverted = false;

  for (const comment of listComments(doc)) {
    if (comment.data === WORD_EQUATION_FALLBACK_START) {
      if (previousEquationConverted) removeWordEquationFallback(comment);
      continue;
    }

    const omml = WORD_EQUATION.exec(comment.data)?.[1];
    if (omml === undefined) continue;

    const latex = ommlToLatex(omml);
    previousEquationConverted = latex.length > 0;
    if (!previousEquationConverted) continue;

    comment.replaceWith(createMathElement(doc, latex, isDisplayOmml(omml)));
    converted += 1;
  }

  return converted;
}

function convertMathElement(doc: Document, container: Element, mathElement: Element, display: boolean): boolean {
  const latex = mathmlToLatex(mathElement.outerHTML);
  if (!latex) return false;

  container.replaceWith(createMathElement(doc, latex, display));

  return true;
}

function convertMathml(doc: Document): number {
  let converted = 0;

  for (const container of Array.from(doc.body.querySelectorAll(RENDERED_MATH))) {
    const mathElement = container.querySelector('math');
    if (!container.isConnected || !mathElement) continue;

    const display = container.matches(DISPLAY_RENDERED_MATH) || isDisplayMathml(mathElement.outerHTML);
    if (convertMathElement(doc, container, mathElement, display)) converted += 1;
  }

  for (const mathElement of Array.from(doc.body.querySelectorAll('math'))) {
    if (convertMathElement(doc, mathElement, mathElement, isDisplayMathml(mathElement.outerHTML))) converted += 1;
  }

  return converted;
}

function segmentsToNodes(doc: Document, segments: MathTextSegment[]): Node[] {
  return segments.map((segment) =>
    segment.type === 'math' ? createMathElement(doc, segment.latex, segment.display) : doc.createTextNode(segment.text)
  );
}

function convertDelimitedMath(doc: Document): number {
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let converted = 0;

  while (walker.nextNode()) textNodes.push(walker.currentNode as Text);

  for (const textNode of textNodes) {
    if (!DELIMITED_MATH_HINT.test(textNode.data) || textNode.parentElement?.closest(SKIPPED_TEXT_PARENTS)) continue;

    const segments = splitMathText(textNode.data, { brackets: true });
    const mathCount = segments.filter((segment) => segment.type === 'math').length;
    if (mathCount === 0) continue;

    textNode.replaceWith(...segmentsToNodes(doc, segments));
    converted += mathCount;
  }

  return converted;
}

function plainTextToHtml(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => `<p>${escapeHtmlText(line)}</p>`)
    .join('');
}

function parseClipboardMath(clipboard: DataTransfer): Document | null {
  const html = clipboard.getData('text/html');
  const text = clipboard.getData('text/plain');
  if (html.includes('data-pm-slice')) return null;
  if (!html && !DELIMITED_MATH_HINT.test(text)) return null;

  const doc = new DOMParser().parseFromString(html || plainTextToHtml(text), 'text/html');
  const converted = convertWordEquations(doc) + convertMathml(doc) + convertDelimitedMath(doc);

  return converted > 0 ? doc : null;
}

/**
 * Returns rich-text editor HTML for clipboard content that holds math: LaTeX in `$…$`, `$$…$$`, `\(…\)` or
 * `\[…\]`, MathML (including KaTeX and MathJax output) or Word equations. Returns null when there is no math,
 * or when the content was copied from a ProseMirror editor, which pastes its own math nodes.
 */
export function clipboardMathToHtml(clipboard: DataTransfer): string | null {
  return parseClipboardMath(clipboard)?.body.innerHTML ?? null;
}

function collectSegments(node: Node, segments: MathTextSegment[]) {
  if (node instanceof Text) {
    segments.push({ type: 'text', text: node.data });
    return;
  }

  if (!(node instanceof Element)) return;

  if (node.matches(EDITOR_MATH)) {
    const latex = node.getAttribute('data-latex') ?? '';
    segments.push({ type: 'math', latex, display: false });
    return;
  }

  if (BLOCK_ELEMENTS.has(node.tagName)) segments.push({ type: 'text', text: ' ' });
  node.childNodes.forEach((child) => collectSegments(child, segments));
}

/** Like `clipboardMathToHtml`, but returns a one-line `$…$` string for the single-line math editor. */
export function clipboardMathToMathText(clipboard: DataTransfer): string | null {
  const doc = parseClipboardMath(clipboard);
  if (!doc) return null;

  const segments: MathTextSegment[] = [];
  collectSegments(doc.body, segments);

  return joinMathText(segments).replace(/\s+/g, ' ').trim();
}
