import { describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';
import { generateSpecs } from 'hono-openapi';
import { Hono } from '@api/utils/hono';

vi.mock('@api/middlewares/rate-limiter', () => ({
  createAuthenticationFailureRateLimiter: () => async (_c: Context, next: Next) => next(),
  createRateLimiter: () => async (_c: Context, next: Next) => next()
}));

import { enrichPublicApiOpenApiSpec } from '@cio/utils/openapi/public-api';
import { v1Router } from '@api/routes/v1';

// The API reference shows field, parameter and response descriptions as one line of plain text.
const MAX_FIELD_LENGTH = 160;
// An endpoint description is one sentence: what it does and who may call it. The parameters say the rest.
const MAX_ENDPOINT_LENGTH = 200;

type Finding = { location: string; text: string };

function collectFieldDescriptions(value: unknown, location: string[], findings: Finding[]) {
  if (!value || typeof value !== 'object') return;

  for (const [key, child] of Object.entries(value)) {
    if (key === 'description' && typeof child === 'string') {
      if (child.length > MAX_FIELD_LENGTH) findings.push({ location: location.join(' > '), text: child });
    } else {
      collectFieldDescriptions(child, [...location, key], findings);
    }
  }
}

function checkEndpointDescription(description: string, location: string, findings: Finding[]) {
  if (description.includes('\n') || description.length > MAX_ENDPOINT_LENGTH) {
    findings.push({ location, text: description });
  }
}

async function findLongDescriptions() {
  const app = new Hono().route('/public-api/v1', v1Router);
  const spec = enrichPublicApiOpenApiSpec(await generateSpecs(app));
  const paths = spec.paths as Record<string, Record<string, Record<string, unknown>>>;
  const findings: Finding[] = [];

  for (const [path, operations] of Object.entries(paths)) {
    for (const [method, operation] of Object.entries(operations)) {
      const location = `${method.toUpperCase()} ${path}`;
      const { description, ...rest } = operation;

      if (typeof description === 'string') checkEndpointDescription(description, location, findings);
      collectFieldDescriptions(rest, [location], findings);
    }
  }

  return findings;
}

describe('public API descriptions', () => {
  it('stay short enough to read in the API reference', async () => {
    const findings = await findLongDescriptions();
    const report = [...new Map(findings.map((finding) => [finding.text, finding])).values()].map(
      (finding) => `${finding.text.length} chars at ${finding.location}: ${finding.text}`
    );

    expect(report, `Shorten these descriptions:\n\n${report.join('\n\n')}`).toEqual([]);
  });
});
