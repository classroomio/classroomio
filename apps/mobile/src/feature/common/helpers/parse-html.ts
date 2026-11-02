export type HtmlText = { type: 'text'; text: string };

export type HtmlElement = { type: 'element'; tag: string; attrs: Record<string, string>; children: HtmlNode[] };

export type HtmlNode = HtmlText | HtmlElement;

const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr'
]);

const SKIPPED_TAGS = new Set(['script', 'style', 'template', 'noscript', 'svg', 'math', 'head', 'title', 'object']);

const CLOSES_PARAGRAPH = new Set([
  'p',
  'div',
  'ul',
  'ol',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'pre',
  'table',
  'hr',
  'figure',
  'section'
]);

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  bull: '•',
  middot: '·',
  copy: '©',
  reg: '®',
  trade: '™',
  times: '×',
  divide: '÷',
  deg: '°',
  euro: '€',
  pound: '£',
  laquo: '«',
  raquo: '»',
  rarr: '→',
  larr: '←'
};

const TAG_PATTERN =
  /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<![^>]*>|<\/\s*([a-zA-Z][\w-]*)\s*>|<([a-zA-Z][\w-]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*(\/?)>/g;

const ATTRIBUTE_PATTERN = /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

export function decodeEntities(text: string) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (entity, body: string) => {
    if (body[0] === '#') {
      const codePoint = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      if (!Number.isFinite(codePoint) || codePoint <= 0 || codePoint > 0x10ffff) return entity;

      return String.fromCodePoint(codePoint);
    }

    return NAMED_ENTITIES[body.toLowerCase()] ?? entity;
  });
}

function parseAttributes(source: string) {
  const attrs: Record<string, string> = {};
  for (const match of source.matchAll(ATTRIBUTE_PATTERN)) {
    const name = match[1]?.toLowerCase();
    if (!name) continue;

    attrs[name] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? '');
  }

  return attrs;
}

/** Parses an HTML fragment into a tolerant node tree. Unknown and malformed markup degrades to text. */
export function parseHtml(html: string): HtmlNode[] {
  const root: HtmlElement = { type: 'element', tag: '#root', attrs: {}, children: [] };
  const stack: HtmlElement[] = [root];
  let skipping: string | null = null;
  let cursor = 0;

  const current = () => stack[stack.length - 1] ?? root;

  const appendText = (raw: string) => {
    if (!raw || skipping) return;

    current().children.push({ type: 'text', text: decodeEntities(raw) });
  };

  const closeTag = (tag: string) => {
    for (let index = stack.length - 1; index > 0; index--) {
      if (stack[index]?.tag === tag) {
        stack.length = index;
        return;
      }
    }
  };

  for (const match of html.matchAll(TAG_PATTERN)) {
    const index = match.index ?? 0;
    appendText(html.slice(cursor, index));
    cursor = index + match[0].length;

    const closingTag = match[1]?.toLowerCase();
    const openingTag = match[2]?.toLowerCase();

    if (closingTag) {
      if (skipping) {
        if (closingTag === skipping) skipping = null;
        continue;
      }

      closeTag(closingTag);
      continue;
    }

    if (!openingTag || skipping) continue;

    if (SKIPPED_TAGS.has(openingTag)) {
      if (!match[4]) skipping = openingTag;
      continue;
    }

    if (current().tag === 'p' && CLOSES_PARAGRAPH.has(openingTag)) stack.pop();
    if (openingTag === 'li') {
      for (let index = stack.length - 1; index > 0; index--) {
        const tag = stack[index]?.tag;
        if (tag === 'ul' || tag === 'ol') break;
        if (tag === 'li') {
          stack.length = index;
          break;
        }
      }
    }

    const element: HtmlElement = {
      type: 'element',
      tag: openingTag,
      attrs: parseAttributes(match[3] ?? ''),
      children: []
    };
    current().children.push(element);

    if (!VOID_TAGS.has(openingTag) && !match[4]) stack.push(element);
  }

  appendText(html.slice(cursor));

  return root.children;
}

/** Concatenated text of a subtree, with `<br>` as a line break. */
export function textContent(nodes: HtmlNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === 'text') return node.text;
      if (node.tag === 'br') return '\n';

      return textContent(node.children);
    })
    .join('');
}
