import 'dotenv/config';

import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

type PlacementFixture = {
  organizationId: string;
  groupId: string;
  courseId: string;
  sectionId: string;
  profileId: string;
};

async function createPlacementFixture(suffix: string, isContentGroupingEnabled: boolean): Promise<PlacementFixture> {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');

  const [organization] = await db
    .insert(schema.organization)
    .values({ name: `activity-placement-${suffix}` })
    .returning();
  const [group] = await db
    .insert(schema.group)
    .values({ name: `activity-placement-${suffix}`, organizationId: organization.id })
    .returning();
  const [course] = await db
    .insert(schema.course)
    .values({
      title: 'Activity placement',
      description: 'Fixture for activity order claims',
      groupId: group.id,
      slug: `activity-placement-${suffix}`,
      type: 'SELF_PACED' as never,
      status: 'ACTIVE',
      metadata: { isContentGroupingEnabled }
    })
    .returning();
  const [section] = await db
    .insert(schema.courseSection)
    .values({ title: 'Getting started', order: 1, courseId: course.id })
    .returning();

  const userId = crypto.randomUUID();
  await db.insert(schema.user).values({
    id: userId,
    name: `Activity Placement ${suffix}`,
    email: `activity-placement-${suffix}@example.com`
  });
  await db.insert(schema.profile).values({
    id: userId,
    fullname: `Activity Placement ${suffix}`,
    username: `activity-placement-${suffix}`,
    email: `activity-placement-${suffix}@example.com`
  });

  return {
    organizationId: organization.id,
    groupId: group.id,
    courseId: course.id,
    sectionId: section.id,
    profileId: userId
  };
}

async function cleanupPlacementFixture(fixture: PlacementFixture) {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');

  await db.delete(schema.courseActivity).where(eq(schema.courseActivity.courseId, fixture.courseId));
  await db.delete(schema.lesson).where(eq(schema.lesson.courseId, fixture.courseId));
  await db.delete(schema.courseSection).where(eq(schema.courseSection.courseId, fixture.courseId));
  await db.delete(schema.course).where(eq(schema.course.id, fixture.courseId));
  await db.delete(schema.profile).where(eq(schema.profile.id, fixture.profileId));
  await db.delete(schema.user).where(eq(schema.user.id, fixture.profileId));
  await db.delete(schema.group).where(eq(schema.group.id, fixture.groupId));
  await db.delete(schema.organization).where(eq(schema.organization.id, fixture.organizationId));
}

async function createTestActivity(
  courseId: string,
  input: { kind: 'scorm'; title: string; sectionId?: string | null }
) {
  const { db } = await import('@db/drizzle');
  const { claimActivityOrder } = await import('@cio/core/services/course/root-order');
  const { resolveItemSlug } = await import('@cio/core/services/course/slug');
  const { createActivities } = await import('@db/queries/activity');

  return db.transaction(async (tx) => {
    const order = await claimActivityOrder(courseId, input.sectionId ?? null, tx);
    const slug = await resolveItemSlug({ courseId, title: input.title, dbClient: tx });
    const [created] = await createActivities(
      [
        {
          courseId,
          sectionId: input.sectionId ?? null,
          kind: input.kind,
          title: input.title,
          slug,
          order
        }
      ],
      tx
    );
    return created;
  });
}

describe.skipIf(!hasDatabase)('course activity placement', () => {
  it('shares the top-level order space with sections, lessons and exercises', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const { claimActivityOrder, claimItemOrder } = await import('@cio/core/services/course/root-order');
    const { getLastCourseRootOrder } = await import('@db/queries/course');

    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const fixture = await createPlacementFixture(suffix, true);

    try {
      const activity = await createTestActivity(fixture.courseId, {
        kind: 'scorm',
        title: 'Placement package'
      });
      expect(activity.order).toBe(2);

      const claimedOrder = await db.transaction((tx) =>
        claimItemOrder(fixture.courseId, { sectionId: null }, 2, null, tx)
      );
      expect(claimedOrder).toBe(2);

      const [stored] = await db
        .select({ order: schema.courseActivity.order })
        .from(schema.courseActivity)
        .where(eq(schema.courseActivity.id, activity.id));
      expect(stored.order).toBe(3);

      const lastRootOrder = await getLastCourseRootOrder(fixture.courseId, db, 'outline');
      expect(lastRootOrder).toBe(3);

      const nextOrder = await db.transaction((tx) => claimActivityOrder(fixture.courseId, null, tx));
      expect(nextOrder).toBe(4);
    } finally {
      await cleanupPlacementFixture(fixture);
    }
  }, 30000);

  it('appends to the shared list when grouping is off, even inside a section', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const fixture = await createPlacementFixture(suffix, false);

    try {
      const [secondSection] = await db
        .insert(schema.courseSection)
        .values({ title: 'Second section', order: 2, courseId: fixture.courseId })
        .returning();
      await db.insert(schema.lesson).values({
        courseId: fixture.courseId,
        sectionId: fixture.sectionId,
        title: 'First lesson',
        order: 1,
        slug: `activity-placement-first-${suffix}`,
        note: '<p>First.</p>'
      });
      await db.insert(schema.lesson).values({
        courseId: fixture.courseId,
        sectionId: secondSection.id,
        title: 'Second lesson',
        order: 2,
        slug: `activity-placement-second-${suffix}`,
        note: '<p>Second.</p>'
      });

      const activity = await createTestActivity(fixture.courseId, {
        kind: 'scorm',
        sectionId: fixture.sectionId,
        title: 'Section package'
      });
      expect(activity.order).toBe(3);
    } finally {
      await cleanupPlacementFixture(fixture);
    }
  }, 30000);
});
