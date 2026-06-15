export const EMBED_PUBLIC_HOST = 'embed.classroomio.com';

export const EMBED_PUBLIC_BASE_URL = `https://${EMBED_PUBLIC_HOST}`;

/** Widget names exposed at `https://embed.classroomio.com/{name}`. */
export type EmbedWidgetName = 'course-widget' | 'question-type-picker';

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
