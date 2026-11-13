import { existsSync, readFileSync } from 'node:fs';
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
import { enrichPublicApiOpenApiSpec } from '@cio/utils/openapi/public-api';
import { ORG_ANALYTICS_PAGE, ORG_ANALYTICS_TOOLS } from '@cio/utils/constants/analytics-pages';

const REPO_ROOT = path.resolve(__dirname, '../../../..');
const EN_JSON_PATH = path.join(REPO_ROOT, 'apps/dashboard/src/lib/utils/translations/en.json');
const README_PATH = path.join(REPO_ROOT, 'packages/mcp/README.md');
const BLUME_CONFIG_PATH = path.join(REPO_ROOT, 'apps/docs/blume.config.ts');
const ROUTE_FOLDER = path.join(REPO_ROOT, 'apps/dashboard/src/routes/(app)/org/[slug]/analytics');

type Spec = {
  paths: Record<string, Record<string, { summary?: string; tags?: string[] }>>;
  tags?: Array<{ name: string }>;
};

async function generateSpec(): Promise<Spec> {
  const app = new Hono().route('/public-api/v1', v1Router);

  return enrichPublicApiOpenApiSpec((await generateSpecs(app)) as never) as Spec;
}

describe(`the org analytics page name "${ORG_ANALYTICS_PAGE.label}" is the same everywhere`, () => {
  const translations = JSON.parse(readFileSync(EN_JSON_PATH, 'utf8'));

  it('has a dashboard route folder named after the slug', () => {
    expect(existsSync(path.join(ROUTE_FOLDER, ORG_ANALYTICS_PAGE.slug, '+page.svelte'))).toBe(true);
  });

  it('is the label of the navigation item and the page title', () => {
    expect(translations.org_navigation.org_analytics).toBe(ORG_ANALYTICS_PAGE.label);
    expect(translations.analytics.org_page_title).toBe(ORG_ANALYTICS_PAGE.label);
  });

  it('is the OpenAPI tag of the org page, the course and the cohort analytics routes', async () => {
    const spec = await generateSpec();
    const operationPaths = [
      `/public-api/v1/analytics/${ORG_ANALYTICS_PAGE.slug}`,
      `/public-api/v1/analytics/${ORG_ANALYTICS_PAGE.slug}/students`,
      `/public-api/v1/analytics/${ORG_ANALYTICS_PAGE.slug}/catalog`,
      `/public-api/v1/analytics/${ORG_ANALYTICS_PAGE.slug}/query`,
      '/public-api/v1/courses/{courseId}/analytics',
      '/public-api/v1/courses/{courseId}/analytics/students',
      '/public-api/v1/cohorts/{cohortId}/analytics',
      '/public-api/v1/cohorts/{cohortId}/analytics/students'
    ];

    expect((spec.tags ?? []).map((tag) => tag.name)).toContain(ORG_ANALYTICS_PAGE.label);

    for (const operationPath of operationPaths) {
      const operations = Object.values(spec.paths[operationPath] ?? {});

      expect(operations.length, operationPath).toBeGreaterThan(0);

      for (const operation of operations) {
        expect(operation.tags, operationPath).toEqual([ORG_ANALYTICS_PAGE.label]);
      }
    }
  });

  it('is placed under the Analytics section of the docs sidebar', () => {
    const config = readFileSync(BLUME_CONFIG_PATH, 'utf8');
    const analyticsSection = config.match(/label: 'Analytics',\s*tags: \[([^\]]*)\]/);

    expect(analyticsSection, 'blume.config.ts has no Analytics section in API_SECTIONS').not.toBeNull();
    expect(analyticsSection![1]).toContain(`tag: '${ORG_ANALYTICS_PAGE.label}'`);
  });

  it('is the segment of the MCP tool names listed in the package README', () => {
    const readme = readFileSync(README_PATH, 'utf8');

    for (const toolName of Object.values(ORG_ANALYTICS_TOOLS)) {
      expect(readme, `${toolName} is missing from packages/mcp/README.md`).toContain(`\`${toolName}\``);
    }
  });
});
