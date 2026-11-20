import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/core/services/block/html-page', () => ({
  readHtmlPage: vi.fn(async () => '<!doctype html><h1>Hi</h1>')
}));

import { signHtmlContentUrl, verifyHtmlContentSignature } from '@cio/core/utils/html-content';
import { htmlContentRouter } from '@api/routes/usercontent/html';

const ASSET_ID = '7f3c6c2e-3a7b-4d5e-9f10-1a2b3c4d5e6f';
const OTHER_ASSET_ID = '0b6f3f8e-5a2d-4c1e-8f7a-9d8c7b6a5f4e';

function pathOf(url: string) {
  const parsed = new URL(url);

  return `${parsed.pathname.replace('/usercontent/html', '')}${parsed.search}`;
}

describe('html content urls', () => {
  beforeEach(() => {
    vi.stubEnv('HTML_CONTENT_SIGNING_SECRET', 'test-secret');
    vi.stubEnv('HTML_CONTENT_ORIGIN', 'https://content.example.com');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('signs a url on the content origin that verifies only for its asset and before it expires', () => {
    const now = Date.UTC(2026, 10, 20, 10, 15);
    const url = new URL(signHtmlContentUrl(ASSET_ID, now)!);
    const expiresAt = Number(url.searchParams.get('exp'));
    const signature = url.searchParams.get('sig')!;

    expect(url.origin).toBe('https://content.example.com');
    expect(url.pathname).toBe(`/usercontent/html/${ASSET_ID}`);
    expect(verifyHtmlContentSignature(ASSET_ID, expiresAt, signature, now)).toBe(true);
    expect(verifyHtmlContentSignature(OTHER_ASSET_ID, expiresAt, signature, now)).toBe(false);
    expect(verifyHtmlContentSignature(ASSET_ID, expiresAt + 1, signature, now)).toBe(false);
    expect(verifyHtmlContentSignature(ASSET_ID, expiresAt, signature, expiresAt * 1000 + 1)).toBe(false);
  });

  it('keeps the url stable within the hour so the browser can cache the page', () => {
    const first = signHtmlContentUrl(ASSET_ID, Date.UTC(2026, 10, 20, 10, 1));
    const second = signHtmlContentUrl(ASSET_ID, Date.UTC(2026, 10, 20, 10, 59));

    expect(first).toBe(second);
  });

  it('returns no url in production when signing is not configured', () => {
    vi.stubEnv('HTML_CONTENT_SIGNING_SECRET', '');
    vi.stubEnv('HLS_SIGNING_SECRET', '');
    vi.stubEnv('NODE_ENV', 'production');

    expect(signHtmlContentUrl(ASSET_ID)).toBeNull();
  });

  it('serves a signed page with a sandboxing, network-blocking content security policy', async () => {
    const url = signHtmlContentUrl(ASSET_ID)!;
    const response = await htmlContentRouter.request(pathOf(url), { headers: { host: 'content.example.com' } });
    const policy = response.headers.get('content-security-policy') ?? '';

    expect(response.status).toBe(200);
    expect(await response.text()).toContain('<h1>Hi</h1>');
    expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(policy).toContain('sandbox allow-scripts allow-modals allow-popups');
    expect(policy).not.toContain('allow-same-origin');
    expect(policy).toContain("connect-src 'none'");
    expect(policy).toContain("form-action 'none'");
  });

  it('refuses a tampered signature and any host other than the content origin', async () => {
    const url = signHtmlContentUrl(ASSET_ID)!;
    const tampered = await htmlContentRouter.request(pathOf(url).replace('sig=', 'sig=x'), {
      headers: { host: 'content.example.com' }
    });
    const wrongHost = await htmlContentRouter.request(pathOf(url), { headers: { host: 'api.example.com' } });

    expect(tampered.status).toBe(403);
    expect(wrongHost.status).toBe(404);
  });
});
