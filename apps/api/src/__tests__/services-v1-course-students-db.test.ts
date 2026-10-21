import 'dotenv/config';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

describe.skipIf(!hasDatabase)('listCourseStudentsService database pagination', () => {
  const studentEmails = [
    'student-1@pagination.test',
    'student-2@pagination.test',
    'student-3@pagination.test',
    'student-4@pagination.test',
    'student-5@pagination.test',
    'student-6@pagination.test',
    'student-7@pagination.test'
  ];
  const tutorEmails = ['tutor-1@pagination.test', 'tutor-2@pagination.test'];

  let organizationId = '';
  let groupId = '';
  let courseId = '';

  beforeAll(async () => {
    const { db } = await import('@db/drizzle');
    const { createOrganization } = await import('@db/queries/organization');
    const schema = await import('@db/schema');

    const suffix = Date.now();
    const organization = await createOrganization({ name: `pagination-${suffix}` });

    organizationId = organization.id;

    const [groupRow] = await db
      .insert(schema.group)
      .values({ name: `pagination-${suffix}`, organizationId })
      .returning();

    groupId = groupRow.id;

    const [courseRow] = await db
      .insert(schema.course)
      .values({
        title: 'Pagination fixture',
        description: 'Course used to verify student pagination against the database',
        groupId,
        slug: `pagination-${suffix}`
      })
      .returning();

    courseId = courseRow.id;

    const memberRows = [
      ...studentEmails.map((email) => ({ groupId, roleId: ROLE.STUDENT, email })),
      ...tutorEmails.map((email) => ({ groupId, roleId: ROLE.TUTOR, email }))
    ];

    await db.insert(schema.groupmember).values(memberRows);
  });

  afterAll(async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    if (groupId) {
      await db.delete(schema.groupmember).where(eq(schema.groupmember.groupId, groupId));
      await db.delete(schema.course).where(eq(schema.course.groupId, groupId));
      await db.delete(schema.group).where(eq(schema.group.id, groupId));
    }

    if (organizationId) {
      await db.delete(schema.organization).where(eq(schema.organization.id, organizationId));
    }
  });

  it('returns only students, one page at a time, with a consistent total', async () => {
    const { listCourseStudentsService } = await import('@api/services/v1/courses/course');

    const firstPage = await listCourseStudentsService(organizationId, { courseId }, { page: 1, limit: 3 });
    const secondPage = await listCourseStudentsService(organizationId, { courseId }, { page: 2, limit: 3 });
    const thirdPage = await listCourseStudentsService(organizationId, { courseId }, { page: 3, limit: 3 });

    expect(firstPage.items).toHaveLength(3);
    expect(secondPage.items).toHaveLength(3);
    expect(thirdPage.items).toHaveLength(1);
    expect(firstPage.total).toBe(7);
    expect(secondPage.total).toBe(7);
    expect(thirdPage.total).toBe(7);
    expect(firstPage.totalPages).toBe(3);
    expect(firstPage.page).toBe(1);
    expect(firstPage.limit).toBe(3);

    const seenIds = new Set<string>();
    const returnedEmails: Array<string | null> = [];

    for (const member of [...firstPage.items, ...secondPage.items, ...thirdPage.items]) {
      expect(member.roleId).toBe(ROLE.STUDENT);
      expect(seenIds.has(member.id)).toBe(false);

      seenIds.add(member.id);
      returnedEmails.push(member.email);
    }

    expect(seenIds.size).toBe(7);
    expect([...returnedEmails].sort()).toEqual(studentEmails.slice().sort());
    for (const tutorEmail of tutorEmails) {
      expect(returnedEmails).not.toContain(tutorEmail);
    }
  });

  it('returns an empty page beyond the last one while keeping the total intact', async () => {
    const { listCourseStudentsService } = await import('@api/services/v1/courses/course');

    const beyondLastPage = await listCourseStudentsService(organizationId, { courseId }, { page: 4, limit: 3 });

    expect(beyondLastPage.items).toHaveLength(0);
    expect(beyondLastPage.total).toBe(7);
    expect(beyondLastPage.totalPages).toBe(3);
    expect(beyondLastPage.page).toBe(4);
    expect(beyondLastPage.limit).toBe(3);
  });
});
