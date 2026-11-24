import * as cheerio from 'cheerio';
import type { AnyNode, Element } from 'domhandler';
import { marked, type Token, type Tokens } from 'marked';

const CONTROLS = 'button, input, select, textarea';
const WIDGET_MAX_WORDS = 60;
const WIDGET_KEEPS = 'img, picture, video, iframe, table, pre, code';
const HEADINGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const MARKDOWN_LINK_ITEM = /^\s*\[([^\]]+)\]\(\s*<?([^)\s>]+)>?[^)]*\)\s*$/;

function countWords(text: string): number {
  return text.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

function sameSite(href: string | undefined, pageUrl: string): boolean {
  if (!href || href.startsWith('#')) return false;

  try {
    const url = new URL(href, pageUrl);

    return url.host === new URL(pageUrl).host && /^https?:$/.test(url.protocol);
  } catch {
    return false;
  }
}

/**
 * Removes interactive widgets: each form control together with the largest element around it that stays short
 * (at most 60 words) and holds no image, table or code. A copy button inside a code sample removes only the button.
 */
function removeWidgets($: cheerio.CheerioAPI): void {
  for (const control of $(CONTROLS).toArray()) {
    let widget: Element = control;
    for (const ancestor of $(control).parents().toArray()) {
      if (ancestor.tagName === 'body' || ancestor.tagName === 'html') break;
      if ($(ancestor).is(WIDGET_KEEPS) || $(ancestor).find(WIDGET_KEEPS).length) break;
      if (countWords($(ancestor).text()) > WIDGET_MAX_WORDS) break;

      widget = ancestor;
    }
    $(widget).remove();
  }
}

function followedByText($: cheerio.CheerioAPI, node: AnyNode): boolean {
  for (
    let current: AnyNode | null = node;
    current && (current as Element).tagName !== 'body';
    current = current.parent
  ) {
    for (let next = current.nextSibling; next; next = next.nextSibling) {
      if ($(next).text().trim()) return true;
    }
  }

  return false;
}

function isLinkList($: cheerio.CheerioAPI, list: Element, pageUrl: string): boolean {
  const items = $(list).children('li').toArray();

  return (
    items.length > 0 &&
    items.every((item) => {
      const links = $(item).find('a[href]');

      return (
        links.length === 1 &&
        sameSite(links.attr('href'), pageUrl) &&
        $(item).text().replace(/\s+/g, ' ').trim() === links.text().replace(/\s+/g, ' ').trim()
      );
    })
  );
}

/** Removes a list of links to other pages of the site that ends the content, with the heading that introduces it. */
function removeTrailingLinkList($: cheerio.CheerioAPI, pageUrl: string): void {
  const lists = $('ul, ol')
    .toArray()
    .filter((candidate) => !$(candidate).parents('ul, ol').length);
  const list = lists[lists.length - 1];
  if (!list || !isLinkList($, list, pageUrl) || followedByText($, list)) return;

  const heading = $(list).prevAll().first();
  if (heading.length && HEADINGS.has(heading.prop('tagName')?.toLowerCase() ?? '')) heading.remove();
  $(list).remove();
}

/** The HTML content without what the site places around a page's own text: widgets, and a trailing list of links. */
export function withoutChromeHtml(html: string, pageUrl: string): string {
  const $ = cheerio.load(html);
  removeWidgets($);
  removeTrailingLinkList($, pageUrl);

  return $('body').html() ?? '';
}

function isLinkListToken(token: Token, pageUrl: string): boolean {
  if (token.type !== 'list') return false;

  const items = (token as Tokens.List).items;

  return (
    items.length > 0 &&
    items.every((item) => {
      const match = MARKDOWN_LINK_ITEM.exec(item.text);

      return !!match && sameSite(match[2], pageUrl);
    })
  );
}

/** The Markdown content without a trailing list of links to other pages of the site, and the heading before it. */
export function withoutChromeMarkdown(markdown: string, pageUrl: string): string {
  const tokens = marked.lexer(markdown);
  const meaningful = tokens.filter((token) => token.type !== 'space');
  const last = meaningful[meaningful.length - 1];
  if (!last || !isLinkListToken(last, pageUrl)) return markdown;

  const before = meaningful[meaningful.length - 2];
  const dropped = new Set<Token>([last, ...(before?.type === 'heading' ? [before] : [])]);

  return tokens
    .filter((token) => !dropped.has(token))
    .map((token) => token.raw)
    .join('');
}
