import dns from 'node:dns/promises';
import { isIP } from 'node:net';

import { isPrivateAddress, type PageRenderer } from '@cio/course-builder';
import { chromium, type Browser, type BrowserContext, type Response } from 'playwright-core';

export interface RendererPolicy {
  /** Whether the browser may send a request to this host. Default: every address it resolves to is public. */
  allowHost(hostname: string): Promise<boolean>;
  /** Whether a response may come from this address. Default: the address is public. */
  allowAddress(ipAddress: string, hostname: string): boolean;
}

export interface RendererOptions {
  /** The crawler's identity, `Name/version (+contact URL)`; robots.txt is matched on `Name`. */
  userAgent: string;
  /** A DevTools-protocol endpoint of a hosted browser. Without it, a local headless Chromium is launched. */
  cdpEndpoint?: string;
  /** Pages rendered at the same time. Each one is an isolated browser context. */
  maxConcurrentPages?: number;
  /** Restart the browser after this many renders, because Chromium's memory grows over time. */
  recycleAfter?: number;
  policy?: RendererPolicy;
}

export interface ManagedRenderer extends PageRenderer {
  /** Opens the browser now and keeps it for the renders that follow; false when no browser can be launched or reached. */
  available(): Promise<boolean>;
  close(): Promise<void>;
}

export class RenderBlockedError extends Error {
  constructor(
    readonly url: string,
    readonly address: string
  ) {
    super(`Rendering ${url} reached a private address`);
    this.name = 'RenderBlockedError';
  }
}

const BLOCKED_RESOURCE_TYPES = new Set(['image', 'media', 'font']);
const MAX_OBSERVED_JSON = 50;
const MAX_OBSERVED_JSON_BYTES = 2 * 1024 * 1024;
const NETWORK_IDLE_MS = 10_000;

async function resolvesToPublicAddresses(hostname: string): Promise<boolean> {
  const bare = hostname.replace(/^\[|\]$/g, '');
  if (isIP(bare)) return !isPrivateAddress(bare);

  try {
    const addresses = await dns.lookup(bare, { all: true });

    return addresses.length > 0 && addresses.every((entry) => !isPrivateAddress(entry.address));
  } catch {
    return false;
  }
}

export const PUBLIC_ONLY_POLICY: RendererPolicy = {
  allowHost: resolvesToPublicAddresses,
  allowAddress: (ipAddress) => !isPrivateAddress(ipAddress)
};

class Slots {
  private active = 0;
  private readonly waiting: Array<() => void> = [];

  constructor(private readonly size: number) {}

  async acquire(): Promise<void> {
    if (this.active < this.size) {
      this.active += 1;

      return;
    }

    await new Promise<void>((resolve) => this.waiting.push(resolve));
    this.active += 1;
  }

  release(): void {
    this.active -= 1;
    this.waiting.shift()?.();
  }

  get idle(): boolean {
    return this.active === 0;
  }
}

async function guardContext(
  context: BrowserContext,
  policy: RendererPolicy
): Promise<(hostname: string) => Promise<boolean>> {
  const allowedHosts = new Map<string, Promise<boolean>>();
  const isAllowed = (hostname: string) => {
    let decision = allowedHosts.get(hostname);
    if (!decision) {
      decision = policy.allowHost(hostname);
      allowedHosts.set(hostname, decision);
    }

    return decision;
  };

  await context.route('**/*', async (route) => {
    const request = route.request();
    const target = new URL(request.url());
    const isWeb = target.protocol === 'http:' || target.protocol === 'https:';
    if (!isWeb || BLOCKED_RESOURCE_TYPES.has(request.resourceType())) return route.abort();

    return (await isAllowed(target.hostname)) ? route.continue() : route.abort('blockedbyclient');
  });
  await context.routeWebSocket(/.*/, (socket) => socket.close());

  return isAllowed;
}

async function readJson(response: Response): Promise<unknown | undefined> {
  const isJson = (response.headers()['content-type'] ?? '').includes('json');
  if (!isJson || response.status() !== 200) return undefined;

  try {
    const body = await response.body();
    if (body.byteLength > MAX_OBSERVED_JSON_BYTES) return undefined;

    return JSON.parse(body.toString('utf8'));
  } catch {
    return undefined;
  }
}

/**
 * A headless browser for pages that are empty until their scripts run. Each render gets its own context; requests to
 * hosts that resolve to private addresses are refused before they are sent, and a render whose responses came from a
 * private address anyway (a DNS answer that changed in between) fails. WebSockets, downloads, images, media and fonts
 * are refused. Never fills forms or waits out anti-bot pages.
 */
/**
 * The browser's user agent: the crawler's name and contact inside a standard Chrome string, as rendering crawlers send
 * it. A bare crawler name is refused by sites that check for a supported browser before they render anything.
 */
export function browserUserAgent(identity: string, chromeVersion: string): string {
  const match = identity.match(/^(\S+)\s*\(\+?([^)]*)\)$/);
  const compatible = match ? `${match[1]}; +${match[2]}` : identity;

  return `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ${compatible}) Chrome/${chromeVersion} Safari/537.36`;
}

export function createRenderer(options: RendererOptions): ManagedRenderer {
  const policy = options.policy ?? PUBLIC_ONLY_POLICY;
  const slots = new Slots(options.maxConcurrentPages ?? 3);
  const recycleAfter = options.recycleAfter ?? 200;
  let browser: Promise<Browser> | null = null;
  let rendersOnBrowser = 0;

  const openBrowser = () =>
    options.cdpEndpoint
      ? chromium.connectOverCDP(options.cdpEndpoint)
      : chromium.launch({ headless: true, args: ['--disable-dev-shm-usage'] });

  const currentBrowser = async (): Promise<Browser> => {
    if (browser && rendersOnBrowser >= recycleAfter && slots.idle) {
      const old = browser;
      browser = null;
      await (await old).close().catch(() => undefined);
    }
    if (!browser) {
      browser = openBrowser();
      rendersOnBrowser = 0;
    }
    rendersOnBrowser += 1;

    return browser;
  };

  return {
    async available() {
      browser ??= openBrowser();
      try {
        await browser;

        return true;
      } catch {
        browser = null;

        return false;
      }
    },

    async render(url, { timeoutMs }) {
      await slots.acquire();
      let context: BrowserContext | null = null;

      try {
        const instance = await currentBrowser();
        context = await instance.newContext({
          userAgent: browserUserAgent(options.userAgent, instance.version()),
          acceptDownloads: false,
          serviceWorkers: 'block',
          javaScriptEnabled: true
        });
        const isAllowed = await guardContext(context, policy);

        const observedJson: Array<{ url: string; body: unknown }> = [];
        const pending: Array<Promise<void>> = [];
        let violation: { url: string; address: string; navigation: boolean } | null = null;
        const page = await context.newPage();

        page.on('response', (response) => {
          pending.push(
            (async () => {
              const server = await response.serverAddr().catch(() => null);
              const hostname = new URL(response.url()).hostname;
              if (server && !policy.allowAddress(server.ipAddress, hostname)) {
                // A proxy answers for every host, so its own address says nothing: the host's resolution decides.
                if (!(await isAllowed(hostname))) {
                  const navigation = response.request().isNavigationRequest();
                  if (!violation || (navigation && !violation.navigation))
                    violation = { url: response.url(), address: server.ipAddress, navigation };
                }

                return;
              }

              if (observedJson.length >= MAX_OBSERVED_JSON) return;

              const body = await readJson(response);
              if (body !== undefined) observedJson.push({ url: response.url(), body });
            })()
          );
        });

        const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
        await page
          .waitForLoadState('networkidle', { timeout: Math.min(NETWORK_IDLE_MS, timeoutMs) })
          .catch(() => undefined);
        const html = await page.content();
        const finalUrl = page.url();
        await Promise.all(pending);

        // Only the page's own document coming from a private address fails the render: an asset served through a proxy
        // is an asset we skip, not a reason to lose a page that already arrived.
        const blocked = violation as { url: string; address: string; navigation: boolean } | null;
        if (blocked?.navigation) throw new RenderBlockedError(blocked.url, blocked.address);

        return { finalUrl, status: response?.status() ?? 0, html, observedJson };
      } finally {
        await context?.close().catch(() => undefined);
        slots.release();
      }
    },

    async close() {
      const instance = browser;
      browser = null;
      if (instance) await (await instance).close().catch(() => undefined);
    }
  };
}
