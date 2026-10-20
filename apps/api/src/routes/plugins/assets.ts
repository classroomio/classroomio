import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Hono } from '@api/utils/hono';
import { getPluginVersion } from '@cio/db/queries/plugin';

const MIME_MAP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

export function buildPluginCsp(manifest?: { networkAccess?: { allowedDomains?: string[] } }): string {
  const allowedConnectOrigins: string[] = [];

  const rawDomains = manifest?.networkAccess?.allowedDomains ?? [];
  for (const item of rawDomains) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim();
    try {
      const parsed = new URL(trimmed);
      const isSecureOrigin = parsed.protocol === 'https:';
      const isLocalDevelopmentOrigin =
        process.env.NODE_ENV !== 'production' && parsed.protocol === 'http:' && parsed.hostname === 'localhost';
      const hasValidHostname = /^[a-zA-Z0-9.-]+$/.test(parsed.hostname);
      if (
        (isSecureOrigin || isLocalDevelopmentOrigin) &&
        hasValidHostname &&
        parsed.origin === trimmed.replace(/\/$/, '') &&
        parsed.pathname === '/' &&
        !parsed.username &&
        !parsed.password
      ) {
        allowedConnectOrigins.push(parsed.origin);
      }
    } catch {
      continue;
    }
  }

  const connectSrc =
    allowedConnectOrigins.length > 0 ? `'self' ${Array.from(new Set(allowedConnectOrigins)).join(' ')}` : "'none'";

  return `default-src 'self'; connect-src ${connectSrc}; img-src 'self' data: blob:; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; object-src 'none'; base-uri 'none';`;
}

function resolveArtifactDirectory(pluginId: string, version: string, digest: string): string | null {
  const artifactRoot = process.env.PLUGIN_ARTIFACTS_PATH
    ? path.resolve(process.env.PLUGIN_ARTIFACTS_PATH)
    : path.resolve(process.cwd(), '.plugin-artifacts');

  const releaseDirectory = path.resolve(artifactRoot, pluginId, version, digest);
  if (existsSync(releaseDirectory)) {
    return releaseDirectory;
  }

  return null;
}

export const pluginAssetsRouter = new Hono().get('/:pluginId/:version/:digest/:assetPath{.+}', async (c) => {
  const pluginId = c.req.param('pluginId');
  const version = c.req.param('version');
  const digest = c.req.param('digest');
  const assetPath = c.req.param('assetPath');

  if (!pluginId || !/^[a-z0-9]+(\.[a-z0-9_-]+)+$/.test(pluginId)) {
    return c.text('Invalid plugin identifier', 400);
  }

  if (!assetPath || assetPath.includes('..') || assetPath.startsWith('/')) {
    return c.text('Invalid asset path', 400);
  }

  const versionRecord = await getPluginVersion(pluginId, version);
  if (
    !versionRecord ||
    versionRecord.reviewStatus !== 'approved' ||
    !versionRecord.artifactDigest ||
    versionRecord.artifactDigest !== digest
  ) {
    return c.text('Plugin artifact not found', 404);
  }

  if (process.env.NODE_ENV === 'production') {
    return c.text('Plugin artifacts must be served from PLUGIN_ASSET_ORIGIN in production', 404);
  }

  const artifactDirectory = resolveArtifactDirectory(pluginId, version, digest);
  if (!artifactDirectory) {
    return c.text('Plugin not found', 404);
  }

  const normalizedPluginDir = path.resolve(artifactDirectory);
  const fullPath = path.resolve(normalizedPluginDir, assetPath);

  if (!fullPath.startsWith(`${normalizedPluginDir}${path.sep}`)) {
    return c.text('Forbidden asset path', 403);
  }

  if (!existsSync(fullPath)) {
    return c.text('Asset not found', 404);
  }

  try {
    const fileBytes = await readFile(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_MAP[ext] ?? 'application/octet-stream';
    const csp = buildPluginCsp(versionRecord.manifest as { networkAccess?: { allowedDomains?: string[] } });

    return new Response(fileBytes, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': csp,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    return c.text('Failed to read asset', 500);
  }
});
