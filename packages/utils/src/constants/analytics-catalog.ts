import type { TAnalyticsDimension, TAnalyticsFilterField, TAnalyticsMetric, TAnalyticsSource } from './analytics';

/**
 * What each query source returns. API documentation strings, not dashboard UI copy; they accompany the registry so
 * external callers and language models can choose a source correctly.
 */
export const ANALYTICS_SOURCE_DESCRIPTIONS: Record<TAnalyticsSource, string> = {
  student:
    'One row per learner in the scope, with their progress, average score, course totals, activity, status and overdue flags.',
  student_course:
    'One row per learner and course enrollment in the scope, with that course progress, score, completion and overdue state.',
  assessment_result: 'One row per learner and exercise, with attempt, grading and pass state from their submissions.',
  section_activity:
    'One row per learner and course section, with the section score, video watching and attendance results.',
  question_result: "One row per learner, exercise and scored question, read from the learner's best graded submission.",
  lesson_progress: 'One row per learner and lesson, with whether the learner completed it.',
  login_day: 'One row per learner and day in the login window, marking whether they logged in on that day.',
  overdue_item:
    'One row per learner and overdue goal, compliance cycle or required exercise, with due dates and lateness.',
  overdue_student:
    'One row per learner who has at least one overdue item, with the courses involved, progress and overdue count.',
  org_member: 'One row per period bucket, with how many students joined in it and the running total.',
  cohort_summary:
    'One row per cohort in the scope, with member counts, average progress and score, and cumulative pass rates.'
};

/** What each metric measures. */
export const ANALYTICS_METRIC_DESCRIPTIONS: Record<TAnalyticsMetric, string> = {
  rows: 'The number of rows in the working group, the row count used for counts and shares.',
  name: 'The learner full name.',
  email: 'The learner email address.',
  avatar_url: 'The learner avatar image URL.',
  title: 'The title of the item the row describes, such as the course or the overdue item.',
  overall_progress_pct:
    'Share of the required lessons and exercises (completion rule other than none) the learner completed across their enrollments in the scope.',
  progress_pct:
    'Share of the required lessons and exercises (completion rule other than none) of one course the learner completed in that enrollment.',
  progress_pct_at_period_start: 'The enrollment progress as of the start of the period used for comparisons.',
  avg_score_pct: 'Average graded score percentage for the rows in the group.',
  best_score_pct: 'The percentage of an exercise max points earned by the best graded submission.',
  section_score_pct: 'Average graded score percentage across the exercises of one section.',
  score_points: 'Points earned divided by points possible on graded submissions, as one pooled percentage.',
  pass_mark: 'The pass threshold percentage an exercise must reach, set only on pass-required exercises.',
  passed: 'Whether the learner met the exercise completion policy, defined only on pass-required exercises.',
  attempts: 'Number of submissions the learner made for an exercise inside the selected range.',
  state: 'The exercise attempt state: not_taken, awaiting_grade or graded.',
  is_pass_required: 'Whether the exercise must be passed, which is the passed completion policy.',
  is_graded: 'Whether the exercise has at least one graded submission.',
  is_attempted: 'Whether the learner made any submission for the exercise.',
  is_awaiting_grade: 'Whether the learner submitted the exercise but nothing is graded yet.',
  is_complete: 'Whether the learner met the exercise completion policy, whatever it is.',
  is_completed: 'Whether the learner completed every required item of the enrolled course.',
  is_completed_all: 'Whether the learner completed every course of the scope they are enrolled in.',
  is_certified: 'Whether a valid certificate exists for the course enrollment.',
  certificates: 'The number of the courses in the scope the learner holds a valid certificate for.',
  courses_total: 'Number of courses the learner is enrolled in within the scope.',
  courses_completed: 'Number of those course enrollments the learner has completed.',
  days_to_finish: 'Days between enrollment and completion, set only after the enrollment completes.',
  enrolled_at: 'When the learner enrolled in the course.',
  now_at_item_id:
    'The id of the first not-yet-completed required item in course order, the item the learner should do next.',
  now_at_title:
    'The title of the first not-yet-completed required item in course order, the item the learner should do next.',
  took_all: 'Whether the learner has a graded submission for every required exercise of the section.',
  video_pct: 'Percentage of video-tracked lessons the learner completed in the group.',
  attendance_pct: 'Percentage of taken attendance sessions across the scope the learner attended.',
  attendance: 'Presence at taken attendance sessions, pooled across the rows as one percentage.',
  last_login_at: 'When the learner last signed in.',
  days_since_login: 'Full days since the learner last signed in.',
  logged_in_today: 'Whether the learner signed in today.',
  logged_in: 'Whether the learner signed in on that login_day row.',
  logged_in_period: 'Whether the learner signed in at least once inside the selected range.',
  is_overdue: 'Whether the learner has any overdue goal, compliance cycle or required exercise in the scope.',
  is_inactive: 'Whether the learner has not signed in for two or more days, or has never signed in.',
  is_low_score: 'Whether the learner average score is under 50 percent.',
  is_low_video: 'Whether the learner video completion is under 60 percent.',
  is_at_risk: 'Whether the learner is inactive, low-scoring, overdue, or has not logged in for two or more days.',
  status: 'The derived learner status: completed, at_risk, lagging or on_track.',
  status_rank: 'A sort rank next to the status so at_risk sorts first, then lagging, on_track and completed.',
  correct_pct: 'Percentage of the question points earned on the best graded submission.',
  wrong_answer: 'The answer text the learner gave on their best graded submission when it earned no points.',
  kind: 'The overdue item type: goal, compliance or exercise.',
  due_at: 'When the overdue goal, compliance cycle or required exercise is due.',
  days_overdue: 'Whole days between the due date and today.',
  assignment_id: 'The cohort goal assignment id of an overdue goal item.',
  course_titles: 'The titles of the courses the overdue item belongs to, comma separated.',
  members_added: 'How many students joined the organization in that period.',
  members_total: 'How many active students the organization had at the end of that period.',
  first_try_pass: 'Share of pass-required exercises whose very first graded submission passed, pooled across rows.',
  passed_first_try: 'Whether the learner passed the exercise with their first graded submission.',
  pass_mark_exercises: 'How many pass-required exercises the enrollment contains.',
  pass_mark_passed: 'How many of those pass-required exercises the learner has passed.',
  still_to_pass: 'Whether the learner has graded attempts but has not yet passed the pass-required exercise.',
  took_pass_mark: 'Whether the learner has graded attempts on every pass-required exercise of the enrollment.',
  has_still_to_pass: 'Whether the enrollment still has a pass-required exercise the learner has not passed.',
  enrolled_in_period: 'Whether the learner enrolled in this course inside the selected range.',
  completed_in_period: 'Whether the learner completed this course inside the selected range.',
  completion_rate_at_period_start: 'Course completion rate as of the start of the period used for comparisons.',
  overall_progress_pct_existing:
    'Learner progress counted only for learners who were enrolled before the compare period.',
  overall_progress_pct_at_period_start: 'Learner progress as of the start of the period used for comparisons.',
  has_overdue_goal: 'Whether the learner has at least one overdue cohort goal in the scope.',
  question_context: 'The section or exercise title the question was shown in.',
  item_titles: 'The titles of the overdue items for that learner, comma separated.',
  course_progress_pct: 'Progress across the courses the learner overdue items belong to.',
  has_goal: 'Whether at least one of the overdue items is a goal.',
  students: 'How many students the cohort currently has.',
  pending_invites: 'How many pending member invites the cohort has.',
  avg_progress_pct: 'Average course progress across the cohort students.',
  overdue_students: 'How many cohort students have an overdue item.',
  at_risk_students: 'How many cohort students have the at_risk status.',
  completed_students: 'How many cohort students completed every course they are enrolled in.',
  cohort_created_at: 'When the cohort was created.',
  course_created_at: 'When the course was created.',
  completed_all_in_period: 'Whether the learner completed all their scope courses inside the selected range.',
  completed_in_window: 'Whether the learner completed this course inside the selected range.',
  certified_in_period: 'Whether the learner earned a certificate for this course inside the selected range.'
};

/** What each dimension groups by. */
export const ANALYTICS_DIMENSION_DESCRIPTIONS: Record<TAnalyticsDimension, string> = {
  student: 'Groups rows by learner.',
  course: 'Groups rows by course.',
  cohort: 'Groups rows by cohort.',
  exercise: 'Groups rows by exercise.',
  section: 'Groups rows by course section.',
  lesson: 'Groups rows by lesson.',
  question: 'Groups rows by scored exercise question.',
  item: 'Groups rows by outline item, a lesson or exercise in course order.',
  day: 'Groups rows by calendar day.',
  period: 'Groups rows by period bucket: daily inside a 31-day range and weekly otherwise.',
  status: 'Groups rows by the derived learner status.',
  overdue_kind: 'Groups overdue rows by item kind: goal, compliance or exercise.',
  progress_bucket_25: 'Groups rows into four progress buckets: below 25, 25 to 49, 50 to 74, and 75 percent or more.',
  score_bucket_10: 'Groups rows into ten score buckets by average score percentage.'
};

/** What each filter keeps. API documentation strings, not dashboard UI copy. */
export const ANALYTICS_FILTER_DESCRIPTIONS: Record<TAnalyticsFilterField, string> = {
  course: 'Only rows from these courses.',
  cohort: 'Only rows from these cohorts.',
  student: 'Only rows for these learners.',
  exercise: 'Only rows for this exercise.',
  section: 'Only rows for this course section.',
  status: 'Only learners with this derived status.',
  overdue_kind: 'Only overdue items of this kind: goal, compliance or exercise.',
  students: 'Only cohorts with this many students.',
  avg_score_pct: 'Only rows with an average score in this bound.',
  is_pass_required: 'Only exercises that must be passed.',
  logged_in_today: 'Only learners who logged in today.',
  is_inactive: 'Only learners who have not logged in for two or more days.',
  is_overdue: 'Only rows with an overdue item.',
  is_completed_all: 'Only learners who completed every scope course.',
  has_certificate: 'Only learners who earned a certificate.',
  is_attempted: 'Only rows for attempted exercises.',
  is_graded: 'Only rows for graded attempts.'
};

/** What each preset widget shows, keyed by widget id. API documentation strings, not dashboard UI copy. */
export const ANALYTICS_WIDGET_DESCRIPTIONS: Record<string, string> = {
  kpi_logged_in_today:
    'Shows students active today against the period and total, as a share of the learners in scope for the selected range.',
  kpi_avg_progress:
    'Shows average learner progress on top, progress for learners enrolled before the period, and progress as of the period start, so the trend line is between two comparable numbers.',
  kpi_avg_score: 'Shows the average graded score percentage of the learners in scope.',
  kpi_avg_grade: 'Shows the average graded score percentage of the selected course learners.',
  kpi_overdue: 'Shows students with any overdue item and with an overdue goal, against the total students.',
  kpi_completed:
    'Shows students who completed every scope course, the same count for the period, and certificates earned.',
  kpi_enrolled: 'Shows the number of enrollments in scope and how many of those enrolled in the period.',
  kpi_completion_rate: 'Shows the course completion rate on top of the completion rate as of the period start.',
  kpi_first_try_pass:
    'Shows the pooled first-attempt pass rate of pass-required exercises, plus the number of such exercises and the number of learners who still have to pass.',
  kpi_median_days: 'Shows the median days a completed enrollment took to finish.',
  kpi_logged_in_week: 'Shows students who logged in inside the selected range against the total students.',
  kpi_progress_trend:
    'Shows average learner progress on top, progress for learners enrolled before the period, and progress as of the period start.',
  kpi_completions: 'Shows learners who completed their course, the total learners, and completions inside the period.',
  kpi_certificates:
    'Shows learners holding a certificate, certificates earned in the period, and the total learners who completed.',
  kpi_needs_attention: 'Shows learners flagged at risk against the total learners in scope.',
  courses_summary:
    'Charts learners, average progress, average score and completions per course, using the course details page as its range.',
  students_by_status: 'Breaks the learners in scope down by status: completed, on_track, lagging and at_risk.',
  course_details:
    'Lists one row per course with learners, average progress, average score, completions, first-try pass rate and pass-required results, paged in title order.',
  scores_by_exercise:
    'Charts the average best score with the middle half range per exercise, plus graded and attempted counts, for the selected course.',
  progress_distribution:
    'Counts learners in four progress buckets (below 25, 25 to 49, 50 to 74, 75 and up) for the selected course.',
  students_by_status_course:
    'Breaks the selected course learners down by status: completed, on_track, lagging and at_risk.',
  section_scores:
    'Charts learners, average score, first-try pass rate, video and attendance per section of the selected course.',
  score_distribution_course: 'Counts the selected course learners in ten buckets by their average score.',
  score_distribution: 'Counts the learners in scope in ten buckets by their average score.',
  section_scorecard:
    'Lists one row per section of the selected course with learners, completed sections, average score, first-try pass rate, video and attendance, paged in course order.',
  needs_attention:
    'Counts inactive, low-scoring, overdue and low-video learners, giving the size of each attention group.',
  overdue:
    'Lists one row per learner with overdue items, showing what is overdue, the course progress, last login and how many days the items are late.',
  hardest_questions:
    'Lists the questions with the lowest average score share, their most common wrong answer, and where they sit in the course.',
  students:
    'Lists the students in scope with progress, average score, course totals, video, attendance, certificates, status and last login; its own table with paging, search, filters and sorting.',
  hardest_exercises:
    'Charts exercises by average score and pooled first-attempt pass rate, so hard exercises show together with how often they are passed first try.',
  exercise_score_distribution: 'Counts the graded attempts of the selected exercise in ten buckets by score.',
  lesson_dropoff: 'Charts lesson completion share in course order, so the sharpest stopping points stand out.',
  cohorts_in_course: 'Charts the cohorts in the selected course that have students.',
  cohort_details:
    'Lists one row per cohort with students, pending invites, average progress and score, first-try pass rate and overdue counts, newest first.',
  cohort_empty: 'Names the cohorts in this course that have no students yet.',
  cohort_health: 'Breaks the newest cohorts down by the status of their students.',
  courses_at_a_glance:
    'Lists courses with learners, average progress, average score and completions, paged in title order.',
  cohorts_at_a_glance: 'Lists the newest cohorts with students, pending invites, averages and pass rates.',
  hiring_ramp: 'Charts how many students joined per period and the running total, so the hiring pace is visible.',
  logins_per_day: 'Counts learners who signed in on each of the last 7 days.',
  logins_per_day_course: 'Counts course learners who signed in on each of the last 7 days.',
  avg_score_by_course: 'Ranks courses by their average score.',
  avg_score_by_cohort: 'Ranks the newest cohorts by their average score.',
  courses_by_completion: 'Ranks courses by their completion rate.',
  scores_by_exercise_by_cohort:
    'Charts the average exercise score per cohort in the selected course, one line per cohort.'
};
