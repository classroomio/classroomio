/**
 * Gives MCP keys created before the learning path tools the `learning_path:*`
 * scopes that new MCP keys get by default. Scopes are copied onto a key when it
 * is created, so existing keys would otherwise get 403 from every learning path
 * tool. Idempotent.
 *
 * Only keys holding the full original MCP default set are widened, so a key
 * created through the API with a narrower custom scope list is left alone.
 *
 * Usage:
 *   pnpm db:backfill-mcp-key-learning-path-scopes                      # dry run (default)
 *   pnpm db:backfill-mcp-key-learning-path-scopes -- --execute         # apply
 *   pnpm db:backfill-mcp-key-learning-path-scopes -- --org=<orgId>     # limit to one org
 */
import 'dotenv/config';

import { db } from '../drizzle';
import {
  addScopesToOrganizationApiKeys,
  countOrganizationApiKeysMissingScopes,
  type OrganizationApiKeyScopeBackfill
} from '../queries/organization/automation-key';

// Every MCP key the dashboard has ever created holds at least this set.
const ORIGINAL_MCP_DEFAULT_SCOPES = [
  'course_import:draft:create',
  'course_import:draft:read',
  'course_import:draft:update',
  'course_import:draft:publish',
  'course:read',
  'course:write',
  'course:tag:write',
  'course:exercise:read',
  'course:exercise:write'
];
const LEARNING_PATH_SCOPES = ['learning_path:read', 'learning_path:write'];

const connectionString = process.env.DATABASE_URL ?? process.env.PRIVATE_DATABASE_URL ?? '';
const shouldExecute = process.argv.includes('--execute');
const orgArg = process.argv.find((arg) => arg.startsWith('--org='));
const orgId = orgArg ? orgArg.slice('--org='.length).trim() : '';

if (!connectionString) {
  console.error('DATABASE_URL or PRIVATE_DATABASE_URL environment variable is required');
  process.exit(1);
}

// Without this, `--org=` would silently widen an intended single-org run to every org.
if (orgArg && !orgId) {
  console.error('--org was passed with no value. Provide --org=<orgId> or omit it to run for every organization.');
  process.exit(1);
}

async function main() {
  const backfill: OrganizationApiKeyScopeBackfill = {
    type: 'mcp',
    requiredScopes: ORIGINAL_MCP_DEFAULT_SCOPES,
    scopesToAdd: LEARNING_PATH_SCOPES,
    organizationId: orgId || undefined
  };
  const scope = orgId ? ` in org ${orgId}` : '';
  const missing = await countOrganizationApiKeysMissingScopes(backfill, db);

  console.log(`Found ${missing} MCP key(s) without the learning path scopes${scope}.`);

  if (missing === 0) {
    console.log('Nothing to do.');
    return;
  }

  if (!shouldExecute) {
    console.log('Dry run only. Re-run with --execute to apply.');
    return;
  }

  const updated = await addScopesToOrganizationApiKeys(backfill, db);
  const remaining = await countOrganizationApiKeysMissingScopes(backfill, db);

  console.log(`Added the learning path scopes to ${updated} MCP key(s).`);
  console.log(`Remaining: ${remaining} MCP key(s) without them.`);

  if (remaining > 0) {
    console.error('Some keys were not updated. Investigate before treating this as complete.');
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('backfill-mcp-key-learning-path-scopes failed:', error);
  process.exit(1);
});
