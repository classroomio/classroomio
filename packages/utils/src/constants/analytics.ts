export const ANALYTICS_SCOPE_TYPES = ['cohort', 'course', 'org'] as const;

export const ANALYTICS_SOURCES = [
  'student',
  'student_course',
  'assessment_result',
  'section_activity',
  'question_result',
  'lesson_progress',
  'login_day',
  'overdue_item',
  'org_member',
  'cohort_summary',
  'overdue_student'
] as const;

export const ANALYTICS_DIMENSIONS = [
  'student',
  'course',
  'cohort',
  'exercise',
  'section',
  'lesson',
  'question',
  'item',
  'day',
  'period',
  'status',
  'overdue_kind',
  'progress_bucket_25',
  'score_bucket_10'
] as const;

export const ANALYTICS_METRICS = [
  'rows',
  'name',
  'email',
  'avatar_url',
  'title',
  'overall_progress_pct',
  'progress_pct',
  'progress_pct_at_period_start',
  'avg_score_pct',
  'best_score_pct',
  'section_score_pct',
  'score_points',
  'pass_mark',
  'passed',
  'attempts',
  'state',
  'is_pass_required',
  'is_graded',
  'is_attempted',
  'is_awaiting_grade',
  'is_complete',
  'is_completed',
  'is_completed_all',
  'is_certified',
  'certificates',
  'courses_total',
  'courses_completed',
  'days_to_finish',
  'enrolled_at',
  'now_at_item_id',
  'now_at_title',
  'took_all',
  'video_pct',
  'attendance_pct',
  'attendance',
  'last_login_at',
  'days_since_login',
  'logged_in_today',
  'logged_in',
  'is_overdue',
  'is_inactive',
  'is_low_score',
  'is_low_video',
  'is_at_risk',
  'status',
  'status_rank',
  'correct_pct',
  'wrong_answer',
  'kind',
  'due_at',
  'days_overdue',
  'assignment_id',
  'course_titles',
  'members_added',
  'members_total',
  'first_try_pass',
  'passed_first_try',
  'pass_mark_exercises',
  'pass_mark_passed',
  'still_to_pass',
  'took_pass_mark',
  'has_still_to_pass',
  'enrolled_in_period',
  'completed_in_period',
  'completion_rate_at_period_start',
  'overall_progress_pct_existing',
  'overall_progress_pct_at_period_start',
  'has_overdue_goal',
  'question_context',
  'item_titles',
  'course_progress_pct',
  'has_goal',
  'students',
  'pending_invites',
  'avg_progress_pct',
  'overdue_students',
  'at_risk_students',
  'completed_students',
  'cohort_created_at',
  'course_created_at',
  'logged_in_period',
  'completed_all_in_period',
  'completed_in_window',
  'certified_in_period'
] as const;

export const ANALYTICS_AGGS = [
  'value',
  'count',
  'count_if',
  'sum',
  'avg',
  'median',
  'p25',
  'p75',
  'rate',
  'pooled',
  'mode',
  'running_count'
] as const;

export const ANALYTICS_FILTER_FIELDS = [
  'course',
  'cohort',
  'student',
  'exercise',
  'section',
  'status',
  'overdue_kind',
  'students',
  'avg_score_pct',
  'is_pass_required',
  'logged_in_today',
  'is_inactive',
  'is_overdue',
  'is_completed_all',
  'has_certificate',
  'is_attempted',
  'is_graded'
] as const;

export const ANALYTICS_FILTER_OPS = ['eq', 'in', 'gte', 'lt', 'is_true', 'is_false'] as const;

export const ANALYTICS_VIZ_TYPES = [
  'kpi',
  'line',
  'line_band',
  'multi_line',
  'grouped_bar',
  'column',
  'histogram',
  'donut',
  'hbar',
  'table',
  'matrix'
] as const;

export const ANALYTICS_STATUSES = ['at_risk', 'lagging', 'on_track', 'completed'] as const;

export const ANALYTICS_OVERDUE_KINDS = ['goal', 'compliance', 'exercise'] as const;

export const ANALYTICS_LOGIN_WINDOWS = [7, 14, 30] as const;

export const ANALYTICS_THRESHOLDS = {
  inactiveDays: 2,
  lowScorePct: 50,
  laggingScorePct: 65,
  lowVideoPct: 60,
  alertSharePct: 5,
  heatGoodPct: 70,
  heatWarnPct: 50,
  dropoffWarnPct: 75,
  dropoffBadPct: 50
} as const;

export const ANALYTICS_LIMITS = {
  pageSize: 25,
  studentsPageSize: 10,
  maxRows: 1000,
  maxExportRows: 50_000,
  maxExportExerciseCells: 200_000,
  maxMeasures: 16,
  maxFilterValues: 100,
  maxSearchLength: 100,
  maxOutlineCourses: 50,
  glanceCohorts: 5,
  comparedCohorts: 4,
  chartedCohorts: 3,
  emptyCohortNames: 3,
  cohortSearchPageSize: 20,
  hardestExercises: 4,
  hardestQuestions: 5,
  cardPageSize: 5,
  chartPageSize: 4,
  studentTargetMax: 1_000_000,
  maxRangeDays: 90,
  coursePickerSearchFrom: 9,
  maxPage: 4000,
  maxOffset: 100_000
} as const;

export const ANALYTICS_RANGES = ['all', '7d', '30d', '90d'] as const;

export const ANALYTICS_WIDGET_REQUIREMENTS = ['grouping', 'pass_required', 'cohorts'] as const;

export const ANALYTICS_BREAKDOWN_GROUPS = ['core', 'courses', 'cohorts'] as const;

/**
 * Days each range covers, counting today. Null is All time.
 */
export const ANALYTICS_RANGE_DAYS: Record<TAnalyticsRange, number | null> = {
  all: null,
  '7d': 7,
  '30d': 30,
  '90d': 90
};

/**
 * Days of history the free plan can see. Paid plans and self-hosted see every range.
 */
export const FREE_PLAN_ANALYTICS_DAYS = 7;

/**
 * The period "+N" changes compare against under All time: this week.
 */
export const ANALYTICS_DEFAULT_PERIOD_DAYS = 7;

export const ANALYTICS_PLACEHOLDERS = {
  course: '$course',
  student: '$student',
  exercise: '$exercise'
} as const;

export type TAnalyticsScopeType = (typeof ANALYTICS_SCOPE_TYPES)[number];
export type TAnalyticsSource = (typeof ANALYTICS_SOURCES)[number];
export type TAnalyticsDimension = (typeof ANALYTICS_DIMENSIONS)[number];
export type TAnalyticsMetric = (typeof ANALYTICS_METRICS)[number];
export type TAnalyticsAgg = (typeof ANALYTICS_AGGS)[number];
export type TAnalyticsFilterField = (typeof ANALYTICS_FILTER_FIELDS)[number];
export type TAnalyticsFilterOp = (typeof ANALYTICS_FILTER_OPS)[number];
export type TAnalyticsVizType = (typeof ANALYTICS_VIZ_TYPES)[number];
export type TAnalyticsStatus = (typeof ANALYTICS_STATUSES)[number];
export type TAnalyticsRange = (typeof ANALYTICS_RANGES)[number];
export type TAnalyticsWidgetRequirement = (typeof ANALYTICS_WIDGET_REQUIREMENTS)[number];
export type TAnalyticsBreakdownGroup = (typeof ANALYTICS_BREAKDOWN_GROUPS)[number];
