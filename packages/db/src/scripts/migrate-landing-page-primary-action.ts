import { eq, isNotNull } from 'drizzle-orm';

import { db } from '../drizzle';
import { organization } from '../schema';

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function migratePrimaryAction(landingpage: unknown): { landingpage: unknown; changed: boolean } {
  if (!isRecord(landingpage) || !isRecord(landingpage.hero) || !isRecord(landingpage.hero.primaryAction)) {
    return { landingpage, changed: false };
  }

  if (landingpage.hero.primaryAction.href !== '/login') {
    return { landingpage, changed: false };
  }

  return {
    landingpage: {
      ...landingpage,
      hero: {
        ...landingpage.hero,
        primaryAction: {
          ...landingpage.hero.primaryAction,
          href: '/lms'
        }
      }
    },
    changed: true
  };
}

async function main() {
  const shouldExecute = process.argv.includes('--execute');
  const rows = await db
    .select({ id: organization.id, siteName: organization.siteName, landingpage: organization.landingpage })
    .from(organization)
    .where(isNotNull(organization.landingpage));

  let updatedCount = 0;

  for (const row of rows) {
    const result = migratePrimaryAction(row.landingpage);

    if (!result.changed) {
      continue;
    }

    if (shouldExecute) {
      await db
        .update(organization)
        .set({ landingpage: result.landingpage as typeof organization.$inferInsert.landingpage })
        .where(eq(organization.id, row.id));
    }

    console.log(`${shouldExecute ? 'Updated' : 'Would update'} org "${row.siteName}" (${row.id})`);
    updatedCount += 1;
  }

  console.log(
    `${shouldExecute ? 'Migration complete' : 'Dry run complete'}. ${updatedCount} of ${rows.length} orgs ${
      shouldExecute ? 'updated' : 'would be updated'
    }.`
  );
}

main().catch((error) => {
  console.error('migrate-landing-page-primary-action failed:', error);
  process.exit(1);
});
