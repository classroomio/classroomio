/** Normalize a comma-separated CSP domain/env list into valid CSP source values. */
export function parseCspDomains(value: string | undefined): string[] {
  if (!value) return [];

  return value
    .split(',')
    .map((domain) => domain.trim())
    .filter(Boolean)
    .map((domain) => {
      if (
        domain === 'data:' ||
        domain === 'blob:' ||
        domain === "'self'" ||
        domain === 'self' ||
        domain.startsWith('http://') ||
        domain.startsWith('https://')
      ) {
        return domain === 'self' ? "'self'" : domain;
      }

      return `https://${domain}`;
    });
}

function buildCspExtensions(): Record<string, string[]> {
  const allDomains = parseCspDomains(process.env.ALLOWED_EXTERNAL_DOMAINS);

  const or = (envVar: string) => (allDomains.length ? allDomains : parseCspDomains(process.env[envVar]));

  const scriptSrc = or('CSP_SCRIPT_SRC_DOMAINS');
  const styleSrc = or('CSP_STYLE_SRC_DOMAINS');
  const connectSrcBase = or('CSP_CONNECT_SRC_DOMAINS');
  const frameSrc = or('CSP_FRAME_SRC_DOMAINS');
  const fontSrc = or('CSP_FONT_SRC_DOMAINS');
  const mediaSrc = or('CSP_MEDIA_SRC_DOMAINS');
  const frameAncestorsExtra = or('CSP_FRAME_ANCESTORS_DOMAINS');

  const serverUrl = process.env.PUBLIC_SERVER_URL;
  const connectSrc = serverUrl ? [...connectSrcBase, serverUrl] : connectSrcBase;

  const extensions: Record<string, string[]> = {};
  if (scriptSrc.length) extensions['script-src'] = scriptSrc;
  if (styleSrc.length) {
    extensions['style-src'] = styleSrc;
    extensions['style-src-elem'] = styleSrc;
  }
  if (connectSrc.length) extensions['connect-src'] = connectSrc;
  if (frameSrc.length) extensions['frame-src'] = frameSrc;
  if (fontSrc.length) extensions['font-src'] = fontSrc;
  if (mediaSrc.length) {
    extensions['img-src'] = mediaSrc;
    extensions['media-src'] = mediaSrc;
  }
  if (frameAncestorsExtra.length) {
    extensions['frame-ancestors'] = frameAncestorsExtra;
  }

  return extensions;
}

let cachedExtensions: Record<string, string[]> | null = null;

function getExtensions(): Record<string, string[]> {
  if (!cachedExtensions) cachedExtensions = buildCspExtensions();
  return cachedExtensions;
}

function extendHeader(header: string, extensions: Record<string, string[]>): string {
  return header
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)
    .map((directive) => {
      const spaceIdx = directive.indexOf(' ');
      const name = spaceIdx === -1 ? directive : directive.substring(0, spaceIdx);
      const extra = extensions[name];
      return extra?.length ? `${directive} ${extra.join(' ')}` : directive;
    })
    .join('; ');
}

export function applyCspExtensions(response: Response): Response {
  const extensions = getExtensions();
  if (Object.keys(extensions).length === 0) return response;

  for (const name of ['content-security-policy', 'content-security-policy-report-only']) {
    const header = response.headers.get(name);
    if (header) {
      response.headers.set(name, extendHeader(header, extensions));
    }
  }

  return response;
}
