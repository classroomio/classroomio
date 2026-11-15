import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';
import { generateSpecs } from 'hono-openapi';
import { Hono } from '@api/utils/hono';

vi.mock('@api/middlewares/rate-limiter', () => ({
  createAuthenticationFailureRateLimiter: () => async (_c: Context, next: Next) => next(),
  createRateLimiter: () => async (_c: Context, next: Next) => next()
}));

import { ErrorCodes } from '@api/utils/errors';
import { v1Router } from '@api/routes/v1';
import { enrichPublicApiOpenApiSpec } from '@cio/utils/openapi/public-api';
import { MCP_TOOL_CREDIT_COST } from '@cio/utils/plans';
import { ClassroomIoApiClient, createMcpServer } from '@classroomio/mcp/server';
import { MCP_V1_ROUTE_TOOL_MAP } from '@api/middlewares/v1-mcp-usage';

const REPO_ROOT = path.resolve(__dirname, '../../../..');
const EN_JSON_PATH = path.join(REPO_ROOT, 'apps/dashboard/src/lib/utils/translations/en.json');
const HELP_CONTENT_PATH = path.join(REPO_ROOT, 'apps/help/content');

const BANNED_ANALYTICS_WORD = /insight/i;
const BANNED_STUDENT_WORD = /learner/i;

type Operation = { summary?: string; description?: string; tags?: string[] };
type Spec = { paths: Record<string, Record<string, Operation>>; tags?: Array<{ name: string }> };

async function generateSpec(): Promise<Spec> {
  const app = new Hono().route('/public-api/v1', v1Router);

  return enrichPublicApiOpenApiSpec((await generateSpecs(app)) as never) as Spec;
}

type RegisteredTool = { description?: string };

function registeredTools(): Record<string, RegisteredTool> {
  const apiClient = new ClassroomIoApiClient({
    CLASSROOMIO_API_URL: 'https://api.example.com',
    CLASSROOMIO_API_KEY: 'cio_mcp_test',
    CLASSROOMIO_USER_AGENT: 'test'
  });
  const server = createMcpServer(apiClient, { includeLocalFileTools: true });

  return (server as unknown as { _registeredTools: Record<string, RegisteredTool> })._registeredTools;
}

function flattenKeys(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object') return [];

  return Object.entries(value).flatMap(([key, child]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    return [fullKey, ...flattenKeys(child, fullKey)];
  });
}

function listFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);

    return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
  });
}

describe('forbidden words in public names', () => {
  it('keeps the analytics engine name out of every OpenAPI path, tag and summary', async () => {
    const spec = await generateSpec();
    const names = [
      ...Object.keys(spec.paths),
      ...(spec.tags ?? []).map((tag) => tag.name),
      ...Object.values(spec.paths).flatMap((operations) =>
        Object.values(operations).flatMap((operation) => [operation.summary ?? '', ...(operation.tags ?? [])])
      )
    ];

    expect(names.filter((name) => BANNED_ANALYTICS_WORD.test(name))).toEqual([]);
  });

  it('keeps the word learner out of every public path', async () => {
    const spec = await generateSpec();

    expect(Object.keys(spec.paths).filter((publicPath) => BANNED_STUDENT_WORD.test(publicPath))).toEqual([]);
  });

  it('keeps both words out of every MCP tool name and the analytics word out of every description', () => {
    const tools = registeredTools();
    const routedTools = Object.values(MCP_V1_ROUTE_TOOL_MAP).flatMap((methods) => Object.values(methods));
    const names = [...Object.keys(tools), ...Object.keys(MCP_TOOL_CREDIT_COST), ...routedTools];
    const descriptions = Object.entries(tools).map(([name, tool]) => `${name}: ${tool.description ?? ''}`);

    expect(names.filter((name) => BANNED_ANALYTICS_WORD.test(name) || BANNED_STUDENT_WORD.test(name))).toEqual([]);
    expect(descriptions.filter((description) => BANNED_ANALYTICS_WORD.test(description))).toEqual([]);
  });

  it('keeps the analytics word out of every error code', () => {
    expect(Object.keys(ErrorCodes).filter((key) => BANNED_ANALYTICS_WORD.test(key))).toEqual([]);
    expect(Object.values(ErrorCodes).filter((code) => BANNED_ANALYTICS_WORD.test(code))).toEqual([]);
  });

  it('keeps the analytics word out of every dashboard translation key', () => {
    const translations = JSON.parse(readFileSync(EN_JSON_PATH, 'utf8'));
    const offending = flattenKeys(translations).filter((key) => BANNED_ANALYTICS_WORD.test(key));

    expect(offending).toEqual([]);
  });

  it('keeps the removed Stats menu out of every help article', () => {
    const articles = listFiles(HELP_CONTENT_PATH).filter((file) => /\.mdx?$/.test(file));
    const offending = articles.filter((file) => readFileSync(file, 'utf8').includes('Stats →'));

    expect(offending.map((file) => path.relative(REPO_ROOT, file))).toEqual([]);
  });
});
