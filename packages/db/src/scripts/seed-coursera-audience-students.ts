import 'dotenv/config';

import { and, db, eq, groupmember, inArray, organizationmember, profile, user } from '@db/drizzle';

import type { TNewGroupmember, TNewProfile } from '@db/types';

// ---------------------------------------------------------------------------
// Thirty extra students in the coursera-test org, enrolled across the two
// compliance courses in an uneven mix, so the audience table has enough rows
// to demonstrate selection, bulk actions and export against demo data rather
// than a real org.
//
// Names and addresses are fictional and the domain is reserved for examples,
// so screenshots taken here can be published without redaction.
//
// Idempotent: every row is keyed on a fixed id, and re-running only fills gaps.
// ---------------------------------------------------------------------------

const COURSERA_ORG_ID = '2b8f4a1c-6d3e-4b2a-9f7e-1c4d8a6e9b0f';

// Compliance courses, created by the `compliance` seed.
const HIPAA_GROUP_ID = '7e000000-1000-4000-8000-000000000001';
const SOC2_GROUP_ID = '7e000000-1000-4000-8000-000000000002';

const ROLE_STUDENT = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Reserved id prefixes, distinct from the `9f000001-` block that
 * `seed-coursera-audience-progress.ts` already uses for its groupmembers.
 */
const PROFILE_PREFIX = '9f000002';
const HIPAA_MEMBER_PREFIX = '9f000003';
const SOC2_MEMBER_PREFIX = '9f000004';

function seedId(prefix: string, index: number): string {
  return `${prefix}-0000-4000-8000-${String(index).padStart(12, '0')}`;
}

/** Given names and surnames kept deliberately varied, so the table does not
 *  read as one alphabetised block in a screenshot. */
const NAMES = [
  'Amara Okafor',
  'Ben Carter',
  'Chidi Nwosu',
  'Daniela Rossi',
  'Elena Silva',
  'Farid Haddad',
  'Grace Mensah',
  'Hana Sato',
  'Ibrahim Diallo',
  'Julia Kowalski',
  'Kwame Boateng',
  'Lena Fischer',
  'Mateo Alvarez',
  'Nadia Rahman',
  'Olek Nowak',
  'Priya Menon',
  'Quentin Dubois',
  'Rosa Delgado',
  'Samir Farouk',
  'Tara Lindqvist',
  'Ugo Eze',
  'Vera Petrova',
  'Wei Zhang',
  'Xiomara Reyes',
  'Yusuf Demir',
  'Zara Ahmed',
  'Adam Novak',
  'Bianca Ferreira',
  'Caleb Osei',
  'Dilara Yilmaz'
] as const;

/**
 * Who gets which course. A real roster is uneven, and the Enrollment column
 * only reads as real in a screenshot if it shows more than one value, so the
 * cycle mixes both-courses, one-course and not-enrolled rows. The last also
 * gives the "Enrollment: not enrolled in anything" filter something to return.
 */
const ENROLMENT_CYCLE = ['both', 'hipaa', 'both', 'soc2', 'none'] as const;

type EnrolmentPattern = (typeof ENROLMENT_CYCLE)[number];

type SeedStudent = {
  id: string;
  fullname: string;
  username: string;
  email: string;
  hipaaMemberId: string;
  soc2MemberId: string;
  enrolment: EnrolmentPattern;
  /** Spread so the roster is not one uniform join date. */
  joinedDaysAgo: number;
};

function buildStudents(): SeedStudent[] {
  return NAMES.map((fullname, index) => {
    const slug = fullname.toLowerCase().replace(/[^a-z]+/g, '-');

    return {
      id: seedId(PROFILE_PREFIX, index + 1),
      fullname,
      username: `${slug}-c${index + 1}`,
      email: `${slug}@coursera-test.demo`,
      hipaaMemberId: seedId(HIPAA_MEMBER_PREFIX, index + 1),
      soc2MemberId: seedId(SOC2_MEMBER_PREFIX, index + 1),
      enrolment: ENROLMENT_CYCLE[index % ENROLMENT_CYCLE.length],
      // 3 to 380 days, so the dormancy filters and the recent-joiner grace
      // both have rows on either side of every threshold.
      joinedDaysAgo: 3 + index * 13
    };
  });
}

async function seedUsers(students: SeedStudent[]) {
  const ids = students.map((student) => student.id);
  const existing = await db.select({ id: user.id }).from(user).where(inArray(user.id, ids));
  const existingIds = new Set(existing.map((row) => row.id));

  const toInsert = students
    .filter((student) => !existingIds.has(student.id))
    .map((student) => ({
      id: student.id,
      name: student.fullname,
      email: student.email,
      emailVerified: true,
      image: null,
      role: null,
      banned: false,
      isAnonymous: false
    }));

  if (toInsert.length === 0) {
    console.log('   ✓ Users already exist, skipping');
    return;
  }

  // `profile.id` references `user.id`, so the user rows have to land first.
  await db.insert(user).values(toInsert);
  console.log(`   ✓ Inserted ${toInsert.length} user(s)`);
}

async function seedProfiles(students: SeedStudent[]) {
  const ids = students.map((student) => student.id);
  const existing = await db.select({ id: profile.id }).from(profile).where(inArray(profile.id, ids));
  const existingIds = new Set(existing.map((row) => row.id));

  const toInsert: TNewProfile[] = students
    .filter((student) => !existingIds.has(student.id))
    .map((student) => ({
      id: student.id,
      fullname: student.fullname,
      username: student.username,
      email: student.email,
      canAddCourse: false,
      isEmailVerified: true
    }));

  if (toInsert.length === 0) {
    console.log('   ✓ Profiles already exist, skipping');
    return;
  }

  await db.insert(profile).values(toInsert);
  console.log(`   ✓ Inserted ${toInsert.length} profile(s)`);
}

async function seedOrgMembers(students: SeedStudent[]) {
  const ids = students.map((student) => student.id);
  const existing = await db
    .select({ profileId: organizationmember.profileId })
    .from(organizationmember)
    .where(and(eq(organizationmember.organizationId, COURSERA_ORG_ID), inArray(organizationmember.profileId, ids)));
  const existingIds = new Set(existing.map((row) => row.profileId));

  const now = Date.now();
  const toInsert = students
    .filter((student) => !existingIds.has(student.id))
    .map((student) => ({
      organizationId: COURSERA_ORG_ID,
      profileId: student.id,
      email: student.email,
      roleId: ROLE_STUDENT,
      verified: true,
      status: 'ACTIVE' as const,
      // Date Joined drives the recent-joiner grace, so it is set explicitly
      // rather than left to default to now.
      createdAt: new Date(now - student.joinedDaysAgo * DAY_MS).toISOString()
    }));

  if (toInsert.length === 0) {
    console.log('   ✓ Organization members already exist, skipping');
    return;
  }

  await db.insert(organizationmember).values(toInsert);
  console.log(`   ✓ Inserted ${toInsert.length} organization member(s)`);
}

/** The enrolment rows a student's pattern calls for. */
function desiredEnrolments(student: SeedStudent) {
  const rows: { id: string; groupId: string; profileId: string }[] = [];

  if (student.enrolment === 'both' || student.enrolment === 'hipaa') {
    rows.push({ id: student.hipaaMemberId, groupId: HIPAA_GROUP_ID, profileId: student.id });
  }

  if (student.enrolment === 'both' || student.enrolment === 'soc2') {
    rows.push({ id: student.soc2MemberId, groupId: SOC2_GROUP_ID, profileId: student.id });
  }

  return rows;
}

async function seedEnrolments(students: SeedStudent[]) {
  const desired = students.flatMap(desiredEnrolments);
  const desiredIds = new Set(desired.map((row) => row.id));

  // Every enrolment id this script owns, wanted or not. Re-running after the
  // mix changes has to withdraw the ones it no longer wants, otherwise the
  // roster only grows and the cycle above stops describing the data.
  const ownedIds = students.flatMap((student) => [student.hipaaMemberId, student.soc2MemberId]);
  const staleIds = ownedIds.filter((id) => !desiredIds.has(id));

  if (staleIds.length > 0) {
    const removed = await db
      .delete(groupmember)
      .where(inArray(groupmember.id, staleIds))
      .returning({ id: groupmember.id });

    if (removed.length > 0) {
      console.log(`   ✓ Withdrew ${removed.length} enrolment(s) no longer in the mix`);
    }
  }

  const existing = await db
    .select({ id: groupmember.id })
    .from(groupmember)
    .where(inArray(groupmember.id, [...desiredIds]));
  const existingIds = new Set(existing.map((row) => row.id));

  const toInsert: TNewGroupmember[] = desired
    .filter((row) => !existingIds.has(row.id))
    .map((row) => ({
      id: row.id,
      groupId: row.groupId,
      profileId: row.profileId,
      roleId: ROLE_STUDENT
    }));

  if (toInsert.length === 0) {
    console.log('   ✓ Enrolments already match the mix, skipping');
    return;
  }

  await db.insert(groupmember).values(toInsert);
  console.log(`   ✓ Inserted ${toInsert.length} enrolment(s)`);
}

async function main() {
  const students = buildStudents();

  console.log(`🌱 Seeding ${students.length} coursera-test students...`);
  await seedUsers(students);
  await seedProfiles(students);
  await seedOrgMembers(students);
  await seedEnrolments(students);
  const counts = students.reduce<Record<EnrolmentPattern, number>>(
    (totals, student) => {
      totals[student.enrolment] += 1;

      return totals;
    },
    { both: 0, hipaa: 0, soc2: 0, none: 0 }
  );

  console.log(
    `✅ Done: ${counts.both} in both courses, ${counts.hipaa} in HIPAA only, ${counts.soc2} in SOC 2 only, ${counts.none} not enrolled`
  );
}

main().catch((error) => {
  console.error('❌ Error seeding coursera-test students:', error);
  process.exit(1);
});
