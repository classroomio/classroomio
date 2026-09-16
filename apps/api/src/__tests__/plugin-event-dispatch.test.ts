import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  upsertLessonCompletionService: vi.fn(),
  getLessonById: vi.fn(),
  getOrgIdByCourseId: vi.fn(),
  getEventBus: vi.fn()
}));

vi.mock('@cio/core/services/lesson/lesson', () => ({
  upsertLessonCompletionService: mocks.upsertLessonCompletionService
}));

vi.mock('@cio/sdk', () => ({
  getEventBus: mocks.getEventBus
}));

vi.mock('@cio/db/queries/lesson', () => ({
  getLessonById: mocks.getLessonById
}));

vi.mock('@cio/db/queries/course', () => ({
  getOrgIdByCourseId: mocks.getOrgIdByCourseId
}));

import { completeLessonService } from '@api/services/lesson/complete-lesson';

describe('lesson completion plugin event dispatch', () => {
  const mockBus = { dispatch: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.upsertLessonCompletionService.mockResolvedValue({ id: 'completion-1', isComplete: true });
    mocks.getLessonById.mockResolvedValue({ id: 'l1', courseId: 'course-1' });
    mocks.getOrgIdByCourseId.mockResolvedValue('org1');
    mocks.getEventBus.mockReturnValue(mockBus);
    mockBus.dispatch.mockResolvedValue(undefined);
  });

  it('persists completion before dispatching lesson.completed', async () => {
    await completeLessonService({ userId: 'u1', lessonId: 'l1', orgId: 'org1' });

    expect(mocks.upsertLessonCompletionService).toHaveBeenCalledWith('l1', 'u1', true);
    expect(mockBus.dispatch).toHaveBeenCalledWith('lesson.completed', {
      userId: 'u1',
      lessonId: 'l1',
      orgId: 'org1'
    });
  });

  it('does not wait for plugin handlers before returning completion', async () => {
    mockBus.dispatch.mockReturnValue(new Promise<void>(() => {}));

    await expect(completeLessonService({ userId: 'u1', lessonId: 'l1', orgId: 'org1' })).resolves.toMatchObject({
      isComplete: true
    });
  });

  it('does not reject completion when a plugin handler fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockBus.dispatch.mockRejectedValue(new Error('plugin error'));

    await expect(completeLessonService({ userId: 'u1', lessonId: 'l1', orgId: 'org1' })).resolves.toMatchObject({
      isComplete: true
    });
    await vi.waitFor(() => expect(consoleError).toHaveBeenCalled());

    consoleError.mockRestore();
  });

  it('rejects cross-organization completion before writing', async () => {
    mocks.getOrgIdByCourseId.mockResolvedValue('another-org');

    await expect(completeLessonService({ userId: 'u1', lessonId: 'l1', orgId: 'org1' })).rejects.toMatchObject({
      statusCode: 403
    });
    expect(mocks.upsertLessonCompletionService).not.toHaveBeenCalled();
    expect(mockBus.dispatch).not.toHaveBeenCalled();
  });
});
