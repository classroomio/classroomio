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

  it('returns certificate_earned when completion is recorded, even below 100%', () => {
    const stage = deriveCourseMemberStage({
      isComplete: true,
      certificateAvailable: true,
      progressPercent: 80,
      contentItems
    });

    expect(stage).toEqual({ kind: 'certificate_earned' });
  });

  it('returns completed when completion is recorded but no certificate exists', () => {
    const stage = deriveCourseMemberStage({
      isComplete: true,
      certificateAvailable: false,
      progressPercent: 80,
      contentItems
    });

    expect(stage).toEqual({ kind: 'completed' });
  });

  it('does not return certificate_earned at 100% without a recorded completion', () => {
    const stage = deriveCourseMemberStage({
      isComplete: false,
      certificateAvailable: true,
      progressPercent: 100,
      contentItems
    });

    expect(stage).toEqual({
      kind: 'content',
      position: 2,
      title: 'Lesson 2',
      contentType: 'lesson'
    });
  });

  it('returns not_started when progress is 0% and nothing is recorded', () => {
    const stage = deriveCourseMemberStage({
      isComplete: false,
      certificateAvailable: true,
      progressPercent: 0,
      contentItems
    });

    expect(stage).toEqual({ kind: 'not_started' });
  });

  it('returns the first incomplete content item as the current stage', () => {
    const stage = deriveCourseMemberStage({
      isComplete: false,
      certificateAvailable: true,
      progressPercent: 33,
      contentItems
    });

    expect(stage).toEqual({
      kind: 'content',
      position: 2,
      title: 'Lesson 2',
      contentType: 'lesson'
    });
  });

  it('points at the last item when all content is done but completion is not recorded', () => {
    const completedItems = contentItems.map((item) => ({ ...item, isComplete: true }));

    const stage = deriveCourseMemberStage({
      isComplete: false,
      certificateAvailable: true,
      progressPercent: 100,
      contentItems: completedItems
    });

    expect(stage).toEqual({
      kind: 'content',
      position: 3,
      title: 'Exercise 1',
      contentType: 'exercise'
    });
  });
});
