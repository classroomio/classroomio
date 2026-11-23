import {
  and,
  cohortGoalAssignment,
  cohortMember,
  communityQuestion,
  courseCompletionRecord,
  db,
  eq,
  groupmember,
  inArray,
  learnerGoal,
  notification,
  submission
} from '@db/drizzle';
import type { TNewNotification } from '@db/types';

import {
  demoCourseId,
  demoGroupId,
  demoId,
  demoLessonId,
  findDemoExerciseId,
  type DemoCourse
} from './demoCatalogTypes';
import { demoCommunitySlug } from './demoCommunity';
import { DEMO_CATALOG } from './demoCourses';
import { demoNewsfeedPostId } from './demoNewsfeed';
import { buildPeopleDirectory, type DemoAccounts } from './demoPeople';

function courseByKey(key: string): DemoCourse {
  const demoCourse = DEMO_CATALOG.find((candidate) => candidate.key === key);
  if (!demoCourse) throw new Error(`Unknown demo course ${key}`);

  return demoCourse;
}

export async function seedDemoNotifications({
  accounts,
  selectedOrganizationId
}: {
  accounts: DemoAccounts;
  selectedOrganizationId?: string;
}) {
  if (selectedOrganizationId && selectedOrganizationId !== accounts.udemyOrgId) return;

  const now = new Date();
  const personId = buildPeopleDirectory(accounts);
  const minutesAgo = (minutes: number) => new Date(now.getTime() - minutes * 60 * 1000).toISOString();

  const react = courseByKey('react');
  const pandas = courseByKey('pandas');
  const pythonEngineering = courseByKey('python-engineering');
  const machineLearning = courseByKey('machine-learning');
  const productManagement = courseByKey('product-management');
  const leadingTeams = courseByKey('leading-teams');
  const pytest = courseByKey('pytest');
  const security = courseByKey('security-awareness');
  const gdpr = courseByKey('gdpr');

  const accuracySlug = demoCommunitySlug('Accuracy is 92% but the model is useless. What am I missing?');
  const applySlug = demoCommunitySlug('Is apply always slower than vectorised code?');
  const questions = await db
    .select({ id: communityQuestion.id, slug: communityQuestion.slug })
    .from(communityQuestion)
    .where(inArray(communityQuestion.slug, [accuracySlug, applySlug]));
  const questionId = (slug: string) => questions.find((row) => row.slug === slug)?.id;

  const records = await db
    .select({ id: courseCompletionRecord.id, courseId: courseCompletionRecord.courseId })
    .from(courseCompletionRecord)
    .where(
      and(
        eq(courseCompletionRecord.profileId, accounts.student),
        inArray(courseCompletionRecord.courseId, [demoCourseId(security), demoCourseId(gdpr)])
      )
    );
  const recordId = (demoCourse: DemoCourse) => records.find((row) => row.courseId === demoCourseId(demoCourse))?.id;

  const [goalAssignment] = await db
    .select({ id: cohortGoalAssignment.id })
    .from(cohortGoalAssignment)
    .innerJoin(cohortMember, eq(cohortMember.id, cohortGoalAssignment.cohortMemberId))
    .where(and(eq(cohortGoalAssignment.goalId, demoId('b100', 1, 2)), eq(cohortMember.profileId, accounts.student)));

  const ux = courseByKey('ux-design');
  const productivity = courseByKey('productivity');
  const tutorId = personId('tutor');

  const [goal] = await db
    .select({ id: learnerGoal.id })
    .from(learnerGoal)
    .where(and(eq(learnerGoal.profileId, accounts.student), eq(learnerGoal.organizationId, accounts.udemyOrgId)));

  const [awaitingSubmission] = await db
    .select({ id: submission.id })
    .from(submission)
    .innerJoin(groupmember, eq(groupmember.id, submission.submittedBy))
    .where(
      and(
        eq(groupmember.groupId, demoGroupId(react)),
        eq(groupmember.profileId, personId('lucas.oliveira')),
        eq(submission.exerciseId, findDemoExerciseId(react, 'react-data-hook'))
      )
    );

  const candidates: Array<
    Omit<TNewNotification, 'profileId' | 'organizationId' | 'entityId'> & { entityId?: string; profileId?: string }
  > = [
    {
      type: 'live_session_reminder',
      entityType: 'lesson',
      entityId: demoLessonId(productManagement, 0, 2),
      courseId: demoCourseId(productManagement),
      actorProfileId: personId('tom.hargreaves'),
      dedupeKey: `live_session_reminder:${demoLessonId(productManagement, 0, 2)}`,
      createdAt: minutesAgo(25)
    },
    {
      type: 'community_answer',
      entityType: 'community_question',
      entityId: questionId(accuracySlug)?.toString(),
      courseId: demoCourseId(machineLearning),
      actorProfileId: personId('nkechi.eze'),
      dedupeKey: `community_answer:${accuracySlug}`,
      createdAt: minutesAgo(60 * 20)
    },
    {
      type: 'exercise_graded',
      entityType: 'exercise',
      entityId: findDemoExerciseId(pythonEngineering, 'refactoring-reflection'),
      courseId: demoCourseId(pythonEngineering),
      actorProfileId: accounts.admin,
      dedupeKey: 'exercise_graded:refactoring-reflection',
      createdAt: minutesAgo(60 * 26)
    },
    {
      type: 'certificate_issued',
      entityType: 'course',
      entityId: demoCourseId(pythonEngineering),
      courseId: demoCourseId(pythonEngineering),
      actorProfileId: null,
      dedupeKey: `certificate_issued:${demoCourseId(pythonEngineering)}`,
      createdAt: minutesAgo(60 * 24 * 4)
    },
    {
      type: 'compliance_due_soon',
      entityType: 'compliance_record',
      entityId: recordId(security),
      courseId: demoCourseId(security),
      actorProfileId: null,
      dedupeKey: `compliance_due_soon:${demoCourseId(security)}`,
      createdAt: minutesAgo(60 * 8)
    },
    {
      type: 'compliance_overdue',
      entityType: 'compliance_record',
      entityId: recordId(gdpr),
      courseId: demoCourseId(gdpr),
      actorProfileId: null,
      dedupeKey: `compliance_overdue:${demoCourseId(gdpr)}`,
      createdAt: minutesAgo(60 * 24 * 2)
    },
    {
      type: 'cohort_goal_due',
      entityType: 'cohort_goal_assignment',
      entityId: goalAssignment?.id,
      courseId: null,
      actorProfileId: null,
      dedupeKey: 'cohort_goal_due:data-analytics-track',
      createdAt: minutesAgo(60 * 30)
    },
    {
      type: 'newsfeed_reply',
      entityType: 'newsfeed_post',
      entityId: demoNewsfeedPostId(pandas, 0),
      courseId: demoCourseId(pandas),
      actorProfileId: personId('nkechi.eze'),
      dedupeKey: `newsfeed_reply:${demoNewsfeedPostId(pandas, 0)}`,
      createdAt: minutesAgo(60 * 60)
    },
    {
      type: 'newsfeed_post',
      entityType: 'newsfeed_post',
      entityId: demoNewsfeedPostId(react, 0),
      courseId: demoCourseId(react),
      actorProfileId: accounts.admin,
      dedupeKey: `newsfeed_post:${demoNewsfeedPostId(react, 0)}`,
      readAt: minutesAgo(60 * 40),
      createdAt: minutesAgo(60 * 52)
    },
    {
      type: 'community_answer',
      entityType: 'community_question',
      entityId: questionId(applySlug)?.toString(),
      courseId: demoCourseId(pandas),
      actorProfileId: personId('wei.zhang'),
      dedupeKey: `community_answer:${applySlug}`,
      readAt: minutesAgo(60 * 24 * 12),
      createdAt: minutesAgo(60 * 24 * 14)
    },
    {
      type: 'lesson_published',
      entityType: 'lesson',
      entityId: demoLessonId(react, 0, 1),
      courseId: demoCourseId(react),
      actorProfileId: accounts.admin,
      dedupeKey: `lesson_published:${demoLessonId(react, 0, 1)}`,
      readAt: minutesAgo(60 * 24 * 5),
      createdAt: minutesAgo(60 * 24 * 6)
    },
    {
      type: 'live_session_reminder',
      entityType: 'lesson',
      entityId: demoLessonId(leadingTeams, 0, 1),
      courseId: demoCourseId(leadingTeams),
      actorProfileId: personId('tom.hargreaves'),
      dedupeKey: `live_session_reminder:${demoLessonId(leadingTeams, 0, 1)}`,
      readAt: minutesAgo(60 * 3),
      createdAt: minutesAgo(60 * 5)
    },
    {
      type: 'course_enrolled',
      entityType: 'course',
      entityId: demoCourseId(pytest),
      courseId: demoCourseId(pytest),
      actorProfileId: accounts.admin,
      dedupeKey: `course_enrolled:${demoCourseId(pytest)}`,
      readAt: minutesAgo(60 * 24),
      createdAt: minutesAgo(60 * 24 * 2)
    },
    {
      type: 'live_class_starting',
      entityType: 'lesson',
      entityId: demoLessonId(leadingTeams, 0, 1),
      courseId: demoCourseId(leadingTeams),
      actorProfileId: personId('tom.hargreaves'),
      dedupeKey: `live_class_starting:${demoLessonId(leadingTeams, 0, 1)}:soon`,
      createdAt: minutesAgo(2)
    },
    {
      type: 'learner_nudged',
      entityType: 'course',
      entityId: demoCourseId(machineLearning),
      courseId: demoCourseId(machineLearning),
      actorProfileId: tutorId,
      dedupeKey: `learner_nudged:${demoCourseId(machineLearning)}`,
      createdAt: minutesAgo(60 * 3)
    },
    {
      type: 'assignment_due_soon',
      entityType: 'exercise',
      entityId: findDemoExerciseId(leadingTeams, 'one-on-one-reflection'),
      courseId: demoCourseId(leadingTeams),
      actorProfileId: null,
      dedupeKey: `assignment_due_soon:${findDemoExerciseId(leadingTeams, 'one-on-one-reflection')}`,
      createdAt: minutesAgo(60 * 6)
    },
    {
      type: 'assignment_new',
      entityType: 'exercise',
      entityId: findDemoExerciseId(machineLearning, 'classifier-project'),
      courseId: demoCourseId(machineLearning),
      actorProfileId: personId('nkechi.eze'),
      dedupeKey: `assignment_new:${findDemoExerciseId(machineLearning, 'classifier-project')}`,
      createdAt: minutesAgo(60 * 22)
    },
    {
      type: 'course_recommended',
      entityType: 'course',
      entityId: demoCourseId(productivity),
      courseId: demoCourseId(productivity),
      actorProfileId: null,
      dedupeKey: `course_recommended:${demoCourseId(productivity)}`,
      createdAt: minutesAgo(60 * 28)
    },
    {
      type: 'streak_at_risk',
      entityType: 'learner_goal',
      entityId: goal?.id,
      courseId: null,
      actorProfileId: null,
      dedupeKey: 'streak_at_risk:demo-previous-week',
      readAt: minutesAgo(60 * 24 * 5),
      createdAt: minutesAgo(60 * 24 * 5 + 30)
    },
    {
      type: 'weekly_goal_reached',
      entityType: 'learner_goal',
      entityId: goal?.id,
      courseId: null,
      actorProfileId: null,
      dedupeKey: 'weekly_goal_reached:demo-previous-week',
      readAt: minutesAgo(60 * 24 * 8),
      createdAt: minutesAgo(60 * 24 * 9)
    },
    {
      profileId: tutorId,
      type: 'submission_received',
      entityType: 'submission',
      entityId: awaitingSubmission?.id,
      courseId: demoCourseId(react),
      actorProfileId: personId('lucas.oliveira'),
      dedupeKey: `submission_received:${awaitingSubmission?.id}`,
      createdAt: minutesAgo(35)
    },
    {
      profileId: tutorId,
      type: 'attendance_reminder',
      entityType: 'lesson',
      entityId: demoLessonId(productManagement, 0, 1),
      courseId: demoCourseId(productManagement),
      actorProfileId: null,
      dedupeKey: `attendance_reminder:${demoLessonId(productManagement, 0, 1)}`,
      createdAt: minutesAgo(60 * 2)
    },
    {
      profileId: tutorId,
      type: 'live_session_host_reminder',
      entityType: 'lesson',
      entityId: demoLessonId(productManagement, 0, 2),
      courseId: demoCourseId(productManagement),
      actorProfileId: null,
      dedupeKey: `live_session_host_reminder:${demoLessonId(productManagement, 0, 2)}`,
      createdAt: minutesAgo(75)
    },
    {
      profileId: tutorId,
      type: 'learner_needs_nudge',
      entityType: 'course',
      entityId: demoCourseId(pythonEngineering),
      courseId: demoCourseId(pythonEngineering),
      actorProfileId: personId('arjun.mehta'),
      dedupeKey: `learner_needs_nudge:${demoCourseId(pythonEngineering)}:arjun.mehta`,
      createdAt: minutesAgo(60 * 7)
    },
    {
      profileId: tutorId,
      type: 'student_joined',
      entityType: 'course',
      entityId: demoCourseId(react),
      courseId: demoCourseId(react),
      actorProfileId: personId('emily.carter'),
      dedupeKey: `student_joined:${demoCourseId(react)}:emily.carter`,
      createdAt: minutesAgo(60 * 3)
    },
    {
      profileId: tutorId,
      type: 'tutor_added',
      entityType: 'course',
      entityId: demoCourseId(ux),
      courseId: demoCourseId(ux),
      actorProfileId: accounts.admin,
      dedupeKey: `tutor_added:${demoCourseId(ux)}`,
      readAt: minutesAgo(60 * 24 * 100),
      createdAt: minutesAgo(60 * 24 * 120)
    },
    {
      profileId: accounts.admin,
      type: 'webhook_failing',
      entityType: 'webhook',
      entityId: demoId('6300', 1),
      courseId: null,
      actorProfileId: null,
      dedupeKey: 'webhook_failing:crm-sync',
      createdAt: minutesAgo(50)
    },
    {
      profileId: accounts.admin,
      type: 'student_limit_reached',
      entityType: 'organization',
      entityId: accounts.udemyOrgId,
      courseId: null,
      actorProfileId: null,
      dedupeKey: 'student_limit_reached:udemy-test',
      readAt: minutesAgo(60 * 24 * 34),
      createdAt: minutesAgo(60 * 24 * 35)
    },
    {
      profileId: accounts.admin,
      type: 'student_limit_approaching',
      entityType: 'organization',
      entityId: accounts.udemyOrgId,
      courseId: null,
      actorProfileId: null,
      dedupeKey: 'student_limit_approaching:udemy-test',
      readAt: minutesAgo(60 * 24 * 40),
      createdAt: minutesAgo(60 * 24 * 42)
    },
    {
      profileId: accounts.admin,
      type: 'payment_failed',
      entityType: 'organization',
      entityId: accounts.udemyOrgId,
      courseId: null,
      actorProfileId: null,
      dedupeKey: 'payment_failed:udemy-test:demo',
      readAt: minutesAgo(60 * 24 * 58),
      createdAt: minutesAgo(60 * 24 * 60)
    }
  ];

  const rows: TNewNotification[] = candidates.flatMap(({ entityId, profileId, ...candidate }) =>
    entityId
      ? [{ ...candidate, entityId, profileId: profileId ?? accounts.student, organizationId: accounts.udemyOrgId }]
      : []
  );

  const inserted = rows.length
    ? await db.insert(notification).values(rows).onConflictDoNothing().returning({ id: notification.id })
    : [];

  console.log(`   ✓ Demo notifications: ${inserted.length} notification(s) for student, tutor and admin`);
}
