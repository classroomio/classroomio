import 'dotenv/config';

import {
  analyticsLoginEvents,
  and,
  db,
  eq,
  exercise,
  groupmember,
  inArray,
  lessonCompletion,
  profile,
  question,
  submission
} from '@db/drizzle';

import type { TNewGroupmember, TNewQuestion } from '@db/types';

// ---------------------------------------------------------------------------
// Seed demo progress for the coursera-test "audience" students so the student
// profile pages (org-level rail + tabs, course-level rail + exercise list)
// render real data: enrollments, per-exercise grades, lesson progress, avatars
// and last-seen timestamps.
//
// Idempotent: re-running only fills gaps.
// ---------------------------------------------------------------------------

const COURSERA_ORG_ID = '2b8f4a1c-6d3e-4b2a-9f7e-1c4d8a6e9b0f';

// Compliance courses (created by the `compliance` seed)
const HIPAA_GROUP_ID = '7e000000-1000-4000-8000-000000000001';
const SOC2_GROUP_ID = '7e000000-1000-4000-8000-000000000002';
const HIPAA_COURSE_ID = '7e000000-2000-4000-8000-000000000001';
const SOC2_COURSE_ID = '7e000000-2000-4000-8000-000000000002';
const HIPAA_LESSON_IDS = ['7e000000-4000-4000-8000-000000000001', '7e000000-4000-4000-8000-000000000002'] as const;
const SOC2_LESSON_IDS = ['7e000000-4000-4000-8000-000000000003', '7e000000-4000-4000-8000-000000000004'] as const;
const HIPAA_EXERCISE_ID = '7e000000-5000-4000-8000-000000000001';
const SOC2_EXERCISE_ID = '7e000000-5000-4000-8000-000000000002';

const ROLE_STUDENT = 3;
const QUESTS_PER_EXERCISE = 4;
const POINTS_PER_QUESTION = 10;
const TOTAL_POINTS = QUESTS_PER_EXERCISE * POINTS_PER_QUESTION;

// Submission statuses (submissionstatus table): 1 = Submitted, 3 = Graded
const STATUS_SUBMITTED = 1;
const STATUS_GRADED = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

function isoDaysFromNow(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString();
}

function isoDateFromNow(days: number): string {
  return isoDaysFromNow(days).slice(0, 10);
}

interface CourseProgressPlan {
  courseId: string;
  groupId: string;
  lessonIds: readonly string[];
  exerciseId: string;
  lessonsCompleted: number;
  /** null = no submission; 'submitted' = awaiting grade; number = graded score (of TOTAL_POINTS) */
  submissionScore: number | null | 'submitted';
}

interface AudienceStudentSeed {
  profileId: string;
  fullname: string;
  username: string;
  email: string;
  groupMemberIds: { hipaa: string; soc2: string };
  lastLoginDaysAgo: number;
  coursePlans: CourseProgressPlan[];
}

const STUDENTS: AudienceStudentSeed[] = [
  {
    profileId: '4da163ef-8050-4d4b-9c9f-3e6fac802b4d',
    fullname: 'Enterprise Student',
    username: 'enterprise-student',
    email: 'enterprise-student@test.com',
    groupMemberIds: {
      hipaa: '9f000001-1000-4000-8000-000000000001',
      soc2: '9f000001-1000-4000-8000-000000000002'
    },
    lastLoginDaysAgo: 0,
    coursePlans: [
      {
        courseId: HIPAA_COURSE_ID,
        groupId: HIPAA_GROUP_ID,
        lessonIds: HIPAA_LESSON_IDS,
        exerciseId: HIPAA_EXERCISE_ID,
        lessonsCompleted: 1,
        submissionScore: 25
      },
      {
        courseId: SOC2_COURSE_ID,
        groupId: SOC2_GROUP_ID,
        lessonIds: SOC2_LESSON_IDS,
        exerciseId: SOC2_EXERCISE_ID,
        lessonsCompleted: 2,
        submissionScore: 38
      }
    ]
  },
  {
    profileId: '7ac00503-8519-43c8-a5ea-b79aeca900b1',
    fullname: 'Elon Gates',
    username: 'elon-gates',
    email: 'admin@test.com',
    groupMemberIds: {
      hipaa: '9f000001-1000-4000-8000-000000000003',
      soc2: '9f000001-1000-4000-8000-000000000004'
    },
    lastLoginDaysAgo: 2,
    coursePlans: [
      {
        courseId: HIPAA_COURSE_ID,
        groupId: HIPAA_GROUP_ID,
        lessonIds: HIPAA_LESSON_IDS,
        exerciseId: HIPAA_EXERCISE_ID,
        lessonsCompleted: 2,
        submissionScore: 36
      },
      {
        courseId: SOC2_COURSE_ID,
        groupId: SOC2_GROUP_ID,
        lessonIds: SOC2_LESSON_IDS,
        exerciseId: SOC2_EXERCISE_ID,
        lessonsCompleted: 0,
        submissionScore: null
      }
    ]
  },
  {
    profileId: 'c6514739-a5d0-4a6a-9c7d-afce65a7ace1',
    fullname: 'Victor Jack',
    username: 'vjack878',
    email: 'vjack878@gmail.com',
    groupMemberIds: {
      hipaa: '9f000001-1000-4000-8000-000000000005',
      soc2: '9f000001-1000-4000-8000-000000000006'
    },
    lastLoginDaysAgo: 12,
    coursePlans: [
      {
        courseId: HIPAA_COURSE_ID,
        groupId: HIPAA_GROUP_ID,
        lessonIds: HIPAA_LESSON_IDS,
        exerciseId: HIPAA_EXERCISE_ID,
        lessonsCompleted: 2,
        submissionScore: 33
      },
      {
        courseId: SOC2_COURSE_ID,
        groupId: SOC2_GROUP_ID,
        lessonIds: SOC2_LESSON_IDS,
        exerciseId: SOC2_EXERCISE_ID,
        lessonsCompleted: 1,
        submissionScore: 20
      }
    ]
  },
  {
    profileId: '24045c7b-e878-40f4-8620-aac1e103e2df',
    fullname: 'Daniel James',
    username: 'anyemail',
    email: 'anyemail@gmail.com',
    groupMemberIds: {
      hipaa: '9f000001-1000-4000-8000-000000000007',
      soc2: '9f000001-1000-4000-8000-000000000008'
    },
    lastLoginDaysAgo: 30,
    coursePlans: [
      {
        courseId: HIPAA_COURSE_ID,
        groupId: HIPAA_GROUP_ID,
        lessonIds: HIPAA_LESSON_IDS,
        exerciseId: HIPAA_EXERCISE_ID,
        lessonsCompleted: 0,
        submissionScore: 'submitted'
      },
      {
        courseId: SOC2_COURSE_ID,
        groupId: SOC2_GROUP_ID,
        lessonIds: SOC2_LESSON_IDS,
        exerciseId: SOC2_EXERCISE_ID,
        lessonsCompleted: 1,
        submissionScore: null
      }
    ]
  }
];

async function seedQuestions() {
  const exerciseIds = [HIPAA_EXERCISE_ID, SOC2_EXERCISE_ID];
  const existing = await db
    .select({ exerciseId: question.exerciseId })
    .from(question)
    .where(inArray(question.exerciseId, exerciseIds));
  const existingExerciseIds = new Set(existing.map((row) => row.exerciseId));

  const newQuestions: TNewQuestion[] = [];
  for (const exerciseId of exerciseIds) {
    if (existingExerciseIds.has(exerciseId)) continue;

    const exerciseTitle =
      (await db.select({ title: exercise.title }).from(exercise).where(eq(exercise.id, exerciseId)))[0]?.title ??
      'Quiz';
    for (let index = 0; index < QUESTS_PER_EXERCISE; index++) {
      newQuestions.push({
        exerciseId,
        questionTypeId: 1, // RADIO
        title: `${exerciseTitle} — question ${index + 1}`,
        points: POINTS_PER_QUESTION,
        settings: {},
        order: index
      });
    }
  }

  if (newQuestions.length > 0) {
    await db.insert(question).values(newQuestions);
    console.log(`   ✓ Inserted ${newQuestions.length} question(s) for compliance exercises`);
  } else {
    console.log('   ✓ Compliance exercise questions already exist, skipping');
  }
}

async function seedGroupMembers() {
  const desired = STUDENTS.flatMap((student) => [
    { id: student.groupMemberIds.hipaa, groupId: HIPAA_GROUP_ID, profileId: student.profileId },
    { id: student.groupMemberIds.soc2, groupId: SOC2_GROUP_ID, profileId: student.profileId }
  ]);

  const existing = await db
    .select({ id: groupmember.id })
    .from(groupmember)
    .where(
      inArray(
        groupmember.id,
        desired.map((row) => row.id!)
      )
    );
  const existingIds = new Set(existing.map((row) => row.id));

  const toInsert: TNewGroupmember[] = desired
    .filter((row) => row.id && !existingIds.has(row.id))
    .map((row) => ({
      id: row.id,
      groupId: row.groupId,
      profileId: row.profileId,
      roleId: ROLE_STUDENT
    }));

  if (toInsert.length > 0) {
    await db.insert(groupmember).values(toInsert);
    console.log(`   ✓ Inserted ${toInsert.length} audience groupmember(s)`);
  } else {
    console.log('   ✓ Audience groupmembers already exist, skipping');
  }
}

async function seedLessonCompletions() {
  const rows: Array<{ lessonId: string; profileId: string; isComplete: boolean; createdAt?: string }> = [];
  for (const student of STUDENTS) {
    for (const plan of student.coursePlans) {
      for (const lessonId of plan.lessonIds.slice(0, plan.lessonsCompleted)) {
        rows.push({ lessonId, profileId: student.profileId, isComplete: true, createdAt: isoDaysFromNow(-7) });
      }
    }
  }

  const existing = await db
    .select({ lessonId: lessonCompletion.lessonId, profileId: lessonCompletion.profileId })
    .from(lessonCompletion)
    .where(
      inArray(
        lessonCompletion.profileId,
        STUDENTS.map((s) => s.profileId)
      )
    );
  const existingKeys = new Set(existing.map((row) => `${row.profileId}-${row.lessonId}`));
  const toInsert = rows.filter((row) => !existingKeys.has(`${row.profileId}-${row.lessonId}`));

  if (toInsert.length > 0) {
    await db.insert(lessonCompletion).values(toInsert);
    console.log(`   ✓ Inserted ${toInsert.length} lesson completion(s)`);
  } else {
    console.log('   ✓ Lesson completions already exist, skipping');
  }
}

async function seedSubmissions() {
  const desired: Array<{
    exerciseId: string;
    courseId: string;
    submittedBy: string;
    statusId: number;
    total: number;
    gradingState: string;
    overallStatus: string;
    createdAt: string;
  }> = [];

  for (const student of STUDENTS) {
    for (const plan of student.coursePlans) {
      if (plan.submissionScore === null) continue;

      const groupMemberId =
        plan.groupId === HIPAA_GROUP_ID ? student.groupMemberIds.hipaa : student.groupMemberIds.soc2;
      const isGraded = typeof plan.submissionScore === 'number';

      desired.push({
        exerciseId: plan.exerciseId,
        courseId: plan.courseId,
        submittedBy: groupMemberId,
        statusId: isGraded ? STATUS_GRADED : STATUS_SUBMITTED,
        total: isGraded ? (plan.submissionScore as number) : 0,
        gradingState: isGraded ? 'completed' : 'queued',
        overallStatus: isGraded ? 'completed' : 'manual_required',
        createdAt: isoDaysFromNow(-3)
      });
    }
  }

  const existing = await db
    .select({ submittedBy: submission.submittedBy, exerciseId: submission.exerciseId })
    .from(submission)
    .where(inArray(submission.exerciseId, [HIPAA_EXERCISE_ID, SOC2_EXERCISE_ID]));
  const existingKeys = new Set(existing.map((row) => `${row.submittedBy}-${row.exerciseId}`));
  const toInsert = desired.filter((row) => !existingKeys.has(`${row.submittedBy}-${row.exerciseId}`));

  if (toInsert.length > 0) {
    await db.insert(submission).values(toInsert);
    console.log(`   ✓ Inserted ${toInsert.length} submission(s)`);
  } else {
    console.log('   ✓ Submissions already exist, skipping');
  }
}

async function seedAvatars() {
  for (const student of STUDENTS) {
    await db
      .update(profile)
      .set({
        avatarUrl: `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(student.username)}`
      })
      .where(eq(profile.id, student.profileId));
  }
  console.log('   ✓ Updated audience profile avatar(s)');
}

async function seedLoginEvents() {
  const rows: Array<{ userId: string; loggedInAt: string; loggedInDate: string }> = [];
  for (const student of STUDENTS) {
    if (student.lastLoginDaysAgo === null) continue;
    rows.push({
      userId: student.profileId,
      loggedInAt: isoDaysFromNow(-student.lastLoginDaysAgo),
      loggedInDate: isoDateFromNow(-student.lastLoginDaysAgo)
    });
  }

  const existing = await db
    .select({ userId: analyticsLoginEvents.userId, loggedInDate: analyticsLoginEvents.loggedInDate })
    .from(analyticsLoginEvents)
    .where(
      inArray(
        analyticsLoginEvents.userId,
        STUDENTS.map((s) => s.profileId)
      )
    );
  const existingKeys = new Set(existing.map((row) => `${row.userId}-${row.loggedInDate}`));
  const toInsert = rows.filter((row) => !existingKeys.has(`${row.userId}-${row.loggedInDate}`));

  if (toInsert.length > 0) {
    await db.insert(analyticsLoginEvents).values(toInsert);
    console.log(`   ✓ Inserted ${toInsert.length} login event(s)`);
  } else {
    console.log('   ✓ Login events already exist, skipping');
  }
}

async function main() {
  console.log('🌱 Seeding coursera-test audience progress...');
  await seedQuestions();
  await seedGroupMembers();
  await seedLessonCompletions();
  await seedSubmissions();
  await seedAvatars();
  await seedLoginEvents();
  console.log('✅ CDAI audience progress seeded successfully!');
}

main().catch((error) => {
  console.error('❌ Error seeding coursera-test audience progress:', error);
  process.exit(1);
});
