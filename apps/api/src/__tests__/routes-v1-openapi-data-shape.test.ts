import { describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';
import { generateSpecs } from 'hono-openapi';
import { Hono } from '@api/utils/hono';

vi.mock('@hono/node-server/conninfo', () => ({
  getConnInfo: () => ({ remote: { address: '127.0.0.1' } })
}));

vi.mock('@api/middlewares/rate-limiter', () => ({
  createAuthenticationFailureRateLimiter: () => async (_c: Context, next: Next) => next(),
  createRateLimiter: () => async (_c: Context, next: Next) => next()
}));

import { v1Router } from '@api/routes/v1';

type JsonSchema = {
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  additionalProperties?: boolean | JsonSchema;
  items?: JsonSchema;
  prefixItems?: JsonSchema[];
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  allOf?: JsonSchema[];
};

type Operation = {
  responses?: Record<string, { content?: Record<string, { schema?: JsonSchema }> }>;
};

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'];

// A schema is typed when a generated client can tell what is inside it: a bare `{ type: 'object' }` is not.
function isTyped(schema: JsonSchema | undefined): boolean {
  if (!schema) return false;

  const variants = schema.anyOf ?? schema.oneOf ?? schema.allOf;
  if (variants) return variants.some((variant) => variant.type !== 'null' && isTyped(variant));

  if (schema.type === 'array') return isTyped(schema.items) || Boolean(schema.prefixItems?.length);

  if (schema.type === 'object' || schema.properties) {
    return Object.keys(schema.properties ?? {}).length > 0 || typeof schema.additionalProperties === 'object';
  }

  return schema.type !== undefined;
}

describe('public API OpenAPI spec', () => {
  it('documents the shape of data on every JSON success response', async () => {
    const app = new Hono().route('/public-api/v1', v1Router);
    const spec = await generateSpecs(app);
    const untyped: string[] = [];
    let checked = 0;

    for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
      for (const method of HTTP_METHODS) {
        const operation = (pathItem as Record<string, Operation | undefined>)[method];

        for (const [status, response] of Object.entries(operation?.responses ?? {})) {
          const schema = response.content?.['application/json']?.schema;
          if (!status.startsWith('2') || !schema) continue;

          checked += 1;
          if (!isTyped(schema.properties?.data)) untyped.push(`${method.toUpperCase()} ${path} ${status}`);
        }
      }
    }

    expect(checked).toBeGreaterThan(0);
    expect(untyped).toEqual([]);
  });
});
