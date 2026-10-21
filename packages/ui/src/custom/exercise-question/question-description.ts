const EDITOR_HTML_PATTERN = /^<(p|h[1-6]|ul|ol|blockquote|pre|table|figure|div|img|hr|iframe|video)[\s>/]/i;
const MEDIA_TAG_PATTERN = /<(img|iframe|video)\b/i;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Returns the description as HTML. Editor output (which always opens with a block tag) is returned
 * unchanged; anything else is treated as plain text saved before the rich-text editor, escaped,
 * and split into one paragraph per line.
 */
export function toQuestionDescriptionHtml(description: string): string {
  const trimmedDescription = description.trim();
  if (!trimmedDescription || EDITOR_HTML_PATTERN.test(trimmedDescription)) return trimmedDescription;

  return trimmedDescription
    .split(/\n+/)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('');
}

export function hasQuestionDescriptionContent(description: string): boolean {
  if (MEDIA_TAG_PATTERN.test(description)) return true;

  const visibleText = description
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();

  return visibleText.length > 0;
}
