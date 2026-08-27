import {
  account,
  analyticsLoginEvents,
  and,
  db,
  eq,
  groupmember,
  inArray,
  lessonCompletion,
  organizationmember,
  profile,
  submission,
  user
} from '@db/drizzle';

import type { TNewGroupmember, TNewProfile } from '@db/types';

interface SeedReactCoursePeopleProgressArgs {
  testOrgId: string;
  reactGroupId: string;
  reactCourseId: string;
  existingStudentUserId: string;
}

const PASSWORD_HASH = '$2a$10$dgxySj.k12gDKhLx7X4x6./J.Nzhz7WQrwh5lkjLKwIwWW4o5GJcW';

const REACT_LESSON_IDS = [
  '6f2d8142-0903-425c-8534-f5105b624752',
  '0a39ab2f-9451-4a90-902c-3030bf965637',
  '80b79665-733b-41bf-9853-34fd8ab50496'
] as const;

const REACT_EXERCISE_IDS = [
  'e78bfd24-8ac3-43e9-a117-a2f9d00f74b1',
  '43ead5d7-af88-47cf-8f86-99124f5eb0cd',
  'b0770deb-a8a0-4efe-9d28-8bf1298c04b2'
] as const;

type LearnerProgressPlan = {
  lessonsCompleted: number;
  exercisesCompleted: number;
  certificateEarnedAtDaysAgo: number | null;
  lastLoginDaysAgo: number | null;
  enrolledDaysAgo: number;
};

type ReactLearnerSeed = {
  id: string;
  groupMemberId: string;
  fullname: string;
  username: string;
  email: string;
  avatarUrl: string;
  progress: LearnerProgressPlan;
};

const REACT_LEARNERS: ReactLearnerSeed[] = [
  {
    id: '8f000000-9000-4000-8000-000000000001',
    groupMemberId: '8f000001-1000-4000-8000-000000000001',
    fullname: 'Maya Chen',
    username: 'maya.chen',
    email: 'maya.chen@udemy-test.demo',
    progress: {
      lessonsCompleted: 0,
      exercisesCompleted: 0,
      certificateEarnedAtDaysAgo: null,
      lastLoginDaysAgo: null,
      enrolledDaysAgo: 3
    }
  },
  {
    id: '8f000000-9000-4000-8000-000000000002',
    groupMemberId: '8f000001-1000-4000-8000-000000000002',
    fullname: 'Ethan Brooks',
    username: 'ethan.brooks',
    email: 'ethan.brooks@udemy-test.demo',
    progress: {
      lessonsCompleted: 0,
      exercisesCompleted: 0,
      certificateEarnedAtDaysAgo: null,
      lastLoginDaysAgo: 0,
      enrolledDaysAgo: 14
    }
  },
  {
    id: '8f000000-9000-4000-8000-000000000003',
    groupMemberId: '8f000001-1000-4000-8000-000000000003',
    fullname: 'Sophia Patel',
    username: 'sophia.patel',
    email: 'sophia.patel@udemy-test.demo',
    progress: {
      lessonsCompleted: 1,
      exercisesCompleted: 0,
      certificateEarnedAtDaysAgo: null,
      lastLoginDaysAgo: 2,
      enrolledDaysAgo: 21
    }
  },
  {
    id: '8f000000-9000-4000-8000-000000000004',
    groupMemberId: '8f000001-1000-4000-8000-000000000004',
    fullname: "Liam O'Connor",
    username: 'liam.oconnor',
    email: 'liam.oconnor@udemy-test.demo',
    progress: {
      lessonsCompleted: 1,
      exercisesCompleted: 1,
      certificateEarnedAtDaysAgo: null,
      lastLoginDaysAgo: 5,
      enrolledDaysAgo: 30
    }
  },
  {
    id: '8f000000-9000-4000-8000-000000000005',
    groupMemberId: '8f000001-1000-4000-8000-000000000005',
    fullname: 'Zoe Williams',
    username: 'zoe.williams',
    email: 'zoe.williams@udemy-test.demo',
    progress: {
      lessonsCompleted: 2,
      exercisesCompleted: 1,
      certificateEarnedAtDaysAgo: null,
      lastLoginDaysAgo: 10,
      enrolledDaysAgo: 45
    }
  },
  {
    id: '8f000000-9000-4000-8000-000000000006',
    groupMemberId: '8f000001-1000-4000-8000-000000000006',
    fullname: 'Noah Kim',
    username: 'noah.kim',
    email: 'noah.kim@udemy-test.demo',
    progress: {
      lessonsCompleted: 2,
      exercisesCompleted: 2,
      certificateEarnedAtDaysAgo: null,
      lastLoginDaysAgo: 20,
      enrolledDaysAgo: 60
    }
  },
  {
    id: '8f000000-9000-4000-8000-000000000007',
    groupMemberId: '8f000001-1000-4000-8000-000000000007',
    fullname: 'Ava Martinez',
    username: 'ava.martinez',
    email: 'ava.martinez@udemy-test.demo',
    progress: {
      lessonsCompleted: 3,
      exercisesCompleted: 2,
      certificateEarnedAtDaysAgo: null,
      lastLoginDaysAgo: 1,
      enrolledDaysAgo: 75
    }
  },
  {
    id: '8f000000-9000-4000-8000-000000000008',
    groupMemberId: '8f000001-1000-4000-8000-000000000008',
    fullname: 'James Wilson',
    username: 'james.wilson',
    email: 'james.wilson@udemy-test.demo',
    progress: {
      lessonsCompleted: 3,
      exercisesCompleted: 3,
      certificateEarnedAtDaysAgo: 7,
      lastLoginDaysAgo: 7,
      enrolledDaysAgo: 90
    }
  },
  {
    id: '8f000000-9000-4000-8000-000000000009',
    groupMemberId: '8f000001-1000-4000-8000-000000000009',
    fullname: 'Olivia Brown',
    username: 'olivia.brown',
    email: 'olivia.brown@udemy-test.demo',
    progress: {
      lessonsCompleted: 3,
      exercisesCompleted: 3,
      certificateEarnedAtDaysAgo: null,
      lastLoginDaysAgo: 3,
      enrolledDaysAgo: 100
    }
  }
].map((learner) => ({
  ...learner,
  avatarUrl: `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(learner.username)}`
}));

const EXISTING_STUDENT_GROUP_MEMBER_ID = '8f000001-1000-4000-8000-000000000010';

const DAY_MS = 24 * 60 * 60 * 1000;

function isoDaysFromNow(now: Date, days: number): string {
  return new Date(now.getTime() + days * DAY_MS).toISOString();
}

function isoDateFromNow(now: Date, days: number): string {
  return isoDaysFromNow(now, days).slice(0, 10);
}

function lessonIdsForCount(count: number): string[] {
  return REACT_LESSON_IDS.slice(0, count);
}

function exerciseIdsForCount(count: number): string[] {
  return REACT_EXERCISE_IDS.slice(0, count);
}

/**
 * Seeds ten React-course students with varied progress for the People table demo.
 */
export async function seedReactCoursePeopleProgress({
  testOrgId,
  reactGroupId,
  reactCourseId,
  existingStudentUserId
}: SeedReactCoursePeopleProgressArgs) {
  const now = new Date();
  const profileIds = REACT_LEARNERS.map((learner) => learner.id);

  const existingUsers = await db.select({ id: user.id }).from(user).where(inArray(user.id, profileIds));
  const existingUserIds = new Set(existingUsers.map((row) => row.id));
  const usersToInsert = REACT_LEARNERS.filter((learner) => !existingUserIds.has(learner.id)).map((learner) => ({
    id: learner.id,
    name: learner.fullname,
    email: learner.email,
    emailVerified: true,
    image: null,
    role: null,
    banned: false,
    isAnonymous: false
  }));

  if (usersToInsert.length > 0) {
    await db.insert(user).values(usersToInsert);
    console.log(`   ✓ Inserted ${usersToInsert.length} React learner user(s)`);
  } else {
    console.log('   ✓ React learner users already exist, skipping');
  }

  const existingProfiles = await db.select({ id: profile.id }).from(profile).where(inArray(profile.id, profileIds));
  const existingProfileIds = new Set(existingProfiles.map((row) => row.id));
  const profilesToInsert: TNewProfile[] = REACT_LEARNERS.filter((learner) => !existingProfileIds.has(learner.id)).map(
    (learner) => ({
      id: learner.id,
      fullname: learner.fullname,
      username: learner.username,
      email: learner.email,
      avatarUrl: learner.avatarUrl,
      canAddCourse: false,
      isEmailVerified: true
    })
  );

  if (profilesToInsert.length > 0) {
    await db.insert(profile).values(profilesToInsert);
    console.log(`   ✓ Inserted ${profilesToInsert.length} React learner profile(s)`);
  } else {
    console.log('   ✓ React learner profiles already exist, skipping');
  }

  const existingAccounts = await db
    .select({ userId: account.userId })
    .from(account)
    .where(and(inArray(account.userId, profileIds), eq(account.providerId, 'credential')));
  const existingAccountUserIds = new Set(existingAccounts.map((row) => row.userId));
  const accountsToInsert = REACT_LEARNERS.filter((learner) => !existingAccountUserIds.has(learner.id)).map(
    (learner) => ({
      userId: learner.id,
      providerId: 'credential',
      accountId: learner.id,
      password: PASSWORD_HASH
    })
  );

  if (accountsToInsert.length > 0) {
    await db.insert(account).values(accountsToInsert);
    console.log(`   ✓ Inserted ${accountsToInsert.length} React learner account(s)`);
  } else {
    console.log('   ✓ React learner accounts already exist, skipping');
  }

  const orgMemberProfileIds = [...profileIds, existingStudentUserId];
  const existingOrgMembers = await db
    .select({ profileId: organizationmember.profileId })
    .from(organizationmember)
    .where(
      and(eq(organizationmember.organizationId, testOrgId), inArray(organizationmember.profileId, orgMemberProfileIds))
    );
  const existingOrgMemberIds = new Set(existingOrgMembers.map((row) => row.profileId));
  const orgMembersToInsert = profileIds
    .filter((profileId) => !existingOrgMemberIds.has(profileId))
    .map((profileId) => ({
      organizationId: testOrgId,
      roleId: 3,
      profileId,
      verified: false
    }));

  if (orgMembersToInsert.length > 0) {
    await db.insert(organizationmember).values(orgMembersToInsert);
    console.log(`   ✓ Inserted ${orgMembersToInsert.length} React learner org member(s)`);
  } else {
    console.log('   ✓ React learner org members already exist, skipping');
  }

  const desiredGroupMembers: TNewGroupmember[] = REACT_LEARNERS.map((learner) => ({
    id: learner.groupMemberId,
    groupId: reactGroupId,
    roleId: 3,
    profileId: learner.id,
    createdAt: isoDaysFromNow(now, -learner.progress.enrolledDaysAgo),
    certificateEarnedAt:
      learner.progress.certificateEarnedAtDaysAgo === null
        ? null
        : isoDaysFromNow(now, -learner.progress.certificateEarnedAtDaysAgo)
  }));

  const existingStudentMember = await db
    .select({ id: groupmember.id })
    .from(groupmember)
    .where(and(eq(groupmember.groupId, reactGroupId), eq(groupmember.profileId, existingStudentUserId)))
    .limit(1);

  if (existingStudentMember.length === 0) {
    desiredGroupMembers.push({
      id: EXISTING_STUDENT_GROUP_MEMBER_ID,
      groupId: reactGroupId,
      roleId: 3,
      profileId: existingStudentUserId,
      createdAt: isoDaysFromNow(now, -50),
      certificateEarnedAt: null
    });
  }

  const groupMemberIds = desiredGroupMembers.map((member) => member.id!).filter(Boolean);
  const existingGroupMembers = await db
    .select({ id: groupmember.id })
    .from(groupmember)
    .where(inArray(groupmember.id, groupMemberIds));
  const existingGroupMemberIds = new Set(existingGroupMembers.map((row) => row.id));
  const groupMembersToInsert = desiredGroupMembers.filter(
    (member) => member.id && !existingGroupMemberIds.has(member.id)
  );

  if (groupMembersToInsert.length > 0) {
    await db.insert(groupmember).values(groupMembersToInsert);
    console.log(`   ✓ Inserted ${groupMembersToInsert.length} React course groupmember(s)`);
  } else {
    console.log('   ✓ React course groupmembers already exist, skipping');
  }

  const memberLookup = new Map<string, string>();
  const allGroupMembers = await db
    .select({ id: groupmember.id, profileId: groupmember.profileId })
    .from(groupmember)
    .where(eq(groupmember.groupId, reactGroupId));

  for (const member of allGroupMembers) {
    if (member.profileId) {
      memberLookup.set(member.profileId, member.id);
    }
  }

  const progressPlans: Array<{ profileId: string; progress: LearnerProgressPlan }> = REACT_LEARNERS.map((learner) => ({
    profileId: learner.id,
    progress: learner.progress
  }));

  progressPlans.push({
    profileId: existingStudentUserId,
    progress: {
      lessonsCompleted: 2,
      exercisesCompleted: 2,
      certificateEarnedAtDaysAgo: null,
      lastLoginDaysAgo: 4,
      enrolledDaysAgo: 50
    }
  });

  const lessonCompletionsToInsert: Array<{
    lessonId: string;
    profileId: string;
    isComplete: boolean;
  }> = [];

  for (const plan of progressPlans) {
    for (const lessonId of lessonIdsForCount(plan.progress.lessonsCompleted)) {
      lessonCompletionsToInsert.push({
        lessonId,
        profileId: plan.profileId,
        isComplete: true
      });
    }
  }

  if (lessonCompletionsToInsert.length > 0) {
    const existingLessonCompletions = await db
      .select({
        lessonId: lessonCompletion.lessonId,
        profileId: lessonCompletion.profileId
      })
      .from(lessonCompletion)
      .where(
        inArray(
          lessonCompletion.profileId,
          progressPlans.map((plan) => plan.profileId)
        )
      );

    const existingLessonCompletionKeys = new Set(
      existingLessonCompletions.map((row) => `${row.profileId}-${row.lessonId}`)
    );
    const newLessonCompletions = lessonCompletionsToInsert.filter(
      (row) => !existingLessonCompletionKeys.has(`${row.profileId}-${row.lessonId}`)
    );

    if (newLessonCompletions.length > 0) {
      await db.insert(lessonCompletion).values(newLessonCompletions);
      console.log(`   ✓ Inserted ${newLessonCompletions.length} lesson completion(s)`);
    } else {
      console.log('   ✓ Lesson completions already exist, skipping');
    }
  }

  const submissionsToInsert: Array<{
    exerciseId: string;
    submittedBy: string;
    courseId: string;
    gradingState: string;
    overallStatus: string;
  }> = [];

  for (const plan of progressPlans) {
    const groupMemberId = memberLookup.get(plan.profileId);
    if (!groupMemberId) continue;

    for (const exerciseId of exerciseIdsForCount(plan.progress.exercisesCompleted)) {
      submissionsToInsert.push({
        exerciseId,
        submittedBy: groupMemberId,
        courseId: reactCourseId,
        gradingState: 'completed',
        overallStatus: 'completed'
      });
    }
  }

  if (submissionsToInsert.length > 0) {
    const existingSubmissions = await db
      .select({
        exerciseId: submission.exerciseId,
        submittedBy: submission.submittedBy
      })
      .from(submission)
      .where(eq(submission.courseId, reactCourseId));

    const existingSubmissionKeys = new Set(existingSubmissions.map((row) => `${row.submittedBy}-${row.exerciseId}`));
    const newSubmissions = submissionsToInsert.filter(
      (row) => !existingSubmissionKeys.has(`${row.submittedBy}-${row.exerciseId}`)
    );

    if (newSubmissions.length > 0) {
      await db.insert(submission).values(newSubmissions);
      console.log(`   ✓ Inserted ${newSubmissions.length} exercise submission(s)`);
    } else {
      console.log('   ✓ Exercise submissions already exist, skipping');
    }
  }

  const loginEventsToInsert: Array<{
    userId: string;
    loggedInAt: string;
    loggedInDate: string;
  }> = [];

  for (const plan of progressPlans) {
    if (plan.progress.lastLoginDaysAgo === null) continue;

    loginEventsToInsert.push({
      userId: plan.profileId,
      loggedInAt: isoDaysFromNow(now, -plan.progress.lastLoginDaysAgo),
      loggedInDate: isoDateFromNow(now, -plan.progress.lastLoginDaysAgo)
    });
  }

  if (loginEventsToInsert.length > 0) {
    const existingLoginEvents = await db
      .select({
        userId: analyticsLoginEvents.userId,
        loggedInDate: analyticsLoginEvents.loggedInDate
      })
      .from(analyticsLoginEvents)
      .where(
        inArray(
          analyticsLoginEvents.userId,
          loginEventsToInsert.map((row) => row.userId)
        )
      );

    const existingLoginKeys = new Set(existingLoginEvents.map((row) => `${row.userId}-${row.loggedInDate}`));
    const newLoginEvents = loginEventsToInsert.filter(
      (row) => !existingLoginKeys.has(`${row.userId}-${row.loggedInDate}`)
    );

    if (newLoginEvents.length > 0) {
      await db.insert(analyticsLoginEvents).values(newLoginEvents);
      console.log(`   ✓ Inserted ${newLoginEvents.length} analytics login event(s)`);
    } else {
      console.log('   ✓ Analytics login events already exist, skipping');
    }
  }
}
