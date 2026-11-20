function qualityOf(mediaRange: string): number {
  const qualityParam = mediaRange
    .split(';')
    .slice(1)
    .map((param) => param.trim())
    .find((param) => param.startsWith('q='));
  const quality = qualityParam ? Number(qualityParam.slice(2)) : 1;

  return Number.isNaN(quality) ? 0 : quality;
}

/**
 * Whether an Accept header prefers Markdown: text/markdown is listed with a quality above zero
 * and at least as high as text/html.
 */
export function prefersMarkdown(acceptHeader: string | null): boolean {
  if (!acceptHeader) return false;

  let markdownQuality = 0;
  let htmlQuality = 0;

  for (const mediaRange of acceptHeader.split(',')) {
    const type = mediaRange.split(';')[0].trim().toLowerCase();
    if (type === 'text/markdown') markdownQuality = qualityOf(mediaRange);
    if (type === 'text/html') htmlQuality = qualityOf(mediaRange);
  }

  return markdownQuality > 0 && markdownQuality >= htmlQuality;
}
