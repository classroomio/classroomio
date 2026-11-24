import * as cheerio from 'cheerio';
import type { AnyNode, Element } from 'domhandler';
import { marked, type Token, type Tokens } from 'marked';

import type { PageContent } from '../sources/types';
import { withoutChromeHtml, withoutChromeMarkdown } from './chrome';
import type { BlockDraft } from './types';

const SKIPPED = new Set([
  'script',
  'style',
  'noscript',
  'template',
  'svg',
  'nav',
  'header',
  'footer',
  'form',
  'button',
  'select',
  'input',
  'label'
]);

const BLOCK_TAGS = new Set([
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'ol',
  'ul',
  'menu',
  'li',
  'table',
  'pre',
  'img',
  'iframe',
  'video',
  'blockquote',
  'aside',
  'div',
  'section',
  'article',
  'main',
  'figure',
  'figcaption',
  'details',
  'summary',
  'dl',
  'dd',
  'dt',
  'hr',
  ...SKIPPED
]);

const BLOCK_SELECTOR = [...BLOCK_TAGS].join(',');

const CALLOUT = /(?:^|\s)(?:note|notes|warning|tip|callout|admonition|alert|important|caution|info)(?:\s|$)/i;

function normalize(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function blockText(kind: BlockDraft['kind'], value: string): string {
  if (kind === 'code' || kind === 'list') return value.replace(/[ \t]+$/gm, '').trim();

  return normalize(value);
}

function absoluteUrl(value: string | undefined, pageUrl: string): string | null {
  if (!value || value.startsWith('data:')) return null;

  try {
    return new URL(value, pageUrl).href;
  } catch {
    return null;
  }
}

function isElement(node: AnyNode): node is Element {
  return node.type === 'tag' || node.type === 'script' || node.type === 'style';
}

/** Text of an element with a space wherever a block or line break separates two runs of text. */
function spacedText(node: AnyNode): string {
  if (node.type === 'text') return (node as unknown as { data: string }).data;
  if (!isElement(node)) return '';

  const tag = node.tagName.toLowerCase();
  if (SKIPPED.has(tag)) return '';
  if (tag === 'br') return ' ';

  const inner = node.children.map(spacedText).join('');

  return BLOCK_TAGS.has(tag) ? ` ${inner} ` : inner;
}

function tableHtml($: cheerio.CheerioAPI, element: Element): string {
  const rows = $(element)
    .find('tr')
    .toArray()
    .map((row) => {
      const cells = $(row)
        .children('th, td')
        .toArray()
        .map((cell) => {
          const tag = cell.tagName.toLowerCase() === 'th' ? 'th' : 'td';
          const text = normalize(spacedText(cell)).replace(/&/g, '&amp;').replace(/</g, '&lt;');

          return `<${tag}>${text}</${tag}>`;
        });

      return cells.length ? `<tr>${cells.join('')}</tr>` : '';
    })
    .filter(Boolean);

  return rows.length ? `<table>${rows.join('')}</table>` : '';
}

/**
 * Converts the main content of one page, as the reader chose it, into ordered blocks: all of it, including the parts
 * beside an `article` or `main` nested inside it. Every block carries the heading path it sits under; a
 * heading carries the headings above it. Images inside steps, lists, tables and callouts become their own blocks right
 * after the block that holds them, and loose text between elements is kept as a paragraph.
 */
export function blocksFromHtml(html: string, pageUrl: string): BlockDraft[] {
  const $ = cheerio.load(html);
  const blocks: BlockDraft[] = [];
  const headings: string[] = [];

  const push = (draft: Omit<BlockDraft, 'headingPath'>) => {
    const text = blockText(draft.kind, draft.text);
    if (!text && !draft.imageUrl && draft.kind !== 'video') return;

    blocks.push({ ...draft, text, headingPath: [...headings] });
  };

  const pushImages = (element: Element) => {
    $(element)
      .find('img')
      .each((_, image) => {
        const imageUrl = absoluteUrl($(image).attr('src') ?? $(image).attr('data-src'), pageUrl);
        if (imageUrl) push({ kind: 'image', text: $(image).attr('alt') ?? '', imageUrl });
      });
  };

  const isInline = (node: Element) => {
    const tag = node.tagName.toLowerCase();

    return !BLOCK_TAGS.has(tag) && $(node).find(BLOCK_SELECTOR).length === 0;
  };

  const visitChildren = (element: Element) => {
    let run = '';
    const flush = () => {
      if (normalize(run)) push({ kind: 'paragraph', text: run });
      run = '';
    };

    for (const node of element.children) {
      if (node.type === 'text') {
        run += (node as unknown as { data: string }).data;
        continue;
      }
      if (!isElement(node)) continue;

      const tag = node.tagName.toLowerCase();
      if (tag === 'br') {
        run += ' ';
        continue;
      }
      if (isInline(node)) {
        run += spacedText(node);
        continue;
      }

      flush();
      visit(node);
    }

    flush();
  };

  const visit = (element: Element) => {
    const tag = element.tagName.toLowerCase();
    if (SKIPPED.has(tag)) return;

    const isCallout =
      tag === 'blockquote' || $(element).attr('role') === 'note' || CALLOUT.test($(element).attr('class') ?? '');

    if (/^h[1-6]$/.test(tag)) {
      const text = normalize(spacedText(element));
      if (!text) return;

      headings.splice(Number(tag.slice(1)) - 1);
      blocks.push({ kind: 'heading', text, headingPath: [...headings] });
      headings.push(text);
      return;
    }

    if (tag === 'p') {
      push({ kind: 'paragraph', text: spacedText(element) });
      pushImages(element);
      return;
    }

    if (tag === 'ol') {
      const start = Number($(element).attr('start') ?? 1) || 1;
      $(element)
        .children('li')
        .each((index, item) => {
          push({ kind: 'step', text: spacedText(item), stepNumber: start + index });
          pushImages(item);
        });
      return;
    }

    if (tag === 'ul' || tag === 'menu') {
      const items = $(element)
        .children('li')
        .toArray()
        .map((item) => normalize(spacedText(item)))
        .filter(Boolean);
      if (items.length) push({ kind: 'list', text: items.map((item) => `- ${item}`).join('\n') });
      pushImages(element);
      return;
    }

    if (tag === 'table') {
      const table = tableHtml($, element);
      if (table) push({ kind: 'table', text: table });
      pushImages(element);
      return;
    }

    if (tag === 'pre') {
      push({ kind: 'code', text: $(element).text() });
      return;
    }

    if (tag === 'img') {
      const imageUrl = absoluteUrl($(element).attr('src') ?? $(element).attr('data-src'), pageUrl);
      if (imageUrl) push({ kind: 'image', text: $(element).attr('alt') ?? '', imageUrl });
      return;
    }

    if (tag === 'iframe' || tag === 'video') {
      const source =
        $(element).attr('src') ?? $(element).find('source').first().attr('src') ?? $(element).attr('data-src') ?? '';
      const videoUrl = absoluteUrl(source, pageUrl);
      if (videoUrl) push({ kind: 'video', text: videoUrl });
      return;
    }

    if (isCallout) {
      push({ kind: 'callout', text: spacedText(element) });
      pushImages(element);
      return;
    }

    if (tag === 'aside') return;

    visitChildren(element);
  };

  const body = $('body').get(0) as Element | undefined;
  if (body) visitChildren(body);

  return blocks;
}

function imagesIn(tokens: Token[], pageUrl: string): Array<{ url: string; alt: string }> {
  const images: Array<{ url: string; alt: string }> = [];

  for (const token of tokens) {
    if (token.type === 'image') {
      const url = absoluteUrl((token as Tokens.Image).href, pageUrl);
      if (url) images.push({ url, alt: (token as Tokens.Image).text ?? '' });
      continue;
    }
    if (token.type === 'html') {
      for (const match of (token as Tokens.HTML).text.matchAll(/<img\b[^>]*>/gi)) {
        const tag = cheerio.load(match[0])('img');
        const url = absoluteUrl(tag.attr('src') ?? tag.attr('data-src'), pageUrl);
        if (url) images.push({ url, alt: tag.attr('alt') ?? '' });
      }
      continue;
    }
    if (token.type === 'list') {
      for (const item of (token as Tokens.List).items) images.push(...imagesIn(item.tokens ?? [], pageUrl));
      continue;
    }

    const nested = (token as { tokens?: Token[] }).tokens;
    if (nested?.length) images.push(...imagesIn(nested, pageUrl));
  }

  return images;
}

const MARKDOWN_BLOCK_TOKENS = new Set(['paragraph', 'text', 'heading', 'blockquote', 'list_item']);

function inlineText(tokens: Token[]): string {
  const parts: string[] = [];

  for (const token of tokens) {
    if (token.type === 'image' || token.type === 'html') continue;
    if (token.type === 'br') {
      parts.push(' ');
      continue;
    }
    if (token.type === 'list') {
      parts.push(` ${(token as Tokens.List).items.map(listItemText).join(' ')} `);
      continue;
    }

    const nested = (token as { tokens?: Token[] }).tokens;
    if (nested?.length) {
      const text = inlineText(nested);
      parts.push(MARKDOWN_BLOCK_TOKENS.has(token.type) ? ` ${text} ` : text);
      continue;
    }

    const text = (token as { text?: string }).text;
    if (typeof text === 'string') parts.push(text);
  }

  return normalize(parts.join(''));
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function listItemText(item: Tokens.ListItem): string {
  return inlineText(item.tokens ?? []) || normalize(item.text);
}

/**
 * Converts one page written in Markdown into the same blocks the HTML path produces. HTML embedded in the Markdown is
 * converted by the HTML path, and nested list items stay part of the step or list that holds them.
 */
export function blocksFromMarkdown(markdown: string, pageUrl: string): BlockDraft[] {
  const blocks: BlockDraft[] = [];
  const headings: string[] = [];

  const push = (draft: Omit<BlockDraft, 'headingPath'>) => {
    const text = blockText(draft.kind, draft.text);
    if (!text && !draft.imageUrl && draft.kind !== 'video') return;

    blocks.push({ ...draft, text, headingPath: [...headings] });
  };

  const pushImages = (tokens: Token[]) => {
    for (const image of imagesIn(tokens, pageUrl)) push({ kind: 'image', text: image.alt, imageUrl: image.url });
  };

  const visitToken = (token: Token) => {
    switch (token.type) {
      case 'heading': {
        const text = normalize(inlineText(token.tokens ?? []) || token.text);
        if (!text) return;

        headings.splice(token.depth - 1);
        blocks.push({ kind: 'heading', text, headingPath: [...headings] });
        headings.push(text);
        return;
      }
      case 'paragraph':
      case 'text': {
        const tokens = token.tokens ?? [];
        push({ kind: 'paragraph', text: tokens.length ? inlineText(tokens) : token.text });
        pushImages(tokens);
        return;
      }
      case 'list': {
        const list = token as Tokens.List;
        const items = list.items.map(listItemText);

        if (!list.ordered) {
          const lines = items.filter(Boolean);
          if (lines.length) push({ kind: 'list', text: lines.map((item) => `- ${item}`).join('\n') });
          pushImages([list]);
          return;
        }

        const start = Number(list.start ?? 1) || 1;
        list.items.forEach((item, index) => {
          push({ kind: 'step', text: items[index], stepNumber: start + index });
          pushImages(item.tokens ?? []);
        });
        return;
      }
      case 'table': {
        const table = token as Tokens.Table;
        const head = `<tr>${table.header.map((cell) => `<th>${escapeHtml(cell.text)}</th>`).join('')}</tr>`;
        const body = table.rows.map(
          (row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell.text)}</td>`).join('')}</tr>`
        );
        push({ kind: 'table', text: `<table>${[head, ...body].join('')}</table>` });
        pushImages([...table.header, ...table.rows.flat()].flatMap((cell) => cell.tokens ?? []));
        return;
      }
      case 'code':
        push({ kind: 'code', text: token.text });
        return;
      case 'blockquote':
        push({ kind: 'callout', text: inlineText(token.tokens ?? []) || token.text });
        pushImages(token.tokens ?? []);
        return;
      case 'html': {
        const parent = [...headings];
        for (const block of blocksFromHtml(`<body>${token.text}</body>`, pageUrl)) {
          blocks.push({ ...block, headingPath: [...parent, ...block.headingPath] });
        }
        return;
      }
      case 'space':
      case 'hr':
      case 'def':
        return;
      default:
        if ('text' in token && typeof token.text === 'string') push({ kind: 'paragraph', text: token.text });
    }
  };

  for (const token of marked.lexer(markdown)) visitToken(token);

  return blocks;
}

/**
 * Converts a read page into blocks whichever representation the reader settled on, without the widgets and the
 * trailing list of links to other pages that a site places around the page's own text.
 */
export function blocksFromContent(content: PageContent, pageUrl: string): BlockDraft[] {
  return content.format === 'markdown'
    ? blocksFromMarkdown(withoutChromeMarkdown(content.text, pageUrl), pageUrl)
    : blocksFromHtml(withoutChromeHtml(content.text, pageUrl), pageUrl);
}
