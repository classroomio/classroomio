import * as z from 'zod';
import { describe, expect, it } from 'vitest';

import {
  ZPublicApiCourseLessonCommentParam,
  ZPublicApiCourseLessonCommentsQuery,
  ZPublicApiCourseLessonHistoryQuery,
  ZPublicApiCourseLessonParam,
  ZPublicApiCourseLessonTranslationParam,
  ZPublicApiCourseLessonTranslationsQuery,
  ZPublicApiCourseLessonsQuery,
  ZPublicApiCourseSectionParam,
  ZPublicApiCourseSectionsQuery,
  ZPublicApiCreateCourseLessonComment,
  ZPublicApiCreateCourseSection,
  ZPublicApiDeleteCourseContent,
  ZPublicApiReorderCourseContent,
  ZPublicApiSetCourseLessonTranslation,
  ZPublicApiUpdateCourseContentLock,
  ZPublicApiUpdateCourseLessonComment,
  ZPublicApiUpdateCourseSection
} from '../src/validation/public-api';

const SECTION_A = '11111111-1111-4111-8111-111111111111';
const SECTION_B = '22222222-2222-4222-8222-222222222222';
const LESSON = '33333333-3333-4333-8333-333333333333';

// The public API is versioned; a change to any of these shapes is a contract change and must be deliberate.
const requestSchemas = {
  ZPublicApiCourseSectionParam,
  ZPublicApiCourseLessonParam,
  ZPublicApiCourseLessonTranslationParam,
  ZPublicApiCourseLessonCommentParam,
  ZPublicApiCourseSectionsQuery,
  ZPublicApiCreateCourseSection,
  ZPublicApiUpdateCourseSection,
  ZPublicApiCourseLessonsQuery,
  ZPublicApiCourseLessonTranslationsQuery,
  ZPublicApiSetCourseLessonTranslation,
  ZPublicApiCourseLessonHistoryQuery,
  ZPublicApiCourseLessonCommentsQuery,
  ZPublicApiCreateCourseLessonComment,
  ZPublicApiUpdateCourseLessonComment,
  ZPublicApiReorderCourseContent,
  ZPublicApiUpdateCourseContentLock,
  ZPublicApiDeleteCourseContent
};

describe('public API course content request contract', () => {
  it.each(Object.entries(requestSchemas))('%s keeps its published shape', (name, schema) => {
    expect(z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' })).toMatchSnapshot(name);
  });

  it('create section takes order, or moveUngrouped without order', () => {
    expect(ZPublicApiCreateCourseSection.safeParse({ title: 'Week 1', order: 1 }).success).toBe(true);
    expect(ZPublicApiCreateCourseSection.safeParse({ title: 'Week 1', moveUngrouped: true }).success).toBe(true);
    expect(ZPublicApiCreateCourseSection.safeParse({ title: 'Week 1' }).success).toBe(false);
    expect(ZPublicApiCreateCourseSection.safeParse({ title: 'Week 1', order: 1, moveUngrouped: true }).success).toBe(
      false
    );
  });

  it('rejects an empty section update', () => {
    expect(ZPublicApiUpdateCourseSection.safeParse({}).success).toBe(false);
  });

  it('keeps the dashboard reorder rules', () => {
    expect(ZPublicApiReorderCourseContent.safeParse({}).success).toBe(false);
    expect(
      ZPublicApiReorderCourseContent.safeParse({
        sections: [
          { id: SECTION_A, order: 1 },
          { id: SECTION_B, order: 3 }
        ]
      }).success
    ).toBe(false);
    expect(
      ZPublicApiReorderCourseContent.safeParse({
        items: [{ id: LESSON, type: 'LESSON', sectionId: SECTION_A, order: 1 }]
      }).success
    ).toBe(true);
  });

  it('rejects duplicate items in lock and delete batches', () => {
    const item = { id: LESSON, type: 'LESSON' };
    expect(ZPublicApiDeleteCourseContent.safeParse({ items: [item, item] }).success).toBe(false);
    expect(
      ZPublicApiUpdateCourseContentLock.safeParse({
        items: [
          { ...item, isUnlocked: true },
          { ...item, isUnlocked: false }
        ]
      }).success
    ).toBe(false);
  });

  it('only accepts numeric comment ids and timestamp|id cursors', () => {
    expect(ZPublicApiCourseLessonCommentsQuery.safeParse({ cursor: '2026-09-30 10:00:00.123456+00|7' }).success).toBe(
      true
    );
    for (const cursor of ['7', 'abc', 'garbage|7', '9999-99-99 00:00:00+00|7', '2026-09-30 10:00:00+00|x']) {
      expect(ZPublicApiCourseLessonCommentsQuery.safeParse({ cursor }).success).toBe(false);
    }
    expect(
      ZPublicApiCourseLessonCommentParam.safeParse({ courseId: SECTION_A, lessonId: LESSON, commentId: 'x' }).success
    ).toBe(false);
  });
});
