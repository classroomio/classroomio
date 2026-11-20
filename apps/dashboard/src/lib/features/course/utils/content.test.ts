import { ContentType } from '@cio/utils/constants/content';
import { describe, expect, it } from 'vitest';

import { getContentItemCount, getContentItemsProgress, type ContentItem } from './content';

function contentItem(
  id: string,
  type: ContentType.Lesson | ContentType.Exercise,
  isComplete: boolean,
  completionPolicy: string
): ContentItem {
  return {
    id,
    type,
    title: id,
    isComplete,
    completionPolicy
  } as ContentItem;
}

describe('course content progress', () => {
  it('excludes optional items from progress but keeps them in the total count', () => {
    const items = [
      contentItem('required-lesson', ContentType.Lesson, true, 'manual'),
      contentItem('optional-exercise', ContentType.Exercise, false, 'none')
    ];

    expect(getContentItemsProgress(items)).toMatchObject({
      total: 1,
      completed: 1,
      percent: 100
    });
    expect(getContentItemCount(items)).toBe(2);
  });

  it('returns zero progress for an all-optional section while still counting its items', () => {
    const items = [
      contentItem('optional-lesson', ContentType.Lesson, false, 'none'),
      contentItem('optional-exercise', ContentType.Exercise, false, 'none')
    ];

    expect(getContentItemsProgress(items)).toMatchObject({
      total: 0,
      completed: 0,
      percent: 0
    });
    expect(getContentItemCount(items)).toBe(2);
  });
});
