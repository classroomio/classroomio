import 'dotenv/config';

import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

function suffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

describe.skipIf(!hasDatabase)('assetReferencedByGlobalTemplate includes package assets', () => {
  it('finds a package used by a global template activity', { timeout: 30000 }, async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const { assetReferencedByGlobalTemplate } = await import('@db/queries/course/template-assets');

    const [platformOrg] = await db
      .insert(schema.organization)
      .values({ name: `tpl-platform-${suffix()}` })
      .returning();
    const [group] = await db
      .insert(schema.group)
      .values({ name: 'Template group', organizationId: platformOrg.id })
      .returning();
    const [template] = await db
      .insert(schema.course)
      .values({
        title: 'Global template',
        description: 'Template with a package',
        groupId: group.id,
        isTemplate: true,
        publicForAll: true,
        status: 'ACTIVE',
        slug: `global-template-${suffix()}`
      })
      .returning();
    const [asset] = await db
      .insert(schema.asset)
      .values({ organizationId: platformOrg.id, kind: 'scorm', title: 'Template package' })
      .returning();
    const [activity] = await db
      .insert(schema.courseActivity)
      .values({ courseId: template.id, kind: 'scorm', title: 'Package', slug: 'package', order: 1 })
      .returning();
    await db.insert(schema.activityScorm).values({ activityId: activity.id, assetId: asset.id });

    const [unused] = await db
      .insert(schema.asset)
      .values({ organizationId: platformOrg.id, kind: 'scorm', title: 'Unused package' })
      .returning();

    try {
      await expect(assetReferencedByGlobalTemplate(asset.id, platformOrg.id)).resolves.toBe(true);
      await expect(assetReferencedByGlobalTemplate(unused.id, platformOrg.id)).resolves.toBe(false);
    } finally {
      await db.delete(schema.activityScorm).where(eq(schema.activityScorm.activityId, activity.id));
      await db.delete(schema.courseActivity).where(eq(schema.courseActivity.courseId, template.id));
      await db.delete(schema.asset).where(eq(schema.asset.organizationId, platformOrg.id));
      await db.delete(schema.course).where(eq(schema.course.id, template.id));
      await db.delete(schema.group).where(eq(schema.group.id, group.id));
      await db.delete(schema.organization).where(eq(schema.organization.id, platformOrg.id));
    }
  });
});
