import { describe, expect, it } from 'vitest';

import { buildCourseCommentThreadPath } from '../src/functions/course-comment-links';

describe('buildCourseCommentThreadPath', () => {
  it('opens lesson threads on the lesson page', () => {
    expect(buildCourseCommentThreadPath('c1', { threadId: 't1', lessonId: 'l1', exerciseId: null })).toBe(
      '/courses/c1/lessons/l1?thread=t1'
    );
  });

  it('opens exercise and question threads on the exercise page', () => {
    expect(buildCourseCommentThreadPath('c1', { threadId: 't1', lessonId: null, exerciseId: 'e1' })).toBe(
      '/courses/c1/exercises/e1?thread=t1'
    );
  });

  it('opens course-wide threads on the lessons list', () => {
    expect(buildCourseCommentThreadPath('c1', { threadId: 't1', lessonId: null, exerciseId: null })).toBe(
      '/courses/c1/lessons?thread=t1'
    );
  });
});
