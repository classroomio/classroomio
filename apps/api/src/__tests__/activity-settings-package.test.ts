import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from '@api/utils/hono';
import { AppError, ErrorCodes } from '@api/utils/errors';

vi.mock('@api/middlewares/auth', () => ({
  authMiddleware: async (c: { set: (key: string, val: unknown) => void }, next: () => Promise<void>) => {
    c.set('user', { id: 'user-1' });
    await next();
  }
}));

vi.mock('@api/middlewares/course-member', () => ({
  courseMemberMiddleware: async (_c: unknown, next: () => Promise<void>) => {
    await next();
  }
}));

vi.mock('@api/middlewares/course-team-member', () => ({
  courseTeamMemberMiddleware: async (_c: unknown, next: () => Promise<void>) => {
    await next();
  }
}));

vi.mock('@api/services/activity/plan', () => ({
  assertActivityKindAllowed: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('@cio/db/queries/course', () => ({
  getOrgIdByCourseId: vi.fn().mockResolvedValue('org-1')
}));

vi.mock('@cio/core/services/activity/activity', () => ({
  createActivity: vi.fn(),
  deleteActivityService: vi.fn(),
  getActivity: vi.fn(),
  getActivityForStudent: vi.fn(),
  getActivityWithEditorData: vi.fn(),
  updateActivityService: vi.fn(),
  updateActivitySettings: vi.fn()
}));

vi.mock('@cio/db/queries/group', () => ({
  isCourseTeamMemberOrOrgAdmin: vi.fn()
}));

vi.mock('@cio/core/services/activity/providers', () => ({
  attachScormPackage: vi.fn().mockResolvedValue(undefined),
  detachScormPackage: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('@api/services/activity/activity-completion', () => ({
  runActivityCompletionSideEffects: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('@api/services/course/access', () => ({
  assertEnrolledStudentContentAccess: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('@cio/core/services/activity/providers/scorm/results', () => ({
  getComplianceSnapshot: vi.fn().mockResolvedValue({ minutes: 15, score: 90, attempts: 1 })
}));

import {
  createActivity,
  deleteActivityService,
  getActivity,
  getActivityForStudent,
  getActivityWithEditorData,
  updateActivityService,
  updateActivitySettings
} from '@cio/core/services/activity/activity';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { attachScormPackage, detachScormPackage } from '@cio/core/services/activity/providers';
import { runActivityCompletionSideEffects } from '@api/services/activity/activity-completion';
import { runSettingsCompletionSideEffects } from '@api/services/activity/activity-settings';
import { getOrgIdByCourseId } from '@cio/db/queries/course';
import { assertActivityKindAllowed } from '@api/services/activity/plan';
import { activityRouter } from '@api/routes/course/activity';
import { assertEnrolledStudentContentAccess } from '@api/services/course/access';

function buildApp() {
  return new Hono().route('/course/:courseId/activity', activityRouter);
}

const HEADERS = { 'content-type': 'application/json' };
const ACTIVITY = { id: 'act-1', courseId: 'course-1', kind: 'scorm', title: 'Package' };

describe('course activity routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrgIdByCourseId).mockResolvedValue('org-1');
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(true);
    vi.mocked(assertActivityKindAllowed).mockResolvedValue(undefined);
    vi.mocked(assertEnrolledStudentContentAccess).mockResolvedValue(undefined);
    vi.mocked(getActivity).mockResolvedValue(ACTIVITY as never);
  });

  it('GET returns kind data without a plan check', async () => {
    const app = buildApp();
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(true);
    vi.mocked(getActivityWithEditorData).mockResolvedValue({
      activity: ACTIVITY,
      editor: { available: true, kind: 'scorm', settings: {}, package: null }
    } as never);

    const response = await app.request('/course/course-1/activity/act-1', { method: 'GET', headers: HEADERS });

    expect(response.status).toBe(200);
    expect(assertActivityKindAllowed).not.toHaveBeenCalled();
  });

  it('GET returns the student view without editor data for learners', async () => {
    const app = buildApp();
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(false);
    vi.mocked(getActivityForStudent).mockResolvedValue({
      activity: ACTIVITY,
      editor: { available: true, kind: 'scorm', settings: {}, package: null }
    } as never);

    const response = await app.request('/course/course-1/activity/act-1', { method: 'GET', headers: HEADERS });

    expect(response.status).toBe(200);
    expect(assertEnrolledStudentContentAccess).toHaveBeenCalledWith({
      courseId: 'course-1',
      profileId: 'user-1',
      contentId: 'act-1',
      type: 'ACTIVITY'
    });
    expect(getActivityForStudent).toHaveBeenCalledWith('course-1', 'act-1');
    expect(getActivityWithEditorData).not.toHaveBeenCalled();
  });

  it('POST creates a SCORM activity behind the plan check', async () => {
    const app = buildApp();
    vi.mocked(createActivity).mockResolvedValue(ACTIVITY as never);

    const response = await app.request('/course/course-1/activity', {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ kind: 'scorm', title: 'Package' })
    });

    expect(response.status).toBe(201);
    expect(assertActivityKindAllowed).toHaveBeenCalledWith('org-1', 'scorm');
    expect(createActivity).toHaveBeenCalledWith('course-1', { kind: 'scorm', title: 'Package' }, 'user-1');
  });

  it('POST returns 403 on the Free plan', async () => {
    const app = buildApp();
    vi.mocked(assertActivityKindAllowed).mockRejectedValue(
      new AppError('SCORM packages require a paid plan', ErrorCodes.UPGRADE_REQUIRED, 403)
    );

    const response = await app.request('/course/course-1/activity', {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ kind: 'scorm', title: 'Package' })
    });

    expect(response.status).toBe(403);
    expect(createActivity).not.toHaveBeenCalled();
  });

  it('PUT settings saves kind settings behind the license check', async () => {
    const app = buildApp();
    vi.mocked(updateActivitySettings).mockResolvedValue({ newlyCompletedProfileIds: [] });

    const response = await app.request('/course/course-1/activity/act-1/settings', {
      method: 'PUT',
      headers: HEADERS,
      body: JSON.stringify({ completionRule: 'passed', allowRetakes: true })
    });

    expect(response.status).toBe(200);
    expect(assertActivityKindAllowed).toHaveBeenCalledWith('org-1', 'scorm');
    expect(updateActivitySettings).toHaveBeenCalledWith(
      'course-1',
      'act-1',
      expect.objectContaining({ completionRule: 'passed' })
    );
  });

  it('PUT settings runs certificate and compliance side effects for learners the new rule completed', async () => {
    const app = buildApp();
    vi.mocked(updateActivitySettings).mockResolvedValue({ newlyCompletedProfileIds: ['profile-1', 'profile-2'] });

    const response = await app.request('/course/course-1/activity/act-1/settings', {
      method: 'PUT',
      headers: HEADERS,
      body: JSON.stringify({ completionRule: 'passed', allowRetakes: true })
    });

    expect(response.status).toBe(200);
    await vi.waitFor(() => expect(runActivityCompletionSideEffects).toHaveBeenCalledTimes(2));
    expect(runActivityCompletionSideEffects).toHaveBeenCalledWith('act-1', 'profile-1', 15);
    expect(runActivityCompletionSideEffects).toHaveBeenCalledWith('act-1', 'profile-2', 15);
  });

  it('settings side effects keep going when one learner fails', async () => {
    vi.mocked(runActivityCompletionSideEffects)
      .mockRejectedValueOnce(new Error('certification failed'))
      .mockResolvedValue(undefined);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await runSettingsCompletionSideEffects('act-1', ['profile-1', 'profile-2', 'profile-3']);

    expect(runActivityCompletionSideEffects).toHaveBeenCalledTimes(3);
    expect(consoleError).toHaveBeenCalledTimes(1);
    consoleError.mockRestore();
  });

  it('PUT settings returns 403 on an unlicensed server', async () => {
    const app = buildApp();
    vi.mocked(assertActivityKindAllowed).mockRejectedValue(
      new AppError('SCORM packages require an enterprise license', ErrorCodes.FEATURE_REQUIRES_LICENSE, 403)
    );

    const response = await app.request('/course/course-1/activity/act-1/settings', {
      method: 'PUT',
      headers: HEADERS,
      body: JSON.stringify({ completionRule: 'passed', allowRetakes: false })
    });

    expect(response.status).toBe(403);
    expect(updateActivitySettings).not.toHaveBeenCalled();
  });

  it('PUT package attaches a processed package', async () => {
    const app = buildApp();

    const response = await app.request('/course/course-1/activity/act-1/package', {
      method: 'PUT',
      headers: HEADERS,
      body: JSON.stringify({ assetId: 'd3b8a2a2-4c1e-4f1a-9b2e-9f2c1a3b4c5d' })
    });

    expect(response.status).toBe(200);
    expect(attachScormPackage).toHaveBeenCalledWith('act-1', 'd3b8a2a2-4c1e-4f1a-9b2e-9f2c1a3b4c5d', 'org-1', 'user-1');
  });

  it('DELETE package detaches without deleting the asset', async () => {
    const app = buildApp();

    const response = await app.request('/course/course-1/activity/act-1/package', {
      method: 'DELETE',
      headers: HEADERS
    });

    expect(response.status).toBe(200);
    expect(detachScormPackage).toHaveBeenCalledWith('act-1');
  });

  it('DELETE activity is never plan-gated', async () => {
    const app = buildApp();
    vi.mocked(deleteActivityService).mockResolvedValue(ACTIVITY as never);

    const response = await app.request('/course/course-1/activity/act-1', {
      method: 'DELETE',
      headers: HEADERS
    });

    expect(response.status).toBe(200);
    expect(assertActivityKindAllowed).not.toHaveBeenCalled();
  });

  it('PUT update returns 404 for a cross-course id', async () => {
    const app = buildApp();
    vi.mocked(getActivity).mockRejectedValue(new AppError('Activity not found', ErrorCodes.ACTIVITY_NOT_FOUND, 404));
    vi.mocked(updateActivityService).mockResolvedValue(ACTIVITY as never);

    const response = await app.request('/course/other-course/activity/act-1', {
      method: 'PUT',
      headers: HEADERS,
      body: JSON.stringify({ title: 'Renamed' })
    });

    expect(response.status).toBe(404);
    expect(updateActivityService).not.toHaveBeenCalled();
  });
});
