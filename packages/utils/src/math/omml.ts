interface OmmlElement {
  name: string;
  attributes: Record<string, string>;
  children: OmmlNode[];
}

type OmmlNode = OmmlElement | string;

const TAG_OR_TEXT =
  /<!--[\s\S]*?-->|<!\[[\s\S]*?\]>|<(\/?)([A-Za-z][\w:.-]*)((?:\s+[^\s=>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>|[^<]+|</g;
const ATTRIBUTE = /([^\s=>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
const VOID_HTML_ELEMENTS = new Set(['br', 'img', 'hr', 'meta', 'link', 'input', 'wbr']);

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' '
};

const SYMBOLS: Record<string, string> = {
  '−': '-',
  '×': '\\times ',
  '·': '\\cdot ',
  '⋅': '\\cdot ',
  '÷': '\\div ',
  '±': '\\pm ',
  '∓': '\\mp ',
  '≤': '\\le ',
  '≥': '\\ge ',
  '≠': '\\ne ',
  '≈': '\\approx ',
  '≡': '\\equiv ',
  '∝': '\\propto ',
  '∞': '\\infty ',
  '→': '\\to ',
  '←': '\\leftarrow ',
  '⇒': '\\Rightarrow ',
  '⇔': '\\Leftrightarrow ',
  '∈': '\\in ',
  '∉': '\\notin ',
  '⊂': '\\subset ',
  '⊆': '\\subseteq ',
  '∪': '\\cup ',
  '∩': '\\cap ',
  '∅': '\\emptyset ',
  '∀': '\\forall ',
  '∃': '\\exists ',
  '∂': '\\partial ',
  '∇': '\\nabla ',
  '…': '\\ldots ',
  '⋯': '\\cdots ',
  '°': '^{\\circ}',
  '′': "'",
  ℝ: '\\mathbb{R}',
  ℕ: '\\mathbb{N}',
  ℤ: '\\mathbb{Z}',
  ℚ: '\\mathbb{Q}',
  ℂ: '\\mathbb{C}',
  '{': '\\{',
  '}': '\\}',
  '%': '\\%',
  '#': '\\#',
  α: '\\alpha ',
  β: '\\beta ',
  γ: '\\gamma ',
  δ: '\\delta ',
  ε: '\\varepsilon ',
  ϵ: '\\epsilon ',
  ζ: '\\zeta ',
  η: '\\eta ',
  θ: '\\theta ',
  ϑ: '\\vartheta ',
  ι: '\\iota ',
  κ: '\\kappa ',
  λ: '\\lambda ',
  μ: '\\mu ',
  ν: '\\nu ',
  ξ: '\\xi ',
  π: '\\pi ',
  ρ: '\\rho ',
  σ: '\\sigma ',
  τ: '\\tau ',
  υ: '\\upsilon ',
  φ: '\\varphi ',
  ϕ: '\\phi ',
  χ: '\\chi ',
  ψ: '\\psi ',
  ω: '\\omega ',
  Γ: '\\Gamma ',
  Δ: '\\Delta ',
  Θ: '\\Theta ',
  Λ: '\\Lambda ',
  Ξ: '\\Xi ',
  Π: '\\Pi ',
  Σ: '\\Sigma ',
  Φ: '\\Phi ',
  Ψ: '\\Psi ',
  Ω: '\\Omega '
};

const FUNCTION_NAMES = new Set([
  'sin',
  'cos',
  'tan',
  'sec',
  'csc',
  'cot',
  'sinh',
  'cosh',
  'tanh',
  'arcsin',
  'arccos',
  'arctan',
  'log',
  'ln',
  'exp',
  'lim',
  'max',
  'min',
  'sup',
  'inf',
  'det',
  'gcd'
]);

const LIMIT_OPERATORS = new Set(['\\lim', '\\max', '\\min', '\\sup', '\\inf']);

const NARY_OPERATORS: Record<string, string> = {
  '∑': '\\sum',
  '∏': '\\prod',
  '∐': '\\coprod',
  '∫': '\\int',
  '∬': '\\iint',
  '∭': '\\iiint',
  '∮': '\\oint',
  '⋃': '\\bigcup',
  '⋂': '\\bigcap'
};

const ACCENTS: Record<string, string> = {
  '\u0302': '\\hat',
  '\u0303': '\\tilde',
  '\u0304': '\\bar',
  '\u0305': '\\overline',
  '\u0307': '\\dot',
  '\u0308': '\\ddot',
  '\u0301': '\\acute',
  '\u0300': '\\grave',
  '\u0306': '\\breve',
  '\u030C': '\\check',
  '\u20D7': '\\vec',
  '\u20D1': '\\vec'
};

const DELIMITERS: Record<string, string> = {
  '': '.',
  '{': '\\{',
  '}': '\\}',
  '‖': '\\|',
  '⟨': '\\langle',
  '〈': '\\langle',
  '⟩': '\\rangle',
  '〉': '\\rangle',
  '⌊': '\\lfloor',
  '⌋': '\\rfloor',
  '⌈': '\\lceil',
  '⌉': '\\rceil'
};

/** Decodes XML and common HTML character references in markup text. */
export function decodeMarkupEntities(text: string): string {
  return text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, body: string) => {
    if (body[0] !== '#') return NAMED_ENTITIES[body.toLowerCase()] ?? entity;

    const isHex = body[1] === 'x' || body[1] === 'X';
    const codePoint = isHex ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);

    return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : entity;
  });
}

function readAttributes(source: string): Record<string, string> {
  const attributes: Record<string, string> = {};

  for (const match of source.matchAll(ATTRIBUTE)) {
    const value = match[2] ?? match[3] ?? match[4] ?? '';
    attributes[match[1].toLowerCase()] = decodeMarkupEntities(value);
  }

  return attributes;
}

function closeElement(stack: OmmlElement[], name: string) {
  for (let index = stack.length - 1; index > 0; index -= 1) {
    if (stack[index].name !== name) continue;

    stack.length = index;
    return;
  }
}

function parseMarkup(markup: string): OmmlElement {
  const root: OmmlElement = { name: '#root', attributes: {}, children: [] };
  const stack: OmmlElement[] = [root];

  for (const match of markup.matchAll(TAG_OR_TEXT)) {
    const [token, closing, rawName, rawAttributes, selfClosing] = match;
    const parent = stack[stack.length - 1];

    if (!rawName) {
      if (!token.startsWith('<!')) parent.children.push(decodeMarkupEntities(token));
      continue;
    }

    const name = rawName.toLowerCase();

    if (closing) {
      closeElement(stack, name);
      continue;
    }

    const element: OmmlElement = { name, attributes: readAttributes(rawAttributes ?? ''), children: [] };
    parent.children.push(element);

    if (!selfClosing && !VOID_HTML_ELEMENTS.has(name)) stack.push(element);
  }

  return root;
}

function localName(element: OmmlElement): string {
  const separatorIndex = element.name.indexOf(':');

  return separatorIndex < 0 ? element.name : element.name.slice(separatorIndex + 1);
}

function isMathElement(element: OmmlElement): boolean {
  return element.name.startsWith('m:');
}

function childElements(element: OmmlElement): OmmlElement[] {
  return element.children.filter((child): child is OmmlElement => typeof child !== 'string');
}

function findChildren(element: OmmlElement, name: string): OmmlElement[] {
  return childElements(element).flatMap((child) => {
    if (isMathElement(child)) return localName(child) === name ? [child] : [];

    return findChildren(child, name);
  });
}

function findChild(element: OmmlElement, name: string): OmmlElement | undefined {
  return findChildren(element, name)[0];
}

function propertyValue(element: OmmlElement, propertiesName: string, property: string): string | undefined {
  const properties = findChild(element, propertiesName);
  const propertyElement = properties ? findChild(properties, property) : undefined;
  if (!propertyElement) return undefined;

  return propertyElement.attributes['m:val'] ?? propertyElement.attributes['val'] ?? '';
}

function isOn(value: string | undefined): boolean {
  return value !== undefined && value !== '0' && value !== 'off' && value !== 'false';
}

function textContent(node: OmmlNode): string {
  if (typeof node === 'string') return node;
  if (localName(node).endsWith('pr')) return '';

  return node.children.map(textContent).join('');
}

function runToLatex(run: OmmlElement): string {
  const text = textContent(run).replace(/\s+/g, ' ');
  if (!text.trim()) return '';

  const runProperties = findChild(run, 'rpr');
  if (runProperties && findChild(runProperties, 'nor')) return `\\text{${text}}`;

  const trimmedText = text.trim();
  if (FUNCTION_NAMES.has(trimmedText)) return `\\${trimmedText} `;

  return Array.from(text, (char) => SYMBOLS[char] ?? char).join('');
}

function group(latex: string): string {
  return latex.length === 1 ? latex : `{${latex}}`;
}

function argument(element: OmmlElement, name: string): string {
  const child = findChild(element, name);

  return child ? convertChildren(child).trim() : '';
}

function delimiter(char: string): string {
  return DELIMITERS[char] ?? char;
}

function fractionToLatex(element: OmmlElement): string {
  const numerator = argument(element, 'num');
  const denominator = argument(element, 'den');
  const fractionType = propertyValue(element, 'fpr', 'type')?.toLowerCase();

  if (fractionType === 'lin' || fractionType === 'skw') return `${group(numerator)}/${group(denominator)}`;
  if (fractionType === 'nobar') return `\\genfrac{}{}{0pt}{}{${numerator}}{${denominator}}`;

  return `\\frac{${numerator}}{${denominator}}`;
}

function radicalToLatex(element: OmmlElement): string {
  const degree = argument(element, 'deg');
  const radicand = argument(element, 'e');
  const isDegreeHidden = isOn(propertyValue(element, 'radpr', 'deghide'));

  if (!degree || isDegreeHidden) return `\\sqrt{${radicand}}`;

  return `\\sqrt[${degree}]{${radicand}}`;
}

function delimiterToLatex(element: OmmlElement): string {
  const open = propertyValue(element, 'dpr', 'begchr') ?? '(';
  const close = propertyValue(element, 'dpr', 'endchr') ?? ')';
  const separator = propertyValue(element, 'dpr', 'sepchr') ?? '|';
  const items = findChildren(element, 'e').map((item) => convertChildren(item).trim());

  return `\\left${delimiter(open)}${items.join(delimiter(separator))}\\right${delimiter(close)}`;
}

function naryToLatex(element: OmmlElement): string {
  const operatorChar = propertyValue(element, 'narypr', 'chr') || '∫';
  const operator = NARY_OPERATORS[operatorChar] ?? operatorChar;
  const lower = isOn(propertyValue(element, 'narypr', 'subhide')) ? '' : argument(element, 'sub');
  const upper = isOn(propertyValue(element, 'narypr', 'suphide')) ? '' : argument(element, 'sup');
  const lowerLimit = lower ? `_{${lower}}` : '';
  const upperLimit = upper ? `^{${upper}}` : '';

  return `${operator}${lowerLimit}${upperLimit} ${argument(element, 'e')}`;
}

function lowerLimitToLatex(element: OmmlElement): string {
  const base = argument(element, 'e');
  const limit = argument(element, 'lim');

  if (LIMIT_OPERATORS.has(base)) return `${base}_{${limit}}`;

  return `\\underset{${limit}}{${base}}`;
}

function accentToLatex(element: OmmlElement): string {
  const accentChar = propertyValue(element, 'accpr', 'chr') || '\u0302';
  const command = ACCENTS[accentChar] ?? '\\hat';

  return `${command}{${argument(element, 'e')}}`;
}

function barToLatex(element: OmmlElement): string {
  const command = propertyValue(element, 'barpr', 'pos') === 'top' ? '\\overline' : '\\underline';

  return `${command}{${argument(element, 'e')}}`;
}

function groupCharacterToLatex(element: OmmlElement): string {
  const char = propertyValue(element, 'groupchrpr', 'chr') || '⏟';
  const position = propertyValue(element, 'groupchrpr', 'pos') ?? 'bot';
  const body = argument(element, 'e');

  if (char === '⏟') return `\\underbrace{${body}}`;
  if (char === '⏞') return `\\overbrace{${body}}`;

  const symbol = SYMBOLS[char]?.trim() ?? char;

  return position === 'top' ? `\\overset{${symbol}}{${body}}` : `\\underset{${symbol}}{${body}}`;
}

function matrixToLatex(element: OmmlElement): string {
  const rows = findChildren(element, 'mr').map((row) =>
    findChildren(row, 'e')
      .map((cell) => convertChildren(cell).trim())
      .join(' & ')
  );

  return `\\begin{matrix}${rows.join(' \\\\ ')}\\end{matrix}`;
}

function equationArrayToLatex(element: OmmlElement): string {
  const rows = findChildren(element, 'e').map((row) => convertChildren(row).trim());

  return `\\begin{aligned}${rows.join(' \\\\ ')}\\end{aligned}`;
}

function equationParagraphToLatex(element: OmmlElement): string {
  return findChildren(element, 'omath')
    .map((equation) => convertChildren(equation).trim())
    .join(' \\\\ ');
}

function convertElement(element: OmmlElement): string {
  const name = localName(element);
  if (name.endsWith('pr')) return '';

  switch (name) {
    case 'r':
      return runToLatex(element);
    case 'f':
      return fractionToLatex(element);
    case 'ssup':
      return `${group(argument(element, 'e'))}^{${argument(element, 'sup')}}`;
    case 'ssub':
      return `${group(argument(element, 'e'))}_{${argument(element, 'sub')}}`;
    case 'ssubsup':
      return `${group(argument(element, 'e'))}_{${argument(element, 'sub')}}^{${argument(element, 'sup')}}`;
    case 'spre':
      return `{}_{${argument(element, 'sub')}}^{${argument(element, 'sup')}}${group(argument(element, 'e'))}`;
    case 'rad':
      return radicalToLatex(element);
    case 'd':
      return delimiterToLatex(element);
    case 'nary':
      return naryToLatex(element);
    case 'func':
      return `${argument(element, 'fname')} ${argument(element, 'e')}`;
    case 'limlow':
      return lowerLimitToLatex(element);
    case 'limupp':
      return `\\overset{${argument(element, 'lim')}}{${argument(element, 'e')}}`;
    case 'acc':
      return accentToLatex(element);
    case 'bar':
      return barToLatex(element);
    case 'borderbox':
      return `\\boxed{${argument(element, 'e')}}`;
    case 'groupchr':
      return groupCharacterToLatex(element);
    case 'm':
      return matrixToLatex(element);
    case 'eqarr':
      return equationArrayToLatex(element);
    case 'omathpara':
      return equationParagraphToLatex(element);
    default:
      return convertChildren(element);
  }
}

function convertChildren(element: OmmlElement): string {
  return childElements(element).map(convertElement).join('');
}

function tidyLatex(latex: string): string {
  return latex
    .replace(/\s+/g, ' ')
    .replace(/\s+([}_^)\]])/g, '$1')
    .replace(/([{(])\s+/g, '$1')
    .trim();
}

/** Converts Office Math Markup (Word equations, `m:oMath` / `m:oMathPara`) to LaTeX. Returns '' when it holds no math. */
export function ommlToLatex(omml: string): string {
  return tidyLatex(convertChildren(parseMarkup(omml)));
}

/** True when the OMML is a display equation (`m:oMathPara`) rather than inline math. */
export function isDisplayOmml(omml: string): boolean {
  return /<m:oMathPara\b/i.test(omml);
}
