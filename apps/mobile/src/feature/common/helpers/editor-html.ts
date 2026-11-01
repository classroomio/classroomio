import { parseHtml, textContent, type HtmlNode } from './parse-html';

const PLAIN_TAGS = new Set(['p', 'br', 'img']);

function escapeText(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/ /g, '&nbsp;');
}

function escapeAttribute(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

/**
 * Converts composer text and uploaded image URLs into the HTML the web editor (TipTap) stores for the
 * same input: one `<p>` per line (Return starts a new paragraph there too), an empty `<p></p>` for a
 * blank line, and block images with the editor's default width and alignment.
 */
export function plainTextToEditorHtml(text: string, imageUrls: string[] = []) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  while (lines.length > 0 && lines[0]?.trim() === '') lines.shift();
  while (lines.length > 0 && lines[lines.length - 1]?.trim() === '') lines.pop();

  const paragraphs = lines.map((line) => (line.trim() === '' ? '<p></p>' : `<p>${escapeText(line)}</p>`));
  const images = imageUrls.map(
    (url) => `<img src="${escapeAttribute(url)}" style="width: 100%; max-width: 100%;" data-align="left">`
  );

  return [...paragraphs, ...images].join('');
}

export type EditorDraft = {
  text: string;
  imageUrls: string[];
  /** True when the HTML holds formatting a plain-text composer cannot keep, such as lists or bold text. */
  hasFormatting: boolean;
};

function collectImages(nodes: HtmlNode[], into: string[]) {
  for (const node of nodes) {
    if (node.type !== 'element') continue;
    if (node.tag === 'img' && node.attrs.src) into.push(node.attrs.src);
    collectImages(node.children, into);
  }
}

function hasRichMarkup(nodes: HtmlNode[]): boolean {
  return nodes.some((node) => node.type === 'element' && (!PLAIN_TAGS.has(node.tag) || hasRichMarkup(node.children)));
}

/** Splits stored editor HTML back into composer text and image URLs for editing. */
export function editorHtmlToDraft(html: string | null | undefined): EditorDraft {
  const nodes = parseHtml(html ?? '');
  const imageUrls: string[] = [];
  collectImages(nodes, imageUrls);

  const lines = nodes.flatMap((node) => {
    if (node.type === 'text') return node.text.trim() ? [node.text.trim()] : [];
    if (node.tag === 'img') return [];

    return [textContent(node.children).replace(/ /g, ' ')];
  });

  return { text: lines.join('\n').trim(), imageUrls, hasFormatting: hasRichMarkup(nodes) };
}
