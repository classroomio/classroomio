import 'dotenv/config';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq, inArray } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

type FixtureCourse = { key: string; tags: number[]; isPublished?: boolean; cost?: number; createdAt: string };

const FIXTURES: FixtureCourse[] = [
  { key: 'source', tags: [0, 1, 2], createdAt: '2026-01-01T00:00:00Z' },
  { key: 'twoShared', tags: [0, 1], createdAt: '2026-01-02T00:00:00Z' },
  { key: 'threeSharedPaid', tags: [0, 1, 2], cost: 1000, createdAt: '2026-01-03T00:00:00Z' },
  { key: 'oneSharedEnrolled', tags: [0], createdAt: '2026-01-04T00:00:00Z' },
  { key: 'oneSharedNewer', tags: [2], createdAt: '2026-01-05T00:00:00Z' },
  { key: 'unpublished', tags: [0, 1, 2], isPublished: false, createdAt: '2026-01-06T00:00:00Z' },
  { key: 'untagged', tags: [], createdAt: '2026-01-07T00:00:00Z' }
];

describe.skipIf(!hasDatabase)('related courses against the database', () => {
  const suffix = Date.now();
  const courseIdByKey = new Map<string, string>();
  const keyByCourseId = new Map<string, string>();
  let organizationId = '';
  let tagGroupId = '';
  let tagIds: string[] = [];
  const groupIds: string[] = [];
  let learnerId = '';

  beforeAll(async () => {
    const { db } = await import('@db/drizzle');
    const { createOrganization } = await import('@db/queries/organization');
    const schema = await import('@db/schema');

    const organization = await createOrganization({ name: `related-${suffix}` });
    organizationId = organization.id;

    const [tagGroupRow] = await db
      .insert(schema.tagGroup)
      .values({ organizationId, name: `Topics ${suffix}`, slug: `topics-${suffix}` })
      .returning();
    tagGroupId = tagGroupRow.id;

    const tagRows = await db
      .insert(schema.tag)
      .values(
        ['a', 'b', 'c'].map((key) => ({
          organizationId,
          groupId: tagGroupId,
          name: `Tag ${key}`,
          slug: `tag-${key}-${suffix}`,
          color: '#000000'
        }))
      )
      .returning({ id: schema.tag.id });
    tagIds = tagRows.map((row) => row.id);

    for (const fixture of FIXTURES) {
      const [groupRow] = await db
        .insert(schema.group)
        .values({ name: `related-${fixture.key}-${suffix}`, organizationId })
        .returning();
      groupIds.push(groupRow.id);

      const [courseRow] = await db
        .insert(schema.course)
        .values({
          title: fixture.key,
          description: 'Course used to verify related course ordering',
          groupId: groupRow.id,
          isPublished: fixture.isPublished ?? true,
          cost: fixture.cost ?? 0,
          createdAt: fixture.createdAt,
          slug: `related-${fixture.key}-${suffix}`
        })
        .returning({ id: schema.course.id });
      courseIdByKey.set(fixture.key, courseRow.id);
      keyByCourseId.set(courseRow.id, fixture.key);

      if (fixture.tags.length > 0) {
        await db
          .insert(schema.tagAssignment)
          .values(fixture.tags.map((index) => ({ tagId: tagIds[index], courseId: courseRow.id })));
      }
    }

    const email = `learner-${suffix}@related.test`;
    const [userRow] = await db.insert(schema.user).values({ name: 'learner', email, emailVerified: true }).returning();
    learnerId = userRow.id;
    await db
      .insert(schema.profile)
      .values({ id: learnerId, fullname: 'learner', username: `learner-${suffix}`, email });

    const [enrolledCourse] = await db
      .select({ groupId: schema.course.groupId })
      .from(schema.course)
      .where(eq(schema.course.id, courseIdByKey.get('oneSharedEnrolled')!));
    await db
      .insert(schema.groupmember)
      .values({ groupId: enrolledCourse.groupId!, roleId: ROLE.STUDENT, profileId: learnerId, email });
  });

  afterAll(async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    if (groupIds.length > 0) {
      await db.delete(schema.course).where(inArray(schema.course.groupId, groupIds));
      await db.delete(schema.groupmember).where(inArray(schema.groupmember.groupId, groupIds));
      await db.delete(schema.group).where(inArray(schema.group.id, groupIds));
    }
    if (tagGroupId) {
      await db.delete(schema.tag).where(eq(schema.tag.groupId, tagGroupId));
      await db.delete(schema.tagGroup).where(eq(schema.tagGroup.id, tagGroupId));
    }
    if (learnerId) {
      await db.delete(schema.profile).where(eq(schema.profile.id, learnerId));
      await db.delete(schema.user).where(eq(schema.user.id, learnerId));
    }
    if (organizationId) {
      await db.delete(schema.organization).where(eq(schema.organization.id, organizationId));
    }
  });

  const related = async (options: { excludeProfileId?: string; pricing?: 'free' | 'paid'; limit?: number } = {}) => {
    const { getRelatedCourses } = await import('@db/queries/tag');
    const rows = await getRelatedCourses(organizationId, courseIdByKey.get('source')!, tagIds, {
      limit: 20,
      ...options
    });

    return rows.map((row) => keyByCourseId.get(row.id));
  };

  it('orders by shared tags, then newest, and leaves out the course itself, unpublished and untagged courses', async () => {
    await expect(related()).resolves.toEqual(['threeSharedPaid', 'twoShared', 'oneSharedNewer', 'oneSharedEnrolled']);
  });

  it("leaves out the learner's courses", async () => {
    await expect(related({ excludeProfileId: learnerId })).resolves.toEqual([
      'threeSharedPaid',
      'twoShared',
      'oneSharedNewer'
    ]);
  });

  it('filters by pricing', async () => {
    await expect(related({ pricing: 'paid' })).resolves.toEqual(['threeSharedPaid']);
    await expect(related({ pricing: 'free' })).resolves.toEqual(['twoShared', 'oneSharedNewer', 'oneSharedEnrolled']);
  });

  it('applies the limit', async () => {
    await expect(related({ limit: 2 })).resolves.toEqual(['threeSharedPaid', 'twoShared']);
  });
});
