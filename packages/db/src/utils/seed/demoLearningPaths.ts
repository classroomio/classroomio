import { and, db, eq, groupmember, inArray, learningPath, learningPathCourse, learningPathMember } from '@db/drizzle';
import type { TNewGroupmember, TNewLearningPath } from '@db/types';
import { ROLE } from '@cio/utils/constants/roles';

import { daysFromNow, demoCourseId, demoGroupId, demoId, type DemoCourse } from './demoCatalogTypes';
import { DEMO_CATALOG } from './demoCourses';
import { COURSE_IMAGES } from './demoMedia';
import { buildPeopleDirectory, type DemoAccounts } from './demoPeople';

type DemoPathMember = { personKey: string; enrolledDaysAgo: number };

type DemoPath = {
  index: number;
  name: string;
  slug: string;
  description: string;
  coverImage: string;
  status: TNewLearningPath['status'];
  sequentialUnlock: boolean;
  selfEnrollment: boolean;
  createdDaysAgo: number;
  courseKeys: string[];
  members: DemoPathMember[];
};

/**
 * student@test.com finished the first two courses of the Python path, is partway through Machine Learning, and joined
 * Docker through the path, so Docker shows as locked behind Machine Learning.
 */
const DEMO_PATHS: DemoPath[] = [
  {
    index: 1,
    name: 'From Python to Production ML',
    slug: 'python-to-production-ml',
    description:
      'Four courses in order: write clean Python, analyse data with pandas, build and evaluate models, then ship them in containers.',
    coverImage: COURSE_IMAGES.machineLearning,
    status: 'ACTIVE',
    sequentialUnlock: true,
    selfEnrollment: false,
    createdDaysAgo: 60,
    courseKeys: ['python-engineering', 'pandas', 'machine-learning', 'docker'],
    members: [
      { personKey: 'student', enrolledDaysAgo: 20 },
      { personKey: 'amara.okafor', enrolledDaysAgo: 40 },
      { personKey: 'kenji.watanabe', enrolledDaysAgo: 35 },
      { personKey: 'mei.lin', enrolledDaysAgo: 18 }
    ]
  },
  {
    index: 2,
    name: 'Product Leadership',
    slug: 'product-leadership',
    description:
      'Learn to find the right problems, design for real users, lead the team that builds the solution and protect your own time while doing it.',
    coverImage: COURSE_IMAGES.productManagement,
    status: 'ACTIVE',
    sequentialUnlock: false,
    selfEnrollment: true,
    createdDaysAgo: 45,
    courseKeys: ['product-management', 'ux-design', 'leading-teams', 'productivity'],
    members: [
      { personKey: 'priya.raman', enrolledDaysAgo: 30 },
      { personKey: 'aisha.bello', enrolledDaysAgo: 25 },
      { personKey: 'kwame.asante', enrolledDaysAgo: 14 },
      { personKey: 'hannah.becker', enrolledDaysAgo: 9 }
    ]
  },
  {
    index: 3,
    name: 'Frontend Foundations',
    slug: 'frontend-foundations',
    description: 'Structure web apps with MVC, build interfaces in React and design them so people can use them.',
    coverImage: COURSE_IMAGES.mvc,
    status: 'DRAFT',
    sequentialUnlock: true,
    selfEnrollment: true,
    createdDaysAgo: 5,
    courseKeys: ['mvc', 'react', 'ux-design'],
    members: []
  }
];

function demoPathId(path: DemoPath) {
  return demoId('6100', path.index);
}

export async function seedDemoLearningPaths({
  accounts,
  selectedOrganizationId
}: {
  accounts: DemoAccounts;
  selectedOrganizationId?: string;
}) {
  if (selectedOrganizationId && selectedOrganizationId !== accounts.udemyOrgId) return;

  const now = new Date();
  const personId = buildPeopleDirectory(accounts);
  const courseByKey = new Map(DEMO_CATALOG.map((demoCourse) => [demoCourse.key, demoCourse]));
  const coursesOf = (path: DemoPath) =>
    path.courseKeys.map((key) => {
      const demoCourse = courseByKey.get(key);
      if (!demoCourse) throw new Error(`Unknown demo course ${key}`);

      return demoCourse;
    });

  await db
    .insert(learningPath)
    .values(
      DEMO_PATHS.map((path) => ({
        id: demoPathId(path),
        organizationId: accounts.udemyOrgId,
        name: path.name,
        slug: path.slug,
        description: path.description,
        coverImage: path.coverImage,
        status: path.status,
        sequentialUnlock: path.sequentialUnlock,
        selfEnrollment: path.selfEnrollment,
        createdByProfileId: accounts.admin,
        createdAt: daysFromNow(now, -path.createdDaysAgo),
        updatedAt: daysFromNow(now, -path.createdDaysAgo)
      }))
    )
    .onConflictDoNothing();

  await db
    .insert(learningPathCourse)
    .values(
      DEMO_PATHS.flatMap((path) =>
        coursesOf(path).map((demoCourse, position) => ({
          pathId: demoPathId(path),
          courseId: demoCourseId(demoCourse),
          order: position + 1,
          addedAt: daysFromNow(now, -path.createdDaysAgo)
        }))
      )
    )
    .onConflictDoNothing();

  const memberRows = DEMO_PATHS.flatMap((path) =>
    path.members.map((member) => ({
      pathId: demoPathId(path),
      profileId: personId(member.personKey),
      roleId: ROLE.STUDENT,
      enrolledAt: daysFromNow(now, -member.enrolledDaysAgo)
    }))
  );
  const insertedMembers = memberRows.length
    ? await db
        .insert(learningPathMember)
        .values(memberRows)
        .onConflictDoNothing()
        .returning({ id: learningPathMember.id })
    : [];

  const enrollments = await enrollMembersInPathCourses(
    DEMO_PATHS.flatMap((path) => path.members.map((member) => ({ member, courses: coursesOf(path) }))),
    personId,
    now
  );

  console.log(
    `   ✓ Demo learning paths: ${DEMO_PATHS.length} path(s), ${insertedMembers.length} new member(s), ${enrollments} course enrolment(s) added through paths`
  );
}

/** Path members join every course in the path a minute after joining the path, unless they were already in it. */
async function enrollMembersInPathCourses(
  memberships: Array<{ member: DemoPathMember; courses: DemoCourse[] }>,
  personId: (key: string) => string,
  now: Date
) {
  const groupIds = [...new Set(memberships.flatMap(({ courses }) => courses.map(demoGroupId)))];
  if (groupIds.length === 0) return 0;

  const existing = await db
    .select({ groupId: groupmember.groupId, profileId: groupmember.profileId })
    .from(groupmember)
    .where(and(inArray(groupmember.groupId, groupIds), eq(groupmember.roleId, ROLE.STUDENT)));
  const existingKeys = new Set(existing.map((row) => `${row.groupId}-${row.profileId}`));

  const rows: TNewGroupmember[] = [];
  for (const { member, courses } of memberships) {
    const profileId = personId(member.personKey);
    const joinedAt = new Date(new Date(daysFromNow(now, -member.enrolledDaysAgo)).getTime() + 60 * 1000).toISOString();

    for (const demoCourse of courses) {
      const key = `${demoGroupId(demoCourse)}-${profileId}`;
      if (existingKeys.has(key)) continue;

      existingKeys.add(key);
      rows.push({ groupId: demoGroupId(demoCourse), profileId, roleId: ROLE.STUDENT, createdAt: joinedAt });
    }
  }

  if (rows.length > 0) {
    await db.insert(groupmember).values(rows);
  }

  return rows.length;
}
