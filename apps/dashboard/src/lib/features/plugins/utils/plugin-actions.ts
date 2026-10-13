export type PluginActionContext = Record<string, string | number | boolean | null | undefined>;

export function resolvePluginActionUrl(
  template: string,
  context: PluginActionContext,
  allowedDomains: string[]
): string | null {
  const interpolatedUrl = template.replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, (_match, key: string) => {
    const value = context[key];
    return value === null || value === undefined ? '' : encodeURIComponent(String(value));
  });

  try {
    const parsedUrl = new URL(interpolatedUrl);
    const allowedOrigins = allowedDomains.map((domain) => new URL(domain).origin);

    return parsedUrl.protocol === 'https:' && allowedOrigins.includes(parsedUrl.origin) ? parsedUrl.toString() : null;
  } catch {
    return null;
  }
}
