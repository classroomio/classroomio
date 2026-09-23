import {
  account,
  and,
  course,
  courseEnrollmentGrant,
  db,
  eq,
  exercise,
  group,
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
  or,
  profile,
  sql,
  submission,
  user
} from '@db/drizzle';
import { getCourseCompletionStatsForProfile } from '@db/queries/learning-path/progress';
import { formatCertificateId } from '@db/queries/learning-path/certificate';
import { seedReactCoursePeopleProgress } from '@db/utils/seed/reactCoursePeopleProgress';
import { HIPAA_COURSE_ID, HIPAA_GROUP_ID, SOC2_COURSE_ID, SOC2_GROUP_ID } from '@db/utils/seed/compliance';

import { randomUUID } from 'node:crypto';

import { ROLE } from '@cio/utils/constants';

import type { TNewGroupmember, TNewProfile } from '@db/types';

interface SeedLearningPathsArgs {
  testOrgId: string;
  adminUserId: string;
  mvcCourseId: string;
  reactCourseId: string;
  pandasCourseId: string;
  existingStudentUserId: string;
  enterpriseOrgId: string;
  enterpriseAdminUserId: string;
  enterpriseStudentUserId: string;
  earlyAdopterOrgId: string;
  earlyAdopterAdminUserId: string;
  earlyAdopterStudentUserId: string;
  earlyAdopterGroupId: string;
  earlyAdopterCourseId: string;
  selectedOrganizationId?: string;
}

/** Same credential password hash as the other demo seeds ("123456"). */
const PASSWORD_HASH = '$2a$10$dgxySj.k12gDKhLx7X4x6./J.Nzhz7WQrwh5lkjLKwIwWW4o5GJcW';

// Fixed IDs so re-running the seed updates the same rows.
const PATH_BOOTCAMP_ID = '9a000000-0000-4000-8000-000000000001';
const PATH_DATA_SKILLS_ID = '9a000000-0000-4000-8000-000000000002';
const PATH_DRAFT_ID = '9a000000-0000-4000-8000-000000000003';
const PATH_SHOWCASE_ID = '9a000000-0000-4000-8000-000000000004';
const PATH_PRO_ID = '9a000000-0000-4000-8000-000000000005';

const PATH_COURSE_IDS = {
  bootcampMvc: '9a000001-0000-4000-8000-000000000001',
  bootcampReact: '9a000001-0000-4000-8000-000000000002',
  bootcampPandas: '9a000001-0000-4000-8000-000000000003',
  dataSkillsReact: '9a000001-0000-4000-8000-000000000011',
  dataSkillsPandas: '9a000001-0000-4000-8000-000000000012',
  draftMvc: '9a000001-0000-4000-8000-000000000021',
  draftReact: '9a000001-0000-4000-8000-000000000022',
  showcaseReact: '9a000001-0000-4000-8000-000000000051',
  showcasePandas: '9a000001-0000-4000-8000-000000000052',
  proMvc: '9a000001-0000-4000-8000-000000000061',
  proReact: '9a000001-0000-4000-8000-000000000062',
  proPandas: '9a000001-0000-4000-8000-000000000063',
  proJs: '9a000001-0000-4000-8000-000000000064',
  proTs: '9a000001-0000-4000-8000-000000000065',
  proTesting: '9a000001-0000-4000-8000-000000000066'
} as const;

// Path learner personas (the React learners in reactCoursePeopleProgress.ts are reused as-is).
const MAYA_PROFILE_ID = '9a000000-9000-4000-8000-000000000001'; // completed the whole bootcamp path
const DANIEL_PROFILE_ID = '9a000000-9000-4000-8000-000000000002'; // finished course 1, started course 2
const LUCIA_PROFILE_ID = '9a000000-9000-4000-8000-000000000003'; // enrolled, never started
const PRIYA_NAIR_PROFILE_ID = '9a000000-9000-4000-8000-000000000004';
const TOMAS_SILVA_PROFILE_ID = '9a000000-9000-4000-8000-000000000005';
const AISHA_BELLO_PROFILE_ID = '9a000000-9000-4000-8000-000000000006';
const RAVI_PATEL_PROFILE_ID = '9a000000-9000-4000-8000-000000000007';
const ELENA_PETROVA_PROFILE_ID = '9a000000-9000-4000-8000-000000000008';
const KWAME_MENSAH_PROFILE_ID = '9a000000-9000-4000-8000-000000000009';
const YUKI_TANAKA_PROFILE_ID = '9a000000-9000-4000-8000-000000000010';
const OMAR_HADDAD_PROFILE_ID = '9a000000-9000-4000-8000-000000000011';
const ZOE_KIM_PROFILE_ID = '9a000000-9000-4000-8000-000000000012';
const LIAM_MURPHY_PROFILE_ID = '9a000000-9000-4000-8000-000000000013';
const SOFIA_ROSSI_PROFILE_ID = '9a000000-9000-4000-8000-000000000014';
const NOAH_SMITH_PROFILE_ID = '9a000000-9000-4000-8000-000000000015';
const EMMA_WILSON_PROFILE_ID = '9a000000-9000-4000-8000-000000000016';
const AVA_JOHNSON_PROFILE_ID = '9a000000-9000-4000-8000-000000000017';
const LUCAS_BROWN_PROFILE_ID = '9a000000-9000-4000-8000-000000000018';
const MIA_DAVIS_PROFILE_ID = '9a000000-9000-4000-8000-000000000019';
const ETHAN_MOORE_PROFILE_ID = '9a000000-9000-4000-8000-000000000020';
const ISLA_TAYLOR_PROFILE_ID = '9a000000-9000-4000-8000-000000000021';
const OLIVER_ANDERSON_PROFILE_ID = '9a000000-9000-4000-8000-000000000022';
const AMELIA_THOMAS_PROFILE_ID = '9a000000-9000-4000-8000-000000000023';
const GRACE_LEE_PROFILE_ID = '9a000000-9000-4000-8000-000000000024';
const HENRY_ADAMS_PROFILE_ID = '9a000000-9000-4000-8000-000000000025';
const CHLOE_MARTIN_PROFILE_ID = '9a000000-9000-4000-8000-000000000026';
const FELIX_GRANT_PROFILE_ID = '9a000000-9000-4000-8000-000000000027';
const HANNAH_COLE_PROFILE_ID = '9a000000-9000-4000-8000-000000000028';
const IVAN_PETROV_PROFILE_ID = '9a000000-9000-4000-8000-000000000029';
const JULIA_ROSS_PROFILE_ID = '9a000000-9000-4000-8000-000000000030';
const KEVIN_LIN_PROFILE_ID = '9a000000-9000-4000-8000-000000000031';
const LAURA_GOMEZ_PROFILE_ID = '9a000000-9000-4000-8000-000000000032';
const MARCO_RUIZ_PROFILE_ID = '9a000000-9000-4000-8000-000000000033';
const NADIA_ALI_PROFILE_ID = '9a000000-9000-4000-8000-000000000034';
const OWEN_REED_PROFILE_ID = '9a000000-9000-4000-8000-000000000035';
const PAULA_FOX_PROFILE_ID = '9a000000-9000-4000-8000-000000000036';
const QUINN_BELL_PROFILE_ID = '9a000000-9000-4000-8000-000000000037';
const ROSA_DIAZ_PROFILE_ID = '9a000000-9000-4000-8000-000000000038';
const SAM_CARTER_PROFILE_ID = '9a000000-9000-4000-8000-000000000039';
const TINA_NGUYEN_PROFILE_ID = '9a000000-9000-4000-8000-000000000040';
const UMAR_FAROUK_PROFILE_ID = '9a000000-9000-4000-8000-000000000041';

const PATH_MEMBER_IDS = {
  bootcampTutor: '9a000002-0000-4000-8000-000000000001',
  bootcampMaya: '9a000002-0000-4000-8000-000000000002',
  bootcampDaniel: '9a000002-0000-4000-8000-000000000003',
  bootcampLucia: '9a000002-0000-4000-8000-000000000004',
  bootcampStudent: '9a000002-0000-4000-8000-000000000005',
  dataSkillsStudent: '9a000002-0000-4000-8000-000000000011',
  bootcampPriyaNair: '9a000002-0000-4000-8000-000000000021',
  bootcampTomasSilva: '9a000002-0000-4000-8000-000000000022',
  bootcampAishaBello: '9a000002-0000-4000-8000-000000000023',
  bootcampRaviPatel: '9a000002-0000-4000-8000-000000000024',
  bootcampElenaPetrova: '9a000002-0000-4000-8000-000000000025',
  bootcampKwameMensah: '9a000002-0000-4000-8000-000000000026',
  bootcampYukiTanaka: '9a000002-0000-4000-8000-000000000027',
  bootcampOmarHaddad: '9a000002-0000-4000-8000-000000000028',
  bootcampZoeKim: '9a000002-0000-4000-8000-000000000029',
  bootcampLiamMurphy: '9a000002-0000-4000-8000-000000000030',
  bootcampSofiaRossi: '9a000002-0000-4000-8000-000000000031',
  bootcampNoahSmith: '9a000002-0000-4000-8000-000000000032',
  bootcampEmmaWilson: '9a000002-0000-4000-8000-000000000033',
  bootcampAvaJohnson: '9a000002-0000-4000-8000-000000000034',
  bootcampLucasBrown: '9a000002-0000-4000-8000-000000000035',
  bootcampMiaDavis: '9a000002-0000-4000-8000-000000000036',
  bootcampEthanMoore: '9a000002-0000-4000-8000-000000000037',
  bootcampIslaTaylor: '9a000002-0000-4000-8000-000000000038',
  bootcampOliverAnderson: '9a000002-0000-4000-8000-000000000039',
  bootcampAmeliaThomas: '9a000002-0000-4000-8000-000000000040',
  showcaseGraceLee: '9a000002-0000-4000-8000-000000000041',
  showcaseHenryAdams: '9a000002-0000-4000-8000-000000000042',
  showcaseChloeMartin: '9a000002-0000-4000-8000-000000000043',
  proFelixGrant: '9a000002-0000-4000-8000-000000000044',
  proHannahCole: '9a000002-0000-4000-8000-000000000045',
  proIvanPetrov: '9a000002-0000-4000-8000-000000000046',
  proJuliaRoss: '9a000002-0000-4000-8000-000000000047',
  proKevinLin: '9a000002-0000-4000-8000-000000000048',
  proLauraGomez: '9a000002-0000-4000-8000-000000000049',
  proMarcoRuiz: '9a000002-0000-4000-8000-000000000050',
  proNadiaAli: '9a000002-0000-4000-8000-000000000051',
  proOwenReed: '9a000002-0000-4000-8000-000000000052',
  proPaulaFox: '9a000002-0000-4000-8000-000000000053',
  proQuinnBell: '9a000002-0000-4000-8000-000000000054',
  proRosaDiaz: '9a000002-0000-4000-8000-000000000055',
  proSamCarter: '9a000002-0000-4000-8000-000000000056',
  proTinaNguyen: '9a000002-0000-4000-8000-000000000057',
  proUmarFarouk: '9a000002-0000-4000-8000-000000000058'
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

const DAY_MS = 24 * 60 * 60 * 1000;

/** Lessons per course, in content order (ids match seed/lesson.ts). */
const ALL_PATH_COURSE_KEYS: CourseKey[] = ['mvc', 'react', 'pandas', 'js', 'ts', 'testing'];

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
  ],
  js: [
    '9a000003-0000-4000-8000-000000000101',
    '9a000003-0000-4000-8000-000000000102',
    '9a000003-0000-4000-8000-000000000103'
  ],
  ts: [
    '9a000003-0000-4000-8000-000000000111',
    '9a000003-0000-4000-8000-000000000112',
    '9a000003-0000-4000-8000-000000000113'
  ],
  testing: [
    '9a000003-0000-4000-8000-000000000121',
    '9a000003-0000-4000-8000-000000000122',
    '9a000003-0000-4000-8000-000000000123'
  ]
};

interface PersonaSeed {
  profileId: string;
  fullname: string;
  username: string;
  email: string;
  groupMemberIds: Partial<Record<CourseKey, string>>;
  enrolledDaysAgo: number;
  activityDaysAgo: number | null;
  /** How many lessons/exercises to backfill per course; a full course marks it complete. */
  progress: Partial<Record<CourseKey, { lessonsCompleted: number; exercisesCompleted: number }>>;
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
  },
  // Analytics tableau personas for the bootcamp path (mvc -> react -> pandas).
  // DROP_A (3) finish mvc only: drop-off after course 1. DROP_B (5) finish
  // mvc + react: bigger drop-off after course 2 (highlighted as biggest).
  // STUCK_REACT (7) share identical partial react progress with stale activity:
  // their common incomplete items read "7 stuck". STUCK_PANDAS (5) does the same
  // in pandas ("5 stuck") without merging into the react counts. Identical
  // per-course counts within a group keep stuck counts clean; stale
  // activityDaysAgo (> 14) is what marks their IN_PROGRESS rows as stuck.
  {
    profileId: PRIYA_NAIR_PROFILE_ID,
    fullname: 'Priya Nair',
    username: 'priya.nair',
    email: 'priya.nair@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000010',
      react: '9a000001-1000-4000-8000-000000000011',
      pandas: '9a000001-1000-4000-8000-000000000012'
    },
    enrolledDaysAgo: 40,
    activityDaysAgo: 35,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 0, exercisesCompleted: 0 },
      pandas: { lessonsCompleted: 0, exercisesCompleted: 0 }
    }
  },
  {
    profileId: TOMAS_SILVA_PROFILE_ID,
    fullname: 'Tomas Silva',
    username: 'tomas.silva',
    email: 'tomas.silva@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000013',
      react: '9a000001-1000-4000-8000-000000000014',
      pandas: '9a000001-1000-4000-8000-000000000015'
    },
    enrolledDaysAgo: 40,
    activityDaysAgo: 35,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 0, exercisesCompleted: 0 },
      pandas: { lessonsCompleted: 0, exercisesCompleted: 0 }
    }
  },
  {
    profileId: AISHA_BELLO_PROFILE_ID,
    fullname: 'Aisha Bello',
    username: 'aisha.bello',
    email: 'aisha.bello@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000016',
      react: '9a000001-1000-4000-8000-000000000017',
      pandas: '9a000001-1000-4000-8000-000000000018'
    },
    enrolledDaysAgo: 40,
    activityDaysAgo: 35,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 0, exercisesCompleted: 0 },
      pandas: { lessonsCompleted: 0, exercisesCompleted: 0 }
    }
  },
  {
    profileId: RAVI_PATEL_PROFILE_ID,
    fullname: 'Ravi Patel',
    username: 'ravi.patel',
    email: 'ravi.patel@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000019',
      react: '9a000001-1000-4000-8000-000000000020',
      pandas: '9a000001-1000-4000-8000-000000000021'
    },
    enrolledDaysAgo: 60,
    activityDaysAgo: 50,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 3, exercisesCompleted: 3 },
      pandas: { lessonsCompleted: 0, exercisesCompleted: 0 }
    }
  },
  {
    profileId: ELENA_PETROVA_PROFILE_ID,
    fullname: 'Elena Petrova',
    username: 'elena.petrova',
    email: 'elena.petrova@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000022',
      react: '9a000001-1000-4000-8000-000000000023',
      pandas: '9a000001-1000-4000-8000-000000000024'
    },
    enrolledDaysAgo: 60,
    activityDaysAgo: 50,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 3, exercisesCompleted: 3 },
      pandas: { lessonsCompleted: 0, exercisesCompleted: 0 }
    }
  },
  {
    profileId: KWAME_MENSAH_PROFILE_ID,
    fullname: 'Kwame Mensah',
    username: 'kwame.mensah',
    email: 'kwame.mensah@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000025',
      react: '9a000001-1000-4000-8000-000000000026',
      pandas: '9a000001-1000-4000-8000-000000000027'
    },
    enrolledDaysAgo: 60,
    activityDaysAgo: 50,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 3, exercisesCompleted: 3 },
      pandas: { lessonsCompleted: 0, exercisesCompleted: 0 }
    }
  },
  {
    profileId: YUKI_TANAKA_PROFILE_ID,
    fullname: 'Yuki Tanaka',
    username: 'yuki.tanaka',
    email: 'yuki.tanaka@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000028',
      react: '9a000001-1000-4000-8000-000000000029',
      pandas: '9a000001-1000-4000-8000-000000000030'
    },
    enrolledDaysAgo: 60,
    activityDaysAgo: 50,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 3, exercisesCompleted: 3 },
      pandas: { lessonsCompleted: 0, exercisesCompleted: 0 }
    }
  },
  {
    profileId: OMAR_HADDAD_PROFILE_ID,
    fullname: 'Omar Haddad',
    username: 'omar.haddad',
    email: 'omar.haddad@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000031',
      react: '9a000001-1000-4000-8000-000000000032',
      pandas: '9a000001-1000-4000-8000-000000000033'
    },
    enrolledDaysAgo: 60,
    activityDaysAgo: 50,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 3, exercisesCompleted: 3 },
      pandas: { lessonsCompleted: 0, exercisesCompleted: 0 }
    }
  },
  {
    profileId: ZOE_KIM_PROFILE_ID,
    fullname: 'Zoe Kim',
    username: 'zoe.kim',
    email: 'zoe.kim@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000034',
      react: '9a000001-1000-4000-8000-000000000035',
      pandas: '9a000001-1000-4000-8000-000000000036'
    },
    enrolledDaysAgo: 25,
    activityDaysAgo: 20,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 2, exercisesCompleted: 1 },
      pandas: { lessonsCompleted: 0, exercisesCompleted: 0 }
    }
  },
  {
    profileId: LIAM_MURPHY_PROFILE_ID,
    fullname: 'Liam Murphy',
    username: 'liam.murphy',
    email: 'liam.murphy@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000037',
      react: '9a000001-1000-4000-8000-000000000038',
      pandas: '9a000001-1000-4000-8000-000000000039'
    },
    enrolledDaysAgo: 25,
    activityDaysAgo: 20,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 2, exercisesCompleted: 1 },
      pandas: { lessonsCompleted: 0, exercisesCompleted: 0 }
    }
  },
  {
    profileId: SOFIA_ROSSI_PROFILE_ID,
    fullname: 'Sofia Rossi',
    username: 'sofia.rossi',
    email: 'sofia.rossi@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000040',
      react: '9a000001-1000-4000-8000-000000000041',
      pandas: '9a000001-1000-4000-8000-000000000042'
    },
    enrolledDaysAgo: 25,
    activityDaysAgo: 20,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 2, exercisesCompleted: 1 },
      pandas: { lessonsCompleted: 0, exercisesCompleted: 0 }
    }
  },
  {
    profileId: NOAH_SMITH_PROFILE_ID,
    fullname: 'Noah Smith',
    username: 'noah.smith',
    email: 'noah.smith@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000043',
      react: '9a000001-1000-4000-8000-000000000044',
      pandas: '9a000001-1000-4000-8000-000000000045'
    },
    enrolledDaysAgo: 25,
    activityDaysAgo: 20,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 2, exercisesCompleted: 1 },
      pandas: { lessonsCompleted: 0, exercisesCompleted: 0 }
    }
  },
  {
    profileId: EMMA_WILSON_PROFILE_ID,
    fullname: 'Emma Wilson',
    username: 'emma.wilson',
    email: 'emma.wilson@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000046',
      react: '9a000001-1000-4000-8000-000000000047',
      pandas: '9a000001-1000-4000-8000-000000000048'
    },
    enrolledDaysAgo: 25,
    activityDaysAgo: 20,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 2, exercisesCompleted: 1 },
      pandas: { lessonsCompleted: 0, exercisesCompleted: 0 }
    }
  },
  {
    profileId: AVA_JOHNSON_PROFILE_ID,
    fullname: 'Ava Johnson',
    username: 'ava.johnson',
    email: 'ava.johnson@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000049',
      react: '9a000001-1000-4000-8000-000000000050',
      pandas: '9a000001-1000-4000-8000-000000000051'
    },
    enrolledDaysAgo: 25,
    activityDaysAgo: 20,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 2, exercisesCompleted: 1 },
      pandas: { lessonsCompleted: 0, exercisesCompleted: 0 }
    }
  },
  {
    profileId: LUCAS_BROWN_PROFILE_ID,
    fullname: 'Lucas Brown',
    username: 'lucas.brown',
    email: 'lucas.brown@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000052',
      react: '9a000001-1000-4000-8000-000000000053',
      pandas: '9a000001-1000-4000-8000-000000000054'
    },
    enrolledDaysAgo: 25,
    activityDaysAgo: 20,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 2, exercisesCompleted: 1 },
      pandas: { lessonsCompleted: 0, exercisesCompleted: 0 }
    }
  },
  {
    profileId: MIA_DAVIS_PROFILE_ID,
    fullname: 'Mia Davis',
    username: 'mia.davis',
    email: 'mia.davis@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000055',
      react: '9a000001-1000-4000-8000-000000000056',
      pandas: '9a000001-1000-4000-8000-000000000057'
    },
    enrolledDaysAgo: 35,
    activityDaysAgo: 30,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 3, exercisesCompleted: 3 },
      pandas: { lessonsCompleted: 2, exercisesCompleted: 1 }
    }
  },
  {
    profileId: ETHAN_MOORE_PROFILE_ID,
    fullname: 'Ethan Moore',
    username: 'ethan.moore',
    email: 'ethan.moore@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000058',
      react: '9a000001-1000-4000-8000-000000000059',
      pandas: '9a000001-1000-4000-8000-000000000060'
    },
    enrolledDaysAgo: 35,
    activityDaysAgo: 30,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 3, exercisesCompleted: 3 },
      pandas: { lessonsCompleted: 2, exercisesCompleted: 1 }
    }
  },
  {
    profileId: ISLA_TAYLOR_PROFILE_ID,
    fullname: 'Isla Taylor',
    username: 'isla.taylor',
    email: 'isla.taylor@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000061',
      react: '9a000001-1000-4000-8000-000000000062',
      pandas: '9a000001-1000-4000-8000-000000000063'
    },
    enrolledDaysAgo: 35,
    activityDaysAgo: 30,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 3, exercisesCompleted: 3 },
      pandas: { lessonsCompleted: 2, exercisesCompleted: 1 }
    }
  },
  {
    profileId: OLIVER_ANDERSON_PROFILE_ID,
    fullname: 'Oliver Anderson',
    username: 'oliver.anderson',
    email: 'oliver.anderson@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000064',
      react: '9a000001-1000-4000-8000-000000000065',
      pandas: '9a000001-1000-4000-8000-000000000066'
    },
    enrolledDaysAgo: 35,
    activityDaysAgo: 30,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 3, exercisesCompleted: 3 },
      pandas: { lessonsCompleted: 2, exercisesCompleted: 1 }
    }
  },
  {
    profileId: AMELIA_THOMAS_PROFILE_ID,
    fullname: 'Amelia Thomas',
    username: 'amelia.thomas',
    email: 'amelia.thomas@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000067',
      react: '9a000001-1000-4000-8000-000000000068',
      pandas: '9a000001-1000-4000-8000-000000000069'
    },
    enrolledDaysAgo: 35,
    activityDaysAgo: 30,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 3, exercisesCompleted: 3 },
      pandas: { lessonsCompleted: 2, exercisesCompleted: 1 }
    }
  },
  {
    profileId: GRACE_LEE_PROFILE_ID,
    fullname: 'Grace Lee',
    username: 'grace.lee',
    email: 'grace.lee@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000070',
      react: '9a000001-1000-4000-8000-000000000071',
      pandas: '9a000001-1000-4000-8000-000000000072'
    },
    enrolledDaysAgo: 20,
    activityDaysAgo: 10,
    progress: {
      mvc: { lessonsCompleted: 0, exercisesCompleted: 0 },
      react: { lessonsCompleted: 3, exercisesCompleted: 3 },
      pandas: { lessonsCompleted: 3, exercisesCompleted: 3 }
    }
  },
  {
    profileId: HENRY_ADAMS_PROFILE_ID,
    fullname: 'Henry Adams',
    username: 'henry.adams',
    email: 'henry.adams@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000073',
      react: '9a000001-1000-4000-8000-000000000074',
      pandas: '9a000001-1000-4000-8000-000000000075'
    },
    enrolledDaysAgo: 20,
    activityDaysAgo: 10,
    progress: {
      mvc: { lessonsCompleted: 0, exercisesCompleted: 0 },
      react: { lessonsCompleted: 3, exercisesCompleted: 3 },
      pandas: { lessonsCompleted: 3, exercisesCompleted: 3 }
    }
  },
  {
    profileId: CHLOE_MARTIN_PROFILE_ID,
    fullname: 'Chloe Martin',
    username: 'chloe.martin',
    email: 'chloe.martin@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000076',
      react: '9a000001-1000-4000-8000-000000000077',
      pandas: '9a000001-1000-4000-8000-000000000078'
    },
    enrolledDaysAgo: 20,
    activityDaysAgo: 10,
    progress: {
      mvc: { lessonsCompleted: 0, exercisesCompleted: 0 },
      react: { lessonsCompleted: 3, exercisesCompleted: 3 },
      pandas: { lessonsCompleted: 3, exercisesCompleted: 3 }
    }
  },
  {
    profileId: FELIX_GRANT_PROFILE_ID,
    fullname: 'Felix Grant',
    username: 'felix.grant',
    email: 'felix.grant@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000079',
      react: '9a000001-1000-4000-8000-000000000080',
      pandas: '9a000001-1000-4000-8000-000000000081',
      js: '9a000001-1000-4000-8000-000000000082',
      ts: '9a000001-1000-4000-8000-000000000083',
      testing: '9a000001-1000-4000-8000-000000000084'
    },
    enrolledDaysAgo: 40,
    activityDaysAgo: 35,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 3, exercisesCompleted: 3 },
      pandas: { lessonsCompleted: 0, exercisesCompleted: 0 },
      js: { lessonsCompleted: 0, exercisesCompleted: 0 },
      ts: { lessonsCompleted: 0, exercisesCompleted: 0 },
      testing: { lessonsCompleted: 0, exercisesCompleted: 0 }
    }
  },
  {
    profileId: HANNAH_COLE_PROFILE_ID,
    fullname: 'Hannah Cole',
    username: 'hannah.cole',
    email: 'hannah.cole@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000085',
      react: '9a000001-1000-4000-8000-000000000086',
      pandas: '9a000001-1000-4000-8000-000000000087',
      js: '9a000001-1000-4000-8000-000000000088',
      ts: '9a000001-1000-4000-8000-000000000089',
      testing: '9a000001-1000-4000-8000-000000000090'
    },
    enrolledDaysAgo: 40,
    activityDaysAgo: 35,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 3, exercisesCompleted: 3 },
      pandas: { lessonsCompleted: 0, exercisesCompleted: 0 },
      js: { lessonsCompleted: 0, exercisesCompleted: 0 },
      ts: { lessonsCompleted: 0, exercisesCompleted: 0 },
      testing: { lessonsCompleted: 0, exercisesCompleted: 0 }
    }
  },
  {
    profileId: IVAN_PETROV_PROFILE_ID,
    fullname: 'Ivan Petrov',
    username: 'ivan.petrov',
    email: 'ivan.petrov@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000091',
      react: '9a000001-1000-4000-8000-000000000092',
      pandas: '9a000001-1000-4000-8000-000000000093',
      js: '9a000001-1000-4000-8000-000000000094',
      ts: '9a000001-1000-4000-8000-000000000095',
      testing: '9a000001-1000-4000-8000-000000000096'
    },
    enrolledDaysAgo: 40,
    activityDaysAgo: 35,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 3, exercisesCompleted: 3 },
      pandas: { lessonsCompleted: 0, exercisesCompleted: 0 },
      js: { lessonsCompleted: 0, exercisesCompleted: 0 },
      ts: { lessonsCompleted: 0, exercisesCompleted: 0 },
      testing: { lessonsCompleted: 0, exercisesCompleted: 0 }
    }
  },
  {
    profileId: JULIA_ROSS_PROFILE_ID,
    fullname: 'Julia Ross',
    username: 'julia.ross',
    email: 'julia.ross@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000097',
      react: '9a000001-1000-4000-8000-000000000098',
      pandas: '9a000001-1000-4000-8000-000000000099',
      js: '9a000001-1000-4000-8000-000000000100',
      ts: '9a000001-1000-4000-8000-000000000101',
      testing: '9a000001-1000-4000-8000-000000000102'
    },
    enrolledDaysAgo: 60,
    activityDaysAgo: 50,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 3, exercisesCompleted: 3 },
      pandas: { lessonsCompleted: 3, exercisesCompleted: 3 },
      js: { lessonsCompleted: 3, exercisesCompleted: 3 },
      ts: { lessonsCompleted: 0, exercisesCompleted: 0 },
      testing: { lessonsCompleted: 0, exercisesCompleted: 0 }
    }
  },
  {
    profileId: KEVIN_LIN_PROFILE_ID,
    fullname: 'Kevin Lin',
    username: 'kevin.lin',
    email: 'kevin.lin@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000103',
      react: '9a000001-1000-4000-8000-000000000104',
      pandas: '9a000001-1000-4000-8000-000000000105',
      js: '9a000001-1000-4000-8000-000000000106',
      ts: '9a000001-1000-4000-8000-000000000107',
      testing: '9a000001-1000-4000-8000-000000000108'
    },
    enrolledDaysAgo: 60,
    activityDaysAgo: 50,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 3, exercisesCompleted: 3 },
      pandas: { lessonsCompleted: 3, exercisesCompleted: 3 },
      js: { lessonsCompleted: 3, exercisesCompleted: 3 },
      ts: { lessonsCompleted: 0, exercisesCompleted: 0 },
      testing: { lessonsCompleted: 0, exercisesCompleted: 0 }
    }
  },
  {
    profileId: LAURA_GOMEZ_PROFILE_ID,
    fullname: 'Laura Gomez',
    username: 'laura.gomez',
    email: 'laura.gomez@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000109',
      react: '9a000001-1000-4000-8000-000000000110',
      pandas: '9a000001-1000-4000-8000-000000000111',
      js: '9a000001-1000-4000-8000-000000000112',
      ts: '9a000001-1000-4000-8000-000000000113',
      testing: '9a000001-1000-4000-8000-000000000114'
    },
    enrolledDaysAgo: 60,
    activityDaysAgo: 50,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 3, exercisesCompleted: 3 },
      pandas: { lessonsCompleted: 3, exercisesCompleted: 3 },
      js: { lessonsCompleted: 3, exercisesCompleted: 3 },
      ts: { lessonsCompleted: 0, exercisesCompleted: 0 },
      testing: { lessonsCompleted: 0, exercisesCompleted: 0 }
    }
  },
  {
    profileId: MARCO_RUIZ_PROFILE_ID,
    fullname: 'Marco Ruiz',
    username: 'marco.ruiz',
    email: 'marco.ruiz@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000115',
      react: '9a000001-1000-4000-8000-000000000116',
      pandas: '9a000001-1000-4000-8000-000000000117',
      js: '9a000001-1000-4000-8000-000000000118',
      ts: '9a000001-1000-4000-8000-000000000119',
      testing: '9a000001-1000-4000-8000-000000000120'
    },
    enrolledDaysAgo: 60,
    activityDaysAgo: 50,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 3, exercisesCompleted: 3 },
      pandas: { lessonsCompleted: 3, exercisesCompleted: 3 },
      js: { lessonsCompleted: 3, exercisesCompleted: 3 },
      ts: { lessonsCompleted: 0, exercisesCompleted: 0 },
      testing: { lessonsCompleted: 0, exercisesCompleted: 0 }
    }
  },
  {
    profileId: NADIA_ALI_PROFILE_ID,
    fullname: 'Nadia Ali',
    username: 'nadia.ali',
    email: 'nadia.ali@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000121',
      react: '9a000001-1000-4000-8000-000000000122',
      pandas: '9a000001-1000-4000-8000-000000000123',
      js: '9a000001-1000-4000-8000-000000000124',
      ts: '9a000001-1000-4000-8000-000000000125',
      testing: '9a000001-1000-4000-8000-000000000126'
    },
    enrolledDaysAgo: 60,
    activityDaysAgo: 50,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 3, exercisesCompleted: 3 },
      pandas: { lessonsCompleted: 3, exercisesCompleted: 3 },
      js: { lessonsCompleted: 3, exercisesCompleted: 3 },
      ts: { lessonsCompleted: 0, exercisesCompleted: 0 },
      testing: { lessonsCompleted: 0, exercisesCompleted: 0 }
    }
  },
  {
    profileId: OWEN_REED_PROFILE_ID,
    fullname: 'Owen Reed',
    username: 'owen.reed',
    email: 'owen.reed@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000127',
      react: '9a000001-1000-4000-8000-000000000128',
      pandas: '9a000001-1000-4000-8000-000000000129',
      js: '9a000001-1000-4000-8000-000000000130',
      ts: '9a000001-1000-4000-8000-000000000131',
      testing: '9a000001-1000-4000-8000-000000000132'
    },
    enrolledDaysAgo: 25,
    activityDaysAgo: 12,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 3, exercisesCompleted: 3 },
      pandas: { lessonsCompleted: 3, exercisesCompleted: 3 },
      js: { lessonsCompleted: 3, exercisesCompleted: 3 },
      ts: { lessonsCompleted: 3, exercisesCompleted: 3 },
      testing: { lessonsCompleted: 3, exercisesCompleted: 3 }
    }
  },
  {
    profileId: PAULA_FOX_PROFILE_ID,
    fullname: 'Paula Fox',
    username: 'paula.fox',
    email: 'paula.fox@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000133',
      react: '9a000001-1000-4000-8000-000000000134',
      pandas: '9a000001-1000-4000-8000-000000000135',
      js: '9a000001-1000-4000-8000-000000000136',
      ts: '9a000001-1000-4000-8000-000000000137',
      testing: '9a000001-1000-4000-8000-000000000138'
    },
    enrolledDaysAgo: 25,
    activityDaysAgo: 12,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 3, exercisesCompleted: 3 },
      pandas: { lessonsCompleted: 3, exercisesCompleted: 3 },
      js: { lessonsCompleted: 3, exercisesCompleted: 3 },
      ts: { lessonsCompleted: 3, exercisesCompleted: 3 },
      testing: { lessonsCompleted: 3, exercisesCompleted: 3 }
    }
  },
  {
    profileId: QUINN_BELL_PROFILE_ID,
    fullname: 'Quinn Bell',
    username: 'quinn.bell',
    email: 'quinn.bell@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000139',
      react: '9a000001-1000-4000-8000-000000000140',
      pandas: '9a000001-1000-4000-8000-000000000141',
      js: '9a000001-1000-4000-8000-000000000142',
      ts: '9a000001-1000-4000-8000-000000000143',
      testing: '9a000001-1000-4000-8000-000000000144'
    },
    enrolledDaysAgo: 25,
    activityDaysAgo: 20,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 3, exercisesCompleted: 3 },
      pandas: { lessonsCompleted: 3, exercisesCompleted: 3 },
      js: { lessonsCompleted: 3, exercisesCompleted: 3 },
      ts: { lessonsCompleted: 3, exercisesCompleted: 3 },
      testing: { lessonsCompleted: 2, exercisesCompleted: 1 }
    }
  },
  {
    profileId: ROSA_DIAZ_PROFILE_ID,
    fullname: 'Rosa Diaz',
    username: 'rosa.diaz',
    email: 'rosa.diaz@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000145',
      react: '9a000001-1000-4000-8000-000000000146',
      pandas: '9a000001-1000-4000-8000-000000000147',
      js: '9a000001-1000-4000-8000-000000000148',
      ts: '9a000001-1000-4000-8000-000000000149',
      testing: '9a000001-1000-4000-8000-000000000150'
    },
    enrolledDaysAgo: 25,
    activityDaysAgo: 20,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 3, exercisesCompleted: 3 },
      pandas: { lessonsCompleted: 3, exercisesCompleted: 3 },
      js: { lessonsCompleted: 3, exercisesCompleted: 3 },
      ts: { lessonsCompleted: 3, exercisesCompleted: 3 },
      testing: { lessonsCompleted: 2, exercisesCompleted: 1 }
    }
  },
  {
    profileId: SAM_CARTER_PROFILE_ID,
    fullname: 'Sam Carter',
    username: 'sam.carter',
    email: 'sam.carter@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000151',
      react: '9a000001-1000-4000-8000-000000000152',
      pandas: '9a000001-1000-4000-8000-000000000153',
      js: '9a000001-1000-4000-8000-000000000154',
      ts: '9a000001-1000-4000-8000-000000000155',
      testing: '9a000001-1000-4000-8000-000000000156'
    },
    enrolledDaysAgo: 50,
    activityDaysAgo: 45,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 3, exercisesCompleted: 3 },
      pandas: { lessonsCompleted: 3, exercisesCompleted: 3 },
      js: { lessonsCompleted: 3, exercisesCompleted: 3 },
      ts: { lessonsCompleted: 3, exercisesCompleted: 3 },
      testing: { lessonsCompleted: 0, exercisesCompleted: 0 }
    }
  },
  {
    profileId: TINA_NGUYEN_PROFILE_ID,
    fullname: 'Tina Nguyen',
    username: 'tina.nguyen',
    email: 'tina.nguyen@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000157',
      react: '9a000001-1000-4000-8000-000000000158',
      pandas: '9a000001-1000-4000-8000-000000000159',
      js: '9a000001-1000-4000-8000-000000000160',
      ts: '9a000001-1000-4000-8000-000000000161',
      testing: '9a000001-1000-4000-8000-000000000162'
    },
    enrolledDaysAgo: 50,
    activityDaysAgo: 45,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 3, exercisesCompleted: 3 },
      pandas: { lessonsCompleted: 3, exercisesCompleted: 3 },
      js: { lessonsCompleted: 3, exercisesCompleted: 3 },
      ts: { lessonsCompleted: 3, exercisesCompleted: 3 },
      testing: { lessonsCompleted: 0, exercisesCompleted: 0 }
    }
  },
  {
    profileId: UMAR_FAROUK_PROFILE_ID,
    fullname: 'Umar Farouk',
    username: 'umar.farouk',
    email: 'umar.farouk@udemy-test.demo',
    groupMemberIds: {
      mvc: '9a000001-1000-4000-8000-000000000163',
      react: '9a000001-1000-4000-8000-000000000164',
      pandas: '9a000001-1000-4000-8000-000000000165',
      js: '9a000001-1000-4000-8000-000000000166',
      ts: '9a000001-1000-4000-8000-000000000167',
      testing: '9a000001-1000-4000-8000-000000000168'
    },
    enrolledDaysAgo: 50,
    activityDaysAgo: 45,
    progress: {
      mvc: { lessonsCompleted: 3, exercisesCompleted: 3 },
      react: { lessonsCompleted: 3, exercisesCompleted: 3 },
      pandas: { lessonsCompleted: 3, exercisesCompleted: 3 },
      js: { lessonsCompleted: 3, exercisesCompleted: 3 },
      ts: { lessonsCompleted: 3, exercisesCompleted: 3 },
      testing: { lessonsCompleted: 0, exercisesCompleted: 0 }
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

const PRO_LANDING_PAGE: PathLandingPage = {
  headline: 'Full-Stack Professional',
  subheadline: 'Six courses from MVC to tested TypeScript — watch the funnel drop, stall, and certify.',
  visitorAccess: 'preview',
  outcomes: [
    'Structure apps with MVC',
    'Build React UIs',
    'Analyze data with Pandas',
    'Master JavaScript and TypeScript',
    'Ship tested code'
  ],
  skills: ['MVC', 'React', 'Python', 'JavaScript', 'TypeScript', 'Testing'],
  showInstructors: false,
  showTestimonials: false,
  showFaqs: false,
  showRating: false
};

const SHOWCASE_LANDING_PAGE: PathLandingPage = {
  headline: 'React to Pandas in Two Courses',
  subheadline: 'A short, fully completable path pairing React interfaces with Pandas analysis.',
  visitorAccess: 'preview',
  outcomes: ['Ship React interfaces users love', 'Wrangle datasets with Pandas'],
  skills: ['React', 'Python', 'Pandas'],
  showInstructors: false,
  showTestimonials: false,
  showFaqs: false,
  showRating: false
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
  },
  {
    id: PATH_SHOWCASE_ID,
    publicId: 'Dv8Rt5kQ',
    slug: 'react-to-pandas-sprint',
    name: 'React to Pandas Sprint',
    description:
      'A two-course sprint from React interfaces to Pandas analysis. Every enrolled learner finishes — the funnel shows certificates with no drop-off.',
    coverImage: null,
    isPublished: true,
    difficulty: 'INTERMEDIATE',
    estimatedDurationMinutes: 180,
    sequentialUnlock: true,
    courseOrderSetDaysAgo: 15,
    certificateTitle: 'React to Pandas Sprint Certificate',
    certificateIssuer: 'Udemy Test Academy',
    certificateIdFormat: 'LP-{year}-{seq}',
    landingPage: SHOWCASE_LANDING_PAGE
  },
  {
    id: PATH_PRO_ID,
    publicId: 'Pr6Qx8zW',
    slug: 'full-stack-professional',
    name: 'Full-Stack Professional',
    description:
      'Six courses from MVC fundamentals to tested TypeScript. The funnel tableau: a drop after course 2, the biggest drop after course 4, and certificates with a final drop on the last course.',
    coverImage: null,
    isPublished: true,
    difficulty: 'ADVANCED',
    estimatedDurationMinutes: 720,
    sequentialUnlock: true,
    courseOrderSetDaysAgo: 10,
    certificateTitle: 'Full-Stack Professional Certificate',
    certificateIssuer: 'Udemy Test Academy',
    certificateIdFormat: 'LP-{year}-{seq}',
    landingPage: PRO_LANDING_PAGE
  }
];

interface PathSeedCourse {
  id: string;
  learningPathId: string;
  courseId: string;
  order: number;
  outcomes: string[];
}

type CourseKey = 'mvc' | 'react' | 'pandas' | 'js' | 'ts' | 'testing';

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
  } else if (pathSeed.id === PATH_SHOWCASE_ID) {
    plans.push(
      { id: PATH_COURSE_IDS.showcaseReact, courseKey: 'react', outcomes: ['Ship modern React interfaces'] },
      { id: PATH_COURSE_IDS.showcasePandas, courseKey: 'pandas', outcomes: ['Explore datasets with Pandas'] }
    );
  } else if (pathSeed.id === PATH_PRO_ID) {
    plans.push(
      { id: PATH_COURSE_IDS.proMvc, courseKey: 'mvc', outcomes: ['Structure apps with MVC'] },
      { id: PATH_COURSE_IDS.proReact, courseKey: 'react', outcomes: ['Build interactive React UIs'] },
      { id: PATH_COURSE_IDS.proPandas, courseKey: 'pandas', outcomes: ['Analyze data with Pandas'] },
      { id: PATH_COURSE_IDS.proJs, courseKey: 'js', outcomes: ['Master modern JavaScript'] },
      { id: PATH_COURSE_IDS.proTs, courseKey: 'ts', outcomes: ['Type safely with TypeScript'] },
      { id: PATH_COURSE_IDS.proTesting, courseKey: 'testing', outcomes: ['Ship tested code'] }
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

  if (lessonRows.length === 0) {
    return false;
  }

  // Resolve exercises through their lessons: seeded exercise rows predate the
  // denormalized exercise.courseId column, so filtering on it directly would
  // report no content even when lessons and quizzes exist.
  const exerciseRows = await db
    .select({ id: exercise.id })
    .from(exercise)
    .where(
      inArray(
        exercise.lessonId,
        lessonRows.map((lessonRow) => lessonRow.id)
      )
    );

  return exerciseRows.length > 0;
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

/** Content ids for the self-contained pro-path courses (created by this seed). */
const EXTRA_COURSE_CONTENT_IDS: Record<'js' | 'ts' | 'testing', { lessons: string[]; exercises: string[] }> = {
  js: {
    lessons: [
      '9a000003-0000-4000-8000-000000000101',
      '9a000003-0000-4000-8000-000000000102',
      '9a000003-0000-4000-8000-000000000103'
    ],
    exercises: [
      '9a000003-0000-4000-8000-000000000201',
      '9a000003-0000-4000-8000-000000000202',
      '9a000003-0000-4000-8000-000000000203'
    ]
  },
  ts: {
    lessons: [
      '9a000003-0000-4000-8000-000000000111',
      '9a000003-0000-4000-8000-000000000112',
      '9a000003-0000-4000-8000-000000000113'
    ],
    exercises: [
      '9a000003-0000-4000-8000-000000000211',
      '9a000003-0000-4000-8000-000000000212',
      '9a000003-0000-4000-8000-000000000213'
    ]
  },
  testing: {
    lessons: [
      '9a000003-0000-4000-8000-000000000121',
      '9a000003-0000-4000-8000-000000000122',
      '9a000003-0000-4000-8000-000000000123'
    ],
    exercises: [
      '9a000003-0000-4000-8000-000000000221',
      '9a000003-0000-4000-8000-000000000222',
      '9a000003-0000-4000-8000-000000000223'
    ]
  }
};

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
  ],
  js: [
    '9a000003-0000-4000-8000-000000000201',
    '9a000003-0000-4000-8000-000000000202',
    '9a000003-0000-4000-8000-000000000203'
  ],
  ts: [
    '9a000003-0000-4000-8000-000000000211',
    '9a000003-0000-4000-8000-000000000212',
    '9a000003-0000-4000-8000-000000000213'
  ],
  testing: [
    '9a000003-0000-4000-8000-000000000221',
    '9a000003-0000-4000-8000-000000000222',
    '9a000003-0000-4000-8000-000000000223'
  ]
};

/** Creates user/profile/account/org-member/group-member rows for the path personas. */
async function seedPersonaAccounts(
  persona: PersonaSeed,
  testOrgId: string,
  now: Date
): Promise<Partial<Record<CourseKey, string>>> {
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

  const resolvedGroupMemberIds: Partial<Record<CourseKey, string>> = {};

  for (const courseKey of ALL_PATH_COURSE_KEYS) {
    const groupMemberId = persona.groupMemberIds[courseKey];
    if (!groupMemberId) {
      continue;
    }

    resolvedGroupMemberIds[courseKey] = await ensureGroupMember(
      courseGroupIdsByKey[courseKey],
      persona.profileId,
      groupMemberId,
      now,
      isoDaysAgo(now, persona.enrolledDaysAgo)
    );
  }

  return resolvedGroupMemberIds;
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
    updatedAt: string;
  }> = [];

  const activityIso = isoDaysAgo(now, Math.max(persona.activityDaysAgo ?? persona.enrolledDaysAgo, 1));

  for (const courseKey of ALL_PATH_COURSE_KEYS) {
    const plan = persona.progress[courseKey] ?? { lessonsCompleted: 0, exercisesCompleted: 0 };
    const groupMemberId = persona.groupMemberIds[courseKey];
    if (!groupMemberId) {
      continue;
    }

    for (const lessonId of COURSE_LESSON_IDS[courseKey].slice(0, plan.lessonsCompleted)) {
      lessonCompletionsToInsert.push({
        lessonId,
        profileId: persona.profileId,
        isComplete: true,
        createdAt: activityIso
      });
    }

    for (const exerciseId of COURSE_EXERCISE_IDS[courseKey].slice(0, plan.exercisesCompleted)) {
      submissionsToInsert.push({
        exerciseId,
        submittedBy: groupMemberId,
        courseId: courseIdsByKey[courseKey],
        gradingState: 'completed',
        overallStatus: 'completed',
        createdAt: activityIso,
        updatedAt: activityIso
      });
    }
  }

  if (lessonCompletionsToInsert.length > 0) {
    await db.insert(lessonCompletion).values(lessonCompletionsToInsert).onConflictDoNothing();

    const lessonIds = lessonCompletionsToInsert.map((item) => item.lessonId);
    await db
      .update(lessonCompletion)
      .set({ createdAt: activityIso })
      .where(
        and(
          eq(lessonCompletion.profileId, persona.profileId),
          inArray(lessonCompletion.lessonId, lessonIds),
          sql`${lessonCompletion.createdAt} IS DISTINCT FROM ${activityIso}::timestamptz`
        )
      );
  }

  const personaGroupMemberIds = ALL_PATH_COURSE_KEYS.map((key) => persona.groupMemberIds[key]).filter(
    (id): id is string => Boolean(id)
  );

  if (submissionsToInsert.length > 0 && personaGroupMemberIds.length > 0) {
    const existingSubmissions = await db
      .select({ exerciseId: submission.exerciseId, submittedBy: submission.submittedBy })
      .from(submission)
      .where(inArray(submission.submittedBy, personaGroupMemberIds));

    const existingSubmissionKeys = new Set(existingSubmissions.map((row) => `${row.submittedBy}-${row.exerciseId}`));
    const newSubmissions = submissionsToInsert.filter(
      (row) => !existingSubmissionKeys.has(`${row.submittedBy}-${row.exerciseId}`)
    );

    if (newSubmissions.length > 0) {
      await db.insert(submission).values(newSubmissions);
    }
  }

  // Repair rows seeded before updatedAt was backdated: the stuck-learners
  // query reads submission recency off updated_at, which defaulted to insert
  // time, so every seeded submission looked freshly updated. Align existing
  // persona rows with their activity date.
  if (personaGroupMemberIds.length > 0) {
    await db
      .update(submission)
      .set({ createdAt: activityIso, updatedAt: activityIso })
      .where(
        and(
          inArray(submission.submittedBy, personaGroupMemberIds),
          or(
            sql`${submission.updatedAt} IS DISTINCT FROM ${activityIso}::timestamptz`,
            sql`${submission.createdAt} IS DISTINCT FROM ${activityIso}::timestamptz`
          )
        )
      );
  }
}

// Populated at the start of seedLearningPaths from the seeded udemy-test courses.
let courseIdsByKey: Record<CourseKey, string>;
let courseGroupIdsByKey: Record<CourseKey, string>;

interface PathMemberSeed {
  id: string;
  profileId: string;
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
  now: Date,
  createdAtIso?: string
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

  // The fixed fallback id can already belong to a different (group, profile)
  // pair seeded earlier in this run — use a random id instead of violating the
  // primary key.
  const idTakenRows = await db
    .select({ id: groupmember.id })
    .from(groupmember)
    .where(eq(groupmember.id, groupMemberId))
    .limit(1);
  const idToUse = idTakenRows.length > 0 ? randomUUID() : groupMemberId;

  const newGroupMember: TNewGroupmember = {
    id: idToUse,
    groupId,
    roleId: ROLE.STUDENT,
    profileId,
    createdAt: createdAtIso ?? isoDaysAgo(now, 1)
  };

  await db.insert(groupmember).values(newGroupMember);

  return idToUse;
}

/**
 * Seeds learning-path demo data:
 * - udemy-test: the full tableau (sequential + non-sequential published paths, a
 *   draft path, members with truth-backed progress caches, LEARNING_PATH
 *   enrollment grants, and a path certificate for the member who finished the
 *   sequential path).
 * - every other demo org with courses: one small published path so no seeded
 *   org ends up with courses but no paths.
 */
export async function seedLearningPaths({
  testOrgId,
  adminUserId,
  mvcCourseId,
  reactCourseId,
  pandasCourseId,
  existingStudentUserId,
  enterpriseOrgId,
  enterpriseAdminUserId,
  enterpriseStudentUserId,
  earlyAdopterOrgId,
  earlyAdopterAdminUserId,
  earlyAdopterStudentUserId,
  earlyAdopterGroupId,
  earlyAdopterCourseId,
  selectedOrganizationId
}: SeedLearningPathsArgs) {
  const now = new Date();

  // The other demo orgs are independent of the udemy prerequisites below, so
  // seed them first: every org that received courses gets a path.
  if (!selectedOrganizationId || selectedOrganizationId === enterpriseOrgId) {
    await seedMinimalPath(
      {
        pathId: '7e000001-0000-4000-8000-000000000001',
        publicId: 'Cp3Xy7qZ',
        slug: 'compliance-foundations',
        name: 'Compliance Foundations',
        description: 'A short sequential path pairing the mandatory HIPAA refresher with SOC 2 security basics.',
        sequentialUnlock: true,
        organizationId: enterpriseOrgId,
        adminUserId: enterpriseAdminUserId,
        studentUserId: enterpriseStudentUserId,
        tutorMemberId: '7e000001-0000-4000-8000-000000000021',
        studentMemberId: '7e000001-0000-4000-8000-000000000022',
        courses: [
          {
            pathCourseId: '7e000001-0000-4000-8000-000000000011',
            courseId: HIPAA_COURSE_ID,
            groupId: HIPAA_GROUP_ID,
            groupMemberFallbackId: '7e000001-0000-4000-8000-000000000031',
            order: 1,
            outcomes: ['Handle PHI according to HIPAA rules']
          },
          {
            pathCourseId: '7e000001-0000-4000-8000-000000000012',
            courseId: SOC2_COURSE_ID,
            groupId: SOC2_GROUP_ID,
            groupMemberFallbackId: '7e000001-0000-4000-8000-000000000032',
            order: 2,
            outcomes: ['Apply SOC 2 security fundamentals']
          }
        ]
      },
      now
    );
  }

  if (!selectedOrganizationId || selectedOrganizationId === earlyAdopterOrgId) {
    await seedMinimalPath(
      {
        pathId: '8a000001-0000-4000-8000-000000000001',
        publicId: 'Sk5Pm9wQ',
        slug: 'product-management-essentials',
        name: 'Product Management Essentials',
        description: 'A starter path built around Product Management Fundamentals.',
        sequentialUnlock: false,
        organizationId: earlyAdopterOrgId,
        adminUserId: earlyAdopterAdminUserId,
        studentUserId: earlyAdopterStudentUserId,
        tutorMemberId: '8a000001-0000-4000-8000-000000000021',
        studentMemberId: '8a000001-0000-4000-8000-000000000022',
        courses: [
          {
            pathCourseId: '8a000001-0000-4000-8000-000000000011',
            courseId: earlyAdopterCourseId,
            groupId: earlyAdopterGroupId,
            groupMemberFallbackId: '8a000001-0000-4000-8000-000000000031',
            order: 1,
            outcomes: ['Ship products with core PM practices']
          }
        ]
      },
      now
    );
  }

  if (selectedOrganizationId && selectedOrganizationId !== testOrgId) {
    return;
  }

  const courseRows = await db
    .select()
    .from(course)
    .where(inArray(course.id, [mvcCourseId, reactCourseId, pandasCourseId]));

  if (courseRows.length < 3) {
    console.log('⏭️  Skipping udemy learning paths: seed the udemy-test courses first (pnpm seed --courses).');

    return;
  }

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
    console.log(`⏭️  Skipping udemy learning paths: courses are missing groups (${missingGroups.join(', ')}).`);

    return;
  }

  // Extra courses for the six-course pro path. Created here (not in the shared
  // course seed) so this seed works standalone; skipped when already present.
  const EXTRA_PATH_COURSES = [
    {
      key: 'js',
      courseId: '9a000003-0000-4000-8000-000000000001',
      groupId: '9a000003-0000-4000-8000-000000000011',
      title: 'JavaScript in Depth',
      slug: 'javascript-in-depth',
      description: 'Master JavaScript fundamentals: scope, closures, arrays, objects, and asynchronous code.',
      lessons: ['Functions & Scope', 'Arrays & Objects', 'Async JavaScript'],
      exercises: ['JS Basics Quiz', 'Objects Drill', 'Async Challenge']
    },
    {
      key: 'ts',
      courseId: '9a000003-0000-4000-8000-000000000002',
      groupId: '9a000003-0000-4000-8000-000000000012',
      title: 'TypeScript Essentials',
      slug: 'typescript-essentials',
      description: 'Add static typing to JavaScript: types, interfaces, generics, and tooling.',
      lessons: ['Types & Interfaces', 'Generics', 'Tooling & Config'],
      exercises: ['Types Quiz', 'Generics Drill', 'Config Challenge']
    },
    {
      key: 'testing',
      courseId: '9a000003-0000-4000-8000-000000000003',
      groupId: '9a000003-0000-4000-8000-000000000013',
      title: 'Testing JavaScript Apps',
      slug: 'testing-javascript-apps',
      description: 'Test with confidence: unit tests, mocks, and end-to-end basics.',
      lessons: ['Unit Testing Basics', 'Mocks & Stubs', 'End-to-End Intro'],
      exercises: ['Unit Test Quiz', 'Mocking Drill', 'E2E Challenge']
    }
  ] as const;

  for (const extra of EXTRA_PATH_COURSES) {
    const [existingCourse] = await db
      .select({ id: course.id })
      .from(course)
      .where(eq(course.id, extra.courseId))
      .limit(1);

    if (existingCourse) {
      continue;
    }

    await db.insert(group).values({ id: extra.groupId, name: extra.title, organizationId: testOrgId });

    await db.insert(course).values({
      id: extra.courseId,
      title: extra.title,
      description: extra.description,
      overview: extra.description,
      groupId: extra.groupId,
      isTemplate: true,
      logo: '',
      slug: extra.slug,
      isPublished: true,
      status: 'ACTIVE'
    });

    const contentIds = EXTRA_COURSE_CONTENT_IDS[extra.key];

    await db.insert(lesson).values(
      contentIds.lessons.map((lessonId, index) => ({
        id: lessonId,
        courseId: extra.courseId,
        title: extra.lessons[index],
        order: index + 1
      }))
    );

    await db.insert(exercise).values(
      contentIds.exercises.map((exerciseId, index) => ({
        id: exerciseId,
        courseId: extra.courseId,
        title: extra.exercises[index],
        order: index + 1
      }))
    );
  }

  courseIdsByKey = {
    ...courseIdsByKey,
    js: EXTRA_PATH_COURSES[0].courseId,
    ts: EXTRA_PATH_COURSES[1].courseId,
    testing: EXTRA_PATH_COURSES[2].courseId
  };
  courseGroupIdsByKey = {
    ...courseGroupIdsByKey,
    js: EXTRA_PATH_COURSES[0].groupId,
    ts: EXTRA_PATH_COURSES[1].groupId,
    testing: EXTRA_PATH_COURSES[2].groupId
  };

  courseIdsByKey = {
    mvc: mvcCourseId,
    react: reactCourseId,
    pandas: pandasCourseId,
    js: EXTRA_PATH_COURSES[0]!.courseId,
    ts: EXTRA_PATH_COURSES[1]!.courseId,
    testing: EXTRA_PATH_COURSES[2]!.courseId
  };
  courseGroupIdsByKey = {
    mvc: groupIdsByCourseKey.get('mvc')!,
    react: groupIdsByCourseKey.get('react')!,
    pandas: groupIdsByCourseKey.get('pandas')!,
    js: EXTRA_PATH_COURSES[0]!.groupId,
    ts: EXTRA_PATH_COURSES[1]!.groupId,
    testing: EXTRA_PATH_COURSES[2]!.groupId
  };

  // Seeded exercise rows predate the denormalized exercise.courseId column, but
  // the app's per-course progress stats resolve exercises through it.
  await backfillExerciseCourseIds([mvcCourseId, reactCourseId, pandasCourseId]);

  if (!(await demoCourseContentExists([mvcCourseId, reactCourseId, pandasCourseId]))) {
    console.log(
      '⏭️  Skipping udemy learning paths: seed lessons and exercises first (pnpm seed --lessons --exercises).'
    );

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
    const groupMemberIds = await seedPersonaAccounts(persona, testOrgId, now);
    await seedPersonaProgress({ ...persona, groupMemberIds }, now);
  }

  console.log(`   ✓ Seeded ${PERSONAS.length} path learner persona(s) with progress`);

  // 4. Path members, truth-backed progress caches, and member rollups
  const bootcampSeed = PATH_SEEDS[0];
  const dataSkillsSeed = PATH_SEEDS[1];
  const showcaseSeed = PATH_SEEDS[3];
  const proSeed = PATH_SEEDS[4];
  const bootcampCourses = pathCoursesByPathId.get(bootcampSeed.id) ?? [];
  const dataSkillsCourses = pathCoursesByPathId.get(dataSkillsSeed.id) ?? [];

  /** Bootcamp member row per persona profile. Every PERSONAS entry must appear here. */
  const BOOTCAMP_PERSONA_MEMBER_IDS: Record<string, string> = {
    [MAYA_PROFILE_ID]: PATH_MEMBER_IDS.bootcampMaya,
    [DANIEL_PROFILE_ID]: PATH_MEMBER_IDS.bootcampDaniel,
    [LUCIA_PROFILE_ID]: PATH_MEMBER_IDS.bootcampLucia,
    [PRIYA_NAIR_PROFILE_ID]: PATH_MEMBER_IDS.bootcampPriyaNair,
    [TOMAS_SILVA_PROFILE_ID]: PATH_MEMBER_IDS.bootcampTomasSilva,
    [AISHA_BELLO_PROFILE_ID]: PATH_MEMBER_IDS.bootcampAishaBello,
    [RAVI_PATEL_PROFILE_ID]: PATH_MEMBER_IDS.bootcampRaviPatel,
    [ELENA_PETROVA_PROFILE_ID]: PATH_MEMBER_IDS.bootcampElenaPetrova,
    [KWAME_MENSAH_PROFILE_ID]: PATH_MEMBER_IDS.bootcampKwameMensah,
    [YUKI_TANAKA_PROFILE_ID]: PATH_MEMBER_IDS.bootcampYukiTanaka,
    [OMAR_HADDAD_PROFILE_ID]: PATH_MEMBER_IDS.bootcampOmarHaddad,
    [ZOE_KIM_PROFILE_ID]: PATH_MEMBER_IDS.bootcampZoeKim,
    [LIAM_MURPHY_PROFILE_ID]: PATH_MEMBER_IDS.bootcampLiamMurphy,
    [SOFIA_ROSSI_PROFILE_ID]: PATH_MEMBER_IDS.bootcampSofiaRossi,
    [NOAH_SMITH_PROFILE_ID]: PATH_MEMBER_IDS.bootcampNoahSmith,
    [EMMA_WILSON_PROFILE_ID]: PATH_MEMBER_IDS.bootcampEmmaWilson,
    [AVA_JOHNSON_PROFILE_ID]: PATH_MEMBER_IDS.bootcampAvaJohnson,
    [LUCAS_BROWN_PROFILE_ID]: PATH_MEMBER_IDS.bootcampLucasBrown,
    [MIA_DAVIS_PROFILE_ID]: PATH_MEMBER_IDS.bootcampMiaDavis,
    [ETHAN_MOORE_PROFILE_ID]: PATH_MEMBER_IDS.bootcampEthanMoore,
    [ISLA_TAYLOR_PROFILE_ID]: PATH_MEMBER_IDS.bootcampIslaTaylor,
    [OLIVER_ANDERSON_PROFILE_ID]: PATH_MEMBER_IDS.bootcampOliverAnderson,
    [AMELIA_THOMAS_PROFILE_ID]: PATH_MEMBER_IDS.bootcampAmeliaThomas
  };

  /** Showcase member rows keyed by persona profile (cert-only funnel tableau). */
  const SHOWCASE_PERSONA_MEMBER_IDS: Record<string, string> = {
    [GRACE_LEE_PROFILE_ID]: PATH_MEMBER_IDS.showcaseGraceLee,
    [HENRY_ADAMS_PROFILE_ID]: PATH_MEMBER_IDS.showcaseHenryAdams,
    [CHLOE_MARTIN_PROFILE_ID]: PATH_MEMBER_IDS.showcaseChloeMartin
  };

  /** Pro-path member rows keyed by persona profile (six-course funnel tableau). */
  const PRO_PERSONA_MEMBER_IDS: Record<string, string> = {
    [FELIX_GRANT_PROFILE_ID]: PATH_MEMBER_IDS.proFelixGrant,
    [HANNAH_COLE_PROFILE_ID]: PATH_MEMBER_IDS.proHannahCole,
    [IVAN_PETROV_PROFILE_ID]: PATH_MEMBER_IDS.proIvanPetrov,
    [JULIA_ROSS_PROFILE_ID]: PATH_MEMBER_IDS.proJuliaRoss,
    [KEVIN_LIN_PROFILE_ID]: PATH_MEMBER_IDS.proKevinLin,
    [LAURA_GOMEZ_PROFILE_ID]: PATH_MEMBER_IDS.proLauraGomez,
    [MARCO_RUIZ_PROFILE_ID]: PATH_MEMBER_IDS.proMarcoRuiz,
    [NADIA_ALI_PROFILE_ID]: PATH_MEMBER_IDS.proNadiaAli,
    [OWEN_REED_PROFILE_ID]: PATH_MEMBER_IDS.proOwenReed,
    [PAULA_FOX_PROFILE_ID]: PATH_MEMBER_IDS.proPaulaFox,
    [QUINN_BELL_PROFILE_ID]: PATH_MEMBER_IDS.proQuinnBell,
    [ROSA_DIAZ_PROFILE_ID]: PATH_MEMBER_IDS.proRosaDiaz,
    [SAM_CARTER_PROFILE_ID]: PATH_MEMBER_IDS.proSamCarter,
    [TINA_NGUYEN_PROFILE_ID]: PATH_MEMBER_IDS.proTinaNguyen,
    [UMAR_FAROUK_PROFILE_ID]: PATH_MEMBER_IDS.proUmarFarouk
  };

  /** Certificate issue dates for pro-path completers. */
  const PRO_COMPLETED_DAYS: Record<string, number> = {
    [OWEN_REED_PROFILE_ID]: 10,
    [PAULA_FOX_PROFILE_ID]: 10
  };

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
    ...PERSONAS.filter((persona) => BOOTCAMP_PERSONA_MEMBER_IDS[persona.profileId] !== undefined).map((persona) => ({
      id: BOOTCAMP_PERSONA_MEMBER_IDS[persona.profileId] as string,
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
    .where(
      inArray(learningPathMember.learningPathId, [bootcampSeed.id, dataSkillsSeed.id, showcaseSeed.id, proSeed.id])
    );

  const existingMemberIdByKey = new Map<string, string>();

  for (const existingMember of existingPathMembers) {
    const memberKey = existingMember.profileId
      ? `${existingMember.learningPathId}-${existingMember.profileId}`
      : `${existingMember.learningPathId}-email:${existingMember.email}`;

    existingMemberIdByKey.set(memberKey, existingMember.id);
  }

  const proMembers: PathMemberSeed[] = PERSONAS.filter(
    (persona) => PRO_PERSONA_MEMBER_IDS[persona.profileId] !== undefined
  ).map((persona) => ({
    id: PRO_PERSONA_MEMBER_IDS[persona.profileId] as string,
    profileId: persona.profileId,
    email: null,
    roleId: ROLE.STUDENT,
    enrolledDaysAgo: persona.enrolledDaysAgo,
    activityDaysAgo: persona.activityDaysAgo,
    completedDaysAgo: PRO_COMPLETED_DAYS[persona.profileId] ?? null
  }));

  const showcaseMembers: PathMemberSeed[] = PERSONAS.filter(
    (persona) => SHOWCASE_PERSONA_MEMBER_IDS[persona.profileId] !== undefined
  ).map((persona) => ({
    id: SHOWCASE_PERSONA_MEMBER_IDS[persona.profileId] as string,
    profileId: persona.profileId,
    email: null,
    roleId: ROLE.STUDENT,
    enrolledDaysAgo: persona.enrolledDaysAgo,
    activityDaysAgo: persona.activityDaysAgo,
    completedDaysAgo: 10
  }));

  for (const [pathSeed, members] of [
    [bootcampSeed, bootcampMembers],
    [dataSkillsSeed, dataSkillsMembers],
    [showcaseSeed, showcaseMembers],
    [proSeed, proMembers]
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

  console.log(
    `   ✓ Seeded ${bootcampMembers.length + dataSkillsMembers.length + showcaseMembers.length + proMembers.length} path member(s) with progress caches`
  );

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
    { pathSeed: dataSkillsSeed, members: dataSkillsMembers, courses: dataSkillsCourses },
    {
      pathSeed: showcaseSeed,
      members: showcaseMembers,
      courses: pathCoursesByPathId.get(showcaseSeed.id) ?? []
    },
    { pathSeed: proSeed, members: proMembers, courses: pathCoursesByPathId.get(proSeed.id) ?? [] }
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
        inArray(courseEnrollmentGrant.learningPathId, [bootcampSeed.id, dataSkillsSeed.id, showcaseSeed.id, proSeed.id])
      )
    );

  console.log(`   ✓ Recorded ${grantCount} new LEARNING_PATH enrollment grant(s) (${totalPathGrants.length} total)`);
}

// ─── Minimal paths for the other demo orgs ───────────────────────────────
// One small published path per course-bearing demo org (tutor + student
// members, NOT_STARTED caches, LEARNING_PATH grants). Fixed ids follow the
// same convention as the udemy tableau above.

interface MinimalPathCoursePlan {
  pathCourseId: string;
  courseId: string;
  groupId: string;
  groupMemberFallbackId: string;
  order: number;
  outcomes: string[];
}

interface MinimalPathPlan {
  pathId: string;
  publicId: string;
  slug: string;
  name: string;
  description: string;
  sequentialUnlock: boolean;
  organizationId: string;
  adminUserId: string;
  studentUserId: string;
  tutorMemberId: string;
  studentMemberId: string;
  courses: MinimalPathCoursePlan[];
}

/** Backfills the denormalized exercise.courseId from the parent lesson. */
async function backfillExerciseCourseIds(courseIds: string[]) {
  await db.execute(sql`
    UPDATE exercise AS e
    SET course_id = l.course_id
    FROM lesson AS l
    WHERE e.lesson_id = l.id
      AND l.course_id IN (${sql.join(courseIds, sql`, `)})
      AND e.course_id IS NULL
  `);
}

async function seedMinimalPath(plan: MinimalPathPlan, now: Date) {
  const courseIds = plan.courses.map((plannedCourse) => plannedCourse.courseId);
  const courseRows = await db.select({ id: course.id }).from(course).where(inArray(course.id, courseIds));

  if (courseRows.length < courseIds.length) {
    console.log(`⏭️  Skipping ${plan.slug}: seed this organization's courses first.`);

    return;
  }

  const profileRows = await db
    .select({ id: profile.id })
    .from(profile)
    .where(inArray(profile.id, [plan.adminUserId, plan.studentUserId]));

  if (profileRows.length < 2) {
    console.log(`⏭️  Skipping ${plan.slug}: seed users and profiles first.`);

    return;
  }

  await backfillExerciseCourseIds(courseIds);

  await db
    .insert(learningPath)
    .values({
      id: plan.pathId,
      publicId: plan.publicId,
      organizationId: plan.organizationId,
      name: plan.name,
      slug: plan.slug,
      description: plan.description,
      coverImage: null,
      isPublished: true,
      difficulty: 'BEGINNER' as const,
      estimatedDurationMinutes: 120,
      cost: 0,
      currency: 'USD',
      showSavings: false,
      sequentialUnlock: plan.sequentialUnlock,
      selfEnrollment: true,
      autoEnroll: true,
      certificateEnabled: false,
      certificateTitle: null,
      certificateIssuer: null,
      certificateDesign: {},
      landingPage: {
        headline: plan.name,
        subheadline: plan.description,
        visitorAccess: 'preview' as const
      },
      courseOrderSetAt: isoDaysAgo(now, 10),
      createdByProfileId: null,
      createdAt: isoDaysAgo(now, 10),
      updatedAt: isoDaysAgo(now, 2)
    })
    .onConflictDoNothing();

  for (const plannedCourse of plan.courses) {
    await db
      .insert(learningPathCourse)
      .values({
        id: plannedCourse.pathCourseId,
        learningPathId: plan.pathId,
        courseId: plannedCourse.courseId,
        order: plannedCourse.order,
        outcomes: plannedCourse.outcomes
      })
      .onConflictDoNothing();
  }

  const persistedCourses = await db
    .select({
      id: learningPathCourse.id,
      courseId: learningPathCourse.courseId,
      order: learningPathCourse.order
    })
    .from(learningPathCourse)
    .where(and(eq(learningPathCourse.learningPathId, plan.pathId), isNull(learningPathCourse.removedAt)))
    .orderBy(learningPathCourse.order);

  const lessonRows = await db
    .select({ id: lesson.id, courseId: lesson.courseId })
    .from(lesson)
    .where(inArray(lesson.courseId, courseIds));
  const lessonIdsByCourseId = new Map<string, string[]>();

  for (const lessonRow of lessonRows) {
    const lessonIds = lessonIdsByCourseId.get(lessonRow.courseId) ?? [];
    lessonIds.push(lessonRow.id);
    lessonIdsByCourseId.set(lessonRow.courseId, lessonIds);
  }

  const exerciseCountByLessonId = new Map<string, number>();
  const allLessonIds = lessonRows.map((lessonRow) => lessonRow.id);

  if (allLessonIds.length > 0) {
    const exerciseRows = await db
      .select({ lessonId: exercise.lessonId })
      .from(exercise)
      .where(inArray(exercise.lessonId, allLessonIds));

    for (const exerciseRow of exerciseRows) {
      if (!exerciseRow.lessonId) {
        continue;
      }

      exerciseCountByLessonId.set(exerciseRow.lessonId, (exerciseCountByLessonId.get(exerciseRow.lessonId) ?? 0) + 1);
    }
  }

  const firstCourseId = persistedCourses[0]?.courseId ?? null;
  const memberPlans = [
    { id: plan.tutorMemberId, profileId: plan.adminUserId, roleId: ROLE.TUTOR, enrolledDaysAgo: 30 },
    { id: plan.studentMemberId, profileId: plan.studentUserId, roleId: ROLE.STUDENT, enrolledDaysAgo: 20 }
  ];

  for (const memberPlan of memberPlans) {
    await db
      .insert(learningPathMember)
      .values({
        id: memberPlan.id,
        learningPathId: plan.pathId,
        profileId: memberPlan.profileId,
        email: null,
        roleId: memberPlan.roleId,
        enrolledAt: isoDaysAgo(now, memberPlan.enrolledDaysAgo),
        status: 'NOT_STARTED',
        progressPercent: 0,
        completedCourseCount: 0,
        currentCourseId: firstCourseId
      })
      .onConflictDoNothing();
  }

  const persistedMembers = await db
    .select({ id: learningPathMember.id, profileId: learningPathMember.profileId })
    .from(learningPathMember)
    .where(eq(learningPathMember.learningPathId, plan.pathId));
  const memberIdByProfileId = new Map(
    persistedMembers
      .filter((persistedMember) => persistedMember.profileId)
      .map((persistedMember) => [persistedMember.profileId as string, persistedMember.id])
  );

  for (const memberPlan of memberPlans) {
    // Reuse the row that is already there (fixed ids differ only on a hand-created membership).
    const memberId = memberIdByProfileId.get(memberPlan.profileId);

    if (!memberId) {
      continue;
    }

    for (const persistedCourse of persistedCourses) {
      const isFirstCourse = persistedCourse.courseId === firstCourseId;
      const status = isFirstCourse || !plan.sequentialUnlock ? 'NOT_STARTED' : 'LOCKED';
      const courseLessonIds = lessonIdsByCourseId.get(persistedCourse.courseId) ?? [];
      const lessonsTotal = courseLessonIds.length;
      const exercisesTotal = courseLessonIds.reduce(
        (total, lessonId) => total + (exerciseCountByLessonId.get(lessonId) ?? 0),
        0
      );

      await db
        .insert(learningPathMemberCourse)
        .values({
          learningPathMemberId: memberId,
          learningPathCourseId: persistedCourse.id,
          status,
          progressPercent: 0,
          lessonsCompleted: 0,
          lessonsTotal,
          exercisesCompleted: 0,
          exercisesTotal,
          unlockedAt: status === 'LOCKED' ? null : isoDaysAgo(now, memberPlan.enrolledDaysAgo - 1),
          startedAt: null,
          completedAt: null
        })
        .onConflictDoUpdate({
          target: [learningPathMemberCourse.learningPathMemberId, learningPathMemberCourse.learningPathCourseId],
          set: {
            status,
            progressPercent: 0,
            lessonsTotal,
            exercisesTotal,
            updatedAt: now.toISOString()
          }
        });
    }
  }

  let grantCount = 0;

  for (const plannedCourse of plan.courses) {
    const groupMemberId = await ensureGroupMember(
      plannedCourse.groupId,
      plan.studentUserId,
      plannedCourse.groupMemberFallbackId,
      now
    );
    const insertedGrants = await db
      .insert(courseEnrollmentGrant)
      .values({
        groupmemberId: groupMemberId,
        courseId: plannedCourse.courseId,
        profileId: plan.studentUserId,
        source: 'LEARNING_PATH' as const,
        learningPathId: plan.pathId,
        grantedByProfileId: plan.adminUserId
      })
      .onConflictDoNothing()
      .returning({ id: courseEnrollmentGrant.id });

    grantCount += insertedGrants.length;
  }

  console.log(`   ✓ Seeded learning path ${plan.slug} with ${persistedCourses.length} course(s)`);
  console.log(`   ✓ Recorded ${grantCount} new LEARNING_PATH enrollment grant(s) for ${plan.slug}`);
}
