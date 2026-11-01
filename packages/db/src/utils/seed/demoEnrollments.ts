import {
  and,
  asc,
  courseCertificateIssue,
  courseCompletionRecord,
  db,
  eq,
  groupAttendance,
  groupmember,
  inArray,
  lessonCheckInCode,
  lessonCompletion,
  option,
  question,
  questionAnswer,
  submission
} from '@db/drizzle';
import type {
  TNewCourseCompletionRecord,
  TNewGroupAttendance,
  TNewGroupmember,
  TNewQuestionAnswer,
  TNewSubmission
} from '@db/types';
import { ROLE } from '@cio/utils/constants/roles';
import { QUESTION_TYPE } from '@cio/utils/validation/constants';

import { LEARNER_PROFILES } from './compliance';
import {
  daysFromNow,
  demoCourseId,
  demoCourseLessonIds,
  demoGroupId,
  demoLessonId,
  findDemoExerciseId,
  minutesFromNow,
  type DemoCourse,
  type DemoQuestion
} from './demoCatalogTypes';
import { DEMO_CATALOG, selectDemoCatalog } from './demoCourses';
import { buildPeopleDirectory, SKILLSHARE_LEARNER_KEYS, type DemoAccounts } from './demoPeople';

type SubmissionPlan = 'auto' | 'awaiting' | 'graded';

type ComplianceStatus = 'compliant' | 'in_progress' | 'not_started' | 'non_compliant' | 'expiring_soon';

type EnrollmentPlan = {
  courseKey: string;
  personKey: string;
  enrolledDaysAgo: number;
  lessonsCompleted: number | 'all';
  submissions?: Record<string, SubmissionPlan>;
  /** Marks the course completed and the certificate earned this many days ago. */
  completedDaysAgo?: number;
  compliance?: { status: ComplianceStatus; dueInDays: number; completedDaysAgo?: number };
};

const STUDENT_PLANS: EnrollmentPlan[] = [
  {
    courseKey: 'react',
    personKey: 'student',
    enrolledDaysAgo: 50,
    lessonsCompleted: 2,
    submissions: { 'react-data-hook': 'awaiting' }
  },
  {
    courseKey: 'pandas',
    personKey: 'student',
    enrolledDaysAgo: 70,
    lessonsCompleted: 'all',
    submissions: {
      'python-intro': 'auto',
      'pandas-analysis': 'auto',
      'pandas-cleaning': 'auto',
      'pandas-groupby': 'auto'
    },
    completedDaysAgo: 12
  },
  {
    courseKey: 'python-engineering',
    personKey: 'student',
    enrolledDaysAgo: 45,
    lessonsCompleted: 'all',
    submissions: { 'pythonic-quiz': 'auto', 'refactoring-reflection': 'graded' },
    completedDaysAgo: 4
  },
  {
    courseKey: 'ux-design',
    personKey: 'student',
    enrolledDaysAgo: 21,
    lessonsCompleted: 3,
    submissions: { 'ux-principles': 'auto', 'heuristic-review': 'awaiting' }
  },
  { courseKey: 'machine-learning', personKey: 'student', enrolledDaysAgo: 6, lessonsCompleted: 1 },
  {
    courseKey: 'product-management',
    personKey: 'student',
    enrolledDaysAgo: 12,
    lessonsCompleted: 2,
    submissions: { 'problem-statement': 'awaiting' }
  },
  { courseKey: 'leading-teams', personKey: 'student', enrolledDaysAgo: 8, lessonsCompleted: 1 },
  {
    courseKey: 'digital-marketing',
    personKey: 'student',
    enrolledDaysAgo: 30,
    lessonsCompleted: 3,
    submissions: { 'marketing-basics': 'auto' }
  },
  { courseKey: 'pytest', personKey: 'student', enrolledDaysAgo: 2, lessonsCompleted: 0 },
  {
    courseKey: 'security-awareness',
    personKey: 'student',
    enrolledDaysAgo: 25,
    lessonsCompleted: 1,
    compliance: { status: 'in_progress', dueInDays: 5 }
  },
  {
    courseKey: 'gdpr',
    personKey: 'student',
    enrolledDaysAgo: 40,
    lessonsCompleted: 0,
    compliance: { status: 'non_compliant', dueInDays: -6 }
  },
  {
    courseKey: 'code-of-conduct',
    personKey: 'student',
    enrolledDaysAgo: 60,
    lessonsCompleted: 'all',
    submissions: { 'conduct-quiz': 'auto' },
    completedDaysAgo: 40,
    compliance: { status: 'compliant', dueInDays: -38, completedDaysAgo: 40 }
  },
  {
    courseKey: 'incident-response',
    personKey: 'enterpriseStudent',
    enrolledDaysAgo: 20,
    lessonsCompleted: 2,
    submissions: { 'triage-quiz': 'auto' }
  },
  { courseKey: 'secure-coding', personKey: 'enterpriseStudent', enrolledDaysAgo: 5, lessonsCompleted: 0 },
  { courseKey: 'manager-essentials', personKey: 'enterpriseStudent', enrolledDaysAgo: 10, lessonsCompleted: 1 },
  {
    courseKey: 'product-fundamentals',
    personKey: 'earlyAdopterStudent',
    enrolledDaysAgo: 60,
    lessonsCompleted: 'all',
    submissions: { 'pm-basics': 'auto' },
    completedDaysAgo: 9
  },
  {
    courseKey: 'brand-design',
    personKey: 'earlyAdopterStudent',
    enrolledDaysAgo: 14,
    lessonsCompleted: 2,
    submissions: { 'brand-guide': 'awaiting' }
  },
  { courseKey: 'content-marketing', personKey: 'earlyAdopterStudent', enrolledDaysAgo: 3, lessonsCompleted: 0 },
  { courseKey: 'founder-finance', personKey: 'earlyAdopterStudent', enrolledDaysAgo: 7, lessonsCompleted: 1 }
];

/** Manual submissions from other learners, so the grading queue has items across courses. */
const LEARNER_MANUAL_SUBMISSIONS: Array<{
  courseKey: string;
  personKey: string;
  exerciseKey: string;
  plan: SubmissionPlan;
}> = [
  {
    courseKey: 'python-engineering',
    personKey: 'amara.okafor',
    exerciseKey: 'refactoring-reflection',
    plan: 'awaiting'
  },
  { courseKey: 'python-engineering', personKey: 'arjun.mehta', exerciseKey: 'refactoring-reflection', plan: 'graded' },
  {
    courseKey: 'python-engineering',
    personKey: 'kenji.watanabe',
    exerciseKey: 'refactoring-reflection',
    plan: 'graded'
  },
  { courseKey: 'leading-teams', personKey: 'tomas.rivera', exerciseKey: 'one-on-one-reflection', plan: 'awaiting' },
  { courseKey: 'ux-design', personKey: 'hannah.becker', exerciseKey: 'heuristic-review', plan: 'awaiting' },
  { courseKey: 'ux-design', personKey: 'leila.rahimi', exerciseKey: 'heuristic-review', plan: 'graded' },
  { courseKey: 'react', personKey: 'lucas.oliveira', exerciseKey: 'react-data-hook', plan: 'awaiting' },
  { courseKey: 'docker', personKey: 'fatima.alsayed', exerciseKey: 'dockerfile-review', plan: 'awaiting' },
  { courseKey: 'product-management', personKey: 'priya.raman', exerciseKey: 'problem-statement', plan: 'graded' },
  { courseKey: 'machine-learning', personKey: 'wei.zhang', exerciseKey: 'classifier-project', plan: 'graded' },
  { courseKey: 'incident-response', personKey: 'grace.hopper', exerciseKey: 'postmortem', plan: 'awaiting' }
];

const COURSE_LEARNERS: Record<string, string[]> = {
  mvc: [
    'diego.herrera',
    'samuel.adeyemi',
    'lucas.oliveira',
    'yusuf.demir',
    'kenji.watanabe',
    'arjun.mehta',
    'amara.okafor',
    'olga.petrova'
  ],
  react: ['amara.okafor', 'lucas.oliveira', 'samuel.adeyemi', 'diego.herrera', 'leila.rahimi', 'mei.lin'],
  pandas: [
    'mateo.garcia',
    'priya.raman',
    'mei.lin',
    'jaewon.park',
    'wei.zhang',
    'zanele.dlamini',
    'arjun.mehta',
    'nadia.haddad',
    'marcus.johnson'
  ],
  'python-engineering': [
    'amara.okafor',
    'arjun.mehta',
    'kenji.watanabe',
    'diego.herrera',
    'yusuf.demir',
    'mei.lin',
    'olga.petrova',
    'samuel.adeyemi',
    'lucas.oliveira',
    'fatima.alsayed'
  ],
  pytest: [
    'yusuf.demir',
    'kenji.watanabe',
    'arjun.mehta',
    'olga.petrova',
    'diego.herrera',
    'fatima.alsayed',
    'lucas.oliveira'
  ],
  docker: [
    'fatima.alsayed',
    'olga.petrova',
    'kenji.watanabe',
    'diego.herrera',
    'mei.lin',
    'samuel.adeyemi',
    'daniel.mensah'
  ],
  'machine-learning': [
    'wei.zhang',
    'jaewon.park',
    'mateo.garcia',
    'priya.raman',
    'mei.lin',
    'zanele.dlamini',
    'arjun.mehta',
    'nadia.haddad',
    'kwame.asante',
    'emily.carter',
    'amara.okafor'
  ],
  'ux-design': [
    'hannah.becker',
    'leila.rahimi',
    'sofia.rossi',
    'aisha.bello',
    'chloe.dubois',
    'samuel.adeyemi',
    'priya.raman',
    'lucas.oliveira',
    'marcus.johnson'
  ],
  'product-management': [
    'priya.raman',
    'aisha.bello',
    'kwame.asante',
    'hannah.becker',
    'emily.carter',
    'marcus.johnson',
    'rafael.costa',
    'tomas.rivera',
    'leila.rahimi',
    'zanele.dlamini'
  ],
  'leading-teams': [
    'tomas.rivera',
    'emily.carter',
    'kenji.watanabe',
    'olga.petrova',
    'aisha.bello',
    'marcus.johnson',
    'daniel.mensah',
    'kwame.asante'
  ],
  'digital-marketing': [
    'ingrid.larsen',
    'rafael.costa',
    'chloe.dubois',
    'kwame.asante',
    'sofia.rossi',
    'marcus.johnson',
    'aisha.bello'
  ],
  productivity: [
    'emily.carter',
    'tomas.rivera',
    'zanele.dlamini',
    'nadia.haddad',
    'marcus.johnson',
    'ingrid.larsen',
    'chloe.dubois',
    'jaewon.park'
  ],
  'security-awareness': [
    'daniel.mensah',
    'nadia.haddad',
    'olga.petrova',
    'fatima.alsayed',
    'emily.carter',
    'tomas.rivera',
    'ingrid.larsen',
    'marcus.johnson',
    'zanele.dlamini',
    'kenji.watanabe',
    'sofia.rossi',
    'rafael.costa'
  ],
  gdpr: [
    'nadia.haddad',
    'daniel.mensah',
    'priya.raman',
    'marcus.johnson',
    'chloe.dubois',
    'mateo.garcia',
    'zanele.dlamini',
    'ingrid.larsen',
    'jaewon.park',
    'aisha.bello'
  ],
  'code-of-conduct': [
    'nadia.haddad',
    'emily.carter',
    'tomas.rivera',
    'zanele.dlamini',
    'daniel.mensah',
    'ingrid.larsen',
    'marcus.johnson',
    'hannah.becker',
    'wei.zhang',
    'diego.herrera',
    'kwame.asante'
  ],
  'incident-response': LEARNER_PROFILES.slice(0, 10).map((learner) => learner.username),
  'secure-coding': LEARNER_PROFILES.slice(4, 14).map((learner) => learner.username),
  'manager-essentials': LEARNER_PROFILES.slice(10, 18).map((learner) => learner.username),
  'product-fundamentals': SKILLSHARE_LEARNER_KEYS,
  'brand-design': SKILLSHARE_LEARNER_KEYS.slice(0, 6),
  'content-marketing': SKILLSHARE_LEARNER_KEYS.slice(2, 8),
  'founder-finance': SKILLSHARE_LEARNER_KEYS.slice(0, 5)
};

/** Share of lessons each pool learner has finished, cycled by position in the course roster. */
const PROGRESS_FRACTIONS = [1, 0.6, 0.35, 1, 0.8, 0, 0.5, 0.2, 1, 0.7, 0.4];

const GRADER_FEEDBACK = [
  'Clear and specific. Your example shows you understood the trade-off; next time add one sentence on how you measured the result.',
  'Good work. The reasoning is solid and the structure is easy to follow.',
  'Strong answer. I would like to see this applied to a second case in the next assignment.'
];

const QUESTION_TYPE_NAMES = new Map<number, string>(
  Object.entries(QUESTION_TYPE).map(([typename, id]) => [id as number, typename])
);

function demoQuestionsByTitle() {
  const byTitle = new Map<string, DemoQuestion>();
  for (const demoCourse of DEMO_CATALOG) {
    for (const existingExercise of demoCourse.existing?.exercises ?? []) {
      for (const demoQuestion of existingExercise.extraQuestions ?? []) byTitle.set(demoQuestion.title, demoQuestion);
    }

    for (const section of demoCourse.sections) {
      for (const demoExercise of section.exercises ?? []) {
        for (const demoQuestion of demoExercise.questions) byTitle.set(demoQuestion.title, demoQuestion);
      }
    }
  }

  return byTitle;
}

function hashOf(value: string) {
  let hash = 0;
  for (const character of value) hash = (hash * 31 + character.charCodeAt(0)) | 0;

  return Math.abs(hash);
}

type LoadedQuestion = {
  id: number;
  typename: string;
  title: string;
  points: number;
  settings: Record<string, unknown>;
  options: Array<{ id: number; label: string; isCorrect: boolean }>;
};

async function loadExerciseQuestions(exerciseIds: string[]) {
  if (exerciseIds.length === 0) return new Map<string, LoadedQuestion[]>();

  const questionRows = await db
    .select()
    .from(question)
    .where(inArray(question.exerciseId, exerciseIds))
    .orderBy(asc(question.order), asc(question.id));
  const optionRows = questionRows.length
    ? await db
        .select()
        .from(option)
        .where(
          inArray(
            option.questionId,
            questionRows.map((row) => row.id)
          )
        )
        .orderBy(asc(option.id))
    : [];

  const byExercise = new Map<string, LoadedQuestion[]>();
  for (const row of questionRows) {
    const loaded: LoadedQuestion = {
      id: row.id,
      typename: QUESTION_TYPE_NAMES.get(row.questionTypeId) ?? 'RADIO',
      title: row.title,
      points: Math.round(row.points ?? 0),
      settings: (row.settings ?? {}) as Record<string, unknown>,
      options: optionRows
        .filter((optionRow) => optionRow.questionId === row.id)
        .map((optionRow) => ({ id: optionRow.id, label: optionRow.label, isCorrect: optionRow.isCorrect ?? false }))
    };
    byExercise.set(row.exerciseId, [...(byExercise.get(row.exerciseId) ?? []), loaded]);
  }

  return byExercise;
}

function isManual(loaded: LoadedQuestion) {
  return ['TEXTAREA', 'SHORT_ANSWER', 'LINK', 'FILE_UPLOAD', 'VIDEO_RECORDING'].includes(loaded.typename);
}

/** Builds a stored answer; `correct` false produces a plausible wrong answer for auto-graded types. */
function buildAnswer(
  loaded: LoadedQuestion,
  demoQuestion: DemoQuestion | undefined,
  variant: number,
  correct: boolean
): TNewQuestionAnswer['answerData'] {
  const correctOptions = loaded.options.filter((item) => item.isCorrect);
  const wrongOptions = loaded.options.filter((item) => !item.isCorrect);

  switch (loaded.typename) {
    case 'RADIO': {
      const picked = correct ? correctOptions[0] : (wrongOptions[0] ?? correctOptions[0]);
      return { type: 'RADIO', optionId: picked.id };
    }
    case 'CHECKBOX': {
      const picked = correct ? correctOptions : correctOptions.slice(0, 1);
      return { type: 'CHECKBOX', optionIds: picked.map((item) => item.id) };
    }
    case 'TRUE_FALSE': {
      const value = loaded.settings.correctValue !== false;
      return { type: 'TRUE_FALSE', value: correct ? value : !value };
    }
    case 'NUMERIC': {
      const value = Number(loaded.settings.correctValue ?? 0);
      return { type: 'NUMERIC', value: correct ? value : value + 10 };
    }
    case 'FILL_BLANK': {
      const accepted = String(loaded.settings.acceptedAnswers ?? '')
        .split(',')
        .map((entry) => entry.trim());
      return { type: 'FILL_BLANK', values: correct ? accepted : accepted.map(() => 'not sure') };
    }
    case 'ORDERING': {
      const ordered = loaded.options.map((item) => String(item.id));
      return { type: 'ORDERING', orderedValues: correct ? ordered : [...ordered].reverse() };
    }
    case 'WORD_BANK': {
      const answers = (loaded.settings.correctAnswers as string[] | undefined) ?? [];
      return { type: 'WORD_BANK', filledBlanks: correct ? answers : [...answers].reverse() };
    }
    case 'TEXTAREA': {
      const samples = demoQuestion?.type === 'TEXTAREA' ? demoQuestion.sampleAnswers : [];
      return { type: 'TEXTAREA', text: samples[variant % Math.max(samples.length, 1)] ?? 'See my notes attached.' };
    }
    case 'SHORT_ANSWER': {
      const samples = demoQuestion?.type === 'SHORT_ANSWER' ? demoQuestion.sampleAnswers : [];
      return { type: 'SHORT_ANSWER', text: samples[variant % Math.max(samples.length, 1)] ?? '' };
    }
    case 'LINK': {
      const links = demoQuestion?.type === 'LINK' ? demoQuestion.sampleLinks : [];
      return { type: 'LINK', urls: [links[variant % Math.max(links.length, 1)] ?? 'https://github.com'] };
    }
    case 'STAR':
      return { type: 'STAR', value: 4 + (variant % 2) };
    case 'THUMBS':
      return { type: 'THUMBS', value: variant % 3 !== 0 };
    default:
      return null;
  }
}

function overallStatusFor(questions: LoadedQuestion[]) {
  const manualCount = questions.filter(isManual).length;
  if (manualCount === 0) return 'auto_graded';
  if (manualCount === questions.length) return 'manual_required';

  return 'hybrid';
}

type SubmissionRequest = {
  groupMemberId: string;
  courseId: string;
  exerciseId: string;
  plan: SubmissionPlan;
  variant: number;
  submittedDaysAgo: number;
  graderId: string;
};

async function insertSubmissions(requests: SubmissionRequest[], now: Date) {
  if (requests.length === 0) return { submissions: 0, answers: 0 };

  const existing = await db
    .select({ submittedBy: submission.submittedBy, exerciseId: submission.exerciseId })
    .from(submission)
    .where(
      inArray(
        submission.submittedBy,
        requests.map((request) => request.groupMemberId)
      )
    );
  const existingKeys = new Set(existing.map((row) => `${row.submittedBy}-${row.exerciseId}`));
  const pending = requests.filter((request) => !existingKeys.has(`${request.groupMemberId}-${request.exerciseId}`));
  const questionsByExercise = await loadExerciseQuestions([...new Set(pending.map((request) => request.exerciseId))]);
  const demoQuestions = demoQuestionsByTitle();
  let answerCount = 0;

  for (const request of pending) {
    const questions = questionsByExercise.get(request.exerciseId) ?? [];
    const createdAt = daysFromNow(now, -request.submittedDaysAgo);
    const answers = questions.map((loaded, index) => {
      const answerCorrect = !(request.variant % 3 === 1 && index === questions.length - 1);
      const answerData = buildAnswer(loaded, demoQuestions.get(loaded.title), request.variant, answerCorrect);
      let point = 0;
      if (!isManual(loaded) && answerCorrect) point = loaded.points;
      if (isManual(loaded) && request.plan === 'graded')
        point = Math.round(loaded.points * (0.75 + (request.variant % 3) * 0.1));

      return { loaded, answerData, point };
    });
    const answered = answers.filter((answer) => answer.answerData !== null);
    const isAwaiting = request.plan === 'awaiting';
    const total = isAwaiting ? 0 : answers.reduce((sum, answer) => sum + answer.point, 0);

    const submissionRow: TNewSubmission = {
      exerciseId: request.exerciseId,
      courseId: request.courseId,
      submittedBy: request.groupMemberId,
      statusId: isAwaiting ? 2 : 3,
      gradingState: isAwaiting ? 'awaiting_manual' : 'completed',
      overallStatus: overallStatusFor(questions),
      total,
      gradedBy: request.plan === 'graded' ? request.graderId : null,
      feedback: request.plan === 'graded' ? GRADER_FEEDBACK[request.variant % GRADER_FEEDBACK.length] : null,
      createdAt,
      updatedAt: isAwaiting ? createdAt : daysFromNow(now, -Math.max(request.submittedDaysAgo - 1, 0))
    };
    const [created] = await db.insert(submission).values(submissionRow).returning({ id: submission.id });

    const answerRows: TNewQuestionAnswer[] = (isAwaiting ? answered : answers).map((answer) => ({
      questionId: answer.loaded.id,
      groupMemberId: request.groupMemberId,
      submissionId: created.id,
      answerData: answer.answerData,
      point: isAwaiting ? 0 : answer.point
    }));

    if (answerRows.length > 0) {
      await db.insert(questionAnswer).values(answerRows);
      answerCount += answerRows.length;
    }
  }

  return { submissions: pending.length, answers: answerCount };
}

function complianceRecord(
  status: ComplianceStatus,
  dueInDays: number,
  completedDaysAgo: number | undefined,
  retakeIntervalMonths: number,
  now: Date
): Omit<TNewCourseCompletionRecord, 'courseId' | 'groupMemberId' | 'profileId'> {
  const validityDays = retakeIntervalMonths * 30;

  if (status === 'compliant' || status === 'expiring_soon') {
    const completedAgo = completedDaysAgo ?? (status === 'expiring_soon' ? validityDays - 6 : 40);
    return {
      cycleNumber: 1,
      status,
      dueDate: daysFromNow(now, dueInDays),
      startedAt: daysFromNow(now, -completedAgo - 1),
      completedAt: daysFromNow(now, -completedAgo),
      validUntil: daysFromNow(now, validityDays - completedAgo),
      score: 90,
      attempts: 1,
      timeSpentMinutes: 38
    };
  }

  return {
    cycleNumber: 1,
    status,
    dueDate: daysFromNow(now, dueInDays),
    startedAt: status === 'not_started' ? null : daysFromNow(now, -3),
    attempts: 0,
    timeSpentMinutes: status === 'in_progress' ? 14 : 0
  };
}

function poolPlans(catalog: DemoCourse[]): EnrollmentPlan[] {
  return catalog.flatMap((demoCourse) =>
    (COURSE_LEARNERS[demoCourse.key] ?? []).map((personKey, position) => {
      const lessonTotal = demoCourseLessonIds(demoCourse).length;
      const fraction = PROGRESS_FRACTIONS[(position + demoCourse.index) % PROGRESS_FRACTIONS.length];
      const lessonsCompleted = Math.round(lessonTotal * fraction);
      const isComplete = lessonsCompleted === lessonTotal && lessonTotal > 0;
      const enrolledDaysAgo = Math.min(
        demoCourse.createdDaysAgo - 1,
        5 + ((position * 13 + demoCourse.index * 7) % 90)
      );
      const plan: EnrollmentPlan = {
        courseKey: demoCourse.key,
        personKey,
        enrolledDaysAgo: Math.max(enrolledDaysAgo, 2),
        lessonsCompleted,
        completedDaysAgo: isComplete ? Math.max(1, Math.floor(enrolledDaysAgo / 3)) : undefined
      };

      if (demoCourse.compliance) {
        const overdue = position % 5 === 3;
        plan.compliance = isComplete
          ? { status: 'compliant', dueInDays: -(plan.completedDaysAgo ?? 1), completedDaysAgo: plan.completedDaysAgo }
          : {
              status: overdue ? 'non_compliant' : lessonsCompleted > 0 ? 'in_progress' : 'not_started',
              dueInDays: overdue ? -4 - position : 7 + position * 2
            };
      }

      return plan;
    })
  );
}

export async function seedDemoEnrollments({
  accounts,
  selectedOrganizationId
}: {
  accounts: DemoAccounts;
  selectedOrganizationId?: string;
}) {
  const now = new Date();
  const catalog = selectDemoCatalog(accounts, selectedOrganizationId);
  const courseByKey = new Map(catalog.map((demoCourse) => [demoCourse.key, demoCourse]));
  const personId = buildPeopleDirectory(accounts);
  const plans = [...STUDENT_PLANS, ...poolPlans(catalog)].filter((plan) => courseByKey.has(plan.courseKey));

  const groupIds = [...new Set(catalog.map(demoGroupId))];
  const existingMembers = await db
    .select({ id: groupmember.id, groupId: groupmember.groupId, profileId: groupmember.profileId })
    .from(groupmember)
    .where(inArray(groupmember.groupId, groupIds));
  const memberKey = (groupId: string, profileId: string) => `${groupId}-${profileId}`;
  const existingMemberKeys = new Set(existingMembers.map((row) => memberKey(row.groupId, row.profileId ?? '')));

  const membersToInsert: TNewGroupmember[] = [];
  for (const plan of plans) {
    const demoCourse = courseByKey.get(plan.courseKey)!;
    const profileId = personId(plan.personKey);
    const key = memberKey(demoGroupId(demoCourse), profileId);
    if (existingMemberKeys.has(key)) continue;

    existingMemberKeys.add(key);
    const completedAt = plan.completedDaysAgo === undefined ? null : daysFromNow(now, -plan.completedDaysAgo);
    membersToInsert.push({
      groupId: demoGroupId(demoCourse),
      profileId,
      roleId: ROLE.STUDENT,
      createdAt: daysFromNow(now, -plan.enrolledDaysAgo),
      completedAt,
      certificateEarnedAt: completedAt
    });
  }

  if (membersToInsert.length > 0) {
    await db.insert(groupmember).values(membersToInsert);
  }

  const allMembers = await db
    .select({
      id: groupmember.id,
      groupId: groupmember.groupId,
      profileId: groupmember.profileId,
      completedAt: groupmember.completedAt
    })
    .from(groupmember)
    .where(inArray(groupmember.groupId, groupIds));
  const memberIdByKey = new Map(allMembers.map((row) => [memberKey(row.groupId, row.profileId ?? ''), row.id]));
  const memberFor = (demoCourse: DemoCourse, personKey: string) =>
    memberIdByKey.get(memberKey(demoGroupId(demoCourse), personId(personKey)))!;

  for (const plan of plans) {
    if (plan.completedDaysAgo === undefined) continue;

    const demoCourse = courseByKey.get(plan.courseKey)!;
    const completedAt = daysFromNow(now, -plan.completedDaysAgo);
    await db
      .update(groupmember)
      .set({ completedAt, certificateEarnedAt: completedAt })
      .where(and(eq(groupmember.id, memberFor(demoCourse, plan.personKey)), eq(groupmember.roleId, ROLE.STUDENT)));
  }

  const completionRows = plans.flatMap((plan) => {
    const demoCourse = courseByKey.get(plan.courseKey)!;
    const lessonIds = demoCourseLessonIds(demoCourse);
    const count = plan.lessonsCompleted === 'all' ? lessonIds.length : plan.lessonsCompleted;

    return lessonIds.slice(0, count).map((lessonId, position) => {
      const daysAgo = Math.max(plan.enrolledDaysAgo - (position + 1) * 2, plan.completedDaysAgo ?? 0, 0);
      const completedAt = daysFromNow(now, -daysAgo);

      return {
        lessonId,
        profileId: personId(plan.personKey),
        isComplete: true,
        createdAt: completedAt,
        updatedAt: completedAt
      };
    });
  });
  const completionProfileIds = [...new Set(completionRows.map((row) => row.profileId))];
  const existingCompletions = completionProfileIds.length
    ? await db
        .select({ lessonId: lessonCompletion.lessonId, profileId: lessonCompletion.profileId })
        .from(lessonCompletion)
        .where(inArray(lessonCompletion.profileId, completionProfileIds))
    : [];
  const existingCompletionKeys = new Set(existingCompletions.map((row) => `${row.profileId}-${row.lessonId}`));
  const completionsToInsert = completionRows.filter(
    (row) => !existingCompletionKeys.has(`${row.profileId}-${row.lessonId}`)
  );

  if (completionsToInsert.length > 0) {
    await db.insert(lessonCompletion).values(completionsToInsert);
  }

  const graderFor = (demoCourse: DemoCourse) =>
    personId(
      demoCourse.org === 'udemy' ? 'admin' : demoCourse.org === 'coursera' ? 'enterpriseAdmin' : 'earlyAdopterAdmin'
    );

  const submissionRequests: SubmissionRequest[] = [];
  for (const [planIndex, plan] of plans.entries()) {
    const demoCourse = courseByKey.get(plan.courseKey)!;
    const explicit = plan.submissions ?? {};
    const isPoolLearner = !STUDENT_PLANS.includes(plan);

    if (isPoolLearner) {
      const lessonTotal = demoCourseLessonIds(demoCourse).length;
      const completedShare = plan.lessonsCompleted === 'all' ? 1 : plan.lessonsCompleted / Math.max(lessonTotal, 1);
      const autoExercises = autoExerciseKeys(demoCourse);
      const reachable = Math.round(autoExercises.length * completedShare);
      for (const exerciseKey of autoExercises.slice(0, reachable)) explicit[exerciseKey] = 'auto';
    }

    for (const [exerciseKey, submissionPlan] of Object.entries(explicit)) {
      submissionRequests.push({
        groupMemberId: memberFor(demoCourse, plan.personKey),
        courseId: demoCourseId(demoCourse),
        exerciseId: findDemoExerciseId(demoCourse, exerciseKey),
        plan: submissionPlan,
        variant: planIndex + hashOf(exerciseKey),
        submittedDaysAgo: Math.max(1, Math.min(plan.enrolledDaysAgo - 1, (planIndex % 6) + 1)),
        graderId: graderFor(demoCourse)
      });
    }
  }

  for (const [index, manual] of LEARNER_MANUAL_SUBMISSIONS.entries()) {
    const demoCourse = courseByKey.get(manual.courseKey);
    if (!demoCourse) continue;

    submissionRequests.push({
      groupMemberId: memberFor(demoCourse, manual.personKey),
      courseId: demoCourseId(demoCourse),
      exerciseId: findDemoExerciseId(demoCourse, manual.exerciseKey),
      plan: manual.plan,
      variant: index + 1,
      submittedDaysAgo: 1 + (index % 5),
      graderId: graderFor(demoCourse)
    });
  }

  const submissionResult = await insertSubmissions(submissionRequests, now);

  const records: TNewCourseCompletionRecord[] = [];
  for (const plan of plans) {
    const demoCourse = courseByKey.get(plan.courseKey)!;
    if (!plan.compliance || !demoCourse.compliance) continue;

    records.push({
      courseId: demoCourseId(demoCourse),
      groupMemberId: memberFor(demoCourse, plan.personKey),
      profileId: personId(plan.personKey),
      ...complianceRecord(
        plan.compliance.status,
        plan.compliance.dueInDays,
        plan.compliance.completedDaysAgo,
        demoCourse.compliance.retakeIntervalMonths,
        now
      )
    });
  }
  const complianceCourseIds = [...new Set(records.map((record) => record.courseId))];
  const existingRecords = complianceCourseIds.length
    ? await db
        .select({ courseId: courseCompletionRecord.courseId, profileId: courseCompletionRecord.profileId })
        .from(courseCompletionRecord)
        .where(inArray(courseCompletionRecord.courseId, complianceCourseIds))
    : [];
  const existingRecordKeys = new Set(existingRecords.map((row) => `${row.courseId}-${row.profileId}`));
  const recordsToInsert = records.filter((record) => !existingRecordKeys.has(`${record.courseId}-${record.profileId}`));

  if (recordsToInsert.length > 0) {
    const createdRecords = await db.insert(courseCompletionRecord).values(recordsToInsert).returning();
    const issues = createdRecords
      .filter((record) => record.status === 'compliant' || record.status === 'expiring_soon')
      .map((record) => ({
        courseId: record.courseId,
        profileId: record.profileId,
        courseCompletionRecordId: record.id,
        cycleNumber: record.cycleNumber,
        issuedAt: record.completedAt ?? daysFromNow(now, -1),
        expiresAt: record.validUntil ?? daysFromNow(now, 365),
        status: 'valid'
      }));

    if (issues.length > 0) {
      await db.insert(courseCertificateIssue).values(issues);
    }
  }

  const attendanceCount = await seedLiveSessionAttendance(catalog, plans, memberFor, now);
  const checkInCount = await seedLiveCheckInCodes(catalog, personId, now);

  console.log(
    `   ✓ Demo enrollments: ${membersToInsert.length} enrolment(s), ${completionsToInsert.length} lesson completion(s), ${submissionResult.submissions} submission(s) with ${submissionResult.answers} answer(s), ${recordsToInsert.length} compliance record(s), ${attendanceCount} attendance row(s), ${checkInCount} check-in code(s)`
  );
}

function autoExerciseKeys(demoCourse: DemoCourse) {
  const manualTypes = new Set(['TEXTAREA', 'SHORT_ANSWER', 'LINK', 'FILE_UPLOAD']);
  const keys = (demoCourse.existing?.exercises ?? [])
    .filter((existingExercise) => (existingExercise.extraQuestions ?? []).every((item) => !manualTypes.has(item.type)))
    .map((existingExercise) => existingExercise.key);

  for (const section of demoCourse.sections) {
    for (const demoExercise of section.exercises ?? []) {
      if (demoExercise.questions.every((item) => !manualTypes.has(item.type))) keys.push(demoExercise.key);
    }
  }

  return keys;
}

async function seedLiveSessionAttendance(
  catalog: DemoCourse[],
  plans: EnrollmentPlan[],
  memberFor: (demoCourse: DemoCourse, personKey: string) => string,
  now: Date
) {
  const rows: TNewGroupAttendance[] = [];
  for (const demoCourse of catalog) {
    if (demoCourse.type !== 'LIVE_CLASS') continue;

    const attendees = plans.filter((plan) => plan.courseKey === demoCourse.key);
    for (const [sectionIndex, section] of demoCourse.sections.entries()) {
      for (const [lessonIndex, demoLesson] of section.lessons.entries()) {
        const live = demoLesson.live;
        if (!live || live.startsInMinutes + live.durationMinutes > 0) continue;

        const lessonId = demoLessonId(demoCourse, sectionIndex, lessonIndex);
        for (const attendee of attendees) {
          const roll = hashOf(`${lessonId}-${attendee.personKey}`) % 20;
          const status = attendee.personKey.endsWith('tudent')
            ? lessonIndex === 0
              ? 'present'
              : 'late'
            : roll < 14
              ? 'present'
              : roll < 17
                ? 'late'
                : 'absent';
          rows.push({
            courseId: demoCourseId(demoCourse),
            lessonId,
            studentId: memberFor(demoCourse, attendee.personKey),
            status,
            isPresent: status !== 'absent',
            checkedInAt:
              status === 'absent' ? null : minutesFromNow(now, live.startsInMinutes + (status === 'late' ? 14 : 2))
          });
        }
      }
    }
  }

  if (rows.length === 0) return 0;

  const existing = await db
    .select({ lessonId: groupAttendance.lessonId })
    .from(groupAttendance)
    .where(inArray(groupAttendance.lessonId, [...new Set(rows.map((row) => row.lessonId))]));
  const lessonsWithAttendance = new Set(existing.map((row) => row.lessonId));
  const rowsToInsert = rows.filter((row) => !lessonsWithAttendance.has(row.lessonId));

  if (rowsToInsert.length > 0) {
    await db.insert(groupAttendance).values(rowsToInsert);
  }

  return rowsToInsert.length;
}

async function seedLiveCheckInCodes(catalog: DemoCourse[], personId: (key: string) => string, now: Date) {
  const codes = catalog.flatMap((demoCourse) =>
    demoCourse.sections.flatMap((section, sectionIndex) =>
      section.lessons.flatMap((demoLesson, lessonIndex) => {
        const live = demoLesson.live;
        if (!live || live.startsInMinutes > 0 || live.startsInMinutes + live.durationMinutes < 0) return [];

        return [
          {
            lessonId: demoLessonId(demoCourse, sectionIndex, lessonIndex),
            code: 'K7PM4Q',
            expiresAt: minutesFromNow(now, live.startsInMinutes + live.durationMinutes),
            createdByProfileId: personId(demoCourse.instructorKey)
          }
        ];
      })
    )
  );

  if (codes.length === 0) return 0;

  const inserted = await db
    .insert(lessonCheckInCode)
    .values(codes)
    .onConflictDoNothing()
    .returning({ lessonId: lessonCheckInCode.lessonId });

  return inserted.length;
}
