import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Context, Next } from 'hono';
import { describe, expect, it } from 'vitest';

import { ZAPIER_OAUTH_SCOPES } from '@cio/utils/constants/zapier';

import {
  getPublicApiRouteScope,
  isPublicApiIdentityPath,
  publicApiScopesMiddleware
} from '@api/middlewares/public-api-scopes';
import { v1Router } from '@api/routes/v1';
import { Hono } from '@api/utils/hono';

const ZAPIER_SCOPES = new Set<string>(ZAPIER_OAUTH_SCOPES);
const ZAPIER_SRC_DIR = fileURLToPath(new URL('../../../zapier/src', import.meta.url));
const PLACEHOLDER_ID = '00000000-0000-4000-8000-000000000001';

type ZapierAppRequest = {
  method: string;
  path: string;
  sourceFile: string;
};

function toConcretePath(routePath: string): string {
  return `/public-api/v1${routePath.replace(/:[A-Za-z]+/g, 'id')}`;
}

function findEnclosingObjectSlice(source: string, index: number): string {
  let openIndex = index;
  let depth = 0;

  while (openIndex >= 0) {
    const char = source[openIndex];
    if (char === '}') depth += 1;
    if (char === '{') {
      if (depth === 0) break;

      depth -= 1;
    }
    openIndex -= 1;
  }

  let closeIndex = openIndex;
  depth = 0;

  while (closeIndex < source.length) {
    const char = source[closeIndex];
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(openIndex, closeIndex + 1);
    }
    closeIndex += 1;
  }

  return '';
}

function collectZapierAppRequests(): ZapierAppRequest[] {
  const entries = readdirSync(ZAPIER_SRC_DIR, { recursive: true }) as string[];
  const tsFiles = entries.filter((entry) => entry.endsWith('.ts') && !entry.endsWith('config.ts')).sort();
  const requests: ZapierAppRequest[] = [];

  for (const relativeFile of tsFiles) {
    const content = readFileSync(join(ZAPIER_SRC_DIR, relativeFile), 'utf8');
    const withoutImports = content.replace(/^import\s.+$/gm, '');
    const totalApiUrlCalls = [...withoutImports.matchAll(/\bapiUrl\s*\(/g)].length;
    const parsedApiUrls = [...withoutImports.matchAll(/\burl:\s*apiUrl\((['"`])([^'"`]+)\1\)/g)];

    expect(parsedApiUrls).toHaveLength(totalApiUrlCalls);

    for (const match of parsedApiUrls) {
      const objectSlice = findEnclosingObjectSlice(withoutImports, match.index ?? 0);
      const methodMatch = /\bmethod:\s*['"]([A-Z]+)['"]/.exec(objectSlice);
      const normalizedSuffix = match[2].replace(/\$\{[^}]+\}/g, PLACEHOLDER_ID);

      requests.push({
        method: methodMatch?.[1] ?? 'GET',
        path: `/public-api/v1${normalizedSuffix}`,
        sourceFile: relativeFile
      });
    }

    const templateUrls = [
      ...withoutImports.matchAll(/\burl:\s*['"`]\{\{process\.env\.CIO_API_ORIGIN\}\}(\/public-api\/v1\/[^'"`]+)['"`]/g)
    ];

    for (const match of templateUrls) {
      requests.push({
        method: 'GET',
        path: match[1],
        sourceFile: relativeFile
      });
    }
  }

  return requests;
}

function buildZapierScopedV1App() {
  const registeredRoutes = new Set<string>();
  const scopedRouter = new Hono()
    .use('*', async (c: Context, next: Next) => {
      c.set('automationKey', {
        id: 'zapier-oauth-key',
        organizationId: 'org-1',
        createdByProfileId: 'admin-1',
        type: 'api',
        scopes: [...ZAPIER_OAUTH_SCOPES]
      } as never);
      await next();
    })
    .use('*', publicApiScopesMiddleware);

  for (const route of v1Router.routes) {
    if (route.method === 'ALL') continue;

    const routeKey = `${route.method} ${route.path}`;
    if (registeredRoutes.has(routeKey)) continue;

    registeredRoutes.add(routeKey);
    scopedRouter.on(route.method, route.path, (c) => c.json({ ok: true }));
  }

  return new Hono().route('/public-api/v1', scopedRouter);
}

describe('Zapier OAuth scope reachability', () => {
  it('opens exactly the public API routes the Zapier app is meant to reach', () => {
    const reachable = v1Router.routes
      .filter((route) => route.method !== 'ALL')
      .filter((route) => {
        const path = toConcretePath(route.path);
        const scope = getPublicApiRouteScope(route.method, path);

        return isPublicApiIdentityPath(path) || (scope !== null && ZAPIER_SCOPES.has(scope));
      })
      .map((route) => `${route.method} ${route.path}`)
      .sort();

    expect(reachable).toMatchSnapshot();
  });

  it('allows every URL called by the Zapier app with ZAPIER_OAUTH_SCOPES', async () => {
    const requests = collectZapierAppRequests();
    const app = buildZapierScopedV1App();

    expect(requests.length).toBeGreaterThan(0);

    for (const request of requests) {
      const response = await app.request(request.path, { method: request.method });

      expect(response.status, `${request.method} ${request.path} (${request.sourceFile})`).toBe(200);
    }
  });
});
