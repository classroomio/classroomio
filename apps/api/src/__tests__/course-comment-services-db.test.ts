import 'dotenv/config';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createCourseCommentFixture, NOTE_HTML, type CourseCommentFixture } from './fixtures/course-comment-fixture';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

describe.skipIf(!hasDatabase)('course comment services', () => {
  let fixture: CourseCommentFixture;

  beforeAll(async () => {
    fixture = await createCourseCommentFixture('services');
  });

  afterAll(async () => {
    await fixture?.cleanup();
  });

  async function services() {
    const threads = await import('@cio/core/services/course-comment/threads');
    const comments = await import('@cio/core/services/course-comment/comments');

    return { ...threads, ...comments };
  }

  async function startThread(actorId: string, markup: string, anchor: Record<string, unknown> = { type: 'course' }) {
    const { createCourseCommentThread } = await services();
    const { fromMentionMarkup } = await import('@cio/utils/functions/course-comment-mentions');
    const { ZCreateCourseCommentThread } = await import('@cio/utils/validation/course-comment');
    const data = ZCreateCourseCommentThread.parse({ ...fromMentionMarkup(markup), anchor });

    return createCourseCommentThread({ courseId: fixture.courseId, actorId, data });
  }

  async function notificationsFor(recipientId: string) {
    const { listNotificationsForRecipient } = await import('@db/queries/notifications');

    return listNotificationsForRecipient({ recipientId, organizationId: fixture.organizationId, limit: 50 });
  }

  async function expectAppError(promise: Promise<unknown>, status: number, code: string) {
    await expect(promise).rejects.toMatchObject({ statusCode: status, code });
  }

  it('lets course admins, tutors and org admins in, and keeps students and outsiders out', async () => {
    const { isCourseTeamMemberOrOrgAdmin } = await import('@db/queries/group');
    const access = async (profileId: string) => isCourseTeamMemberOrOrgAdmin(fixture.courseId, profileId);

    expect(await access(fixture.people.orgAdmin)).toBe(true);
    expect(await access(fixture.people.courseAdmin)).toBe(true);
    expect(await access(fixture.people.tutor)).toBe(true);
    expect(await access(fixture.people.student)).toBe(false);
    expect(await access(fixture.people.orgTutorNotOnCourse)).toBe(false);
    expect(await access(fixture.people.otherOrgAdmin)).toBe(false);
  });

  it('creates a thread, notifies only team mentions, and never the author', async () => {
    const markup =
      `Can @[Tutor](user:${fixture.people.tutor}) check this? ` +
      `Also @[Student](user:${fixture.people.student}) and @[Me](user:${fixture.people.courseAdmin})`;
    const thread = await startThread(fixture.people.courseAdmin, markup);

    expect(thread.status).toBe('open');
    expect(thread.comments).toHaveLength(1);
    expect(thread.comments[0].mentions.map((mention) => mention.profileId)).toEqual([
      fixture.people.tutor,
      fixture.people.courseAdmin
    ]);

    const tutorRows = await notificationsFor(fixture.people.tutor);
    expect(tutorRows.filter((row) => row.threadId === thread.id).map((row) => row.kind)).toEqual([
      'course_comment.mentioned'
    ]);
    expect((await notificationsFor(fixture.people.student)).some((row) => row.threadId === thread.id)).toBe(false);
    expect((await notificationsFor(fixture.people.courseAdmin)).some((row) => row.threadId === thread.id)).toBe(false);
  });

  it('rejects anchors that point outside the course or at the wrong block kind', async () => {
    const otherLesson = startThread(fixture.people.courseAdmin, 'Wrong course', {
      type: 'page',
      page: { lessonId: fixture.otherLessonId }
    });
    await expectAppError(otherLesson, 400, 'COURSE_COMMENT_ANCHOR_INVALID');

    const timeOnNote = startThread(fixture.people.courseAdmin, 'Wrong kind', {
      type: 'time',
      lessonId: fixture.lessonId,
      blockId: fixture.noteBlockId,
      seconds: 12
    });
    await expectAppError(timeOnNote, 400, 'COURSE_COMMENT_ANCHOR_INVALID');

    const unplaced = startThread(fixture.people.courseAdmin, 'Not on this lesson', {
      type: 'block',
      lessonId: fixture.lessonId,
      blockId: fixture.unplacedBlockId
    });
    await expectAppError(unplaced, 400, 'COURSE_COMMENT_ANCHOR_INVALID');
  });

  it('returns 404 for a thread read through another course', async () => {
    const { readCourseCommentThread } = await services();
    const thread = await startThread(fixture.people.courseAdmin, 'Scoped to this course');

    await expectAppError(
      readCourseCommentThread(fixture.otherCourseId, thread.id, fixture.people.otherOrgAdmin),
      404,
      'COURSE_COMMENT_THREAD_NOT_FOUND'
    );
  });

  it('reopens a resolved thread on reply and tells the participants', async () => {
    const { replyToCourseCommentThread, resolveCourseCommentThread } = await services();
    const thread = await startThread(fixture.people.tutor, 'Typo in the intro');

    const resolved = await resolveCourseCommentThread({
      courseId: fixture.courseId,
      threadId: thread.id,
      actorId: fixture.people.courseAdmin
    });
    expect(resolved.status).toBe('resolved');
    expect(resolved.resolvedBy?.profileId).toBe(fixture.people.courseAdmin);

    const resolvedRows = await notificationsFor(fixture.people.tutor);
    expect(resolvedRows.some((row) => row.threadId === thread.id && row.kind === 'course_comment.resolved')).toBe(true);

    const reopened = await replyToCourseCommentThread({
      courseId: fixture.courseId,
      threadId: thread.id,
      actorId: fixture.people.orgAdmin,
      data: { body: 'Still there on mobile', mentions: [] }
    });
    expect(reopened.status).toBe('open');
    expect(reopened.comments).toHaveLength(2);

    const replyRows = await notificationsFor(fixture.people.tutor);
    expect(replyRows.some((row) => row.threadId === thread.id && row.kind === 'course_comment.replied')).toBe(true);
  });

  it('lets only the author edit, and the author or an org admin delete', async () => {
    const { deleteCourseComment, editCourseComment, replyToCourseCommentThread } = await services();
    const thread = await startThread(fixture.people.courseAdmin, 'First comment');
    const withReply = await replyToCourseCommentThread({
      courseId: fixture.courseId,
      threadId: thread.id,
      actorId: fixture.people.tutor,
      data: { body: 'A reply', mentions: [] }
    });
    const replyId = withReply.comments[1].id;
    const target = { courseId: fixture.courseId, threadId: thread.id, commentId: replyId };

    await expectAppError(
      editCourseComment({ ...target, actorId: fixture.people.courseAdmin, data: { body: 'Hijack', mentions: [] } }),
      403,
      'COURSE_COMMENT_FORBIDDEN'
    );
    await expectAppError(
      deleteCourseComment({ ...target, actorId: fixture.people.courseAdmin }),
      403,
      'COURSE_COMMENT_FORBIDDEN'
    );

    const edited = await editCourseComment({
      ...target,
      actorId: fixture.people.tutor,
      data: { body: 'A better reply', mentions: [] }
    });
    expect(edited.comments[1].body).toBe('A better reply');
    expect(edited.comments[1].editedAt).not.toBeNull();

    expect(await deleteCourseComment({ ...target, actorId: fixture.people.orgAdmin })).toEqual({
      threadDeleted: false
    });
    expect(
      await deleteCourseComment({
        courseId: fixture.courseId,
        threadId: thread.id,
        commentId: thread.comments[0].id,
        actorId: fixture.people.courseAdmin
      })
    ).toEqual({ threadDeleted: true });
  });

  it('notifies only mentions added by an edit', async () => {
    const { editCourseComment } = await services();
    const { fromMentionMarkup } = await import('@cio/utils/functions/course-comment-mentions');
    const thread = await startThread(fixture.people.tutor, `Hey @[Admin](user:${fixture.people.courseAdmin})`);
    const before = (await notificationsFor(fixture.people.courseAdmin)).filter((row) => row.threadId === thread.id);

    await editCourseComment({
      courseId: fixture.courseId,
      threadId: thread.id,
      commentId: thread.comments[0].id,
      actorId: fixture.people.tutor,
      data: fromMentionMarkup(
        `Hey @[Admin](user:${fixture.people.courseAdmin}) and @[Owner](user:${fixture.people.orgAdmin})`
      )
    });

    const after = (await notificationsFor(fixture.people.courseAdmin)).filter((row) => row.threadId === thread.id);
    const ownerRows = (await notificationsFor(fixture.people.orgAdmin)).filter((row) => row.threadId === thread.id);
    expect(after).toHaveLength(before.length);
    expect(ownerRows.map((row) => row.kind)).toEqual(['course_comment.mentioned']);
  });

  it('moves a text highlight when the note changes and detaches it when the quote is gone', async () => {
    const { reconcileBlockTextAnchors } = await import('@cio/core/services/course-comment/anchors');
    const { readCourseCommentThread } = await services();
    const quote = 'guess their price';
    const start = NOTE_HTML.replace(/<[^>]+>/g, ' ').indexOf(quote);
    const thread = await startThread(fixture.people.courseAdmin, 'Too harsh?', {
      type: 'text',
      lessonId: fixture.lessonId,
      blockId: fixture.noteBlockId,
      locale: 'en',
      quote,
      prefix: 'Yet most founders ',
      suffix: ' in an afternoon',
      start: Math.max(start, 0)
    });
    expect(thread.anchorState).toBe('ok');

    const prepended = `<p>New opening line.</p>${NOTE_HTML}`;
    const moved = await reconcileBlockTextAnchors({ blockId: fixture.noteBlockId, locale: 'en', html: prepended });
    expect(moved.threadIds).toContain(thread.id);
    const movedView = await readCourseCommentThread(fixture.courseId, thread.id, fixture.people.courseAdmin);
    expect(movedView.anchorState).toBe('ok');
    expect(movedView.anchor.start).toBeGreaterThan(thread.anchor.start ?? 0);

    await reconcileBlockTextAnchors({ blockId: fixture.noteBlockId, locale: 'en', html: '<p>Rewritten.</p>' });
    const detached = await readCourseCommentThread(fixture.courseId, thread.id, fixture.people.courseAdmin);
    expect(detached.anchorState).toBe('text_removed');
  });

  it('answers 403 once team comments are turned off for the organization', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const { eq } = await import('drizzle-orm');
    const { listCourseCommentThreadViews } = await services();

    const [organization] = await db
      .select({ customization: schema.organization.customization })
      .from(schema.organization)
      .where(eq(schema.organization.id, fixture.organizationId));
    const original = organization.customization;
    const disabled = { ...original, apps: { ...original?.apps, teamComments: false } };

    await db
      .update(schema.organization)
      .set({ customization: disabled })
      .where(eq(schema.organization.id, fixture.organizationId));
    try {
      await expectAppError(
        listCourseCommentThreadViews(fixture.courseId, fixture.people.courseAdmin, 'open'),
        403,
        'COURSE_COMMENTS_DISABLED'
      );
    } finally {
      await db
        .update(schema.organization)
        .set({ customization: original })
        .where(eq(schema.organization.id, fixture.organizationId));
    }
  });
});
