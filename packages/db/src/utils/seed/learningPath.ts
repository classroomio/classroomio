import {
  account,
  and,
  course,
  courseEnrollmentGrant,
  db,
  eq,
  exercise,
  groupmember,
  inArray,
  isNull,
  learningPath,
  learningPathCertificateIssue,
  learningPathCourse,
  learningPathMember,
  learningPathMemberCourse,
  lesson,
  lessonCompletion,
  organizationmember,
  profile,
  submission,
  user
} from '@db/drizzle';
import { getCourseCompletionStatsForProfile } from '@db/queries/learning-path/progress';
import { formatCertificateId } from '@db/queries/learning-path/certificate';
import { seedReactCoursePeopleProgress } from '@db/utils/seed/reactCoursePeopleProgress';

import { ROLE } from '@cio/utils/constants';

import type { TNewGroupmember, TNewProfile } from '@db/types';

interface SeedLearningPathsArgs {
  testOrgId: string;
  adminUserId: string;
  mvcCourseId: string;
  reactCourseId: string;
  pandasCourseId: string;
  existingStudentUserId: string;
  selectedOrganizationId?: string;
}

/** Same credential password hash as the other demo seeds ("123456"). */
const PASSWORD_HASH = '$2a$10$dgxySj.k12gDKhLx7X4x6./J.Nzhz7WQrwh5lkjLKwIwWW4o5GJcW';

// Fixed IDs so re-running the seed updates the same rows.
const PATH_BOOTCAMP_ID = '9a000000-0000-4000-8000-000000000001';
const PATH_DATA_SKILLS_ID = '9a000000-0000-4000-8000-000000000002';
const PATH_DRAFT_ID = '9a000000-0000-4000-8000-000000000003';

const PATH_COURSE_IDS = {
  bootcampMvc: '9a000001-0000-4000-8000-000000000001',
  bootcampReact: '9a000001-0000-4000-8000-000000000002',
  bootcampPandas: '9a000001-0000-4000-8000-000000000003',
  dataSkillsReact: '9a000001-0000-4000-8000-000000000011',
  dataSkillsPandas: '9a000001-0000-4000-8000-000000000012',
  draftMvc: '9a000001-0000-4000-8000-000000000021',
  draftReact: '9a000001-0000-4000-8000-000000000022'
} as const;

// Path learner personas (the React learners in reactCoursePeopleProgress.ts are reused as-is).
const MAYA_PROFILE_ID = '9a000000-9000-4000-8000-000000000001'; // completed the whole bootcamp path
const DANIEL_PROFILE_ID = '9a000000-9000-4000-8000-000000000002'; // finished course 1, started course 2
const LUCIA_PROFILE_ID = '9a000000-9000-4000-8000-000000000003'; // enrolled, never started

const PATH_MEMBER_IDS = {
  bootcampTutor: '9a000002-0000-4000-8000-000000000001',
  bootcampMaya: '9a000002-0000-4000-8000-000000000002',
  bootcampDaniel: '9a000002-0000-4000-8000-000000000003',
  bootcampLucia: '9a000002-0000-4000-8000-000000000004',
  bootcampStudent: '9a000002-0000-4000-8000-000000000005',
  bootcampPendingInvite: '9a000002-0000-4000-8000-000000000006',
  dataSkillsStudent: '9a000002-0000-4000-8000-000000000011'
} as const;

/** Profile IDs of the React learners seeded by reactCoursePeopleProgress.ts. */
const REACT_LEARNER_PROFILE_IDS = [
  '8f000000-9000-4000-8000-000000000001',
  '8f000000-9000-4000-8000-000000000002',
  '8f000000-9000-4000-8000-000000000003',
  '8f000000-9000-4000-8000-000000000004',
  '8f000000-9000-4000-8000-000000000005',
  '8f000000-9000-4000-8000-000000000006',
  '8f000000-9000-4000-8000-000000000007',
  '8f000000-9000-4000-8000-000000000008',
  '8f000000-9000-4000-8000-000000000009'
] as const;

/** Staggered enroll dates for the React learners joining the data-skills path. */
const REACT_LEARNER_ENROLLED_DAYS_AGO = [3, 14, 21, 30, 45, 60, 75, 90, 100];

const REACT_LEARNER_MEMBER_ID_START = 12; // path member ids 9a000002-...0012..0020

const PENDING_INVITE_EMAIL = 'kai.adeyemi@udemy-test.demo';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Lessons per course, in content order (ids match seed/lesson.ts). */
const COURSE_LESSON_IDS: Record<CourseKey, string[]> = {
  mvc: [
    '5c75f4f1-c222-44a9-a8c6-81773ea33872',
    'a99e65b7-1394-4751-ad8d-a5fb670ccb9e',
    '266b3daa-1eb2-401e-9510-1819952b44b7'
  ],
  react: [
    '6f2d8142-0903-425c-8534-f5105b624752',
    '0a39ab2f-9451-4a90-902c-3030bf965637',
    '80b79665-733b-41bf-9853-34fd8ab50496'
  ],
  pandas: [
    '5e5c8221-4c11-4c40-8664-11743bb79579',
    '829da386-8ccd-4c81-b2fb-b9891102c83c',
    '05f03084-3ff1-49e3-aa2a-7a13840cc4b1'
  ]
};

interface PersonaSeed {
  profileId: string;
  fullname: string;
  username: string;
  email: string;
  groupMemberIds: { mvc: string; react: string; pandas: string };
  enrolledDaysAgo: number;
  activityDaysAgo: number | null;
  /** How many lessons/exercises to backfill per course; a full course marks it complete. */
  progress: {
    mvc: { lessonsCompleted: number; exercisesCompleted: number };
    react: { lessonsCompleted: number; exercisesCompleted: number };
    pandas: { lessonsCompleted: number; exercisesCompleted: number };
  };
}

const PERSONAS: PersonaSeed[] = [
  {
    profileId: MAYA_PROFILE_ID,
    fullname: 'Maya Torres',
    username: 'maya.torres',
    email: 'maya.torres@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000001',
      react: '9a000001-1000-4000-8000-000000000002',
      pandas: '9a000001-1000-4000-8000-000000000003'
    },
    enrolledDaysAgo: 120,
    activityDaysAgo: 30,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 3, exercisesCompleted: 3 },
      pandas: { lessonsCompleted: 3, exercisesCompleted: 3 }
    }
  },
  {
    profileId: DANIEL_PROFILE_ID,
    fullname: 'Daniel Osei',
    username: 'daniel.osei',
    email: 'daniel.osei@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000004',
      react: '9a000001-1000-4000-8000-000000000005',
      pandas: '9a000001-1000-4000-8000-000000000006'
    },
    enrolledDaysAgo: 45,
    activityDaysAgo: 2,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 1, exercisesCompleted: 0 },
      pandas: { lessonsCompleted: 0, exercisesCompleted: 0 }
    }
  },
  {
    profileId: LUCIA_PROFILE_ID,
    fullname: 'Lucia Fernandez',
    username: 'lucia.fernandez',
    email: 'lucia.fernandez@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000007',
      react: '9a000001-1000-4000-8000-000000000008',
      pandas: '9a000001-1000-4000-8000-000000000009'
    },
    enrolledDaysAgo: 5,
    activityDaysAgo: null,
    progress: {
      mvc: { lessonsCompleted: 0, exercisesCompleted: 0 },
      react: { lessonsCompleted: 0, exercisesCompleted: 0 },
      pandas: { lessonsCompleted: 0, exercisesCompleted: 0 }
    }
  }
];

interface PathSeed {
  id: string;
  publicId: string;
  slug: string;
  name: string;
  description: string;
  coverImage: string | null;
  isPublished: boolean;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  estimatedDurationMinutes: number;
  sequentialUnlock: boolean;
  courseOrderSetDaysAgo: number | null;
  certificateTitle: string | null;
  certificateIssuer: string | null;
  /** Placeholder format for issued certificate ids; mirrors `certificateDesign.idFormat`. */
  certificateIdFormat: string | null;
  landingPage: PathLandingPage;
}

type PathLandingPage = NonNullable<typeof learningPath.$inferInsert.landingPage>;

const BOOTCAMP_LANDING_PAGE: PathLandingPage = {
  headline: 'Become a Full-Stack Web Developer',
  subheadline: 'Go from MVC fundamentals to React apps and data-driven Python in one guided path.',
  visitorAccess: 'syllabus',
  outcomes: [
    'Architect maintainable apps with the MVC pattern',
    'Build interactive UIs with modern React',
    'Analyze and visualize data with Python and Pandas'
  ],
  skills: ['MVC', 'React', 'State Management', 'Python', 'Pandas', 'Data Visualization'],
  showInstructors: true,
  showTestimonials: true,
  testimonials: [
    {
      id: 'testimonial-1',
      name: 'Chidi O.',
      role: 'Junior Developer',
      avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=chidi.o',
      quote: 'The path took me from zero MVC knowledge to shipping a React dashboard in three months.'
    },
    {
      id: 'testimonial-2',
      name: 'Sanne V.',
      role: 'Data Analyst',
      avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=sanne.v',
      quote: 'Loved the sequential structure — every course prepared me for the next one.'
    }
  ],
  showFaqs: true,
  faqs: [
    {
      id: 'faq-1',
      question: 'Do I need prior experience?',
      answer: 'No — the path starts with MVC fundamentals and builds up gradually.'
    },
    {
      id: 'faq-2',
      question: 'Can I skip ahead?',
      answer: 'Courses unlock in order so each one builds on the last, but you can revisit anything you finished.'
    }
  ],
  showRating: true,
  rating: { average: 4.8, count: 132 }
};

const DATA_SKILLS_LANDING_PAGE: PathLandingPage = {
  headline: 'Frontend & Data Science Skills',
  subheadline: 'Pair modern React development with practical Python data analysis.',
  visitorAccess: 'preview',
  outcomes: ['Ship React interfaces users love', 'Wrangle datasets with Pandas'],
  skills: ['React', 'Python', 'Pandas'],
  showInstructors: true,
  showTestimonials: false,
  showFaqs: true,
  faqs: [
    {
      id: 'faq-1',
      question: 'Is the path sequential?',
      answer: 'No — take the courses in whatever order fits your goals.'
    }
  ],
  showRating: true,
  rating: { average: 4.6, count: 54 }
};

const PATH_SEEDS: PathSeed[] = [
  {
    id: PATH_BOOTCAMP_ID,
    publicId: 'Bt7Kq2mX',
    slug: 'full-stack-developer-bootcamp',
    name: 'Full-Stack Developer Bootcamp',
    description:
      'A guided, sequential learning path that takes learners from MVC architecture fundamentals through modern React development to data analysis with Python and Pandas. Finish every course to earn the path certificate.',
    coverImage:
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    isPublished: true,
    difficulty: 'INTERMEDIATE',
    estimatedDurationMinutes: 720,
    sequentialUnlock: true,
    courseOrderSetDaysAgo: 130,
    certificateTitle: 'Full-Stack Developer Bootcamp Certificate',
    certificateIssuer: 'Udemy Test Academy',
    certificateIdFormat: 'LP-{year}-{seq}',
    landingPage: BOOTCAMP_LANDING_PAGE
  },
  {
    id: PATH_DATA_SKILLS_ID,
    publicId: 'Da9Fw4sR',
    slug: 'frontend-data-science',
    name: 'Frontend & Data Science Skills',
    description:
      'A flexible, self-paced path combining modern React development with hands-on Python data analysis. Courses are unlocked from day one, so learners can start wherever it suits them.',
    coverImage:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    isPublished: true,
    difficulty: 'INTERMEDIATE',
    estimatedDurationMinutes: 360,
    sequentialUnlock: false,
    courseOrderSetDaysAgo: 40,
    certificateTitle: 'Frontend & Data Science Skills Certificate',
    certificateIssuer: 'Udemy Test Academy',
    certificateIdFormat: 'LP-{year}-{seq}',
    landingPage: DATA_SKILLS_LANDING_PAGE
  },
  {
    id: PATH_DRAFT_ID,
    publicId: 'Fr3Nv6hY',
    slug: 'frontend-foundations',
    name: 'Frontend Foundations',
    description:
      'A work-in-progress path covering MVC architecture and modern React. Still a draft — it is not visible to learners until it is published.',
    coverImage: null,
    isPublished: false,
    difficulty: 'BEGINNER',
    estimatedDurationMinutes: 240,
    sequentialUnlock: true,
    courseOrderSetDaysAgo: null,
    certificateTitle: null,
    certificateIssuer: null,
    certificateIdFormat: null,
    landingPage: {}
  }
];

interface PathSeedCourse {
  id: string;
  learningPathId: string;
  courseId: string;
  order: number;
  outcomes: string[];
}

type CourseKey = 'mvc' | 'react' | 'pandas';

function pathCourseRowsFor(pathSeed: PathSeed, courseIdsByKey: Record<CourseKey, string>): PathSeedCourse[] {
  const plans: Array<{ id: string; courseKey: CourseKey; outcomes: string[] }> = [];

  if (pathSeed.id === PATH_BOOTCAMP_ID) {
    plans.push(
      { id: PATH_COURSE_IDS.bootcampMvc, courseKey: 'mvc', outcomes: ['Structure apps with Model-View-Controller'] },
      { id: PATH_COURSE_IDS.bootcampReact, courseKey: 'react', outcomes: ['Build interactive React UIs'] },
      { id: PATH_COURSE_IDS.bootcampPandas, courseKey: 'pandas', outcomes: ['Analyze data with Python and Pandas'] }
    );
  } else if (pathSeed.id === PATH_DATA_SKILLS_ID) {
    plans.push(
      { id: PATH_COURSE_IDS.dataSkillsReact, courseKey: 'react', outcomes: ['Ship modern React interfaces'] },
      { id: PATH_COURSE_IDS.dataSkillsPandas, courseKey: 'pandas', outcomes: ['Explore datasets with Pandas'] }
    );
  } else {
    plans.push(
      { id: PATH_COURSE_IDS.draftMvc, courseKey: 'mvc', outcomes: ['Understand MVC basics'] },
      { id: PATH_COURSE_IDS.draftReact, courseKey: 'react', outcomes: ['Build your first React components'] }
    );
  }

  return plans.map((plan, index) => ({
    id: plan.id,
    learningPathId: pathSeed.id,
    courseId: courseIdsByKey[plan.courseKey],
    order: index + 1,
    outcomes: plan.outcomes
  }));
}

/**
 * Reads back the persisted `learning_path_course` rows for a seeded path so
 * progress caches and enrollment grants always point at real rows, even when the
 * path's course list was created through the app with different row ids.
 */
async function readBackPathCourses(
  pathSeed: PathSeed,
  courseIdsByKey: Record<CourseKey, string>
): Promise<PathSeedCourse[]> {
  const plannedCourses = pathCourseRowsFor(pathSeed, courseIdsByKey);
  const plannedOutcomesByCourseId = new Map(plannedCourses.map((planned) => [planned.courseId, planned.outcomes]));
  const persistedCourses = await db
    .select({
      id: learningPathCourse.id,
      courseId: learningPathCourse.courseId,
      order: learningPathCourse.order
    })
    .from(learningPathCourse)
    .where(and(eq(learningPathCourse.learningPathId, pathSeed.id), isNull(learningPathCourse.removedAt)))
    .orderBy(learningPathCourse.order);

  return persistedCourses.map((persistedCourse) => {
    const outcomes = plannedOutcomesByCourseId.get(persistedCourse.courseId) ?? [];

    return {
      id: persistedCourse.id,
      learningPathId: pathSeed.id,
      courseId: persistedCourse.courseId,
      order: persistedCourse.order,
      outcomes
    };
  });
}

function buildPathInsertValues(pathSeed: PathSeed, testOrgId: string, now: Date) {
  const values = {
    id: pathSeed.id,
    publicId: pathSeed.publicId,
    organizationId: testOrgId,
    name: pathSeed.name,
    slug: pathSeed.slug,
    description: pathSeed.description,
    coverImage: pathSeed.coverImage,
    isPublished: pathSeed.isPublished,
    difficulty: pathSeed.difficulty,
    estimatedDurationMinutes: pathSeed.estimatedDurationMinutes,
    cost: 0,
    currency: 'USD',
    showSavings: false,
    sequentialUnlock: pathSeed.sequentialUnlock,
    selfEnrollment: true,
    autoEnroll: true,
    certificateEnabled: pathSeed.certificateTitle !== null,
    certificateTitle: pathSeed.certificateTitle,
    certificateIssuer: pathSeed.certificateIssuer,
    certificateDesign: pathSeed.certificateTitle
      ? {
          templateId: 'classique' as const,
          accentColor: '#6366f1',
          subtitle: pathSeed.name,
          signatories: [{ name: 'Admin Test', role: 'Lead Instructor', enabled: true }],
          idFormat: pathSeed.certificateIdFormat ?? undefined
        }
      : {},
    landingPage: pathSeed.landingPage,
    courseOrderSetAt: pathSeed.courseOrderSetDaysAgo === null ? null : isoDaysAgo(now, pathSeed.courseOrderSetDaysAgo),
    createdByProfileId: null,
    createdAt: isoDaysAgo(now, pathSeed.courseOrderSetDaysAgo ?? 60),
    updatedAt: isoDaysAgo(now, Math.min(pathSeed.courseOrderSetDaysAgo ?? 60, 14))
  };

  return values;
}

/** True when the demo course content (lessons/exercises) required by the path cache is present. */
async function demoCourseContentExists(courseIds: string[]): Promise<boolean> {
  const lessonRows = await db.select({ id: lesson.id }).from(lesson).where(inArray(lesson.courseId, courseIds));
  const exerciseRows = await db.select({ id: exercise.id }).from(exercise).where(inArray(exercise.courseId, courseIds));

  return lessonRows.length > 0 && exerciseRows.length > 0;
}

function isoDaysAgo(now: Date, days: number): string {
  return new Date(now.getTime() - days * DAY_MS).toISOString();
}

/**
 * Mirrors `unlockedCourses` in apps/api/src/services/learning-path/unlock.ts:
 * with sequential unlock, courses are unlocked up to (and including) the first
 * incomplete course.
 */
function computeUnlockedCourseIds(
  orderedCourseIds: string[],
  completeByCourseId: Map<string, boolean>,
  sequentialUnlock: boolean
): Set<string> {
  if (!sequentialUnlock) {
    return new Set(orderedCourseIds);
  }

  const unlocked = new Set<string>();

  for (const courseId of orderedCourseIds) {
    unlocked.add(courseId);

    if (!completeByCourseId.get(courseId)) {
      break;
    }
  }

  return unlocked;
}

/** Exercises per course (ids match seed/exercise.ts). */
const COURSE_EXERCISE_IDS: Record<CourseKey, string[]> = {
  mvc: [
    'e2ea9fb8-6448-4f6c-a1d5-02c2b12cf862',
    '8b6084b0-a936-411d-9408-a1289aeed068',
    '43f43374-7df0-4e02-b839-56403f71473a'
  ],
  react: [
    'e78bfd24-8ac3-43e9-a117-a2f9d00f74b1',
    '43ead5d7-af88-47cf-8f86-99124f5eb0cd',
    'b0770deb-a8a0-4efe-9d28-8bf1298c04b2'
  ],
  pandas: [
    '6f1063ed-3791-43fe-81e9-ad3b007834fa',
    'bd6e81c7-3d28-4037-acf0-a3028c583771',
    'd8cd1cf7-1951-46b3-ad1c-41e415185bc1'
  ]
};

/** Creates user/profile/account/org-member/group-member rows for the path personas. */
async function seedPersonaAccounts(persona: PersonaSeed, testOrgId: string, now: Date) {
  const existingUsers = await db.select({ id: user.id }).from(user).where(eq(user.id, persona.profileId));

  if (existingUsers.length === 0) {
    await db.insert(user).values({
      id: persona.profileId,
      name: persona.fullname,
      email: persona.email,
      emailVerified: true,
      image: null,
      role: null,
      banned: false,
      isAnonymous: false
    });
  }

  const existingProfiles = await db.select({ id: profile.id }).from(profile).where(eq(profile.id, persona.profileId));

  if (existingProfiles.length === 0) {
    const newProfile: TNewProfile = {
      id: persona.profileId,
      fullname: persona.fullname,
      username: persona.username,
      email: persona.email,
      avatarUrl: `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(persona.username)}`,
      canAddCourse: false,
      isEmailVerified: true
    };

    await db.insert(profile).values(newProfile);
  }

  const existingAccounts = await db
    .select({ userId: account.userId })
    .from(account)
    .where(and(eq(account.userId, persona.profileId), eq(account.providerId, 'credential')));

  if (existingAccounts.length === 0) {
    await db.insert(account).values({
      userId: persona.profileId,
      providerId: 'credential',
      accountId: persona.profileId,
      password: PASSWORD_HASH
    });
  }

  const existingOrgMembers = await db
    .select({ profileId: organizationmember.profileId })
    .from(organizationmember)
    .where(and(eq(organizationmember.organizationId, testOrgId), eq(organizationmember.profileId, persona.profileId)));

  if (existingOrgMembers.length === 0) {
    await db.insert(organizationmember).values({
      organizationId: testOrgId,
      roleId: ROLE.STUDENT,
      profileId: persona.profileId,
      verified: false
    });
  }

  const courseKeys: CourseKey[] = ['mvc', 'react', 'pandas'];
  const groupMemberIds = persona.groupMemberIds;

  for (const courseKey of courseKeys) {
    const groupMemberId = groupMemberIds[courseKey];
    const existingGroupMembers = await db
      .select({ id: groupmember.id })
      .from(groupmember)
      .where(eq(groupmember.id, groupMemberId));

    if (existingGroupMembers.length === 0) {
      const newGroupMember: TNewGroupmember = {
        id: groupMemberId,
        groupId: courseGroupIdsByKey[courseKey],
        roleId: ROLE.STUDENT,
        profileId: persona.profileId,
        createdAt: isoDaysAgo(now, persona.enrolledDaysAgo)
      };

      await db.insert(groupmember).values(newGroupMember);
    }
  }
}

/** Backfills lesson completions and exercise submissions for a persona's progress plan. */
async function seedPersonaProgress(persona: PersonaSeed, now: Date) {
  const lessonCompletionsToInsert: Array<{
    lessonId: string;
    profileId: string;
    isComplete: boolean;
    createdAt: string;
  }> = [];
  const submissionsToInsert: Array<{
    exerciseId: string;
    submittedBy: string;
    courseId: string;
    gradingState: string;
    overallStatus: string;
    createdAt: string;
  }> = [];

  for (const courseKey of ['mvc', 'react', 'pandas'] as CourseKey[]) {
    const plan = persona.progress[courseKey];

    for (const lessonId of COURSE_LESSON_IDS[courseKey].slice(0, plan.lessonsCompleted)) {
      lessonCompletionsToInsert.push({
        lessonId,
        profileId: persona.profileId,
        isComplete: true,
        createdAt: isoDaysAgo(now, Math.max(persona.activityDaysAgo ?? persona.enrolledDaysAgo, 1))
      });
    }

    for (const exerciseId of COURSE_EXERCISE_IDS[courseKey].slice(0, plan.exercisesCompleted)) {
      submissionsToInsert.push({
        exerciseId,
        submittedBy: persona.groupMemberIds[courseKey],
        courseId: courseIdsByKey[courseKey],
        gradingState: 'completed',
        overallStatus: 'completed',
        createdAt: isoDaysAgo(now, Math.max(persona.activityDaysAgo ?? persona.enrolledDaysAgo, 1))
      });
    }
  }

  if (lessonCompletionsToInsert.length > 0) {
    await db.insert(lessonCompletion).values(lessonCompletionsToInsert).onConflictDoNothing();
  }

  if (submissionsToInsert.length > 0) {
    const existingSubmissions = await db
      .select({ exerciseId: submission.exerciseId, submittedBy: submission.submittedBy })
      .from(submission)
      .where(eq(submission.courseId, submissionsToInsert[0].courseId));

    const existingSubmissionKeys = new Set(existingSubmissions.map((row) => `${row.submittedBy}-${row.exerciseId}`));
    const newSubmissions = submissionsToInsert.filter(
      (row) => !existingSubmissionKeys.has(`${row.submittedBy}-${row.exerciseId}`)
    );

    if (newSubmissions.length > 0) {
      await db.insert(submission).values(newSubmissions);
    }
  }
}

// Populated at the start of seedLearningPaths from the seeded udemy-test courses.
let courseIdsByKey: Record<CourseKey, string>;
let courseGroupIdsByKey: Record<CourseKey, string>;

interface PathMemberSeed {
  id: string;
  profileId: string | null;
  email: string | null;
  roleId: number;
  enrolledDaysAgo: number;
  /** Most recent activity; null for members who never engaged. */
  activityDaysAgo: number | null;
  /** Set only when the member finished every course in the path. */
  completedDaysAgo: number | null;
}

interface MemberCourseCachePlan {
  learningPathMemberId: string;
  learningPathCourseId: string;
  status: 'LOCKED' | 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  progressPercent: number;
  lessonsCompleted: number;
  lessonsTotal: number;
  exercisesCompleted: number;
  exercisesTotal: number;
  unlockedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

interface MemberRollup {
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  progressPercent: number;
  completedCourseCount: number;
  currentCourseId: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

/**
 * Computes the `learning_path_member_course` cache rows and the member rollup
 * from the truth tables (lesson_completion / submission), mirroring
 * `syncLearningPathProgressForMember` and `evaluatePathCompletion` in the API.
 */
async function buildMemberProgress(
  pathSeed: PathSeed,
  pathCourses: PathSeedCourse[],
  member: PathMemberSeed,
  now: Date
): Promise<{ cachePlans: MemberCourseCachePlan[]; rollup: MemberRollup }> {
  const orderedCourseIds = pathCourses.map((pathCourse) => pathCourse.courseId);
  const statsByCourseId = new Map<string, Awaited<ReturnType<typeof getCourseCompletionStatsForProfile>>>();

  for (const courseId of orderedCourseIds) {
    statsByCourseId.set(courseId, await getCourseCompletionStatsForProfile(courseId, member.profileId!));
  }

  const completeByCourseId = new Map<string, boolean>();
  for (const [courseId, stats] of statsByCourseId) {
    completeByCourseId.set(courseId, stats.isComplete);
  }

  const unlockedCourseIds = computeUnlockedCourseIds(orderedCourseIds, completeByCourseId, pathSeed.sequentialUnlock);

  const enrolledAtIso = isoDaysAgo(now, member.enrolledDaysAgo);
  const activityAtIso = member.activityDaysAgo === null ? null : isoDaysAgo(now, member.activityDaysAgo);

  const cachePlans: MemberCourseCachePlan[] = [];
  let completedCourseCount = 0;
  let firstStartedAt: string | null = null;

  for (const pathCourse of pathCourses) {
    const stats = statsByCourseId.get(pathCourse.courseId)!;
    const totalItems = stats.totalLessons + stats.totalExercises;
    const completedItems = stats.completedLessons + stats.completedExercises;
    const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 100;
    const isUnlocked = unlockedCourseIds.has(pathCourse.courseId);

    const status: MemberCourseCachePlan['status'] = stats.isComplete
      ? 'COMPLETED'
      : progressPercent > 0
        ? 'IN_PROGRESS'
        : isUnlocked
          ? 'NOT_STARTED'
          : 'LOCKED';

    const startedAt = progressPercent > 0 ? (activityAtIso ?? enrolledAtIso) : null;
    const completedAt = stats.isComplete ? (activityAtIso ?? enrolledAtIso) : null;

    if (startedAt && (!firstStartedAt || startedAt < firstStartedAt)) {
      firstStartedAt = startedAt;
    }

    if (stats.isComplete) {
      completedCourseCount++;
    }

    cachePlans.push({
      learningPathMemberId: member.id,
      learningPathCourseId: pathCourse.id,
      status,
      progressPercent,
      lessonsCompleted: stats.completedLessons,
      lessonsTotal: stats.totalLessons,
      exercisesCompleted: stats.completedExercises,
      exercisesTotal: stats.totalExercises,
      unlockedAt: isUnlocked ? isoDaysAgo(now, Math.max(member.enrolledDaysAgo - 1, 0)) : null,
      startedAt,
      completedAt
    });
  }

  const totalCourses = pathCourses.length;
  const isPathComplete = completedCourseCount === totalCourses;
  const pathStatus: MemberRollup['status'] = isPathComplete
    ? 'COMPLETED'
    : completedCourseCount > 0
      ? 'IN_PROGRESS'
      : 'NOT_STARTED';

  const firstIncompleteCourse = pathCourses.find((pathCourse) => !completeByCourseId.get(pathCourse.courseId));
  const currentCourseId = firstIncompleteCourse
    ? firstIncompleteCourse.courseId
    : totalCourses > 0
      ? pathCourses[totalCourses - 1].courseId
      : null;

  return {
    cachePlans,
    rollup: {
      status: pathStatus,
      progressPercent: totalCourses > 0 ? Math.round((completedCourseCount / totalCourses) * 100) : 0,
      completedCourseCount,
      currentCourseId,
      startedAt: firstStartedAt,
      completedAt: isPathComplete ? (activityAtIso ?? enrolledAtIso) : null
    }
  };
}

/** Resolves the groupmember id for a (group, profile) pair, inserting the row when missing. */
async function ensureGroupMember(
  groupId: string,
  profileId: string,
  groupMemberId: string,
  now: Date
): Promise<string> {
  const existingMembers = await db
    .select({ id: groupmember.id })
    .from(groupmember)
    .where(and(eq(groupmember.groupId, groupId), eq(groupmember.profileId, profileId)))
    .limit(1);

  const existingGroupMember = existingMembers[0];

  if (existingGroupMember) {
    return existingGroupMember.id;
  }

  const newGroupMember: TNewGroupmember = {
    id: groupMemberId,
    groupId,
    roleId: ROLE.STUDENT,
    profileId,
    createdAt: isoDaysAgo(now, 1)
  };

  await db.insert(groupmember).values(newGroupMember);

  return groupMemberId;
}

/**
 * Seeds learning-path demo data for the udemy-test organization:
 * two published paths (sequential + non-sequential), a draft path, members with
 * truth-backed progress caches, LEARNING_PATH enrollment grants, and a path
 * certificate for the member who finished the sequential path.
 */
export async function seedLearningPaths({
  testOrgId,
  adminUserId,
  mvcCourseId,
  reactCourseId,
  pandasCourseId,
  existingStudentUserId,
  selectedOrganizationId
}: SeedLearningPathsArgs) {
  if (selectedOrganizationId && selectedOrganizationId !== testOrgId) {
    console.log('⏭️  Skipping learning paths: demo paths live in the udemy-test organization.');

    return;
  }

  const now = new Date();
  const courseRows = await db
    .select()
    .from(course)
    .where(inArray(course.id, [mvcCourseId, reactCourseId, pandasCourseId]));

  if (courseRows.length < 3) {
    console.log('⏭️  Skipping learning paths: seed the udemy-test courses first (pnpm seed --courses).');

    return;
  }

  courseIdsByKey = { mvc: mvcCourseId, react: reactCourseId, pandas: pandasCourseId };
  const groupIdsByCourseKey = new Map<CourseKey, string>();

  for (const courseRow of courseRows) {
    const courseKey = courseRow.id === mvcCourseId ? 'mvc' : courseRow.id === reactCourseId ? 'react' : 'pandas';

    if (courseRow.groupId) {
      groupIdsByCourseKey.set(courseKey, courseRow.groupId);
    }
  }

  const missingGroups = (['mvc', 'react', 'pandas'] as CourseKey[]).filter(
    (courseKey) => !groupIdsByCourseKey.has(courseKey)
  );

  if (missingGroups.length > 0) {
    console.log(`⏭️  Skipping learning paths: courses are missing groups (${missingGroups.join(', ')}).`);

    return;
  }

  courseGroupIdsByKey = {
    mvc: groupIdsByCourseKey.get('mvc')!,
    react: groupIdsByCourseKey.get('react')!,
    pandas: groupIdsByCourseKey.get('pandas')!
  };

  if (!(await demoCourseContentExists([mvcCourseId, reactCourseId, pandasCourseId]))) {
    console.log('⏭️  Skipping learning paths: seed lessons and exercises first (pnpm seed --lessons --exercises).');

    return;
  }

  // The data-skills path reuses the React course learners; create them when the
  // react-people-progress seed has not run yet, so this seed works standalone.
  const reactLearnerProfileRows = await db
    .select({ id: profile.id })
    .from(profile)
    .where(inArray(profile.id, [...REACT_LEARNER_PROFILE_IDS]));
  const missingReactLearnerCount = REACT_LEARNER_PROFILE_IDS.length - reactLearnerProfileRows.length;

  if (missingReactLearnerCount > 0) {
    console.log(`   → Seeding ${missingReactLearnerCount} React course learner(s) reused by the data-skills path...`);

    await seedReactCoursePeopleProgress({
      testOrgId,
      reactGroupId: courseGroupIdsByKey.react,
      reactCourseId,
      existingStudentUserId
    });
  }

  // 1. Paths and their course lists
  await db
    .insert(learningPath)
    .values(PATH_SEEDS.map((pathSeed) => buildPathInsertValues(pathSeed, testOrgId, now)))
    .onConflictDoNothing();

  for (const pathSeed of PATH_SEEDS) {
    await db.insert(learningPathCourse).values(pathCourseRowsFor(pathSeed, courseIdsByKey)).onConflictDoNothing();
  }

  const pathCoursesByPathId = new Map<string, PathSeedCourse[]>();

  for (const pathSeed of PATH_SEEDS) {
    pathCoursesByPathId.set(pathSeed.id, await readBackPathCourses(pathSeed, courseIdsByKey));
  }

  console.log(`   ✓ Inserted ${PATH_SEEDS.length} learning path(s) with course lists`);

  // 2. Path-gate the entry course of the sequential path
  await db
    .update(course)
    .set({ requiresLearningPath: true })
    .where(and(eq(course.id, mvcCourseId), eq(course.requiresLearningPath, false)));

  // 3. Persona accounts and their progress truth data
  for (const persona of PERSONAS) {
    await seedPersonaAccounts(persona, testOrgId, now);
    await seedPersonaProgress(persona, now);
  }

  console.log(`   ✓ Seeded ${PERSONAS.length} path learner persona(s) with progress`);

  // 4. Path members, truth-backed progress caches, and member rollups
  const bootcampSeed = PATH_SEEDS[0];
  const dataSkillsSeed = PATH_SEEDS[1];
  const bootcampCourses = pathCoursesByPathId.get(bootcampSeed.id) ?? [];
  const dataSkillsCourses = pathCoursesByPathId.get(dataSkillsSeed.id) ?? [];

  const bootcampMembers: PathMemberSeed[] = [
    {
      id: PATH_MEMBER_IDS.bootcampTutor,
      profileId: adminUserId,
      email: null,
      roleId: ROLE.TUTOR,
      enrolledDaysAgo: 130,
      activityDaysAgo: 1,
      completedDaysAgo: null
    },
    ...PERSONAS.map((persona) => ({
      id:
        persona.profileId === MAYA_PROFILE_ID
          ? PATH_MEMBER_IDS.bootcampMaya
          : persona.profileId === DANIEL_PROFILE_ID
            ? PATH_MEMBER_IDS.bootcampDaniel
            : PATH_MEMBER_IDS.bootcampLucia,
      profileId: persona.profileId,
      email: null,
      roleId: ROLE.STUDENT,
      enrolledDaysAgo: persona.enrolledDaysAgo,
      activityDaysAgo: persona.activityDaysAgo,
      completedDaysAgo: persona.profileId === MAYA_PROFILE_ID ? 30 : null
    })),
    {
      id: PATH_MEMBER_IDS.bootcampStudent,
      profileId: existingStudentUserId,
      email: null,
      roleId: ROLE.STUDENT,
      enrolledDaysAgo: 50,
      activityDaysAgo: 4,
      completedDaysAgo: null
    },
    {
      id: PATH_MEMBER_IDS.bootcampPendingInvite,
      profileId: null,
      email: PENDING_INVITE_EMAIL,
      roleId: ROLE.STUDENT,
      enrolledDaysAgo: 3,
      activityDaysAgo: null,
      completedDaysAgo: null
    }
  ];

  const dataSkillsMembers: PathMemberSeed[] = [
    {
      id: PATH_MEMBER_IDS.dataSkillsStudent,
      profileId: existingStudentUserId,
      email: null,
      roleId: ROLE.STUDENT,
      enrolledDaysAgo: 35,
      activityDaysAgo: 4,
      completedDaysAgo: null
    },
    ...REACT_LEARNER_PROFILE_IDS.map((learnerProfileId, index) => ({
      id: `9a000002-0000-4000-8000-0000000000${REACT_LEARNER_MEMBER_ID_START + index}`,
      profileId: learnerProfileId,
      email: null,
      roleId: ROLE.STUDENT,
      enrolledDaysAgo: REACT_LEARNER_ENROLLED_DAYS_AGO[index],
      activityDaysAgo: Math.max(REACT_LEARNER_ENROLLED_DAYS_AGO[index] - 2, 0),
      completedDaysAgo: null
    }))
  ];

  const existingPathMembers = await db
    .select({
      id: learningPathMember.id,
      learningPathId: learningPathMember.learningPathId,
      profileId: learningPathMember.profileId,
      email: learningPathMember.email
    })
    .from(learningPathMember)
    .where(inArray(learningPathMember.learningPathId, [bootcampSeed.id, dataSkillsSeed.id]));

  const existingMemberIdByKey = new Map<string, string>();

  for (const existingMember of existingPathMembers) {
    const memberKey = existingMember.profileId
      ? `${existingMember.learningPathId}-${existingMember.profileId}`
      : `${existingMember.learningPathId}-email:${existingMember.email}`;

    existingMemberIdByKey.set(memberKey, existingMember.id);
  }

  for (const [pathSeed, members] of [
    [bootcampSeed, bootcampMembers],
    [dataSkillsSeed, dataSkillsMembers]
  ] as const) {
    for (const member of members) {
      const memberKey = member.profileId
        ? `${pathSeed.id}-${member.profileId}`
        : `${pathSeed.id}-email:${member.email}`;
      const existingMemberId = existingMemberIdByKey.get(memberKey);

      if (existingMemberId) {
        // Reuse the row that is already there (fixed ids differ only on a hand-created membership).
        member.id = existingMemberId;
        continue;
      }

      await db.insert(learningPathMember).values({
        id: member.id,
        learningPathId: pathSeed.id,
        profileId: member.profileId,
        email: member.email,
        roleId: member.roleId,
        enrolledAt: isoDaysAgo(now, member.enrolledDaysAgo),
        status: 'NOT_STARTED'
      });
    }

    for (const member of members) {
      if (!member.profileId) {
        continue;
      }

      const pathCourses = pathCoursesByPathId.get(pathSeed.id) ?? [];

      const { cachePlans, rollup } = await buildMemberProgress(pathSeed, pathCourses, member, now);

      await db
        .update(learningPathMember)
        .set({
          status: rollup.status,
          progressPercent: rollup.progressPercent,
          completedCourseCount: rollup.completedCourseCount,
          currentCourseId: rollup.currentCourseId,
          startedAt: rollup.startedAt,
          completedAt: rollup.completedAt,
          lastActivityAt: member.activityDaysAgo === null ? null : isoDaysAgo(now, member.activityDaysAgo)
        })
        .where(eq(learningPathMember.id, member.id));

      for (const cachePlan of cachePlans) {
        await db
          .insert(learningPathMemberCourse)
          .values(cachePlan)
          .onConflictDoUpdate({
            target: [learningPathMemberCourse.learningPathMemberId, learningPathMemberCourse.learningPathCourseId],
            set: {
              status: cachePlan.status,
              progressPercent: cachePlan.progressPercent,
              lessonsCompleted: cachePlan.lessonsCompleted,
              lessonsTotal: cachePlan.lessonsTotal,
              exercisesCompleted: cachePlan.exercisesCompleted,
              exercisesTotal: cachePlan.exercisesTotal,
              unlockedAt: cachePlan.unlockedAt,
              startedAt: cachePlan.startedAt,
              completedAt: cachePlan.completedAt,
              updatedAt: now.toISOString()
            }
          });
      }

      if (rollup.status === 'COMPLETED' && pathSeed.certificateTitle) {
        // Same generator the API uses on completion, so ids match what the app would issue.
        const issuedAtDate = new Date(isoDaysAgo(now, member.completedDaysAgo ?? 0));
        const certificateId = formatCertificateId(pathSeed.certificateIdFormat ?? undefined, member.id, issuedAtDate);

        await db
          .insert(learningPathCertificateIssue)
          .values({
            learningPathId: pathSeed.id,
            learningPathMemberId: member.id,
            profileId: member.profileId,
            certificateId,
            title: pathSeed.certificateTitle,
            issuer: pathSeed.certificateIssuer,
            issuedAt: issuedAtDate.toISOString(),
            status: 'valid'
          })
          .onConflictDoNothing();
      }
    }
  }

  console.log(`   ✓ Seeded ${bootcampMembers.length + dataSkillsMembers.length} path member(s) with progress caches`);

  // 5. Auto-enroll group memberships + LEARNING_PATH enrollment grants
  const existingStudentMvcGroupMemberId = '9a000001-1000-4000-8000-000000000010';
  const desiredGroupMembers: Array<{ groupId: string; profileId: string; fallbackId: string }> = [
    {
      groupId: courseGroupIdsByKey.mvc,
      profileId: existingStudentUserId,
      fallbackId: existingStudentMvcGroupMemberId
    },
    ...REACT_LEARNER_PROFILE_IDS.map((learnerProfileId, index) => ({
      groupId: courseGroupIdsByKey.pandas,
      profileId: learnerProfileId,
      fallbackId: `9a000001-1000-4000-8000-0000000000${41 + index}`
    }))
  ];

  for (const desiredGroupMember of desiredGroupMembers) {
    await ensureGroupMember(
      desiredGroupMember.groupId,
      desiredGroupMember.profileId,
      desiredGroupMember.fallbackId,
      now
    );
  }

  const courseKeyByCourseId = new Map<string, CourseKey>(
    Object.entries(courseIdsByKey).map(([courseKey, courseId]) => [courseId, courseKey as CourseKey])
  );
  const groupMemberIdByGroupAndProfile = new Map<string, string>();
  const allCourseGroupMembers = await db
    .select({ id: groupmember.id, groupId: groupmember.groupId, profileId: groupmember.profileId })
    .from(groupmember)
    .where(inArray(groupmember.groupId, Object.values(courseGroupIdsByKey)));

  for (const groupMemberRow of allCourseGroupMembers) {
    if (groupMemberRow.profileId) {
      groupMemberIdByGroupAndProfile.set(`${groupMemberRow.groupId}-${groupMemberRow.profileId}`, groupMemberRow.id);
    }
  }

  const memberedPathPlans = [
    { pathSeed: bootcampSeed, members: bootcampMembers, courses: bootcampCourses },
    { pathSeed: dataSkillsSeed, members: dataSkillsMembers, courses: dataSkillsCourses }
  ];

  let grantCount = 0;

  for (const { pathSeed, members, courses } of memberedPathPlans) {
    for (const member of members) {
      if (!member.profileId) {
        continue;
      }

      for (const pathCourse of courses) {
        const courseKey = courseKeyByCourseId.get(pathCourse.courseId);

        if (!courseKey) {
          continue;
        }

        const groupId = courseGroupIdsByKey[courseKey];
        const groupMemberId = groupMemberIdByGroupAndProfile.get(`${groupId}-${member.profileId}`);

        if (!groupMemberId) {
          continue;
        }

        const insertedGrants = await db
          .insert(courseEnrollmentGrant)
          .values({
            groupmemberId: groupMemberId,
            courseId: pathCourse.courseId,
            profileId: member.profileId,
            source: 'LEARNING_PATH',
            learningPathId: pathSeed.id,
            grantedByProfileId: adminUserId
          })
          .onConflictDoNothing()
          .returning({ id: courseEnrollmentGrant.id });

        grantCount += insertedGrants.length;
      }
    }
  }

  const totalPathGrants = await db
    .select({ id: courseEnrollmentGrant.id })
    .from(courseEnrollmentGrant)
    .where(
      and(
        eq(courseEnrollmentGrant.source, 'LEARNING_PATH'),
        inArray(courseEnrollmentGrant.learningPathId, [bootcampSeed.id, dataSkillsSeed.id])
      )
    );

  console.log(`   ✓ Recorded ${grantCount} new LEARNING_PATH enrollment grant(s) (${totalPathGrants.length} total)`);
}
