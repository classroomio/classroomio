import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { db } from '@cio/db/drizzle';
import {
  countPublishedCoursesBySiteName,
  getExploreCourses,
  getOrgCourses,
  getPublishedCoursesBySiteName
} from '@cio/db/queries/course';
import * as schema from '@cio/db/schema';
import { updateCourse } from '@cio/core/services/course/course';

import { getCourseLandingPage } from '@api/services/course/landing-page';
import { enrollInCourse } from '@api/services/course/invite';
import { AppError } from '@api/utils/errors';

const shouldRun = Boolean(process.env.TEST_DATABASE_URL);

describe.skipIf(!shouldRun)('private courses (database)', () => {
  const orgId = randomUUID();
  const siteName = `private-${orgId.slice(0, 8)}`;
  let publicCourseId: string;
  let privateCourseId: string;
  let publicTypeCourseId: string;

  beforeAll(async () => {
    await db.insert(schema.organization).values({ id: orgId, name: `Private test ${siteName}`, siteName });
    const [group] = await db.insert(schema.group).values({ name: 'Private test', organizationId: orgId }).returning();

    async function insertCourse(title: string, values: Partial<typeof schema.course.$inferInsert>) {
      const [row] = await db
        .insert(schema.course)
        .values({
          title,
          description: '',
          groupId: group.id,
          slug: `${siteName}-${title.toLowerCase().replace(/\s+/g, '-')}`,
          isPublished: true,
          status: 'ACTIVE',
          ...values
        })
        .returning();

      return row.id;
    }

    publicCourseId = await insertCourse('Open course', {});
    privateCourseId = await insertCourse('Hidden course', { isPrivate: true });
    publicTypeCourseId = await insertCourse('Public type course', { type: 'PUBLIC' });
  });

  afterAll(async () => {
    await db.delete(schema.course).where(eq(schema.course.slug, `${siteName}-open-course`));
    await db.delete(schema.course).where(eq(schema.course.slug, `${siteName}-hidden-course`));
    await db.delete(schema.course).where(eq(schema.course.slug, `${siteName}-public-type-course`));
    await db.delete(schema.group).where(eq(schema.group.organizationId, orgId));
    await db.delete(schema.organization).where(eq(schema.organization.id, orgId));
  });

  it('leaves private courses out of the org landing page catalog and its count', async () => {
    const courses = await getPublishedCoursesBySiteName(siteName);
    const total = await countPublishedCoursesBySiteName(siteName);
    const ids = courses.map((course) => course.id);

    expect(ids).toContain(publicCourseId);
    expect(ids).not.toContain(privateCourseId);
    expect(total).toBe(courses.length);
  });

  it('leaves private courses out of the student explore list', async () => {
    const result = await getExploreCourses({ orgId, profileId: randomUUID() });
    const ids = result.data.map((course) => course.id);

    expect(ids).toContain(publicCourseId);
    expect(ids).not.toContain(privateCourseId);
  });

  it('still lists private courses for staff and filters them with the private status', async () => {
    const all = await getOrgCourses({ orgId });
    const onlyPrivate = await getOrgCourses({ orgId, publishedStatus: 'private' });

    expect(all.items.map((course) => course.id)).toContain(privateCourseId);
    expect(onlyPrivate.items.map((course) => course.id)).toEqual([privateCourseId]);
  });

  it('rejects self-enrollment into a private course', async () => {
    await expect(
      enrollInCourse(privateCourseId, { id: randomUUID(), email: 'student@example.com' } as never, {})
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('returns not found for the landing page of a private course', async () => {
    await expect(getCourseLandingPage(`${siteName}-hidden-course`)).rejects.toBeInstanceOf(AppError);
    await expect(getCourseLandingPage(`${siteName}-open-course`)).resolves.toBeDefined();
  });

  it('turns self-enrollment off when a course becomes private', async () => {
    const result = await updateCourse(publicCourseId, { isPrivate: true });
    const [row] = await db.select().from(schema.course).where(eq(schema.course.id, publicCourseId));

    expect(result).toBeDefined();
    expect(row.isPrivate).toBe(true);
    expect(row.metadata?.allowSelfEnrollment).toBe(false);

    await db.update(schema.course).set({ isPrivate: false, metadata: {} }).where(eq(schema.course.id, publicCourseId));
  });

  it('refuses to make a PUBLIC-type course private', async () => {
    await expect(updateCourse(publicTypeCourseId, { isPrivate: true })).rejects.toMatchObject({ statusCode: 400 });
  });
});
