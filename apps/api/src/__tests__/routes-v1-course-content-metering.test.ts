import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';
import { Hono } from '@api/utils/hono';

const mocks = vi.hoisted(() => ({ authenticate: vi.fn() }));

vi.mock('@hono/node-server/conninfo', () => ({
  getConnInfo: () => ({ remote: { address: '127.0.0.1' } })
}));

vi.mock('@api/middlewares/rate-limiter', () => ({
  createAuthenticationFailureRateLimiter: () => async (_c: Context, next: Next) => next(),
  createRateLimiter: () => async (_c: Context, next: Next) => next()
}));

vi.mock('@api/services/organization/automation-key', () => ({
  authenticateOrganizationApiKeyService: mocks.authenticate,
  organizationApiKeyHasScopes: (keyScopes: string[], requiredScopes: string[]) =>
    requiredScopes.every((scope) => keyScopes.includes(scope)),
  touchOrganizationApiKeyLastUsedService: vi.fn()
}));

vi.mock('@api/routes/v1/audience', () => ({ v1AudienceRouter: new Hono().get('/', (c) => c.json({ success: true })) }));
vi.mock('@api/routes/v1/courses/course', () => ({
  v1CourseRouter: new Hono().get('/', (c) => c.json({ success: true }))
}));

vi.mock('@api/services/v1/courses/sections', () => ({
  listPublicApiCourseSectionsService: vi.fn(),
  createPublicApiCourseSectionService: vi.fn(),
  updatePublicApiCourseSectionService: vi.fn(),
  deletePublicApiCourseSectionService: vi.fn()
}));
vi.mock('@api/services/v1/courses/lessons', () => ({
  listPublicApiCourseLessonsService: vi.fn(),
  getPublicApiCourseLessonService: vi.fn(),
  deletePublicApiCourseLessonService: vi.fn(),
  notifyPublicApiCourseLessonSessionService: vi.fn(),
  toPublicTranslation: vi.fn()
}));
vi.mock('@api/services/v1/courses/lesson-translations', () => ({
  listPublicApiCourseLessonTranslationsService: vi.fn(),
  setPublicApiCourseLessonTranslationService: vi.fn(),
  listPublicApiCourseLessonHistoryService: vi.fn()
}));
vi.mock('@api/services/v1/courses/lesson-comments', () => ({
  listPublicApiCourseLessonCommentsService: vi.fn(),
  createPublicApiCourseLessonCommentService: vi.fn(),
  updatePublicApiCourseLessonCommentService: vi.fn(),
  deletePublicApiCourseLessonCommentService: vi.fn()
}));
vi.mock('@api/services/v1/courses/lesson-checkpoints', () => ({
  listPublicApiVideoCheckpointsService: vi.fn(),
  createPublicApiVideoCheckpointService: vi.fn(),
  updatePublicApiVideoCheckpointService: vi.fn(),
  deletePublicApiVideoCheckpointService: vi.fn(),
  getPublicApiVideoCheckpointResultsService: vi.fn(),
  exportPublicApiVideoCheckpointResultsCsvService: vi.fn()
}));
vi.mock('@api/services/v1/courses/content', () => ({
  reorderPublicApiCourseContentService: vi.fn(),
  updatePublicApiCourseContentLockService: vi.fn(),
  deletePublicApiCourseContentService: vi.fn()
}));

vi.mock('@api/services/organization/automation-usage', () => ({
  reserveMcpAutomationUsage: vi.fn(),
  completeMcpAutomationUsage: vi.fn(),
  releaseMcpAutomationUsage: vi.fn()
}));

import * as sections from '@api/services/v1/courses/sections';
import * as lessons from '@api/services/v1/courses/lessons';
import * as translations from '@api/services/v1/courses/lesson-translations';
import * as comments from '@api/services/v1/courses/lesson-comments';
import * as checkpoints from '@api/services/v1/courses/lesson-checkpoints';
import * as content from '@api/services/v1/courses/content';
import {
  completeMcpAutomationUsage,
  releaseMcpAutomationUsage,
  reserveMcpAutomationUsage
} from '@api/services/organization/automation-usage';
import { v1Router } from '@api/routes/v1';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const SECTION_ID = '22222222-2222-4222-8222-222222222222';
const LESSON_ID = '33333333-3333-4333-8333-333333333333';
const CHECKPOINT_ID = '44444444-4444-4444-8444-444444444444';
const ASSET_ID = '55555555-5555-4555-8555-555555555555';
const COURSE_SCOPES = ['course:read', 'course:write'];
const CHECKPOINT_SCOPES = ['course:video_checkpoint:read', 'course:video_checkpoint:write'];
const CHECKPOINT_BODY = {
  timestampSeconds: 10,
  questionType: 'TRUE_FALSE',
  title: 'Is it?',
  settings: { correctValue: true },
  options: []
};
const PAGE = { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };

const app = new Hono().route('/public-api/v1', v1Router);

const requestAs = (type: 'mcp' | 'api', scopes: string[], path: string, init: RequestInit = {}) => {
  mocks.authenticate.mockResolvedValue({
    id: `${type}-key`,
    organizationId: 'org-1',
    createdByProfileId: 'actor-1',
    type,
    scopes
  });

  return app.request(`/public-api/v1${path}`, {
    ...init,
    headers: { Authorization: 'Bearer key', 'content-type': 'application/json', ...init.headers }
  });
};

const body = (method: string, payload: unknown): RequestInit => ({ method, body: JSON.stringify(payload) });

const course = `/courses/${COURSE_ID}`;
const lesson = `${course}/lessons/${LESSON_ID}`;
const lessonItem = { id: LESSON_ID, type: 'LESSON' };

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(reserveMcpAutomationUsage).mockResolvedValue('usage-1');
  vi.mocked(completeMcpAutomationUsage).mockResolvedValue(undefined);
  vi.mocked(releaseMcpAutomationUsage).mockResolvedValue(undefined);
  vi.mocked(sections.listPublicApiCourseSectionsService).mockResolvedValue(PAGE as never);
  vi.mocked(sections.createPublicApiCourseSectionService).mockResolvedValue({} as never);
  vi.mocked(sections.updatePublicApiCourseSectionService).mockResolvedValue({} as never);
  vi.mocked(sections.deletePublicApiCourseSectionService).mockResolvedValue({} as never);
  vi.mocked(lessons.listPublicApiCourseLessonsService).mockResolvedValue(PAGE as never);
  vi.mocked(lessons.getPublicApiCourseLessonService).mockResolvedValue({} as never);
  vi.mocked(lessons.deletePublicApiCourseLessonService).mockResolvedValue({} as never);
  vi.mocked(lessons.notifyPublicApiCourseLessonSessionService).mockResolvedValue({ jobId: 'job-1' });
  vi.mocked(translations.listPublicApiCourseLessonTranslationsService).mockResolvedValue([]);
  vi.mocked(translations.setPublicApiCourseLessonTranslationService).mockResolvedValue({} as never);
  vi.mocked(translations.listPublicApiCourseLessonHistoryService).mockResolvedValue({ items: [], nextCursor: null });
  vi.mocked(comments.listPublicApiCourseLessonCommentsService).mockResolvedValue({
    items: [],
    total: 0,
    nextCursor: null
  });
  vi.mocked(comments.createPublicApiCourseLessonCommentService).mockResolvedValue({} as never);
  vi.mocked(comments.updatePublicApiCourseLessonCommentService).mockResolvedValue({} as never);
  vi.mocked(comments.deletePublicApiCourseLessonCommentService).mockResolvedValue({} as never);
  vi.mocked(checkpoints.listPublicApiVideoCheckpointsService).mockResolvedValue({ checkpoints: [] });
  vi.mocked(checkpoints.createPublicApiVideoCheckpointService).mockResolvedValue({} as never);
  vi.mocked(checkpoints.updatePublicApiVideoCheckpointService).mockResolvedValue({} as never);
  vi.mocked(checkpoints.deletePublicApiVideoCheckpointService).mockResolvedValue({ id: CHECKPOINT_ID });
  vi.mocked(checkpoints.getPublicApiVideoCheckpointResultsService).mockResolvedValue({} as never);
  vi.mocked(content.reorderPublicApiCourseContentService).mockResolvedValue({} as never);
  vi.mocked(content.updatePublicApiCourseContentLockService).mockResolvedValue({} as never);
  vi.mocked(content.deletePublicApiCourseContentService).mockResolvedValue({} as never);
});

describe('MCP metering on video question routes through the real v1 router', () => {
  it.each([
    ['list_lesson_video_checkpoints', 0, 200, `${lesson}/checkpoints`, {}],
    [
      'create_lesson_video_checkpoint',
      1,
      201,
      `${lesson}/checkpoints`,
      body('POST', { ...CHECKPOINT_BODY, assetId: ASSET_ID })
    ],
    ['get_lesson_video_checkpoint_results', 0, 200, `${lesson}/checkpoints/results`, {}],
    ['update_lesson_video_checkpoint', 1, 200, `${lesson}/checkpoints/${CHECKPOINT_ID}`, body('PUT', CHECKPOINT_BODY)],
    ['delete_lesson_video_checkpoint', 1, 200, `${lesson}/checkpoints/${CHECKPOINT_ID}`, { method: 'DELETE' }]
  ])('meters %s at %i credits', async (toolName, credits, status, path, init) => {
    const response = await requestAs('mcp', CHECKPOINT_SCOPES, path, init as RequestInit);

    expect(response.status).toBe(status);
    expect(completeMcpAutomationUsage).toHaveBeenCalledWith('usage-1', toolName, credits);
  });

  it('is not reachable with only the broad course scopes', async () => {
    const response = await requestAs('mcp', COURSE_SCOPES, `${lesson}/checkpoints`);

    expect(response.status).toBe(403);
    expect(checkpoints.listPublicApiVideoCheckpointsService).not.toHaveBeenCalled();
  });

  it('keeps a read-only checkpoint scope off the write routes', async () => {
    const response = await requestAs(
      'mcp',
      ['course:video_checkpoint:read'],
      `${lesson}/checkpoints/${CHECKPOINT_ID}`,
      { method: 'DELETE' }
    );

    expect(response.status).toBe(403);
    expect(checkpoints.deletePublicApiVideoCheckpointService).not.toHaveBeenCalled();
  });
});

describe('MCP metering on course content routes through the real v1 router', () => {
  it.each([
    ['list_course_sections', 0, 200, `${course}/sections`, {}],
    ['create_course_section', 1, 201, `${course}/sections`, body('POST', { title: 'W1', order: 1 })],
    ['update_course_section', 1, 200, `${course}/sections/${SECTION_ID}`, body('PUT', { title: 'W2' })],
    ['delete_course_section', 1, 200, `${course}/sections/${SECTION_ID}`, { method: 'DELETE' }],
    ['list_course_lessons', 0, 200, `${course}/lessons`, {}],
    ['get_course_lesson', 0, 200, lesson, {}],
    ['delete_course_lesson', 1, 200, lesson, { method: 'DELETE' }],
    ['notify_course_lesson_session_update', 1, 202, `${lesson}/notify-session-update`, { method: 'POST' }],
    ['list_course_lesson_translations', 0, 200, `${lesson}/translations`, {}],
    ['set_course_lesson_translation', 1, 200, `${lesson}/translations/fr`, body('PUT', { content: 'x' })],
    ['list_course_lesson_history', 0, 200, `${lesson}/history?locale=en`, {}],
    ['list_course_lesson_comments', 0, 200, `${lesson}/comments`, {}],
    ['create_course_lesson_comment', 1, 201, `${lesson}/comments`, body('POST', { comment: 'hi' })],
    ['update_course_lesson_comment', 1, 200, `${lesson}/comments/7`, body('PUT', { comment: 'hi' })],
    ['delete_course_lesson_comment', 1, 200, `${lesson}/comments/7`, { method: 'DELETE' }],
    [
      'reorder_course_content',
      1,
      200,
      `${course}/content/reorder`,
      body('PUT', { items: [{ ...lessonItem, order: 1 }] })
    ],
    [
      'set_course_content_unlocked',
      1,
      200,
      `${course}/content`,
      body('PATCH', { items: [{ ...lessonItem, isUnlocked: true }] })
    ],
    ['delete_course_content', 1, 200, `${course}/content`, body('DELETE', { items: [lessonItem] })]
  ])('meters %s at %i credits', async (toolName, credits, status, path, init) => {
    const response = await requestAs('mcp', COURSE_SCOPES, path, init as RequestInit);

    expect(response.status).toBe(status);
    expect(completeMcpAutomationUsage).toHaveBeenCalledWith('usage-1', toolName, credits);
  });

  it('refuses a write with only course:read before the handler runs', async () => {
    const response = await requestAs(
      'mcp',
      ['course:read'],
      `${course}/content`,
      body('DELETE', { items: [lessonItem] })
    );

    expect(response.status).toBe(403);
    expect(content.deletePublicApiCourseContentService).not.toHaveBeenCalled();
  });

  it('refuses a key without course scopes', async () => {
    const response = await requestAs('mcp', ['cohort:read'], `${course}/sections`);

    expect(response.status).toBe(403);
    expect(sections.listPublicApiCourseSectionsService).not.toHaveBeenCalled();
  });

  it('lets a public_api:* key through without MCP metering', async () => {
    const response = await requestAs('api', ['public_api:*'], `${course}/lessons`);

    expect(response.status).toBe(200);
    expect(reserveMcpAutomationUsage).not.toHaveBeenCalled();
  });
});
