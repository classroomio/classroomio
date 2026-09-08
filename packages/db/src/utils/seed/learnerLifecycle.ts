import {
  analyticsLoginEvents,
  analyticsPageEvent,
  and,
  db,
  eq,
  groupmember,
  inArray,
  lessonCompletion,
  organizationmember,
  profile,
  user
} from '@db/drizzle';

import { ROLE } from '@cio/utils/constants';
import type { TNewGroupmember, TNewProfile } from '@db/types';

interface SeedLearnerLifecycleArgs {
  testOrgId: string;
  reactGroupId: string;
  reactCourseId: string;
}

/**
 * Enough learners to make the dormancy views, the bulk bar and the roster
 * export show something. The default seed only creates a handful, all recently
 * created with no login history, so every "inactive 90+ days" view came back
 * empty and the export was two rows.
 */
const LEARNER_COUNT = 140;

/** Deterministic PRNG so re-seeding produces the same roster. */
function mulberry(seed: number): () => number {
  let state = seed;

  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST_NAMES = [
  'Amara',
  'Chidi',
  'Fatima',
  'Ravi',
  'Ingrid',
  'Tomas',
  'Mei',
  'Olek',
  'Rosa',
  'Yusuf',
  'Elena',
  'Kwame',
  'Sanne',
  'Diego',
  'Priya',
  'Lars',
  'Nadia',
  'Hiro',
  'Aoife',
  'Bilal'
];

const LAST_NAMES = [
  'Okafor',
  'Nakamura',
  'Silva',
  'Kowalski',
  'Haddad',
  'Nguyen',
  'Andersson',
  'Mbeki',
  'Rossi',
  'Fernandez',
  'Novak',
  'Ahmed',
  'Jensen',
  'Kaur',
  'Moreau',
  'Costa'
];

/**
 * The shape of a seeded roster, chosen so each saved view returns a non-trivial
 * number of rows and no view is a subset of another by accident.
 *
 * `lastLoginDaysAgo: null` means never logged in. `joinedDaysAgo` is always
 * older than the staleness window it is meant to match, otherwise the
 * recent-joiner guard would (correctly) filter the learner out and the view
 * would look broken.
 */
type Cohort = {
  label: string;
  share: number;
  joinedDaysAgo: [number, number];
  lastLoginDaysAgo: [number, number] | null;
  lastActiveDaysAgo: [number, number] | null;
  lessonsCompleted: [number, number];
  status: 'ACTIVE' | 'DEACTIVATED' | 'ARCHIVED';
  enrolled: boolean;
};

const COHORTS: Cohort[] = [
  {
    label: 'never logged in',
    share: 0.18,
    joinedDaysAgo: [40, 400],
    lastLoginDaysAgo: null,
    lastActiveDaysAgo: null,
    lessonsCompleted: [0, 0],
    status: 'ACTIVE',
    enrolled: true
  },
  {
    label: 'dormant 180+ days',
    share: 0.14,
    joinedDaysAgo: [250, 500],
    lastLoginDaysAgo: [190, 240],
    lastActiveDaysAgo: [185, 235],
    lessonsCompleted: [0, 1],
    status: 'ACTIVE',
    enrolled: true
  },
  {
    label: 'dormant 90-180 days',
    share: 0.16,
    joinedDaysAgo: [150, 300],
    lastLoginDaysAgo: [95, 170],
    lastActiveDaysAgo: [92, 165],
    lessonsCompleted: [0, 2],
    status: 'ACTIVE',
    enrolled: true
  },
  {
    label: 'enrolled, never started',
    share: 0.1,
    joinedDaysAgo: [30, 200],
    lastLoginDaysAgo: [20, 80],
    lastActiveDaysAgo: [20, 80],
    lessonsCompleted: [0, 0],
    status: 'ACTIVE',
    enrolled: true
  },
  {
    label: 'active learners',
    share: 0.22,
    joinedDaysAgo: [10, 300],
    lastLoginDaysAgo: [0, 20],
    lastActiveDaysAgo: [0, 15],
    lessonsCompleted: [1, 3],
    status: 'ACTIVE',
    enrolled: true
  },
  {
    label: 'not enrolled',
    share: 0.08,
    joinedDaysAgo: [15, 120],
    lastLoginDaysAgo: [5, 60],
    lastActiveDaysAgo: [5, 60],
    lessonsCompleted: [0, 0],
    status: 'ACTIVE',
    enrolled: false
  },
  {
    label: 'deactivated',
    share: 0.06,
    joinedDaysAgo: [100, 400],
    lastLoginDaysAgo: [60, 200],
    lastActiveDaysAgo: [60, 200],
    lessonsCompleted: [0, 2],
    status: 'DEACTIVATED',
    enrolled: true
  },
  {
    label: 'archived',
    share: 0.06,
    joinedDaysAgo: [200, 500],
    lastLoginDaysAgo: [150, 300],
    lastActiveDaysAgo: [150, 300],
    lessonsCompleted: [0, 1],
    status: 'ARCHIVED',
    enrolled: true
  }
];

const REACT_LESSON_IDS = [
  '6f2d8142-0903-425c-8534-f5105b624752',
  '0a39ab2f-9451-4a90-902c-3030bf965637',
  '80b79665-733b-41bf-9853-34fd8ab50496'
] as const;

type SeededLearner = {
  id: string;
  groupMemberId: string;
  fullname: string;
  username: string;
  email: string;
  cohort: Cohort;
  joinedDaysAgo: number;
  lastLoginDaysAgo: number | null;
  lastActiveDaysAgo: number | null;
  lessonsCompleted: number;
};

/** Stable UUIDs in a reserved range, so the roster is idempotent across runs. */
function learnerId(index: number): string {
  const suffix = index.toString(16).padStart(12, '0');

  return `9c000000-a000-4000-8000-${suffix}`;
}

function groupMemberId(index: number): string {
  const suffix = index.toString(16).padStart(12, '0');

  return `9c000001-a000-4000-8000-${suffix}`;
}

function daysAgoIso(days: number, now: Date): string {
  return new Date(now.getTime() - days * 86_400_000).toISOString();
}

function buildLearners(now: Date): SeededLearner[] {
  const random = mulberry(20260908);
  const learners: SeededLearner[] = [];

  const pickInt = ([min, max]: [number, number]) => min + Math.floor(random() * (max - min + 1));

  // Expand the cohort shares into a flat list, so the counts are proportional
  // rather than random per learner.
  const plan: Cohort[] = [];
  for (const cohort of COHORTS) {
    const count = Math.max(1, Math.round(cohort.share * LEARNER_COUNT));
    for (let i = 0; i < count; i += 1) plan.push(cohort);
  }

  for (let index = 0; index < plan.length; index += 1) {
    const cohort = plan[index];
    const first = FIRST_NAMES[Math.floor(random() * FIRST_NAMES.length)];
    const last = LAST_NAMES[Math.floor(random() * LAST_NAMES.length)];
    const ordinal = index + 1;

    learners.push({
      id: learnerId(ordinal),
      groupMemberId: groupMemberId(ordinal),
      fullname: `${first} ${last}`,
      username: `${first.toLowerCase()}.${last.toLowerCase()}.${ordinal}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}.${ordinal}@udemy-test.demo`,
      cohort,
      joinedDaysAgo: pickInt(cohort.joinedDaysAgo),
      lastLoginDaysAgo: cohort.lastLoginDaysAgo ? pickInt(cohort.lastLoginDaysAgo) : null,
      lastActiveDaysAgo: cohort.lastActiveDaysAgo ? pickInt(cohort.lastActiveDaysAgo) : null,
      lessonsCompleted: pickInt(cohort.lessonsCompleted)
    });
  }

  return learners;
}

export async function seedLearnerLifecycle({ testOrgId, reactGroupId, reactCourseId }: SeedLearnerLifecycleArgs) {
  const now = new Date();
  const learners = buildLearners(now);
  const learnerIds = learners.map((learner) => learner.id);

  const existingUsers = await db.select({ id: user.id }).from(user).where(inArray(user.id, learnerIds));
  const existingUserIds = new Set(existingUsers.map((row) => row.id));
  const usersToInsert = learners
    .filter((learner) => !existingUserIds.has(learner.id))
    .map((learner) => ({
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
    console.log(`   ✓ Inserted ${usersToInsert.length} lifecycle learner user(s)`);
  }

  const existingProfiles = await db.select({ id: profile.id }).from(profile).where(inArray(profile.id, learnerIds));
  const existingProfileIds = new Set(existingProfiles.map((row) => row.id));
  const profilesToInsert: TNewProfile[] = learners
    .filter((learner) => !existingProfileIds.has(learner.id))
    .map((learner) => ({
      id: learner.id,
      fullname: learner.fullname,
      username: learner.username,
      email: learner.email,
      canAddCourse: false,
      isEmailVerified: true
    }));

  if (profilesToInsert.length > 0) {
    await db.insert(profile).values(profilesToInsert);
    console.log(`   ✓ Inserted ${profilesToInsert.length} lifecycle learner profile(s)`);
  }

  // Org membership carries the lifecycle state the audience page filters on.
  const existingMembers = await db
    .select({ profileId: organizationmember.profileId })
    .from(organizationmember)
    .where(and(eq(organizationmember.organizationId, testOrgId), inArray(organizationmember.profileId, learnerIds)));
  const existingMemberProfileIds = new Set(existingMembers.map((row) => row.profileId));
  const membersToInsert = learners
    .filter((learner) => !existingMemberProfileIds.has(learner.id))
    .map((learner) => ({
      organizationId: testOrgId,
      profileId: learner.id,
      email: learner.email,
      roleId: ROLE.STUDENT,
      verified: true,
      status: learner.cohort.status,
      statusChangedAt: learner.cohort.status === 'ACTIVE' ? null : daysAgoIso(5, now),
      lastActiveAt: learner.lastActiveDaysAgo == null ? null : daysAgoIso(learner.lastActiveDaysAgo, now),
      createdAt: daysAgoIso(learner.joinedDaysAgo, now)
    }));

  if (membersToInsert.length > 0) {
    await db.insert(organizationmember).values(membersToInsert);
    console.log(`   ✓ Inserted ${membersToInsert.length} lifecycle organization member(s)`);
  }

  const enrolled = learners.filter((learner) => learner.cohort.enrolled);
  const existingGroupMembers = await db
    .select({ id: groupmember.id })
    .from(groupmember)
    .where(
      inArray(
        groupmember.id,
        enrolled.map((learner) => learner.groupMemberId)
      )
    );
  const existingGroupMemberIds = new Set(existingGroupMembers.map((row) => row.id));
  const groupMembersToInsert: TNewGroupmember[] = enrolled
    .filter((learner) => !existingGroupMemberIds.has(learner.groupMemberId))
    .map((learner) => ({
      id: learner.groupMemberId,
      groupId: reactGroupId,
      profileId: learner.id,
      roleId: ROLE.STUDENT
    }));

  if (groupMembersToInsert.length > 0) {
    await db.insert(groupmember).values(groupMembersToInsert);
    console.log(`   ✓ Enrolled ${groupMembersToInsert.length} lifecycle learner(s) in the React course`);
  }

  // Login events are what the "no login in N days" filter reads, via a lateral
  // MAX(logged_in_at). The unique constraint is (user_id, logged_in_date), so
  // each learner gets one row per distinct day.
  const loginRows = learners
    .filter((learner) => learner.lastLoginDaysAgo != null)
    .flatMap((learner) => {
      const days = [learner.lastLoginDaysAgo!, learner.lastLoginDaysAgo! + 9, learner.lastLoginDaysAgo! + 31];

      return days.map((daysAgo) => {
        const at = new Date(now.getTime() - daysAgo * 86_400_000);

        return {
          userId: learner.id,
          loggedInAt: at.toISOString(),
          loggedInDate: at.toISOString().slice(0, 10)
        };
      });
    });

  if (loginRows.length > 0) {
    await db.insert(analyticsLoginEvents).values(loginRows).onConflictDoNothing();
    console.log(`   ✓ Inserted ${loginRows.length} login event(s)`);
  }

  // Page events keep the nightly reconcile consistent with `last_active_at`,
  // so the column is not silently overwritten the first time the job runs.
  const pageEventRows = learners
    .filter((learner) => learner.lastActiveDaysAgo != null)
    .flatMap((learner) =>
      [learner.lastActiveDaysAgo!, learner.lastActiveDaysAgo! + 4].map((daysAgo, offset) => ({
        occurredAt: daysAgoIso(daysAgo, now),
        orgId: testOrgId,
        sessionId: `seed-${learner.id}-${offset}`,
        userId: learner.id,
        eventType: 'course_page_view',
        courseId: reactCourseId,
        path: `/courses/${reactCourseId}`,
        deviceType: 'desktop',
        locale: 'en'
      }))
    );

  if (pageEventRows.length > 0) {
    await db.insert(analyticsPageEvent).values(pageEventRows);
    console.log(`   ✓ Inserted ${pageEventRows.length} page event(s)`);
  }

  // Lesson completions drive the progress column and the completion filter.
  const completionRows = learners.flatMap((learner) =>
    REACT_LESSON_IDS.slice(0, learner.lessonsCompleted).map((lessonId) => ({
      lessonId,
      profileId: learner.id,
      isComplete: true,
      createdAt: daysAgoIso(learner.lastActiveDaysAgo ?? learner.joinedDaysAgo, now),
      updatedAt: daysAgoIso(learner.lastActiveDaysAgo ?? learner.joinedDaysAgo, now)
    }))
  );

  if (completionRows.length > 0) {
    const existingCompletions = await db
      .select({ profileId: lessonCompletion.profileId })
      .from(lessonCompletion)
      .where(inArray(lessonCompletion.profileId, learnerIds));

    if (existingCompletions.length === 0) {
      await db.insert(lessonCompletion).values(completionRows);
      console.log(`   ✓ Inserted ${completionRows.length} lesson completion(s)`);
    }
  }

  const byCohort = new Map<string, number>();
  for (const learner of learners) {
    byCohort.set(learner.cohort.label, (byCohort.get(learner.cohort.label) ?? 0) + 1);
  }

  console.log(`   ✓ Learner lifecycle roster: ${learners.length} learners`);
  for (const [label, count] of byCohort) {
    console.log(`      · ${label}: ${count}`);
  }
}
