import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/tag', () => ({ getCourseOrganizationId: vi.fn() }));
vi.mock('@cio/db/queries/group', () => ({
  getGroupMemberIdByCourseAndProfile: vi.fn(),
  isCourseTeamMemberOrOrgAdmin: vi.fn()
}));
vi.mock('@cio/db/queries/lesson', () => ({ getLessonById: vi.fn(), getLessonCommentById: vi.fn() }));
vi.mock('@cio/core/services/course/course', () => ({ ensureCourseGroupMemberId: vi.fn() }));
vi.mock('@api/services/lesson', () => ({
  createLessonCommentService: vi.fn(),
  deleteLessonCommentService: vi.fn(),
  getLessonCommentsPaginated: vi.fn(),
  updateLessonCommentService: vi.fn()
}));

import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { getGroupMemberIdByCourseAndProfile, isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { getLessonById, getLessonCommentById } from '@cio/db/queries/lesson';
import { ensureCourseGroupMemberId } from '@cio/core/services/course/course';
import {
  createLessonCommentService,
  deleteLessonCommentService,
  getLessonCommentsPaginated,
  updateLessonCommentService
} from '@api/services/lesson';
import {
  createPublicApiCourseLessonCommentService,
  deletePublicApiCourseLessonCommentService,
  listPublicApiCourseLessonCommentsService,
  updatePublicApiCourseLessonCommentService
} from '@api/services/v1/courses/lesson-comments';

const ORG_ID = 'org-1';
const COURSE_ID = 'course-1';
const ACTOR_ID = 'actor-1';
const LESSON_ID = 'lesson-1';
const ACTOR_MEMBER = 'member-actor';
const OTHER_MEMBER = 'member-student';

const lessonParams = { courseId: COURSE_ID, lessonId: LESSON_ID };
const commentParams = { ...lessonParams, commentId: 5 };
const comment = (overrides: Record<string, unknown> = {}) =>
  ({ id: 5, lessonId: LESSON_ID, groupmemberId: OTHER_MEMBER, comment: 'hi', createdAt: 'now', ...overrides }) as never;

describe('services/v1/courses/lesson-comments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_ID);
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(true);
    vi.mocked(getLessonById).mockResolvedValue({ id: LESSON_ID, courseId: COURSE_ID } as never);
    vi.mocked(getGroupMemberIdByCourseAndProfile).mockResolvedValue(ACTOR_MEMBER);
    vi.mocked(getLessonCommentById).mockResolvedValue(comment());
  });

  it('lists comments with their author', async () => {
    vi.mocked(getLessonCommentsPaginated).mockResolvedValue({
      items: [
        {
          ...(comment() as object),
          groupmember: { id: OTHER_MEMBER },
          profile: { fullname: 'Ada', avatarUrl: null }
        }
      ],
      totalCount: 1,
      hasMore: false,
      nextCursor: null
    } as never);

    const page = await listPublicApiCourseLessonCommentsService(ORG_ID, ACTOR_ID, lessonParams, { limit: 10 });

    expect(page).toMatchObject({ total: 1, nextCursor: null, items: [{ id: 5, author: { fullname: 'Ada' } }] });
  });

  it('rejects a student, another organization and a missing actor', async () => {
    await expect(
      createPublicApiCourseLessonCommentService(ORG_ID, null, lessonParams, { comment: 'hi' })
    ).rejects.toMatchObject({ statusCode: 401 });

    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(false);
    await expect(
      listPublicApiCourseLessonCommentsService(ORG_ID, ACTOR_ID, lessonParams, { limit: 10 })
    ).rejects.toMatchObject({ statusCode: 403 });
    await expect(
      createPublicApiCourseLessonCommentService(ORG_ID, ACTOR_ID, lessonParams, { comment: 'hi' })
    ).rejects.toMatchObject({ statusCode: 403 });

    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(true);
    vi.mocked(getCourseOrganizationId).mockResolvedValue('other-org');
    await expect(deletePublicApiCourseLessonCommentService(ORG_ID, ACTOR_ID, commentParams)).rejects.toMatchObject({
      statusCode: 404
    });
    expect(createLessonCommentService).not.toHaveBeenCalled();
    expect(deleteLessonCommentService).not.toHaveBeenCalled();
  });

  it('posts as the key creator', async () => {
    vi.mocked(ensureCourseGroupMemberId).mockResolvedValue(ACTOR_MEMBER);
    vi.mocked(createLessonCommentService).mockResolvedValue(comment({ groupmemberId: ACTOR_MEMBER }));

    const created = await createPublicApiCourseLessonCommentService(ORG_ID, ACTOR_ID, lessonParams, {
      comment: 'hi'
    });

    expect(ensureCourseGroupMemberId).toHaveBeenCalledWith(COURSE_ID, ACTOR_ID);
    expect(createLessonCommentService).toHaveBeenCalledWith(LESSON_ID, ACTOR_MEMBER, 'hi');
    expect(created.groupmemberId).toBe(ACTOR_MEMBER);
  });

  it('returns 403, not 500, when the creator has no course membership', async () => {
    vi.mocked(ensureCourseGroupMemberId).mockResolvedValue(null);

    await expect(
      createPublicApiCourseLessonCommentService(ORG_ID, ACTOR_ID, lessonParams, { comment: 'hi' })
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(createLessonCommentService).not.toHaveBeenCalled();
  });

  it('returns 404 for a comment on another lesson', async () => {
    vi.mocked(getLessonCommentById).mockResolvedValue(comment({ lessonId: 'other-lesson' }));

    await expect(
      updatePublicApiCourseLessonCommentService(ORG_ID, ACTOR_ID, commentParams, { comment: 'x' })
    ).rejects.toMatchObject({ statusCode: 404 });
    await expect(deletePublicApiCourseLessonCommentService(ORG_ID, ACTOR_ID, commentParams)).rejects.toMatchObject({
      statusCode: 404
    });
  });

  it("does not let the team edit someone else's comment", async () => {
    await expect(
      updatePublicApiCourseLessonCommentService(ORG_ID, ACTOR_ID, commentParams, { comment: 'rewritten' })
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(updateLessonCommentService).not.toHaveBeenCalled();
  });

  it('lets the author edit their own comment', async () => {
    vi.mocked(getLessonCommentById).mockResolvedValue(comment({ groupmemberId: ACTOR_MEMBER }));
    vi.mocked(updateLessonCommentService).mockResolvedValue(comment({ groupmemberId: ACTOR_MEMBER }));

    await updatePublicApiCourseLessonCommentService(ORG_ID, ACTOR_ID, commentParams, { comment: 'fixed' });

    expect(updateLessonCommentService).toHaveBeenCalledWith(5, 'fixed');
  });

  it("lets the team delete someone else's comment", async () => {
    vi.mocked(deleteLessonCommentService).mockResolvedValue(comment());

    await deletePublicApiCourseLessonCommentService(ORG_ID, ACTOR_ID, commentParams);

    expect(deleteLessonCommentService).toHaveBeenCalledWith(5);
  });
});
