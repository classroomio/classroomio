export const EMBED_PUBLIC_HOST = 'embed.classroomio.com';

export const EMBED_PUBLIC_BASE_URL = `https://${EMBED_PUBLIC_HOST}`;

export type EmbedWidgetRoute = {
  /** R2 object key for the ES module bootstrap. */
  scriptKey: string;
  /** R2 object key for the hosted iframe page, when supported. */
  pageKey?: string;
  /** Query param that selects the hosted page instead of the script. */
  pageQueryParam?: string;
};

/**
 * Public path segment → internal R2 keys under the `assets` bucket.
 * Customers only copy `https://embed.classroomio.com/{widgetName}`.
 */
export const EMBED_WIDGET_ROUTES = {
  'course-widget': {
    scriptKey: 'embeds/course-widget/course-widget.js',
    pageKey: 'embeds/course-widget/embed.html',
    pageQueryParam: 'key'
  },
  'question-type-picker': {
    scriptKey: 'embeds/question-type-picker/question-type-picker.js'
  }
} as const satisfies Record<string, EmbedWidgetRoute>;

export type EmbedWidgetName = keyof typeof EMBED_WIDGET_ROUTES;

export function getEmbedBaseUrl(override?: string): string {
  return (override ?? EMBED_PUBLIC_BASE_URL).replace(/\/$/, '');
}

export function getEmbedPublicUrl(
  widgetName: EmbedWidgetName,
  params?: Record<string, string | undefined>,
  baseUrlOverride?: string
): string {
  const baseUrl = getEmbedBaseUrl(baseUrlOverride);
  const path = `${baseUrl}/${widgetName}`;

  if (!params) {
    return path;
  }

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== '') {
      search.set(key, value);
    }
  }

  const query = search.toString();
  return query ? `${path}?${query}` : path;
}
