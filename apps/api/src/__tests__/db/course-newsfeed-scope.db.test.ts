import { eq, inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { db } from '@cio/db/drizzle';
import * as schema from '@cio/db/schema';
import { createNewsfeed, deleteNewsfeed, getNewsfeedById, updateNewsfeed } from '@cio/db/queries/newsfeed';
import { createOrganization } from '@cio/db/queries/organization';

const shouldRun = Boolean(process.env.TEST_DATABASE_URL);

describe.skipIf(!shouldRun)('course newsfeed queries are scoped to their course (database)', () => {
  const suffix = `${Date.now()}`;
  const organizationIds: string[] = [];
  const groupIds: string[] = [];
  let attackerCourseId = '';
  let victimCourseId = '';
  let victimFeedId = '';

  const createOrgCourse = async (label: string) => {
    const organization = await createOrganization({ name: `newsfeed-scope-${label}-${suffix}` });
    organizationIds.push(organization.id);
    const [group] = await db
      .insert(schema.group)
      .values({ name: `newsfeed-scope-${label}-${suffix}`, organizationId: organization.id })
      .returning();
    groupIds.push(group.id);
    const [course] = await db
      .insert(schema.course)
      .values({ title: `${label} course`, description: 'Newsfeed scope fixture', groupId: group.id })
      .returning();

    return course.id;
  };

  beforeAll(async () => {
    attackerCourseId = await createOrgCourse('attacker');
    victimCourseId = await createOrgCourse('victim');
    victimFeedId = (await createNewsfeed({ courseId: victimCourseId, content: 'Victim announcement' })).id;
  });

  afterAll(async () => {
    if (victimCourseId) {
      await db.delete(schema.courseNewsfeed).where(eq(schema.courseNewsfeed.courseId, victimCourseId));
    }
    if (groupIds.length > 0) {
      await db.delete(schema.course).where(inArray(schema.course.groupId, groupIds));
      await db.delete(schema.group).where(inArray(schema.group.id, groupIds));
    }
    if (organizationIds.length > 0) {
      await db.delete(schema.organization).where(inArray(schema.organization.id, organizationIds));
    }
  });

  it('does not read, update or delete another course’s announcement', async () => {
    expect(await getNewsfeedById(attackerCourseId, victimFeedId)).toBeNull();
    expect(await updateNewsfeed(attackerCourseId, victimFeedId, { content: 'Edited' })).toBeNull();
    expect(await deleteNewsfeed(attackerCourseId, victimFeedId)).toBeNull();

    const untouched = await getNewsfeedById(victimCourseId, victimFeedId);
    expect(untouched?.content).toBe('Victim announcement');
  });

  it('still reads, updates and deletes an announcement of its own course', async () => {
    expect((await updateNewsfeed(victimCourseId, victimFeedId, { content: 'Updated' }))?.content).toBe('Updated');
    expect((await deleteNewsfeed(victimCourseId, victimFeedId))?.id).toBe(victimFeedId);
    expect(await getNewsfeedById(victimCourseId, victimFeedId)).toBeNull();
  });
});
