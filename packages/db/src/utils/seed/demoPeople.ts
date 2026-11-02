import { account, and, db, eq, inArray, isNull, organizationmember, profile, user } from '@db/drizzle';

import { ROLE } from '@cio/utils/constants/roles';
import type { TNewProfile } from '@db/types';

import { LEARNER_PROFILES } from './compliance';
import { daysFromNow } from './demoCatalogTypes';

export type DemoAccounts = {
  udemyOrgId: string;
  courseraOrgId: string;
  skillshareOrgId: string;
  admin: string;
  student: string;
  enterpriseAdmin: string;
  enterpriseStudent: string;
  earlyAdopterAdmin: string;
  earlyAdopterStudent: string;
};

export type DemoPerson = {
  key: string;
  id: string;
  fullname: string;
  email: string;
  avatarUrl: string;
  headline: string;
};

const PASSWORD_HASH = '$2a$10$dgxySj.k12gDKhLx7X4x6./J.Nzhz7WQrwh5lkjLKwIwWW4o5GJcW';

function avatar(seed: string) {
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}`;
}

function person(index: number, key: string, fullname: string, headline: string): DemoPerson {
  return {
    key,
    id: `5d000000-9000-4000-8000-${String(index).padStart(12, '0')}`,
    fullname,
    email: `${key}@udemy-test.demo`,
    avatarUrl: avatar(key),
    headline
  };
}

export const DEMO_TUTORS: DemoPerson[] = [
  person(101, 'nkechi.eze', 'Nkechi Eze', 'Data scientist and instructor'),
  person(102, 'tom.hargreaves', 'Tom Hargreaves', 'Engineering director and leadership coach'),
  person(103, 'camille.laurent', 'Camille Laurent', 'Product designer and brand strategist')
];

export const DEMO_LEARNERS: DemoPerson[] = [
  person(1, 'amara.okafor', 'Amara Okafor', 'Frontend developer in Lagos'),
  person(2, 'kenji.watanabe', 'Kenji Watanabe', 'Backend engineer'),
  person(3, 'priya.raman', 'Priya Raman', 'Product analyst'),
  person(4, 'lucas.oliveira', 'Lucas Oliveira', 'Full-stack developer'),
  person(5, 'fatima.alsayed', 'Fatima Al-Sayed', 'DevOps engineer'),
  person(6, 'mateo.garcia', 'Mateo García', 'Junior data analyst'),
  person(7, 'hannah.becker', 'Hannah Becker', 'UX researcher'),
  person(8, 'wei.zhang', 'Wei Zhang', 'Machine learning engineer'),
  person(9, 'aisha.bello', 'Aisha Bello', 'Product manager'),
  person(10, 'tomas.rivera', 'Tomás Rivera', 'Engineering manager'),
  person(11, 'ingrid.larsen', 'Ingrid Larsen', 'Marketing lead'),
  person(12, 'daniel.mensah', 'Daniel Mensah', 'Security analyst'),
  person(13, 'sofia.rossi', 'Sofia Rossi', 'Visual designer'),
  person(14, 'arjun.mehta', 'Arjun Mehta', 'Python developer'),
  person(15, 'chloe.dubois', 'Chloé Dubois', 'Content strategist'),
  person(16, 'yusuf.demir', 'Yusuf Demir', 'QA engineer'),
  person(17, 'mei.lin', 'Mei Lin', 'Data engineer'),
  person(18, 'kwame.asante', 'Kwame Asante', 'Startup founder'),
  person(19, 'olga.petrova', 'Olga Petrova', 'Site reliability engineer'),
  person(20, 'rafael.costa', 'Rafael Costa', 'Growth marketer'),
  person(21, 'nadia.haddad', 'Nadia Haddad', 'Compliance officer'),
  person(22, 'samuel.adeyemi', 'Samuel Adeyemi', 'Mobile developer'),
  person(23, 'emily.carter', 'Emily Carter', 'Team lead'),
  person(24, 'jaewon.park', 'Jae-won Park', 'Data scientist'),
  person(25, 'leila.rahimi', 'Leila Rahimi', 'Product designer'),
  person(26, 'marcus.johnson', 'Marcus Johnson', 'Customer success manager'),
  person(27, 'zanele.dlamini', 'Zanele Dlamini', 'Operations analyst'),
  person(28, 'diego.herrera', 'Diego Herrera', 'Software engineer')
];

/** Pool learners who also belong to the Skillshare Test org. */
export const SKILLSHARE_LEARNER_KEYS = [
  'kwame.asante',
  'sofia.rossi',
  'chloe.dubois',
  'rafael.costa',
  'leila.rahimi',
  'ingrid.larsen',
  'aisha.bello',
  'marcus.johnson'
];

/**
 * Resolves the author keys used across the demo seeds to profile ids.
 * Pool and compliance learners use their username as key.
 */
export function buildPeopleDirectory(accounts: DemoAccounts) {
  const directory = new Map<string, string>([
    ['admin', accounts.admin],
    ['student', accounts.student],
    ['enterpriseAdmin', accounts.enterpriseAdmin],
    ['enterpriseStudent', accounts.enterpriseStudent],
    ['earlyAdopterAdmin', accounts.earlyAdopterAdmin],
    ['earlyAdopterStudent', accounts.earlyAdopterStudent]
  ]);

  for (const demoPerson of [...DEMO_TUTORS, ...DEMO_LEARNERS]) {
    directory.set(demoPerson.key, demoPerson.id);
  }

  for (const learner of LEARNER_PROFILES) {
    directory.set(learner.username, learner.id);
  }

  return (key: string) => {
    const profileId = directory.get(key);
    if (!profileId) throw new Error(`Unknown demo person ${key}`);

    return profileId;
  };
}

const DEMO_ACCOUNT_AVATARS: Array<[keyof DemoAccounts, string]> = [
  ['admin', 'elon.gates'],
  ['student', 'john.doe'],
  ['enterpriseAdmin', 'enterprise.admin'],
  ['enterpriseStudent', 'enterprise.student'],
  ['earlyAdopterAdmin', 'early.adopter.admin'],
  ['earlyAdopterStudent', 'early.adopter.student']
];

export async function seedDemoPeople({
  accounts,
  selectedOrganizationId
}: {
  accounts: DemoAccounts;
  selectedOrganizationId?: string;
}) {
  const now = new Date();
  const memberships = [
    ...DEMO_TUTORS.map((tutor, index) => ({
      organizationId: accounts.udemyOrgId,
      profileId: tutor.id,
      roleId: ROLE.TUTOR,
      joinedDaysAgo: 400 - index * 30
    })),
    ...DEMO_LEARNERS.map((learner, index) => ({
      organizationId: accounts.udemyOrgId,
      profileId: learner.id,
      roleId: ROLE.STUDENT,
      joinedDaysAgo: 30 + ((index * 37) % 240)
    })),
    ...DEMO_LEARNERS.filter((learner) => SKILLSHARE_LEARNER_KEYS.includes(learner.key)).map((learner, index) => ({
      organizationId: accounts.skillshareOrgId,
      profileId: learner.id,
      roleId: ROLE.STUDENT,
      joinedDaysAgo: 20 + index * 11
    }))
  ].filter((membership) => !selectedOrganizationId || membership.organizationId === selectedOrganizationId);

  const memberProfileIds = new Set(memberships.map((membership) => membership.profileId));
  const people = [...DEMO_TUTORS, ...DEMO_LEARNERS].filter((demoPerson) => memberProfileIds.has(demoPerson.id));
  const peopleIds = people.map((demoPerson) => demoPerson.id);

  for (const [accountKey, avatarSeed] of DEMO_ACCOUNT_AVATARS) {
    await db
      .update(profile)
      .set({ avatarUrl: avatar(avatarSeed) })
      .where(and(eq(profile.id, accounts[accountKey]), isNull(profile.avatarUrl)));
  }

  if (peopleIds.length === 0) return;

  const existingUsers = await db.select({ id: user.id }).from(user).where(inArray(user.id, peopleIds));
  const existingUserIds = new Set(existingUsers.map((row) => row.id));
  const usersToInsert = people
    .filter((demoPerson) => !existingUserIds.has(demoPerson.id))
    .map((demoPerson) => ({
      id: demoPerson.id,
      name: demoPerson.fullname,
      email: demoPerson.email,
      emailVerified: true,
      image: demoPerson.avatarUrl,
      role: null,
      banned: false,
      isAnonymous: false
    }));

  if (usersToInsert.length > 0) {
    await db.insert(user).values(usersToInsert);
  }

  const existingProfiles = await db.select({ id: profile.id }).from(profile).where(inArray(profile.id, peopleIds));
  const existingProfileIds = new Set(existingProfiles.map((row) => row.id));
  const profilesToInsert: TNewProfile[] = people
    .filter((demoPerson) => !existingProfileIds.has(demoPerson.id))
    .map((demoPerson) => ({
      id: demoPerson.id,
      fullname: demoPerson.fullname,
      username: demoPerson.key,
      email: demoPerson.email,
      avatarUrl: demoPerson.avatarUrl,
      jobRole: demoPerson.headline,
      canAddCourse: DEMO_TUTORS.includes(demoPerson),
      isEmailVerified: true
    }));

  if (profilesToInsert.length > 0) {
    await db.insert(profile).values(profilesToInsert);
  }

  const existingAccounts = await db
    .select({ userId: account.userId })
    .from(account)
    .where(and(inArray(account.userId, peopleIds), eq(account.providerId, 'credential')));
  const existingAccountIds = new Set(existingAccounts.map((row) => row.userId));
  const accountsToInsert = people
    .filter((demoPerson) => !existingAccountIds.has(demoPerson.id))
    .map((demoPerson) => ({
      userId: demoPerson.id,
      providerId: 'credential',
      accountId: demoPerson.id,
      password: PASSWORD_HASH
    }));

  if (accountsToInsert.length > 0) {
    await db.insert(account).values(accountsToInsert);
  }

  const existingMembers = await db
    .select({ organizationId: organizationmember.organizationId, profileId: organizationmember.profileId })
    .from(organizationmember)
    .where(inArray(organizationmember.profileId, peopleIds));
  const existingMemberKeys = new Set(existingMembers.map((row) => `${row.organizationId}-${row.profileId}`));
  const membersToInsert = memberships
    .filter((membership) => !existingMemberKeys.has(`${membership.organizationId}-${membership.profileId}`))
    .map((membership) => ({
      organizationId: membership.organizationId,
      profileId: membership.profileId,
      roleId: membership.roleId,
      verified: true,
      status: 'ACTIVE' as const,
      lastActiveAt: daysFromNow(now, -(membership.joinedDaysAgo % 6)),
      createdAt: daysFromNow(now, -membership.joinedDaysAgo)
    }));

  if (membersToInsert.length > 0) {
    await db.insert(organizationmember).values(membersToInsert);
  }

  console.log(
    `   ✓ Demo people: ${usersToInsert.length} new user(s), ${membersToInsert.length} new org membership(s) across ${people.length} people`
  );
}
