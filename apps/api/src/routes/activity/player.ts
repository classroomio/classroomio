import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { contentTypeForFile, verifyLaunchToken } from '@cio/activity-packages';
import {
  ACTIVITY_PLAYER_ASSET_CACHE_CONTROL,
  ACTIVITY_PLAYER_HTML_CACHE_CONTROL,
  contentHostHeaders,
  getActivitySigningSecret
} from '@cio/core/config/activity-content';
import { isContentHostRequest } from '@api/middlewares/activity-content-host';

import { Hono } from '@api/utils/hono';

function findPlayerDist(): string | null {
  const candidates = [
    join(process.cwd(), 'apps/activity-player/dist'),
    join(process.cwd(), '../activity-player/dist'),
    join(process.cwd(), '../../apps/activity-player/dist'),
    '/app/apps/activity-player/dist'
  ];

  for (const candidate of candidates) {
    try {
      if (existsSync(join(candidate, 'index.html')) && statSync(candidate).isDirectory()) {
        return candidate;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function safeAssetPath(raw: string): string | null {
  let decoded: string;

  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }

  const forward = decoded.replace(/\\/g, '/').normalize('NFC');

  if (forward.includes('\0') || forward.startsWith('/')) return null;

  const segments = forward.split('/').filter((segment) => segment !== '' && segment !== '.');

  if (segments.some((segment) => segment === '..')) return null;

  return segments.join('/');
}

export const activityPlayerRouter = new Hono()
  .get('/player/:launchToken', async (c) => {
    if (!isContentHostRequest(c)) return c.body(null, 404);

    const secret = getActivitySigningSecret();

    if (!secret) return c.body(null, 503);

    const launchToken = c.req.param('launchToken');

    if (!launchToken) return c.body(null, 401);

    let ancestors: string[];

    try {
      const claims = await verifyLaunchToken(launchToken, secret, Date.now());
      ancestors = claims.anc ?? [];
    } catch {
      return c.body(null, 401);
    }

    const dist = findPlayerDist();

    if (!dist) return c.body('player is not built yet', 503);

    const html = await readFile(join(dist, 'index.html'), 'utf8');

    return new Response(html, {
      status: 200,
      headers: {
        ...contentHostHeaders(ancestors),
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': ACTIVITY_PLAYER_HTML_CACHE_CONTROL
      }
    });
  })
  .get('/player-assets/*', async (c) => {
    if (!isContentHostRequest(c)) return c.body(null, 404);

    const dist = findPlayerDist();

    if (!dist) return c.body(null, 404);

    const fullPath = c.req.path;
    const marker = '/activity/player-assets/';
    const markerIndex = fullPath.indexOf(marker);
    const rawRelative = markerIndex === -1 ? '' : fullPath.slice(markerIndex + marker.length);
    const relative = safeAssetPath(rawRelative);

    if (!relative) return c.body(null, 404);

    const filePath = join(dist, relative);

    if (!filePath.startsWith(dist) || !existsSync(filePath) || !statSync(filePath).isFile()) {
      return c.body(null, 404);
    }

    const immutable = relative.startsWith('assets/');
    const body = await readFile(filePath);

    return new Response(body as unknown as BodyInit, {
      status: 200,
      headers: {
        ...contentHostHeaders([]),
        'Content-Type': contentTypeForFile(relative),
        'Cache-Control': immutable ? ACTIVITY_PLAYER_ASSET_CACHE_CONTROL : ACTIVITY_PLAYER_HTML_CACHE_CONTROL
      }
    });
  });
