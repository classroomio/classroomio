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

export interface DevLocationInfo {
  hostname: string;
  protocol: string;
}

const LOCAL_DEV_EMBED_ORIGIN_REGEX = /https?:\/\/(localhost|127\.0\.0\.1):5180/g;

function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1';
}

function replaceDevEmbedOrigins(content: string, currentLocation?: DevLocationInfo): string {
  if (!content || !currentLocation) {
    return content;
  }

  const { hostname, protocol } = currentLocation;

  if (isLoopbackHost(hostname)) {
    if (protocol === 'https:') {
      return content.replace(/http:\/\/localhost:5180/g, 'https://localhost:5180');
    }
    return content;
  }

  const targetProtocol = protocol ? protocol.replace(/:$/, '') : 'http';
  return content.replace(LOCAL_DEV_EMBED_ORIGIN_REGEX, `${targetProtocol}://${hostname}:5180`);
}

/**
 * Adapts local development widget URLs (which default to http://localhost:5180)
 * to match the current browser location (e.g. mobile or LAN host IP and HTTPS protocol).
 */
export function adaptDevWidgetUrl(url: string, currentLocation?: DevLocationInfo): string {
  return replaceDevEmbedOrigins(url, currentLocation);
}

/**
 * Adapts local development widget embed HTML snippet to match the current browser location.
 */
export function adaptDevWidgetEmbedCode(embedCode: string, currentLocation?: DevLocationInfo): string {
  return replaceDevEmbedOrigins(embedCode, currentLocation);
}
