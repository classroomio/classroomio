import { eq, isNotNull } from 'drizzle-orm';
import { db } from '../drizzle';
import { organization } from '../schema';

function isContactNavItem(item: Record<string, unknown>): boolean {
  const href = typeof item.href === 'string' ? item.href.trim() : '';
  const label = typeof item.label === 'string' ? item.label.trim().toLowerCase() : '';

  if (href === '#contact' || href === '/#contact') return true;

  const isContactLabel = label === 'contact' || label === 'contact us';
  const isDeadOrAnchorHref = href === '#' || href === '' || href === '#contact' || href === '/#contact';

  return isContactLabel && isDeadOrAnchorHref;
}

function isContactCustomLink(link: Record<string, unknown>): boolean {
  const url = typeof link.url === 'string' ? link.url.trim() : '';
  const label = typeof link.label === 'string' ? link.label.trim().toLowerCase() : '';

  if (url === '#contact' || url === '/#contact') return true;

  const isContactLabel = label === 'contact' || label === 'contact us';
  const isDeadOrAnchorUrl = url === '#' || url === '' || url === '#contact' || url === '/#contact';

  return isContactLabel && isDeadOrAnchorUrl;
}

async function removeLandingPageContactNav() {
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

      // Clean modern navItems
      if (Array.isArray(fixed.navItems)) {
        const originalCount = fixed.navItems.length;
        const keptNavItems = (fixed.navItems as Array<Record<string, unknown>>).filter((item) => {
          const isContact = isContactNavItem(item);
          if (isContact) {
            changes.push(`removed navItem: label="${item.label}", href="${item.href}"`);
          }
          return !isContact;
        });

        if (keptNavItems.length !== originalCount) {
          fixed.navItems = keptNavItems;
        }
      }

      // Clean legacy customLinks.links
      const customLinks = fixed.customLinks as Record<string, unknown> | undefined;
      if (customLinks && typeof customLinks === 'object' && Array.isArray(customLinks.links)) {
        const originalCount = customLinks.links.length;
        const keptLinks = (customLinks.links as Array<Record<string, unknown>>).filter((link) => {
          const isContact = isContactCustomLink(link);
          if (isContact) {
            changes.push(`removed legacy customLink: label="${link.label}", url="${link.url}"`);
          }
          return !isContact;
        });

        if (keptLinks.length !== originalCount) {
          fixed.customLinks = {
            ...customLinks,
            links: keptLinks
          };
        }
      }

      // Clean hero actions if they point to #contact
      const hero = fixed.hero as Record<string, unknown> | undefined;
      if (hero && typeof hero === 'object') {
        const fixedHero = { ...hero };
        const primaryAction = fixedHero.primaryAction as Record<string, unknown> | undefined;
        if (primaryAction && typeof primaryAction === 'object' && primaryAction.href === '#contact') {
          fixedHero.primaryAction = { ...primaryAction, href: '/courses' };
          changes.push('hero primaryAction href #contact → /courses');
        }

        const secondaryAction = fixedHero.secondaryAction as Record<string, unknown> | undefined;
        if (secondaryAction && typeof secondaryAction === 'object' && secondaryAction.href === '#contact') {
          fixedHero.secondaryAction = { ...secondaryAction, href: '/courses' };
          changes.push('hero secondaryAction href #contact → /courses');
        }

        fixed.hero = fixedHero;
      }

      // Clean legacy header.action if it points to #contact
      const header = fixed.header as Record<string, unknown> | undefined;
      if (header && typeof header === 'object') {
        const fixedHeader = { ...header };
        const action = fixedHeader.action as Record<string, unknown> | undefined;
        if (action && typeof action === 'object' && action.link === '#contact') {
          fixedHeader.action = { ...action, link: '/courses' };
          changes.push('legacy header action link #contact → /courses');
        }
        fixed.header = fixedHeader;
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
    console.error('remove-landing-page-contact-nav failed:', error);
    process.exit(1);
  }
}

removeLandingPageContactNav();
