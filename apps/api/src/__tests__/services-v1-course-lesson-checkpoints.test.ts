import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  assertCourseTeamAccess: vi.fn(),
  assertLessonInCourse: vi.fn(),
  list: vi.fn(),
  create: vi.fn(),
  remove: vi.fn(),
  results: vi.fn()
}));

vi.mock('@api/services/v1/shared', () => ({
  assertAutomationActor: (actorId: string | null) => {
    if (!actorId) throw new Error('no actor');
  },
  assertCourseTeamAccess: mocks.assertCourseTeamAccess,
  assertLessonInCourse: mocks.assertLessonInCourse
}));

vi.mock('@cio/core/services/lesson/video-checkpoint', () => ({
  listVideoCheckpointsForViewer: mocks.list,
  createVideoCheckpointService: mocks.create,
  updateVideoCheckpointService: vi.fn(),
  deleteVideoCheckpointService: mocks.remove,
  getVideoCheckpointResultsService: mocks.results,
  buildVideoCheckpointResultsCsv: () => 'csv'
}));

import {
  createPublicApiVideoCheckpointService,
  deletePublicApiVideoCheckpointService,
  exportPublicApiVideoCheckpointResultsCsvService,
  getPublicApiVideoCheckpointResultsService,
  listPublicApiVideoCheckpointsService
} from '@api/services/v1/courses/lesson-checkpoints';
import { AppError, ErrorCodes } from '@api/utils/errors';

const params = { courseId: 'course-1', lessonId: 'lesson-1' };

describe('public API video question services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.assertCourseTeamAccess.mockResolvedValue(undefined);
    mocks.assertLessonInCourse.mockResolvedValue(undefined);
  });

  it('checks organization ownership and course team access before reading or writing', async () => {
    mocks.list.mockResolvedValue({ checkpoints: [] });
    mocks.create.mockResolvedValue({
      id: 'cp-1',
      lessonId: 'lesson-1',
      assetId: 'asset-1',
      timestampSeconds: 5,
      resumePolicy: 'any',
      question: {
        title: 'Q',
        questionType: 'RADIO',
        settings: {},
        options: [{ id: 7, label: 'A', isCorrect: true }]
      }
    });

    await listPublicApiVideoCheckpointsService('org-1', 'actor-1', params);
    const created = await createPublicApiVideoCheckpointService('org-1', 'actor-1', params, {
      assetId: 'asset-1',
      timestampSeconds: 5,
      questionType: 'RADIO',
      title: 'Q',
      settings: {},
      resumePolicy: 'any',
      options: []
    });

    expect(mocks.assertCourseTeamAccess).toHaveBeenCalledTimes(2);
    expect(mocks.assertCourseTeamAccess).toHaveBeenCalledWith('org-1', 'actor-1', 'course-1');
    expect(mocks.assertLessonInCourse).toHaveBeenCalledWith('course-1', 'lesson-1');
    expect(created).toMatchObject({
      id: 'cp-1',
      title: 'Q',
      questionType: 'RADIO',
      options: [{ id: 7, label: 'A', value: null, isCorrect: true, settings: {} }]
    });
  });

  it('lists with the staff view so answer keys are included', async () => {
    mocks.list.mockResolvedValue({ checkpoints: [] });

    await listPublicApiVideoCheckpointsService('org-1', 'actor-1', params);

    expect(mocks.list).toHaveBeenCalledWith('lesson-1', 'actor-1', true);
  });

  it('does not reach the core service when the actor is not course staff', async () => {
    mocks.assertCourseTeamAccess.mockRejectedValue(new AppError('no', ErrorCodes.FORBIDDEN, 403));

    await expect(listPublicApiVideoCheckpointsService('org-1', 'actor-1', params)).rejects.toThrow('no');
    await expect(getPublicApiVideoCheckpointResultsService('org-1', 'actor-1', params)).rejects.toThrow('no');
    await expect(
      deletePublicApiVideoCheckpointService('org-1', 'actor-1', { ...params, checkpointId: 'cp-1' })
    ).rejects.toThrow('no');

    expect(mocks.list).not.toHaveBeenCalled();
    expect(mocks.results).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it('refuses a key with no creator', async () => {
    await expect(listPublicApiVideoCheckpointsService('org-1', null, params)).rejects.toThrow('no actor');
  });

  it('lets the core plan guard decide for writes and results', async () => {
    const locked = new AppError('In-video questions require a paid plan', ErrorCodes.UPGRADE_REQUIRED, 403);
    mocks.create.mockRejectedValue(locked);
    mocks.results.mockRejectedValue(locked);

    await expect(
      createPublicApiVideoCheckpointService('org-1', 'actor-1', params, {
        assetId: 'a',
        timestampSeconds: 1,
        questionType: 'RADIO',
        title: 'Q',
        settings: {},
        resumePolicy: 'any',
        options: []
      })
    ).rejects.toBe(locked);
    await expect(getPublicApiVideoCheckpointResultsService('org-1', 'actor-1', params)).rejects.toBe(locked);
  });

  it('answers 404 for a CSV export with no questions', async () => {
    mocks.results.mockResolvedValue({ checkpoints: [], answers: [] });

    await expect(exportPublicApiVideoCheckpointResultsCsvService('org-1', 'actor-1', params)).rejects.toMatchObject({
      statusCode: 404
    });
  });
});
