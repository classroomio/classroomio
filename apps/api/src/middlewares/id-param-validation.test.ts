import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';

import { ErrorCodes } from '@api/utils/errors';
import { Hono } from '@api/utils/hono';

import { cohortMemberMiddleware } from './cohort-member';
import { cohortNewsfeedCommentAuthorOrTeamMiddleware } from './cohort-newsfeed-comment-author-or-team';
import { cohortTeamMemberMiddleware } from './cohort-team-member';
import { courseGraderMiddleware, courseMemberOrGraderMiddleware } from './course-grader';
import { courseMemberMiddleware } from './course-member';
import { courseMemberOrAutomationKeyMiddleware } from './course-member-or-automation-key';
import { courseTeamMemberMiddleware } from './course-team-member';
import { lessonInCourseMiddleware } from './lesson-in-course';
import { newsfeedCommentAuthorOnlyMiddleware } from './newsfeed-comment-author-only';
import { newsfeedCommentAuthorOrTeamMiddleware } from './newsfeed-comment-author-or-team';
import { commentAuthorOrTeamMiddleware } from '../routes/community/middlewares/comment-author-or-team';
import { questionAuthorOrTeamMiddleware } from '../routes/community/middlewares/question-author-or-team';

const mocks = vi.hoisted(() => ({
  isCourseTeamMemberOrOrgAdmin: vi.fn(),
  canAccessCourseSubmissions: vi.fn(),
  isUserCourseMemberOrOrgAdmin: vi.fn(),
  getGroupMemberIdByCourseAndProfile: vi.fn(),
  canProfileOpenCourse: vi.fn(),
  ensureProgramCourseAccess: vi.fn(),
  getCourseOrganizationId: vi.fn(),
  getLessonRowById: vi.fn(),
  isCohortMember: vi.fn(),
  isOrgAdminByCohortId: vi.fn(),
  getCohortMemberRole: vi.fn(),
  getCohortMemberByProfileId: vi.fn(),
  getCohortNewsfeedCommentById: vi.fn(),
  getCohortNewsfeedById: vi.fn(),
  getNewsfeedCommentAuthorAndCourse: vi.fn(),
  getCommentAuthorAndCourse: vi.fn(),
  getQuestionAuthorAndCourse: vi.fn()
}));

vi.mock('@cio/db/queries/group', () => ({
  isCourseTeamMemberOrOrgAdmin: mocks.isCourseTeamMemberOrOrgAdmin,
  canAccessCourseSubmissions: mocks.canAccessCourseSubmissions,
  isUserCourseMemberOrOrgAdmin: mocks.isUserCourseMemberOrOrgAdmin,
  getGroupMemberIdByCourseAndProfile: mocks.getGroupMemberIdByCourseAndProfile
}));
vi.mock('@api/services/course/access', () => ({ canProfileOpenCourse: mocks.canProfileOpenCourse }));
vi.mock('@cio/core/services/course/course', () => ({ ensureProgramCourseAccess: mocks.ensureProgramCourseAccess }));
vi.mock('@cio/db/queries/tag', () => ({ getCourseOrganizationId: mocks.getCourseOrganizationId }));
vi.mock('@cio/db/queries/lesson', () => ({ getLessonRowById: mocks.getLessonRowById }));
vi.mock('@cio/db/queries/cohort', () => ({
  isCohortMember: mocks.isCohortMember,
  isOrgAdminByCohortId: mocks.isOrgAdminByCohortId,
  getCohortMemberRole: mocks.getCohortMemberRole,
  getCohortMemberByProfileId: mocks.getCohortMemberByProfileId,
  getCohortNewsfeedCommentById: mocks.getCohortNewsfeedCommentById,
  getCohortNewsfeedById: mocks.getCohortNewsfeedById
}));
vi.mock('@cio/db/queries/newsfeed', () => ({
  getNewsfeedCommentAuthorAndCourse: mocks.getNewsfeedCommentAuthorAndCourse
}));
vi.mock('@cio/db/queries/community', () => ({
  getCommentAuthorAndCourse: mocks.getCommentAuthorAndCourse,
  getQuestionAuthorAndCourse: mocks.getQuestionAuthorAndCourse
}));

const COURSE_ID = 'b2f0a5d4-8c1e-4a6b-9d3f-2e7c8a1b4d5e';
const LESSON_ID = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
const COHORT_ID = '9a1c3e5f-2b4d-4f6a-8c0e-1d3f5a7b9c2e';
const FEED_ID = '0b9f3c1a-7d2e-4c58-a1f4-6e8d2b7c9a30';
const ANSWER_ID = '5c1d9e7a-3b2f-4a8e-9d60-7f4e1a2b3c4d';
const ORG_ID = 'd4e5f6a7-b8c9-4d0e-8f1a-2b3c4d5e6f70';
const BAD = 'not-a-uuid';

type Method = 'get' | 'post';
type Case = {
  name: string;
  route: string;
  middleware: (c: Context, next: Next) => Promise<Response | void>;
  validPath: string;
  broken: Array<{ path: string; label: string }>;
  queries: Array<keyof typeof mocks>;
  allowValid: () => void;
  automationKey?: boolean;
  method?: Method;
};

const cases: Case[] = [
  {
    name: 'courseTeamMemberMiddleware',
    route: '/course/:courseId/x',
    middleware: courseTeamMemberMiddleware,
    validPath: `/course/${COURSE_ID}/x`,
    broken: [{ path: `/course/${BAD}/x`, label: 'course' }],
    queries: ['isCourseTeamMemberOrOrgAdmin'],
    allowValid: () => mocks.isCourseTeamMemberOrOrgAdmin.mockResolvedValue(true)
  },
  {
    name: 'courseMemberMiddleware (param)',
    route: '/course/:courseId/x',
    middleware: courseMemberMiddleware,
    validPath: `/course/${COURSE_ID}/x`,
    broken: [{ path: `/course/${BAD}/x`, label: 'course' }],
    queries: ['canProfileOpenCourse'],
    allowValid: () => mocks.canProfileOpenCourse.mockResolvedValue(true)
  },
  {
    name: 'courseMemberMiddleware (query)',
    route: '/x',
    middleware: courseMemberMiddleware,
    validPath: `/x?courseId=${COURSE_ID}`,
    broken: [{ path: `/x?courseId=${BAD}`, label: 'course' }],
    queries: ['canProfileOpenCourse'],
    allowValid: () => mocks.canProfileOpenCourse.mockResolvedValue(true)
  },
  {
    name: 'courseGraderMiddleware',
    route: '/course/:courseId/x',
    middleware: courseGraderMiddleware,
    validPath: `/course/${COURSE_ID}/x`,
    broken: [{ path: `/course/${BAD}/x`, label: 'course' }],
    queries: ['canAccessCourseSubmissions'],
    allowValid: () => mocks.canAccessCourseSubmissions.mockResolvedValue(true)
  },
  {
    name: 'courseMemberOrGraderMiddleware',
    route: '/course/:courseId/x',
    middleware: courseMemberOrGraderMiddleware,
    validPath: `/course/${COURSE_ID}/x`,
    broken: [{ path: `/course/${BAD}/x`, label: 'course' }],
    queries: ['isUserCourseMemberOrOrgAdmin', 'canAccessCourseSubmissions', 'ensureProgramCourseAccess'],
    allowValid: () => mocks.isUserCourseMemberOrOrgAdmin.mockResolvedValue(true)
  },
  {
    name: 'courseMemberOrAutomationKeyMiddleware (automation key)',
    automationKey: true,
    route: '/course/:courseId/x',
    middleware: courseMemberOrAutomationKeyMiddleware(),
    validPath: `/course/${COURSE_ID}/x`,
    broken: [{ path: `/course/${BAD}/x`, label: 'course' }],
    queries: ['getCourseOrganizationId'],
    allowValid: () => mocks.getCourseOrganizationId.mockResolvedValue(ORG_ID)
  },
  {
    name: 'lessonInCourseMiddleware',
    route: '/course/:courseId/lesson/:lessonId/x',
    middleware: lessonInCourseMiddleware,
    validPath: `/course/${COURSE_ID}/lesson/${LESSON_ID}/x`,
    broken: [
      { path: `/course/${COURSE_ID}/lesson/${BAD}/x`, label: 'lesson' },
      { path: `/course/${BAD}/lesson/${LESSON_ID}/x`, label: 'course' }
    ],
    queries: ['getLessonRowById'],
    allowValid: () => mocks.getLessonRowById.mockResolvedValue({ id: LESSON_ID, courseId: COURSE_ID })
  },
  {
    name: 'cohortMemberMiddleware',
    route: '/cohort/:cohortId/x',
    middleware: cohortMemberMiddleware,
    validPath: `/cohort/${COHORT_ID}/x`,
    broken: [{ path: `/cohort/${BAD}/x`, label: 'cohort' }],
    queries: ['isCohortMember', 'isOrgAdminByCohortId'],
    allowValid: () => mocks.isCohortMember.mockResolvedValue(true)
  },
  {
    name: 'cohortTeamMemberMiddleware',
    route: '/cohort/:cohortId/x',
    middleware: cohortTeamMemberMiddleware,
    validPath: `/cohort/${COHORT_ID}/x`,
    broken: [{ path: `/cohort/${BAD}/x`, label: 'cohort' }],
    queries: ['getCohortMemberRole', 'isOrgAdminByCohortId'],
    allowValid: () => mocks.isOrgAdminByCohortId.mockResolvedValue(true)
  },
  {
    name: 'cohortNewsfeedCommentAuthorOrTeamMiddleware',
    route: '/cohort/:cohortId/feed/:feedId/comment/:commentId',
    middleware: cohortNewsfeedCommentAuthorOrTeamMiddleware,
    validPath: `/cohort/${COHORT_ID}/feed/${FEED_ID}/comment/42`,
    broken: [
      { path: `/cohort/${BAD}/feed/${FEED_ID}/comment/42`, label: 'cohort' },
      { path: `/cohort/${COHORT_ID}/feed/${BAD}/comment/42`, label: 'newsfeed' },
      { path: `/cohort/${COHORT_ID}/feed/${FEED_ID}/comment/abc`, label: 'comment' },
      { path: `/cohort/${COHORT_ID}/feed/${FEED_ID}/comment/1.5`, label: 'comment' },
      { path: `/cohort/${COHORT_ID}/feed/${FEED_ID}/comment/-1`, label: 'comment' }
    ],
    queries: ['getCohortNewsfeedCommentById', 'getCohortNewsfeedById'],
    allowValid: () => {
      mocks.getCohortNewsfeedCommentById.mockResolvedValue({ id: 42, cohortNewsfeedId: FEED_ID, authorId: 'user-1' });
      mocks.getCohortNewsfeedById.mockResolvedValue({ id: FEED_ID, cohortId: COHORT_ID });
      mocks.getCohortMemberByProfileId.mockResolvedValue({ id: 'user-1' });
      mocks.isOrgAdminByCohortId.mockResolvedValue(true);
    }
  },
  {
    name: 'newsfeedCommentAuthorOnlyMiddleware',
    route: '/comment/:commentId',
    middleware: newsfeedCommentAuthorOnlyMiddleware,
    validPath: '/comment/42',
    broken: [
      { path: '/comment/abc', label: 'comment' },
      { path: '/comment/1.5', label: 'comment' },
      { path: '/comment/0', label: 'comment' }
    ],
    queries: ['getNewsfeedCommentAuthorAndCourse'],
    allowValid: () => {
      mocks.getNewsfeedCommentAuthorAndCourse.mockResolvedValue({ authorId: 'member-1', courseId: COURSE_ID });
      mocks.getGroupMemberIdByCourseAndProfile.mockResolvedValue('member-1');
    }
  },
  {
    name: 'newsfeedCommentAuthorOrTeamMiddleware',
    route: '/comment/:commentId',
    middleware: newsfeedCommentAuthorOrTeamMiddleware,
    validPath: '/comment/42',
    broken: [
      { path: '/comment/abc', label: 'comment' },
      { path: '/comment/9007199254740993', label: 'comment' }
    ],
    queries: ['getNewsfeedCommentAuthorAndCourse'],
    allowValid: () => {
      mocks.getNewsfeedCommentAuthorAndCourse.mockResolvedValue({ authorId: 'member-1', courseId: COURSE_ID });
      mocks.getGroupMemberIdByCourseAndProfile.mockResolvedValue('member-1');
    }
  },
  {
    name: 'commentAuthorOrTeamMiddleware (community)',
    route: '/comment/:id',
    middleware: commentAuthorOrTeamMiddleware,
    validPath: `/comment/${ANSWER_ID}`,
    broken: [{ path: `/comment/${BAD}`, label: 'comment' }],
    queries: ['getCommentAuthorAndCourse'],
    allowValid: () =>
      mocks.getCommentAuthorAndCourse.mockResolvedValue({ id: ANSWER_ID, authorId: 'user-1', courseId: COURSE_ID })
  },
  {
    name: 'questionAuthorOrTeamMiddleware (community)',
    route: '/question/:id',
    middleware: questionAuthorOrTeamMiddleware,
    validPath: '/question/7',
    broken: [
      { path: `/question/${BAD}`, label: 'question' },
      { path: '/question/7.5', label: 'question' }
    ],
    queries: ['getQuestionAuthorAndCourse'],
    allowValid: () => mocks.getQuestionAuthorAndCourse.mockResolvedValue({ authorId: 'user-1', courseId: COURSE_ID })
  }
];

function buildApp(testCase: Case) {
  const setContext = async (c: Context, next: Next) => {
    c.set('user', { id: 'user-1' });
    if (testCase.automationKey) {
      c.set('automationKey', { scopes: [], organizationId: ORG_ID, createdByProfileId: 'profile-1' });
    }
    await next();
  };

  return new Hono().use(setContext).get(testCase.route, testCase.middleware, (c) => c.json({ success: true }));
}

describe('id path-param validation in middlewares (issue #1608)', () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) {
      mock.mockReset();
    }
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe.each(cases)('$name', (testCase) => {
    it.each(testCase.broken)(
      'answers 400 VALIDATION_ERROR for $path, without touching the database',
      async (broken) => {
        const response = await buildApp(testCase).request(broken.path);

        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body).toEqual({
          success: false,
          error: `Invalid ${broken.label} ID`,
          code: ErrorCodes.VALIDATION_ERROR
        });
        for (const query of testCase.queries) {
          expect(mocks[query]).not.toHaveBeenCalled();
        }
      }
    );

    it('still lets a well-formed id through', async () => {
      testCase.allowValid();

      const response = await buildApp(testCase).request(testCase.validPath);

      expect(response.status).toBe(200);
      expect(mocks[testCase.queries[0]]).toHaveBeenCalled();
    });
  });

  it('lessonInCourseMiddleware still answers 404 when the ids are valid but the lesson does not exist', async () => {
    mocks.getLessonRowById.mockResolvedValue(null);
    const lessonCase = cases.find((c) => c.name === 'lessonInCourseMiddleware')!;

    const response = await buildApp(lessonCase).request(lessonCase.validPath);

    expect(response.status).toBe(404);
    expect((await response.json()).code).toBe(ErrorCodes.LESSON_NOT_FOUND);
  });

  it('answers 401 before it looks at the id when nobody is signed in', async () => {
    const app = new Hono().get('/course/:courseId/x', courseTeamMemberMiddleware, (c) => c.json({ success: true }));

    const response = await app.request(`/course/${BAD}/x`);

    expect(response.status).toBe(401);
    expect(mocks.isCourseTeamMemberOrOrgAdmin).not.toHaveBeenCalled();
  });

  it('keeps reporting a missing scope before a malformed course id', async () => {
    const app = new Hono()
      .use(async (c: Context, next: Next) => {
        c.set('automationKey', { scopes: [], organizationId: ORG_ID, createdByProfileId: 'profile-1' });
        await next();
      })
      .get('/course/:courseId/x', courseMemberOrAutomationKeyMiddleware(['course:write']), (c) =>
        c.json({ success: true })
      );

    const response = await app.request(`/course/${BAD}/x`);

    expect(response.status).toBe(403);
    expect((await response.json()).code).toBe(ErrorCodes.FORBIDDEN);
    expect(mocks.getCourseOrganizationId).not.toHaveBeenCalled();
  });
});
