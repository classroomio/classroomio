import {
  and,
  course,
  courseCompletionRecord,
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
  user
} from '@db/drizzle';

import type {
  TNewCourse,
  TNewCourseCompletionRecord,
  TNewCourseSection,
  TNewExercise,
  TNewGroup,
  TNewGroupmember,
  TNewLesson,
  TNewProfile
} from '@db/types';

interface SeedComplianceArgs {
  enterpriseOrgId: string;
}

// ---------- Fixed IDs (stable across runs) ----------

const HIPAA_GROUP_ID = '7e000000-1000-4000-8000-000000000001';
const SOC2_GROUP_ID = '7e000000-1000-4000-8000-000000000002';

const HIPAA_COURSE_ID = '7e000000-2000-4000-8000-000000000001';
const SOC2_COURSE_ID = '7e000000-2000-4000-8000-000000000002';

const HIPAA_SECTION_ID = '7e000000-3000-4000-8000-000000000001';
const SOC2_SECTION_ID = '7e000000-3000-4000-8000-000000000002';

const HIPAA_LESSON_IDS = ['7e000000-4000-4000-8000-000000000001', '7e000000-4000-4000-8000-000000000002'] as const;
const SOC2_LESSON_IDS = ['7e000000-4000-4000-8000-000000000003', '7e000000-4000-4000-8000-000000000004'] as const;

const HIPAA_EXERCISE_ID = '7e000000-5000-4000-8000-000000000001';
const SOC2_EXERCISE_ID = '7e000000-5000-4000-8000-000000000002';

// 20 stable learner profile UUIDs
const LEARNER_PROFILES: Array<{ id: string; fullname: string; username: string; email: string; avatarUrl: string }> = [
  {
    id: '7e000000-9000-4000-8000-000000000001',
    fullname: 'Ada Lovelace',
    username: 'ada.lovelace',
    email: 'ada.lovelace@coursera-test.demo'
  },
  {
    id: '7e000000-9000-4000-8000-000000000002',
    fullname: 'Grace Hopper',
    username: 'grace.hopper',
    email: 'grace.hopper@coursera-test.demo'
  },
  {
    id: '7e000000-9000-4000-8000-000000000003',
    fullname: 'Linus Torvalds',
    username: 'linus.torvalds',
    email: 'linus.torvalds@coursera-test.demo'
  },
  {
    id: '7e000000-9000-4000-8000-000000000004',
    fullname: 'Margaret Hamilton',
    username: 'margaret.hamilton',
    email: 'margaret.hamilton@coursera-test.demo'
  },
  {
    id: '7e000000-9000-4000-8000-000000000005',
    fullname: 'Alan Turing',
    username: 'alan.turing',
    email: 'alan.turing@coursera-test.demo'
  },
  {
    id: '7e000000-9000-4000-8000-000000000006',
    fullname: 'Katherine Johnson',
    username: 'katherine.johnson',
    email: 'katherine.johnson@coursera-test.demo'
  },
  {
    id: '7e000000-9000-4000-8000-000000000007',
    fullname: 'Dennis Ritchie',
    username: 'dennis.ritchie',
    email: 'dennis.ritchie@coursera-test.demo'
  },
  {
    id: '7e000000-9000-4000-8000-000000000008',
    fullname: 'Barbara Liskov',
    username: 'barbara.liskov',
    email: 'barbara.liskov@coursera-test.demo'
  },
  {
    id: '7e000000-9000-4000-8000-000000000009',
    fullname: 'Donald Knuth',
    username: 'donald.knuth',
    email: 'donald.knuth@coursera-test.demo'
  },
  {
    id: '7e000000-9000-4000-8000-000000000010',
    fullname: 'Radia Perlman',
    username: 'radia.perlman',
    email: 'radia.perlman@coursera-test.demo'
  },
  {
    id: '7e000000-9000-4000-8000-000000000011',
    fullname: 'Tim Berners-Lee',
    username: 'tim.bernerslee',
    email: 'tim.bernerslee@coursera-test.demo'
  },
  {
    id: '7e000000-9000-4000-8000-000000000012',
    fullname: 'Sophie Wilson',
    username: 'sophie.wilson',
    email: 'sophie.wilson@coursera-test.demo'
  },
  {
    id: '7e000000-9000-4000-8000-000000000013',
    fullname: 'Anita Borg',
    username: 'anita.borg',
    email: 'anita.borg@coursera-test.demo'
  },
  {
    id: '7e000000-9000-4000-8000-000000000014',
    fullname: 'Brendan Eich',
    username: 'brendan.eich',
    email: 'brendan.eich@coursera-test.demo'
  },
  {
    id: '7e000000-9000-4000-8000-000000000015',
    fullname: 'Jeannette Wing',
    username: 'jeannette.wing',
    email: 'jeannette.wing@coursera-test.demo'
  },
  {
    id: '7e000000-9000-4000-8000-000000000016',
    fullname: 'Bjarne Stroustrup',
    username: 'bjarne.stroustrup',
    email: 'bjarne.stroustrup@coursera-test.demo'
  },
  {
    id: '7e000000-9000-4000-8000-000000000017',
    fullname: 'Hedy Lamarr',
    username: 'hedy.lamarr',
    email: 'hedy.lamarr@coursera-test.demo'
  },
  {
    id: '7e000000-9000-4000-8000-000000000018',
    fullname: 'James Gosling',
    username: 'james.gosling',
    email: 'james.gosling@coursera-test.demo'
  },
  {
    id: '7e000000-9000-4000-8000-000000000019',
    fullname: 'Frances Allen',
    username: 'frances.allen',
    email: 'frances.allen@coursera-test.demo'
  },
  {
    id: '7e000000-9000-4000-8000-000000000020',
    fullname: 'Vint Cerf',
    username: 'vint.cerf',
    email: 'vint.cerf@coursera-test.demo'
  }
].map((p) => ({
  ...p,
  avatarUrl: `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(p.username)}`
}));

// ---------- Helpers ----------

const DAY_MS = 24 * 60 * 60 * 1000;

function isoDaysFromNow(now: Date, days: number): string {
  return new Date(now.getTime() + days * DAY_MS).toISOString();
}

type RecordPlan = {
  status:
    | 'compliant'
    | 'expiring_soon'
    | 'in_grace_period'
    | 'non_compliant'
    | 'in_progress'
    | 'not_started'
    | 'waived'
    | 'no_record';
};

// Per-course learner-index → status plan. Indices reference LEARNER_PROFILES (0..19).
const HIPAA_STATUS_PLAN: ReadonlyArray<RecordPlan['status']> = [
  // 9 compliant
  'compliant',
  'compliant',
  'compliant',
  'compliant',
  'compliant',
  'compliant',
  'compliant',
  'compliant',
  'compliant',
  // 2 expiring_soon
  'expiring_soon',
  'expiring_soon',
  // 1 in_grace_period
  'in_grace_period',
  // 2 non_compliant
  'non_compliant',
  'non_compliant',
  // 2 in_progress
  'in_progress',
  'in_progress',
  // 2 not_started
  'not_started',
  'not_started',
  // 1 waived
  'waived',
  // 1 no_record (no row inserted)
  'no_record'
];

const SOC2_STATUS_PLAN: ReadonlyArray<RecordPlan['status']> = [
  // 7 compliant
  'compliant',
  'compliant',
  'compliant',
  'compliant',
  'compliant',
  'compliant',
  'compliant',
  // 2 expiring_soon
  'expiring_soon',
  'expiring_soon',
  // 2 in_grace_period
  'in_grace_period',
  'in_grace_period',
  // 3 non_compliant
  'non_compliant',
  'non_compliant',
  'non_compliant',
  // 2 in_progress
  'in_progress',
  'in_progress',
  // 2 not_started
  'not_started',
  'not_started',
  // 1 waived
  'waived',
  // 1 no_record
  'no_record'
];

function buildCompletionRecord({
  courseId,
  groupMemberId,
  profileId,
  status,
  now,
  retakeIntervalMonths,
  waiverAdminProfileId
}: {
  courseId: string;
  groupMemberId: string;
  profileId: string;
  status: RecordPlan['status'];
  now: Date;
  retakeIntervalMonths: number;
  waiverAdminProfileId: string | null;
}): TNewCourseCompletionRecord | null {
  if (status === 'no_record') return null;

  const validityDays = retakeIntervalMonths * 30;

  switch (status) {
    case 'compliant': {
      // Completed ~ between (validityDays - 90) and (validityDays - 30) days ago,
      // so validUntil is well in the future (>30 days away).
      const completedDaysAgo = Math.max(30, Math.floor(validityDays / 3));
      const completedAt = isoDaysFromNow(now, -completedDaysAgo);
      const validUntil = isoDaysFromNow(now, validityDays - completedDaysAgo);
      return {
        courseId,
        groupMemberId,
        profileId,
        cycleNumber: 1,
        status,
        dueDate: completedAt,
        startedAt: isoDaysFromNow(now, -completedDaysAgo - 2),
        completedAt,
        validUntil,
        score: 88,
        attempts: 1,
        timeSpentMinutes: 42
      };
    }
    case 'expiring_soon': {
      // completedAt ~ (validityDays - 7) days ago → validUntil 7 days from now.
      const completedDaysAgo = validityDays - 7;
      const completedAt = isoDaysFromNow(now, -completedDaysAgo);
      const validUntil = isoDaysFromNow(now, 7);
      return {
        courseId,
        groupMemberId,
        profileId,
        cycleNumber: 1,
        status,
        dueDate: completedAt,
        startedAt: isoDaysFromNow(now, -completedDaysAgo - 1),
        completedAt,
        validUntil,
        score: 91,
        attempts: 1,
        timeSpentMinutes: 38
      };
    }
    case 'in_grace_period': {
      // dueDate 3 days in the past, never completed.
      return {
        courseId,
        groupMemberId,
        profileId,
        cycleNumber: 1,
        status,
        dueDate: isoDaysFromNow(now, -3),
        startedAt: isoDaysFromNow(now, -10),
        attempts: 0
      };
    }
    case 'non_compliant': {
      // dueDate 30 days in the past, never completed.
      return {
        courseId,
        groupMemberId,
        profileId,
        cycleNumber: 1,
        status,
        dueDate: isoDaysFromNow(now, -30),
        startedAt: isoDaysFromNow(now, -20),
        attempts: 0
      };
    }
    case 'in_progress': {
      return {
        courseId,
        groupMemberId,
        profileId,
        cycleNumber: 1,
        status,
        dueDate: isoDaysFromNow(now, 21),
        startedAt: isoDaysFromNow(now, -2),
        attempts: 0,
        timeSpentMinutes: 12
      };
    }
    case 'not_started': {
      return {
        courseId,
        groupMemberId,
        profileId,
        cycleNumber: 1,
        status,
        dueDate: isoDaysFromNow(now, 21),
        attempts: 0
      };
    }
    case 'waived': {
      return {
        courseId,
        groupMemberId,
        profileId,
        cycleNumber: 1,
        status,
        dueDate: isoDaysFromNow(now, 14),
        waivedBy: waiverAdminProfileId ?? profileId,
        waiverReason: 'On approved leave through end of cycle',
        waiverExpiresAt: isoDaysFromNow(now, 90)
      };
    }
  }
}

// ---------- Main seed ----------

export async function seedCompliance({ enterpriseOrgId }: SeedComplianceArgs) {
  const now = new Date();

  // 1a. Users (profile.id FKs to user.id)
  const profileIds = LEARNER_PROFILES.map((p) => p.id);
  const existingUsers = await db.select({ id: user.id }).from(user).where(inArray(user.id, profileIds));
  const existingUserIds = new Set(existingUsers.map((u) => u.id));
  const usersToInsert = LEARNER_PROFILES.filter((p) => !existingUserIds.has(p.id)).map((p) => ({
    id: p.id,
    name: p.fullname,
    email: p.email,
    emailVerified: true,
    image: null,
    role: null,
    banned: false,
    isAnonymous: false
  }));
  if (usersToInsert.length > 0) {
    await db.insert(user).values(usersToInsert);
    console.log(`   ✓ Inserted ${usersToInsert.length} learner user(s)`);
  } else {
    console.log('   ✓ Learner users already exist, skipping');
  }

  // 1b. Profiles
  const existingProfiles = await db.select({ id: profile.id }).from(profile).where(inArray(profile.id, profileIds));
  const existingProfileIds = new Set(existingProfiles.map((p) => p.id));
  const profilesToInsert: TNewProfile[] = LEARNER_PROFILES.filter((p) => !existingProfileIds.has(p.id)).map((p) => ({
    id: p.id,
    fullname: p.fullname,
    username: p.username,
    email: p.email,
    avatarUrl: p.avatarUrl,
    canAddCourse: false,
    isEmailVerified: true
  }));
  if (profilesToInsert.length > 0) {
    await db.insert(profile).values(profilesToInsert);
    console.log(`   ✓ Inserted ${profilesToInsert.length} learner profile(s)`);
  } else {
    console.log('   ✓ Learner profiles already exist, skipping');
  }

  // 2. Groups
  const existingGroups = await db
    .select({ id: group.id })
    .from(group)
    .where(inArray(group.id, [HIPAA_GROUP_ID, SOC2_GROUP_ID]));
  const existingGroupIds = new Set(existingGroups.map((g) => g.id));
  const groupsToInsert: TNewGroup[] = [
    {
      id: HIPAA_GROUP_ID,
      name: 'HIPAA Awareness 2026',
      description: 'Mandatory annual HIPAA awareness refresher for all Coursera Test staff handling PHI.',
      organizationId: enterpriseOrgId
    },
    {
      id: SOC2_GROUP_ID,
      name: 'SOC 2 Security Basics',
      description: 'Twice-yearly SOC 2 security fundamentals — required for engineering and operations.',
      organizationId: enterpriseOrgId
    }
  ].filter((g) => !existingGroupIds.has(g.id));
  if (groupsToInsert.length > 0) {
    await db.insert(group).values(groupsToInsert);
    console.log(`   ✓ Inserted ${groupsToInsert.length} compliance group(s)`);
  } else {
    console.log('   ✓ Compliance groups already exist, skipping');
  }

  // 3. Courses (COMPLIANCE type)
  const existingCourses = await db
    .select({ id: course.id })
    .from(course)
    .where(inArray(course.id, [HIPAA_COURSE_ID, SOC2_COURSE_ID]));
  const existingCourseIds = new Set(existingCourses.map((c) => c.id));
  const coursesToInsert: TNewCourse[] = [
    {
      id: HIPAA_COURSE_ID,
      title: 'HIPAA Awareness 2026',
      description:
        'Annual HIPAA refresher covering PHI handling, breach reporting, and minimum-necessary access for everyone who touches patient data.',
      overview: '<p>Annual HIPAA refresher covering PHI handling, breach reporting, and minimum-necessary access.</p>',
      groupId: HIPAA_GROUP_ID,
      isTemplate: false,
      logo: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=600&q=70',
      slug: 'hipaa-awareness-2026',
      metadata: {
        goals: '',
        grading: false,
        description: '',
        requirements: '',
        lessonDownload: false,
        allowNewStudent: false
      },
      cost: 0,
      currency: 'USD',
      isPublished: true,
      certificate: { isDownloadable: true, theme: 'professional' },
      compliance: {
        retakeIntervalMonths: 12,
        gracePeriodDays: 14,
        reminderDaysBefore: [30, 14, 7, 1],
        isMandatory: true,
        framework: 'HIPAA',
        passingScore: 80
      },
      status: 'ACTIVE',
      type: 'COMPLIANCE'
    },
    {
      id: SOC2_COURSE_ID,
      title: 'SOC 2 Security Basics',
      description:
        'Core SOC 2 controls — password hygiene, phishing, data classification, incident response. Runs every six months for engineering and operations.',
      overview: '<p>Twice-yearly SOC 2 security fundamentals. Required for engineering, IT, and operations.</p>',
      groupId: SOC2_GROUP_ID,
      isTemplate: false,
      logo: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=600&q=70',
      slug: 'soc2-security-basics',
      metadata: {
        goals: '',
        grading: true,
        description: '',
        requirements: '',
        lessonDownload: false,
        allowNewStudent: false
      },
      cost: 0,
      currency: 'USD',
      isPublished: true,
      certificate: { isDownloadable: true, theme: 'professional' },
      compliance: {
        retakeIntervalMonths: 6,
        gracePeriodDays: 7,
        reminderDaysBefore: [14, 7, 1],
        isMandatory: true,
        framework: 'ISO',
        passingScore: 85
      },
      status: 'ACTIVE',
      type: 'COMPLIANCE'
    }
  ].filter((c) => !existingCourseIds.has(c.id!));
  if (coursesToInsert.length > 0) {
    await db.insert(course).values(coursesToInsert);
    console.log(`   ✓ Inserted ${coursesToInsert.length} compliance course(s)`);
  } else {
    console.log('   ✓ Compliance courses already exist, skipping');
  }

  // 4. Sections + lessons + exercises
  const sectionsToInsert: TNewCourseSection[] = [
    { id: HIPAA_SECTION_ID, courseId: HIPAA_COURSE_ID, title: 'Compliance Module', order: 0 },
    { id: SOC2_SECTION_ID, courseId: SOC2_COURSE_ID, title: 'Security Fundamentals', order: 0 }
  ];
  const existingSections = await db
    .select({ id: courseSection.id })
    .from(courseSection)
    .where(inArray(courseSection.id, [HIPAA_SECTION_ID, SOC2_SECTION_ID]));
  const existingSectionIds = new Set(existingSections.map((s) => s.id));
  const newSections = sectionsToInsert.filter((s) => !existingSectionIds.has(s.id!));
  if (newSections.length > 0) {
    await db.insert(courseSection).values(newSections);
    console.log(`   ✓ Inserted ${newSections.length} compliance section(s)`);
  } else {
    console.log('   ✓ Compliance sections already exist, skipping');
  }

  const lessonsPlan: TNewLesson[] = [
    {
      id: HIPAA_LESSON_IDS[0],
      courseId: HIPAA_COURSE_ID,
      sectionId: HIPAA_SECTION_ID,
      title: 'What HIPAA actually requires of you',
      note: '<p>Plain-English summary of the privacy rule, security rule, and breach notification obligations.</p>',
      isUnlocked: true
    },
    {
      id: HIPAA_LESSON_IDS[1],
      courseId: HIPAA_COURSE_ID,
      sectionId: HIPAA_SECTION_ID,
      title: 'Handling PHI: the everyday rules',
      note: '<p>Minimum necessary access, secure messaging, faxing rules, and what to do if you spot a breach.</p>',
      isUnlocked: false
    },
    {
      id: SOC2_LESSON_IDS[0],
      courseId: SOC2_COURSE_ID,
      sectionId: SOC2_SECTION_ID,
      title: 'Passwords, MFA, and not getting phished',
      note: '<p>Strong-credential hygiene + recognizing the four most common phishing patterns we see at Coursera Test.</p>',
      isUnlocked: true
    },
    {
      id: SOC2_LESSON_IDS[1],
      courseId: SOC2_COURSE_ID,
      sectionId: SOC2_SECTION_ID,
      title: 'Data classification & incident response',
      note: '<p>What counts as confidential, who to call when something goes wrong, and how we record an incident.</p>',
      isUnlocked: false
    }
  ];
  const existingLessons = await db
    .select({ id: lesson.id })
    .from(lesson)
    .where(
      inArray(
        lesson.id,
        lessonsPlan.map((l) => l.id!)
      )
    );
  const existingLessonIds = new Set(existingLessons.map((l) => l.id));
  const newLessons = lessonsPlan.filter((l) => !existingLessonIds.has(l.id!));
  if (newLessons.length > 0) {
    await db.insert(lesson).values(newLessons);
    console.log(`   ✓ Inserted ${newLessons.length} compliance lesson(s)`);
  } else {
    console.log('   ✓ Compliance lessons already exist, skipping');
  }

  const exercisesPlan: TNewExercise[] = [
    {
      id: HIPAA_EXERCISE_ID,
      title: 'HIPAA: end-of-course quiz',
      description: '<p>Pass this short quiz to mark the course complete.</p>',
      lessonId: HIPAA_LESSON_IDS[1],
      sectionId: HIPAA_SECTION_ID
    },
    {
      id: SOC2_EXERCISE_ID,
      title: 'SOC 2: end-of-course quiz',
      description: '<p>Pass this short quiz to mark the course complete.</p>',
      lessonId: SOC2_LESSON_IDS[1],
      sectionId: SOC2_SECTION_ID
    }
  ];
  const existingExercises = await db
    .select({ id: exercise.id })
    .from(exercise)
    .where(inArray(exercise.id, [HIPAA_EXERCISE_ID, SOC2_EXERCISE_ID]));
  const existingExerciseIds = new Set(existingExercises.map((e) => e.id));
  const newExercises = exercisesPlan.filter((e) => !existingExerciseIds.has(e.id!));
  if (newExercises.length > 0) {
    await db.insert(exercise).values(newExercises);
    console.log(`   ✓ Inserted ${newExercises.length} compliance exercise(s)`);
  } else {
    console.log('   ✓ Compliance exercises already exist, skipping');
  }

  // 5. Groupmembers (20 learners × 2 groups)
  const desiredMembers: Array<{ groupId: string; profileId: string }> = [];
  for (const groupId of [HIPAA_GROUP_ID, SOC2_GROUP_ID]) {
    for (const p of LEARNER_PROFILES) {
      desiredMembers.push({ groupId, profileId: p.id });
    }
  }
  const existingGroupMembers = await db
    .select({ id: groupmember.id, groupId: groupmember.groupId, profileId: groupmember.profileId })
    .from(groupmember)
    .where(inArray(groupmember.groupId, [HIPAA_GROUP_ID, SOC2_GROUP_ID]));
  const existingMemberKey = new Set(existingGroupMembers.map((m) => `${m.groupId}-${m.profileId}`));
  const newMembers: TNewGroupmember[] = desiredMembers
    .filter((m) => !existingMemberKey.has(`${m.groupId}-${m.profileId}`))
    .map((m) => ({
      groupId: m.groupId,
      profileId: m.profileId,
      roleId: 3 // STUDENT
    }));
  if (newMembers.length > 0) {
    await db.insert(groupmember).values(newMembers);
    console.log(`   ✓ Inserted ${newMembers.length} compliance groupmember(s)`);
  } else {
    console.log('   ✓ Compliance groupmembers already exist, skipping');
  }

  // Refetch groupmembers so we can look up the groupMember.id for each (groupId, profileId)
  const allMembers = await db
    .select({ id: groupmember.id, groupId: groupmember.groupId, profileId: groupmember.profileId })
    .from(groupmember)
    .where(inArray(groupmember.groupId, [HIPAA_GROUP_ID, SOC2_GROUP_ID]));
  const memberLookup = new Map<string, string>();
  for (const m of allMembers) {
    if (m.profileId) memberLookup.set(`${m.groupId}-${m.profileId}`, m.id);
  }

  // 6. Resolve a waiver-admin profileId (the org's first admin)
  const orgAdmins = await db
    .select({ profileId: organizationmember.profileId })
    .from(organizationmember)
    .where(and(eq(organizationmember.organizationId, enterpriseOrgId), eq(organizationmember.roleId, 1)));
  const waiverAdminProfileId = orgAdmins.find((a) => a.profileId)?.profileId ?? null;

  // 7. course_completion_record rows
  const recordsPlan: Array<{
    courseId: string;
    status: RecordPlan['status'];
    profileIdx: number;
    retakeIntervalMonths: number;
  }> = [];
  HIPAA_STATUS_PLAN.forEach((status, idx) =>
    recordsPlan.push({ courseId: HIPAA_COURSE_ID, status, profileIdx: idx, retakeIntervalMonths: 12 })
  );
  SOC2_STATUS_PLAN.forEach((status, idx) =>
    recordsPlan.push({ courseId: SOC2_COURSE_ID, status, profileIdx: idx, retakeIntervalMonths: 6 })
  );

  const existingRecords = await db
    .select({
      courseId: courseCompletionRecord.courseId,
      profileId: courseCompletionRecord.profileId,
      cycleNumber: courseCompletionRecord.cycleNumber
    })
    .from(courseCompletionRecord)
    .where(inArray(courseCompletionRecord.courseId, [HIPAA_COURSE_ID, SOC2_COURSE_ID]));
  const existingRecordKey = new Set(existingRecords.map((r) => `${r.courseId}-${r.profileId}-${r.cycleNumber}`));

  const recordsToInsert: TNewCourseCompletionRecord[] = [];
  for (const plan of recordsPlan) {
    const learner = LEARNER_PROFILES[plan.profileIdx];
    if (!learner) continue;

    const groupId = plan.courseId === HIPAA_COURSE_ID ? HIPAA_GROUP_ID : SOC2_GROUP_ID;
    const groupMemberId = memberLookup.get(`${groupId}-${learner.id}`);
    if (!groupMemberId) continue;

    const key = `${plan.courseId}-${learner.id}-1`;
    if (existingRecordKey.has(key)) continue;

    const row = buildCompletionRecord({
      courseId: plan.courseId,
      groupMemberId,
      profileId: learner.id,
      status: plan.status,
      now,
      retakeIntervalMonths: plan.retakeIntervalMonths,
      waiverAdminProfileId
    });
    if (row) recordsToInsert.push(row);
  }

  if (recordsToInsert.length > 0) {
    await db.insert(courseCompletionRecord).values(recordsToInsert);
    console.log(`   ✓ Inserted ${recordsToInsert.length} course_completion_record row(s)`);
  } else {
    console.log('   ✓ course_completion_record rows already exist, skipping');
  }
}
