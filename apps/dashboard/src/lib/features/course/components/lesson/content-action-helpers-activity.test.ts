import { describe, expect, it, vi } from 'vitest';

import { ContentType } from '@cio/utils/constants/content';
import { deleteContent, saveContent, toggleLock } from './content-action-helpers';

function mockApi() {
  return {
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    errors: {},
    success: true
  };
}

describe('content actions with activities', () => {
  it('saves, locks and deletes through the activity api', async () => {
    const lessonApi = mockApi();
    const exerciseApi = mockApi();
    const activityApi = mockApi();
    const item = { type: ContentType.Activity, contentId: 'a1', title: 'Package', isUnlocked: true };

    await saveContent({ item: { ...item }, courseId: 'c1', lessonApi, exerciseApi, activityApi });
    expect(activityApi.update).toHaveBeenCalledWith('c1', 'a1', expect.objectContaining({ title: 'Package' }));
    expect(lessonApi.update).not.toHaveBeenCalled();
    expect(exerciseApi.update).not.toHaveBeenCalled();

    await toggleLock({ item: { ...item }, courseId: 'c1', lessonApi, exerciseApi, activityApi });
    expect(activityApi.update).toHaveBeenCalledWith('c1', 'a1', expect.objectContaining({ isUnlocked: false }));

    expect(await deleteContent({ item, courseId: 'c1', lessonApi, exerciseApi, activityApi })).toBe(true);
    expect(activityApi.delete).toHaveBeenCalledWith('c1', 'a1');
  });

  it('throws for unknown content types instead of mistaking them for exercises', async () => {
    const lessonApi = mockApi();
    const exerciseApi = mockApi();
    const activityApi = mockApi();
    const item = { type: 'UNKNOWN', contentId: 'x' } as never;

    await expect(saveContent({ item, courseId: 'c1', lessonApi, exerciseApi, activityApi })).rejects.toThrow();
    await expect(toggleLock({ item, courseId: 'c1', lessonApi, exerciseApi, activityApi })).rejects.toThrow();
    await expect(deleteContent({ item, courseId: 'c1', lessonApi, exerciseApi, activityApi })).rejects.toThrow();
  });
});
