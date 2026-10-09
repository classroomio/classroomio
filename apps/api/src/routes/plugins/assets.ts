import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { Hono } from '@api/utils/hono';

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
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const pluginDirCache = new Map<string, string>();

async function resolvePluginDirectory(pluginId: string): Promise<string | null> {
  const cached = pluginDirCache.get(pluginId);
  if (cached && existsSync(cached)) {
    return cached;
  }

  const basePluginsPath = path.resolve(process.cwd(), 'plugins');
  if (!existsSync(basePluginsPath)) {
    return null;
  }

  const entries = await readdir(basePluginsPath, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const manifestPath = path.join(basePluginsPath, entry.name, 'plugin.json');
    if (!existsSync(manifestPath)) continue;

    try {
      const manifestRaw = await readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestRaw) as { id?: string };
      if (manifest.id === pluginId) {
        const resolvedPath = path.join(basePluginsPath, entry.name);
        pluginDirCache.set(pluginId, resolvedPath);

        return resolvedPath;
      }
    } catch {
      continue;
    }
  }

  return null;
}

export const pluginAssetsRouter = new Hono().get('/:pluginId/:assetPath{.+}', async (c) => {
  const pluginId = c.req.param('pluginId');
  const assetPath = c.req.param('assetPath');

  if (!pluginId || !/^[a-z0-9]+(\.[a-z0-9_-]+)+$/.test(pluginId)) {
    return c.text('Invalid plugin identifier', 400);
  }

  if (!assetPath || assetPath.includes('..') || assetPath.startsWith('/')) {
    return c.text('Invalid asset path', 400);
  }

  const pluginDir = await resolvePluginDirectory(pluginId);
  if (!pluginDir) {
    return c.text('Plugin not found', 404);
  }

  const fullPath = path.resolve(pluginDir, assetPath);
  const normalizedPluginDir = path.resolve(pluginDir);

  if (!fullPath.startsWith(normalizedPluginDir)) {
    return c.text('Forbidden asset path', 403);
  }

  if (!existsSync(fullPath)) {
    return c.text('Asset not found', 404);
  }

  try {
    const fileBytes = await readFile(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_MAP[ext] ?? 'application/octet-stream';

    return new Response(fileBytes, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy':
          "default-src 'self' 'unsafe-inline' data: blob:; connect-src *; style-src 'self' 'unsafe-inline'; font-src 'self' data: https:;",
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return c.text('Failed to read asset', 500);
  }
});
