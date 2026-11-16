import 'dotenv/config';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createCourseCommentFixture, type CourseCommentFixture } from './fixtures/course-comment-fixture';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

describe.skipIf(!hasDatabase)('course comment queries', () => {
  let fixture: CourseCommentFixture;

  beforeAll(async () => {
    fixture = await createCourseCommentFixture('queries');
  });

  afterAll(async () => {
    await fixture?.cleanup();
  });

  async function createThread(values: Record<string, unknown>, authorId: string, body = 'Please check this') {
    const { insertCourseCommentThread, insertCourseComment } = await import('@db/queries/course-comment');
    const thread = await insertCourseCommentThread({
      organizationId: fixture.organizationId,
      courseId: fixture.courseId,
      createdBy: authorId,
      anchorType: 'course',
      ...values
    });
    const comment = await insertCourseComment({ threadId: thread.id, authorId, body, mentions: [] });

    return { thread, comment };
  }

  it('lists the comment team: course admins and tutors plus org admins, never students', async () => {
    const { listCourseCommentTeam } = await import('@db/queries/course-comment');
    const team = await listCourseCommentTeam(fixture.courseId);
    const roles = Object.fromEntries(team.map((member) => [member.profileId, member.role]));

    expect(roles).toEqual({
      [fixture.people.orgAdmin]: 'org_admin',
      [fixture.people.courseAdmin]: 'admin',
      [fixture.people.tutor]: 'tutor'
    });
  });

  it('drops a course tutor who is no longer active in the org', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const { and, eq } = await import('drizzle-orm');
    const { listCourseCommentTeam } = await import('@db/queries/course-comment');

    const deactivate = (status: 'ACTIVE' | 'ARCHIVED') =>
      db
        .update(schema.organizationmember)
        .set({ status })
        .where(
          and(
            eq(schema.organizationmember.profileId, fixture.people.tutor),
            eq(schema.organizationmember.organizationId, fixture.organizationId)
          )
        );

    await deactivate('ARCHIVED');
    const team = await listCourseCommentTeam(fixture.courseId);
    await deactivate('ACTIVE');

    expect(team.map((member) => member.profileId)).not.toContain(fixture.people.tutor);
  });

  it('reads the org switch and course context', async () => {
    const { getCourseCommentCourseContext } = await import('@db/queries/course-comment');
    const context = await getCourseCommentCourseContext(fixture.courseId);

    expect(context).toMatchObject({ organizationId: fixture.organizationId, teamCommentsEnabled: true });
    expect(await getCourseCommentCourseContext('00000000-0000-4000-8000-000000000000')).toBeNull();
  });

  it('enforces the anchor shape checks in the database', async () => {
    const { insertCourseCommentThread } = await import('@db/queries/course-comment');

    await expect(
      insertCourseCommentThread({
        organizationId: fixture.organizationId,
        courseId: fixture.courseId,
        anchorType: 'course',
        lessonId: fixture.lessonId
      })
    ).rejects.toThrow();
    await expect(
      insertCourseCommentThread({
        organizationId: fixture.organizationId,
        courseId: fixture.courseId,
        anchorType: 'text',
        exerciseId: fixture.exerciseId
      })
    ).rejects.toThrow();
  });

  it('scopes threads to their course and counts unread per viewer', async () => {
    const { listCourseCommentThreadRows, getCourseCommentThread, insertCourseComment, upsertCourseCommentThreadRead } =
      await import('@db/queries/course-comment');
    const { thread } = await createThread(
      { anchorType: 'block', lessonId: fixture.lessonId, blockId: fixture.noteBlockId },
      fixture.people.tutor
    );

    expect(await getCourseCommentThread(fixture.otherCourseId, thread.id)).toBeNull();
    expect((await getCourseCommentThread(fixture.courseId, thread.id))?.id).toBe(thread.id);

    const [asAdmin] = await listCourseCommentThreadRows({
      courseId: fixture.courseId,
      viewerId: fixture.people.courseAdmin,
      status: 'open',
      threadIds: [thread.id]
    });
    const [asTutor] = await listCourseCommentThreadRows({
      courseId: fixture.courseId,
      viewerId: fixture.people.tutor,
      status: 'open',
      threadIds: [thread.id]
    });

    expect(asAdmin.unreadCount).toBe(1);
    expect(asAdmin.blockPlaced).toBe(true);
    expect(asAdmin.blockType).toBe('note');
    expect(asAdmin.lessonTitle).toBe('pricing lesson');
    expect(asTutor.unreadCount).toBe(0);

    await upsertCourseCommentThreadRead(thread.id, fixture.people.courseAdmin);
    await new Promise((resolve) => setTimeout(resolve, 5));
    await insertCourseComment({ threadId: thread.id, authorId: fixture.people.tutor, body: 'One more', mentions: [] });

    const [afterReply] = await listCourseCommentThreadRows({
      courseId: fixture.courseId,
      viewerId: fixture.people.courseAdmin,
      status: 'all',
      threadIds: [thread.id]
    });

    expect(afterReply.unreadCount).toBe(1);
  });

  it('resolves once, reopens, and reports unread as zero while resolved', async () => {
    const { setCourseCommentThreadStatus, listCourseCommentThreadRows } = await import('@db/queries/course-comment');
    const { thread } = await createThread({}, fixture.people.tutor);

    const resolved = await setCourseCommentThreadStatus({
      threadId: thread.id,
      status: 'resolved',
      actorId: fixture.people.courseAdmin
    });
    const resolvedAgain = await setCourseCommentThreadStatus({
      threadId: thread.id,
      status: 'resolved',
      actorId: fixture.people.courseAdmin
    });

    expect(resolved?.resolvedBy).toBe(fixture.people.courseAdmin);
    expect(resolved?.resolvedAt).toBeTruthy();
    expect(resolvedAgain).toBeNull();

    const [row] = await listCourseCommentThreadRows({
      courseId: fixture.courseId,
      viewerId: fixture.people.orgAdmin,
      status: 'resolved',
      threadIds: [thread.id]
    });

    expect(row.unreadCount).toBe(0);
    expect(row.resolverFullname).toBe('course-admin');

    const reopened = await setCourseCommentThreadStatus({
      threadId: thread.id,
      status: 'open',
      actorId: fixture.people.tutor
    });

    expect(reopened?.resolvedBy).toBeNull();
    expect(reopened?.resolvedAt).toBeNull();
  });

  it('lists participants from authors, mentions and the creator', async () => {
    const { insertCourseComment, listCourseCommentThreadParticipantIds, getFirstCourseCommentId } = await import(
      '@db/queries/course-comment'
    );
    const { thread, comment } = await createThread({}, fixture.people.tutor);

    await insertCourseComment({
      threadId: thread.id,
      authorId: fixture.people.courseAdmin,
      body: '@org-admin can you look?',
      mentions: [{ profileId: fixture.people.orgAdmin, start: 0, end: 10 }]
    });

    const participants = await listCourseCommentThreadParticipantIds(thread.id);

    expect(new Set(participants)).toEqual(
      new Set([fixture.people.tutor, fixture.people.courseAdmin, fixture.people.orgAdmin])
    );
    expect(await getFirstCourseCommentId(thread.id)).toBe(comment.id);
  });

  it('summarizes open threads with placement and unread state', async () => {
    const { listOpenCourseCommentSummaryRows } = await import('@db/queries/course-comment');
    const { thread: placed } = await createThread(
      { anchorType: 'point', lessonId: fixture.lessonId, blockId: fixture.imageBlockId, anchor: { x: 10, y: 20 } },
      fixture.people.tutor
    );
    const { thread: unplaced } = await createThread(
      { anchorType: 'block', lessonId: fixture.lessonId, blockId: fixture.unplacedBlockId },
      fixture.people.tutor
    );

    const rows = await listOpenCourseCommentSummaryRows(fixture.courseId, fixture.people.courseAdmin);
    const byId = new Map(rows.map((row) => [row.threadId, row]));

    expect(byId.get(placed.id)).toMatchObject({ blockPlaced: true, unread: true, anchorType: 'point' });
    expect(byId.get(unplaced.id)).toMatchObject({ blockPlaced: false });
    expect(rows.every((row) => row.anchorType)).toBe(true);
  });

  it('finds and updates text anchors for one block and locale', async () => {
    const { listCourseCommentTextAnchorsForBlock, updateCourseCommentTextAnchors, getCourseCommentThread } =
      await import('@db/queries/course-comment');
    const { thread } = await createThread(
      {
        anchorType: 'text',
        lessonId: fixture.lessonId,
        blockId: fixture.noteBlockId,
        anchor: { locale: 'en', quote: 'guess their price', prefix: 'Yet most founders ', suffix: ' in', start: 63 }
      },
      fixture.people.tutor
    );

    const anchors = await listCourseCommentTextAnchorsForBlock(fixture.noteBlockId, 'en');
    expect(anchors.map((anchor) => anchor.id)).toContain(thread.id);
    expect(await listCourseCommentTextAnchorsForBlock(fixture.noteBlockId, 'fr')).toEqual([]);

    await updateCourseCommentTextAnchors([{ id: thread.id, start: 70, textDetached: false }]);
    expect((await getCourseCommentThread(fixture.courseId, thread.id))?.anchor.start).toBe(70);

    await updateCourseCommentTextAnchors([{ id: thread.id, start: null, textDetached: true }]);
    const detached = await getCourseCommentThread(fixture.courseId, thread.id);

    expect(detached?.textDetached).toBe(true);
    expect(detached?.anchor.start).toBe(70);
    expect(detached?.anchor.quote).toBe('guess their price');
  });

  it('keeps comments when a block or question is deleted and cascades with the lesson', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const { eq } = await import('drizzle-orm');
    const { getCourseCommentThread } = await import('@db/queries/course-comment');

    const [question] = await db
      .insert(schema.question)
      .values({ exerciseId: fixture.exerciseId, title: 'Temporary', questionTypeId: 1 })
      .returning();
    const { thread: questionThread } = await createThread(
      { anchorType: 'question', exerciseId: fixture.exerciseId, questionId: question.id },
      fixture.people.tutor
    );

    await db.delete(schema.question).where(eq(schema.question.id, question.id));
    const orphaned = await getCourseCommentThread(fixture.courseId, questionThread.id);

    expect(orphaned?.questionId).toBeNull();
    expect(orphaned?.exerciseId).toBe(fixture.exerciseId);
    expect(orphaned?.anchorType).toBe('question');

    const [lesson] = await db
      .insert(schema.lesson)
      .values({ courseId: fixture.courseId, title: 'Temporary', slug: `temporary-${Date.now()}`, order: 9 })
      .returning();
    const { thread: lessonThread } = await createThread(
      { anchorType: 'page', lessonId: lesson.id },
      fixture.people.tutor
    );

    await db.delete(schema.lesson).where(eq(schema.lesson.id, lesson.id));

    expect(await getCourseCommentThread(fixture.courseId, lessonThread.id)).toBeNull();
  });

  it('keeps comments of a deleted account with an audit name', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const { eq } = await import('drizzle-orm');
    const { snapshotDeletedProfileInComments, listCourseCommentsForThreads } = await import(
      '@db/queries/course-comment'
    );

    const email = `gone-${Date.now()}@course-comments.test`;
    const [userRow] = await db.insert(schema.user).values({ name: 'gone', email, emailVerified: true }).returning();
    await db
      .insert(schema.profile)
      .values({ id: userRow.id, fullname: 'Gone Person', username: `gone-${Date.now()}`, email });

    const { thread } = await createThread({}, userRow.id, 'I will leave');
    await snapshotDeletedProfileInComments(userRow.id, 'Gone Person');
    await db.delete(schema.profile).where(eq(schema.profile.id, userRow.id));
    await db.delete(schema.user).where(eq(schema.user.id, userRow.id));

    const [comment] = await listCourseCommentsForThreads([thread.id]);
    const [stored] = await db.select().from(schema.courseComment).where(eq(schema.courseComment.id, comment.id));

    expect(comment.authorId).toBeNull();
    expect(comment.authorFullname).toBeNull();
    expect(stored.authorDeletedName).toBe('Gone Person');
  });

  it('stores notifications per recipient and tracks read and emailed state', async () => {
    const {
      insertNotifications,
      listNotificationsForRecipient,
      countUnreadNotifications,
      markNotificationRead,
      listPendingCourseCommentDigestNotifications,
      markNotificationsEmailed,
      markCourseCommentThreadNotificationsRead
    } = await import('@db/queries/notifications');
    const { thread, comment } = await createThread({}, fixture.people.tutor, 'Notify me');

    const [first, second] = await insertNotifications([
      {
        organizationId: fixture.organizationId,
        recipientId: fixture.people.courseAdmin,
        actorId: fixture.people.tutor,
        kind: 'course_comment.mentioned',
        courseId: fixture.courseId,
        courseCommentThreadId: thread.id,
        courseCommentId: comment.id
      },
      {
        organizationId: fixture.organizationId,
        recipientId: fixture.people.courseAdmin,
        actorId: fixture.people.tutor,
        kind: 'course_comment.replied',
        courseId: fixture.courseId,
        courseCommentThreadId: thread.id,
        courseCommentId: comment.id
      }
    ]);

    const page = await listNotificationsForRecipient({
      recipientId: fixture.people.courseAdmin,
      organizationId: fixture.organizationId,
      limit: 10
    });

    expect(page.map((row) => row.id)).toEqual(expect.arrayContaining([first.id, second.id]));
    expect(page[0]).toMatchObject({ actorFullname: 'tutor', courseTitle: 'pricing', commentBody: 'Notify me' });
    expect(await countUnreadNotifications(fixture.people.courseAdmin, fixture.organizationId)).toBe(2);

    expect(await markNotificationRead(first.id, fixture.people.tutor)).toBe(false);
    expect(await markNotificationRead(first.id, fixture.people.courseAdmin)).toBe(true);

    const pending = await listPendingCourseCommentDigestNotifications(thread.id, fixture.people.courseAdmin);
    expect(pending.map((row) => row.id)).toEqual([second.id]);

    await markNotificationsEmailed([second.id]);
    expect(await listPendingCourseCommentDigestNotifications(thread.id, fixture.people.courseAdmin)).toEqual([]);

    await markCourseCommentThreadNotificationsRead([thread.id], fixture.people.courseAdmin);
    expect(await countUnreadNotifications(fixture.people.courseAdmin, fixture.organizationId)).toBe(0);
  });
});
