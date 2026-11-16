import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';
import { generateSpecs } from 'hono-openapi';
import { Hono } from '@api/utils/hono';

vi.mock('@api/middlewares/rate-limiter', () => ({
  createAuthenticationFailureRateLimiter: () => async (_c: Context, next: Next) => next(),
  createRateLimiter: () => async (_c: Context, next: Next) => next()
}));

import { v1Router } from '@api/routes/v1';
import { OPERATION_SUMMARIES, enrichPublicApiOpenApiSpec } from '@cio/utils/openapi/public-api';
import { ORG_ANALYTICS_PAGE } from '@cio/utils/constants/analytics-pages';

const REPO_ROOT = path.resolve(__dirname, '../../../..');
const BLUME_CONFIG_PATH = path.join(REPO_ROOT, 'apps/docs/blume.config.ts');
const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'options', 'head']);

type Operation = { summary?: string; tags?: string[] };
type Spec = {
  paths: Record<string, Record<string, Operation>>;
  tags?: Array<{ name: string }>;
};

async function generateSpec(): Promise<Spec> {
  const app = new Hono().route('/public-api/v1', v1Router);

  return enrichPublicApiOpenApiSpec((await generateSpecs(app)) as never) as Spec;
}

function apiSectionsSource(): string {
  const config = readFileSync(BLUME_CONFIG_PATH, 'utf8');
  const sections = config.match(/const API_SECTIONS[\s\S]*?\n\];/);

  expect(sections, 'blume.config.ts has no API_SECTIONS').not.toBeNull();

  return sections![0];
}

describe('public API OpenAPI metadata', () => {
  it('places every generated tag in the docs API sections', async () => {
    const spec = await generateSpec();
    const placedTags = [...apiSectionsSource().matchAll(/\btag:\s*'([^']+)'/g)].map((match) => match[1]);

    expect((spec.tags ?? []).map((tag) => tag.name).filter((name) => !placedTags.includes(name))).toEqual([]);
  });

  it('places the three Analytics tags under the Analytics section', () => {
    const analyticsSection = apiSectionsSource().match(/label: 'Analytics',\s*tags: \[([^\]]*)\]/);

    expect(analyticsSection, 'blume.config.ts has no Analytics section in API_SECTIONS').not.toBeNull();

    for (const tag of [ORG_ANALYTICS_PAGE.label, 'Marketing', 'Compliance']) {
      expect(analyticsSection![1], `${tag} is missing from the Analytics section`).toContain(`tag: '${tag}'`);
    }
  });

  it('summarizes every generated operation', async () => {
    const spec = await generateSpec();
    const missing = Object.entries(spec.paths).flatMap(([publicPath, pathItem]) =>
      Object.entries(pathItem)
        .filter(([method]) => HTTP_METHODS.has(method))
        .filter(([, operation]) => !operation.summary)
        .map(([method]) => `${method.toUpperCase()} ${publicPath}`)
    );

    expect(missing).toEqual([]);
  });

  it('keeps every summary key pointed at a real operation', async () => {
    const spec = await generateSpec();
    const stale = Object.keys(OPERATION_SUMMARIES).filter((key) => {
      const [method, publicPath] = key.split(' ');
      const operation = spec.paths[publicPath]?.[method.toLowerCase()];

      return !operation || !HTTP_METHODS.has(method.toLowerCase());
    });

    expect(stale).toEqual([]);
  });
});
