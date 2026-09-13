import { ContentType } from '@cio/utils/constants/content';
import { describe, expect, it } from 'vitest';

import { deriveCourseMemberStage } from '../member-progress';

type TrackableContentItem = {
  id: string;
  type: ContentType.Lesson | ContentType.Exercise;
  title: string;
  isComplete: boolean;
};

describe('deriveCourseMemberStage', () => {
  const contentItems: TrackableContentItem[] = [
    { id: 'lesson-1', type: ContentType.Lesson, title: 'Lesson 1', isComplete: true },
    { id: 'lesson-2', type: ContentType.Lesson, title: 'Lesson 2', isComplete: false },
    { id: 'exercise-1', type: ContentType.Exercise, title: 'Exercise 1', isComplete: false }
  ];

  it('returns certificate_earned when certificate was earned', () => {
    const stage = deriveCourseMemberStage({
      progressPercent: 50,
      certificateEarnedAt: '2026-01-01T00:00:00.000Z',
      contentItems
    });

    expect(stage).toEqual({ kind: 'certificate_earned' });
  });

  it('returns certificate_earned when progress is 100%', () => {
    const stage = deriveCourseMemberStage({
      progressPercent: 100,
      certificateEarnedAt: null,
      contentItems
    });

    expect(stage).toEqual({ kind: 'certificate_earned' });
  });

  it('returns not_started when progress is 0%', () => {
    const stage = deriveCourseMemberStage({
      progressPercent: 0,
      certificateEarnedAt: null,
      contentItems
    });

    expect(stage).toEqual({ kind: 'not_started' });
  });

  it('returns the first incomplete content item as the current stage', () => {
    const stage = deriveCourseMemberStage({
      progressPercent: 33,
      certificateEarnedAt: null,
      contentItems
    });

    expect(stage).toEqual({
      kind: 'content',
      position: 2,
      title: 'Lesson 2',
      contentType: 'lesson'
    });
  });

  it('returns certificate_earned when all content items are complete', () => {
    const completedItems = contentItems.map((item) => ({ ...item, isComplete: true }));

    const stage = deriveCourseMemberStage({
      progressPercent: 99,
      certificateEarnedAt: null,
      contentItems: completedItems
    });

    expect(stage).toEqual({ kind: 'certificate_earned' });
  });
});
