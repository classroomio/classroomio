import {
  bigint,
  boolean,
  date,
  doublePrecision,
  foreignKey,
  index,
  integer,
  json,
  jsonb,
  pgEnum,
  pgTable,
  pgView,
  serial,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar
} from 'drizzle-orm/pg-core';

import type { AnswerData } from '@cio/question-types';
import { sql } from 'drizzle-orm';

export const courseType = pgEnum('COURSE_TYPE', ['SELF_PACED', 'LIVE_CLASS', 'COMPLIANCE', 'PUBLIC']);
export const locale = pgEnum('LOCALE', ['en', 'hi', 'fr', 'pt', 'de', 'vi', 'ru', 'es', 'pl', 'da']);
export const plan = pgEnum('PLAN', ['EARLY_ADOPTER', 'ENTERPRISE', 'BASIC']);
export const courseImportSourceType = pgEnum('COURSE_IMPORT_SOURCE_TYPE', ['prompt', 'pdf', 'course']);
export const courseImportDraftStatus = pgEnum('COURSE_IMPORT_DRAFT_STATUS', ['DRAFT', 'PUBLISHED', 'ARCHIVED']);
export const organizationApiKeyType = pgEnum('ORGANIZATION_API_KEY_TYPE', ['mcp', 'api', 'zapier']);
export const automationUsageCategory = pgEnum('AUTOMATION_USAGE_CATEGORY', ['read', 'write', 'publish']);
export const aiAgentRunStatus = pgEnum('AI_AGENT_RUN_STATUS', [
  'queued',
  'running',
  'waiting_for_input',
  'paused',
  'completed',
  'failed',
  'canceled'
]);
export const widgetStatus = pgEnum('WIDGET_STATUS', ['DRAFT', 'PUBLISHED', 'ARCHIVED']);
export const widgetLayoutType = pgEnum('WIDGET_LAYOUT_TYPE', [
  'card_grid',
  'tag_filter',
  'carousel',
  'primary_course',
  'compact_list',
  'editorial_spotlight',
  'category_shelf'
]);
export const widgetSelectionMode = pgEnum('WIDGET_SELECTION_MODE', ['manual', 'published']);
export const courseInviteEventType = pgEnum('COURSE_INVITE_EVENT_TYPE', [
  'CREATED',
  'REVOKED',
  'PREVIEWED',
  'ACCEPTED',
  'EMAIL_SENT',
  'EMAIL_FAILED',
  'ABUSE_BLOCKED'
]);
export const organizationInviteEventType = pgEnum('ORGANIZATION_INVITE_EVENT_TYPE', [
  'CREATED',
  'REVOKED',
  'PREVIEWED',
  'ACCEPTED',
  'EMAIL_SENT',
  'EMAIL_FAILED',
  'ABUSE_BLOCKED'
]);
export const organizationInviteType = pgEnum('ORGANIZATION_INVITE_TYPE', ['EMAIL', 'LINK']);

export const user = pgTable('user', {
  id: uuid()
    .default(sql`gen_random_uuid()`)
    .primaryKey()
    .notNull(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  role: text('role'),
  banned: boolean('banned').default(false),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires'),
  isAnonymous: boolean('is_anonymous')
});

export const ssoProvider = pgTable('sso_provider', {
  id: uuid()
    .default(sql`gen_random_uuid()`)
    .primaryKey()
    .notNull(),
  issuer: text('issuer').notNull(),
  oidcConfig: text('oidc_config'),
  samlConfig: text('saml_config'),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  providerId: text('provider_id').notNull().unique(),
  organizationId: text('organization_id'),
  domain: text('domain').notNull()
});

export const session = pgTable('session', {
  id: uuid()
    .default(sql`gen_random_uuid()`)
    .primaryKey()
    .notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  impersonatedBy: text('impersonated_by')
});

export const account = pgTable('account', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey()
    .notNull(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull()
});

export const verification = pgTable('verification', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey()
    .notNull(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull()
});

export const analyticsLoginEvents = pgTable(
  'analytics_login_events',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    userId: uuid('user_id').notNull(),
    loggedInAt: timestamp('logged_in_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    loggedInDate: date('logged_in_date')
      .default(sql`CURRENT_DATE`)
      .notNull()
  },
  (table) => [
    index('idx_analytics_login_events_logged_in_at').using(
      'btree',
      table.loggedInAt.asc().nullsLast().op('timestamptz_ops')
    ),
    index('idx_analytics_login_events_user_id').using('btree', table.userId.asc().nullsLast().op('uuid_ops')),
    index('idx_analytics_login_events_logged_in_date').using(
      'btree',
      table.loggedInDate.asc().nullsLast().op('date_ops')
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'analytics_login_events_user_id_fkey'
    }),
    unique('analytics_login_events_user_id_date_unique').on(table.userId, table.loggedInDate)
  ]
);

export const analyticsPageEvent = pgTable(
  'analytics_page_event',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    orgId: uuid('org_id'),
    sessionId: text('session_id').notNull(),
    userId: uuid('user_id'),
    eventType: text('event_type').notNull(),
    courseId: uuid('course_id'),
    path: text('path'),
    referrerHost: text('referrer_host'),
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    utmCampaign: text('utm_campaign'),
    country: varchar('country', { length: 2 }),
    deviceType: varchar('device_type', { length: 16 }),
    locale: varchar('locale', { length: 8 }),
    props: jsonb().default({}).notNull()
  },
  (table) => [
    index('idx_ape_org_occurred').on(table.orgId, table.occurredAt),
    index('idx_ape_course_occurred').on(table.courseId, table.occurredAt),
    index('idx_ape_session').on(table.sessionId),
    index('idx_ape_event_type').on(table.eventType),
    index('idx_ape_user').on(table.userId)
  ]
);

export const analyticsOrgDaily = pgTable(
  'analytics_org_daily',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    orgId: uuid('org_id').notNull(),
    date: date('date').notNull(),
    landingViews: integer('landing_views').default(0).notNull(),
    uniqueVisitors: integer('unique_visitors').default(0).notNull(),
    coursePageViews: integer('course_page_views').default(0).notNull(),
    enrollments: integer('enrollments').default(0).notNull(),
    completions: integer('completions').default(0).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    unique('analytics_org_daily_org_date_unique').on(table.orgId, table.date),
    index('idx_aod_org_date').on(table.orgId, table.date)
  ]
);

export const analyticsCourseDaily = pgTable(
  'analytics_course_daily',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    courseId: uuid('course_id').notNull(),
    orgId: uuid('org_id').notNull(),
    date: date('date').notNull(),
    views: integer('views').default(0).notNull(),
    uniqueVisitors: integer('unique_visitors').default(0).notNull(),
    enrollments: integer('enrollments').default(0).notNull(),
    completions: integer('completions').default(0).notNull(),
    avgTimeToEnrollSeconds: integer('avg_time_to_enroll_seconds'),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    unique('analytics_course_daily_course_date_unique').on(table.courseId, table.date),
    index('idx_acd_org_date').on(table.orgId, table.date),
    index('idx_acd_course_date').on(table.courseId, table.date)
  ]
);

export const analyticsCountryDaily = pgTable(
  'analytics_country_daily',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    orgId: uuid('org_id').notNull(),
    date: date('date').notNull(),
    country: varchar('country', { length: 2 }).notNull(),
    views: integer('views').default(0).notNull(),
    enrollments: integer('enrollments').default(0).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    unique('analytics_country_daily_org_date_country_unique').on(table.orgId, table.date, table.country),
    index('idx_acntd_org_date').on(table.orgId, table.date)
  ]
);

export const courseSection = pgTable('course_section', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  title: varchar(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  order: bigint({ mode: 'number' }).default(sql`'0'`),
  courseId: uuid('course_id').references(() => course.id, {
    onDelete: 'cascade',
    onUpdate: 'cascade'
  })
});

export const group = pgTable(
  'group',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    name: varchar().notNull(),
    description: text(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    organizationId: uuid('organization_id')
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: 'group_organization_id_fkey'
    }),
    index('idx_group_organization_id').on(table.organizationId)
  ]
);

export const groupAttendance = pgTable(
  'group_attendance',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({
      name: 'group_attendance_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      cache: 1
    }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    courseId: uuid('course_id'),
    studentId: uuid('student_id'),
    isPresent: boolean('is_present').default(false),
    lessonId: uuid('lesson_id').notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.courseId],
      foreignColumns: [course.id],
      name: 'group_attendance_course_id_fkey'
    }),
    foreignKey({
      columns: [table.studentId],
      foreignColumns: [groupmember.id],
      name: 'group_attendance_student_id_fkey'
    })
  ]
);

export const currency = pgTable('currency', {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({
    name: 'currency_id_seq',
    startWith: 1,
    increment: 1,
    minValue: 1,
    cache: 1
  }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  name: varchar()
});

export const appsPollOption = pgTable(
  'apps_poll_option',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({
      name: 'apps_poll_option_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      cache: 1
    }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }),
    pollId: uuid('poll_id'),
    label: varchar()
  },
  (table) => [
    foreignKey({
      columns: [table.pollId],
      foreignColumns: [appsPoll.id],
      name: 'apps_poll_option_poll_id_fkey'
    })
  ]
);

export const profile = pgTable(
  'profile',
  {
    id: uuid().primaryKey().notNull(),
    fullname: text().notNull(),
    username: text().notNull(),
    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    email: varchar(),
    canAddCourse: boolean('can_add_course').default(true),
    role: varchar(),
    goal: varchar(),
    source: varchar(),
    metadata: json(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    telegramChatId: bigint('telegram_chat_id', { mode: 'number' }),
    isEmailVerified: boolean('is_email_verified').default(false),
    verifiedAt: timestamp('verified_at', { withTimezone: true, mode: 'string' }),
    locale: locale().default('en'),
    isRestricted: boolean('is_restricted').default(false).notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.id],
      foreignColumns: [user.id],
      name: 'profile_id_fkey'
    }),
    unique('profile_username_key').on(table.username),
    unique('profile_email_key').on(table.email),
    index('idx_profile_id').on(table.id),
    index('idx_profile_email').on(table.email)
  ]
);

export const option = pgTable(
  'option',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({
      name: 'option_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      cache: 1
    }),
    label: varchar().notNull(),
    isCorrect: boolean('is_correct').default(false).notNull(),
    settings: jsonb().default({}),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    questionId: bigint('question_id', { mode: 'number' }).notNull(),
    value: uuid().default(sql`gen_random_uuid()`),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow()
  },
  (table) => [
    foreignKey({
      columns: [table.questionId],
      foreignColumns: [question.id],
      name: 'option_question_id_fkey'
    }).onDelete('cascade')
  ]
);

export const quizPlay = pgTable(
  'quiz_play',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({
      name: 'play_quiz_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      cache: 1
    }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    quizId: uuid('quiz_id'),
    players: json().default([]),
    started: boolean().default(false),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    currentQuestionId: bigint({ mode: 'number' }).default(sql`'0'`),
    showCurrentQuestionAnswer: boolean().default(false),
    isLastQuestion: boolean(),
    step: text().default('CONNECT_TO_PLAY'),
    studentStep: text().default('PIN_SETUP'),
    pin: text()
  },
  (table) => [
    foreignKey({
      columns: [table.quizId],
      foreignColumns: [quiz.id],
      name: 'quiz_play_quiz_id_fkey'
    }),
    unique('quiz_play_pin_key').on(table.pin)
  ]
);

export const organizationContacts = pgTable(
  'organization_contacts',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({
      name: 'organization_contacts_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      cache: 1
    }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    email: text(),
    phone: text(),
    name: text(),
    message: text(),
    organizationId: uuid('organization_id')
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: 'organization_contacts_organization_id_fkey'
    })
  ]
);

export const lessonComment = pgTable(
  'lesson_comment',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({
      name: 'lesson_comment_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      cache: 1
    }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    lessonId: uuid('lesson_id'),
    groupmemberId: uuid('groupmember_id'),
    comment: text()
  },
  (table) => [
    foreignKey({
      columns: [table.groupmemberId],
      foreignColumns: [groupmember.id],
      name: 'lesson_comment_groupmember_id_fkey'
    }),
    foreignKey({
      columns: [table.lessonId],
      foreignColumns: [lesson.id],
      name: 'lesson_comment_lesson_id_fkey'
    }).onDelete('cascade')
  ]
);

export const quiz = pgTable(
  'quiz',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    title: text(),
    questions: json(),
    timelimit: varchar().default('10s'),
    theme: varchar().default('standard'),
    organizationId: uuid('organization_id').notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: 'quiz_organization_id_fkey'
    })
  ]
);

export const submission = pgTable(
  'submission',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    reviewerId: bigint('reviewer_id', { mode: 'number' }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    statusId: bigint('status_id', { mode: 'number' }).default(sql`'1'`),
    gradingState: varchar('grading_state').default('queued').notNull(),
    overallStatus: varchar('overall_status').default('manual_required').notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    total: bigint({ mode: 'number' }).default(sql`'0'`),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    exerciseId: uuid('exercise_id').notNull(),
    submittedBy: uuid('submitted_by'),
    courseId: uuid('course_id'),
    feedback: text()
  },
  (table) => [
    foreignKey({
      columns: [table.courseId],
      foreignColumns: [course.id],
      name: 'submission_course_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.exerciseId],
      foreignColumns: [exercise.id],
      name: 'submission_exercise_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.statusId],
      foreignColumns: [submissionstatus.id],
      name: 'submission_status_id_fkey'
    }),
    foreignKey({
      columns: [table.submittedBy],
      foreignColumns: [groupmember.id],
      name: 'submission_submitted_by_fkey'
    })
  ]
);

export const submissionstatus = pgTable(
  'submissionstatus',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({
      name: 'submission_status_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      cache: 1
    }),
    label: varchar().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow()
  },
  () => []
);

export const course = pgTable(
  'course',
  {
    title: varchar().notNull(),
    description: varchar().notNull(),
    overview: varchar().default('Welcome to this amazing course 🚀 '),
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    groupId: uuid('group_id'),
    isTemplate: boolean('is_template').default(true),
    logo: text().default('').notNull(),
    slug: varchar(),
    metadata: jsonb().default({ goals: '', description: '', requirements: '' }).notNull().$type<{
      requirements?: string;
      description?: string;
      goals?: string;
      videoUrl?: string;
      showDiscount?: boolean;
      discount?: number;
      paymentLink?: string;
      reward?: {
        show: boolean;
        description: string;
      };
      instructor?: {
        name: string;
        role: string;
        coursesNo: number;
        description: string;
        imgUrl: string;
      };
      certificate?: {
        templateUrl: string;
      };
      reviews?: {
        id: number;
        hide: boolean;
        name: string;
        avatar_url: string;
        rating: number;
        created_at: number;
        description: string;
      }[];
      skills?: string[];
      tools?: string[];
      lessonTabsOrder?: {
        id: 1 | 2 | 3 | 4;
        name: string;
      }[];
      grading?: boolean;
      lessonDownload?: boolean;
      allowNewStudent: boolean;
      sectionDisplay?: Record<string, boolean>;
      isContentGroupingEnabled?: boolean;
      /** Per-course AI tutor override; missing fields inherit from org defaults. */
      aiTutor?: {
        inheritFromOrg?: boolean;
        enabled?: boolean;
        persona?: 'friendly' | 'formal' | 'encouraging' | 'socratic' | 'custom';
        customPersona?: string;
        responseLength?: 'short' | 'medium' | 'long';
        welcomeMessage?: string;
        disclaimerFooter?: string;
        thingsToSay?: string;
        thingsNotToSay?: string;
        forbiddenTopics?: string[];
        groundingScope?: 'lesson' | 'course' | 'workspace';
        requireCitations?: boolean;
        assessmentMode?: 'direct_answer' | 'hint_only' | 'block_during_exercise';
        revealSolutionsAfterAttempts?: number;
        codePolicy?: 'allowed' | 'hints_only' | 'forbidden';
        blockOffTopic?: boolean;
        profanityFilter?: boolean;
        escalation?: { enabled?: boolean; email?: string };
      };
    }>(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    cost: bigint({ mode: 'number' }).default(sql`'0'`),
    currency: varchar().default('USD').notNull(),
    bannerImage: text('banner_image'),
    isPublished: boolean('is_published').default(false),
    certificate: jsonb().default({}).$type<{
      isDownloadable?: boolean;
      /** @deprecated Use `design.templateId`. Legacy 6-theme id; mapped on read via LEGACY_THEME_MAP. */
      theme?: string;
      /** Atelier-era certificate design. Source of truth for new courses. */
      design?: {
        templateId: 'classique' | 'brutalist' | 'noir' | 'poster' | 'minimal';
        accentColor: string;
        subtitle?: string;
        descriptionOverride?: string;
        signatories: [{ name: string; role: string }, { name: string; role: string }];
        idFormat?: string;
      };
      deadline?: string | null;
      threshold?: number;
      requiredExerciseId?: string | null;
      exerciseMinScorePercent?: number | null;
      emailMessage?: string | null;
    }>(),
    compliance: jsonb().$type<{
      retakeIntervalMonths: number;
      gracePeriodDays?: number;
      reminderDaysBefore?: number[];
      isMandatory?: boolean;
      framework?: 'HIPAA' | 'OSHA' | 'SOX' | 'GDPR' | 'PCI_DSS' | 'FERPA' | 'ISO' | 'CUSTOM' | null;
      maxRetakeAttempts?: number | null;
      passingScore?: number;
    }>(),
    status: text().default('ACTIVE').notNull(),
    type: courseType().default('SELF_PACED'),
    callout: jsonb().$type<{
      title: string;
      description: string;
      buttonLabel: string;
      buttonUrl: string;
      animation?: 'waves' | 'dotted' | 'none';
    } | null>()
  },
  (table) => [
    foreignKey({
      columns: [table.groupId],
      foreignColumns: [group.id],
      name: 'course_group_id_fkey'
    }),
    unique('course_slug_key').on(table.slug),
    index('idx_course_group_id').on(table.groupId)
  ]
);

export const courseCompletionRecord = pgTable(
  'course_completion_record',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    courseId: uuid('course_id').notNull(),
    groupMemberId: uuid('group_member_id').notNull(),
    profileId: uuid('profile_id').notNull(),
    cycleNumber: integer('cycle_number').default(1).notNull(),
    status: varchar().default('not_started').notNull(),
    dueDate: timestamp('due_date', { withTimezone: true, mode: 'string' }).notNull(),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'string' }),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'string' }),
    validUntil: timestamp('valid_until', { withTimezone: true, mode: 'string' }),
    expiredAt: timestamp('expired_at', { withTimezone: true, mode: 'string' }),
    score: integer(),
    attempts: integer().default(0),
    timeSpentMinutes: integer('time_spent_minutes').default(0),
    waivedBy: uuid('waived_by'),
    waiverReason: text('waiver_reason'),
    waiverExpiresAt: timestamp('waiver_expires_at', { withTimezone: true, mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.courseId],
      foreignColumns: [course.id],
      name: 'course_completion_record_course_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.groupMemberId],
      foreignColumns: [groupmember.id],
      name: 'course_completion_record_group_member_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.profileId],
      foreignColumns: [profile.id],
      name: 'course_completion_record_profile_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.waivedBy],
      foreignColumns: [profile.id],
      name: 'course_completion_record_waived_by_fkey'
    }).onDelete('set null'),
    unique('course_completion_record_course_profile_cycle_key').on(table.courseId, table.profileId, table.cycleNumber),
    index('idx_course_completion_record_course_id').on(table.courseId),
    index('idx_course_completion_record_profile_id').on(table.profileId),
    index('idx_course_completion_record_status').on(table.status),
    index('idx_course_completion_record_due_date').on(table.dueDate),
    index('idx_course_completion_record_valid_until').on(table.validUntil)
  ]
);

export const courseCompletionNotificationEvent = pgTable(
  'course_completion_notification_event',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    courseCompletionRecordId: uuid('course_completion_record_id').notNull(),
    channel: varchar().notNull(),
    eventType: varchar('event_type').notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.courseCompletionRecordId],
      foreignColumns: [courseCompletionRecord.id],
      name: 'course_completion_notification_event_record_id_fkey'
    }).onDelete('cascade'),
    unique('course_completion_notification_event_record_channel_type_key').on(
      table.courseCompletionRecordId,
      table.channel,
      table.eventType
    )
  ]
);

export const courseCertificateIssue = pgTable(
  'course_certificate_issue',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    courseId: uuid('course_id').notNull(),
    profileId: uuid('profile_id').notNull(),
    courseCompletionRecordId: uuid('course_completion_record_id').notNull(),
    cycleNumber: integer('cycle_number').notNull(),
    issuedAt: timestamp('issued_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }).notNull(),
    status: varchar().default('valid').notNull(),
    fileUrl: text('file_url')
  },
  (table) => [
    foreignKey({
      columns: [table.courseId],
      foreignColumns: [course.id],
      name: 'course_certificate_issue_course_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.profileId],
      foreignColumns: [profile.id],
      name: 'course_certificate_issue_profile_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.courseCompletionRecordId],
      foreignColumns: [courseCompletionRecord.id],
      name: 'course_certificate_issue_record_id_fkey'
    }).onDelete('cascade'),
    unique('course_certificate_issue_record_id_key').on(table.courseCompletionRecordId),
    index('idx_course_certificate_issue_course_id').on(table.courseId),
    index('idx_course_certificate_issue_profile_id').on(table.profileId),
    index('idx_course_certificate_issue_status').on(table.status)
  ]
);

export const appsPoll = pgTable(
  'apps_poll',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    question: text(),
    authorId: uuid(),
    isPublic: boolean(),
    status: varchar().default('draft'),
    expiration: timestamp({ withTimezone: true, mode: 'string' }),
    courseId: uuid()
  },
  (table) => [
    foreignKey({
      columns: [table.authorId],
      foreignColumns: [groupmember.id],
      name: 'apps_poll_authorId_fkey'
    }),
    foreignKey({
      columns: [table.courseId],
      foreignColumns: [course.id],
      name: 'apps_poll_courseId_fkey'
    })
  ]
);

export const videoTranscripts = pgTable('video_transcripts', {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({
    name: 'video_transcripts_id_seq',
    startWith: 1,
    increment: 1,
    minValue: 1,
    cache: 1
  }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  museSvid: text('muse_svid'),
  transcript: text(),
  downloaded: boolean().default(false),
  link: text()
});

export const organizationEmaillist = pgTable(
  'organization_emaillist',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({
      name: 'organization_emaillist_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      cache: 1
    }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    email: text(),
    organizationId: uuid('organization_id')
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: 'organization_emaillist_organization_id_fkey'
    })
  ]
);

export const lesson = pgTable(
  'lesson',
  {
    note: varchar(),
    videoUrl: varchar('video_url'),
    slideUrl: varchar('slide_url'),
    courseId: uuid('course_id').notNull(),
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    title: varchar().notNull(),
    public: boolean().default(false),
    lessonAt: timestamp('lesson_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    teacherId: uuid('teacher_id'),
    isComplete: boolean('is_complete').default(false),
    callUrl: text('call_url'),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    order: bigint({ mode: 'number' }),
    isUnlocked: boolean('is_unlocked').default(false),
    videos: jsonb().default([]).$type<
      {
        type: 'youtube' | 'generic' | 'upload' | 'google_drive';
        link: string;
        key?: string;
        assetId?: string;
        /** Display name; stored on add/upload. Fallback: derive from key or type. */
        fileName?: string;
        metadata?: {
          svid?: string;
          title?: string;
          description?: string;
          thumbnailUrl?: string;
          duration?: number;
          aspectRatio?: string;
          createdAt?: string;
        };
      }[]
    >(),
    documents: jsonb().default([]).$type<
      {
        type: string;
        name: string;
        link: string;
        size?: number;
        key: string;
        assetId?: string;
      }[]
    >(),
    sectionId: uuid('section_id').references(() => courseSection.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade'
    }),
    slug: varchar()
  },
  (table) => [
    foreignKey({
      columns: [table.courseId],
      foreignColumns: [course.id],
      name: 'lesson_course_id_fkey'
    }),
    foreignKey({
      columns: [table.teacherId],
      foreignColumns: [profile.id],
      name: 'lesson_teacher_id_fkey'
    }),
    index('idx_lesson_course_slug').on(table.courseId, table.slug)
  ]
);

export const asset = pgTable(
  'assets',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    organizationId: uuid('organization_id').notNull(),
    kind: varchar().default('video').notNull(),
    provider: varchar().default('upload').notNull(),
    storageProvider: varchar('storage_provider').default('s3').notNull(),
    storageKey: text('storage_key'),
    hlsManifestKey: text('hls_manifest_key'),
    hlsAudioKey: text('hls_audio_key'),
    sourceUrl: text('source_url'),
    mimeType: text('mime_type'),
    byteSize: bigint('byte_size', { mode: 'number' }),
    checksum: text(),
    title: text(),
    description: text(),
    thumbnailUrl: text('thumbnail_url'),
    thumbnailCandidates: text('thumbnail_candidates')
      .array()
      .default(sql`'{}'::text[]`)
      .notNull(),
    durationSeconds: integer('duration_seconds'),
    aspectRatio: text('aspect_ratio'),
    isExternal: boolean('is_external').default(false).notNull(),
    status: varchar().default('active').notNull(),
    metadata: jsonb().default({}),
    createdByProfileId: uuid('created_by_profile_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow()
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: 'assets_organization_id_fkey'
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.createdByProfileId],
      foreignColumns: [profile.id],
      name: 'assets_created_by_profile_id_fkey'
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    index('idx_assets_organization_id').on(table.organizationId),
    index('idx_assets_organization_status').on(table.organizationId, table.status),
    index('idx_assets_organization_kind_status').on(table.organizationId, table.kind, table.status),
    index('idx_assets_organization_created_at').on(table.organizationId, table.createdAt),
    index('idx_assets_organization_byte_size').on(table.organizationId, table.byteSize),
    unique('assets_org_provider_storage_key_unique').on(table.organizationId, table.provider, table.storageKey)
  ]
);

export const assetUsage = pgTable(
  'asset_usages',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    organizationId: uuid('organization_id').notNull(),
    assetId: uuid('asset_id').notNull(),
    targetType: varchar('target_type').notNull(),
    targetId: text('target_id').notNull(),
    slotType: varchar('slot_type').default('lesson_video').notNull(),
    slotKey: text('slot_key'),
    position: integer(),
    createdByProfileId: uuid('created_by_profile_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: 'asset_usages_organization_id_fkey'
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.assetId],
      foreignColumns: [asset.id],
      name: 'asset_usages_asset_id_fkey'
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.createdByProfileId],
      foreignColumns: [profile.id],
      name: 'asset_usages_created_by_profile_id_fkey'
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    index('idx_asset_usages_org_id').on(table.organizationId),
    index('idx_asset_usages_asset_id').on(table.assetId),
    index('idx_asset_usages_target').on(table.targetType, table.targetId),
    unique('asset_usages_asset_target_slot_unique').on(
      table.assetId,
      table.targetType,
      table.targetId,
      table.slotType,
      table.slotKey,
      table.position
    )
  ]
);

export const appsPollSubmission = pgTable(
  'apps_poll_submission',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({
      name: 'apps_poll_submision_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      cache: 1
    }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    pollOptionId: bigint('poll_option_id', { mode: 'number' }),
    selectedById: uuid('selected_by_id'),
    pollId: uuid('poll_id')
  },
  (table) => [
    foreignKey({
      columns: [table.pollId],
      foreignColumns: [appsPoll.id],
      name: 'apps_poll_submission_poll_id_fkey'
    }),
    foreignKey({
      columns: [table.pollOptionId],
      foreignColumns: [appsPollOption.id],
      name: 'apps_poll_submission_poll_option_id_fkey'
    }),
    foreignKey({
      columns: [table.selectedById],
      foreignColumns: [groupmember.id],
      name: 'apps_poll_submission_selected_by_id_fkey'
    })
  ]
);

export const exercise = pgTable(
  'exercise',
  {
    title: varchar().notNull(),
    description: varchar(),
    lessonId: uuid('lesson_id'),
    courseId: uuid('course_id'),
    sectionId: uuid('section_id'),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    order: bigint({ mode: 'number' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    isUnlocked: boolean('is_unlocked').default(true),
    dueBy: timestamp('due_by', { mode: 'string' }),
    allowMultipleAttempts: boolean('allow_multiple_attempts').default(false).notNull(),
    sectionDisplayMode: varchar('section_display_mode').default('one_question'),
    slug: varchar()
  },
  (table) => [
    foreignKey({
      columns: [table.lessonId],
      foreignColumns: [lesson.id],
      name: 'exercise_lesson_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.courseId],
      foreignColumns: [course.id],
      name: 'exercise_course_id_fkey'
    }),
    foreignKey({
      columns: [table.sectionId],
      foreignColumns: [courseSection.id],
      name: 'exercise_section_id_fkey'
    }),
    index('idx_exercise_course_slug').on(table.courseId, table.slug)
  ]
);

export const exerciseSection = pgTable(
  'exercise_section',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    exerciseId: uuid('exercise_id').notNull(),
    title: varchar().notNull().default('Untitled Section'),
    description: text(),
    order: bigint({ mode: 'number' }).notNull().default(0),
    colorTheme: varchar('color_theme').notNull().default('blue'),
    afterBehavior: jsonb('after_behavior').notNull().default({ action: 'continue' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow()
  },
  (table) => [
    foreignKey({
      columns: [table.exerciseId],
      foreignColumns: [exercise.id],
      name: 'exercise_section_exercise_id_fkey'
    }).onDelete('cascade'),
    index('idx_exercise_section_exercise_id').on(table.exerciseId)
  ]
);

export const groupmember = pgTable(
  'groupmember',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    groupId: uuid('group_id').notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    roleId: bigint('role_id', { mode: 'number' }).notNull(),
    profileId: uuid('profile_id'),
    email: varchar(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    assignedStudentId: varchar('assigned_student_id'),
    certificateEarnedAt: timestamp('certificate_earned_at', { withTimezone: true, mode: 'string' }),
    certificationEmailSentAt: timestamp('certification_email_sent_at', { withTimezone: true, mode: 'string' })
  },
  (table) => [
    foreignKey({
      columns: [table.groupId],
      foreignColumns: [group.id],
      name: 'groupmember_group_id_fkey'
    }),
    foreignKey({
      columns: [table.profileId],
      foreignColumns: [profile.id],
      name: 'groupmember_profile_id_fkey'
    }),
    foreignKey({
      columns: [table.roleId],
      foreignColumns: [role.id],
      name: 'groupmember_role_id_fkey'
    }),
    unique('unique_entries').on(table.groupId, table.profileId, table.email),
    unique('unique_group_email').on(table.groupId, table.email),
    unique('unique_group_profile').on(table.groupId, table.profileId)
  ]
);

export const courseInvite = pgTable(
  'course_invite',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    courseId: uuid('course_id').notNull(),
    // Reserved for future invite-role expansion (defaults to student invites)
    roleId: bigint('role_id', { mode: 'number' })
      .default(sql`'3'`)
      .notNull(),
    tokenHash: text('token_hash').notNull(),
    createdByProfileId: uuid('created_by_profile_id').notNull(),
    revokedByProfileId: uuid('revoked_by_profile_id'),
    revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'string' }),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }).notNull(),
    maxUses: integer('max_uses').default(1).notNull(),
    usedCount: integer('used_count').default(0).notNull(),
    isRevoked: boolean('is_revoked').default(false).notNull(),
    allowedEmails: text('allowed_emails').array(),
    allowedDomains: text('allowed_domains').array(),
    metadata: jsonb().default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true, mode: 'string' })
  },
  (table) => [
    foreignKey({
      columns: [table.courseId],
      foreignColumns: [course.id],
      name: 'course_invite_course_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.createdByProfileId],
      foreignColumns: [profile.id],
      name: 'course_invite_created_by_profile_id_fkey'
    }),
    foreignKey({
      columns: [table.revokedByProfileId],
      foreignColumns: [profile.id],
      name: 'course_invite_revoked_by_profile_id_fkey'
    }),
    foreignKey({
      columns: [table.roleId],
      foreignColumns: [role.id],
      name: 'course_invite_role_id_fkey'
    }),
    unique('course_invite_token_hash_key').on(table.tokenHash),
    index('idx_course_invite_course_id').on(table.courseId),
    index('idx_course_invite_expires_at').on(table.expiresAt),
    index('idx_course_invite_created_by').on(table.createdByProfileId),
    index('idx_course_invite_revoked_by').on(table.revokedByProfileId)
  ]
);

export const courseInviteAudit = pgTable(
  'course_invite_audit',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    inviteId: uuid('invite_id').notNull(),
    courseId: uuid('course_id').notNull(),
    eventType: courseInviteEventType('event_type').notNull(),
    actorProfileId: uuid('actor_profile_id'),
    targetEmail: varchar('target_email'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    metadata: jsonb().default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .default(sql`timezone('utc'::text, now())`)
      .notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.inviteId],
      foreignColumns: [courseInvite.id],
      name: 'course_invite_audit_invite_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.courseId],
      foreignColumns: [course.id],
      name: 'course_invite_audit_course_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.actorProfileId],
      foreignColumns: [profile.id],
      name: 'course_invite_audit_actor_profile_id_fkey'
    }),
    index('idx_course_invite_audit_invite_id').on(table.inviteId),
    index('idx_course_invite_audit_course_id').on(table.courseId),
    index('idx_course_invite_audit_event_type').on(table.eventType),
    index('idx_course_invite_audit_created_at').on(table.createdAt)
  ]
);

export const organizationInvite = pgTable(
  'organization_invite',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    organizationId: uuid('organization_id').notNull(),
    // Role assigned when invite is accepted (e.g ADMIN, TUTOR)
    roleId: bigint('role_id', { mode: 'number' }).notNull(),
    type: organizationInviteType('type').default('EMAIL').notNull(),
    email: text(),
    tokenHash: text('token_hash').notNull(),
    createdByProfileId: uuid('created_by_profile_id').notNull(),
    acceptedByProfileId: uuid('accepted_by_profile_id'),
    acceptedAt: timestamp('accepted_at', { withTimezone: true, mode: 'string' }),
    revokedByProfileId: uuid('revoked_by_profile_id'),
    revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'string' }),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }).notNull(),
    isRevoked: boolean('is_revoked').default(false).notNull(),
    metadata: jsonb().default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .default(sql`timezone('utc'::text, now())`)
      .notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: 'organization_invite_organization_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.roleId],
      foreignColumns: [role.id],
      name: 'organization_invite_role_id_fkey'
    }),
    foreignKey({
      columns: [table.createdByProfileId],
      foreignColumns: [profile.id],
      name: 'organization_invite_created_by_profile_id_fkey'
    }),
    foreignKey({
      columns: [table.acceptedByProfileId],
      foreignColumns: [profile.id],
      name: 'organization_invite_accepted_by_profile_id_fkey'
    }),
    foreignKey({
      columns: [table.revokedByProfileId],
      foreignColumns: [profile.id],
      name: 'organization_invite_revoked_by_profile_id_fkey'
    }),
    unique('organization_invite_token_hash_key').on(table.tokenHash),
    index('idx_organization_invite_organization_id').on(table.organizationId),
    index('idx_organization_invite_email_org').on(table.email, table.organizationId),
    index('idx_organization_invite_expires_at').on(table.expiresAt),
    index('idx_organization_invite_created_by').on(table.createdByProfileId),
    index('idx_organization_invite_accepted_by').on(table.acceptedByProfileId),
    index('idx_organization_invite_revoked_by').on(table.revokedByProfileId)
  ]
);

export const organizationInviteAudit = pgTable(
  'organization_invite_audit',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    inviteId: uuid('invite_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    eventType: organizationInviteEventType('event_type').notNull(),
    actorProfileId: uuid('actor_profile_id'),
    targetEmail: varchar('target_email'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    metadata: jsonb().default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .default(sql`timezone('utc'::text, now())`)
      .notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.inviteId],
      foreignColumns: [organizationInvite.id],
      name: 'organization_invite_audit_invite_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: 'organization_invite_audit_organization_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.actorProfileId],
      foreignColumns: [profile.id],
      name: 'organization_invite_audit_actor_profile_id_fkey'
    }),
    index('idx_organization_invite_audit_invite_id').on(table.inviteId),
    index('idx_organization_invite_audit_org_id').on(table.organizationId),
    index('idx_organization_invite_audit_event_type').on(table.eventType),
    index('idx_organization_invite_audit_created_at').on(table.createdAt)
  ]
);

export const lessonCompletion = pgTable(
  'lesson_completion',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({
      name: 'lesson_completion_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      cache: 1
    }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    lessonId: uuid('lesson_id'),
    profileId: uuid('profile_id'),
    isComplete: boolean('is_complete').default(false),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow()
  },
  (table) => [
    foreignKey({
      columns: [table.lessonId],
      foreignColumns: [lesson.id],
      name: 'lesson_completion_lesson_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.profileId],
      foreignColumns: [profile.id],
      name: 'lesson_completion_profile_id_fkey'
    }),
    unique('unique_lesson_profile').on(table.lessonId, table.profileId)
  ]
);

export const communityAnswer = pgTable(
  'community_answer',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    questionId: bigint('question_id', { mode: 'number' }),
    body: varchar(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    authorId: bigint('author_id', { mode: 'number' }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    votes: bigint({ mode: 'number' }),
    authorProfileId: uuid('author_profile_id')
  },
  (table) => [
    foreignKey({
      columns: [table.authorId],
      foreignColumns: [organizationmember.id],
      name: 'community_answer_author_id_fkey'
    }),
    foreignKey({
      columns: [table.authorProfileId],
      foreignColumns: [profile.id],
      name: 'community_answer_author_profile_id_fkey'
    }),
    foreignKey({
      columns: [table.questionId],
      foreignColumns: [communityQuestion.id],
      name: 'community_answer_question_id_fkey'
    })
  ]
);

export const communityQuestion = pgTable(
  'community_question',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({
      name: 'community_question_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      cache: 1
    }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    title: varchar(),
    body: text(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    authorId: bigint('author_id', { mode: 'number' }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    votes: bigint({ mode: 'number' }).default(sql`'0'`),
    organizationId: uuid('organization_id'),
    slug: text(),
    authorProfileId: uuid('author_profile_id'),
    courseId: uuid('course_id').notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.authorId],
      foreignColumns: [organizationmember.id],
      name: 'community_question_author_id_fkey'
    }),
    foreignKey({
      columns: [table.authorProfileId],
      foreignColumns: [profile.id],
      name: 'community_question_author_profile_id_fkey'
    }),
    foreignKey({
      columns: [table.courseId],
      foreignColumns: [course.id],
      name: 'community_question_course_id_fkey'
    }),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: 'community_question_organization_id_fkey'
    })
  ]
);

export const courseNewsfeed = pgTable(
  'course_newsfeed',
  {
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    authorId: uuid('author_id'),
    content: text(),
    id: uuid().defaultRandom().primaryKey().notNull(),
    courseId: uuid('course_id'),
    reaction: jsonb()
      .default({ clap: [], smile: [], thumbsup: [], thumbsdown: [] })
      .$type<{ clap: string[]; smile: string[]; thumbsup: string[]; thumbsdown: string[] }>(),
    isPinned: boolean('is_pinned').default(false).notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.authorId],
      foreignColumns: [groupmember.id],
      name: 'course_newsfeed_author_id_fkey'
    }),
    foreignKey({
      columns: [table.courseId],
      foreignColumns: [course.id],
      name: 'course_newsfeed_course_id_fkey'
    })
  ]
);

export const courseNewsfeedComment = pgTable(
  'course_newsfeed_comment',
  {
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    authorId: uuid('author_id'),
    content: text(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({
      name: 'course_newsfeed_comment_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      cache: 1
    }),
    courseNewsfeedId: uuid('course_newsfeed_id')
  },
  (table) => [
    foreignKey({
      columns: [table.authorId],
      foreignColumns: [groupmember.id],
      name: 'course_newsfeed_comment_author_id_fkey'
    }),
    foreignKey({
      columns: [table.courseNewsfeedId],
      foreignColumns: [courseNewsfeed.id],
      name: 'course_newsfeed_comment_course_newsfeed_id_fkey'
    })
  ]
);

export const testTenant = pgTable('test_tenant', {
  id: serial().primaryKey().notNull(),
  details: text()
});

export const organizationPlan = pgTable(
  'organization_plan',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({
      name: 'organization_plan_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      cache: 1
    }),
    activatedAt: timestamp('activated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    orgId: uuid('org_id'),
    planName: plan('plan_name'),
    isActive: boolean('is_active'),
    deactivatedAt: timestamp('deactivated_at', { withTimezone: true, mode: 'string' }),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    payload: jsonb(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    triggeredBy: bigint('triggered_by', { mode: 'number' }),
    provider: text().default('lmz'),
    subscriptionId: text('subscription_id')
  },
  (table) => [
    foreignKey({
      columns: [table.orgId],
      foreignColumns: [organization.id],
      name: 'organization_plan_org_id_fkey'
    }),
    foreignKey({
      columns: [table.triggeredBy],
      foreignColumns: [organizationmember.id],
      name: 'organization_plan_triggered_by_fkey'
    }),
    unique('organization_plan_subscription_id_key').on(table.subscriptionId),
    index('idx_organization_plan_org_id').on(table.orgId)
  ]
);

export const lessonLanguage = pgTable(
  'lesson_language',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({
      name: 'lesson_language_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      cache: 1
    }),
    content: text(),
    lessonId: uuid('lesson_id').defaultRandom(),
    locale: locale().default('en')
  },
  (table) => [
    foreignKey({
      columns: [table.lessonId],
      foreignColumns: [lesson.id],
      name: 'public_lesson_language_lesson_id_fkey'
    })
      .onUpdate('cascade')
      .onDelete('cascade')
  ]
);

export const lessonLanguageHistory = pgTable(
  'lesson_language_history',
  {
    id: serial().primaryKey().notNull(),
    lessonLanguageId: integer('lesson_language_id'),
    oldContent: text('old_content'),
    newContent: text('new_content'),
    timestamp: timestamp({ mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.lessonLanguageId],
      foreignColumns: [lessonLanguage.id],
      name: 'public_lesson_language_history_lesson_language_id_fkey'
    })
      .onUpdate('cascade')
      .onDelete('cascade')
  ]
);

export const organizationmember = pgTable(
  'organizationmember',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({
      name: 'organizationmember_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      cache: 1
    }),
    organizationId: uuid('organization_id').notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    roleId: bigint('role_id', { mode: 'number' }).notNull(),
    profileId: uuid('profile_id'),
    email: text(),
    verified: boolean().default(false),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .default(sql`timezone('utc'::text, now())`)
      .notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: 'organizationmember_organization_id_fkey'
    }),
    foreignKey({
      columns: [table.profileId],
      foreignColumns: [profile.id],
      name: 'organizationmember_profile_id_fkey'
    }),
    foreignKey({
      columns: [table.roleId],
      foreignColumns: [role.id],
      name: 'organizationmember_role_id_fkey'
    }),
    index('idx_organizationmember_profile_id').on(table.profileId),
    index('idx_organizationmember_organization_id').on(table.organizationId),
    index('idx_organizationmember_profile_org').on(table.profileId, table.organizationId),
    uniqueIndex('organizationmember_org_profile_unique')
      .on(table.organizationId, table.profileId)
      .where(sql`${table.profileId} IS NOT NULL`),
    uniqueIndex('organizationmember_org_email_unique')
      .on(table.organizationId, table.email)
      .where(sql`${table.email} IS NOT NULL`)
  ]
);

export const question = pgTable(
  'question',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({
      name: 'question_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      cache: 1
    }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    questionTypeId: bigint('question_type_id', { mode: 'number' }).notNull(),
    title: varchar().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    exerciseId: uuid('exercise_id').notNull(),
    exerciseSectionId: uuid('exercise_section_id'),
    name: uuid().default(sql`gen_random_uuid()`),
    points: doublePrecision(),
    settings: jsonb().default({}),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    order: bigint({ mode: 'number' })
  },
  (table) => [
    foreignKey({
      columns: [table.exerciseId],
      foreignColumns: [exercise.id],
      name: 'question_exercise_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.exerciseSectionId],
      foreignColumns: [exerciseSection.id],
      name: 'question_exercise_section_id_fkey'
    }).onDelete('set null'),
    foreignKey({
      columns: [table.questionTypeId],
      foreignColumns: [questionType.id],
      name: 'question_question_type_id_fkey'
    })
  ]
);

export const questionAnswer = pgTable(
  'question_answer',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({
      name: 'question_answer_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      cache: 1
    }),
    answerData: jsonb('answer_data').$type<AnswerData | null>(),
    /** @deprecated Use answer_data instead. Kept for backwards compatibility. */
    answers: varchar().array(),
    /** @deprecated Use answer_data instead. Kept for backwards compatibility. */
    openAnswer: text('open_answer'),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    questionId: bigint('question_id', { mode: 'number' }).notNull(),
    groupMemberId: uuid('group_member_id').notNull(),
    submissionId: uuid('submission_id'),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    point: bigint({ mode: 'number' }).default(sql`'0'`)
  },
  (table) => [
    foreignKey({
      columns: [table.groupMemberId],
      foreignColumns: [groupmember.id],
      name: 'question_answer_group_member_id_fkey'
    }),
    foreignKey({
      columns: [table.questionId],
      foreignColumns: [question.id],
      name: 'question_answer_question_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.submissionId],
      foreignColumns: [submission.id],
      name: 'question_answer_submission_id_fkey'
    }).onDelete('cascade')
  ]
);

/**
 * Exercise question kinds (`typename` matches `@cio/question-types` keys). Expected ids:
 * 1 RADIO, 2 CHECKBOX, 3 TEXTAREA, 4 TRUE_FALSE, 5 SHORT_ANSWER, 6 NUMERIC, 7 FILL_BLANK,
 * 8 FILE_UPLOAD, 9 MATCHING, 10 ORDERING, 11 HOTSPOT, 12 LINK, 13 WORD_BANK, 14 STAR,
 * 15 VIDEO_RECORDING.
 */
export const questionType = pgTable(
  'question_type',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({
      name: 'question_type_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      cache: 1
    }),
    label: varchar().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    typename: varchar()
  },
  () => []
);

export const role = pgTable(
  'role',
  {
    type: varchar().notNull(),
    description: varchar(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({
      name: 'role_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      cache: 1
    }),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow()
  },
  () => []
);

export const waitinglist = pgTable(
  'waitinglist',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({
      name: 'waitinglist_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      cache: 1
    }),
    email: varchar().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow()
  },
  (table) => [unique('constraint_name').on(table.email)]
);

export const organization = pgTable(
  'organization',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    name: varchar().notNull(),
    siteName: text(),
    avatarUrl: text('avatar_url'),
    settings: jsonb().default({}).$type<{
      signup?: {
        inviteOnly?: boolean;
      };
      internalEnrollmentOnly?: boolean;
    }>(),
    landingpage: jsonb().default({}).$type<{
      header?: {
        title: string;
        titleHighlight: string;
        subtitle: string;
        action: {
          label: string;
          link: string;
          redirect: boolean;
        };
        banner: {
          video: string;
          image: string;
          type: string;
          show: boolean;
        };
        background: {
          image: string;
          show: boolean;
        };
        show: boolean;
      };
      aboutUs?: {
        title: string;
        content: string;
        imageUrl: string;
        show: boolean;
      };
      courses?: {
        title: string;
        titleHighlight: string;
        subtitle: string;
        show: boolean;
      };
      faq?: {
        title: string;
        questions: Array<{
          id: number;
          title: string;
          content: string;
        }>;
        show: boolean;
      };
      contact?: {
        title: string;
        titleHighlight: string;
        subtitle: string;
        address: string;
        phone: string;
        email: string;
        show: boolean;
      };
      mailinglist?: {
        title: string;
        subtitle: string;
        buttonLabel: string;
        show: boolean;
      };
      customLinks?: {
        show: boolean;
        links: Array<{
          id: number;
          label: string;
          url: string;
          openInNewTab: boolean;
        }>;
      };
      /** Legacy social URLs-only footer block */
      footer?:
        | {
            facebook?: string;
            instagram?: string;
            twitter?: string;
            linkedin?: string;
            show?: boolean;
          }
        | {
            brand: {
              tagline?: string;
              copyright?: string;
              socials: Array<{ platform: string; href: string }>;
            };
            columns: Array<{
              id: string;
              heading: string;
              links: Array<{ label: string; href: string }>;
              cta?: { label: string; href: string };
            }>;
            bottom?: {
              text?: string;
              links: Array<{ label: string; href: string }>;
            };
          };
      /** Current landing JSON shape (stored alongside legacy keys above) */
      theme?: string;
      hero?: Record<string, unknown>;
      navItems?: Array<{ label: string; href: string }>;
      footerLinks?: Array<{ label: string; href: string }>;
      footerText?: string;
      embed?: Record<string, unknown>;
      callout?: Record<string, unknown>;
      links?: Record<string, unknown>;
    }>(),
    theme: text().default('blue'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    customization: json()
      .default({
        apps: { poll: true, comments: true },
        course: { grading: true, newsfeed: true },
        dashboard: { exercise: true, community: true, bannerText: '', bannerImage: '' }
      })
      .$type<{
        dashboard: {
          community: boolean;
          exercise: boolean;
          bannerImage: string;
          bannerText: string;
        };
        course: {
          newsfeed: boolean;
          grading: boolean;
        };
        apps: {
          poll: boolean;
          comments: boolean;
        };
      }>()
      .notNull(),
    isRestricted: boolean('is_restricted').default(false).notNull(),
    customCode: text(),
    customDomain: text(),
    favicon: text(),
    isCustomDomainVerified: boolean().default(false),
    disableSignup: boolean('disable_signup').default(false),
    disableSignupMessage: text('disable_signup_message'),
    disableEmailPassword: boolean('disable_email_password').default(false),
    disableGoogleAuth: boolean('disable_google_auth').default(false),
    parentOrganizationId: uuid('parent_organization_id'),
    readOnlyUntil: timestamp('read_only_until', { withTimezone: true, mode: 'string' }),
    aiTutorSettings: jsonb('ai_tutor_settings')
      .default({
        enabled: true,
        persona: 'encouraging',
        customPersona: '',
        responseLength: 'medium',
        welcomeMessage: '',
        disclaimerFooter: 'I am an AI tutor, not your instructor.',
        thingsToSay: '',
        thingsNotToSay: '',
        forbiddenTopics: [],
        groundingScope: 'course',
        requireCitations: true,
        assessmentMode: 'hint_only',
        revealSolutionsAfterAttempts: 3,
        codePolicy: 'hints_only',
        blockOffTopic: true,
        profanityFilter: true,
        escalation: { enabled: false, email: '' }
      })
      .$type<{
        enabled: boolean;
        persona: 'friendly' | 'formal' | 'encouraging' | 'socratic' | 'custom';
        customPersona: string;
        responseLength: 'short' | 'medium' | 'long';
        welcomeMessage: string;
        disclaimerFooter: string;
        thingsToSay: string;
        thingsNotToSay: string;
        forbiddenTopics: string[];
        groundingScope: 'lesson' | 'course' | 'workspace';
        requireCitations: boolean;
        assessmentMode: 'direct_answer' | 'hint_only' | 'block_during_exercise';
        revealSolutionsAfterAttempts: number;
        codePolicy: 'allowed' | 'hints_only' | 'forbidden';
        blockOffTopic: boolean;
        profanityFilter: boolean;
        escalation: { enabled: boolean; email: string };
      }>()
      .notNull()
  },
  (table) => [
    unique('organization_siteName_key').on(table.siteName),
    unique('organization_customDomain_key').on(table.customDomain),
    foreignKey({
      columns: [table.parentOrganizationId],
      foreignColumns: [table.id],
      name: 'organization_parent_organization_id_fkey'
    }).onDelete('set null'),
    index('idx_organization_parent_id').on(table.parentOrganizationId)
  ]
);

export const tagGroup = pgTable(
  'tag_group',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    organizationId: uuid('organization_id').notNull(),
    name: varchar().notNull(),
    slug: text().notNull(),
    description: text(),
    order: integer().default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .default(sql`timezone('utc'::text, now())`)
      .notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: 'tag_group_organization_id_fkey'
    }).onDelete('cascade'),
    index('idx_tag_group_organization_id').on(table.organizationId),
    unique('tag_group_org_slug_key').on(table.organizationId, table.slug)
  ]
);

export const tag = pgTable(
  'tag',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    organizationId: uuid('organization_id').notNull(),
    groupId: uuid('group_id').notNull(),
    name: varchar().notNull(),
    slug: text().notNull(),
    description: text(),
    color: varchar().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .default(sql`timezone('utc'::text, now())`)
      .notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: 'tag_organization_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.groupId],
      foreignColumns: [tagGroup.id],
      name: 'tag_group_id_fkey'
    }).onDelete('cascade'),
    index('idx_tag_organization_id').on(table.organizationId),
    index('idx_tag_group_id').on(table.groupId),
    unique('tag_org_slug_key').on(table.organizationId, table.slug)
  ]
);

export const tagAssignment = pgTable(
  'tag_assignment',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    tagId: uuid('tag_id').notNull(),
    courseId: uuid('course_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .default(sql`timezone('utc'::text, now())`)
      .notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.tagId],
      foreignColumns: [tag.id],
      name: 'tag_assignment_tag_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.courseId],
      foreignColumns: [course.id],
      name: 'tag_assignment_course_id_fkey'
    }).onDelete('cascade'),
    index('idx_tag_assignment_tag_id').on(table.tagId),
    index('idx_tag_assignment_course_id').on(table.courseId),
    unique('tag_assignment_tag_course_key').on(table.tagId, table.courseId)
  ]
);

export const widget = pgTable(
  'widget',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    organizationId: uuid('organization_id').notNull(),
    name: varchar({ length: 120 }).notNull(),
    status: widgetStatus('status').default('DRAFT').notNull(),
    layoutType: widgetLayoutType('layout_type').default('card_grid').notNull(),
    selectionMode: widgetSelectionMode('selection_mode').default('manual').notNull(),
    publicKey: varchar('public_key', { length: 64 }).notNull(),
    config: jsonb('config')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    hasUnpublishedChanges: boolean('has_unpublished_changes').default(false).notNull(),
    latestPublishedVersionId: uuid('latest_published_version_id'),
    createdByUserId: uuid('created_by_user_id').notNull(),
    updatedByUserId: uuid('updated_by_user_id'),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .default(sql`timezone('utc'::text, now())`)
      .notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: 'widget_organization_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.createdByUserId],
      foreignColumns: [user.id],
      name: 'widget_created_by_user_id_fkey'
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.updatedByUserId],
      foreignColumns: [user.id],
      name: 'widget_updated_by_user_id_fkey'
    }).onDelete('set null'),
    index('idx_widget_organization_id').on(table.organizationId),
    index('idx_widget_status').on(table.status),
    unique('widget_public_key_key').on(table.publicKey)
  ]
);

export const widgetCourse = pgTable(
  'widget_course',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    widgetId: uuid('widget_id').notNull(),
    courseId: uuid('course_id').notNull(),
    order: integer().default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .default(sql`timezone('utc'::text, now())`)
      .notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.widgetId],
      foreignColumns: [widget.id],
      name: 'widget_course_widget_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.courseId],
      foreignColumns: [course.id],
      name: 'widget_course_course_id_fkey'
    }).onDelete('cascade'),
    index('idx_widget_course_widget_id').on(table.widgetId),
    index('idx_widget_course_course_id').on(table.courseId),
    unique('widget_course_widget_course_key').on(table.widgetId, table.courseId)
  ]
);

export const widgetVersion = pgTable(
  'widget_version',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    widgetId: uuid('widget_id').notNull(),
    version: integer().notNull(),
    configSnapshot: jsonb('config_snapshot')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    payloadSnapshot: jsonb('payload_snapshot')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    runtimeManifest: jsonb('runtime_manifest')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    rolledBackFromVersionId: uuid('rolled_back_from_version_id'),
    publishedByUserId: uuid('published_by_user_id').notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true, mode: 'string' })
      .default(sql`timezone('utc'::text, now())`)
      .notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.widgetId],
      foreignColumns: [widget.id],
      name: 'widget_version_widget_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.publishedByUserId],
      foreignColumns: [user.id],
      name: 'widget_version_published_by_user_id_fkey'
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.rolledBackFromVersionId],
      foreignColumns: [table.id],
      name: 'widget_version_rolled_back_from_version_id_fkey'
    }).onDelete('set null'),
    index('idx_widget_version_widget_id').on(table.widgetId),
    unique('widget_version_widget_version_key').on(table.widgetId, table.version)
  ]
);

export const dashOrgStats = pgView('dash_org_stats', {
  orgId: uuid('org_id'),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  noOfCourses: bigint('no_of_courses', { mode: 'number' }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  enrolledStudents: bigint('enrolled_students', { mode: 'number' })
}).as(
  sql`SELECT gp.organization_id AS org_id, count(DISTINCT course.id) AS no_of_courses, count(DISTINCT gm.profile_id) AS enrolled_students FROM course JOIN "group" gp ON gp.id = course.group_id LEFT JOIN groupmember gm ON gm.group_id = gp.id AND gm.role_id = 3 WHERE course.status = 'ACTIVE'::text GROUP BY gp.organization_id`
);

export const lessonVersions = pgView('lesson_versions', {
  oldContent: text('old_content'),
  newContent: text('new_content'),
  timestamp: timestamp({ mode: 'string' }),
  locale: locale(),
  lessonId: uuid('lesson_id')
}).as(
  sql`SELECT llh.old_content, llh.new_content, llh."timestamp", ll.locale, ll.lesson_id FROM lesson_language_history llh JOIN lesson_language ll ON ll.id = llh.lesson_language_id`
);

export const exerciseTemplate = pgTable('exercise_template', {
  id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({
    name: 'exercise_template_id_seq',
    startWith: 1,
    increment: 1,
    minValue: 1,
    cache: 1
  }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  title: text(),
  description: text(),
  tag: text(),
  questionnaire: jsonb().default({}).$type<{
    questions: [
      {
        title: string;
        name: string;
        points: number;
        order: number;
        question_type: {
          id: number;
          label: string;
        };
        options: [
          {
            label: string;
            is_correct: boolean;
          },
          {
            label: string;
            is_correct: boolean;
          },
          {
            label: string;
            is_correct: boolean;
          }
        ];
      }
    ];
  }>()
});

// Organization SSO provider type (our app enum for display/categorization)
export const organizationSsoProviderType = pgEnum('SSO_PROVIDER', ['OKTA', 'GOOGLE_WORKSPACE', 'AUTH0']);

// Organization Auth Policy - stores SSO policies per org
export const organizationAuthPolicy = pgTable(
  'organization_auth_policy',
  {
    organizationId: uuid('organization_id')
      .notNull()
      .primaryKey()
      .references(() => organization.id, { onDelete: 'cascade' }),
    forceSso: boolean('force_sso').default(false).notNull(),
    autoJoinSsoDomains: boolean('auto_join_sso_domains').default(false).notNull(),
    breakGlassEnabled: boolean('break_glass_enabled').default(true).notNull(),
    defaultRoleId: bigint('default_role_id', { mode: 'number' })
      .default(sql`'3'`)
      .notNull(),
    roleMapping: jsonb('role_mapping').default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .default(sql`timezone('utc'::text, now())`)
      .notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.defaultRoleId],
      foreignColumns: [role.id],
      name: 'organization_auth_policy_default_role_id_fkey'
    }),
    index('idx_organization_auth_policy_org_id').on(table.organizationId)
  ]
);

// Organization SSO Config - metadata for SSO connections (Better Auth stores the actual config)
export const organizationSsoConfig = pgTable(
  'organization_sso_config',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    organizationId: uuid('organization_id')
      .notNull()
      .unique()
      .references(() => organization.id, { onDelete: 'cascade' }),
    betterAuthProviderId: text('better_auth_provider_id').notNull(),
    provider: organizationSsoProviderType().notNull(),
    displayName: text('display_name').notNull(),
    domain: text().notNull(),
    isActive: boolean('is_active').default(false).notNull(),
    createdByProfileId: uuid('created_by_profile_id')
      .notNull()
      .references(() => profile.id),
    updatedByProfileId: uuid('updated_by_profile_id').references(() => profile.id),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .default(sql`timezone('utc'::text, now())`)
      .notNull()
  },
  (table) => [
    index('idx_organization_sso_config_org_id').on(table.organizationId),
    index('idx_organization_sso_config_domain').on(table.domain),
    index('idx_organization_sso_config_provider_id').on(table.betterAuthProviderId)
  ]
);

export const organizationTokenAuth = pgTable(
  'organization_token_auth',
  {
    id: uuid('id')
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    organizationId: uuid('organization_id')
      .notNull()
      .unique()
      .references(() => organization.id, { onDelete: 'cascade' }),
    signingSecret: text('signing_secret').notNull(),
    isActive: boolean('is_active').default(false).notNull(),
    createdByProfileId: uuid('created_by_profile_id')
      .notNull()
      .references(() => profile.id),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .default(sql`timezone('utc'::text, now())`)
      .notNull()
  },
  (table) => [index('idx_organization_token_auth_org_id').on(table.organizationId)]
);

export const organizationApiKey = pgTable(
  'organization_api_key',
  {
    id: uuid('id')
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    createdByProfileId: uuid('created_by_profile_id')
      .notNull()
      .references(() => profile.id),
    type: organizationApiKeyType('type').notNull(),
    label: varchar('label', { length: 120 }).notNull(),
    secretPrefix: varchar('secret_prefix', { length: 32 }).notNull(),
    secretHash: text('secret_hash').notNull(),
    scopes: jsonb('scopes').default([]).notNull().$type<string[]>(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true, mode: 'string' }),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }),
    revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .default(sql`timezone('utc'::text, now())`)
      .notNull()
  },
  (table) => [
    index('idx_organization_api_key_org_id').on(table.organizationId),
    index('idx_organization_api_key_type').on(table.type),
    uniqueIndex('organization_api_key_secret_hash_unique').on(table.secretHash)
  ]
);

export const organizationAutomationUsage = pgTable(
  'organization_automation_usage',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organization.id),
    organizationApiKeyId: uuid('organization_api_key_id').references(() => organizationApiKey.id, {
      onDelete: 'set null'
    }),
    type: organizationApiKeyType('type').notNull(),
    action: varchar('action', { length: 120 }).notNull(),
    category: automationUsageCategory('category').notNull(),
    creditsConsumed: integer('credits_consumed').default(0).notNull(),
    metadata: jsonb('metadata').default({}).$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .default(sql`timezone('utc'::text, now())`)
      .notNull()
  },
  (table) => [
    index('idx_org_automation_usage_org_created_at').on(table.organizationId, table.createdAt),
    index('idx_org_automation_usage_key_created_at').on(table.organizationApiKeyId, table.createdAt),
    index('idx_org_automation_usage_type_created_at').on(table.type, table.createdAt)
  ]
);

export const courseImportDraft = pgTable(
  'course_import_draft',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    createdByProfileId: uuid('created_by_profile_id')
      .notNull()
      .references(() => profile.id),
    sourceType: courseImportSourceType('source_type').notNull(),
    status: courseImportDraftStatus('status').default('DRAFT').notNull(),
    title: varchar().notNull(),
    locale: locale().default('en').notNull(),
    idempotencyKey: varchar('idempotency_key'),
    summary: jsonb().default({}).notNull().$type<Record<string, unknown>>(),
    draft: jsonb().notNull().$type<Record<string, unknown>>(),
    warnings: jsonb().default([]).notNull().$type<Array<Record<string, unknown>>>(),
    sourceArtifacts: jsonb().default([]).notNull().$type<Array<Record<string, unknown>>>(),
    publishedCourseId: uuid('published_course_id').references(() => course.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .default(sql`timezone('utc'::text, now())`)
      .notNull()
  },
  (table) => [
    index('idx_course_import_draft_org_id').on(table.organizationId),
    index('idx_course_import_draft_status').on(table.status),
    uniqueIndex('course_import_draft_org_idempotency_key')
      .on(table.organizationId, table.idempotencyKey)
      .where(sql`${table.idempotencyKey} IS NOT NULL`)
  ]
);

// ─── Programs ────────────────────────────────────────────────────────────────

export const programStatus = pgEnum('PROGRAM_STATUS', ['ACTIVE', 'INACTIVE', 'ARCHIVED']);

export const program = pgTable(
  'program',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    organizationId: uuid('organization_id').notNull(),
    name: varchar().notNull(),
    description: text(),
    coverImage: text('cover_image'),
    status: programStatus().default('ACTIVE').notNull(),
    createdByProfileId: uuid('created_by_profile_id')
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: 'program_organization_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.createdByProfileId],
      foreignColumns: [profile.id],
      name: 'program_created_by_profile_id_fkey'
    }),
    index('idx_program_organization_id').on(table.organizationId)
  ]
);

export const programCourse = pgTable(
  'program_course',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    programId: uuid('program_id').notNull(),
    courseId: uuid('course_id').notNull(),
    addedAt: timestamp('added_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.programId],
      foreignColumns: [program.id],
      name: 'program_course_program_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.courseId],
      foreignColumns: [course.id],
      name: 'program_course_course_id_fkey'
    }).onDelete('cascade'),
    unique('program_course_program_id_course_id_unique').on(table.programId, table.courseId),
    index('idx_program_course_program_id').on(table.programId)
  ]
);

export const programMember = pgTable(
  'program_member',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    programId: uuid('program_id').notNull(),
    profileId: uuid('profile_id'),
    roleId: integer('role_id').notNull(),
    email: text(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.programId],
      foreignColumns: [program.id],
      name: 'program_member_program_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.profileId],
      foreignColumns: [profile.id],
      name: 'program_member_profile_id_fkey'
    }),
    foreignKey({
      columns: [table.roleId],
      foreignColumns: [role.id],
      name: 'program_member_role_id_fkey'
    }),
    unique('program_member_program_id_profile_id_unique').on(table.programId, table.profileId),
    index('idx_program_member_program_id').on(table.programId),
    index('idx_program_member_profile_id').on(table.profileId)
  ]
);

export const programNewsfeed = pgTable(
  'program_newsfeed',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    authorId: uuid('author_id'),
    programId: uuid('program_id'),
    content: text(),
    reaction: jsonb()
      .default({ clap: [], smile: [], thumbsup: [], thumbsdown: [] })
      .$type<{ clap: string[]; smile: string[]; thumbsup: string[]; thumbsdown: string[] }>(),
    isPinned: boolean('is_pinned').default(false).notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.authorId],
      foreignColumns: [programMember.id],
      name: 'program_newsfeed_author_id_fkey'
    }),
    foreignKey({
      columns: [table.programId],
      foreignColumns: [program.id],
      name: 'program_newsfeed_program_id_fkey'
    }).onDelete('cascade'),
    index('idx_program_newsfeed_program_id').on(table.programId)
  ]
);

export const programNewsfeedComment = pgTable(
  'program_newsfeed_comment',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({
      name: 'program_newsfeed_comment_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      cache: 1
    }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    authorId: uuid('author_id'),
    content: text(),
    programNewsfeedId: uuid('program_newsfeed_id')
  },
  (table) => [
    foreignKey({
      columns: [table.authorId],
      foreignColumns: [programMember.id],
      name: 'program_newsfeed_comment_author_id_fkey'
    }),
    foreignKey({
      columns: [table.programNewsfeedId],
      foreignColumns: [programNewsfeed.id],
      name: 'program_newsfeed_comment_program_newsfeed_id_fkey'
    }).onDelete('cascade')
  ]
);

// ─── Program Goals ────────────────────────────────────────────────────────────
//
// A team-level "is the team done" target. A small generalisation of the
// per-course `course.compliance` field: applies across multiple courses, scoped
// to a program's members, and aggregated for owner roll-ups. Per-learner status
// is materialised in `programGoalAssignment` so dashboards stay cheap.

export const programGoalType = pgEnum('PROGRAM_GOAL_TYPE', [
  'complete_all',
  'n_of_m',
  'score',
  'pass_rate',
  'readiness'
]);

export const programGoalDeadlineKind = pgEnum('PROGRAM_GOAL_DEADLINE_KIND', [
  'absolute',
  'relative_to_join',
  'recurring',
  'none'
]);

export const programGoalStatus = pgEnum('PROGRAM_GOAL_STATUS', ['active', 'archived']);

export const programGoalAssignmentStatus = pgEnum('PROGRAM_GOAL_ASSIGNMENT_STATUS', [
  'not_started',
  'in_progress',
  'completed',
  'at_risk',
  'overdue',
  'waived'
]);

export const programGoal = pgTable(
  'program_goal',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    programId: uuid('program_id').notNull(),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    type: programGoalType().notNull(),
    /** Course IDs the goal targets. JSONB so we can attach per-course config later if needed. */
    courseIds: jsonb('course_ids').$type<string[]>().default([]).notNull(),
    /** Required only for n_of_m. */
    requiredCount: integer('required_count'),
    /** Per-learner score threshold (0–100). Required for `score` and `pass_rate`. */
    scoreThreshold: integer('score_threshold'),
    /** Team-wide pass-rate threshold (0–100). Required for `pass_rate`. */
    teamPassRateThreshold: integer('team_pass_rate_threshold'),
    deadlineKind: programGoalDeadlineKind('deadline_kind').default('none').notNull(),
    /** Used when deadlineKind = 'absolute'. */
    deadlineDate: timestamp('deadline_date', { withTimezone: true, mode: 'string' }),
    /** Used when deadlineKind = 'relative_to_join'. */
    relativeDays: integer('relative_days'),
    /** Used when deadlineKind = 'recurring'. */
    recurringMonths: integer('recurring_months'),
    /** Reminder cadence (days before due). Mirrors `course.compliance.reminderDaysBefore`. */
    reminderDaysBefore: jsonb('reminder_days_before').$type<number[]>().default([7, 1]).notNull(),
    status: programGoalStatus().default('active').notNull(),
    createdByProfileId: uuid('created_by_profile_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.programId],
      foreignColumns: [program.id],
      name: 'program_goal_program_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.createdByProfileId],
      foreignColumns: [profile.id],
      name: 'program_goal_created_by_profile_id_fkey'
    }).onDelete('set null'),
    index('idx_program_goal_program_id').on(table.programId),
    index('idx_program_goal_status').on(table.status)
  ]
);

export const programGoalAssignment = pgTable(
  'program_goal_assignment',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    goalId: uuid('goal_id').notNull(),
    programMemberId: uuid('program_member_id').notNull(),
    /** Resolved due date for this learner (null when goal has no deadline). */
    dueDate: timestamp('due_date', { withTimezone: true, mode: 'string' }),
    status: programGoalAssignmentStatus().default('not_started').notNull(),
    /** Cached count of completed required courses (for n_of_m / complete_all dashboards). */
    completedCount: integer('completed_count').default(0).notNull(),
    /** Cached numerator for the requirement (e.g. courses required to complete). */
    requiredCount: integer('required_count').default(0).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'string' }),
    lastEvaluatedAt: timestamp('last_evaluated_at', { withTimezone: true, mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.goalId],
      foreignColumns: [programGoal.id],
      name: 'program_goal_assignment_goal_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.programMemberId],
      foreignColumns: [programMember.id],
      name: 'program_goal_assignment_program_member_id_fkey'
    }).onDelete('cascade'),
    unique('program_goal_assignment_goal_id_program_member_id_unique').on(table.goalId, table.programMemberId),
    index('idx_program_goal_assignment_goal_id').on(table.goalId),
    index('idx_program_goal_assignment_program_member_id').on(table.programMemberId),
    index('idx_program_goal_assignment_due_date').on(table.dueDate)
  ]
);

// ─── AI Token Usage ──────────────────────────────────────────────────────────

export const aiTokenUsage = pgTable(
  'ai_token_usage',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({
      name: 'ai_token_usage_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      cache: 1
    }),
    orgId: uuid('org_id').notNull(),
    userId: uuid('user_id').notNull(),
    courseId: uuid('course_id').notNull(),
    promptTokens: integer('prompt_tokens').notNull(),
    completionTokens: integer('completion_tokens').notNull(),
    costUnits: integer('cost_units'),
    model: text().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.orgId],
      foreignColumns: [organization.id],
      name: 'ai_token_usage_org_id_fkey'
    }),
    index('idx_ai_token_usage_org_month').on(table.orgId, table.createdAt)
  ]
);

// ─── AI Credit Balance ───────────────────────────────────────────────────────

export const aiCreditBalance = pgTable(
  'ai_credit_balance',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({
      name: 'ai_credit_balance_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      cache: 1
    }),
    orgId: uuid('org_id').notNull(),
    balance: integer().notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.orgId],
      foreignColumns: [organization.id],
      name: 'ai_credit_balance_org_id_fkey'
    }),
    unique('ai_credit_balance_org_id_key').on(table.orgId)
  ]
);

export const aiCreditPurchase = pgTable(
  'ai_credit_purchase',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({
      name: 'ai_credit_purchase_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      cache: 1
    }),
    orgId: uuid('org_id').notNull(),
    triggeredBy: uuid('triggered_by'),
    provider: text().notNull().default('polar'),
    providerOrderId: text('provider_order_id').notNull(),
    tokens: integer().notNull(),
    quantity: integer().notNull().default(1),
    unitPriceCents: integer('unit_price_cents').notNull().default(0),
    currency: text().notNull().default('USD'),
    payload: jsonb(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.orgId],
      foreignColumns: [organization.id],
      name: 'ai_credit_purchase_org_id_fkey'
    }),
    foreignKey({
      columns: [table.triggeredBy],
      foreignColumns: [profile.id],
      name: 'ai_credit_purchase_triggered_by_fkey'
    }),
    unique('ai_credit_purchase_provider_order_id_key').on(table.providerOrderId),
    index('idx_ai_credit_purchase_org_created').on(table.orgId, table.createdAt)
  ]
);

// ─── AI Tutor Fair-Use ───────────────────────────────────────────────────────

export const aiTutorMessageCount = pgTable(
  'ai_tutor_message_count',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({
      name: 'ai_tutor_message_count_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      cache: 1
    }),
    orgId: uuid('org_id').notNull(),
    userId: uuid('user_id').notNull(),
    /** First day of the calendar month this counter covers. */
    periodStart: date('period_start').notNull(),
    messageCount: integer('message_count').notNull().default(0),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true, mode: 'string' }),
    capHitAt: timestamp('cap_hit_at', { withTimezone: true, mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.orgId],
      foreignColumns: [organization.id],
      name: 'ai_tutor_message_count_org_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [profile.id],
      name: 'ai_tutor_message_count_user_id_fkey'
    }).onDelete('cascade'),
    unique('ai_tutor_message_count_org_user_period_key').on(table.orgId, table.userId, table.periodStart),
    index('idx_ai_tutor_message_count_org_period').on(table.orgId, table.periodStart),
    index('idx_ai_tutor_message_count_user').on(table.userId, table.periodStart)
  ]
);

export const aiTutorCapEvent = pgTable(
  'ai_tutor_cap_event',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({
      name: 'ai_tutor_cap_event_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      cache: 1
    }),
    orgId: uuid('org_id').notNull(),
    userId: uuid('user_id').notNull(),
    courseId: uuid('course_id'),
    /** 'cap_reached' | 'pool_exhausted' | 'tutor_disabled' */
    eventType: text('event_type').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.orgId],
      foreignColumns: [organization.id],
      name: 'ai_tutor_cap_event_org_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [profile.id],
      name: 'ai_tutor_cap_event_user_id_fkey'
    }).onDelete('cascade'),
    index('idx_ai_tutor_cap_event_org_occurred').on(table.orgId, table.occurredAt),
    index('idx_ai_tutor_cap_event_user').on(table.userId, table.occurredAt)
  ]
);

export const aiChatConversation = pgTable(
  'ai_chat_conversation',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    courseId: uuid('course_id').notNull(),
    userId: uuid('user_id').notNull(),
    title: text().default('New conversation'),
    messages: jsonb().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.courseId],
      foreignColumns: [course.id],
      name: 'ai_chat_conversation_course_id_fkey'
    }),
    index('idx_ai_chat_conversation_course_user').on(table.courseId, table.userId)
  ]
);

export const aiChatModelContext = pgTable(
  'ai_chat_model_context',
  {
    conversationId: uuid('conversation_id').primaryKey(),
    courseId: uuid('course_id').notNull(),
    userId: uuid('user_id').notNull(),
    modelSummary: text('model_summary').notNull().default(''),
    compactedThroughMessageId: text('compacted_through_message_id'),
    sourceIds: jsonb('source_ids').default([]).notNull().$type<string[]>(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.conversationId],
      foreignColumns: [aiChatConversation.id],
      name: 'ai_chat_model_context_conversation_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.courseId],
      foreignColumns: [course.id],
      name: 'ai_chat_model_context_course_id_fkey'
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [profile.id],
      name: 'ai_chat_model_context_user_id_fkey'
    }).onDelete('cascade'),
    index('idx_ai_chat_model_context_course_user').on(table.courseId, table.userId)
  ]
);

export const aiChatDocument = pgTable(
  'ai_chat_document',
  {
    id: text().primaryKey(),
    conversationId: uuid('conversation_id').notNull(),
    courseId: uuid('course_id').notNull(),
    userId: uuid('user_id').notNull(),
    assetId: uuid('asset_id'),
    fileName: text('file_name').notNull(),
    mimeType: text('mime_type').notNull(),
    text: text().notNull(),
    wordCount: integer('word_count').notNull().default(0),
    pageCount: integer('page_count'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.conversationId],
      foreignColumns: [aiChatConversation.id],
      name: 'ai_chat_document_conversation_id_fkey'
    }).onDelete('cascade'),
    index('idx_ai_chat_document_conversation').on(table.conversationId)
  ]
);

export const aiAgentRun = pgTable(
  'ai_agent_run',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    orgId: uuid('org_id').notNull(),
    courseId: uuid('course_id').notNull(),
    conversationId: uuid('conversation_id'),
    userId: uuid('user_id').notNull(),
    status: aiAgentRunStatus('status').default('queued').notNull(),
    phase: varchar({ length: 64 }).default('planning').notNull(),
    progressPercent: integer('progress_percent').default(0).notNull(),
    currentStepKey: varchar('current_step_key', { length: 128 }),
    approvedPlan: jsonb('approved_plan').$type<Record<string, unknown> | null>(),
    executionCursor: jsonb('execution_cursor').default({}).notNull().$type<Record<string, unknown>>(),
    sourceIds: jsonb('source_ids').default([]).notNull().$type<string[]>(),
    modelSummary: text('model_summary').notNull().default(''),
    queuedInstructions: jsonb('queued_instructions')
      .default([])
      .notNull()
      .$type<Array<{ id: string; text: string; createdBy: string; createdAt: string }>>(),
    lastError: jsonb('last_error').$type<{ code: string; message: string; details?: unknown } | null>(),
    attempt: integer().default(0).notNull(),
    maxAttempts: integer('max_attempts').default(3).notNull(),
    workerId: text('worker_id'),
    lockedAt: timestamp('locked_at', { withTimezone: true, mode: 'string' }),
    cancelRequestedAt: timestamp('cancel_requested_at', { withTimezone: true, mode: 'string' }),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'string' }),
    finishedAt: timestamp('finished_at', { withTimezone: true, mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.orgId],
      foreignColumns: [organization.id],
      name: 'ai_agent_run_org_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.courseId],
      foreignColumns: [course.id],
      name: 'ai_agent_run_course_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.conversationId],
      foreignColumns: [aiChatConversation.id],
      name: 'ai_agent_run_conversation_id_fkey'
    }).onDelete('set null'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [profile.id],
      name: 'ai_agent_run_user_id_fkey'
    }).onDelete('cascade'),
    index('idx_ai_agent_run_course_user').on(table.courseId, table.userId),
    index('idx_ai_agent_run_org_status').on(table.orgId, table.status),
    index('idx_ai_agent_run_conversation').on(table.conversationId),
    index('idx_ai_agent_run_updated_at').on(table.updatedAt)
  ]
);

export const aiAgentRunStep = pgTable(
  'ai_agent_run_step',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    runId: uuid('run_id').notNull(),
    stepKey: varchar('step_key', { length: 128 }).notNull(),
    stepType: varchar('step_type', { length: 64 }).notNull(),
    status: aiAgentRunStatus('status').default('queued').notNull(),
    inputHash: text('input_hash'),
    input: jsonb().$type<Record<string, unknown> | null>(),
    output: jsonb().$type<Record<string, unknown> | null>(),
    outputIds: jsonb('output_ids').default([]).notNull().$type<string[]>(),
    idempotencyKey: text('idempotency_key'),
    error: jsonb().$type<{ code: string; message: string; details?: unknown } | null>(),
    attempt: integer().default(0).notNull(),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'string' }),
    finishedAt: timestamp('finished_at', { withTimezone: true, mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.runId],
      foreignColumns: [aiAgentRun.id],
      name: 'ai_agent_run_step_run_id_fkey'
    }).onDelete('cascade'),
    unique('ai_agent_run_step_run_step_unique').on(table.runId, table.stepKey),
    index('idx_ai_agent_run_step_run_status').on(table.runId, table.status)
  ]
);

export const aiAgentRunEvent = pgTable(
  'ai_agent_run_event',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({
      name: 'ai_agent_run_event_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      cache: 1
    }),
    runId: uuid('run_id').notNull(),
    eventType: varchar('event_type', { length: 64 }).notNull(),
    message: text(),
    payload: jsonb().$type<Record<string, unknown> | null>(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.runId],
      foreignColumns: [aiAgentRun.id],
      name: 'ai_agent_run_event_run_id_fkey'
    }).onDelete('cascade'),
    index('idx_ai_agent_run_event_run_created').on(table.runId, table.createdAt)
  ]
);

// ─── BullMQ Job State (Postgres source of truth) ─────────────────────────────
// User-visible status for queued/long-running domain runs. BullMQ holds the
// operational job; these tables hold the entity the dashboard polls and
// resumes against. See prd/notification-system and the bullmq plan.

export const jobStatus = pgEnum('JOB_STATUS', ['queued', 'running', 'completed', 'failed', 'canceled']);

/**
 * `media_job` — one user-facing media post-processing run (per uploaded asset).
 * The BullMQ FlowProducer orchestrates one or more attempts; this row stores
 * the latest status the dashboard polls.
 */
export const mediaJob = pgTable(
  'media_job',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    organizationId: uuid('organization_id').notNull(),
    assetId: uuid('asset_id').notNull(),
    /** Snapshot of who started this run; never re-derived inside the worker. */
    triggeredByProfileId: uuid('triggered_by_profile_id'),
    status: jobStatus().default('queued').notNull(),
    stage: varchar({ length: 64 }),
    progressPercent: integer('progress_percent').default(0),
    /** Latest BullMQ root job id from the FlowProducer tree. Operational only. */
    rootJobId: text('root_job_id'),
    /** All BullMQ job ids for this run, keyed by job name (operational). */
    jobIds: jsonb('job_ids').default({}).$type<Record<string, string>>(),
    attempt: integer().default(0).notNull(),
    maxAttempts: integer('max_attempts').default(3).notNull(),
    cancelRequestedAt: timestamp('cancel_requested_at', { withTimezone: true, mode: 'string' }),
    /** Provider/cost data once we wire transcription billing. */
    costCents: integer('cost_cents').default(0),
    result: jsonb().$type<Record<string, unknown> | null>(),
    error: jsonb().$type<{ code: string; message: string; details?: unknown } | null>(),
    warnings: jsonb().default([]).$type<string[]>(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: 'media_job_organization_id_fkey'
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.assetId],
      foreignColumns: [asset.id],
      name: 'media_job_asset_id_fkey'
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.triggeredByProfileId],
      foreignColumns: [profile.id],
      name: 'media_job_triggered_by_profile_id_fkey'
    }).onDelete('set null'),
    index('idx_media_job_asset_id').on(table.assetId),
    index('idx_media_job_org_status').on(table.organizationId, table.status),
    index('idx_media_job_updated_at').on(table.updatedAt)
  ]
);

/**
 * `job_step` — generic checkpoint ledger for any queued domain run. Workers
 * look up `(runId, stepKey)` first and short-circuit if the step has a result,
 * which makes BullMQ retries safe against partial completion.
 */
export const jobStep = pgTable(
  'job_step',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    /** The owning domain (e.g. `media`, `course-import`, `onboarding-bootstrap`). */
    domain: varchar({ length: 64 }).notNull(),
    /** Domain run id (e.g. `media_job.id`). */
    runId: uuid('run_id').notNull(),
    /** Stable key for this step (e.g. `probe-metadata`). */
    stepKey: varchar('step_key', { length: 96 }).notNull(),
    status: jobStatus().default('queued').notNull(),
    /** Hash of inputs to detect changed inputs across retries. */
    inputHash: text('input_hash'),
    /** Provider id (whisper job id, ffmpeg run id, etc.) for de-dup. */
    providerId: text('provider_id'),
    result: jsonb().$type<Record<string, unknown> | null>(),
    error: jsonb().$type<{ code: string; message: string; details?: unknown } | null>(),
    attempt: integer().default(0).notNull(),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'string' }),
    finishedAt: timestamp('finished_at', { withTimezone: true, mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    unique('job_step_run_step_unique').on(table.domain, table.runId, table.stepKey),
    index('idx_job_step_run').on(table.domain, table.runId)
  ]
);

/**
 * Whisper-derived transcript + captions artifact for an uploaded video asset.
 * One row per asset (re-transcribe replaces via upsert on asset_id).
 */
export const mediaTranscript = pgTable(
  'media_transcript',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    organizationId: uuid('organization_id').notNull(),
    assetId: uuid('asset_id').notNull(),
    mediaJobId: uuid('media_job_id'),
    language: varchar({ length: 8 }).notNull(),
    provider: varchar({ length: 32 }).default('openai').notNull(),
    model: varchar({ length: 64 }).default('whisper-1').notNull(),
    text: text().notNull(),
    segments: jsonb().$type<{ start: number; end: number; text: string }[]>().notNull(),
    vttStorageKey: text('vtt_storage_key').notNull(),
    vttBucket: text('vtt_bucket').notNull(),
    durationSeconds: integer('duration_seconds'),
    costCents: integer('cost_cents').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: 'media_transcript_organization_id_fkey'
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.assetId],
      foreignColumns: [asset.id],
      name: 'media_transcript_asset_id_fkey'
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.mediaJobId],
      foreignColumns: [mediaJob.id],
      name: 'media_transcript_media_job_id_fkey'
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    unique('media_transcript_asset_id_unique').on(table.assetId),
    index('idx_media_transcript_asset').on(table.assetId)
  ]
);

/**
 * `dead_letter_job` — terminal failure record after BullMQ exhausts attempts
 * or a domain explicitly dead-letters a run. Drives the admin retry/replay UI
 * and Tinybird/Slack alerting.
 */
export const deadLetterJob = pgTable(
  'dead_letter_job',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    organizationId: uuid('organization_id'),
    domain: varchar({ length: 64 }).notNull(),
    runId: uuid('run_id'),
    queueName: varchar('queue_name', { length: 64 }).notNull(),
    jobName: varchar('job_name', { length: 96 }).notNull(),
    /** Original BullMQ job id. */
    bullmqJobId: text('bullmq_job_id'),
    payload: jsonb().$type<Record<string, unknown>>(),
    error: jsonb().$type<{ code: string; message: string; stack?: string }>(),
    attempts: integer().default(0).notNull(),
    /** Optional pointer to a replay job once an operator retries. */
    replayedAt: timestamp('replayed_at', { withTimezone: true, mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    index('idx_dead_letter_job_domain_created').on(table.domain, table.createdAt),
    index('idx_dead_letter_job_org_created').on(table.organizationId, table.createdAt)
  ]
);
