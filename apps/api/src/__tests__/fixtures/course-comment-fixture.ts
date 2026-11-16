import { eq, inArray } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';

export const NOTE_HTML =
  '<p>Pricing is the fastest lever a business has.</p>' +
  '<p>Yet most founders guess their price in an afternoon and never look at it again.</p>';

export interface CourseCommentFixture {
  organizationId: string;
  otherOrganizationId: string;
  courseId: string;
  otherCourseId: string;
  lessonId: string;
  otherLessonId: string;
  exerciseId: string;
  questionId: number;
  noteBlockId: string;
  videoBlockId: string;
  imageBlockId: string;
  unplacedBlockId: string;
  people: {
    orgAdmin: string;
    courseAdmin: string;
    tutor: string;
    student: string;
    orgTutorNotOnCourse: string;
    otherOrgAdmin: string;
  };
  cleanup: () => Promise<void>;
}

/**
 * Builds two organizations with a course each and one person per role the comment rules care
 * about. Every row is removed by `cleanup`.
 */
export async function createCourseCommentFixture(label: string): Promise<CourseCommentFixture> {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');
  const { createOrganization, createOrganizationMember } = await import('@db/queries/organization');

  const suffix = `${label}-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  const userIds: string[] = [];

  const organization = await createOrganization({ name: `cc-${suffix}` });
  const otherOrganization = await createOrganization({ name: `cc-other-${suffix}` });

  async function createPerson(name: string, organizationId: string, orgRoleId: number): Promise<string> {
    const email = `${name}-${suffix}@course-comments.test`;
    const [userRow] = await db.insert(schema.user).values({ name, email, emailVerified: true }).returning();

    await db.insert(schema.profile).values({ id: userRow.id, fullname: name, username: `${name}-${suffix}`, email });
    await createOrganizationMember({
      organizationId,
      roleId: orgRoleId,
      profileId: userRow.id,
      email,
      verified: true,
      status: 'ACTIVE'
    });
    userIds.push(userRow.id);

    return userRow.id;
  }

  const people = {
    orgAdmin: await createPerson('org-admin', organization.id, ROLE.ADMIN),
    courseAdmin: await createPerson('course-admin', organization.id, ROLE.TUTOR),
    tutor: await createPerson('tutor', organization.id, ROLE.TUTOR),
    student: await createPerson('student', organization.id, ROLE.STUDENT),
    orgTutorNotOnCourse: await createPerson('org-tutor', organization.id, ROLE.TUTOR),
    otherOrgAdmin: await createPerson('other-admin', otherOrganization.id, ROLE.ADMIN)
  };

  async function createCourse(organizationId: string, title: string) {
    const [group] = await db
      .insert(schema.group)
      .values({ name: `${title}-${suffix}`, organizationId })
      .returning();
    const [course] = await db
      .insert(schema.course)
      .values({ title, description: title, groupId: group.id, slug: `${title}-${suffix}` })
      .returning();
    const [lesson] = await db
      .insert(schema.lesson)
      .values({ courseId: course.id, title: `${title} lesson`, slug: `${title}-lesson-${suffix}`, order: 1 })
      .returning();

    return { groupId: group.id, courseId: course.id, lessonId: lesson.id };
  }

  const main = await createCourse(organization.id, 'pricing');
  const other = await createCourse(otherOrganization.id, 'other');

  await db.insert(schema.groupmember).values([
    { groupId: main.groupId, roleId: ROLE.ADMIN, profileId: people.courseAdmin, email: `ca-${suffix}@x.test` },
    { groupId: main.groupId, roleId: ROLE.TUTOR, profileId: people.tutor, email: `t-${suffix}@x.test` },
    { groupId: main.groupId, roleId: ROLE.STUDENT, profileId: people.student, email: `s-${suffix}@x.test` }
  ]);

  const [noteBlock, videoBlock, imageBlock, unplacedBlock] = await db
    .insert(schema.block)
    .values([
      { organizationId: organization.id, type: 'note', data: {} },
      {
        organizationId: organization.id,
        type: 'video',
        data: { type: 'youtube', link: 'https://youtu.be/pricing' }
      },
      { organizationId: organization.id, type: 'image', data: { url: 'https://example.com/plans.png' } },
      { organizationId: organization.id, type: 'note', data: {} }
    ])
    .returning();

  await db.insert(schema.blockPlacement).values([
    { lessonId: main.lessonId, blockId: noteBlock.id, position: 'a0' },
    { lessonId: main.lessonId, blockId: videoBlock.id, position: 'a1' },
    { lessonId: main.lessonId, blockId: imageBlock.id, position: 'a2' }
  ]);
  await db.insert(schema.blockLocale).values({ blockId: noteBlock.id, locale: 'en', content: NOTE_HTML });

  const [exercise] = await db
    .insert(schema.exercise)
    .values({ title: 'Quiz', slug: `quiz-${suffix}`, order: 2, courseId: main.courseId })
    .returning();
  const [question] = await db
    .insert(schema.question)
    .values({ exerciseId: exercise.id, title: 'Which method starts from the customer?', questionTypeId: 1 })
    .returning();

  async function cleanup() {
    const courseIds = [main.courseId, other.courseId];
    const groupIds = [main.groupId, other.groupId];
    const organizationIds = [organization.id, otherOrganization.id];

    await db.delete(schema.notification).where(inArray(schema.notification.organizationId, organizationIds));
    await db.delete(schema.courseCommentThread).where(inArray(schema.courseCommentThread.courseId, courseIds));
    await db.delete(schema.exercise).where(inArray(schema.exercise.courseId, courseIds));
    await db.delete(schema.lesson).where(inArray(schema.lesson.courseId, courseIds));
    await db.delete(schema.block).where(inArray(schema.block.organizationId, organizationIds));
    await db.delete(schema.groupmember).where(inArray(schema.groupmember.groupId, groupIds));
    await db.delete(schema.course).where(inArray(schema.course.id, courseIds));
    await db.delete(schema.group).where(inArray(schema.group.id, groupIds));
    await db
      .delete(schema.organizationmember)
      .where(inArray(schema.organizationmember.organizationId, organizationIds));
    for (const organizationId of organizationIds) {
      await db.delete(schema.organization).where(eq(schema.organization.id, organizationId));
    }
    await db.delete(schema.profile).where(inArray(schema.profile.id, userIds));
    await db.delete(schema.user).where(inArray(schema.user.id, userIds));
  }

  return {
    organizationId: organization.id,
    otherOrganizationId: otherOrganization.id,
    courseId: main.courseId,
    otherCourseId: other.courseId,
    lessonId: main.lessonId,
    otherLessonId: other.lessonId,
    exerciseId: exercise.id,
    questionId: question.id,
    noteBlockId: noteBlock.id,
    videoBlockId: videoBlock.id,
    imageBlockId: imageBlock.id,
    unplacedBlockId: unplacedBlock.id,
    people,
    cleanup
  };
}
