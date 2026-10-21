import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { buildPluginCsp } from '@api/routes/plugins/assets';

describe('Plugin Manifest CSP Policy', () => {
  it('defaults to connect-src none when no domains are allowed', () => {
    const csp = buildPluginCsp();
    expect(csp).toContain("connect-src 'none'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("object-src 'none'");
  });

  it('allows exact declared HTTPS origins and excludes undeclared ones', () => {
    const csp = buildPluginCsp({
      networkAccess: {
        allowedDomains: ['https://certificate-studio.services.classroomio.com']
      }
    });

    expect(csp).toContain("connect-src 'self' https://certificate-studio.services.classroomio.com");
    expect(csp).not.toContain('https://malicious.com');
  });

  it('rejects wildcards, insecure http, paths, and credentials', () => {
    const csp = buildPluginCsp({
      networkAccess: {
        allowedDomains: [
          'https://*.services.classroomio.com',
          'http://insecure.services.classroomio.com',
          'https://certificate-studio.services.classroomio.com/api/v1',
          'https://user:pass@certificate-studio.services.classroomio.com',
          'javascript:alert(1)'
        ]
      }
    });

    expect(csp).toContain("connect-src 'none'");
  });

  it('allows exact localhost HTTP origins outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');

    const csp = buildPluginCsp({
      networkAccess: {
        allowedDomains: ['http://localhost:4000']
      }
    });

    expect(csp).toContain("connect-src 'self' http://localhost:4000");
    vi.unstubAllEnvs();
  });

  it('rejects localhost HTTP origins in production', () => {
    vi.stubEnv('NODE_ENV', 'production');

    const csp = buildPluginCsp({
      networkAccess: {
        allowedDomains: ['http://localhost:4000']
      }
    });

    expect(csp).toContain("connect-src 'none'");
    vi.unstubAllEnvs();
  });

  it('serves assets for approved plugins matching digest', async () => {
    const db = await import('@cio/db/queries/plugin');
    const { pluginAssetsRouter } = await import('@api/routes/plugins/assets');
    const digest = 'sha256-7ed8d5a209603713494675cda2665c535551cf0638337fe0e9ed4bc68b63119a';
    const artifactRoot = await mkdtemp(path.join(tmpdir(), 'cio-plugin-assets-'));
    const artifactDirectory = path.join(artifactRoot, 'com.classroomio.announcement-banner', '1.0.0', digest);
    await mkdir(artifactDirectory, { recursive: true });
    await writeFile(path.join(artifactDirectory, 'settings.html'), '<!doctype html><title>Settings</title>');
    vi.stubEnv('PLUGIN_ARTIFACTS_PATH', artifactRoot);

    vi.spyOn(db, 'getPluginVersion').mockResolvedValue({
      id: 'version-1',
      pluginId: 'com.classroomio.announcement-banner',
      version: '1.0.0',
      manifest: { id: 'com.classroomio.announcement-banner' } as any,
      artifactDigest: digest,
      reviewStatus: 'approved',
      publishedAt: '2026-10-10',
      createdAt: '2026-10-10'
    } as any);

    try {
      const res = await pluginAssetsRouter.request(
        `/com.classroomio.announcement-banner/1.0.0/${digest}/settings.html`
      );

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/html');
      expect(res.headers.get('content-security-policy')).toContain("default-src 'self'");
      const text = await res.text();
      expect(text).toContain('<!doctype html>');
    } finally {
      vi.unstubAllEnvs();
      await rm(artifactRoot, { recursive: true, force: true });
    }
  });
});
