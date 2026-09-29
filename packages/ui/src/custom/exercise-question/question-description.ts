const HTML_TAG_PATTERN = /<[a-z][\s\S]*>/i;
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
 * Returns the description as HTML. Plain-text descriptions saved before the rich-text editor
 * become one paragraph per line; HTML is returned unchanged.
 */
export function toQuestionDescriptionHtml(description: string): string {
  const trimmedDescription = description.trim();
  if (!trimmedDescription || HTML_TAG_PATTERN.test(trimmedDescription)) return trimmedDescription;

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
