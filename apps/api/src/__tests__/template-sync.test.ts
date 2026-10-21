import { describe, expect, it } from 'vitest';
import {
  detectSettingChanges,
  detectTemplateContentChanges,
  insertionOrder,
  preparePullSelection,
  type SettingCarrier,
  type SyncActivity,
  type SyncExercise,
  type SyncLesson,
  type SyncSection
} from '@cio/utils/validation/course/template-sync';

const courseCreatedAt = '2026-01-01T00:00:00.000Z';
const beforeCourse = '2025-12-01T00:00:00.000Z';
const afterCourse = '2026-02-01T00:00:00.000Z';
const pulledAt = '2026-01-02T00:00:00.000Z';
const editedAt = '2026-03-01T00:00:00.000Z';

function section(overrides: Partial<SyncSection> & Pick<SyncSection, 'id'>): SyncSection {
  return {
    title: 'Section',
    createdAt: beforeCourse,
    updatedAt: beforeCourse,
    order: 0,
    sourceId: null,
    sourceSyncedAt: null,
    ...overrides
  };
}

function lesson(overrides: Partial<SyncLesson> & Pick<SyncLesson, 'id'>): SyncLesson {
  return {
    title: 'Lesson',
    createdAt: beforeCourse,
    updatedAt: beforeCourse,
    order: 0,
    sectionId: null,
    sourceId: null,
    sourceSyncedAt: null,
    locales: [{ locale: 'en', updatedAt: beforeCourse }],
    ...overrides
  };
}

function exercise(overrides: Partial<SyncExercise> & Pick<SyncExercise, 'id'>): SyncExercise {
  return {
    title: 'Exercise',
    createdAt: beforeCourse,
    updatedAt: beforeCourse,
    order: 0,
    sectionId: null,
    lessonId: null,
    sourceId: null,
    sourceSyncedAt: null,
    childUpdatedAt: [],
    submissionCount: 0,
    ...overrides
  };
}

function activity(overrides: Partial<SyncActivity> & Pick<SyncActivity, 'id'>): SyncActivity {
  return {
    title: 'Package',
    createdAt: beforeCourse,
    updatedAt: beforeCourse,
    order: 0,
    sectionId: null,
    sourceId: null,
    sourceSyncedAt: null,
    ...overrides
  };
}

function carrier(overrides: Partial<SettingCarrier> = {}): SettingCarrier {
  return {
    description: 'About',
    bannerImage: null,
    cost: 0,
    currency: 'USD',
    updatedAt: beforeCourse,
    metadata: { progressionMode: 'free' },
    certificate: {},
    ...overrides
  };
}

describe('detectTemplateContentChanges', () => {
  it('marks a lesson updated when the template changed after the last pull', () => {
    const units = detectTemplateContentChanges({
      courseCreatedAt,
      templateSections: [],
      templateLessons: [lesson({ id: 'lesson-1', updatedAt: editedAt })],
      templateExercises: [],
      courseSections: [],
      courseLessons: [lesson({ id: 'copy-1', sourceId: 'lesson-1', sourceSyncedAt: pulledAt, updatedAt: pulledAt })],
      courseExercises: []
    });

    expect(units).toMatchObject([{ id: 'lesson-1', change: 'updated', editedLocally: false }]);
  });

  it('ignores a lesson that has not changed since it was pulled', () => {
    const units = detectTemplateContentChanges({
      courseCreatedAt,
      templateSections: [],
      templateLessons: [lesson({ id: 'lesson-1', updatedAt: pulledAt })],
      templateExercises: [],
      courseSections: [],
      courseLessons: [lesson({ id: 'copy-1', sourceId: 'lesson-1', sourceSyncedAt: pulledAt, updatedAt: pulledAt })],
      courseExercises: []
    });

    expect(units).toEqual([]);
  });

  it('marks a missing copy as removed locally only when the template item existed first', () => {
    const units = detectTemplateContentChanges({
      courseCreatedAt,
      templateSections: [
        section({ id: 'old-section', createdAt: beforeCourse }),
        section({ id: 'new-section', createdAt: afterCourse, order: 1 })
      ],
      templateLessons: [],
      templateExercises: [],
      courseSections: [],
      courseLessons: [],
      courseExercises: []
    });

    expect(units).toEqual([
      expect.objectContaining({ id: 'old-section', change: 'new', removedLocally: true }),
      expect.objectContaining({ id: 'new-section', change: 'new', removedLocally: false })
    ]);
  });

  it('locks an updated exercise that has submissions and warns when the copy was edited', () => {
    const units = detectTemplateContentChanges({
      courseCreatedAt,
      templateSections: [],
      templateLessons: [],
      templateExercises: [exercise({ id: 'exercise-1', updatedAt: editedAt })],
      courseSections: [],
      courseLessons: [],
      courseExercises: [
        exercise({
          id: 'copy-1',
          sourceId: 'exercise-1',
          sourceSyncedAt: pulledAt,
          updatedAt: editedAt,
          submissionCount: 4
        })
      ]
    });

    expect(units).toMatchObject([
      { id: 'exercise-1', change: 'updated', locked: true, submissionCount: 4, editedLocally: true }
    ]);
  });

  it('marks a new template activity with its section as parent', () => {
    const units = detectTemplateContentChanges({
      courseCreatedAt,
      templateSections: [section({ id: 'section-1', createdAt: afterCourse })],
      templateLessons: [],
      templateExercises: [],
      templateActivities: [activity({ id: 'activity-1', createdAt: afterCourse, sectionId: 'section-1' })],
      courseSections: [],
      courseLessons: [],
      courseExercises: [],
      courseActivities: []
    });

    expect(units).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'activity-1',
          kind: 'activity',
          change: 'new',
          parentId: 'section-1',
          locked: false
        })
      ])
    );
  });

  it('marks a renamed activity updated without locales or locks', () => {
    const units = detectTemplateContentChanges({
      courseCreatedAt,
      templateSections: [],
      templateLessons: [],
      templateExercises: [],
      templateActivities: [activity({ id: 'activity-1', title: 'Renamed', updatedAt: editedAt })],
      courseSections: [],
      courseLessons: [],
      courseExercises: [],
      courseActivities: [
        activity({ id: 'copy-1', sourceId: 'activity-1', sourceSyncedAt: pulledAt, updatedAt: pulledAt })
      ]
    });

    expect(units).toMatchObject([
      { id: 'activity-1', kind: 'activity', change: 'updated', titleChanged: true, contentChanged: true }
    ]);
  });

  it('ignores an activity that has not changed since it was pulled', () => {
    const units = detectTemplateContentChanges({
      courseCreatedAt,
      templateSections: [],
      templateLessons: [],
      templateExercises: [],
      templateActivities: [activity({ id: 'activity-1', updatedAt: pulledAt })],
      courseSections: [],
      courseLessons: [],
      courseExercises: [],
      courseActivities: [
        activity({ id: 'copy-1', sourceId: 'activity-1', sourceSyncedAt: pulledAt, updatedAt: pulledAt })
      ]
    });

    expect(units).toEqual([]);
  });

  it('detects a package version change on a copied activity', () => {
    const units = detectTemplateContentChanges({
      courseCreatedAt,
      templateSections: [],
      templateLessons: [],
      templateExercises: [],
      templateActivities: [
        activity({ id: 'activity-1', updatedAt: pulledAt, packageVersionId: 'version-2', packageUpdatedAt: editedAt })
      ],
      courseSections: [],
      courseLessons: [],
      courseExercises: [],
      courseActivities: [
        activity({
          id: 'copy-1',
          sourceId: 'activity-1',
          sourceSyncedAt: pulledAt,
          updatedAt: pulledAt,
          packageVersionId: 'version-1',
          packageUpdatedAt: pulledAt
        })
      ]
    });

    expect(units).toMatchObject([
      {
        id: 'activity-1',
        kind: 'activity',
        change: 'updated',
        titleChanged: false,
        contentChanged: true,
        editedLocally: false
      }
    ]);
  });

  it('ignores a shared package both sides already see', () => {
    const units = detectTemplateContentChanges({
      courseCreatedAt,
      templateSections: [],
      templateLessons: [],
      templateExercises: [],
      templateActivities: [
        activity({ id: 'activity-1', updatedAt: pulledAt, packageVersionId: 'version-1', packageUpdatedAt: pulledAt })
      ],
      courseSections: [],
      courseLessons: [],
      courseExercises: [],
      courseActivities: [
        activity({
          id: 'copy-1',
          sourceId: 'activity-1',
          sourceSyncedAt: pulledAt,
          updatedAt: pulledAt,
          packageVersionId: 'version-1',
          packageUpdatedAt: pulledAt
        })
      ]
    });

    expect(units).toEqual([]);
  });
});

describe('detectSettingChanges', () => {
  it('keeps a skipped setting visible after another setting was pulled', () => {
    const changes = detectSettingChanges({
      template: carrier({
        updatedAt: editedAt,
        description: 'New about',
        metadata: { progressionMode: 'sequential' }
      }),
      course: carrier({
        description: 'About',
        metadata: { progressionMode: 'free' }
      }),
      courseCreatedAt,
      syncedAtByKey: { description: editedAt }
    });

    expect(changes.map((change) => change.key)).toEqual(['progression']);
  });

  it('reads a missing self-enrollment setting as open, including the legacy key', () => {
    const changes = detectSettingChanges({
      template: carrier({
        updatedAt: editedAt,
        metadata: { allowNewStudent: true }
      }),
      course: carrier({
        metadata: { allowSelfEnrollment: false }
      }),
      courseCreatedAt,
      syncedAtByKey: {}
    });

    expect(changes.map((change) => change.key)).toContain('selfEnrollment');
  });
});

describe('preparePullSelection', () => {
  const units = detectTemplateContentChanges({
    courseCreatedAt,
    templateSections: [section({ id: 'section-1', createdAt: afterCourse })],
    templateLessons: [lesson({ id: 'lesson-1', createdAt: afterCourse, sectionId: 'section-1' })],
    templateExercises: [],
    courseSections: [],
    courseLessons: [],
    courseExercises: []
  });

  it('pulls a new lesson when the exercise also sits in an existing section', () => {
    const units = detectTemplateContentChanges({
      courseCreatedAt,
      templateSections: [section({ id: 'section-1' })],
      templateLessons: [lesson({ id: 'lesson-1', createdAt: afterCourse, sectionId: 'section-1' })],
      templateExercises: [
        exercise({ id: 'exercise-1', createdAt: afterCourse, sectionId: 'section-1', lessonId: 'lesson-1' })
      ],
      courseSections: [section({ id: 'copy-section', sourceId: 'section-1', sourceSyncedAt: pulledAt })],
      courseLessons: [],
      courseExercises: []
    });

    const selection = preparePullSelection(units, [], ['exercise-1'], []);
    expect(selection.ok).toBe(true);
    if (!selection.ok) return;

    expect(selection.unitIds).toEqual(expect.arrayContaining(['exercise-1', 'lesson-1']));
  });

  it('pulls a new parent when a new lesson is selected', () => {
    const selection = preparePullSelection(units, [], ['lesson-1'], []);
    expect(selection).toEqual({ ok: true, unitIds: ['lesson-1', 'section-1'], settingKeys: [] });
  });

  it('pulls a new parent when a new activity is selected', () => {
    const activityUnits = detectTemplateContentChanges({
      courseCreatedAt,
      templateSections: [section({ id: 'section-1', createdAt: afterCourse })],
      templateLessons: [],
      templateExercises: [],
      templateActivities: [activity({ id: 'activity-1', createdAt: afterCourse, sectionId: 'section-1' })],
      courseSections: [],
      courseLessons: [],
      courseExercises: [],
      courseActivities: []
    });
    const selection = preparePullSelection(activityUnits, [], ['activity-1'], []);
    expect(selection).toEqual({ ok: true, unitIds: ['activity-1', 'section-1'], settingKeys: [] });
  });

  it('rejects a locked exercise and a unit that is no longer listed', () => {
    const locked = detectTemplateContentChanges({
      courseCreatedAt,
      templateSections: [],
      templateLessons: [],
      templateExercises: [exercise({ id: 'exercise-1', updatedAt: editedAt })],
      courseSections: [],
      courseLessons: [],
      courseExercises: [
        exercise({ id: 'copy-1', sourceId: 'exercise-1', sourceSyncedAt: pulledAt, submissionCount: 1 })
      ]
    });

    expect(preparePullSelection(locked, [], ['exercise-1'], [])).toMatchObject({ ok: false, reason: 'locked' });
    expect(preparePullSelection(units, [], ['missing'], [])).toMatchObject({ ok: false, reason: 'stale' });
    expect(preparePullSelection(units, [], [], [])).toMatchObject({ ok: false, reason: 'empty' });
  });
});

describe('insertionOrder', () => {
  it('places a new item after the course copy of the preceding template sibling', () => {
    const order = insertionOrder(
      [
        { id: 'first', order: 0 },
        { id: 'second', order: 1 }
      ],
      'second',
      new Map([['first', { order: 4 }]]),
      [{ order: 4 }, { order: 9 }]
    );

    expect(order).toBe(5);
  });
});
