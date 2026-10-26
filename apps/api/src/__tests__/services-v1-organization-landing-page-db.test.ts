import 'dotenv/config';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

describe.skipIf(!hasDatabase)('featured courses against the database', () => {
  let organizationId = '';
  let groupId = '';
  let courseIds: string[] = [];

  beforeAll(async () => {
    const { db } = await import('@db/drizzle');
    const { createOrganization } = await import('@db/queries/organization');
    const schema = await import('@db/schema');

    const suffix = Date.now();
    const organization = await createOrganization({ name: `featured-${suffix}` });
    organizationId = organization.id;

    const [groupRow] = await db
      .insert(schema.group)
      .values({ name: `featured-${suffix}`, organizationId })
      .returning();
    groupId = groupRow.id;

    const rows = await db
      .insert(schema.course)
      .values(
        ['a', 'b', 'c'].map((key) => ({
          title: `Featured ${key}`,
          description: 'Course used to verify featured course ordering',
          groupId,
          isPublished: true,
          slug: `featured-${key}-${suffix}`
        }))
      )
      .returning({ id: schema.course.id });
    courseIds = rows.map((row) => row.id);
  });

  afterAll(async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    if (groupId) {
      await db.delete(schema.course).where(eq(schema.course.groupId, groupId));
      await db.delete(schema.group).where(eq(schema.group.id, groupId));
    }

    if (organizationId) {
      await db.delete(schema.organization).where(eq(schema.organization.id, organizationId));
    }
  });

  it('leaves exactly one of two concurrent lists in place', async () => {
    const { db } = await import('@db/drizzle');
    const { reorderOrgCourses } = await import('@db/queries/course');
    const schema = await import('@db/schema');
    const [a, b, c] = courseIds;

    await reorderOrgCourses(organizationId, [{ id: c, order: 0 }]);

    const results = await Promise.allSettled([
      reorderOrgCourses(organizationId, [
        { id: a, order: 0 },
        { id: b, order: 1 }
      ]),
      reorderOrgCourses(organizationId, [
        { id: b, order: 0 },
        { id: c, order: 1 }
      ])
    ]);
    expect(results.map((result) => result.status)).toEqual(['fulfilled', 'fulfilled']);

    const rows = await db
      .select({ id: schema.course.id, displayOrder: schema.course.displayOrder })
      .from(schema.course)
      .where(eq(schema.course.groupId, groupId));
    const order = Object.fromEntries(rows.map((row) => [row.id, row.displayOrder]));

    expect([
      { [a]: 0, [b]: 1, [c]: null },
      { [a]: null, [b]: 0, [c]: 1 }
    ]).toContainEqual(order);
  });
});
