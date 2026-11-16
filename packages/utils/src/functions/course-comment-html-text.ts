import { Parser } from 'htmlparser2';

import { ANCHOR_TEXT_BLOCK_BREAK, normalizeAnchorText, type TAnchorTextPiece } from './course-comment-anchor-text';

/** Elements that end a line of anchor text. Mirrors the block nodes of the lesson editor. */
export const ANCHOR_TEXT_BLOCK_ELEMENTS = new Set([
  'address',
  'article',
  'aside',
  'blockquote',
  'br',
  'dd',
  'details',
  'div',
  'dl',
  'dt',
  'figcaption',
  'figure',
  'footer',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hr',
  'li',
  'ol',
  'p',
  'pre',
  'section',
  'summary',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'ul'
]);

const SKIPPED_ELEMENTS = new Set(['script', 'style', 'template']);

/**
 * Text that comment quotes are matched against, from a note block's stored HTML.
 */
export function htmlToAnchorText(html: string): string {
  const pieces: TAnchorTextPiece[] = [];
  let skippedDepth = 0;

  const parser = new Parser(
    {
      onopentag(name) {
        if (SKIPPED_ELEMENTS.has(name)) skippedDepth += 1;
        if (ANCHOR_TEXT_BLOCK_ELEMENTS.has(name)) pieces.push({ text: ANCHOR_TEXT_BLOCK_BREAK, position: null });
      },
      ontext(text) {
        if (skippedDepth === 0) pieces.push({ text, position: null });
      },
      onclosetag(name) {
        if (SKIPPED_ELEMENTS.has(name)) skippedDepth = Math.max(0, skippedDepth - 1);
        if (ANCHOR_TEXT_BLOCK_ELEMENTS.has(name)) pieces.push({ text: ANCHOR_TEXT_BLOCK_BREAK, position: null });
      }
    },
    { decodeEntities: true, lowerCaseTags: true }
  );

  parser.write(html);
  parser.end();

  return normalizeAnchorText(pieces).text;
}
