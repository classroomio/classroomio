/**
 * Inserts the ClassroomIO launch templates into an existing organization.
 * Skips a template whose seed key is already stored. Exits when the org is missing.
 *
 * Usage:
 *   pnpm --filter @cio/db db:seed:platform-templates <org-id>
 */
import 'dotenv/config';

import { seedLaunchTemplates } from '@db/utils/seed/platform-templates/insert';

const orgIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function main() {
  const orgId = process.argv[2];
  if (!orgId || !orgIdPattern.test(orgId)) {
    throw new Error('Usage: pnpm --filter @cio/db db:seed:platform-templates <org-id>');
  }

  const seeded = await seedLaunchTemplates(orgId);
  if (!seeded) {
    throw new Error(`No organization found for ${orgId}`);
  }

  console.log(`Launch templates seeded into ${orgId}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
