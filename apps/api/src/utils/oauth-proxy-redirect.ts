/**
 * Better Auth's `oAuthProxy` plugin redirects the browser to
 * `{host}/api/auth/oauth-proxy-callback` on the host that initiated OAuth.
 *
 * BYOD custom domains reach the API through the dashboard's internal proxy
 * (`PRIVATE_SERVER_URL`, often `http://service:10000`). Node's URL setter keeps
 * the upstream port unless it is cleared explicitly — e.g. `url.host =
 * 'my.fastlearner.io'` on a `http://cio-api-vymh:10000/...` request still
 * yields `https://my.fastlearner.io:10000/...`.
 */

function readBackendPorts(): Set<number> {
  const ports = new Set<number>();
  const privateServerUrl = process.env.PRIVATE_SERVER_URL?.trim();

  if (!privateServerUrl) {
    return ports;
  }

  try {
    const parsed = new URL(privateServerUrl);
    if (parsed.port) {
      ports.add(Number(parsed.port));
    }
  } catch {
    // Ignore malformed env values.
  }

  return ports;
}

/** Strip a backend/API port when it appears on a browser-facing host header. */
export function stripBackendPortFromHost(host: string): string {
  const [hostname, portValue] = host.includes(':') ? host.split(':', 2) : [host, ''];
  if (!portValue || !hostname) return host;

  const port = Number(portValue);
  if (!Number.isFinite(port) || !readBackendPorts().has(port)) {
    return host;
  }

  return hostname;
}

/** Public origin where the browser should complete the oauth-proxy handoff. */
export function resolveOAuthBrowserOrigin(options: {
  forwardedHost?: string | null;
  forwardedProto?: string | null;
}): string | null {
  const dashboardOrigin = process.env.DASHBOARD_ORIGIN?.trim().replace(/\/$/, '');

  if (options.forwardedHost) {
    const proto =
      options.forwardedProto === 'http' || options.forwardedProto === 'https' ? options.forwardedProto : 'https';
    const host = stripBackendPortFromHost(options.forwardedHost);

    return `${proto}://${host}`;
  }

  if (dashboardOrigin) {
    return dashboardOrigin;
  }

  return null;
}

/**
 * Rebuild the auth request URL from proxy headers so Better Auth sees the
 * browser-facing host without the internal upstream port.
 */
export function rewriteAuthRequestUrl(
  request: Request,
  options: { forwardedHost?: string | null; forwardedProto?: string | null }
): Request {
  const { forwardedHost, forwardedProto } = options;
  if (!forwardedHost?.trim()) {
    return request;
  }

  const url = new URL(request.url);
  const publicHost = stripBackendPortFromHost(forwardedHost.trim());
  const [hostname, explicitPort = ''] = publicHost.includes(':') ? publicHost.split(':', 2) : [publicHost, ''];

  url.hostname = hostname!;
  url.port = explicitPort;

  if (forwardedProto === 'https' || forwardedProto === 'http') {
    url.protocol = `${forwardedProto}:`;
  }

  return new Request(url, request);
}

export function shouldRewriteOAuthProxyCallbackLocation(location: string, browserOrigin: string): boolean {
  if (!location.includes('/oauth-proxy-callback')) {
    return false;
  }

  try {
    const target = new URL(location);
    const origin = new URL(browserOrigin.endsWith('/') ? browserOrigin : `${browserOrigin}/`);

    return target.host !== origin.host || target.protocol !== origin.protocol;
  } catch {
    return false;
  }
}

export function rewriteOAuthProxyCallbackLocation(location: string, browserOrigin: string): string {
  const target = new URL(location);
  const origin = new URL(browserOrigin.endsWith('/') ? browserOrigin : `${browserOrigin}/`);

  target.protocol = origin.protocol;
  target.hostname = origin.hostname;
  target.port = origin.port;

  return target.toString();
}
