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

  it('ignores unknown content types instead of mistaking them for exercises or throwing', async () => {
    const lessonApi = mockApi();
    const exerciseApi = mockApi();
    const activityApi = mockApi();
    const item = { type: 'UNKNOWN', contentId: 'x' } as never;

    expect(await saveContent({ item, courseId: 'c1', lessonApi, exerciseApi, activityApi })).toEqual({});
    expect(await toggleLock({ item, courseId: 'c1', lessonApi, exerciseApi, activityApi })).toEqual({});
    expect(await deleteContent({ item, courseId: 'c1', lessonApi, exerciseApi, activityApi })).toBe(false);
    expect(exerciseApi.update).not.toHaveBeenCalled();
    expect(exerciseApi.delete).not.toHaveBeenCalled();
    expect(lessonApi.update).not.toHaveBeenCalled();
    expect(lessonApi.delete).not.toHaveBeenCalled();
    expect(activityApi.update).not.toHaveBeenCalled();
    expect(activityApi.delete).not.toHaveBeenCalled();
  });
});
