import { eq, isNotNull } from 'drizzle-orm';
import { db } from '../drizzle';
import { organization } from '../schema';

function replacePrograms(label: string): string {
  return label.replace(/programs/gi, (match) => (match[0] === match[0].toUpperCase() ? 'Courses' : 'courses'));
}

function fixAction(
  action: Record<string, unknown> | undefined,
  changes: string[]
): Record<string, unknown> | undefined {
  if (!action || typeof action !== 'object') return action;

  const fixed = { ...action };

  if (fixed.href === '#courses') {
    fixed.href = '/courses';
    changes.push('hero action href #courses → /courses');
  }

  if (typeof fixed.label === 'string' && /programs/i.test(fixed.label)) {
    const updated = replacePrograms(fixed.label);
    changes.push(`hero action label "${fixed.label}" → "${updated}"`);
    fixed.label = updated;
  }

  return fixed;
}

async function fixLandingPageCoursesLinks() {
  const dryRun = process.argv.includes('--dry-run');

  if (dryRun) {
    console.log('DRY RUN — no changes will be written.\n');
  }

  try {
    const rows = await db
      .select({ id: organization.id, siteName: organization.siteName, landingpage: organization.landingpage })
      .from(organization)
      .where(isNotNull(organization.landingpage));

    let updatedCount = 0;

    for (const row of rows) {
      const lp = row.landingpage as Record<string, unknown> | null;

      if (!lp || typeof lp !== 'object') continue;

      const changes: string[] = [];
      const fixed = { ...lp };

      // Fix hero actions
      const hero = fixed.hero as Record<string, unknown> | undefined;
      if (hero && typeof hero === 'object') {
        const fixedHero = { ...hero };

        fixedHero.primaryAction = fixAction(fixedHero.primaryAction as Record<string, unknown> | undefined, changes);
        fixedHero.secondaryAction = fixAction(
          fixedHero.secondaryAction as Record<string, unknown> | undefined,
          changes
        );

        fixed.hero = fixedHero;
      }

      // Fix navItems
      const navItems = fixed.navItems as Array<Record<string, unknown>> | undefined;
      if (Array.isArray(navItems)) {
        const fixedNavItems = navItems.map((item) => {
          const fixedItem = { ...item };

          if (fixedItem.href === '#courses') {
            fixedItem.href = '/courses';
            changes.push(`navItem href #courses → /courses (label: "${fixedItem.label}")`);
          }

          if (typeof fixedItem.label === 'string' && /programs/i.test(fixedItem.label)) {
            const updated = replacePrograms(fixedItem.label);
            changes.push(`navItem label "${fixedItem.label}" → "${updated}"`);
            fixedItem.label = updated;
          }

          return fixedItem;
        });

        fixed.navItems = fixedNavItems;
      }

      if (changes.length === 0) continue;

      if (!dryRun) {
        await db.update(organization).set({ landingpage: fixed }).where(eq(organization.id, row.id));
      }

      console.log(`${dryRun ? '[dry-run] Would update' : 'Updated'} org "${row.siteName}" (${row.id}):`);
      for (const change of changes) {
        console.log(`  - ${change}`);
      }

      updatedCount++;
    }

    console.log(
      `\n${dryRun ? 'Dry run complete' : 'Done'}. ${updatedCount} of ${rows.length} orgs ${dryRun ? 'would be' : ''} updated.`
    );
    process.exit(0);
  } catch (error) {
    console.error('fix-landing-page-courses-links failed:', error);
    process.exit(1);
  }
}

fixLandingPageCoursesLinks();
