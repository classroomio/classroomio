export const INSIGHTS_SCOPE_TYPES = ['cohort', 'course', 'org'] as const;

export const INSIGHTS_SOURCES = [
  'learner',
  'learner_course',
  'assessment_result',
  'section_activity',
  'question_result',
  'lesson_progress',
  'login_day',
  'overdue_item',
  'org_member',
  'cohort_summary',
  'overdue_learner'
] as const;

export const INSIGHTS_DIMENSIONS = [
  'learner',
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

export const INSIGHTS_METRICS = [
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
  'learners',
  'pending_invites',
  'avg_progress_pct',
  'overdue_learners',
  'at_risk_learners',
  'completed_learners',
  'cohort_created_at',
  'logged_in_period',
  'completed_all_in_period',
  'completed_in_window',
  'certified_in_period'
] as const;

export const INSIGHTS_AGGS = [
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

export const INSIGHTS_FILTER_FIELDS = [
  'course',
  'cohort',
  'learner',
  'exercise',
  'section',
  'status',
  'overdue_kind',
  'avg_score_pct',
  'is_pass_required',
  'logged_in_today',
  'is_inactive',
  'is_overdue',
  'is_completed_all',
  'has_certificate'
] as const;

export const INSIGHTS_FILTER_OPS = ['eq', 'in', 'gte', 'lt', 'is_true', 'is_false'] as const;

export const INSIGHTS_VIZ_TYPES = [
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

export const INSIGHTS_STATUSES = ['at_risk', 'lagging', 'on_track', 'completed'] as const;

export const INSIGHTS_OVERDUE_KINDS = ['goal', 'compliance', 'exercise'] as const;

export const INSIGHTS_LOGIN_WINDOWS = [7, 14, 30] as const;

export const INSIGHTS_THRESHOLDS = {
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

export const INSIGHTS_LIMITS = {
  pageSize: 25,
  learnersPageSize: 10,
  maxRows: 1000,
  maxExportRows: 50_000,
  maxMeasures: 16,
  maxFilterValues: 100,
  maxSearchLength: 100,
  maxOutlineCourses: 50,
  glanceCohorts: 5,
  comparedCohorts: 4,
  chartedCohorts: 3,
  hardestExercises: 4,
  learnerTargetMax: 1_000_000,
  maxRangeDays: 90,
  maxPage: 4000,
  maxOffset: 100_000
} as const;

export const INSIGHTS_RANGES = ['all', '7d', '30d', '90d'] as const;

/**
 * Days each range covers, counting today. Null is All time.
 */
export const INSIGHTS_RANGE_DAYS: Record<TInsightsRange, number | null> = { all: null, '7d': 7, '30d': 30, '90d': 90 };

/**
 * The period "+N" changes compare against under All time: this week.
 */
export const INSIGHTS_DEFAULT_PERIOD_DAYS = 7;

export const INSIGHTS_PLACEHOLDERS = {
  course: '$course',
  learner: '$learner',
  exercise: '$exercise'
} as const;

export type TInsightsScopeType = (typeof INSIGHTS_SCOPE_TYPES)[number];
export type TInsightsSource = (typeof INSIGHTS_SOURCES)[number];
export type TInsightsDimension = (typeof INSIGHTS_DIMENSIONS)[number];
export type TInsightsMetric = (typeof INSIGHTS_METRICS)[number];
export type TInsightsAgg = (typeof INSIGHTS_AGGS)[number];
export type TInsightsFilterField = (typeof INSIGHTS_FILTER_FIELDS)[number];
export type TInsightsFilterOp = (typeof INSIGHTS_FILTER_OPS)[number];
export type TInsightsVizType = (typeof INSIGHTS_VIZ_TYPES)[number];
export type TInsightsStatus = (typeof INSIGHTS_STATUSES)[number];
export type TInsightsRange = (typeof INSIGHTS_RANGES)[number];
