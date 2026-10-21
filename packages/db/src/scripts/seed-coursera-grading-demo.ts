import 'dotenv/config';

import {
  account,
  and,
  course,
  courseSection,
  db,
  eq,
  exercise,
  group,
  groupmember,
  inArray,
  lesson,
  organizationmember,
  profile,
  question,
  questionAnswer,
  questionType,
  submission,
  user
} from '@db/drizzle';

const COURSERA_ORG_ID = '2b8f4a1c-6d3e-4b2a-9f7e-1c4d8a6e9b0f';
const ORG_ADMIN_EMAIL = 'enterprise@test.com';
const PASSWORD_SOURCE_EMAIL = 'student@test.com';

const GROUP_ID = 'd47a0000-1000-4000-8000-000000000001';
const COURSE_ID = 'd47a0000-2000-4000-8000-000000000001';
const SECTION_ID = 'd47a0000-3000-4000-8000-000000000001';
const LESSON_IDS = ['d47a0000-4000-4000-8000-000000000001', 'd47a0000-4000-4000-8000-000000000002'] as const;
const ADMIN_MEMBER_ID = 'd47a0000-6000-4000-8000-000000000000';

const ROLE_ADMIN = 1;
const ROLE_TUTOR = 2;
const ROLE_STUDENT = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

const CSV_MIME = 'text/csv';
const NOTEBOOK_MIME = 'application/x-ipynb+json';

type DemoPerson = { slug: string; fullname: string; email: string };

const STUDENTS: DemoPerson[] = [
  { slug: 'amara-osei', fullname: 'Amara Osei', email: 'amara.osei@coursera-test.demo' },
  { slug: 'lucas-moreau', fullname: 'Lucas Moreau', email: 'lucas.moreau@coursera-test.demo' },
  { slug: 'priya-raman', fullname: 'Priya Raman', email: 'priya.raman@coursera-test.demo' },
  { slug: 'tomas-herrera', fullname: 'Tomás Herrera', email: 'tomas.herrera@coursera-test.demo' },
  { slug: 'hannah-kim', fullname: 'Hannah Kim', email: 'hannah.kim@coursera-test.demo' },
  { slug: 'kofi-mensah', fullname: 'Kofi Mensah', email: 'kofi.mensah@coursera-test.demo' },
  { slug: 'sofia-lindgren', fullname: 'Sofia Lindgren', email: 'sofia.lindgren@coursera-test.demo' },
  { slug: 'daniel-adeyemi', fullname: 'Daniel Adeyemi', email: 'daniel.adeyemi@coursera-test.demo' }
];

const LOGIN_STUDENT: DemoPerson = {
  slug: 'maya-fernandes',
  fullname: 'Maya Fernandes',
  email: 'grading-student@test.com'
};

const ALL_STUDENTS = [...STUDENTS, LOGIN_STUDENT];

const LOGIN_TUTOR: DemoPerson = { slug: 'jonas-becker', fullname: 'Jonas Becker', email: 'grading-tutor@test.com' };
const TUTOR_PROFILE_ID = 'd47a0000-5000-4000-8000-000000000100';

function seedId(block: number, index: number): string {
  return `d47a0000-${String(block).padStart(4, '0')}-4000-8000-${String(index).padStart(12, '0')}`;
}

function profileId(index: number) {
  return seedId(5000, index + 1);
}

function memberId(index: number) {
  return seedId(6000, index + 1);
}

type DemoExercise = {
  id: string;
  title: string;
  description: string;
  slug: string;
  fileQuestion: { title: string; acceptedTypes: string[]; points: number };
  textQuestion: { title: string; points: number };
};

const EXERCISES: DemoExercise[] = [
  {
    id: seedId(7000, 1),
    title: 'Project 1: Clean the sales data',
    slug: 'project-1-clean-the-sales-data',
    description:
      '<p>Harbor &amp; Pine Coffee exported three months of orders from their till. The file has duplicate order IDs, two date formats and prices with and without a currency sign.</p><p>Clean it, save it as a CSV and upload it below.</p>',
    fileQuestion: { title: 'Upload your cleaned sales file', acceptedTypes: [CSV_MIME], points: 10 },
    textQuestion: { title: 'What did you change, and why?', points: 5 }
  },
  {
    id: seedId(7000, 2),
    title: 'Project 2: Explore the data in a notebook',
    slug: 'project-2-explore-the-data-in-a-notebook',
    description:
      '<p>Load your cleaned file in a Jupyter notebook. Chart weekly revenue, find the best and worst selling drinks, and compare the three stores.</p>',
    fileQuestion: { title: 'Upload your notebook', acceptedTypes: [NOTEBOOK_MIME], points: 15 },
    textQuestion: { title: 'Summarise your three main findings', points: 5 }
  },
  {
    id: seedId(7000, 3),
    title: 'Final project: Forecast next quarter',
    slug: 'final-project-forecast-next-quarter',
    description:
      '<p>Forecast revenue for each store for the next quarter. Submit your notebook, or a CSV with the forecast if you worked in a spreadsheet.</p>',
    fileQuestion: { title: 'Upload your forecast', acceptedTypes: [CSV_MIME, NOTEBOOK_MIME], points: 20 },
    textQuestion: { title: 'How confident are you in this forecast, and what would change it?', points: 5 }
  }
];

type DemoSubmission = {
  exerciseIndex: number;
  studentIndex: number;
  daysAgo: number;
  fileKind: 'csv' | 'ipynb';
  answer: string;
  grade?: { filePoints: number; textPoints: number; feedback: string };
};

const SUBMISSIONS: DemoSubmission[] = [
  {
    exerciseIndex: 0,
    studentIndex: 0,
    daysAgo: 9,
    fileKind: 'csv',
    answer:
      'Removed 38 duplicate orders, converted every date to YYYY-MM-DD and stripped the $ sign so price is a number.',
    grade: {
      filePoints: 10,
      textPoints: 4,
      feedback:
        'Clean work. You caught the duplicate order IDs, which most people miss.\nNext time, note how many rows you dropped in the file name or a README.'
    }
  },
  {
    exerciseIndex: 0,
    studentIndex: 1,
    daysAgo: 8,
    fileKind: 'csv',
    answer: 'Fixed the dates and removed empty rows. Kept the refunds as negative prices.',
    grade: {
      filePoints: 7,
      textPoints: 4,
      feedback: 'Good start. The price column still mixes "$4.50" and "4.5" in about 20 rows, so totals will be off.'
    }
  },
  {
    exerciseIndex: 0,
    studentIndex: 2,
    daysAgo: 8,
    fileKind: 'csv',
    answer:
      'Dropped test orders from store 0, merged the duplicate IDs, normalised dates and prices, and split size out of the drink name.',
    grade: {
      filePoints: 10,
      textPoints: 5,
      feedback: 'Spotless. Splitting size out of the drink name will make Project 2 much easier.'
    }
  },
  {
    exerciseIndex: 0,
    studentIndex: 3,
    daysAgo: 3,
    fileKind: 'csv',
    answer: 'Converted dates, removed duplicates and renamed the columns to snake_case.'
  },
  {
    exerciseIndex: 0,
    studentIndex: 4,
    daysAgo: 2,
    fileKind: 'csv',
    answer: 'Removed duplicates and blank rows. I was not sure what to do with refunds, so I left them in.'
  },
  {
    exerciseIndex: 0,
    studentIndex: 5,
    daysAgo: 7,
    fileKind: 'csv',
    answer: 'Removed duplicates and fixed prices.',
    grade: {
      filePoints: 5,
      textPoints: 3,
      feedback: 'Dates are still in two formats from row 40 onwards. Have another look and resubmit.'
    }
  },
  {
    exerciseIndex: 0,
    studentIndex: 6,
    daysAgo: 1,
    fileKind: 'csv',
    answer:
      'Deduplicated on order ID and timestamp, standardised dates and currency, and flagged refunds in a new column.'
  },
  {
    exerciseIndex: 1,
    studentIndex: 0,
    daysAgo: 4,
    fileKind: 'ipynb',
    answer:
      'Oat lattes grew every week. The harbour store makes 45% of revenue. Tuesdays are the slowest day in all three stores.',
    grade: {
      filePoints: 14,
      textPoints: 4,
      feedback: 'Great charts. Label the y axis on the weekly revenue chart so readers know it is in dollars.'
    }
  },
  {
    exerciseIndex: 1,
    studentIndex: 2,
    daysAgo: 4,
    fileKind: 'ipynb',
    answer:
      'Revenue dips every second weekend. Iced drinks overtook hot drinks in August. The station store sells the most pastries per order.',
    grade: {
      filePoints: 13,
      textPoints: 4,
      feedback:
        'The weekend dip is a sharp catch.\nCheck whether it lines up with the staff rota before you call it a trend.'
    }
  },
  {
    exerciseIndex: 1,
    studentIndex: 1,
    daysAgo: 2,
    fileKind: 'ipynb',
    answer:
      'Flat whites are the top seller. The old town store is growing fastest. Refunds spike after new menu launches.'
  },
  {
    exerciseIndex: 1,
    studentIndex: 4,
    daysAgo: 1,
    fileKind: 'ipynb',
    answer:
      'Mornings are 70% of revenue. Cold brew sells best at the harbour store. Weekly revenue is steady apart from one bank holiday.'
  },
  {
    exerciseIndex: 1,
    studentIndex: 7,
    daysAgo: 1,
    fileKind: 'ipynb',
    answer:
      'Average order value is higher at the station store. Pastry sales track drink sales closely. Decaf barely sells.'
  },
  {
    exerciseIndex: 2,
    studentIndex: 0,
    daysAgo: 1,
    fileKind: 'ipynb',
    answer: 'Fairly confident for the harbour store. A new competitor opening nearby would change it.'
  },
  {
    exerciseIndex: 2,
    studentIndex: 2,
    daysAgo: 0,
    fileKind: 'csv',
    answer: 'Confident within about 10%. The forecast assumes the autumn menu launches on time.'
  },
  {
    exerciseIndex: 2,
    studentIndex: 5,
    daysAgo: 0,
    fileKind: 'ipynb',
    answer: 'Not very confident, I only had three months of data. More history would help a lot.'
  }
];

function demoFileName(student: DemoPerson, exerciseIndex: number, fileKind: DemoSubmission['fileKind']) {
  const baseNames = ['sales-cleaned', 'sales-exploration', 'q4-forecast'];

  return `${student.slug}-${baseNames[exerciseIndex]}.${fileKind}`;
}

/** The object-storage key the seeded answer points at; upload the demo file to this key for View and Download to work. */
export function demoFileKey(fileName: string) {
  return `${COURSERA_ORG_ID}/grading-demo-${fileName}`;
}

function demoFileSize(fileName: string) {
  const charCodeSum = [...fileName].reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return 2_000 + ((charCodeSum * 37) % 9_000);
}

async function resolveFileUploadTypeIds() {
  const rows = await db
    .select({ id: questionType.id, typename: questionType.typename })
    .from(questionType)
    .where(inArray(questionType.typename, ['FILE_UPLOAD', 'TEXTAREA']));
  const idByTypename = new Map(rows.map((row) => [row.typename, row.id]));
  const fileUploadTypeId = idByTypename.get('FILE_UPLOAD');
  const textareaTypeId = idByTypename.get('TEXTAREA');
  if (!fileUploadTypeId || !textareaTypeId) throw new Error('FILE_UPLOAD or TEXTAREA question type is missing');

  return { fileUploadTypeId, textareaTypeId };
}

async function resolveAdminProfileId() {
  const [admin] = await db.select({ id: profile.id }).from(profile).where(eq(profile.email, ORG_ADMIN_EMAIL));
  if (!admin) throw new Error(`${ORG_ADMIN_EMAIL} is missing; run the base seed first`);

  return admin.id;
}

async function removePreviousCourse() {
  const exerciseIds = EXERCISES.map((demoExercise) => demoExercise.id);

  await db.delete(submission).where(inArray(submission.exerciseId, exerciseIds));
  await db.delete(question).where(inArray(question.exerciseId, exerciseIds));
  await db.delete(exercise).where(inArray(exercise.id, exerciseIds));
  await db.delete(lesson).where(inArray(lesson.id, [...LESSON_IDS]));
  await db.delete(courseSection).where(eq(courseSection.id, SECTION_ID));
  await db.delete(groupmember).where(eq(groupmember.groupId, GROUP_ID));
  await db.delete(course).where(eq(course.id, COURSE_ID));
  await db.delete(group).where(eq(group.id, GROUP_ID));
}

type OrgPerson = { id: string; person: DemoPerson; roleId: number };

function orgPeople(): OrgPerson[] {
  const students = ALL_STUDENTS.map((student, index) => ({
    id: profileId(index),
    person: student,
    roleId: ROLE_STUDENT
  }));

  return [...students, { id: TUTOR_PROFILE_ID, person: LOGIN_TUTOR, roleId: ROLE_TUTOR }];
}

async function seedOrgPeople() {
  const people = orgPeople();
  const peopleIds = people.map(({ id }) => id);

  const existingUsers = await db.select({ id: user.id }).from(user).where(inArray(user.id, peopleIds));
  const existingUserIds = new Set(existingUsers.map((row) => row.id));
  const usersToInsert = people
    .filter(({ id }) => !existingUserIds.has(id))
    .map(({ id, person }) => ({ id, name: person.fullname, email: person.email, emailVerified: true }));
  if (usersToInsert.length > 0) await db.insert(user).values(usersToInsert);

  const existingProfiles = await db.select({ id: profile.id }).from(profile).where(inArray(profile.id, peopleIds));
  const existingProfileIds = new Set(existingProfiles.map((row) => row.id));
  const profilesToInsert = people
    .filter(({ id }) => !existingProfileIds.has(id))
    .map(({ id, person }) => ({
      id,
      fullname: person.fullname,
      username: `${person.slug}-grading`,
      email: person.email,
      canAddCourse: false,
      isEmailVerified: true
    }));
  if (profilesToInsert.length > 0) await db.insert(profile).values(profilesToInsert);

  const existingMembers = await db
    .select({ profileId: organizationmember.profileId })
    .from(organizationmember)
    .where(
      and(eq(organizationmember.organizationId, COURSERA_ORG_ID), inArray(organizationmember.profileId, peopleIds))
    );
  const existingMemberIds = new Set(existingMembers.map((row) => row.profileId));
  const membersToInsert = people
    .filter(({ id }) => !existingMemberIds.has(id))
    .map(({ id, person, roleId }) => ({
      organizationId: COURSERA_ORG_ID,
      profileId: id,
      email: person.email,
      roleId,
      verified: true,
      status: 'ACTIVE' as const
    }));
  if (membersToInsert.length > 0) await db.insert(organizationmember).values(membersToInsert);

  await db
    .update(organizationmember)
    .set({ roleId: ROLE_TUTOR })
    .where(
      and(eq(organizationmember.organizationId, COURSERA_ORG_ID), eq(organizationmember.profileId, TUTOR_PROFILE_ID))
    );

  await seedLoginPassword(profileId(ALL_STUDENTS.indexOf(LOGIN_STUDENT)));
  await seedLoginPassword(TUTOR_PROFILE_ID);

  console.log(`   ✓ ${ALL_STUDENTS.length} students and 1 tutor ready (${usersToInsert.length} new accounts)`);
}

async function seedLoginPassword(loginUserId: string) {
  const [existing] = await db
    .select({ id: account.id })
    .from(account)
    .where(and(eq(account.userId, loginUserId), eq(account.providerId, 'credential')));
  if (existing) return;

  const [source] = await db
    .select({ password: account.password })
    .from(account)
    .innerJoin(user, eq(user.id, account.userId))
    .where(and(eq(user.email, PASSWORD_SOURCE_EMAIL), eq(account.providerId, 'credential')));
  if (!source?.password) throw new Error(`${PASSWORD_SOURCE_EMAIL} has no password to copy`);

  await db
    .insert(account)
    .values({ userId: loginUserId, providerId: 'credential', accountId: loginUserId, password: source.password });
}

async function seedCourse(adminProfileId: string) {
  await db.insert(group).values({ id: GROUP_ID, name: 'Data Analysis with Python', organizationId: COURSERA_ORG_ID });
  await db.insert(course).values({
    id: COURSE_ID,
    title: 'Data Analysis with Python',
    description: 'Clean, explore and forecast real sales data with pandas and Jupyter, one project at a time.',
    overview: '<p>Three hands-on projects built around a year of sales data from a small coffee chain.</p>',
    groupId: GROUP_ID,
    bannerImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=70',
    slug: 'data-analysis-with-python',
    metadata: {
      goals: '',
      grading: true,
      description: '',
      requirements: '',
      lessonDownload: false,
      allowNewStudent: true
    },
    isPublished: true,
    status: 'ACTIVE',
    type: 'SELF_PACED'
  });
  await db.insert(courseSection).values({ id: SECTION_ID, courseId: COURSE_ID, title: 'Projects', order: 1 });
  await db.insert(lesson).values([
    {
      id: LESSON_IDS[0],
      courseId: COURSE_ID,
      sectionId: SECTION_ID,
      title: 'Loading data with pandas',
      slug: 'loading-data-with-pandas',
      note: '<p>Read a CSV into a DataFrame, inspect its columns and spot the problems before you fix them.</p>',
      isUnlocked: true,
      order: 1
    },
    {
      id: LESSON_IDS[1],
      courseId: COURSE_ID,
      sectionId: SECTION_ID,
      title: 'Cleaning messy data',
      slug: 'cleaning-messy-data',
      note: '<p>Duplicates, mixed date formats and prices stored as text: how to find and fix each one.</p>',
      isUnlocked: true,
      order: 2
    }
  ]);

  const enrolments = ALL_STUDENTS.map((student, index) => ({
    id: memberId(index),
    groupId: GROUP_ID,
    profileId: profileId(index),
    email: student.email,
    roleId: ROLE_STUDENT
  }));
  await db
    .insert(groupmember)
    .values([{ id: ADMIN_MEMBER_ID, groupId: GROUP_ID, profileId: adminProfileId, roleId: ROLE_ADMIN }, ...enrolments]);

  console.log(`   ✓ Course "Data Analysis with Python" with ${enrolments.length} students`);
}

async function seedExercises(typeIds: { fileUploadTypeId: number; textareaTypeId: number }) {
  const questionIds = new Map<string, { fileQuestionId: number; textQuestionId: number }>();

  for (const [index, demoExercise] of EXERCISES.entries()) {
    await db.insert(exercise).values({
      id: demoExercise.id,
      title: demoExercise.title,
      slug: demoExercise.slug,
      description: demoExercise.description,
      courseId: COURSE_ID,
      sectionId: SECTION_ID,
      order: LESSON_IDS.length + index + 1
    });

    const [fileQuestion, textQuestion] = await db
      .insert(question)
      .values([
        {
          exerciseId: demoExercise.id,
          questionTypeId: typeIds.fileUploadTypeId,
          title: demoExercise.fileQuestion.title,
          points: demoExercise.fileQuestion.points,
          settings: { acceptedTypes: demoExercise.fileQuestion.acceptedTypes },
          order: 1
        },
        {
          exerciseId: demoExercise.id,
          questionTypeId: typeIds.textareaTypeId,
          title: demoExercise.textQuestion.title,
          points: demoExercise.textQuestion.points,
          order: 2
        }
      ])
      .returning({ id: question.id });

    questionIds.set(demoExercise.id, { fileQuestionId: fileQuestion.id, textQuestionId: textQuestion.id });
  }

  console.log(`   ✓ ${EXERCISES.length} project exercises`);

  return questionIds;
}

async function seedSubmissions(questionIds: Map<string, { fileQuestionId: number; textQuestionId: number }>) {
  const now = Date.now();

  for (const demoSubmission of SUBMISSIONS) {
    const demoExercise = EXERCISES[demoSubmission.exerciseIndex];
    const student = STUDENTS[demoSubmission.studentIndex];
    const submittedBy = memberId(demoSubmission.studentIndex);
    const questions = questionIds.get(demoExercise.id)!;
    const submittedAt = new Date(now - demoSubmission.daysAgo * DAY_MS - demoSubmission.studentIndex * 3_600_000);
    const grade = demoSubmission.grade;
    const fileName = demoFileName(student, demoSubmission.exerciseIndex, demoSubmission.fileKind);
    const total = grade ? grade.filePoints + grade.textPoints : 0;

    const [created] = await db
      .insert(submission)
      .values({
        exerciseId: demoExercise.id,
        courseId: COURSE_ID,
        submittedBy,
        statusId: grade ? 3 : 2,
        gradingState: grade ? 'completed' : 'awaiting_manual',
        overallStatus: 'manual_required',
        total,
        feedback: grade?.feedback ?? null,
        createdAt: submittedAt.toISOString(),
        updatedAt: submittedAt.toISOString()
      })
      .returning({ id: submission.id });

    await db.insert(questionAnswer).values([
      {
        submissionId: created.id,
        questionId: questions.fileQuestionId,
        groupMemberId: submittedBy,
        point: grade?.filePoints ?? 0,
        answerData: {
          type: 'FILE_UPLOAD',
          fileKey: demoFileKey(fileName),
          fileName,
          mimeType: demoSubmission.fileKind === 'csv' ? CSV_MIME : NOTEBOOK_MIME,
          size: demoFileSize(fileName)
        }
      },
      {
        submissionId: created.id,
        questionId: questions.textQuestionId,
        groupMemberId: submittedBy,
        point: grade?.textPoints ?? 0,
        answerData: { type: 'TEXTAREA', text: demoSubmission.answer }
      }
    ]);
  }

  const gradedCount = SUBMISSIONS.filter((demoSubmission) => demoSubmission.grade).length;
  console.log(`   ✓ ${SUBMISSIONS.length} submissions (${gradedCount} graded)`);
}

/** Lists every demo file the seeded submissions reference, with its storage key. */
export function listDemoFiles() {
  return SUBMISSIONS.map((demoSubmission) => {
    const fileName = demoFileName(
      STUDENTS[demoSubmission.studentIndex],
      demoSubmission.exerciseIndex,
      demoSubmission.fileKind
    );

    return { fileName, fileKey: demoFileKey(fileName), fileKind: demoSubmission.fileKind };
  });
}

async function main() {
  console.log('🌱 Seeding the coursera-test grading demo...');

  const typeIds = await resolveFileUploadTypeIds();
  const adminProfileId = await resolveAdminProfileId();

  await removePreviousCourse();
  await seedOrgPeople();
  await seedCourse(adminProfileId);
  const questionIds = await seedExercises(typeIds);
  await seedSubmissions(questionIds);

  console.log(`✅ Done. Course: /courses/${COURSE_ID}/submissions`);
  console.log(`   Student login: ${LOGIN_STUDENT.email} / same password as ${PASSWORD_SOURCE_EMAIL}`);
  console.log(`   Tutor login: ${LOGIN_TUTOR.email} / same password as ${PASSWORD_SOURCE_EMAIL}`);
  process.exit(0);
}

if (process.argv[1]?.endsWith('seed-coursera-grading-demo.ts')) {
  main().catch((error) => {
    console.error('seed-coursera-grading-demo error:', error);
    process.exit(1);
  });
}
