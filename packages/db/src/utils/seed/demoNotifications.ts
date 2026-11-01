import {
  and,
  cohortGoalAssignment,
  cohortMember,
  communityQuestion,
  courseCompletionRecord,
  db,
  eq,
  inArray,
  notification
} from '@db/drizzle';
import type { TNewNotification } from '@db/types';

import { demoCourseId, demoId, demoLessonId, findDemoExerciseId, type DemoCourse } from './demoCatalogTypes';
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

  const candidates: Array<Omit<TNewNotification, 'profileId' | 'organizationId' | 'entityId'> & { entityId?: string }> =
    [
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
      }
    ];

  const rows: TNewNotification[] = candidates.flatMap(({ entityId, ...candidate }) =>
    entityId ? [{ ...candidate, entityId, profileId: accounts.student, organizationId: accounts.udemyOrgId }] : []
  );

  const inserted = rows.length
    ? await db.insert(notification).values(rows).onConflictDoNothing().returning({ id: notification.id })
    : [];

  console.log(`   ✓ Demo notifications: ${inserted.length} notification(s) for student@test.com`);
}
