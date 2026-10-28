import 'dotenv/config';

import type { PgTable } from 'drizzle-orm/pg-core';

import {
  analyticsLoginEvents,
  cohort,
  cohortCourse,
  cohortGoal,
  cohortGoalAssignment,
  cohortMember,
  course,
  courseSection,
  db,
  eq,
  exercise,
  group,
  groupAttendance,
  groupmember,
  lesson,
  lessonCompletion,
  lessonVideoProgress,
  option,
  organization,
  organizationmember,
  profile,
  question,
  questionAnswer,
  questionType,
  role,
  submission,
  submissionstatus,
  user
} from '@db/drizzle';

const ORG_SITE_NAME = 'insights-load';
const ORG_NAME = 'Insights Load';
const ADMIN_EMAIL = 'admin@insights-load.demo';
const TUTOR_EMAIL = 'tutor@insights-load.demo';
const STUDENT_EMAIL_DOMAIN = 'insights-load.demo';

const ROLE_ADMIN = 1;
const ROLE_TUTOR = 2;
const ROLE_STUDENT = 3;

const STUDENT_COUNT = 5000;
const COHORT_COUNT = 20;
const COHORT_SIZE = 250;
const COURSES_PER_COHORT = 3;
const SECTIONS_PER_COURSE = 4;
const LESSONS_PER_COURSE = 12;
const EXERCISES_PER_COURSE = 7;
const LIVE_LESSON_INDEXES = [3, 7, 11];
const ATTEMPT_PROBABILITY = 0.8;
const AWAITING_GRADE_PROBABILITY = 0.1;
const LESSON_COMPLETION_PROBABILITY = 0.65;
const ATTENDANCE_PROBABILITY = 0.75;
const LOGIN_EVENTS_PER_STUDENT = 5;
const LOGIN_WINDOW_DAYS = 30;
const DAY_MS = 86_400_000;
const CHUNK_SIZE = 500;

const COURSE_TITLES = [
  'Leadership Essentials',
  'Data Literacy',
  'Customer Support',
  'Compliance Basics',
  'Product Thinking',
  'Communication'
];

type CourseCopy = {
  cohortIndex: number;
  slot: number;
  index: number;
  id: string;
  groupId: string;
  courses: string;
};

type LessonSeed = {
  id: string;
  isLive: boolean;
  assetId: string | null;
};

type ExerciseSeed = {
  id: string;
  passRequired: boolean;
  questionId: number;
  correctOptionId: number;
  wrongOptionId: number;
};

type GroupMemberSeed = {
  id: string;
  profileId: string;
  cohortIndex: number;
  courseIndex: number;
  courseCopyIndex: number;
};

function seedId(prefix: number, index: number): string {
  return `${prefix.toString(16).padStart(8, '0')}-0000-4000-8000-${index.toString(16).padStart(12, '0')}`;
}

function random(seed: number): number {
  const value = Math.sin(seed) * 10_000;

  return value - Math.floor(value);
}

function idSeed(id: string, length: number): number {
  return Number.parseInt(id.slice(-length), 16) || 0;
}

function isoDaysAgo(days: number, seed: number): string {
  const offsetMs = days * DAY_MS + Math.floor(random(seed) * DAY_MS);
  const date = new Date(Date.now() - offsetMs);

  return date.toISOString();
}

function dateDaysAgo(days: number): string {
  return new Date(Date.now() - days * DAY_MS).toISOString().slice(0, 10);
}

async function insertRows<TTable extends PgTable>(
  table: TTable,
  rows: TTable['$inferInsert'][],
  chunkSize = CHUNK_SIZE
): Promise<void> {
  for (let offset = 0; offset < rows.length; offset += chunkSize) {
    await db.insert(table).values(rows.slice(offset, offset + chunkSize));
  }
}

async function main(): Promise<void> {
  const [existing] = await db
    .select({ id: organization.id })
    .from(organization)
    .where(eq(organization.siteName, ORG_SITE_NAME))
    .limit(1);

  if (existing) {
    throw new Error(
      `Organization "${ORG_SITE_NAME}" already exists. Run this seed only against a fresh scratch database.`
    );
  }

  await db
    .insert(role)
    .values([
      { id: ROLE_ADMIN, type: 'ADMIN' },
      { id: ROLE_TUTOR, type: 'TUTOR' },
      { id: ROLE_STUDENT, type: 'STUDENT' }
    ])
    .onConflictDoNothing();
  await db.insert(submissionstatus).values({ id: 1, label: 'Submitted' }).onConflictDoNothing();
  await db.insert(questionType).values({ id: 1, label: 'Radio', typename: 'radio' }).onConflictDoNothing();

  const [org] = await db
    .insert(organization)
    .values({ name: ORG_NAME, siteName: ORG_SITE_NAME })
    .returning({ id: organization.id });
  const orgId = org.id;

  const studentProfiles = Array.from({ length: STUDENT_COUNT }, (_, index) => {
    const userId = seedId(8, index + 1);

    return { index, userId, email: `student-${index + 1}@${STUDENT_EMAIL_DOMAIN}` };
  });
  const adminProfileId = seedId(8, STUDENT_COUNT + 1);
  const tutorProfileId = seedId(8, STUDENT_COUNT + 2);

  const people = [
    ...studentProfiles.map((student) => ({
      id: student.userId,
      name: `Student ${student.index + 1}`,
      email: student.email,
      username: `load-student-${student.index + 1}`
    })),
    { id: adminProfileId, name: 'Load Admin', email: ADMIN_EMAIL, username: 'load-admin' },
    { id: tutorProfileId, name: 'Load Tutor', email: TUTOR_EMAIL, username: 'load-tutor' }
  ];

  console.log(`Inserting ${people.length} users and profiles`);
  await insertRows(
    user,
    people.map((person) => ({ id: person.id, name: person.name, email: person.email, emailVerified: true }))
  );
  await insertRows(
    profile,
    people.map((person) => ({
      id: person.id,
      fullname: person.name,
      username: person.username,
      email: person.email,
      isEmailVerified: true
    }))
  );

  await insertRows(organizationmember, [
    {
      organizationId: orgId,
      roleId: ROLE_ADMIN,
      profileId: adminProfileId,
      email: ADMIN_EMAIL,
      status: 'ACTIVE'
    },
    {
      organizationId: orgId,
      roleId: ROLE_TUTOR,
      profileId: tutorProfileId,
      email: TUTOR_EMAIL,
      status: 'ACTIVE'
    },
    ...studentProfiles.map((student) => ({
      organizationId: orgId,
      roleId: ROLE_STUDENT,
      profileId: student.userId,
      email: student.email,
      status: 'ACTIVE' as const
    }))
  ]);

  const courseCopies: CourseCopy[] = [];
  const groups = [];
  const courses = [];
  const sections = [];
  const lessons = [];
  const exercises = [];

  for (let cohortIndex = 0; cohortIndex < COHORT_COUNT; cohortIndex += 1) {
    for (let slot = 0; slot < COURSES_PER_COHORT; slot += 1) {
      const index = cohortIndex * COURSES_PER_COHORT + slot;
      const contentIndex = index % COURSE_TITLES.length;
      const groupId = seedId(2, index + 1);
      const courseId = seedId(3, index + 1);

      courseCopies.push({ cohortIndex, slot, index, id: courseId, groupId, courses: COURSE_TITLES[contentIndex] });
      groups.push({
        id: groupId,
        name: `Load cohort ${cohortIndex + 1} course ${slot + 1}`,
        organizationId: orgId
      });
      courses.push({
        id: courseId,
        title: `${COURSE_TITLES[contentIndex]} (Cohort ${cohortIndex + 1})`,
        description: `Performance load course ${index + 1}`,
        groupId,
        slug: `insights-load-course-${index + 1}`,
        status: 'ACTIVE',
        metadata: { isContentGroupingEnabled: contentIndex % 2 === 0 }
      });

      for (let sectionIndex = 0; sectionIndex < SECTIONS_PER_COURSE; sectionIndex += 1) {
        sections.push({
          id: seedId(4, index * SECTIONS_PER_COURSE + sectionIndex + 1),
          title: `Section ${sectionIndex + 1}`,
          order: sectionIndex + 1,
          courseId
        });
      }

      for (let lessonIndex = 0; lessonIndex < LESSONS_PER_COURSE; lessonIndex += 1) {
        const sectionIndex = Math.floor(lessonIndex / 3);
        const isLive = LIVE_LESSON_INDEXES.includes(lessonIndex);

        lessons.push({
          id: seedId(5, index * LESSONS_PER_COURSE + lessonIndex + 1),
          courseId,
          sectionId: seedId(4, index * SECTIONS_PER_COURSE + sectionIndex + 1),
          title: `Lesson ${lessonIndex + 1}`,
          slug: `insights-load-lesson-${index + 1}-${lessonIndex + 1}`,
          order: lessonIndex + 1,
          completionPolicy: isLive ? 'live' : 'video_watch',
          lessonAt: isLive ? isoDaysAgo(lessonIndex % 10, index * 100 + lessonIndex) : null,
          videos: isLive
            ? []
            : [
                {
                  type: 'upload' as const,
                  link: '',
                  assetId: `load-asset-${index}-${lessonIndex}`,
                  watchEnforced: true,
                  metadata: { duration: 600 }
                }
              ]
        });
      }

      for (let exerciseIndex = 0; exerciseIndex < EXERCISES_PER_COURSE; exerciseIndex += 1) {
        const sectionIndex = exerciseIndex === EXERCISES_PER_COURSE - 1 ? null : Math.floor(exerciseIndex / 2);
        const passRequired = exerciseIndex === 1 || exerciseIndex === 4;

        exercises.push({
          id: seedId(6, index * EXERCISES_PER_COURSE + exerciseIndex + 1),
          courseId,
          sectionId: sectionIndex === null ? null : seedId(4, index * SECTIONS_PER_COURSE + sectionIndex + 1),
          title: `Exercise ${exerciseIndex + 1}`,
          slug: `insights-load-exercise-${index + 1}-${exerciseIndex + 1}`,
          order: exerciseIndex + 1,
          completionPolicy: passRequired ? 'passed' : 'submitted',
          passThreshold: passRequired ? 70 : null,
          isUnlocked: true
        });
      }
    }
  }

  console.log(`Inserting ${groups.length} groups, ${courses.length} courses and content`);
  await insertRows(group, groups);
  await insertRows(course, courses);
  await insertRows(courseSection, sections);
  await insertRows(
    lesson,
    lessons.map((row) => ({
      id: row.id,
      courseId: row.courseId,
      sectionId: row.sectionId,
      title: row.title,
      slug: row.slug,
      order: row.order,
      completionPolicy: row.completionPolicy,
      lessonAt: row.lessonAt,
      videos: row.videos
    }))
  );
  await insertRows(
    exercise,
    exercises.map((row) => ({
      id: row.id,
      courseId: row.courseId,
      sectionId: row.sectionId,
      title: row.title,
      slug: row.slug,
      order: row.order,
      completionPolicy: row.completionPolicy,
      passThreshold: row.passThreshold,
      isUnlocked: row.isUnlocked
    }))
  );

  const questions = exercises.map((row) => ({
    exerciseId: row.id,
    title: `${row.title} question`,
    points: 100,
    order: 1
  }));
  const insertedQuestions: Array<{ id: number; exerciseId: string }> = [];

  for (let offset = 0; offset < questions.length; offset += CHUNK_SIZE) {
    const chunk = questions.slice(offset, offset + CHUNK_SIZE);
    const inserted = await db
      .insert(question)
      .values(
        chunk.map((row) => ({
          exerciseId: row.exerciseId,
          questionTypeId: 1,
          title: row.title,
          points: row.points,
          order: row.order
        }))
      )
      .returning({ id: question.id, exerciseId: question.exerciseId });

    insertedQuestions.push(...inserted);
  }

  const insertedOptions = await db
    .insert(option)
    .values(
      insertedQuestions.flatMap((row) => [
        { questionId: row.id, label: 'Correct answer', isCorrect: true },
        { questionId: row.id, label: 'Distractor', isCorrect: false }
      ])
    )
    .returning({ id: option.id, questionId: option.questionId, isCorrect: option.isCorrect });

  const exerciseSeeds = new Map<string, ExerciseSeed>();
  for (const row of insertedQuestions) {
    const correct = insertedOptions.find((optionRow) => optionRow.questionId === row.id && optionRow.isCorrect);
    const wrong = insertedOptions.find((optionRow) => optionRow.questionId === row.id && !optionRow.isCorrect);

    if (!correct || !wrong) throw new Error(`Missing options for question ${row.id}`);

    const exerciseRow = exercises.find((exerciseRow) => exerciseRow.id === row.exerciseId);
    exerciseSeeds.set(row.exerciseId, {
      id: row.exerciseId,
      passRequired: exerciseRow?.completionPolicy === 'passed',
      questionId: row.id,
      correctOptionId: correct.id,
      wrongOptionId: wrong.id
    });
  }

  const cohorts = Array.from({ length: COHORT_COUNT }, (_, index) => ({
    id: seedId(10, index + 1),
    organizationId: orgId,
    name: `Load Cohort ${index + 1}`,
    status: 'ACTIVE' as const
  }));
  await insertRows(cohort, cohorts);
  await insertRows(
    cohortCourse,
    courseCopies.map((row) => ({ cohortId: seedId(10, row.cohortIndex + 1), courseId: row.id }))
  );

  const cohortMembers = studentProfiles.map((student) => {
    const cohortIndex = Math.floor(student.index / COHORT_SIZE);

    return {
      id: seedId(11, student.index + 1),
      cohortId: seedId(10, cohortIndex + 1),
      profileId: student.userId,
      roleId: ROLE_STUDENT,
      email: student.email
    };
  });
  await insertRows(cohortMember, cohortMembers);

  const groupMembers: GroupMemberSeed[] = [];
  const groupMemberRows = [];

  for (const student of studentProfiles) {
    const cohortIndex = Math.floor(student.index / COHORT_SIZE);
    const position = student.index % COHORT_SIZE;

    for (let slot = 0; slot < COURSES_PER_COHORT; slot += 1) {
      const courseCopy = courseCopies.find((row) => row.cohortIndex === cohortIndex && row.slot === slot);
      if (!courseCopy) throw new Error(`Missing course copy for cohort ${cohortIndex} slot ${slot}`);

      const id = seedId(9, cohortIndex * COURSES_PER_COHORT * COHORT_SIZE + slot * COHORT_SIZE + position + 1);
      groupMembers.push({
        id,
        profileId: student.userId,
        cohortIndex,
        courseIndex: courseCopy.index,
        courseCopyIndex: courseCopy.index
      });
      groupMemberRows.push({
        id,
        groupId: courseCopy.groupId,
        roleId: ROLE_STUDENT,
        profileId: student.userId,
        email: student.email
      });
    }
  }

  console.log(`Inserting ${groupMemberRows.length} group members`);
  await insertRows(groupmember, groupMemberRows);

  const lessonsByCourse = new Map<string, LessonSeed[]>();
  const liveLessonsByCourse = new Map<string, string[]>();
  for (const row of lessons) {
    const list = lessonsByCourse.get(row.courseId) ?? [];
    list.push({ id: row.id, isLive: row.completionPolicy === 'live', assetId: row.videos[0]?.assetId ?? null });
    lessonsByCourse.set(row.courseId, list);

    if (row.completionPolicy === 'live') {
      const live = liveLessonsByCourse.get(row.courseId) ?? [];
      live.push(row.id);
      liveLessonsByCourse.set(row.courseId, live);
    }
  }

  console.log('Inserting submissions, question answers, completions, attendance and logins');
  let submissionCount = 0;
  let answerCount = 0;
  let completionCount = 0;
  let videoCount = 0;
  let attendanceCount = 0;

  let submissionChunk: Array<typeof submission.$inferInsert> = [];

  const flushSubmissions = async () => {
    if (submissionChunk.length === 0) return;

    const inserted = await db.insert(submission).values(submissionChunk).returning({
      id: submission.id,
      exerciseId: submission.exerciseId,
      submittedBy: submission.submittedBy,
      total: submission.total,
      gradingState: submission.gradingState
    });
    submissionCount += inserted.length;

    const answers: Array<typeof questionAnswer.$inferInsert> = [];
    for (const row of inserted) {
      if (row.gradingState !== 'completed' || !row.submittedBy) continue;

      const exerciseSeed = exerciseSeeds.get(row.exerciseId);
      if (!exerciseSeed) continue;

      const score = row.total ?? 0;
      answers.push({
        submissionId: row.id,
        groupMemberId: row.submittedBy,
        questionId: exerciseSeed.questionId,
        point: score,
        answerData: {
          type: 'RADIO',
          optionId: score >= 50 ? exerciseSeed.correctOptionId : exerciseSeed.wrongOptionId
        }
      });
    }

    if (answers.length > 0) {
      await insertRows(questionAnswer, answers);
      answerCount += answers.length;
    }

    submissionChunk = [];
  };

  const completionChunk: Array<typeof lessonCompletion.$inferInsert> = [];
  const videoChunk: Array<typeof lessonVideoProgress.$inferInsert> = [];
  const attendanceChunk: Array<typeof groupAttendance.$inferInsert> = [];

  const flushSupportingRows = async () => {
    if (completionChunk.length > 0) {
      await insertRows(lessonCompletion, completionChunk);
      completionCount += completionChunk.length;
      completionChunk.length = 0;
    }
    if (videoChunk.length > 0) {
      await insertRows(lessonVideoProgress, videoChunk);
      videoCount += videoChunk.length;
      videoChunk.length = 0;
    }
    if (attendanceChunk.length > 0) {
      await insertRows(groupAttendance, attendanceChunk);
      attendanceCount += attendanceChunk.length;
      attendanceChunk.length = 0;
    }
  };

  for (let memberIndex = 0; memberIndex < groupMembers.length; memberIndex += 1) {
    const member = groupMembers[memberIndex];
    if (memberIndex % 500 === 0) {
      console.log(`Seeded ${memberIndex}/${groupMembers.length} members`);
    }
    const courseLessons = lessonsByCourse.get(seedId(3, member.courseCopyIndex + 1)) ?? [];
    const liveLessons = liveLessonsByCourse.get(seedId(3, member.courseCopyIndex + 1)) ?? [];

    for (let exerciseIndex = 0; exerciseIndex < EXERCISES_PER_COURSE; exerciseIndex += 1) {
      const exerciseId = seedId(6, member.courseIndex * EXERCISES_PER_COURSE + exerciseIndex + 1);
      const attemptRoll = random(member.courseIndex * 1000 + exerciseIndex * 100 + idSeed(member.id, 4));
      if (attemptRoll > ATTEMPT_PROBABILITY) continue;

      const attempts = 1 + Math.floor(random(attemptRoll * 1000) * 3);
      for (let attempt = 0; attempt < attempts; attempt += 1) {
        const score = 40 + Math.floor(random(attemptRoll * 10_000 + attempt) * 61);
        const awaiting = random(attemptRoll * 100_000 + attempt) < AWAITING_GRADE_PROBABILITY;
        const daysAgo = Math.floor(random(attemptRoll * 1_000_000 + attempt) * 30);

        submissionChunk.push({
          exerciseId,
          courseId: seedId(3, member.courseCopyIndex + 1),
          submittedBy: member.id,
          statusId: 1,
          gradingState: awaiting ? 'awaiting_manual' : 'completed',
          total: awaiting ? 0 : score,
          createdAt: isoDaysAgo(daysAgo, attemptRoll * 7 + attempt)
        });

        if (submissionChunk.length >= CHUNK_SIZE) {
          await flushSubmissions();
        }
      }
    }

    for (const lesson of courseLessons) {
      const completionRoll = random(idSeed(member.id, 6) + idSeed(lesson.id, 6));
      if (completionRoll > LESSON_COMPLETION_PROBABILITY) continue;

      completionChunk.push({
        lessonId: lesson.id,
        profileId: member.profileId,
        isComplete: true,
        createdAt: isoDaysAgo(completionRoll * 20, completionRoll * 11)
      });

      if (lesson.assetId && random(completionRoll * 1000) < 0.8) {
        const watched = 300 + Math.floor(random(completionRoll * 2000) * 301);
        videoChunk.push({
          lessonId: lesson.id,
          profileId: member.profileId,
          assetId: lesson.assetId,
          durationSeconds: 600,
          watchedSeconds: watched,
          furthestSeconds: watched,
          lastPositionSeconds: watched,
          isComplete: watched >= 570,
          completedAt: watched >= 570 ? isoDaysAgo(completionRoll * 20, completionRoll * 13) : null
        });
      }

      if (completionChunk.length >= CHUNK_SIZE || videoChunk.length >= CHUNK_SIZE) {
        await flushSupportingRows();
      }
    }

    for (const lessonId of liveLessons) {
      attendanceChunk.push({
        courseId: seedId(3, member.courseCopyIndex + 1),
        lessonId,
        studentId: member.id,
        isPresent: random(idSeed(member.id, 5) + idSeed(lessonId, 5)) < ATTENDANCE_PROBABILITY
      });
    }

    if (attendanceChunk.length >= CHUNK_SIZE * 2) {
      await flushSupportingRows();
    }
  }

  await flushSubmissions();
  await flushSupportingRows();
  await insertRows(groupAttendance, attendanceChunk);
  attendanceCount += attendanceChunk.length;

  const loginRows: Array<typeof analyticsLoginEvents.$inferInsert> = [];
  for (const student of studentProfiles) {
    const loginDates = new Set<number>();
    let loginAttempt = 0;
    while (loginDates.size < LOGIN_EVENTS_PER_STUDENT && loginAttempt < 100) {
      loginDates.add(Math.floor(random(idSeed(student.userId, 8) + loginAttempt * 97) * LOGIN_WINDOW_DAYS));
      loginAttempt += 1;
    }
    for (const daysAgo of loginDates) {
      loginRows.push({
        userId: student.userId,
        loggedInAt: isoDaysAgo(daysAgo, idSeed(student.userId, 7) + daysAgo),
        loggedInDate: dateDaysAgo(daysAgo)
      });
    }
  }
  await insertRows(analyticsLoginEvents, loginRows);

  console.log('Inserting goals');
  const goalRows = cohorts.map((cohortRow, index) => ({
    id: seedId(12, index + 1),
    cohortId: cohortRow.id,
    title: `Finish the cohort path`,
    type: 'complete_all' as const,
    courseIds: courseCopies.filter((courseCopy) => courseCopy.cohortIndex === index).map((courseCopy) => courseCopy.id),
    status: 'active' as const,
    deadlineKind: 'none' as const
  }));
  await insertRows(cohortGoal, goalRows);

  const goalAssignments = cohortMembers.map((member) => {
    const goalIndex = cohorts.findIndex((cohortRow) => cohortRow.id === member.cohortId);
    const roll = random(goalIndex * 10_000 + idSeed(member.id, 4));
    const overdue = roll < 0.05;
    const dueDate = overdue ? isoDaysAgo(5, roll * 100) : isoDaysAgo(-7, roll * 100);

    return {
      goalId: seedId(12, goalIndex + 1),
      cohortMemberId: member.id,
      dueDate,
      status: 'not_started' as const,
      completedCount: Math.floor(random(roll * 1000) * 4),
      requiredCount: 3
    };
  });
  await insertRows(cohortGoalAssignment, goalAssignments);

  console.log(
    JSON.stringify(
      {
        orgId,
        students: STUDENT_COUNT,
        cohorts: COHORT_COUNT,
        courses: courses.length,
        groupMembers: groupMemberRows.length,
        submissions: submissionCount,
        questionAnswers: answerCount,
        lessonCompletions: completionCount,
        videoProgress: videoCount,
        attendance: attendanceCount,
        goals: goalRows.length,
        goalAssignments: goalAssignments.length,
        loginEvents: loginRows.length
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error('seed-insights-load error:', error);
  process.exitCode = 1;
});
