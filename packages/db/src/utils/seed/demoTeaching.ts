import {
  and,
  count,
  course,
  db,
  eq,
  group,
  groupmember,
  inArray,
  learnerNudge,
  lessonCompletion,
  question,
  submission,
  sum,
  webhookEndpoint
} from '@db/drizzle';
import type { TNewCourse, TNewGroupmember } from '@db/types';
import { ROLE } from '@cio/utils/constants/roles';

import {
  daysFromNow,
  demoCourseId,
  demoCourseLessonIds,
  demoGroupId,
  demoId,
  findDemoExerciseId,
  minutesFromNow,
  type DemoCourse
} from './demoCatalogTypes';
import { DEMO_CATALOG } from './demoCourses';
import { COURSE_IMAGES } from './demoMedia';
import { buildPeopleDirectory, type DemoAccounts } from './demoPeople';

/** Courses tutor@test.com teaches alongside each course's instructor. */
const TUTOR_COURSE_KEYS = ['react', 'python-engineering', 'ux-design', 'product-management', 'machine-learning'];

const FAILED_QUIZ = {
  courseKey: 'python-engineering',
  exerciseKey: 'pythonic-quiz',
  personKey: 'arjun.mehta',
  attempts: [
    { scoreShare: 0.2, daysAgo: 9 },
    { scoreShare: 0.3, daysAgo: 8 }
  ]
};

/** Fresh activity so the tutor's feed starts with today. */
const RECENT_COMPLETIONS = [
  { courseKey: 'react', personKey: 'mei.lin', lessonPosition: 1, minutesAgo: 40 },
  { courseKey: 'ux-design', personKey: 'leila.rahimi', lessonPosition: 4, minutesAgo: 95 },
  { courseKey: 'machine-learning', personKey: 'priya.raman', lessonPosition: 3, minutesAgo: 60 * 5 }
];

const NEW_ENROLLMENTS = [
  { courseKey: 'react', personKey: 'emily.carter', minutesAgo: 60 * 3 },
  { courseKey: 'python-engineering', personKey: 'zanele.dlamini', minutesAgo: 60 * 26 }
];

/** Unpublished courses tutor@test.com is still writing, so admins see drafts waiting. */
const DRAFT_COURSES = [
  {
    index: 1,
    title: 'Accessible Web Forms',
    description: 'Labels, errors and keyboard support for forms everyone can complete.',
    bannerImage: COURSE_IMAGES.uxDesign,
    createdDaysAgo: 6
  },
  {
    index: 2,
    title: 'SQL for Analysts',
    description: 'Query, join and summarise data in SQL without waiting for an engineer.',
    bannerImage: COURSE_IMAGES.dataCohort,
    createdDaysAgo: 2
  }
];

function courseByKey(key: string): DemoCourse {
  const demoCourse = DEMO_CATALOG.find((candidate) => candidate.key === key);
  if (!demoCourse) throw new Error(`Unknown demo course ${key}`);

  return demoCourse;
}

/**
 * Gives tutor@test.com a teaching load in udemy-test: course teams, a learner who failed the same quiz twice, recent
 * completions and enrolments, an earlier nudge, and a failing webhook for the admin's notifications.
 */
export async function seedDemoTeaching({
  accounts,
  selectedOrganizationId
}: {
  accounts: DemoAccounts;
  selectedOrganizationId?: string;
}) {
  if (selectedOrganizationId && selectedOrganizationId !== accounts.udemyOrgId) return;

  const now = new Date();
  const personId = buildPeopleDirectory(accounts);
  const tutorId = personId('tutor');

  const teamGroupIds = TUTOR_COURSE_KEYS.map((key) => demoGroupId(courseByKey(key)));
  const existingTeam = await db
    .select({ groupId: groupmember.groupId })
    .from(groupmember)
    .where(and(inArray(groupmember.groupId, teamGroupIds), eq(groupmember.profileId, tutorId)));
  const teamGroups = new Set(existingTeam.map((row) => row.groupId));
  const teamRows: TNewGroupmember[] = teamGroupIds
    .filter((groupId) => !teamGroups.has(groupId))
    .map((groupId) => ({ groupId, profileId: tutorId, roleId: ROLE.TUTOR, createdAt: daysFromNow(now, -120) }));

  if (teamRows.length > 0) {
    await db.insert(groupmember).values(teamRows);
  }

  const enrollmentRows: TNewGroupmember[] = [];
  for (const enrollment of NEW_ENROLLMENTS) {
    const groupId = demoGroupId(courseByKey(enrollment.courseKey));
    const profileId = personId(enrollment.personKey);
    const [existing] = await db
      .select({ id: groupmember.id })
      .from(groupmember)
      .where(and(eq(groupmember.groupId, groupId), eq(groupmember.profileId, profileId)));
    if (existing) continue;

    enrollmentRows.push({
      groupId,
      profileId,
      roleId: ROLE.STUDENT,
      createdAt: minutesFromNow(now, -enrollment.minutesAgo)
    });
  }

  if (enrollmentRows.length > 0) {
    await db.insert(groupmember).values(enrollmentRows);
  }

  let completionCount = 0;
  for (const recent of RECENT_COMPLETIONS) {
    const profileId = personId(recent.personKey);
    const lessonId = demoCourseLessonIds(courseByKey(recent.courseKey))[recent.lessonPosition];
    if (!lessonId) continue;

    const [done] = await db
      .select({ id: lessonCompletion.id })
      .from(lessonCompletion)
      .where(and(eq(lessonCompletion.profileId, profileId), eq(lessonCompletion.lessonId, lessonId)));
    if (done) continue;

    const completedAt = minutesFromNow(now, -recent.minutesAgo);
    await db
      .insert(lessonCompletion)
      .values({ lessonId, profileId, isComplete: true, createdAt: completedAt, updatedAt: completedAt });
    completionCount += 1;
  }

  const failedAttempts = await seedFailedQuizAttempts(personId, now);
  const drafts = await seedDraftCourses(accounts.udemyOrgId, tutorId, now);

  const nudgeCourse = courseByKey('react');
  const nudgeId = demoId('6200', 1);
  await db
    .insert(learnerNudge)
    .values({
      id: nudgeId,
      organizationId: accounts.udemyOrgId,
      courseId: demoCourseId(nudgeCourse),
      learnerProfileId: personId('diego.herrera'),
      nudgedByProfileId: tutorId,
      createdAt: daysFromNow(now, -2)
    })
    .onConflictDoNothing();

  await db
    .insert(webhookEndpoint)
    .values({
      id: demoId('6300', 1),
      organizationId: accounts.udemyOrgId,
      name: 'CRM sync',
      payloadUrl: 'https://hooks.udemy-test.demo/classroomio/enrollments',
      eventMode: 'selected',
      isActive: true,
      consecutiveFailures: 6,
      lastDeliveryStatus: 'FAILED',
      lastDeliveryAt: minutesFromNow(now, -50),
      createdByProfileId: accounts.admin,
      createdAt: daysFromNow(now, -90),
      updatedAt: minutesFromNow(now, -50)
    })
    .onConflictDoNothing();

  console.log(
    `   ✓ Demo teaching: tutor@test.com on ${teamRows.length} new course team(s), ${enrollmentRows.length} enrolment(s), ${completionCount} completion(s), ${failedAttempts} failed quiz attempt(s), ${drafts} draft course(s)`
  );
}

/** Two graded attempts below half marks on the same quiz, so the learner needs a nudge. */
async function seedFailedQuizAttempts(personId: (key: string) => string, now: Date) {
  const demoCourse = courseByKey(FAILED_QUIZ.courseKey);
  const exerciseId = findDemoExerciseId(demoCourse, FAILED_QUIZ.exerciseKey);
  const [member] = await db
    .select({ id: groupmember.id })
    .from(groupmember)
    .where(
      and(
        eq(groupmember.groupId, demoGroupId(demoCourse)),
        eq(groupmember.profileId, personId(FAILED_QUIZ.personKey)),
        eq(groupmember.roleId, ROLE.STUDENT)
      )
    );
  if (!member) return 0;

  const [{ attempts }] = await db
    .select({ attempts: count() })
    .from(submission)
    .where(and(eq(submission.submittedBy, member.id), eq(submission.exerciseId, exerciseId)));
  if (attempts >= FAILED_QUIZ.attempts.length) return 0;

  const [{ points }] = await db
    .select({ points: sum(question.points) })
    .from(question)
    .where(eq(question.exerciseId, exerciseId));
  const maxPoints = Number(points ?? 0);

  const rows = FAILED_QUIZ.attempts.slice(attempts).map((attempt) => {
    const at = daysFromNow(now, -attempt.daysAgo);

    return {
      exerciseId,
      courseId: demoCourseId(demoCourse),
      submittedBy: member.id,
      statusId: 3,
      gradingState: 'completed',
      overallStatus: 'auto_graded',
      total: Math.round(maxPoints * attempt.scoreShare),
      createdAt: at,
      updatedAt: at
    };
  });

  await db.insert(submission).values(rows);

  return rows.length;
}

async function seedDraftCourses(organizationId: string, tutorId: string, now: Date) {
  const courseIds = DRAFT_COURSES.map((draft) => demoId('6400', draft.index));
  const existing = await db.select({ id: course.id }).from(course).where(inArray(course.id, courseIds));
  const existingIds = new Set(existing.map((row) => row.id));
  const pending = DRAFT_COURSES.filter((draft) => !existingIds.has(demoId('6400', draft.index)));
  if (pending.length === 0) return 0;

  await db.insert(group).values(
    pending.map((draft) => ({
      id: demoId('6500', draft.index),
      name: draft.title,
      description: draft.description,
      organizationId,
      createdAt: daysFromNow(now, -draft.createdDaysAgo)
    }))
  );

  const courses: TNewCourse[] = pending.map((draft) => ({
    id: demoId('6400', draft.index),
    title: draft.title,
    description: draft.description,
    groupId: demoId('6500', draft.index),
    bannerImage: draft.bannerImage,
    slug: `draft-${draft.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    metadata: { goals: '', description: '', requirements: '', allowSelfEnrollment: true, progressionMode: 'free' },
    isPublished: false,
    status: 'ACTIVE',
    type: 'SELF_PACED',
    createdAt: daysFromNow(now, -draft.createdDaysAgo),
    updatedAt: daysFromNow(now, -draft.createdDaysAgo)
  }));
  await db.insert(course).values(courses);

  await db.insert(groupmember).values(
    pending.map((draft) => ({
      groupId: demoId('6500', draft.index),
      profileId: tutorId,
      roleId: ROLE.TUTOR,
      createdAt: daysFromNow(now, -draft.createdDaysAgo)
    }))
  );

  return pending.length;
}
