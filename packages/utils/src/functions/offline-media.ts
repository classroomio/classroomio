type OfflineMediaSource = {
  assetId?: string | null;
  key?: string | null;
  link: string;
};

/**
 * Stable identity for a lesson video or document across fetches. Presigned links change on every request, so the asset
 * id or storage key wins over the link. The offline manifest and the app both key downloaded files by this value.
 */
export function offlineMediaKey(source: OfflineMediaSource): string {
  if (source.assetId) return `asset:${source.assetId}`;
  if (source.key) return `key:${source.key}`;

  return `url:${source.link}`;
}

export function offlineImageKey(url: string): string {
  return `image:${url}`;
}

const IMAGE_SRC = /<img\b[^>]*?\bsrc\s*=\s*(["'])(.*?)\1/gi;

function decodeAttribute(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/** Absolute `http(s)` image URLs referenced by `<img src>` in lesson HTML, deduplicated, in document order. */
export function lessonHtmlImageUrls(html: string | null | undefined): string[] {
  if (!html) return [];

  const urls = new Set<string>();
  for (const match of html.matchAll(IMAGE_SRC)) {
    const src = decodeAttribute(match[2]?.trim() ?? '');
    if (/^https?:\/\//i.test(src)) urls.add(src);
  }

  return [...urls];
}

/** Replaces `<img src>` values found in `localUrls` (keyed by the original URL), leaving every other image untouched. */
export function replaceLessonHtmlImages(html: string, localUrls: ReadonlyMap<string, string>): string {
  if (localUrls.size === 0) return html;

  return html.replace(IMAGE_SRC, (match, quote: string, src: string) => {
    const local = localUrls.get(decodeAttribute(src.trim()));
    if (!local) return match;

    return match.replace(`${quote}${src}${quote}`, `${quote}${local}${quote}`);
  });
}
