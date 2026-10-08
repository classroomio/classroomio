import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { DEFAULT_SCOPES } from '@api/services/organization/automation-key';

const MIGRATIONS_DIR = join(__dirname, '../../../../packages/db/src/migrations');

/**
 * A scope-backfill migration widens an existing key only when its scope list
 * already matches the MCP default as it stood *before* the new scope was added.
 * So the `@>` list in the SQL has to equal `DEFAULT_SCOPES.mcp` minus the scopes
 * that migration introduces. If the two drift, the predicate matches nothing and
 * existing keys are silently left without the scope — which only surfaces later,
 * as a 403 on whichever route starts requiring it.
 *
 * This cannot replace a database-backed test of the SQL itself (see #1199), but
 * it does catch the mismatch, which is the failure mode that actually bites.
 */
function readMigration(tag: string): string {
  return readFileSync(join(MIGRATIONS_DIR, `${tag}.sql`), 'utf8');
}

function scopesInFirstJsonbArray(sql: string, afterOperator: string): string[] {
  const start = sql.indexOf(afterOperator);
  expect(start, `expected to find ${afterOperator} in the migration`).toBeGreaterThan(-1);

  const open = sql.indexOf('[', start);
  const close = sql.indexOf(']', open);

  return JSON.parse(sql.slice(open, close + 1)) as string[];
}

describe('0029_media_upload_pipeline', () => {
  const sql = readMigration('0029_media_upload_pipeline');

  it('requires exactly the MCP default set as it stood before media:write', () => {
    const required = scopesInFirstJsonbArray(sql, 'AND "scopes" @>');
    const priorDefault = DEFAULT_SCOPES.mcp.filter((scope: string) => scope !== 'media:write');

    expect(new Set(required)).toEqual(new Set(priorDefault));
  });

  it('adds every scope the default gained, so a new key and a migrated key agree', () => {
    const added = scopesInFirstJsonbArray(sql, 'SET "scopes" =');
    const required = scopesInFirstJsonbArray(sql, 'AND "scopes" @>');

    expect(new Set([...required, ...added])).toEqual(new Set(DEFAULT_SCOPES.mcp));
  });

  it('only touches mcp keys, leaving public_api:* keys alone', () => {
    expect(sql).toContain(`"type" = 'mcp'`);
  });

  it('skips keys already holding the scope, so re-running is a no-op', () => {
    expect(sql).toContain('NOT "scopes" @> \'["media:write"]\'::jsonb');
  });
});
