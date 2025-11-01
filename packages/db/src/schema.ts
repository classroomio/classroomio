import { account, session, user } from './auth-schema';
import {
  bigint,
  boolean,
  doublePrecision,
  foreignKey,
  index,
  integer,
  json,
  jsonb,
  pgEnum,
  pgPolicy,
  pgTable,
  pgView,
  serial,
  text,
  timestamp,
  unique,
  uuid,
  varchar
} from 'drizzle-orm/pg-core';

import { sql } from 'drizzle-orm';

export const courseType = pgEnum('COURSE_TYPE', ['SELF_PACED', 'LIVE_CLASS']);
export const courseVersion = pgEnum('COURSE_VERSION', ['V1', 'V2']);
export const locale = pgEnum('LOCALE', ['en', 'hi', 'fr', 'pt', 'de', 'vi', 'ru', 'es', 'pl', 'da']);
export const plan = pgEnum('PLAN', ['EARLY_ADOPTER', 'ENTERPRISE', 'BASIC']);

export { user, session, account };

export const analyticsLoginEvents = pgTable(
  'analytics_login_events',
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    userId: uuid('user_id').notNull(),
    loggedInAt: timestamp('logged_in_at', { withTimezone: true, mode: 'string' }).defaultNow()
  },
  (table) => [
    index('idx_analytics_login_events_logged_in_at').using(
      'btree',
      table.loggedInAt.asc().nullsLast().op('timestamptz_ops')
    ),
    index('idx_analytics_login_events_user_id').using('btree', table.userId.asc().nullsLast().op('uuid_ops')),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'analytics_login_events_user_id_fkey'
    }),
    unique('analytics_login_events_user_id_unique').on(table.userId),
    pgPolicy('Enable delete for users based on user_id', {
      as: 'permissive',
      for: 'delete',
      to: ['public'],
      using: sql`(auth.uid() = user_id)`
    }),
    pgPolicy('Users can insert their own login events', { as: 'permissive', for: 'insert', to: ['authenticated'] })
  ]
);

export const lessonSection = pgTable(
  'lesson_section',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    title: varchar(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    order: bigint({ mode: 'number' }).default(sql`'0'`),
    courseId: uuid('course_id')
  },
  (table) => [
    foreignKey({
      columns: [table.courseId],
      foreignColumns: [course.id],
      name: 'public_lesson_section_course_id_fkey'
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    pgPolicy('Enable read access for all users', { as: 'permissive', for: 'select', to: ['public'], using: sql`true` }),
    pgPolicy('User must be an org member to DELETE', { as: 'permissive', for: 'delete', to: ['public'] }),
    pgPolicy('User must be an org member to INSERT', { as: 'permissive', for: 'insert', to: ['public'] }),
    pgPolicy('User must be an org member to UPDATE', { as: 'permissive', for: 'update', to: ['public'] })
  ]
);

export const group = pgTable(
  'group',
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
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
    pgPolicy('Enable insert for authenticated users only', {
      as: 'permissive',
      for: 'insert',
      to: ['authenticated'],
      withCheck: sql`true`
    }),
    pgPolicy('Enable read access for all users', { as: 'permissive', for: 'select', to: ['public'] }),
    pgPolicy('Only org admins can delete', { as: 'permissive', for: 'delete', to: ['public'] }),
    pgPolicy('Only org admins can update', { as: 'permissive', for: 'update', to: ['public'] })
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
      maxValue: 9223372036854775807,
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
    }),
    pgPolicy('User must be a course member to INSERT', {
      as: 'permissive',
      for: 'insert',
      to: ['public'],
      withCheck: sql`is_user_in_course_group_or_admin(( SELECT course.group_id
   FROM course
  WHERE (course.id = group_attendance.course_id)
 LIMIT 1))`
    }),
    pgPolicy('User must be a course member to SELECT', { as: 'permissive', for: 'select', to: ['public'] }),
    pgPolicy('User must be a course member to UPDATE', { as: 'permissive', for: 'update', to: ['public'] }),
    pgPolicy('User must be an org member to DELETE', { as: 'permissive', for: 'delete', to: ['public'] })
  ]
);

export const currency = pgTable('currency', {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({
    name: 'currency_id_seq',
    startWith: 1,
    increment: 1,
    minValue: 1,
    maxValue: 9223372036854775807,
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
      maxValue: 9223372036854775807,
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
    }),
    pgPolicy('User must be a course member to INSERT', {
      as: 'permissive',
      for: 'insert',
      to: ['public'],
      withCheck: sql`is_user_in_course_group_or_admin(( SELECT groupmember.group_id
   FROM groupmember
  WHERE (groupmember.id = ( SELECT apps_poll."authorId"
           FROM apps_poll
          WHERE (apps_poll.id = apps_poll_option.poll_id)
         LIMIT 1))
 LIMIT 1))`
    }),
    pgPolicy('User must be a course member to UPDATE', { as: 'permissive', for: 'update', to: ['public'] }),
    pgPolicy('User must be a teacher to DELETE', { as: 'permissive', for: 'delete', to: ['public'] }),
    pgPolicy('User must be course member to SELECT', { as: 'permissive', for: 'select', to: ['public'] })
  ]
);

export const profile = pgTable(
  'profile',
  {
    id: uuid().primaryKey().notNull(),
    fullname: text().notNull(),
    username: text().notNull(),
    avatarUrl: text('avatar_url').default(
      'https://tapaozmyjsuykgerrfkt.supabase.co/storage/v1/object/public/avatars/avatar.png'
    ),
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
    pgPolicy('Only auth users can read profile', {
      as: 'permissive',
      for: 'select',
      to: ['anon', 'authenticated'],
      using: sql`true`
    }),
    pgPolicy('Public profiles are viewable by everyone.', { as: 'permissive', for: 'select', to: ['public'] }),
    pgPolicy('User can only delete their profiles', { as: 'permissive', for: 'delete', to: ['public'] }),
    pgPolicy('Users can insert their own profile.', { as: 'permissive', for: 'insert', to: ['public'] }),
    pgPolicy('Users can update own profile.', { as: 'permissive', for: 'update', to: ['public'] })
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
      maxValue: 9223372036854775807,
      cache: 1
    }),
    label: varchar().notNull(),
    isCorrect: boolean('is_correct').default(false).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    questionId: bigint('question_id', { mode: 'number' }).notNull(),
    value: uuid().default(sql`extensions.gen_random_uuid()`),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow()
  },
  (table) => [
    foreignKey({
      columns: [table.questionId],
      foreignColumns: [question.id],
      name: 'option_question_id_fkey'
    }).onDelete('cascade'),
    pgPolicy('Allow authenticated users to SELECT', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
      using: sql`(auth.uid() IS NOT NULL)`
    }),
    pgPolicy('User must be an org member to DELETE', { as: 'permissive', for: 'delete', to: ['public'] }),
    pgPolicy('User must be an org member to INSERT', { as: 'permissive', for: 'insert', to: ['public'] }),
    pgPolicy('User must be an org member to UPDATE', { as: 'permissive', for: 'update', to: ['public'] })
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
      maxValue: 9223372036854775807,
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
    unique('quiz_play_pin_key').on(table.pin),
    pgPolicy('Authenticated users can SELECT', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
      using: sql`true`
    })
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
      maxValue: 9223372036854775807,
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
    }),
    pgPolicy('Enable read access for all users', {
      as: 'permissive',
      for: 'insert',
      to: ['public'],
      withCheck: sql`true`
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
      maxValue: 9223372036854775807,
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
    }).onDelete('cascade'),
    pgPolicy('Delete only your own comment', {
      as: 'permissive',
      for: 'delete',
      to: ['public'],
      using: sql`(auth.uid() = ( SELECT groupmember.profile_id
   FROM groupmember
  WHERE (groupmember.id = lesson_comment.groupmember_id)))`
    }),
    pgPolicy('Enable read access for all users', { as: 'permissive', for: 'select', to: ['public'] }),
    pgPolicy('Update only your own', { as: 'permissive', for: 'update', to: ['public'] }),
    pgPolicy('User must be in course group to INSERT', { as: 'permissive', for: 'insert', to: ['public'] })
  ]
);

export const quiz = pgTable(
  'quiz',
  {
    id: uuid()
      .default(sql`extensions.gen_random_uuid()`)
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
    }),
    pgPolicy('Authenticated users can SELECT', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
      using: sql`true`
    })
  ]
);

export const submission = pgTable(
  'submission',
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    reviewerId: bigint('reviewer_id', { mode: 'number' }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    statusId: bigint('status_id', { mode: 'number' }).default(sql`'1'`),
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
    }),
    pgPolicy('Only authenticated users can SELECT', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
      using: sql`true`
    }),
    pgPolicy('User must be a course member to DELETE', { as: 'permissive', for: 'delete', to: ['public'] }),
    pgPolicy('User must be a course member to INSERT', { as: 'permissive', for: 'insert', to: ['public'] }),
    pgPolicy('User must be a course member to UPDATE', { as: 'permissive', for: 'update', to: ['public'] })
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
      maxValue: 9223372036854775807,
      cache: 1
    }),
    label: varchar().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow()
  },
  (table) => [
    pgPolicy('Authenticated users can SELECT', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
      using: sql`true`
    })
  ]
);

export const course = pgTable(
  'course',
  {
    title: varchar().notNull(),
    description: varchar().notNull(),
    overview: varchar().default('Welcome to this amazing course 🚀 '),
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    groupId: uuid('group_id'),
    isTemplate: boolean('is_template').default(true),
    logo: text().default('').notNull(),
    slug: varchar(),
    metadata: jsonb().default({ goals: '', description: '', requirements: '' }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    cost: bigint({ mode: 'number' }).default(sql`'0'`),
    currency: varchar().default('USD').notNull(),
    bannerImage: text('banner_image'),
    isPublished: boolean('is_published').default(false),
    isCertificateDownloadable: boolean('is_certificate_downloadable').default(false),
    certificateTheme: text('certificate_theme'),
    status: text().default('ACTIVE').notNull(),
    type: courseType().default('LIVE_CLASS'),
    version: courseVersion().default('V1').notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.groupId],
      foreignColumns: [group.id],
      name: 'course_group_id_fkey'
    }),
    unique('course_slug_key').on(table.slug),
    pgPolicy('Enable access to all users if PUBLIC or to course members when ', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
      using: sql`(is_published OR is_user_in_course_group_or_admin(group_id))`
    }),
    pgPolicy('User must be an org member to DELETE', { as: 'permissive', for: 'delete', to: ['public'] }),
    pgPolicy('User must be an org member to INSERT', { as: 'permissive', for: 'insert', to: ['public'] }),
    pgPolicy('User must be an org member to UPDATE', { as: 'permissive', for: 'update', to: ['public'] })
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
    }),
    pgPolicy('Delete only your own poll', {
      as: 'permissive',
      for: 'delete',
      to: ['public'],
      using: sql`(auth.uid() = ( SELECT groupmember.profile_id
   FROM groupmember
  WHERE (groupmember.id = apps_poll."authorId")))`
    }),
    pgPolicy('Update only your own', { as: 'permissive', for: 'update', to: ['public'] }),
    pgPolicy('User must be a course member to INSERT', { as: 'permissive', for: 'insert', to: ['public'] }),
    pgPolicy('User must be course member to SELECT', { as: 'permissive', for: 'select', to: ['public'] })
  ]
);

export const videoTranscripts = pgTable('video_transcripts', {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({
    name: 'video_transcripts_id_seq',
    startWith: 1,
    increment: 1,
    minValue: 1,
    maxValue: 9223372036854775807,
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
      maxValue: 9223372036854775807,
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
    }),
    pgPolicy('Enable read access for all users', {
      as: 'permissive',
      for: 'insert',
      to: ['public'],
      withCheck: sql`true`
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
      .default(sql`uuid_generate_v4()`)
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
    videos: jsonb().default([]),
    sectionId: uuid('section_id'),
    documents: jsonb().default([])
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
    foreignKey({
      columns: [table.sectionId],
      foreignColumns: [lessonSection.id],
      name: 'public_lesson_section_id_fkey'
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    pgPolicy('Enable read access for all users', { as: 'permissive', for: 'select', to: ['public'], using: sql`true` }),
    pgPolicy('User must be an org member to DELETE', { as: 'permissive', for: 'delete', to: ['public'] }),
    pgPolicy('User must be an org member to INSERT', { as: 'permissive', for: 'insert', to: ['public'] }),
    pgPolicy('User must be an org member to UPDATE', { as: 'permissive', for: 'update', to: ['public'] })
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
      maxValue: 9223372036854775807,
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
    }),
    pgPolicy('Authenticated users can read', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
      using: sql`(auth.uid() IS NOT NULL)`
    }),
    pgPolicy('Delete your own submission', { as: 'permissive', for: 'delete', to: ['public'] }),
    pgPolicy('Enable insert for authenticated users only', { as: 'permissive', for: 'insert', to: ['authenticated'] }),
    pgPolicy('Update your own submission', { as: 'permissive', for: 'update', to: ['public'] })
  ]
);

export const exercise = pgTable(
  'exercise',
  {
    title: varchar().notNull(),
    description: varchar(),
    lessonId: uuid('lesson_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    dueBy: timestamp('due_by', { mode: 'string' })
  },
  (table) => [
    foreignKey({
      columns: [table.lessonId],
      foreignColumns: [lesson.id],
      name: 'exercise_lesson_id_fkey'
    }).onDelete('cascade'),
    pgPolicy('Enable read access for all users', { as: 'permissive', for: 'select', to: ['public'], using: sql`true` }),
    pgPolicy('User must be an org member to DELETE', { as: 'permissive', for: 'delete', to: ['public'] }),
    pgPolicy('User must be an org member to INSERT', { as: 'permissive', for: 'insert', to: ['public'] }),
    pgPolicy('User must be an org member to UPDATE', { as: 'permissive', for: 'update', to: ['public'] })
  ]
);

export const groupmember = pgTable(
  'groupmember',
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    groupId: uuid('group_id').notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    roleId: bigint('role_id', { mode: 'number' }).notNull(),
    profileId: uuid('profile_id'),
    email: varchar(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    assignedStudentId: varchar('assigned_student_id')
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
    unique('unique_group_profile').on(table.groupId, table.profileId),
    pgPolicy('Enable insert for authenticated users only', {
      as: 'permissive',
      for: 'insert',
      to: ['authenticated'],
      withCheck: sql`true`
    }),
    pgPolicy('Enable read access for all users', { as: 'permissive', for: 'select', to: ['public'] }),
    pgPolicy('User must be an org member to DELETE', { as: 'permissive', for: 'delete', to: ['public'] }),
    pgPolicy('User must be an org member to UPDATE', { as: 'permissive', for: 'update', to: ['public'] })
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
      maxValue: 9223372036854775807,
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
    unique('unique_lesson_profile').on(table.lessonId, table.profileId),
    pgPolicy('Enable read access for all users', { as: 'permissive', for: 'select', to: ['public'], using: sql`true` }),
    pgPolicy('User must be an course member or Admin to perform ALL operation', {
      as: 'permissive',
      for: 'all',
      to: ['public']
    }),
    pgPolicy('User must be an org member to DELETE', { as: 'permissive', for: 'delete', to: ['public'] }),
    pgPolicy('User must be an org member to UPDATE', { as: 'permissive', for: 'update', to: ['public'] })
  ]
);

export const communityAnswer = pgTable(
  'community_answer',
  {
    id: uuid()
      .default(sql`extensions.gen_random_uuid()`)
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
    }),
    pgPolicy('Authenticated users can SELECT', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
      using: sql`(auth.uid() IS NOT NULL)`
    }),
    pgPolicy('Delete your own answer', { as: 'permissive', for: 'delete', to: ['public'] }),
    pgPolicy('Enable insert for authenticated users only', { as: 'permissive', for: 'insert', to: ['authenticated'] }),
    pgPolicy('Update your own answer', { as: 'permissive', for: 'update', to: ['public'] })
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
      maxValue: 9223372036854775807,
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
    }),
    pgPolicy('Authenticated users can SELECT', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
      using: sql`(auth.uid() IS NOT NULL)`
    }),
    pgPolicy('Delete your own question', { as: 'permissive', for: 'delete', to: ['public'] }),
    pgPolicy('Enable insert for authenticated users only', { as: 'permissive', for: 'insert', to: ['authenticated'] }),
    pgPolicy('Update your own question', { as: 'permissive', for: 'update', to: ['public'] })
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
    reaction: jsonb().default({ clap: [], smile: [], thumbsup: [], thumbsdown: [] }),
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
    }),
    pgPolicy('Delete your own comment', {
      as: 'permissive',
      for: 'delete',
      to: ['public'],
      using: sql`(auth.uid() = ( SELECT groupmember.profile_id
   FROM groupmember
  WHERE (groupmember.id = course_newsfeed.author_id)))`
    }),
    pgPolicy('Update only your own', { as: 'permissive', for: 'update', to: ['public'] }),
    pgPolicy('User must be a course member to INSERT', { as: 'permissive', for: 'insert', to: ['public'] }),
    pgPolicy('User must be a course member to SELECT', { as: 'permissive', for: 'select', to: ['public'] })
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
      maxValue: 9223372036854775807,
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
    }),
    unique('course_newsfeed_comment_id_key').on(table.id),
    pgPolicy('Delete your own', {
      as: 'permissive',
      for: 'delete',
      to: ['public'],
      using: sql`(auth.uid() = ( SELECT groupmember.profile_id
   FROM groupmember
  WHERE (groupmember.id = course_newsfeed_comment.author_id)))`
    }),
    pgPolicy('Update only your own', { as: 'permissive', for: 'update', to: ['public'] }),
    pgPolicy('User must be a course member to INSERT', { as: 'permissive', for: 'insert', to: ['public'] }),
    pgPolicy('User must be a course member to SELECT', { as: 'permissive', for: 'select', to: ['public'] })
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
      maxValue: 9223372036854775807,
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
    pgPolicy('Enable read access for all users', { as: 'permissive', for: 'select', to: ['public'], using: sql`true` }),
    pgPolicy('User must be an org member to DELETE', { as: 'permissive', for: 'delete', to: ['public'] }),
    pgPolicy('User must be an org member to INSERT', { as: 'permissive', for: 'insert', to: ['public'] }),
    pgPolicy('User must be an org member to UPDATE', { as: 'permissive', for: 'update', to: ['public'] })
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
      maxValue: 9223372036854775807,
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
      .onDelete('cascade'),
    pgPolicy('Enable read access for all users', { as: 'permissive', for: 'select', to: ['public'], using: sql`true` }),
    pgPolicy('User must be an org member to DELETE', { as: 'permissive', for: 'delete', to: ['public'] }),
    pgPolicy('User must be an org member to INSERT', { as: 'permissive', for: 'insert', to: ['public'] }),
    pgPolicy('User must be an org member to UPDATE', { as: 'permissive', for: 'update', to: ['public'] })
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
      .onDelete('cascade'),
    pgPolicy('Authenticated users can SELECT', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
      using: sql`(auth.uid() IS NOT NULL)`
    }),
    pgPolicy('User must be an org member to DELETE', { as: 'permissive', for: 'delete', to: ['public'] }),
    pgPolicy('User must be an org member to INSERT', { as: 'permissive', for: 'insert', to: ['public'] }),
    pgPolicy('User must be an org member to UPDATE', { as: 'permissive', for: 'update', to: ['public'] })
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
      maxValue: 9223372036854775807,
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
    pgPolicy('Allow authenticated users to read.', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
      using: sql`(auth.uid() IS NOT NULL)`
    }),
    pgPolicy('Enable insert for authenticated users only', { as: 'permissive', for: 'insert', to: ['authenticated'] }),
    pgPolicy('Only admin can delete', { as: 'permissive', for: 'delete', to: ['public'] }),
    pgPolicy('Only admin can update', { as: 'permissive', for: 'update', to: ['public'] }),
    pgPolicy('Only user can update their account via email', { as: 'permissive', for: 'update', to: ['public'] }),
    pgPolicy('User must be an admin to INSERT or allow if no existing member', {
      as: 'permissive',
      for: 'insert',
      to: ['public']
    })
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
      maxValue: 9223372036854775807,
      cache: 1
    }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    questionTypeId: bigint('question_type_id', { mode: 'number' }).notNull(),
    title: varchar().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    exerciseId: uuid('exercise_id').notNull(),
    name: uuid().default(sql`extensions.gen_random_uuid()`),
    points: doublePrecision(),
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
      columns: [table.questionTypeId],
      foreignColumns: [questionType.id],
      name: 'question_question_type_id_fkey'
    }),
    pgPolicy('Allow authenticated users to SELECT', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
      using: sql`(auth.uid() IS NOT NULL)`
    }),
    pgPolicy('User must be an org member to DELETE', { as: 'permissive', for: 'delete', to: ['public'] }),
    pgPolicy('User must be an org member to INSERT', { as: 'permissive', for: 'insert', to: ['public'] }),
    pgPolicy('User must be an org member to UPDATE', { as: 'permissive', for: 'update', to: ['public'] })
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
      maxValue: 9223372036854775807,
      cache: 1
    }),
    answers: varchar().array(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    questionId: bigint('question_id', { mode: 'number' }).notNull(),
    openAnswer: text('open_answer'),
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
    }).onDelete('cascade'),
    pgPolicy('Only authenticated users can select.', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
      using: sql`(auth.uid() IS NOT NULL)`
    }),
    pgPolicy('User must be an course member to DELETE', { as: 'permissive', for: 'delete', to: ['public'] }),
    pgPolicy('User must be an course member to INSERT', { as: 'permissive', for: 'insert', to: ['public'] }),
    pgPolicy('User must be an course member to UPDATE', { as: 'permissive', for: 'update', to: ['public'] })
  ]
);

export const questionType = pgTable(
  'question_type',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({
      name: 'question_type_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1
    }),
    label: varchar().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    typename: varchar()
  },
  (table) => [
    pgPolicy('Enable read access for all users', { as: 'permissive', for: 'select', to: ['public'], using: sql`true` })
  ]
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
      maxValue: 9223372036854775807,
      cache: 1
    }),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow()
  },
  (table) => [
    pgPolicy('Enable read access for all users', { as: 'permissive', for: 'select', to: ['public'], using: sql`true` })
  ]
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
      maxValue: 9223372036854775807,
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
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    name: varchar().notNull(),
    siteName: text(),
    avatarUrl: text('avatar_url'),
    settings: jsonb().default({}),
    landingpage: jsonb().default({}),
    theme: text(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    customization: json()
      .default({
        apps: { poll: true, comments: true },
        course: { grading: true, newsfeed: true },
        dashboard: { exercise: true, community: true, bannerText: '', bannerImage: '' }
      })
      .notNull(),
    isRestricted: boolean('is_restricted').default(false).notNull(),
    customCode: text(),
    customDomain: text(),
    favicon: text(),
    isCustomDomainVerified: boolean().default(false)
  },
  (table) => [
    unique('organization_siteName_key').on(table.siteName),
    unique('organization_customDomain_key').on(table.customDomain),
    pgPolicy('Authenticated users can delete', {
      as: 'permissive',
      for: 'delete',
      to: ['public'],
      using: sql`(auth.uid() IS NOT NULL)`
    }),
    pgPolicy('Enable insert for authenticated users only', { as: 'permissive', for: 'insert', to: ['authenticated'] }),
    pgPolicy('Enable read access for all users', { as: 'permissive', for: 'select', to: ['public'] }),
    pgPolicy('User must be admin to UPDATE', { as: 'permissive', for: 'update', to: ['public'] })
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
