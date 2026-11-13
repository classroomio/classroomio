import { describe, expect, it } from 'vitest';

import type { TAnalyticsBreakdownGroup, TAnalyticsScopeType } from '../src/constants/analytics';
import {
  activeBreakdownGroup,
  availableBreakdownGroups,
  defaultBreakdownGroup,
  defaultCourseId,
  defaultExerciseId,
  isWidgetVisible,
  resolveWidgetSpec,
  studentsTableSpec,
  widgetUsesPlaceholder,
  type AnalyticsWidgetDashboard,
  type AnalyticsWidgetSelection
} from '../src/analytics';
import type { TAnalyticsQuerySpec, TAnalyticsWidget } from '../src/validation/analytics';

type TestCourse = { id: string; title: string; isGrouped: boolean; hasPassRequired: boolean };

type TestDashboard = {
  scope: {
    type: TAnalyticsScopeType;
    id: string;
    name: string;
    description: string | null;
    studentCount: number;
    pendingCount: number;
    cohortCount: number;
    activeCohortCount: number;
    studentTarget: number | null;
    courses: TestCourse[];
  };
  widgets: TAnalyticsWidget[];
  structures: Record<string, unknown>;
  refreshIntervalSeconds: number;
};

type TestSelection = AnalyticsWidgetSelection & { cohortIds: string[] | null };

function selectionOf(overrides: Partial<TestSelection> = {}): TestSelection {
  return {
    courseId: null,
    exerciseId: null,
    range: 'all',
    breakdown: 'courses',
    cohortIds: null,
    pages: {},
    ...overrides
  };
}

function widgetOf(id: string, spec: Partial<TAnalyticsQuerySpec> = {}): TAnalyticsWidget {
  return {
    id,
    titleKey: `analytics.widgets.${id}.title`,
    viz: 'table',
    span: 12,
    courseMode: 'any',
    breakdown: 'core',
    requires: [],
    usesRange: false,
    spec: {
      source: 'student',
      dimensions: [],
      measures: [],
      filters: [],
      sort: [],
      limit: 100,
      page: 1,
      range: 'all',
      ...spec
    }
  } as TAnalyticsWidget;
}

function dashboardOf(
  scope: Partial<TestDashboard['scope']> = {},
  structures: Record<string, unknown> = {}
): AnalyticsWidgetDashboard {
  return {
    scope: {
      type: 'cohort',
      id: 'coh1',
      name: 'Cohort 1',
      description: null,
      studentCount: 10,
      pendingCount: 0,
      cohortCount: 2,
      activeCohortCount: 1,
      studentTarget: null,
      courses: [
        { id: 'c1', title: 'Course 1', isGrouped: false, hasPassRequired: false },
        { id: 'c2', title: 'Course 2', isGrouped: true, hasPassRequired: true }
      ],
      ...scope
    },
    widgets: [],
    structures,
    refreshIntervalSeconds: 60
  };
}

describe('analytics widgets', () => {
  describe('resolveWidgetSpec', () => {
    const baseWidget = widgetOf('test-widget', {
      source: 'cohort_student',
      measures: [{ metric: 'rows', agg: 'count' }],
      filters: [{ field: 'course', op: 'eq', value: '$course' }]
    });

    it('fills $course placeholder when selection has courseId', () => {
      const selection = selectionOf({ courseId: 'c1' });
      const spec = resolveWidgetSpec(baseWidget, selection);
      expect(spec).not.toBeNull();
      expect(spec?.filters).toEqual([{ field: 'course', op: 'eq', value: 'c1' }]);
      expect(spec?.range).toBe('all');
    });

    it('returns null when a placeholder is required but missing from selection', () => {
      const spec = resolveWidgetSpec(baseWidget, selectionOf());
      expect(spec).toBeNull();
    });

    it('appends a course filter for courseMode: any only when a course is picked, and never twice', () => {
      const widgetWithoutCourseFilter = widgetOf('no-course', {
        source: 'cohort_student',
        measures: [{ metric: 'rows', agg: 'count' }],
        filters: []
      });
      const selectionWithCourse = selectionOf({ courseId: 'c1' });
      const spec = resolveWidgetSpec(widgetWithoutCourseFilter, selectionWithCourse);
      expect(spec?.filters).toEqual([{ field: 'course', op: 'eq', value: 'c1' }]);

      const spec2 = resolveWidgetSpec(baseWidget, selectionWithCourse);
      expect(spec2?.filters).toEqual([{ field: 'course', op: 'eq', value: 'c1' }]);
    });
  });

  describe('widgetUsesPlaceholder', () => {
    it('detects placeholders in filters', () => {
      const widget = widgetOf('w1', {
        source: 'student',
        measures: [],
        filters: [{ field: 'course', op: 'eq', value: '$course' }]
      });
      expect(widgetUsesPlaceholder(widget, 'course')).toBe(true);
      expect(widgetUsesPlaceholder(widget, 'exercise')).toBe(false);
    });
  });

  describe('breakdown groups', () => {
    const scopeOf = (type: TAnalyticsScopeType, cohortCount: number): TestDashboard['scope'] => ({
      type,
      id: 's1',
      name: 'Scope',
      description: null,
      studentCount: 10,
      pendingCount: 0,
      cohortCount,
      activeCohortCount: cohortCount,
      studentTarget: null,
      courses: []
    });

    it('offers courses always and cohorts only when the scope has cohorts', () => {
      expect(availableBreakdownGroups('cohort', { cohortCount: 2 })).toEqual([]);
      expect(availableBreakdownGroups('course', { cohortCount: 0 })).toEqual(['courses']);
      expect(availableBreakdownGroups('course', { cohortCount: 2 })).toEqual(['courses', 'cohorts']);
      expect(availableBreakdownGroups('org', { cohortCount: 0 })).toEqual(['courses']);
      expect(availableBreakdownGroups('org', { cohortCount: 2 })).toEqual(['courses', 'cohorts']);
    });

    it('defaults course scope to cohorts when it has them, and org scope to courses', () => {
      expect(defaultBreakdownGroup(scopeOf('course', 0))).toBe('courses');
      expect(defaultBreakdownGroup(scopeOf('course', 2))).toBe('cohorts');
      expect(defaultBreakdownGroup(scopeOf('org', 2))).toBe('courses');
      expect(defaultBreakdownGroup(scopeOf('cohort', 2))).toBe('courses');
    });

    it('falls back to the first available group when the selected one is gone', () => {
      const selection = selectionOf({ breakdown: 'cohorts' });

      expect(activeBreakdownGroup(selection, ['courses'])).toBe('courses');
      expect(activeBreakdownGroup(selection, ['courses', 'cohorts'])).toBe('cohorts');
      expect(activeBreakdownGroup(selection, [])).toBe('courses');
    });
  });

  describe('isWidgetVisible', () => {
    const mockDashboard = dashboardOf() as AnalyticsWidgetDashboard;

    it('handles all, single and any course modes', () => {
      const allWidget = widgetOf('w1', { source: 'cohort_student', measures: [] });
      allWidget.courseMode = 'all';
      const singleWidget = widgetOf('w2', { source: 'cohort_student', measures: [] });
      singleWidget.courseMode = 'single';

      expect(isWidgetVisible(allWidget, mockDashboard, selectionOf())).toBe(true);
      expect(isWidgetVisible(allWidget, mockDashboard, selectionOf({ courseId: 'c1' }))).toBe(false);

      expect(isWidgetVisible(singleWidget, mockDashboard, selectionOf())).toBe(false);
      expect(isWidgetVisible(singleWidget, mockDashboard, selectionOf({ courseId: 'c1' }))).toBe(true);
    });

    it('checks grouping and pass_required requirements', () => {
      const groupedWidget = widgetOf('w3', { source: 'cohort_student', measures: [] });
      groupedWidget.requires = ['grouping'];
      groupedWidget.courseMode = 'single';
      const passReqWidget = widgetOf('w4', { source: 'cohort_student', measures: [] });
      passReqWidget.requires = ['pass_required'];
      passReqWidget.courseMode = 'single';

      expect(isWidgetVisible(groupedWidget, mockDashboard, selectionOf({ courseId: 'c1' }))).toBe(false);
      expect(isWidgetVisible(passReqWidget, mockDashboard, selectionOf({ courseId: 'c1' }))).toBe(false);

      expect(isWidgetVisible(groupedWidget, mockDashboard, selectionOf({ courseId: 'c2' }))).toBe(true);
      expect(isWidgetVisible(passReqWidget, mockDashboard, selectionOf({ courseId: 'c2' }))).toBe(true);
    });

    it('shows only the active breakdown and hides cohort widgets without cohorts', () => {
      const courseDashboard = dashboardOf({ type: 'course', cohortCount: 2 });
      const courseWidget = widgetOf('course_widget', {});
      courseWidget.breakdown = 'courses' as TAnalyticsBreakdownGroup;
      const cohortWidget = widgetOf('cohort_widget', {});
      cohortWidget.breakdown = 'cohorts';
      cohortWidget.requires = ['cohorts'];
      const coreWidget = widgetOf('core_widget', {});
      const selection = selectionOf();

      expect(isWidgetVisible(courseWidget, courseDashboard, selection)).toBe(true);
      expect(isWidgetVisible(cohortWidget, courseDashboard, selection)).toBe(false);
      expect(isWidgetVisible(coreWidget, courseDashboard, selection)).toBe(true);
      expect(isWidgetVisible(cohortWidget, courseDashboard, { ...selection, breakdown: 'cohorts' })).toBe(true);
      expect(isWidgetVisible(courseWidget, courseDashboard, { ...selection, breakdown: 'cohorts' })).toBe(false);

      const noCohortsDashboard = dashboardOf({ type: 'course', cohortCount: 0 });

      expect(isWidgetVisible(cohortWidget, noCohortsDashboard, { ...selection, breakdown: 'cohorts' })).toBe(false);
    });

    it('keeps exercise widgets visible when the focused course has no exercises', () => {
      const exerciseWidget = widgetOf('exercise_score_distribution', {
        source: 'assessment_result',
        dimensions: [],
        measures: [],
        filters: [{ field: 'exercise', op: 'eq', value: '$exercise' }],
        sort: [],
        limit: 10,
        page: 1,
        range: 'all'
      });
      const emptyCourseDashboard = dashboardOf(
        {
          type: 'course',
          courses: [{ id: 'c1', title: 'Course 1', isGrouped: false, hasPassRequired: false }]
        },
        {
          c1: {
            courseId: 'c1',
            isGrouped: false,
            sections: [],
            items: [
              {
                id: 'l1',
                title: 'Lesson 1',
                type: 'LESSON',
                rank: 1,
                sectionId: null,
                isPassRequired: false,
                passMark: null,
                isLocked: false,
                maxPoints: null
              }
            ]
          }
        }
      );

      expect(isWidgetVisible(exerciseWidget, emptyCourseDashboard, selectionOf())).toBe(true);
    });
  });

  describe('defaults', () => {
    it('defaultCourseId only defaults course-scope dashboards', () => {
      const singleCourseDash = dashboardOf({
        type: 'cohort',
        courses: [{ id: 'c1', title: 'Course 1', isGrouped: false, hasPassRequired: false }]
      });
      expect(defaultCourseId(singleCourseDash)).toBeNull();

      const multiCourseDash = dashboardOf({
        type: 'cohort',
        courses: [
          { id: 'c1', title: 'C1', isGrouped: false, hasPassRequired: false },
          { id: 'c2', title: 'C2', isGrouped: false, hasPassRequired: false }
        ]
      });
      expect(defaultCourseId(multiCourseDash)).toBeNull();

      const courseDash = dashboardOf({
        type: 'course',
        id: 'c1',
        courses: [{ id: 'c1', title: 'Course 1', isGrouped: false, hasPassRequired: false }]
      });
      expect(defaultCourseId(courseDash)).toBe('c1');

      const orgDash = dashboardOf({
        type: 'org',
        courses: [
          { id: 'c1', title: 'C1', isGrouped: false, hasPassRequired: false },
          { id: 'c2', title: 'C2', isGrouped: false, hasPassRequired: false }
        ]
      });
      expect(defaultCourseId(orgDash)).toBeNull();
    });

    it('defaultExerciseId prefers the last pass-required exercise', () => {
      const structure = {
        courseId: 'c1',
        title: 'Course 1',
        items: [
          { id: 'e1', title: 'Exercise 1', type: 'EXERCISE', isPassRequired: false, passMark: null, isLocked: false },
          { id: 'e2', title: 'Exercise 2', type: 'EXERCISE', isPassRequired: true, passMark: 70, isLocked: false },
          { id: 'e3', title: 'Exercise 3', type: 'EXERCISE', isPassRequired: false, passMark: null, isLocked: false },
          { id: 'l1', title: 'Lesson 1', type: 'LESSON', isPassRequired: false, passMark: null, isLocked: false }
        ]
      } as const;
      expect(defaultExerciseId(structure)).toBe('e2');

      const noPassReq = {
        ...structure,
        items: [
          { id: 'e1', title: 'Exercise 1', type: 'EXERCISE', isPassRequired: false, passMark: null, isLocked: false },
          { id: 'e3', title: 'Exercise 3', type: 'EXERCISE', isPassRequired: false, passMark: null, isLocked: false }
        ]
      } as const;
      expect(defaultExerciseId(noPassReq)).toBe('e3');
    });
  });

  describe('studentsTableSpec', () => {
    const specOf = (query: Parameters<typeof studentsTableSpec>[0]) => studentsTableSpec(query);

    it('builds the dashboard student table spec', () => {
      const spec = specOf({ courseId: 'c1', page: 1, limit: 10 });

      expect(spec.source).toBe('student');
      expect(spec.dimensions).toEqual(['student']);
      expect(spec.filters).toEqual([{ field: 'course', op: 'eq', value: 'c1' }]);
      expect(spec.sort).toEqual([
        { field: 'status_rank__value', dir: 'asc' },
        { field: 'avg_score_pct__value', dir: 'asc' }
      ]);
      expect(spec.range).toBe('all');
      expect(spec.search).toBeUndefined();
    });

    it('maps status, overdue, search, sort and direction', () => {
      const spec = specOf({
        search: 'jane',
        status: 'at_risk',
        isOverdue: true,
        sort: 'last_login',
        dir: 'asc',
        page: 2,
        limit: 20
      });

      expect(spec.filters).toEqual([
        { field: 'status', op: 'eq', value: 'at_risk' },
        { field: 'is_overdue', op: 'is_true' }
      ]);
      expect(spec.search).toBe('jane');
      expect(spec.sort).toEqual([{ field: 'last_login_at__value', dir: 'asc' }]);
      expect(spec.page).toBe(2);
      expect(spec.limit).toBe(20);
    });

    it('keeps the dashboard filter vocabulary passed by the caller', () => {
      const spec = specOf({
        filters: [{ field: 'logged_in_today', op: 'is_true' }],
        courseId: 'c1',
        page: 1,
        limit: 10
      });

      expect(spec.filters).toEqual([
        { field: 'logged_in_today', op: 'is_true' },
        { field: 'course', op: 'eq', value: 'c1' }
      ]);
    });
  });
});
