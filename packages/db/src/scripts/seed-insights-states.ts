import 'dotenv/config';

import type { PgTable } from 'drizzle-orm/pg-core';
import { and, eq, inArray } from 'drizzle-orm';

import type { AnswerData } from '@cio/question-types';

import {
  account,
  analyticsLoginEvents,
  cohort,
  cohortCourse,
  cohortGoal,
  cohortGoalAssignment,
  cohortMember,
  course,
  courseCertificateIssue,
  courseCompletionRecord,
  courseSection,
  db,
  exercise,
  group,
  groupAttendance,
  groupmember,
  lesson,
  lessonCompletion,
  lessonVideoProgress,
  option,
  organization,
  organizationPlan,
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

const ORG_SITE_NAME = 'insights-states';
const ORG_NAME = 'Insights States';
const EMAIL_DOMAIN = 'insights-states.demo';
const PASSWORD_HASH = '$2a$10$dgxySj.k12gDKhLx7X4x6./J.Nzhz7WQrwh5lkjLKwIwWW4o5GJcW';

const ROLE_ADMIN = 1;
const ROLE_TUTOR = 2;
const ROLE_STUDENT = 3;
const DAY_MS = 86_400_000;
const NOW = Date.now();

const ORG_ID = seedId(0x1e000001, 1);

type CourseKey =
  | 'lead'
  | 'data'
  | 'support'
  | 'compliance'
  | 'empty'
  | 'archived'
  | 'product'
  | 'security'
  | 'comm'
  | 'sales'
  | 'finance'
  | 'ops'
  | 'ai';
type CohortKey =
  | 'full'
  | 'completed'
  | 'pending'
  | 'empty'
  | 'empty-course'
  | 'no-courses'
  | 'at-risk'
  | 'archived'
  | 'many-courses'
  | 'dept-eng'
  | 'dept-sales'
  | 'dept-product'
  | 'dept-design'
  | 'dept-support'
  | 'dept-marketing'
  | 'dept-finance'
  | 'dept-ops';
type LessonPolicy = 'video_watch' | 'live';
type ExercisePolicy = 'passed' | 'submitted';
type GradingState = 'completed' | 'awaiting_manual';

type Attempt = {
  score: number;
  daysAgo: number;
  gradingState?: GradingState;
};

type CoursePlan = {
  completedLessons: string[];
  attempts: Record<string, Attempt[]>;
  completionDaysAgo?: number;
  certified?: boolean;
  complianceRecord?: {
    status: string;
    dueDaysAgo: number;
    completedDaysAgo?: number;
  };
};

type StudentDef = {
  key: string;
  fullname: string;
  username: string;
  email: string;
  cohortKeys: CohortKey[];
  courses: CourseKey[];
  coursePlans: Partial<Record<CourseKey, CoursePlan>>;
  joinedDaysAgo: number;
  lastLoginDaysAgo: number | null;
  loginDaysAgo: number[];
  orgStatus?: 'ACTIVE' | 'DEACTIVATED' | 'ARCHIVED';
};

type LessonDef = {
  key: string;
  title: string;
  sectionKey: string | null;
  order: number;
  policy: LessonPolicy;
};

type ExerciseDef = {
  key: string;
  title: string;
  sectionKey: string | null;
  order: number;
  policy: ExercisePolicy;
  passThreshold: number | null;
  dueDaysAgo: number | null;
};

type CourseDef = {
  key: CourseKey;
  title: string;
  slug: string;
  grouped: boolean;
  status: 'ACTIVE' | 'ARCHIVED';
  sections: Array<{ key: string; title: string; order: number }>;
  lessons: LessonDef[];
  exercises: ExerciseDef[];
  compliance?: boolean;
};

type CohortDef = {
  key: CohortKey;
  name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  createdAtDaysAgo: number;
  courses: CourseKey[];
};

type PersonDef = {
  id: string;
  fullname: string;
  username: string;
  email: string;
  roleId: number;
  joinedDaysAgo: number;
  lastLoginDaysAgo: number | null;
  loginDaysAgo: number[];
  orgStatus: 'ACTIVE' | 'DEACTIVATED' | 'ARCHIVED';
};

function seedId(prefix: number, index: number): string {
  return `${prefix.toString(16).padStart(8, '0')}-0000-4000-8000-${index.toString(16).padStart(12, '0')}`;
}

function isoDaysAgo(days: number, minuteOffset = 0): string {
  return new Date(NOW - days * DAY_MS + minuteOffset * 60_000).toISOString();
}

function isoDaysFromNow(days: number, minuteOffset = 0): string {
  return new Date(NOW + days * DAY_MS + minuteOffset * 60_000).toISOString();
}

function dateDaysAgo(days: number): string {
  return new Date(NOW - days * DAY_MS).toISOString().slice(0, 10);
}

async function insertRows<TTable extends PgTable>(
  table: TTable,
  rows: TTable['$inferInsert'][],
  chunkSize = 500
): Promise<void> {
  for (let offset = 0; offset < rows.length; offset += chunkSize) {
    await db.insert(table).values(rows.slice(offset, offset + chunkSize));
  }
}

const COURSES: CourseDef[] = [
  {
    key: 'lead',
    title: 'Leadership Essentials',
    slug: 'insights-states-leadership-essentials',
    grouped: true,
    status: 'ACTIVE',
    sections: [
      { key: 'lead-s1', title: 'Leading yourself', order: 1 },
      { key: 'lead-s2', title: 'Leading a team', order: 2 }
    ],
    lessons: [
      { key: 'lead-l1', title: 'Set a direction', sectionKey: 'lead-s1', order: 1, policy: 'video_watch' },
      { key: 'lead-l2', title: 'Live coaching clinic', sectionKey: 'lead-s1', order: 2, policy: 'live' },
      { key: 'lead-l3', title: 'Give useful feedback', sectionKey: 'lead-s2', order: 3, policy: 'video_watch' }
    ],
    exercises: [
      {
        key: 'lead-e1',
        title: 'Direction check',
        sectionKey: 'lead-s1',
        order: 1,
        policy: 'passed',
        passThreshold: 70,
        dueDaysAgo: null
      },
      {
        key: 'lead-e2',
        title: 'Feedback practice',
        sectionKey: 'lead-s2',
        order: 2,
        policy: 'passed',
        passThreshold: 80,
        dueDaysAgo: null
      },
      {
        key: 'lead-e3',
        title: 'Leadership reflection',
        sectionKey: null,
        order: 3,
        policy: 'submitted',
        passThreshold: null,
        dueDaysAgo: null
      }
    ]
  },
  {
    key: 'data',
    title: 'Data Literacy',
    slug: 'insights-states-data-literacy',
    grouped: true,
    status: 'ACTIVE',
    sections: [
      { key: 'data-s1', title: 'Reading data', order: 1 },
      { key: 'data-s2', title: 'Using data', order: 2 }
    ],
    lessons: [
      { key: 'data-l1', title: 'Where numbers come from', sectionKey: 'data-s1', order: 1, policy: 'video_watch' },
      { key: 'data-l2', title: 'Spot misleading charts', sectionKey: 'data-s1', order: 2, policy: 'video_watch' },
      { key: 'data-l3', title: 'Live data review', sectionKey: 'data-s2', order: 3, policy: 'live' }
    ],
    exercises: [
      {
        key: 'data-e1',
        title: 'Read a chart',
        sectionKey: 'data-s1',
        order: 1,
        policy: 'submitted',
        passThreshold: null,
        dueDaysAgo: null
      },
      {
        key: 'data-e2',
        title: 'Compare two sources',
        sectionKey: 'data-s2',
        order: 2,
        policy: 'submitted',
        passThreshold: null,
        dueDaysAgo: null
      },
      {
        key: 'data-e3',
        title: 'Data review worksheet',
        sectionKey: 'data-s2',
        order: 3,
        policy: 'submitted',
        passThreshold: null,
        dueDaysAgo: 5
      }
    ]
  },
  {
    key: 'support',
    title: 'Customer Support',
    slug: 'insights-states-customer-support',
    grouped: false,
    status: 'ACTIVE',
    sections: [],
    lessons: [
      { key: 'support-l1', title: 'Listen for the real issue', sectionKey: null, order: 1, policy: 'video_watch' },
      { key: 'support-l2', title: 'Live escalation practice', sectionKey: null, order: 2, policy: 'live' }
    ],
    exercises: [
      {
        key: 'support-e1',
        title: 'Triage a ticket',
        sectionKey: null,
        order: 1,
        policy: 'passed',
        passThreshold: 60,
        dueDaysAgo: null
      },
      {
        key: 'support-e2',
        title: 'Write a resolution',
        sectionKey: null,
        order: 2,
        policy: 'passed',
        passThreshold: 70,
        dueDaysAgo: null
      }
    ]
  },
  {
    key: 'compliance',
    title: 'Compliance Basics',
    slug: 'insights-states-compliance-basics',
    grouped: true,
    status: 'ACTIVE',
    sections: [{ key: 'compliance-s1', title: 'Annual requirements', order: 1 }],
    lessons: [
      {
        key: 'compliance-l1',
        title: 'Why compliance matters',
        sectionKey: 'compliance-s1',
        order: 1,
        policy: 'video_watch'
      },
      {
        key: 'compliance-l2',
        title: 'Report an incident',
        sectionKey: 'compliance-s1',
        order: 2,
        policy: 'video_watch'
      }
    ],
    exercises: [
      {
        key: 'compliance-e1',
        title: 'Policy knowledge check',
        sectionKey: 'compliance-s1',
        order: 1,
        policy: 'passed',
        passThreshold: 80,
        dueDaysAgo: null
      },
      {
        key: 'compliance-e2',
        title: 'Incident report',
        sectionKey: 'compliance-s1',
        order: 2,
        policy: 'submitted',
        passThreshold: null,
        dueDaysAgo: null
      }
    ],
    compliance: true
  },
  {
    key: 'empty',
    title: 'Empty Course',
    slug: 'insights-states-empty-course',
    grouped: true,
    status: 'ACTIVE',
    sections: [{ key: 'empty-s1', title: 'Getting started', order: 1 }],
    lessons: [{ key: 'empty-l1', title: 'Welcome', sectionKey: 'empty-s1', order: 1, policy: 'video_watch' }],
    exercises: [
      {
        key: 'empty-e1',
        title: 'Welcome check',
        sectionKey: 'empty-s1',
        order: 1,
        policy: 'passed',
        passThreshold: 50,
        dueDaysAgo: null
      }
    ]
  },
  {
    key: 'archived',
    title: 'Archived Course',
    slug: 'insights-states-archived-course',
    grouped: true,
    status: 'ARCHIVED',
    sections: [{ key: 'archived-s1', title: 'Archive', order: 1 }],
    lessons: [{ key: 'archived-l1', title: 'Old lesson', sectionKey: 'archived-s1', order: 1, policy: 'video_watch' }],
    exercises: [
      {
        key: 'archived-e1',
        title: 'Old check',
        sectionKey: 'archived-s1',
        order: 1,
        policy: 'submitted',
        passThreshold: null,
        dueDaysAgo: null
      }
    ]
  },
  {
    key: 'product',
    title: 'Product Thinking',
    slug: 'insights-states-product-thinking',
    grouped: true,
    status: 'ACTIVE',
    sections: [{ key: 'product-s1', title: 'Product strategy', order: 1 }],
    lessons: [
      { key: 'product-l1', title: 'Problem definition', sectionKey: 'product-s1', order: 1, policy: 'video_watch' }
    ],
    exercises: [
      {
        key: 'product-e1',
        title: 'Strategy check',
        sectionKey: 'product-s1',
        order: 1,
        policy: 'passed',
        passThreshold: 70,
        dueDaysAgo: null
      }
    ]
  },
  {
    key: 'security',
    title: 'Security Awareness',
    slug: 'insights-states-security-awareness',
    grouped: true,
    status: 'ACTIVE',
    sections: [{ key: 'security-s1', title: 'Security essentials', order: 1 }],
    lessons: [
      {
        key: 'security-l1',
        title: 'Phishing and passwords',
        sectionKey: 'security-s1',
        order: 1,
        policy: 'video_watch'
      }
    ],
    exercises: [
      {
        key: 'security-e1',
        title: 'Security assessment',
        sectionKey: 'security-s1',
        order: 1,
        policy: 'passed',
        passThreshold: 80,
        dueDaysAgo: null
      }
    ]
  },
  {
    key: 'comm',
    title: 'Effective Communication',
    slug: 'insights-states-effective-communication',
    grouped: true,
    status: 'ACTIVE',
    sections: [{ key: 'comm-s1', title: 'Writing and speaking', order: 1 }],
    lessons: [{ key: 'comm-l1', title: 'Clear messaging', sectionKey: 'comm-s1', order: 1, policy: 'video_watch' }],
    exercises: [
      {
        key: 'comm-e1',
        title: 'Communication exercise',
        sectionKey: 'comm-s1',
        order: 1,
        policy: 'passed',
        passThreshold: 70,
        dueDaysAgo: null
      }
    ]
  },
  {
    key: 'sales',
    title: 'Sales Fundamentals',
    slug: 'insights-states-sales-fundamentals',
    grouped: true,
    status: 'ACTIVE',
    sections: [{ key: 'sales-s1', title: 'Pipeline basics', order: 1 }],
    lessons: [{ key: 'sales-l1', title: 'Discovery calls', sectionKey: 'sales-s1', order: 1, policy: 'video_watch' }],
    exercises: [
      {
        key: 'sales-e1',
        title: 'Pitch evaluation',
        sectionKey: 'sales-s1',
        order: 1,
        policy: 'passed',
        passThreshold: 75,
        dueDaysAgo: null
      }
    ]
  },
  {
    key: 'finance',
    title: 'Financial Acumen',
    slug: 'insights-states-financial-acumen',
    grouped: true,
    status: 'ACTIVE',
    sections: [{ key: 'finance-s1', title: 'Budgeting & P&L', order: 1 }],
    lessons: [
      {
        key: 'finance-l1',
        title: 'Reading financial statements',
        sectionKey: 'finance-s1',
        order: 1,
        policy: 'video_watch'
      }
    ],
    exercises: [
      {
        key: 'finance-e1',
        title: 'Balance sheet quiz',
        sectionKey: 'finance-s1',
        order: 1,
        policy: 'passed',
        passThreshold: 70,
        dueDaysAgo: null
      }
    ]
  },
  {
    key: 'ops',
    title: 'Operations Management',
    slug: 'insights-states-operations-management',
    grouped: true,
    status: 'ACTIVE',
    sections: [{ key: 'ops-s1', title: 'Process design', order: 1 }],
    lessons: [{ key: 'ops-l1', title: 'Workflow optimization', sectionKey: 'ops-s1', order: 1, policy: 'video_watch' }],
    exercises: [
      {
        key: 'ops-e1',
        title: 'Ops scenario',
        sectionKey: 'ops-s1',
        order: 1,
        policy: 'passed',
        passThreshold: 70,
        dueDaysAgo: null
      }
    ]
  },
  {
    key: 'ai',
    title: 'AI Literacy',
    slug: 'insights-states-ai-literacy',
    grouped: true,
    status: 'ACTIVE',
    sections: [{ key: 'ai-s1', title: 'Prompt engineering', order: 1 }],
    lessons: [{ key: 'ai-l1', title: 'Working with LLMs', sectionKey: 'ai-s1', order: 1, policy: 'video_watch' }],
    exercises: [
      {
        key: 'ai-e1',
        title: 'Prompt evaluation',
        sectionKey: 'ai-s1',
        order: 1,
        policy: 'passed',
        passThreshold: 80,
        dueDaysAgo: null
      }
    ]
  }
];

const COHORTS: CohortDef[] = [
  {
    key: 'full',
    name: 'Full data cohort',
    description: 'Active students with a mix of completed, on-track, lagging and at-risk states.',
    status: 'ACTIVE',
    createdAtDaysAgo: 1,
    courses: ['lead', 'data', 'support', 'compliance']
  },
  {
    key: 'completed',
    name: 'Completed cohort',
    description: 'Everyone finished both courses and earned a certificate.',
    status: 'ACTIVE',
    createdAtDaysAgo: 2,
    courses: ['lead', 'support']
  },
  {
    key: 'pending',
    name: 'Pending invites cohort',
    description: 'One active student and two invites waiting to be accepted.',
    status: 'ACTIVE',
    createdAtDaysAgo: 3,
    courses: ['lead']
  },
  {
    key: 'empty',
    name: 'Empty cohort',
    description: 'A newly created cohort with no students or courses yet.',
    status: 'ACTIVE',
    createdAtDaysAgo: 4,
    courses: []
  },
  {
    key: 'no-courses',
    name: 'No courses cohort',
    description: 'Students are in the cohort but no course has been linked yet.',
    status: 'ACTIVE',
    createdAtDaysAgo: 5,
    courses: []
  },
  {
    key: 'at-risk',
    name: 'At risk cohort',
    description: 'Students with overdue compliance and exercise work.',
    status: 'ACTIVE',
    createdAtDaysAgo: 6,
    courses: ['data', 'compliance']
  },
  {
    key: 'archived',
    name: 'Archived cohort',
    description: 'Kept for history and excluded from current dashboards.',
    status: 'ARCHIVED',
    createdAtDaysAgo: 30,
    courses: ['archived']
  },
  {
    key: 'empty-course',
    name: 'Empty course cohort',
    description: 'A newly created cohort with no students that is already linked to a course.',
    status: 'ACTIVE',
    createdAtDaysAgo: 0,
    courses: ['lead']
  },
  {
    key: 'many-courses',
    name: 'Many courses cohort',
    description:
      'Cohort linked to 11 courses to exercise horizontal chart scrolling, table pagination, and searchable course combobox.',
    status: 'ACTIVE',
    createdAtDaysAgo: 1,
    courses: ['lead', 'data', 'support', 'compliance', 'product', 'security', 'comm', 'sales', 'finance', 'ops', 'ai']
  },
  {
    key: 'dept-eng',
    name: 'Engineering Cohort',
    description: 'Engineering department students taking shared Leadership Essentials.',
    status: 'ACTIVE',
    createdAtDaysAgo: 2,
    courses: ['lead']
  },
  {
    key: 'dept-sales',
    name: 'Sales Cohort',
    description: 'Sales team members taking Leadership Essentials and Sales Fundamentals.',
    status: 'ACTIVE',
    createdAtDaysAgo: 2,
    courses: ['lead', 'sales']
  },
  {
    key: 'dept-product',
    name: 'Product Cohort',
    description: 'Product team taking Leadership Essentials and Product Thinking.',
    status: 'ACTIVE',
    createdAtDaysAgo: 3,
    courses: ['lead', 'product']
  },
  {
    key: 'dept-design',
    name: 'Design Cohort',
    description: 'Design team taking Leadership Essentials.',
    status: 'ACTIVE',
    createdAtDaysAgo: 3,
    courses: ['lead']
  },
  {
    key: 'dept-support',
    name: 'Customer Support Cohort',
    description: 'Support team taking Leadership Essentials and Customer Support.',
    status: 'ACTIVE',
    createdAtDaysAgo: 4,
    courses: ['lead', 'support']
  },
  {
    key: 'dept-marketing',
    name: 'Marketing Cohort',
    description: 'Marketing team taking Leadership Essentials and Effective Communication.',
    status: 'ACTIVE',
    createdAtDaysAgo: 4,
    courses: ['lead', 'comm']
  },
  {
    key: 'dept-finance',
    name: 'Finance Cohort',
    description: 'Finance team taking Leadership Essentials and Financial Acumen.',
    status: 'ACTIVE',
    createdAtDaysAgo: 5,
    courses: ['lead', 'finance']
  },
  {
    key: 'dept-ops',
    name: 'Operations Cohort',
    description: 'Operations team taking Leadership Essentials and Operations Management.',
    status: 'ACTIVE',
    createdAtDaysAgo: 5,
    courses: ['lead', 'ops']
  }
];

const STUDENTS: StudentDef[] = [
  {
    key: 'complete-1',
    fullname: 'Aisha Bello',
    username: 'aisha-bello',
    email: `aisha@${EMAIL_DOMAIN}`,
    cohortKeys: ['completed'],
    courses: ['lead', 'support'],
    joinedDaysAgo: 60,
    lastLoginDaysAgo: 0,
    loginDaysAgo: [0, 1, 2, 4, 8, 15, 30, 60],
    coursePlans: {
      lead: {
        completedLessons: ['lead-l1', 'lead-l2', 'lead-l3'],
        attempts: {
          'lead-e1': [{ score: 95, daysAgo: 5 }],
          'lead-e2': [{ score: 90, daysAgo: 5 }],
          'lead-e3': [{ score: 80, daysAgo: 5 }]
        },
        completionDaysAgo: 2,
        certified: true
      },
      support: {
        completedLessons: ['support-l1', 'support-l2'],
        attempts: {
          'support-e1': [{ score: 90, daysAgo: 12 }],
          'support-e2': [{ score: 85, daysAgo: 12 }]
        },
        completionDaysAgo: 10,
        certified: true
      }
    }
  },
  {
    key: 'complete-2',
    fullname: 'Noah Kim',
    username: 'noah-kim',
    email: `noah@${EMAIL_DOMAIN}`,
    cohortKeys: ['completed'],
    courses: ['lead', 'support'],
    joinedDaysAgo: 80,
    lastLoginDaysAgo: 0,
    loginDaysAgo: [0, 1, 3, 10, 20, 40, 80],
    coursePlans: {
      lead: {
        completedLessons: ['lead-l1', 'lead-l2', 'lead-l3'],
        attempts: {
          'lead-e1': [{ score: 90, daysAgo: 12 }],
          'lead-e2': [{ score: 88, daysAgo: 12 }],
          'lead-e3': [{ score: 92, daysAgo: 12 }]
        },
        completionDaysAgo: 10,
        certified: true
      },
      support: {
        completedLessons: ['support-l1', 'support-l2'],
        attempts: {
          'support-e1': [{ score: 85, daysAgo: 45 }],
          'support-e2': [{ score: 80, daysAgo: 45 }]
        },
        completionDaysAgo: 40,
        certified: false
      }
    }
  },
  {
    key: 'complete-3',
    fullname: 'Amina Diallo',
    username: 'amina-diallo',
    email: `amina@${EMAIL_DOMAIN}`,
    cohortKeys: ['completed'],
    courses: ['lead', 'support'],
    joinedDaysAgo: 50,
    lastLoginDaysAgo: 0,
    loginDaysAgo: [0, 2, 5, 12, 25, 50],
    coursePlans: {
      lead: {
        completedLessons: ['lead-l1', 'lead-l2', 'lead-l3'],
        attempts: {
          'lead-e1': [{ score: 92, daysAgo: 4 }],
          'lead-e2': [{ score: 94, daysAgo: 4 }],
          'lead-e3': [{ score: 88, daysAgo: 4 }]
        },
        completionDaysAgo: 2,
        certified: true
      },
      support: {
        completedLessons: ['support-l1', 'support-l2'],
        attempts: {
          'support-e1': [{ score: 88, daysAgo: 4 }],
          'support-e2': [{ score: 90, daysAgo: 4 }]
        },
        completionDaysAgo: 2,
        certified: true
      }
    }
  },
  {
    key: 'on-track-1',
    fullname: 'Priya Raman',
    username: 'priya-raman',
    email: `priya@${EMAIL_DOMAIN}`,
    cohortKeys: ['full'],
    courses: ['lead', 'data', 'compliance'],
    joinedDaysAgo: 20,
    lastLoginDaysAgo: 0,
    loginDaysAgo: [0, 1, 3, 6, 12, 20],
    coursePlans: {
      lead: {
        completedLessons: ['lead-l1', 'lead-l3'],
        attempts: {
          'lead-e1': [{ score: 80, daysAgo: 10 }],
          'lead-e2': [{ score: 85, daysAgo: 10 }],
          'lead-e3': [{ score: 70, daysAgo: 10 }]
        },
        completionDaysAgo: 10
      },
      data: {
        completedLessons: ['data-l1', 'data-l2'],
        attempts: {
          'data-e1': [{ score: 75, daysAgo: 10 }],
          'data-e2': [{ score: 80, daysAgo: 10 }],
          'data-e3': [{ score: 70, daysAgo: 10 }]
        },
        completionDaysAgo: 10
      },
      compliance: {
        completedLessons: ['compliance-l1'],
        attempts: {
          'compliance-e1': [{ score: 85, daysAgo: 10 }],
          'compliance-e2': [{ score: 80, daysAgo: 10 }]
        },
        completionDaysAgo: 10,
        complianceRecord: { status: 'in_progress', dueDaysAgo: -30 }
      }
    }
  },
  {
    key: 'on-track-2',
    fullname: 'Lucas Moreau',
    username: 'lucas-moreau',
    email: `lucas@${EMAIL_DOMAIN}`,
    cohortKeys: ['full'],
    courses: ['lead', 'support'],
    joinedDaysAgo: 15,
    lastLoginDaysAgo: 0,
    loginDaysAgo: [0, 2, 5, 10, 15],
    coursePlans: {
      lead: {
        completedLessons: ['lead-l1'],
        attempts: {
          'lead-e1': [{ score: 75, daysAgo: 20 }],
          'lead-e2': [{ score: 80, daysAgo: 20 }],
          'lead-e3': [{ score: 70, daysAgo: 20 }]
        },
        completionDaysAgo: 20
      },
      support: {
        completedLessons: ['support-l1', 'support-l2'],
        attempts: {
          'support-e1': [{ score: 80, daysAgo: 20 }],
          'support-e2': [{ score: 75, daysAgo: 20 }]
        },
        completionDaysAgo: 20
      }
    }
  },
  {
    key: 'lagging-score',
    fullname: 'Sofia Lindgren',
    username: 'sofia-lindgren',
    email: `sofia@${EMAIL_DOMAIN}`,
    cohortKeys: ['full'],
    courses: ['lead', 'data'],
    joinedDaysAgo: 30,
    lastLoginDaysAgo: 0,
    loginDaysAgo: [0, 1, 4, 9, 15, 30],
    coursePlans: {
      lead: {
        completedLessons: ['lead-l1', 'lead-l3'],
        attempts: {
          'lead-e1': [{ score: 55, daysAgo: 15 }],
          'lead-e2': [{ score: 60, daysAgo: 15 }],
          'lead-e3': [{ score: 55, daysAgo: 15 }]
        },
        completionDaysAgo: 15
      },
      data: {
        completedLessons: ['data-l1', 'data-l2'],
        attempts: {
          'data-e1': [{ score: 55, daysAgo: 15 }],
          'data-e2': [{ score: 60, daysAgo: 15 }],
          'data-e3': [{ score: 55, daysAgo: 15 }]
        },
        completionDaysAgo: 15
      }
    }
  },
  {
    key: 'lagging-video',
    fullname: 'Tomas Herrera',
    username: 'tomas-herrera',
    email: `tomas@${EMAIL_DOMAIN}`,
    cohortKeys: ['full'],
    courses: ['lead', 'data'],
    joinedDaysAgo: 25,
    lastLoginDaysAgo: 0,
    loginDaysAgo: [0, 2, 7, 12, 25],
    coursePlans: {
      lead: {
        completedLessons: ['lead-l2'],
        attempts: {
          'lead-e1': [{ score: 80, daysAgo: 12 }],
          'lead-e2': [{ score: 85, daysAgo: 12 }],
          'lead-e3': [{ score: 80, daysAgo: 12 }]
        },
        completionDaysAgo: 12
      },
      data: {
        completedLessons: ['data-l3'],
        attempts: {
          'data-e1': [{ score: 80, daysAgo: 12 }],
          'data-e2': [{ score: 85, daysAgo: 12 }],
          'data-e3': [{ score: 80, daysAgo: 12 }]
        },
        completionDaysAgo: 12
      }
    }
  },
  {
    key: 'risk-inactive',
    fullname: 'Maya Fernandes',
    username: 'maya-fernandes',
    email: `maya@${EMAIL_DOMAIN}`,
    cohortKeys: ['full'],
    courses: ['lead', 'data'],
    joinedDaysAgo: 40,
    lastLoginDaysAgo: 10,
    loginDaysAgo: [10, 20, 35],
    coursePlans: {
      lead: {
        completedLessons: ['lead-l1', 'lead-l3'],
        attempts: {
          'lead-e1': [{ score: 80, daysAgo: 15 }],
          'lead-e2': [{ score: 85, daysAgo: 15 }],
          'lead-e3': [{ score: 80, daysAgo: 15 }]
        },
        completionDaysAgo: 15
      },
      data: {
        completedLessons: ['data-l1', 'data-l2'],
        attempts: {
          'data-e1': [{ score: 80, daysAgo: 15 }],
          'data-e2': [{ score: 85, daysAgo: 15 }],
          'data-e3': [{ score: 80, daysAgo: 15 }]
        },
        completionDaysAgo: 15
      }
    }
  },
  {
    key: 'risk-low-score',
    fullname: 'Kofi Mensah',
    username: 'kofi-mensah',
    email: `kofi@${EMAIL_DOMAIN}`,
    cohortKeys: ['full'],
    courses: ['lead', 'data'],
    joinedDaysAgo: 35,
    lastLoginDaysAgo: 0,
    loginDaysAgo: [0, 3, 8, 15, 35],
    coursePlans: {
      lead: {
        completedLessons: ['lead-l1', 'lead-l3'],
        attempts: {
          'lead-e1': [{ score: 30, daysAgo: 8 }],
          'lead-e2': [{ score: 40, daysAgo: 8 }],
          'lead-e3': [{ score: 35, daysAgo: 8 }]
        },
        completionDaysAgo: 8
      },
      data: {
        completedLessons: ['data-l1', 'data-l2'],
        attempts: {
          'data-e1': [{ score: 30, daysAgo: 8 }],
          'data-e2': [{ score: 40, daysAgo: 8 }],
          'data-e3': [{ score: 35, daysAgo: 8 }]
        },
        completionDaysAgo: 8
      }
    }
  },
  {
    key: 'risk-overdue-goal',
    fullname: 'Hannah Park',
    username: 'hannah-park',
    email: `hannah@${EMAIL_DOMAIN}`,
    cohortKeys: ['full'],
    courses: ['lead', 'data'],
    joinedDaysAgo: 30,
    lastLoginDaysAgo: 0,
    loginDaysAgo: [0, 1, 6, 12, 30],
    coursePlans: {
      lead: {
        completedLessons: ['lead-l1', 'lead-l3'],
        attempts: {
          'lead-e1': [{ score: 80, daysAgo: 6 }],
          'lead-e2': [{ score: 85, daysAgo: 6 }],
          'lead-e3': [{ score: 80, daysAgo: 6 }]
        },
        completionDaysAgo: 6
      },
      data: {
        completedLessons: ['data-l1', 'data-l2', 'data-l3'],
        attempts: {
          'data-e1': [{ score: 80, daysAgo: 6 }],
          'data-e2': [{ score: 85, daysAgo: 6 }],
          'data-e3': [{ score: 80, daysAgo: 6 }]
        },
        completionDaysAgo: 6
      }
    }
  },
  {
    key: 'risk-overdue-compliance',
    fullname: 'Daniel Adeyemi',
    username: 'daniel-adeyemi',
    email: `daniel@${EMAIL_DOMAIN}`,
    cohortKeys: ['at-risk'],
    courses: ['data', 'compliance'],
    joinedDaysAgo: 25,
    lastLoginDaysAgo: 0,
    loginDaysAgo: [0, 2, 7, 14, 25],
    coursePlans: {
      data: {
        completedLessons: ['data-l1', 'data-l2', 'data-l3'],
        attempts: {
          'data-e1': [{ score: 80, daysAgo: 7 }],
          'data-e2': [{ score: 85, daysAgo: 7 }],
          'data-e3': [{ score: 80, daysAgo: 7 }]
        },
        completionDaysAgo: 7
      },
      compliance: {
        completedLessons: ['compliance-l1'],
        attempts: {
          'compliance-e1': [{ score: 85, daysAgo: 7 }],
          'compliance-e2': [{ score: 80, daysAgo: 7 }]
        },
        completionDaysAgo: 7,
        complianceRecord: { status: 'not_started', dueDaysAgo: 5 }
      }
    }
  },
  {
    key: 'risk-overdue-exercise',
    fullname: 'Elena Rossi',
    username: 'elena-rossi',
    email: `elena@${EMAIL_DOMAIN}`,
    cohortKeys: ['at-risk'],
    courses: ['data', 'compliance'],
    joinedDaysAgo: 22,
    lastLoginDaysAgo: 0,
    loginDaysAgo: [0, 3, 7, 14, 22],
    coursePlans: {
      data: {
        completedLessons: ['data-l1', 'data-l2', 'data-l3'],
        attempts: {
          'data-e1': [{ score: 80, daysAgo: 7 }],
          'data-e2': [{ score: 85, daysAgo: 7 }]
        },
        completionDaysAgo: 7
      },
      compliance: {
        completedLessons: ['compliance-l1'],
        attempts: {
          'compliance-e1': [{ score: 85, daysAgo: 7 }],
          'compliance-e2': [{ score: 80, daysAgo: 7 }]
        },
        completionDaysAgo: 7,
        complianceRecord: { status: 'in_progress', dueDaysAgo: -30 }
      }
    }
  },
  {
    key: 'never-login',
    fullname: 'Omar Haddad',
    username: 'omar-haddad',
    email: `omar@${EMAIL_DOMAIN}`,
    cohortKeys: ['full'],
    courses: ['lead'],
    joinedDaysAgo: 45,
    lastLoginDaysAgo: null,
    loginDaysAgo: [],
    coursePlans: {
      lead: {
        completedLessons: [],
        attempts: {}
      }
    }
  },
  {
    key: 'no-attempts',
    fullname: 'Grace Chen',
    username: 'grace-chen',
    email: `grace@${EMAIL_DOMAIN}`,
    cohortKeys: ['full'],
    courses: ['lead'],
    joinedDaysAgo: 12,
    lastLoginDaysAgo: 0,
    loginDaysAgo: [0, 1, 4, 12],
    coursePlans: {
      lead: {
        completedLessons: ['lead-l1', 'lead-l3'],
        attempts: {},
        completionDaysAgo: 20
      }
    }
  },
  {
    key: 'awaiting-grade',
    fullname: 'Ravi Patel',
    username: 'ravi-patel',
    email: `ravi@${EMAIL_DOMAIN}`,
    cohortKeys: ['full'],
    courses: ['lead', 'data'],
    joinedDaysAgo: 18,
    lastLoginDaysAgo: 0,
    loginDaysAgo: [0, 1, 3, 10, 18],
    coursePlans: {
      lead: {
        completedLessons: ['lead-l1', 'lead-l3'],
        attempts: {
          'lead-e1': [{ score: 0, daysAgo: 3, gradingState: 'awaiting_manual' }],
          'lead-e2': [{ score: 85, daysAgo: 10 }],
          'lead-e3': [{ score: 80, daysAgo: 10 }]
        },
        completionDaysAgo: 10
      },
      data: {
        completedLessons: ['data-l1', 'data-l2'],
        attempts: {
          'data-e1': [{ score: 80, daysAgo: 10 }],
          'data-e2': [{ score: 0, daysAgo: 3, gradingState: 'awaiting_manual' }],
          'data-e3': [{ score: 80, daysAgo: 10 }]
        },
        completionDaysAgo: 10
      }
    }
  },
  {
    key: 'still-to-pass',
    fullname: 'Isabela Costa',
    username: 'isabela-costa',
    email: `isabela@${EMAIL_DOMAIN}`,
    cohortKeys: ['full'],
    courses: ['lead', 'data'],
    joinedDaysAgo: 20,
    lastLoginDaysAgo: 0,
    loginDaysAgo: [0, 2, 5, 10, 20],
    coursePlans: {
      lead: {
        completedLessons: ['lead-l1', 'lead-l2', 'lead-l3'],
        attempts: {
          'lead-e1': [{ score: 60, daysAgo: 5 }],
          'lead-e2': [{ score: 85, daysAgo: 10 }],
          'lead-e3': [{ score: 80, daysAgo: 10 }]
        },
        completionDaysAgo: 5
      },
      data: {
        completedLessons: ['data-l1', 'data-l2'],
        attempts: {
          'data-e1': [{ score: 80, daysAgo: 10 }],
          'data-e2': [{ score: 85, daysAgo: 10 }],
          'data-e3': [{ score: 80, daysAgo: 10 }]
        },
        completionDaysAgo: 10
      }
    }
  },
  {
    key: 'passed-after-retry',
    fullname: 'Yusuf Ahmed',
    username: 'yusuf-ahmed',
    email: `yusuf@${EMAIL_DOMAIN}`,
    cohortKeys: ['full'],
    courses: ['lead', 'data'],
    joinedDaysAgo: 28,
    lastLoginDaysAgo: 0,
    loginDaysAgo: [0, 1, 5, 15, 28, 40],
    coursePlans: {
      lead: {
        completedLessons: ['lead-l1', 'lead-l2', 'lead-l3'],
        attempts: {
          'lead-e1': [
            { score: 50, daysAgo: 40 },
            { score: 90, daysAgo: 5 }
          ],
          'lead-e2': [{ score: 90, daysAgo: 5 }],
          'lead-e3': [{ score: 85, daysAgo: 5 }]
        },
        completionDaysAgo: 5
      },
      data: {
        completedLessons: ['data-l1', 'data-l2'],
        attempts: {
          'data-e1': [{ score: 80, daysAgo: 5 }],
          'data-e2': [{ score: 85, daysAgo: 5 }],
          'data-e3': [{ score: 80, daysAgo: 5 }]
        },
        completionDaysAgo: 5
      }
    }
  },
  {
    key: 'new-joiner',
    fullname: 'Ethan Cole',
    username: 'ethan-cole',
    email: `ethan@${EMAIL_DOMAIN}`,
    cohortKeys: ['full'],
    courses: ['lead'],
    joinedDaysAgo: 2,
    lastLoginDaysAgo: 0,
    loginDaysAgo: [0, 2],
    coursePlans: {
      lead: {
        completedLessons: [],
        attempts: {}
      }
    }
  },
  {
    key: 'no-cohort',
    fullname: 'Nina Novak',
    username: 'nina-novak',
    email: `nina@${EMAIL_DOMAIN}`,
    cohortKeys: [],
    courses: ['lead', 'data'],
    joinedDaysAgo: 20,
    lastLoginDaysAgo: 0,
    loginDaysAgo: [0, 2, 10, 20],
    coursePlans: {
      lead: {
        completedLessons: ['lead-l1', 'lead-l3'],
        attempts: {
          'lead-e1': [{ score: 80, daysAgo: 10 }],
          'lead-e2': [{ score: 85, daysAgo: 10 }],
          'lead-e3': [{ score: 80, daysAgo: 10 }]
        },
        completionDaysAgo: 10
      },
      data: {
        completedLessons: ['data-l1', 'data-l2'],
        attempts: {
          'data-e1': [{ score: 80, daysAgo: 10 }],
          'data-e2': [{ score: 85, daysAgo: 10 }],
          'data-e3': [{ score: 80, daysAgo: 10 }]
        },
        completionDaysAgo: 10
      }
    }
  },
  {
    key: 'lagging-pending',
    fullname: 'Chloe Dubois',
    username: 'chloe-dubois',
    email: `chloe@${EMAIL_DOMAIN}`,
    cohortKeys: ['pending'],
    courses: ['lead'],
    joinedDaysAgo: 5,
    lastLoginDaysAgo: 0,
    loginDaysAgo: [0, 1, 3, 5],
    coursePlans: {
      lead: {
        completedLessons: ['lead-l1', 'lead-l3'],
        attempts: {
          'lead-e1': [{ score: 55, daysAgo: 3 }],
          'lead-e2': [{ score: 60, daysAgo: 3 }],
          'lead-e3': [{ score: 55, daysAgo: 3 }]
        },
        completionDaysAgo: 3
      }
    }
  },
  {
    key: 'no-courses-1',
    fullname: 'Leo Martins',
    username: 'leo-martins',
    email: `leo@${EMAIL_DOMAIN}`,
    cohortKeys: ['no-courses'],
    courses: [],
    joinedDaysAgo: 10,
    lastLoginDaysAgo: 0,
    loginDaysAgo: [0, 1, 4, 10],
    coursePlans: {}
  },
  {
    key: 'no-courses-2',
    fullname: 'Hana Suzuki',
    username: 'hana-suzuki',
    email: `hana@${EMAIL_DOMAIN}`,
    cohortKeys: ['no-courses'],
    courses: [],
    joinedDaysAgo: 12,
    lastLoginDaysAgo: 0,
    loginDaysAgo: [0, 2, 6, 12],
    coursePlans: {}
  },
  {
    key: 'no-courses-3',
    fullname: 'Mateo Alvarez',
    username: 'mateo-alvarez',
    email: `mateo@${EMAIL_DOMAIN}`,
    cohortKeys: ['no-courses'],
    courses: [],
    joinedDaysAgo: 15,
    lastLoginDaysAgo: 0,
    loginDaysAgo: [0, 3, 8, 15],
    coursePlans: {}
  },
  {
    key: 'excluded-deactivated',
    fullname: 'Victor Jack',
    username: 'victor-jack',
    email: `victor@${EMAIL_DOMAIN}`,
    cohortKeys: ['full'],
    courses: ['lead'],
    joinedDaysAgo: 60,
    lastLoginDaysAgo: 0,
    loginDaysAgo: [0, 5, 20],
    orgStatus: 'DEACTIVATED',
    coursePlans: {
      lead: {
        completedLessons: ['lead-l1'],
        attempts: {
          'lead-e1': [{ score: 80, daysAgo: 10 }],
          'lead-e2': [{ score: 85, daysAgo: 10 }],
          'lead-e3': [{ score: 80, daysAgo: 10 }]
        },
        completionDaysAgo: 10
      }
    }
  },
  {
    key: 'excluded-archived',
    fullname: 'Zoe Baker',
    username: 'zoe-baker',
    email: `zoe@${EMAIL_DOMAIN}`,
    cohortKeys: ['full'],
    courses: ['lead'],
    joinedDaysAgo: 70,
    lastLoginDaysAgo: 0,
    loginDaysAgo: [0, 5, 20],
    orgStatus: 'ARCHIVED',
    coursePlans: {
      lead: {
        completedLessons: ['lead-l1'],
        attempts: {
          'lead-e1': [{ score: 80, daysAgo: 10 }],
          'lead-e2': [{ score: 85, daysAgo: 10 }],
          'lead-e3': [{ score: 80, daysAgo: 10 }]
        },
        completionDaysAgo: 10
      }
    }
  },
  {
    key: 'archived-cohort-1',
    fullname: 'Adam Reed',
    username: 'adam-reed',
    email: `adam@${EMAIL_DOMAIN}`,
    cohortKeys: ['archived'],
    courses: ['archived'],
    joinedDaysAgo: 90,
    lastLoginDaysAgo: 5,
    loginDaysAgo: [5, 20, 40],
    coursePlans: {
      archived: {
        completedLessons: ['archived-l1'],
        attempts: {
          'archived-e1': [{ score: 80, daysAgo: 20 }]
        },
        completionDaysAgo: 20
      }
    }
  },
  {
    key: 'archived-cohort-2',
    fullname: 'Lena Fischer',
    username: 'lena-fischer',
    email: `lena@${EMAIL_DOMAIN}`,
    cohortKeys: ['archived'],
    courses: ['archived'],
    joinedDaysAgo: 90,
    lastLoginDaysAgo: 5,
    loginDaysAgo: [5, 20, 40],
    coursePlans: {
      archived: {
        completedLessons: ['archived-l1'],
        attempts: {
          'archived-e1': [{ score: 75, daysAgo: 20 }]
        },
        completionDaysAgo: 20
      }
    }
  },
  {
    key: 'many-1',
    fullname: 'Maya Lin',
    username: 'maya-lin',
    email: `maya.lin@${EMAIL_DOMAIN}`,
    cohortKeys: ['many-courses'],
    courses: ['lead', 'data', 'support', 'compliance', 'product', 'security', 'comm', 'sales', 'finance', 'ops', 'ai'],
    joinedDaysAgo: 45,
    lastLoginDaysAgo: 1,
    loginDaysAgo: [1, 3, 7, 14, 28, 45],
    coursePlans: {
      lead: {
        completedLessons: ['lead-l1', 'lead-l2'],
        attempts: {
          'lead-e1': [{ score: 85, daysAgo: 5 }],
          'lead-e2': [{ score: 90, daysAgo: 5 }]
        }
      },
      data: {
        completedLessons: ['data-l1', 'data-l2'],
        attempts: {
          'data-e1': [{ score: 90, daysAgo: 8 }],
          'data-e2': [{ score: 85, daysAgo: 8 }]
        }
      },
      support: {
        completedLessons: ['support-l1', 'support-l2'],
        attempts: {
          'support-e1': [{ score: 80, daysAgo: 10 }]
        }
      },
      compliance: {
        completedLessons: ['compliance-l1', 'compliance-l2'],
        attempts: {
          'compliance-e1': [{ score: 95, daysAgo: 12 }]
        }
      },
      product: {
        completedLessons: ['product-l1'],
        attempts: {
          'product-e1': [{ score: 85, daysAgo: 7 }]
        }
      },
      security: {
        completedLessons: ['security-l1'],
        attempts: {
          'security-e1': [{ score: 90, daysAgo: 6 }]
        }
      },
      comm: {
        completedLessons: ['comm-l1'],
        attempts: {
          'comm-e1': [{ score: 75, daysAgo: 5 }]
        }
      },
      sales: {
        completedLessons: ['sales-l1'],
        attempts: {
          'sales-e1': [{ score: 80, daysAgo: 4 }]
        }
      },
      finance: {
        completedLessons: ['finance-l1'],
        attempts: {
          'finance-e1': [{ score: 70, daysAgo: 3 }]
        }
      },
      ops: {
        completedLessons: ['ops-l1'],
        attempts: {
          'ops-e1': [{ score: 85, daysAgo: 2 }]
        }
      },
      ai: {
        completedLessons: ['ai-l1'],
        attempts: {
          'ai-e1': [{ score: 95, daysAgo: 1 }]
        }
      }
    }
  },
  {
    key: 'many-2',
    fullname: 'Tariq Vance',
    username: 'tariq-vance',
    email: `tariq@${EMAIL_DOMAIN}`,
    cohortKeys: ['many-courses'],
    courses: ['lead', 'data', 'support', 'compliance', 'product', 'security', 'comm', 'sales', 'finance', 'ops', 'ai'],
    joinedDaysAgo: 30,
    lastLoginDaysAgo: 0,
    loginDaysAgo: [0, 2, 5, 10, 20, 30],
    coursePlans: {
      lead: {
        completedLessons: ['lead-l1'],
        attempts: {
          'lead-e1': [{ score: 75, daysAgo: 10 }]
        }
      },
      data: {
        completedLessons: ['data-l1'],
        attempts: {
          'data-e1': [{ score: 70, daysAgo: 8 }]
        }
      },
      support: {
        completedLessons: ['support-l1'],
        attempts: {
          'support-e1': [{ score: 65, daysAgo: 7 }]
        }
      },
      compliance: {
        completedLessons: ['compliance-l1'],
        attempts: {
          'compliance-e1': [{ score: 85, daysAgo: 6 }]
        }
      },
      product: {
        completedLessons: ['product-l1'],
        attempts: {
          'product-e1': [{ score: 70, daysAgo: 5 }]
        }
      },
      security: {
        completedLessons: ['security-l1'],
        attempts: {
          'security-e1': [{ score: 80, daysAgo: 4 }]
        }
      },
      comm: {
        completedLessons: ['comm-l1'],
        attempts: {
          'comm-e1': [{ score: 65, daysAgo: 3 }]
        }
      },
      sales: {
        completedLessons: ['sales-l1'],
        attempts: {
          'sales-e1': [{ score: 75, daysAgo: 2 }]
        }
      },
      finance: {
        completedLessons: ['finance-l1'],
        attempts: {
          'finance-e1': [{ score: 60, daysAgo: 2 }]
        }
      },
      ops: {
        completedLessons: ['ops-l1'],
        attempts: {
          'ops-e1': [{ score: 75, daysAgo: 1 }]
        }
      },
      ai: {
        completedLessons: ['ai-l1'],
        attempts: {
          'ai-e1': [{ score: 85, daysAgo: 0 }]
        }
      }
    }
  },
  {
    key: 'many-3',
    fullname: 'Zara Morales',
    username: 'zara-morales',
    email: `zara@${EMAIL_DOMAIN}`,
    cohortKeys: ['many-courses', 'dept-product'],
    courses: ['lead', 'product', 'ai'],
    joinedDaysAgo: 25,
    lastLoginDaysAgo: 0,
    loginDaysAgo: [0, 1, 4, 12, 25],
    coursePlans: {
      lead: {
        completedLessons: ['lead-l1', 'lead-l2', 'lead-l3'],
        attempts: {
          'lead-e1': [{ score: 95, daysAgo: 6 }],
          'lead-e2': [{ score: 90, daysAgo: 6 }],
          'lead-e3': [{ score: 92, daysAgo: 6 }]
        },
        completionDaysAgo: 5,
        certified: true
      },
      product: {
        completedLessons: ['product-l1'],
        attempts: {
          'product-e1': [{ score: 90, daysAgo: 4 }]
        },
        completionDaysAgo: 3,
        certified: true
      },
      ai: {
        completedLessons: ['ai-l1'],
        attempts: {
          'ai-e1': [{ score: 95, daysAgo: 2 }]
        }
      }
    }
  },
  {
    key: 'dept-eng-1',
    fullname: 'Kenji Sato',
    username: 'kenji-sato',
    email: `kenji@${EMAIL_DOMAIN}`,
    cohortKeys: ['dept-eng'],
    courses: ['lead'],
    joinedDaysAgo: 40,
    lastLoginDaysAgo: 2,
    loginDaysAgo: [2, 5, 12, 25, 40],
    coursePlans: {
      lead: {
        completedLessons: ['lead-l1', 'lead-l2', 'lead-l3'],
        attempts: {
          'lead-e1': [{ score: 92, daysAgo: 10 }],
          'lead-e2': [{ score: 88, daysAgo: 10 }],
          'lead-e3': [{ score: 85, daysAgo: 10 }]
        },
        completionDaysAgo: 8,
        certified: true
      }
    }
  },
  {
    key: 'dept-sales-1',
    fullname: 'Sarah Jenkins',
    username: 'sarah-jenkins',
    email: `sarah.jenkins@${EMAIL_DOMAIN}`,
    cohortKeys: ['dept-sales'],
    courses: ['lead', 'sales'],
    joinedDaysAgo: 35,
    lastLoginDaysAgo: 1,
    loginDaysAgo: [1, 4, 9, 18, 35],
    coursePlans: {
      lead: {
        completedLessons: ['lead-l1', 'lead-l2'],
        attempts: {
          'lead-e1': [{ score: 85, daysAgo: 8 }],
          'lead-e2': [{ score: 80, daysAgo: 8 }]
        }
      },
      sales: {
        completedLessons: ['sales-l1'],
        attempts: {
          'sales-e1': [{ score: 88, daysAgo: 5 }]
        }
      }
    }
  },
  {
    key: 'dept-prod-1',
    fullname: 'Carlos Gomez',
    username: 'carlos-gomez',
    email: `carlos.gomez@${EMAIL_DOMAIN}`,
    cohortKeys: ['dept-product'],
    courses: ['lead', 'product'],
    joinedDaysAgo: 20,
    lastLoginDaysAgo: 0,
    loginDaysAgo: [0, 2, 6, 12, 20],
    coursePlans: {
      lead: {
        completedLessons: ['lead-l1'],
        attempts: {
          'lead-e1': [{ score: 80, daysAgo: 6 }]
        }
      },
      product: {
        completedLessons: ['product-l1'],
        attempts: {
          'product-e1': [{ score: 85, daysAgo: 4 }]
        }
      }
    }
  },
  {
    key: 'dept-des-1',
    fullname: 'Emma Wilson',
    username: 'emma-wilson',
    email: `emma.wilson@${EMAIL_DOMAIN}`,
    cohortKeys: ['dept-design'],
    courses: ['lead'],
    joinedDaysAgo: 30,
    lastLoginDaysAgo: 3,
    loginDaysAgo: [3, 8, 15, 30],
    coursePlans: {
      lead: {
        completedLessons: ['lead-l1', 'lead-l2'],
        attempts: {
          'lead-e1': [{ score: 78, daysAgo: 12 }]
        }
      }
    }
  },
  {
    key: 'dept-supp-1',
    fullname: 'David OConnor',
    username: 'david-oconnor',
    email: `david@${EMAIL_DOMAIN}`,
    cohortKeys: ['dept-support'],
    courses: ['lead', 'support'],
    joinedDaysAgo: 15,
    lastLoginDaysAgo: 1,
    loginDaysAgo: [1, 3, 7, 15],
    coursePlans: {
      lead: {
        completedLessons: ['lead-l1'],
        attempts: {
          'lead-e1': [{ score: 72, daysAgo: 5 }]
        }
      },
      support: {
        completedLessons: ['support-l1'],
        attempts: {
          'support-e1': [{ score: 80, daysAgo: 4 }]
        }
      }
    }
  },
  {
    key: 'dept-mkt-1',
    fullname: 'Fatima Al-Mansoor',
    username: 'fatima-almansoor',
    email: `fatima@${EMAIL_DOMAIN}`,
    cohortKeys: ['dept-marketing'],
    courses: ['lead', 'comm'],
    joinedDaysAgo: 25,
    lastLoginDaysAgo: 0,
    loginDaysAgo: [0, 3, 9, 18, 25],
    coursePlans: {
      lead: {
        completedLessons: ['lead-l1', 'lead-l3'],
        attempts: {
          'lead-e1': [{ score: 88, daysAgo: 7 }]
        }
      },
      comm: {
        completedLessons: ['comm-l1'],
        attempts: {
          'comm-e1': [{ score: 90, daysAgo: 3 }]
        }
      }
    }
  },
  {
    key: 'dept-fin-1',
    fullname: 'Michael Chang',
    username: 'michael-chang',
    email: `michael.chang@${EMAIL_DOMAIN}`,
    cohortKeys: ['dept-finance'],
    courses: ['lead', 'finance'],
    joinedDaysAgo: 22,
    lastLoginDaysAgo: 2,
    loginDaysAgo: [2, 6, 14, 22],
    coursePlans: {
      lead: {
        completedLessons: ['lead-l1', 'lead-l2'],
        attempts: {
          'lead-e1': [{ score: 95, daysAgo: 6 }]
        }
      },
      finance: {
        completedLessons: ['finance-l1'],
        attempts: {
          'finance-e1': [{ score: 82, daysAgo: 4 }]
        }
      }
    }
  },
  {
    key: 'dept-ops-1',
    fullname: 'Rachel Green',
    username: 'rachel-green',
    email: `rachel.green@${EMAIL_DOMAIN}`,
    cohortKeys: ['dept-ops'],
    courses: ['lead', 'ops'],
    joinedDaysAgo: 18,
    lastLoginDaysAgo: 1,
    loginDaysAgo: [1, 5, 11, 18],
    coursePlans: {
      lead: {
        completedLessons: ['lead-l1'],
        attempts: {
          'lead-e1': [{ score: 84, daysAgo: 5 }]
        }
      },
      ops: {
        completedLessons: ['ops-l1'],
        attempts: {
          'ops-e1': [{ score: 86, daysAgo: 3 }]
        }
      }
    }
  }
];

const ADMIN: PersonDef = {
  id: seedId(0x1e000002, 1),
  fullname: 'Insights Admin',
  username: 'insights-admin',
  email: `admin@${EMAIL_DOMAIN}`,
  roleId: ROLE_ADMIN,
  joinedDaysAgo: 120,
  lastLoginDaysAgo: 0,
  loginDaysAgo: [0, 1, 2, 5, 12, 30],
  orgStatus: 'ACTIVE'
};

const TUTOR: PersonDef = {
  id: seedId(0x1e000002, 2),
  fullname: 'Insights Tutor',
  username: 'insights-tutor',
  email: `tutor@${EMAIL_DOMAIN}`,
  roleId: ROLE_TUTOR,
  joinedDaysAgo: 110,
  lastLoginDaysAgo: 0,
  loginDaysAgo: [0, 1, 3, 8, 20],
  orgStatus: 'ACTIVE'
};

const STUDENT_PEOPLE: PersonDef[] = STUDENTS.map((student, index) => ({
  id: seedId(0x1e000002, index + 10),
  fullname: student.fullname,
  username: student.username,
  email: student.email,
  roleId: ROLE_STUDENT,
  joinedDaysAgo: student.joinedDaysAgo,
  lastLoginDaysAgo: student.lastLoginDaysAgo,
  loginDaysAgo: student.loginDaysAgo,
  orgStatus: student.orgStatus ?? 'ACTIVE'
}));

const PEOPLE: PersonDef[] = [ADMIN, TUTOR, ...STUDENT_PEOPLE];
const PERSON_IDS = PEOPLE.map((person) => person.id);

const COURSE_BY_KEY = new Map(COURSES.map((courseDef) => [courseDef.key, courseDef]));
const COHORT_BY_KEY = new Map(COHORTS.map((cohortDef) => [cohortDef.key, cohortDef]));
const STUDENT_BY_KEY = new Map(STUDENTS.map((student) => [student.key, student]));
const STUDENT_INDEX = new Map(STUDENTS.map((student, index) => [student.key, index]));
const COURSE_INDEX = new Map(COURSES.map((courseDef, index) => [courseDef.key, index]));
const COHORT_INDEX = new Map(COHORTS.map((cohortDef, index) => [cohortDef.key, index]));
const PERSON_BY_KEY = new Map(STUDENTS.map((student, index) => [student.key, STUDENT_PEOPLE[index]]));

function courseId(key: CourseKey): string {
  return seedId(0x1e000004, (COURSE_INDEX.get(key) ?? 0) + 1);
}

function groupId(key: CourseKey): string {
  return seedId(0x1e000003, (COURSE_INDEX.get(key) ?? 0) + 1);
}

function sectionId(courseKey: CourseKey, sectionKey: string): string {
  const courseDef = COURSE_BY_KEY.get(courseKey);
  const sectionIndex = courseDef?.sections.findIndex((section) => section.key === sectionKey) ?? 0;

  return seedId(0x1e000005, (COURSE_INDEX.get(courseKey) ?? 0) * 20 + sectionIndex + 1);
}

function lessonId(courseKey: CourseKey, lessonKey: string): string {
  const courseDef = COURSE_BY_KEY.get(courseKey);
  const lessonIndex = courseDef?.lessons.findIndex((lessonDef) => lessonDef.key === lessonKey) ?? 0;

  return seedId(0x1e000006, (COURSE_INDEX.get(courseKey) ?? 0) * 20 + lessonIndex + 1);
}

function exerciseId(courseKey: CourseKey, exerciseKey: string): string {
  const courseDef = COURSE_BY_KEY.get(courseKey);
  const exerciseIndex = courseDef?.exercises.findIndex((exerciseDef) => exerciseDef.key === exerciseKey) ?? 0;

  return seedId(0x1e000007, (COURSE_INDEX.get(courseKey) ?? 0) * 20 + exerciseIndex + 1);
}

function cohortId(key: CohortKey): string {
  return seedId(0x1e000009, (COHORT_INDEX.get(key) ?? 0) + 1);
}

function groupMemberId(studentKey: string, courseKey: CourseKey): string {
  const studentIndex = STUDENT_INDEX.get(studentKey) ?? 0;

  return seedId(0x1e000008, (studentIndex + 1) * 100 + (COURSE_INDEX.get(courseKey) ?? 0) + 1);
}

function cohortMemberId(studentKey: string, cohortKey: CohortKey): string {
  const studentIndex = STUDENT_INDEX.get(studentKey) ?? 0;

  return seedId(0x1e00000a, (studentIndex + 1) * 100 + (COHORT_INDEX.get(cohortKey) ?? 0) + 1);
}

function pendingCohortMemberId(index: number, cohortKey: CohortKey): string {
  return seedId(0x1e00000a, 9000 + index * 10 + (COHORT_INDEX.get(cohortKey) ?? 0) + 1);
}

function goalId(index: number): string {
  return seedId(0x1e00000b, index);
}

function assignmentId(index: number): string {
  return seedId(0x1e00000c, index);
}

function completionRecordId(index: number): string {
  return seedId(0x1e00000d, index);
}

function certificateId(index: number): string {
  return seedId(0x1e00000e, index);
}

function submissionId(index: number): string {
  return seedId(0x1e00000f, index);
}

function planFor(studentKey: string, courseKey: CourseKey): CoursePlan {
  const student = STUDENT_BY_KEY.get(studentKey);
  const plan = student?.coursePlans[courseKey];

  return plan ?? { completedLessons: [], attempts: {} };
}

function gradedAttempts(attempts: Attempt[]): Attempt[] {
  return attempts.filter((attempt) => (attempt.gradingState ?? 'completed') === 'completed');
}

function exerciseIsComplete(exerciseDef: ExerciseDef, plan: CoursePlan): boolean {
  const graded = gradedAttempts(plan.attempts[exerciseDef.key] ?? []);

  if (graded.length === 0) return false;
  if (exerciseDef.policy === 'submitted') return true;

  return graded.some((attempt) => attempt.score >= (exerciseDef.passThreshold ?? 0));
}

function courseIsComplete(courseDef: CourseDef, plan: CoursePlan): boolean {
  const lessonsComplete = courseDef.lessons.every((lessonDef) => plan.completedLessons.includes(lessonDef.key));
  const exercisesComplete = courseDef.exercises.every((exerciseDef) => exerciseIsComplete(exerciseDef, plan));

  return lessonsComplete && exercisesComplete;
}

function courseAverageScore(courseDef: CourseDef, plan: CoursePlan): number | null {
  const scores = courseDef.exercises.flatMap((exerciseDef) =>
    gradedAttempts(plan.attempts[exerciseDef.key] ?? []).map((attempt) => attempt.score)
  );

  if (scores.length === 0) return null;

  return Math.round(scores.reduce((total, score) => total + score, 0) / scores.length);
}

async function resetSeedData(): Promise<void> {
  const [existingOrg] = await db
    .select({ id: organization.id })
    .from(organization)
    .where(eq(organization.siteName, ORG_SITE_NAME))
    .limit(1);

  const existingGroupIds = existingOrg
    ? (await db.select({ id: group.id }).from(group).where(eq(group.organizationId, existingOrg.id))).map(
        (row) => row.id
      )
    : [];
  const existingCourseIds =
    existingGroupIds.length > 0
      ? (await db.select({ id: course.id }).from(course).where(inArray(course.groupId, existingGroupIds))).map(
          (row) => row.id
        )
      : [];
  const existingExerciseIds =
    existingCourseIds.length > 0
      ? (await db.select({ id: exercise.id }).from(exercise).where(inArray(exercise.courseId, existingCourseIds))).map(
          (row) => row.id
        )
      : [];

  if (existingCourseIds.length > 0) {
    await db.delete(courseCertificateIssue).where(inArray(courseCertificateIssue.courseId, existingCourseIds));
    await db.delete(courseCompletionRecord).where(inArray(courseCompletionRecord.courseId, existingCourseIds));
    await db.delete(submission).where(inArray(submission.courseId, existingCourseIds));
    await db.delete(groupAttendance).where(inArray(groupAttendance.courseId, existingCourseIds));

    if (existingExerciseIds.length > 0) {
      await db.delete(question).where(inArray(question.exerciseId, existingExerciseIds));
    }

    await db.delete(exercise).where(inArray(exercise.courseId, existingCourseIds));
    await db.delete(lesson).where(inArray(lesson.courseId, existingCourseIds));
    await db.delete(courseSection).where(inArray(courseSection.courseId, existingCourseIds));
  }

  if (existingGroupIds.length > 0) {
    await db.delete(groupmember).where(inArray(groupmember.groupId, existingGroupIds));
  }

  if (existingOrg) {
    await db.delete(cohort).where(eq(cohort.organizationId, existingOrg.id));
    await db.delete(organizationmember).where(eq(organizationmember.organizationId, existingOrg.id));
    await db.delete(organizationPlan).where(eq(organizationPlan.orgId, existingOrg.id));
  }

  if (existingCourseIds.length > 0) {
    await db.delete(course).where(inArray(course.id, existingCourseIds));
  }

  if (existingGroupIds.length > 0) {
    await db.delete(group).where(inArray(group.id, existingGroupIds));
  }

  if (existingOrg) {
    await db.delete(organization).where(eq(organization.id, existingOrg.id));
  }

  await db.delete(lessonCompletion).where(inArray(lessonCompletion.profileId, PERSON_IDS));
  await db.delete(lessonVideoProgress).where(inArray(lessonVideoProgress.profileId, PERSON_IDS));
  await db.delete(analyticsLoginEvents).where(inArray(analyticsLoginEvents.userId, PERSON_IDS));
  await db.delete(account).where(inArray(account.userId, PERSON_IDS));
  await db.delete(profile).where(inArray(profile.id, PERSON_IDS));
  await db.delete(user).where(inArray(user.id, PERSON_IDS));
}

async function seedReferenceRows(): Promise<void> {
  await db
    .insert(role)
    .values([
      { id: ROLE_ADMIN, type: 'ADMIN' },
      { id: ROLE_TUTOR, type: 'TUTOR' },
      { id: ROLE_STUDENT, type: 'STUDENT' }
    ])
    .onConflictDoNothing();
  await db
    .insert(submissionstatus)
    .values([
      { id: 1, label: 'Submitted' },
      { id: 2, label: 'In Progress' },
      { id: 3, label: 'Graded' }
    ])
    .onConflictDoNothing();
  await db
    .insert(questionType)
    .values({ id: 2, label: 'Multiple answers', typename: 'checkbox' })
    .onConflictDoNothing();
}

async function seedPeople(): Promise<void> {
  await insertRows(
    user,
    PEOPLE.map((person) => ({
      id: person.id,
      name: person.fullname,
      email: person.email,
      emailVerified: true,
      createdAt: new Date(NOW - person.joinedDaysAgo * DAY_MS)
    }))
  );

  await insertRows(
    profile,
    PEOPLE.map((person) => ({
      id: person.id,
      fullname: person.fullname,
      username: person.username,
      email: person.email,
      createdAt: isoDaysAgo(person.joinedDaysAgo),
      isEmailVerified: true,
      canAddCourse: false
    }))
  );

  await insertRows(
    account,
    PEOPLE.map((person) => ({
      userId: person.id,
      providerId: 'credential',
      accountId: person.id,
      password: PASSWORD_HASH
    }))
  );
}

async function seedOrganization(): Promise<void> {
  await db.insert(organization).values({
    id: ORG_ID,
    name: ORG_NAME,
    siteName: ORG_SITE_NAME,
    theme: 'blue',
    settings: { insights: { studentTarget: 30 } },
    landingpage: {},
    customization: {
      apps: { comments: true },
      course: { grading: true, newsfeed: true },
      dashboard: { exercise: true, community: true, bannerText: '', bannerImage: '' }
    }
  });

  await db.insert(organizationPlan).values({
    orgId: ORG_ID,
    planName: 'ENTERPRISE',
    isActive: true,
    activatedAt: isoDaysAgo(120),
    payload: { seats: 100 }
  });

  await insertRows(
    organizationmember,
    PEOPLE.map((person) => ({
      organizationId: ORG_ID,
      roleId: person.roleId,
      profileId: person.id,
      email: person.email,
      verified: true,
      status: person.orgStatus,
      statusChangedAt: person.orgStatus === 'ACTIVE' ? null : isoDaysAgo(5),
      lastActiveAt:
        person.lastLoginDaysAgo === null ? isoDaysAgo(person.joinedDaysAgo) : isoDaysAgo(person.lastLoginDaysAgo),
      createdAt: isoDaysAgo(person.joinedDaysAgo)
    }))
  );
}

async function seedCourses(): Promise<void> {
  const groupRows = COURSES.map((courseDef) => ({
    id: groupId(courseDef.key),
    name: courseDef.title,
    description: `${courseDef.title} group`,
    organizationId: ORG_ID,
    createdAt: isoDaysAgo(120)
  }));
  await insertRows(group, groupRows);

  const courseRows = COURSES.map((courseDef) => ({
    id: courseId(courseDef.key),
    title: courseDef.title,
    description: `${courseDef.title} for the insights state showcase`,
    overview: `A compact course used to exercise every analytics state.`,
    groupId: groupId(courseDef.key),
    slug: courseDef.slug,
    status: courseDef.status,
    isPublished: true,
    isTemplate: false,
    createdAt: isoDaysAgo(120),
    updatedAt: isoDaysAgo(10),
    metadata: { isContentGroupingEnabled: courseDef.grouped },
    certificate: {
      isDownloadable: true,
      design: { templateId: 'classique' as const, accentColor: '#2563eb' }
    },
    compliance: courseDef.compliance
      ? {
          retakeIntervalMonths: 12,
          reminderDaysBefore: [7, 1],
          isMandatory: true,
          framework: 'CUSTOM' as const,
          maxRetakeAttempts: null
        }
      : null
  }));
  await insertRows(course, courseRows);

  const sectionRows = COURSES.flatMap((courseDef) =>
    courseDef.sections.map((section) => ({
      id: sectionId(courseDef.key, section.key),
      title: section.title,
      order: section.order,
      courseId: courseId(courseDef.key),
      createdAt: isoDaysAgo(120)
    }))
  );
  await insertRows(courseSection, sectionRows);

  const lessonRows = COURSES.flatMap((courseDef) =>
    courseDef.lessons.map((lessonDef) => ({
      id: lessonId(courseDef.key, lessonDef.key),
      courseId: courseId(courseDef.key),
      sectionId: lessonDef.sectionKey ? sectionId(courseDef.key, lessonDef.sectionKey) : null,
      title: lessonDef.title,
      slug: `${courseDef.slug}-${lessonDef.key}`,
      order: lessonDef.order,
      completionPolicy: lessonDef.policy,
      lessonAt: lessonDef.policy === 'live' ? isoDaysAgo(14, lessonDef.order) : null,
      videos:
        lessonDef.policy === 'video_watch'
          ? [
              {
                type: 'upload' as const,
                link: '',
                assetId: `insights-states-${courseDef.key}-${lessonDef.key}`,
                watchEnforced: true,
                metadata: { duration: 600 }
              }
            ]
          : [],
      createdAt: isoDaysAgo(120)
    }))
  );
  await insertRows(lesson, lessonRows);

  const exerciseRows = COURSES.flatMap((courseDef) =>
    courseDef.exercises.map((exerciseDef) => ({
      id: exerciseId(courseDef.key, exerciseDef.key),
      courseId: courseId(courseDef.key),
      sectionId: exerciseDef.sectionKey ? sectionId(courseDef.key, exerciseDef.sectionKey) : null,
      title: exerciseDef.title,
      slug: `${courseDef.slug}-${exerciseDef.key}`,
      order: exerciseDef.order,
      completionPolicy: exerciseDef.policy,
      passThreshold: exerciseDef.passThreshold,
      dueBy: exerciseDef.dueDaysAgo === null ? null : isoDaysAgo(exerciseDef.dueDaysAgo),
      allowMultipleAttempts: true,
      createdAt: isoDaysAgo(120)
    }))
  );
  await insertRows(exercise, exerciseRows);
}

type QuestionSeed = {
  id: number;
  points: number;
  correctOptionId: number;
  wrongOptionId: number;
};

async function seedQuestions(): Promise<Map<string, QuestionSeed[]>> {
  const questionByExercise = new Map<string, QuestionSeed[]>();

  for (const courseDef of COURSES) {
    for (const exerciseDef of courseDef.exercises) {
      const currentExerciseId = exerciseId(courseDef.key, exerciseDef.key);
      const questionRows = [
        {
          questionTypeId: 2,
          title: `${exerciseDef.title}: key concept`,
          exerciseId: currentExerciseId,
          points: 50,
          order: 1
        },
        {
          questionTypeId: 2,
          title: `${exerciseDef.title}: application`,
          exerciseId: currentExerciseId,
          points: 50,
          order: 2
        }
      ];
      const insertedQuestions = await db
        .insert(question)
        .values(questionRows)
        .returning({ id: question.id, order: question.order, title: question.title });
      const questionSeeds: QuestionSeed[] = [];

      for (const insertedQuestion of insertedQuestions) {
        const optionRows = [
          {
            questionId: insertedQuestion.id,
            label: `${exerciseDef.title} correct answer`,
            isCorrect: true
          },
          {
            questionId: insertedQuestion.id,
            label: `${exerciseDef.title} common mistake`,
            isCorrect: false
          }
        ];
        const insertedOptions = await db
          .insert(option)
          .values(optionRows)
          .returning({ id: option.id, isCorrect: option.isCorrect });
        const correctOption = insertedOptions.find((insertedOption) => insertedOption.isCorrect);
        const wrongOption = insertedOptions.find((insertedOption) => !insertedOption.isCorrect);

        if (!correctOption || !wrongOption) {
          throw new Error(`Options were not created for question ${insertedQuestion.id}`);
        }

        questionSeeds.push({
          id: insertedQuestion.id,
          points: 50,
          correctOptionId: correctOption.id,
          wrongOptionId: wrongOption.id
        });
      }

      questionByExercise.set(exerciseDef.key, questionSeeds);
    }
  }

  return questionByExercise;
}

async function seedCohorts(): Promise<void> {
  await insertRows(
    cohort,
    COHORTS.map((cohortDef) => ({
      id: cohortId(cohortDef.key),
      organizationId: ORG_ID,
      name: cohortDef.name,
      description: cohortDef.description,
      status: cohortDef.status,
      createdByProfileId: ADMIN.id,
      createdAt: isoDaysAgo(cohortDef.createdAtDaysAgo),
      updatedAt: isoDaysAgo(cohortDef.createdAtDaysAgo)
    }))
  );

  const cohortCourseRows = COHORTS.flatMap((cohortDef) =>
    cohortDef.courses.map((courseKey) => ({
      cohortId: cohortId(cohortDef.key),
      courseId: courseId(courseKey),
      addedAt: isoDaysAgo(cohortDef.createdAtDaysAgo)
    }))
  );
  await insertRows(cohortCourse, cohortCourseRows);

  const cohortMemberRows = STUDENTS.flatMap((student) =>
    student.cohortKeys.map((cohortKey) => ({
      id: cohortMemberId(student.key, cohortKey),
      cohortId: cohortId(cohortKey),
      profileId: PERSON_BY_KEY.get(student.key)?.id ?? null,
      roleId: ROLE_STUDENT,
      email: student.email,
      createdAt: isoDaysAgo(student.joinedDaysAgo)
    }))
  );

  const pendingInvites = [
    { email: `pending-one@${EMAIL_DOMAIN}`, index: 0 },
    { email: `pending-two@${EMAIL_DOMAIN}`, index: 1 }
  ];
  cohortMemberRows.push(
    ...pendingInvites.map((invite) => ({
      id: pendingCohortMemberId(invite.index, 'pending'),
      cohortId: cohortId('pending'),
      profileId: null,
      roleId: ROLE_STUDENT,
      email: invite.email,
      createdAt: isoDaysAgo(COHORT_BY_KEY.get('pending')?.createdAtDaysAgo ?? 3)
    }))
  );

  await insertRows(cohortMember, cohortMemberRows);
}

async function seedGoals(): Promise<void> {
  const fullCohortId = cohortId('full');
  const completedCohortId = cohortId('completed');
  const atRiskCohortId = cohortId('at-risk');
  const leadCourseId = courseId('lead');
  const dataCourseId = courseId('data');
  const supportCourseId = courseId('support');
  const complianceCourseId = courseId('compliance');

  await insertRows(cohortGoal, [
    {
      id: goalId(1),
      cohortId: fullCohortId,
      title: 'Finish Leadership Essentials',
      description: 'A deliberately overdue goal for the needs-attention state.',
      type: 'complete_all',
      courseIds: [leadCourseId],
      deadlineKind: 'absolute',
      deadlineDate: isoDaysAgo(5),
      status: 'active',
      createdByProfileId: ADMIN.id,
      createdAt: isoDaysAgo(10),
      updatedAt: isoDaysAgo(5)
    },
    {
      id: goalId(2),
      cohortId: fullCohortId,
      title: 'Finish Data Literacy',
      description: 'A future goal that is still in progress.',
      type: 'complete_all',
      courseIds: [dataCourseId],
      deadlineKind: 'absolute',
      deadlineDate: isoDaysFromNow(14),
      status: 'active',
      createdByProfileId: ADMIN.id,
      createdAt: isoDaysAgo(10),
      updatedAt: isoDaysAgo(2)
    },
    {
      id: goalId(3),
      cohortId: fullCohortId,
      title: 'Old onboarding goal',
      description: 'Archived goals must not create overdue work.',
      type: 'complete_all',
      courseIds: [leadCourseId],
      deadlineKind: 'absolute',
      deadlineDate: isoDaysAgo(20),
      status: 'archived',
      createdByProfileId: ADMIN.id,
      createdAt: isoDaysAgo(40),
      updatedAt: isoDaysAgo(20)
    },
    {
      id: goalId(4),
      cohortId: completedCohortId,
      title: 'Complete the leadership path',
      description: 'The completed cohort has already met this goal.',
      type: 'complete_all',
      courseIds: [leadCourseId, supportCourseId],
      deadlineKind: 'absolute',
      deadlineDate: isoDaysAgo(5),
      status: 'active',
      createdByProfileId: ADMIN.id,
      createdAt: isoDaysAgo(30),
      updatedAt: isoDaysAgo(2)
    },
    {
      id: goalId(5),
      cohortId: atRiskCohortId,
      title: 'Finish compliance this quarter',
      description: 'A future compliance goal for the at-risk cohort.',
      type: 'complete_all',
      courseIds: [complianceCourseId],
      deadlineKind: 'absolute',
      deadlineDate: isoDaysFromNow(10),
      status: 'active',
      createdByProfileId: ADMIN.id,
      createdAt: isoDaysAgo(8),
      updatedAt: isoDaysAgo(2)
    }
  ]);

  const assignments: Array<typeof cohortGoalAssignment.$inferInsert> = [];
  let assignmentIndex = 1;

  const fullActiveStudents = STUDENTS.filter(
    (student) => student.cohortKeys.includes('full') && (student.orgStatus ?? 'ACTIVE') === 'ACTIVE'
  );

  assignments.push({
    id: assignmentId(assignmentIndex++),
    goalId: goalId(1),
    cohortMemberId: cohortMemberId('risk-overdue-goal', 'full'),
    dueDate: isoDaysAgo(5),
    status: 'not_started',
    completedCount: 0,
    requiredCount: 1,
    createdAt: isoDaysAgo(10),
    updatedAt: isoDaysAgo(5)
  });

  for (const student of fullActiveStudents) {
    assignments.push({
      id: assignmentId(assignmentIndex++),
      goalId: goalId(2),
      cohortMemberId: cohortMemberId(student.key, 'full'),
      dueDate: isoDaysFromNow(14),
      status: 'in_progress',
      completedCount: 0,
      requiredCount: 1,
      createdAt: isoDaysAgo(10),
      updatedAt: isoDaysAgo(2)
    });
  }

  assignments.push({
    id: assignmentId(assignmentIndex++),
    goalId: goalId(3),
    cohortMemberId: cohortMemberId('on-track-1', 'full'),
    dueDate: isoDaysAgo(20),
    status: 'not_started',
    completedCount: 0,
    requiredCount: 1,
    createdAt: isoDaysAgo(40),
    updatedAt: isoDaysAgo(20)
  });

  for (const student of STUDENTS.filter((candidate) => candidate.cohortKeys.includes('completed'))) {
    const studentPlan = planFor(student.key, 'lead');
    const completedAt = isoDaysAgo(studentPlan.completionDaysAgo ?? 2);

    assignments.push({
      id: assignmentId(assignmentIndex++),
      goalId: goalId(4),
      cohortMemberId: cohortMemberId(student.key, 'completed'),
      dueDate: isoDaysAgo(5),
      status: 'completed',
      completedCount: 2,
      requiredCount: 2,
      completedAt,
      createdAt: isoDaysAgo(30),
      updatedAt: completedAt
    });
  }

  for (const student of STUDENTS.filter((candidate) => candidate.cohortKeys.includes('at-risk'))) {
    assignments.push({
      id: assignmentId(assignmentIndex++),
      goalId: goalId(5),
      cohortMemberId: cohortMemberId(student.key, 'at-risk'),
      dueDate: isoDaysFromNow(10),
      status: 'in_progress',
      completedCount: 0,
      requiredCount: 1,
      createdAt: isoDaysAgo(8),
      updatedAt: isoDaysAgo(2)
    });
  }

  await insertRows(cohortGoalAssignment, assignments);
}

async function seedEnrollment(): Promise<void> {
  const groupMemberRows: Array<typeof groupmember.$inferInsert> = [];

  for (const student of STUDENTS) {
    for (const courseKey of student.courses) {
      const plan = planFor(student.key, courseKey);
      const courseDef = COURSE_BY_KEY.get(courseKey);

      if (!courseDef) continue;

      const complete = courseIsComplete(courseDef, plan);
      const certified = complete && plan.certified === true;
      const certificateEarnedAt = certified ? isoDaysAgo(plan.completionDaysAgo ?? 45) : null;

      groupMemberRows.push({
        id: groupMemberId(student.key, courseKey),
        groupId: groupId(courseKey),
        roleId: ROLE_STUDENT,
        profileId: PERSON_BY_KEY.get(student.key)?.id ?? null,
        email: student.email,
        createdAt: isoDaysAgo(student.joinedDaysAgo),
        certificateEarnedAt
      });
    }
  }

  for (const courseDef of COURSES.filter((course) => course.status === 'ACTIVE')) {
    const courseIndex = COURSE_INDEX.get(courseDef.key) ?? 0;

    groupMemberRows.push(
      {
        id: seedId(0x1e00000a, courseIndex + 1),
        groupId: groupId(courseDef.key),
        roleId: ROLE_ADMIN,
        profileId: ADMIN.id,
        email: ADMIN.email,
        createdAt: isoDaysAgo(ADMIN.joinedDaysAgo)
      },
      {
        id: seedId(0x1e00000b, courseIndex + 1),
        groupId: groupId(courseDef.key),
        roleId: ROLE_TUTOR,
        profileId: TUTOR.id,
        email: TUTOR.email,
        createdAt: isoDaysAgo(TUTOR.joinedDaysAgo)
      }
    );
  }

  await insertRows(groupmember, groupMemberRows);
}

async function seedLearningActivity(): Promise<void> {
  const lessonCompletionRows: Array<typeof lessonCompletion.$inferInsert> = [];
  const videoProgressRows: Array<typeof lessonVideoProgress.$inferInsert> = [];
  const attendanceRows: Array<typeof groupAttendance.$inferInsert> = [];

  for (const student of STUDENTS) {
    const studentProfileId = PERSON_BY_KEY.get(student.key)?.id;

    if (!studentProfileId) continue;

    for (const courseKey of student.courses) {
      const courseDef = COURSE_BY_KEY.get(courseKey);
      const plan = planFor(student.key, courseKey);

      if (!courseDef) continue;

      const completionDaysAgo = plan.completionDaysAgo ?? 45;

      for (const lessonDef of courseDef.lessons) {
        const completed = plan.completedLessons.includes(lessonDef.key);
        const currentLessonId = lessonId(courseKey, lessonDef.key);
        const completedAt = isoDaysAgo(completionDaysAgo + lessonDef.order, lessonDef.order);

        if (completed) {
          lessonCompletionRows.push({
            lessonId: currentLessonId,
            profileId: studentProfileId,
            isComplete: true,
            createdAt: completedAt,
            updatedAt: completedAt
          });
        }

        if (lessonDef.policy === 'video_watch') {
          const watchedSeconds = completed ? 600 : student.lastLoginDaysAgo === null ? 0 : 180;
          const progressComplete = completed;

          if (watchedSeconds > 0 || progressComplete) {
            videoProgressRows.push({
              lessonId: currentLessonId,
              profileId: studentProfileId,
              assetId: `insights-states-${courseKey}-${lessonDef.key}`,
              durationSeconds: 600,
              watchedSeconds,
              furthestSeconds: watchedSeconds,
              lastPositionSeconds: watchedSeconds,
              isComplete: progressComplete,
              completedAt: progressComplete ? completedAt : null,
              createdAt: isoDaysAgo(completionDaysAgo + lessonDef.order + 1),
              updatedAt: completedAt
            });
          }
        }

        if (lessonDef.policy === 'live') {
          const studentIndex = STUDENT_INDEX.get(student.key) ?? 0;
          const present = student.key !== 'risk-inactive' && (studentIndex + lessonDef.order) % 4 !== 0;

          attendanceRows.push({
            courseId: courseId(courseKey),
            studentId: groupMemberId(student.key, courseKey),
            lessonId: currentLessonId,
            isPresent: present,
            createdAt: isoDaysAgo(14, lessonDef.order)
          });
        }
      }
    }
  }

  await insertRows(lessonCompletion, lessonCompletionRows);
  await insertRows(lessonVideoProgress, videoProgressRows);
  await insertRows(groupAttendance, attendanceRows);
}

async function seedSubmissions(questionByExercise: Map<string, QuestionSeed[]>): Promise<void> {
  const submissionRows: Array<typeof submission.$inferInsert> = [];
  const answerRows: Array<typeof questionAnswer.$inferInsert> = [];
  let submissionIndex = 1;

  for (const student of STUDENTS) {
    for (const courseKey of student.courses) {
      const courseDef = COURSE_BY_KEY.get(courseKey);
      const plan = planFor(student.key, courseKey);

      if (!courseDef) continue;

      for (const exerciseDef of courseDef.exercises) {
        const attempts = plan.attempts[exerciseDef.key] ?? [];
        const currentExerciseId = exerciseId(courseKey, exerciseDef.key);
        const currentGroupMemberId = groupMemberId(student.key, courseKey);

        attempts.forEach((attempt, attemptIndex) => {
          const gradingState = attempt.gradingState ?? 'completed';
          const currentSubmissionId = submissionId(submissionIndex++);
          const createdAt = isoDaysAgo(attempt.daysAgo, attemptIndex * 7);

          submissionRows.push({
            id: currentSubmissionId,
            exerciseId: currentExerciseId,
            courseId: courseId(courseKey),
            submittedBy: currentGroupMemberId,
            statusId: gradingState === 'completed' ? 3 : 1,
            gradingState,
            overallStatus: gradingState === 'completed' ? 'graded' : 'manual_required',
            total: gradingState === 'completed' ? attempt.score : 0,
            createdAt,
            updatedAt: createdAt
          });

          if (gradingState !== 'completed') return;

          const questionSeeds = questionByExercise.get(exerciseDef.key) ?? [];
          let remainingScore = attempt.score;

          for (const questionSeed of questionSeeds) {
            const points = Math.max(0, Math.min(questionSeed.points, remainingScore));
            remainingScore -= points;
            const correct = points >= questionSeed.points;
            const optionId = correct ? questionSeed.correctOptionId : questionSeed.wrongOptionId;
            const answerData: AnswerData = { type: 'CHECKBOX', optionIds: [optionId] };

            answerRows.push({
              submissionId: currentSubmissionId,
              questionId: questionSeed.id,
              groupMemberId: currentGroupMemberId,
              point: points,
              answerData
            });
          }
        });
      }
    }
  }

  await insertRows(submission, submissionRows);
  await insertRows(questionAnswer, answerRows);
}

async function seedCompletionRecords(): Promise<void> {
  const completionRows: Array<typeof courseCompletionRecord.$inferInsert> = [];
  const certificateRows: Array<typeof courseCertificateIssue.$inferInsert> = [];
  let completionIndex = 1;
  let certificateIndex = 1;

  for (const student of STUDENTS) {
    const currentProfileId = PERSON_BY_KEY.get(student.key)?.id;

    if (!currentProfileId) continue;

    for (const courseKey of student.courses) {
      const courseDef = COURSE_BY_KEY.get(courseKey);
      const plan = planFor(student.key, courseKey);

      if (!courseDef) continue;

      const complete = courseIsComplete(courseDef, plan);
      const averageScore = courseAverageScore(courseDef, plan);
      const currentGroupMemberId = groupMemberId(student.key, courseKey);
      const currentCourseId = courseId(courseKey);
      const currentCompletionId = completionRecordId(completionIndex++);

      if (courseKey === 'compliance') {
        const complianceRecord = plan.complianceRecord ?? { status: 'in_progress', dueDaysAgo: -30 };
        const dueDate = isoDaysAgo(complianceRecord.dueDaysAgo);
        const completedAt =
          complianceRecord.completedDaysAgo === undefined ? null : isoDaysAgo(complianceRecord.completedDaysAgo);

        completionRows.push({
          id: currentCompletionId,
          courseId: currentCourseId,
          groupMemberId: currentGroupMemberId,
          profileId: currentProfileId,
          cycleNumber: 1,
          status: complianceRecord.status,
          dueDate,
          startedAt: isoDaysAgo(student.joinedDaysAgo),
          completedAt,
          validUntil: completedAt ? isoDaysFromNow(365) : null,
          score: averageScore,
          attempts: 1,
          timeSpentMinutes: 30,
          createdAt: isoDaysAgo(student.joinedDaysAgo),
          updatedAt: isoDaysAgo(1)
        });
        continue;
      }

      if (!complete) continue;

      const completionDaysAgo = plan.completionDaysAgo ?? 45;
      const completedAt = isoDaysAgo(completionDaysAgo);
      const dueDate = isoDaysFromNow(30);
      const validUntil = isoDaysFromNow(365);

      completionRows.push({
        id: currentCompletionId,
        courseId: currentCourseId,
        groupMemberId: currentGroupMemberId,
        profileId: currentProfileId,
        cycleNumber: 1,
        status: 'compliant',
        dueDate,
        startedAt: isoDaysAgo(student.joinedDaysAgo),
        completedAt,
        validUntil,
        score: averageScore,
        attempts: 1,
        timeSpentMinutes: 45,
        createdAt: isoDaysAgo(student.joinedDaysAgo),
        updatedAt: completedAt
      });

      if (plan.certified) {
        certificateRows.push({
          id: certificateId(certificateIndex++),
          courseId: currentCourseId,
          profileId: currentProfileId,
          courseCompletionRecordId: currentCompletionId,
          cycleNumber: 1,
          issuedAt: completedAt,
          expiresAt: isoDaysFromNow(365 - completionDaysAgo),
          status: 'valid'
        });
      }
    }
  }

  await insertRows(courseCompletionRecord, completionRows);
  await insertRows(courseCertificateIssue, certificateRows);
}

async function seedLoginEvents(): Promise<void> {
  const loginRows: Array<typeof analyticsLoginEvents.$inferInsert> = [];

  for (const person of PEOPLE) {
    const uniqueDays = [...new Set(person.loginDaysAgo)];

    for (const daysAgo of uniqueDays) {
      loginRows.push({
        userId: person.id,
        loggedInAt: isoDaysAgo(daysAgo, person.roleId),
        loggedInDate: dateDaysAgo(daysAgo)
      });
    }
  }

  await insertRows(analyticsLoginEvents, loginRows);
}

async function main(): Promise<void> {
  console.log(`Resetting ${ORG_SITE_NAME} seed data`);
  await resetSeedData();
  await seedReferenceRows();

  console.log('Inserting people and organization');
  await seedPeople();
  await seedOrganization();

  console.log('Inserting courses and content');
  await seedCourses();
  const questionByExercise = await seedQuestions();

  console.log('Inserting cohorts, goals, and enrollments');
  await seedCohorts();
  await seedGoals();
  await seedEnrollment();

  console.log('Inserting learning activity');
  await seedLearningActivity();
  await seedSubmissions(questionByExercise);
  await seedCompletionRecords();
  await seedLoginEvents();

  console.log(`Seeded ${ORG_NAME}`);
  console.log(`Admin login: ${ADMIN.email} / 123456`);
  console.log(`Tutor login: ${TUTOR.email} / 123456`);
  console.log(`Student login: ${STUDENT_PEOPLE[3]?.email ?? ADMIN.email} / 123456`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
