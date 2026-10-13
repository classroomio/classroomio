import { describe, expect, it } from 'vitest';

import { ZCourseImportDraftPayload } from '../src/validation/course-import/course-import';
import {
  ZPublicApiCourseAnalyticsStudentResponse,
  ZPublicApiCourseAnalyticsSummaryResponse,
  ZPublicApiLearnerAnalyticsResponse
} from '../src/validation/public-api/analytics-responses';
import { ZPublicApiCourseMemberListItemResponse } from '../src/validation/public-api/course-member-responses';

const section = { externalId: 'sec-1', title: 'Getting started', order: 1 };
const lesson = {
  externalId: 'les-1',
  sectionExternalId: 'sec-1',
  title: 'Welcome',
  order: 1
};
const language = { lessonExternalId: 'les-1', locale: 'en' as const, content: '<p>Welcome.</p>' };

function payload(overrides: Record<string, unknown> = {}) {
  return {
    course: { title: 'Course', description: 'Description', type: 'SELF_PACED' },
    sections: [section],
    lessons: [lesson],
    lessonLanguages: [language],
    ...overrides
  };
}

const ACTIVITY_ID = '11111111-1111-4111-8111-111111111111';

describe('draft activities', () => {
  it('accepts activities placed in the shared order space', () => {
    const parsed = ZCourseImportDraftPayload.parse(
      payload({
        lessons: [
          { ...lesson, order: 1 },
          { ...lesson, externalId: 'les-2', title: 'Second', order: 2 }
        ],
        lessonLanguages: [language, { lessonExternalId: 'les-2', locale: 'en' as const, content: '<p>Second.</p>' }],
        activities: [{ existingActivityId: ACTIVITY_ID, sectionExternalId: 'sec-1', order: 3 }]
      })
    );

    expect(parsed.activities).toHaveLength(1);
  });

  it('rejects unknown sections and duplicate references', () => {
    expect(() =>
      ZCourseImportDraftPayload.parse(
        payload({ activities: [{ existingActivityId: ACTIVITY_ID, sectionExternalId: 'nope', order: 2 }] })
      )
    ).toThrow();

    expect(() =>
      ZCourseImportDraftPayload.parse(
        payload({
          activities: [
            { existingActivityId: ACTIVITY_ID, sectionExternalId: 'sec-1', order: 2 },
            { existingActivityId: ACTIVITY_ID, sectionExternalId: 'sec-1', order: 3 }
          ]
        })
      )
    ).toThrow();
  });

  it('rejects gaps in the shared order space', () => {
    expect(() =>
      ZCourseImportDraftPayload.parse(
        payload({ activities: [{ existingActivityId: ACTIVITY_ID, sectionExternalId: 'sec-1', order: 3 }] })
      )
    ).toThrow();
  });

  it('requires lessons except when activities are referenced', () => {
    expect(() => ZCourseImportDraftPayload.parse(payload({ lessons: [], lessonLanguages: [] }))).toThrow();

    const scorm = ZCourseImportDraftPayload.parse(
      payload({
        course: { title: 'Course', description: 'Description', type: 'SELF_PACED', format: 'single_activity' as const },
        lessons: [],
        lessonLanguages: [],
        activities: [{ existingActivityId: ACTIVITY_ID, sectionExternalId: 'sec-1', order: 1 }]
      })
    );

    expect(scorm.lessons).toHaveLength(0);
    expect(scorm.activities).toHaveLength(1);

    const standard = ZCourseImportDraftPayload.parse(
      payload({
        lessons: [],
        lessonLanguages: [],
        activities: [{ existingActivityId: ACTIVITY_ID, sectionExternalId: 'sec-1', order: 1 }]
      })
    );

    expect(standard.activities).toHaveLength(1);
  });

  it('requires lesson languages only when lessons exist', () => {
    expect(() => ZCourseImportDraftPayload.parse(payload({ lessonLanguages: [] }))).toThrow();
  });
});

describe('public API activity fields', () => {
  it('accepts activity content types and counters', () => {
    expect(
      ZPublicApiCourseMemberListItemResponse.shape.stage.parse({
        kind: 'content',
        position: 1,
        title: 'Package',
        contentType: 'activity'
      })
    ).toMatchObject({ contentType: 'activity' });

    expect(
      ZPublicApiLearnerAnalyticsResponse.shape.courses.parse([
        {
          id: '22222222-2222-4222-8222-222222222222',
          title: 'Course',
          type: null,
          lessonsCount: 1,
          lessonsCompleted: 1,
          exercisesCount: 0,
          exercisesCompleted: 0,
          activitiesCount: 2,
          activitiesCompleted: 1,
          progressPercentage: 50,
          progressFailed: false,
          averageGrade: null,
          certificateEarnedAt: null,
          complianceStatus: null,
          exercises: null
        }
      ])[0]
    ).toMatchObject({ activitiesCount: 2 });

    expect(
      ZPublicApiCourseAnalyticsSummaryResponse.parse({
        totalTutors: 1,
        totalStudents: 2,
        totalLessons: 1,
        totalExercises: 0,
        totalActivities: 2,
        averageProgress: 50,
        averageExerciseCompletion: 0,
        averageGrade: 0
      })
    ).toMatchObject({ totalActivities: 2 });

    expect(
      ZPublicApiCourseAnalyticsStudentResponse.parse({
        profileId: '33333333-3333-4333-8333-333333333333',
        fullname: 'Learner',
        email: 'learner@example.com',
        avatarUrl: '',
        lessonsCompleted: 1,
        totalLessons: 1,
        exercisesSubmitted: 0,
        totalExercises: 0,
        activitiesCompleted: 1,
        totalActivities: 2,
        averageGrade: 0,
        progressPercentage: 50,
        lastSeen: null
      })
    ).toMatchObject({ totalActivities: 2 });
  });
});
