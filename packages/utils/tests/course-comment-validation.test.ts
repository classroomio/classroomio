import { describe, expect, it } from 'vitest';

import {
  ZCourseCommentAnchorInput,
  ZCourseCommentPresence,
  ZCourseCommentWrite,
  ZCreateCourseCommentThread
} from '../src/validation/course-comment';

const LESSON = '1b6f8a7e-6c3e-4f62-9a54-2d7c1c1f1a01';
const BLOCK = '2b6f8a7e-6c3e-4f62-9a54-2d7c1c1f1a01';
const EXERCISE = '3b6f8a7e-6c3e-4f62-9a54-2d7c1c1f1a01';
const ADA = '4b6f8a7e-6c3e-4f62-9a54-2d7c1c1f1a01';

describe('ZCourseCommentAnchorInput', () => {
  it('accepts every anchor type', () => {
    const anchors = [
      { type: 'course' },
      { type: 'page', page: { lessonId: LESSON } },
      { type: 'page', page: { exerciseId: EXERCISE } },
      { type: 'block', lessonId: LESSON, blockId: BLOCK },
      {
        type: 'text',
        lessonId: LESSON,
        blockId: BLOCK,
        locale: 'en',
        quote: 'price',
        prefix: 'the ',
        suffix: ' is',
        start: 4
      },
      { type: 'time', lessonId: LESSON, blockId: BLOCK, seconds: 134 },
      { type: 'slide', lessonId: LESSON, blockId: BLOCK, slideNumber: null },
      { type: 'slide', lessonId: LESSON, blockId: BLOCK, slideNumber: 3 },
      { type: 'point', lessonId: LESSON, blockId: BLOCK, x: null, y: null },
      { type: 'point', lessonId: LESSON, blockId: BLOCK, x: 19, y: 36 },
      { type: 'question', exerciseId: EXERCISE, questionId: 12 }
    ];

    for (const anchor of anchors) {
      expect(ZCourseCommentAnchorInput.safeParse(anchor).success, JSON.stringify(anchor)).toBe(true);
    }
  });

  it('rejects a page with both or neither owner', () => {
    expect(ZCourseCommentAnchorInput.safeParse({ type: 'page', page: {} }).success).toBe(false);
    expect(
      ZCourseCommentAnchorInput.safeParse({ type: 'page', page: { lessonId: LESSON, exerciseId: EXERCISE } }).success
    ).toBe(false);
  });

  it('rejects half a pin and out-of-range coordinates', () => {
    expect(
      ZCourseCommentAnchorInput.safeParse({ type: 'point', lessonId: LESSON, blockId: BLOCK, x: 10, y: null }).success
    ).toBe(false);
    expect(
      ZCourseCommentAnchorInput.safeParse({ type: 'point', lessonId: LESSON, blockId: BLOCK, x: 101, y: 3 }).success
    ).toBe(false);
  });

  it('rejects an empty quote and an unknown locale', () => {
    const base = { type: 'text', lessonId: LESSON, blockId: BLOCK, prefix: '', suffix: '', start: 0 };

    expect(ZCourseCommentAnchorInput.safeParse({ ...base, locale: 'en', quote: '' }).success).toBe(false);
    expect(ZCourseCommentAnchorInput.safeParse({ ...base, locale: 'xx', quote: 'a' }).success).toBe(false);
  });
});

describe('ZCourseCommentWrite', () => {
  it('defaults mentions and accepts valid spans', () => {
    expect(ZCourseCommentWrite.parse({ body: 'Looks good' })).toEqual({ body: 'Looks good', mentions: [] });
    expect(
      ZCourseCommentWrite.safeParse({ body: '@Ada fix this', mentions: [{ profileId: ADA, start: 0, end: 4 }] }).success
    ).toBe(true);
  });

  it('rejects blank bodies and bad spans', () => {
    expect(ZCourseCommentWrite.safeParse({ body: '   ' }).success).toBe(false);
    expect(
      ZCourseCommentWrite.safeParse({ body: 'fix this', mentions: [{ profileId: ADA, start: 0, end: 4 }] }).success
    ).toBe(false);
  });
});

describe('ZCreateCourseCommentThread', () => {
  it('requires an anchor', () => {
    expect(ZCreateCourseCommentThread.safeParse({ body: 'Hi' }).success).toBe(false);
    expect(ZCreateCourseCommentThread.safeParse({ body: 'Hi', anchor: { type: 'course' } }).success).toBe(true);
  });
});

describe('ZCourseCommentPresence', () => {
  it('bounds cursor fractions', () => {
    expect(
      ZCourseCommentPresence.safeParse({ pageId: LESSON, cursor: { blockId: null, x: 0.5, y: 1 }, typing: null })
        .success
    ).toBe(true);
    expect(
      ZCourseCommentPresence.safeParse({ pageId: LESSON, cursor: { blockId: null, x: 2, y: 0 }, typing: null }).success
    ).toBe(false);
  });
});
