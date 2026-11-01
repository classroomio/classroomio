import {
  cohort,
  cohortCourse,
  cohortGoal,
  cohortGoalAssignment,
  cohortMember,
  cohortNewsfeed,
  cohortNewsfeedComment,
  db,
  inArray
} from '@db/drizzle';
import { ROLE } from '@cio/utils/constants/roles';

import { daysFromNow, demoCourseId, demoId } from './demoCatalogTypes';
import { DEMO_CATALOG } from './demoCourses';
import { COURSE_IMAGES } from './demoMedia';
import { buildPeopleDirectory, type DemoAccounts } from './demoPeople';

type AssignmentStatus = 'not_started' | 'in_progress' | 'completed' | 'at_risk' | 'overdue' | 'waived';

type DemoGoal = {
  title: string;
  description: string;
  type: 'complete_all' | 'n_of_m' | 'score';
  courseKeys: string[];
  requiredCount: number;
  scoreThreshold?: number;
  dueInDays: number;
  /** Assignment status per member key; members not listed get `defaultStatus`. */
  statuses: Record<string, { status: AssignmentStatus; completed: number }>;
  defaultStatus: { status: AssignmentStatus; completed: number };
};

type DemoCohort = {
  index: number;
  name: string;
  description: string;
  coverImage: string;
  createdDaysAgo: number;
  tutorKey: string;
  memberKeys: string[];
  courseKeys: string[];
  goals: DemoGoal[];
  posts: Array<{
    author: string;
    content: string;
    hoursAgo: number;
    pinned?: boolean;
    comments: Array<{ author: string; text: string }>;
  }>;
};

const COHORTS: DemoCohort[] = [
  {
    index: 1,
    name: 'Data Analytics Track',
    description:
      'A twelve-week track for analysts moving into data science: pandas, solid Python habits and a first machine learning project, with weekly check-ins.',
    coverImage: COURSE_IMAGES.dataCohort,
    createdDaysAgo: 75,
    tutorKey: 'nkechi.eze',
    memberKeys: [
      'student',
      'arjun.mehta',
      'mei.lin',
      'priya.raman',
      'wei.zhang',
      'jaewon.park',
      'mateo.garcia',
      'amara.okafor'
    ],
    courseKeys: ['pandas', 'python-engineering', 'machine-learning'],
    goals: [
      {
        title: 'Finish Data Science with Python and Pandas',
        description: 'Complete every lesson and exercise in the pandas course.',
        type: 'complete_all',
        courseKeys: ['pandas'],
        requiredCount: 1,
        dueInDays: -5,
        statuses: {
          student: { status: 'completed', completed: 1 },
          'mateo.garcia': { status: 'overdue', completed: 0 }
        },
        defaultStatus: { status: 'completed', completed: 1 }
      },
      {
        title: 'Complete all three track courses',
        description: 'Finish pandas, Python engineering and machine learning before graduation.',
        type: 'n_of_m',
        courseKeys: ['pandas', 'python-engineering', 'machine-learning'],
        requiredCount: 3,
        dueInDays: 12,
        statuses: {
          student: { status: 'in_progress', completed: 2 },
          'arjun.mehta': { status: 'in_progress', completed: 2 },
          'mateo.garcia': { status: 'at_risk', completed: 0 }
        },
        defaultStatus: { status: 'in_progress', completed: 1 }
      },
      {
        title: 'Score 80% on the machine learning concepts check',
        description: 'Show you are ready for the classifier project.',
        type: 'score',
        courseKeys: ['machine-learning'],
        requiredCount: 1,
        scoreThreshold: 80,
        dueInDays: 20,
        statuses: { 'wei.zhang': { status: 'completed', completed: 1 } },
        defaultStatus: { status: 'not_started', completed: 0 }
      }
    ],
    posts: [
      {
        author: 'nkechi.eze',
        content:
          '<p>Week 9 check-in: most of you have finished pandas. This week, start the machine learning course and post one dataset you would like to classify.</p>',
        hoursAgo: 28,
        pinned: true,
        comments: [
          { author: 'student', text: 'Planning to use our support tickets, about 2,000 labelled ones.' },
          { author: 'wei.zhang', text: 'Product reviews from our app store listing.' },
          { author: 'nkechi.eze', text: 'Both great choices. Check the class balance first.' }
        ]
      },
      {
        author: 'priya.raman',
        content:
          '<p>Anyone want to pair on the classifier project on Saturday morning? I will set up a video call.</p>',
        hoursAgo: 9,
        comments: [
          { author: 'mei.lin', text: 'Count me in.' },
          { author: 'student', text: 'Yes please, 10:00 UTC works for me.' }
        ]
      }
    ]
  },
  {
    index: 2,
    name: 'Engineering Leadership Circle',
    description:
      'A peer group for new engineering managers and tech leads. Meet fortnightly, work through the leadership and product courses together and share what is working.',
    coverImage: COURSE_IMAGES.leadershipCohort,
    createdDaysAgo: 40,
    tutorKey: 'tom.hargreaves',
    memberKeys: ['student', 'tomas.rivera', 'emily.carter', 'kwame.asante', 'aisha.bello', 'marcus.johnson'],
    courseKeys: ['leading-teams', 'product-management', 'productivity'],
    goals: [
      {
        title: 'Complete Leading Engineering Teams',
        description: 'Attend or watch every session and submit the one-to-one reflection.',
        type: 'complete_all',
        courseKeys: ['leading-teams'],
        requiredCount: 1,
        dueInDays: 21,
        statuses: { 'tomas.rivera': { status: 'in_progress', completed: 0 } },
        defaultStatus: { status: 'in_progress', completed: 0 }
      },
      {
        title: 'Finish two of the three circle courses',
        description: 'Pick the two courses most relevant to your role this quarter.',
        type: 'n_of_m',
        courseKeys: ['leading-teams', 'product-management', 'productivity'],
        requiredCount: 2,
        dueInDays: -2,
        statuses: {
          'emily.carter': { status: 'completed', completed: 2 },
          'kwame.asante': { status: 'waived', completed: 0 }
        },
        defaultStatus: { status: 'overdue', completed: 0 }
      }
    ],
    posts: [
      {
        author: 'tom.hargreaves',
        content:
          '<p>Next circle meeting is Wednesday. Topic: the hardest piece of feedback you gave this month and how it landed.</p>',
        hoursAgo: 20,
        pinned: true,
        comments: [
          { author: 'tomas.rivera', text: 'I have a good one about a missed deadline.' },
          { author: 'emily.carter', text: 'Mine went badly, so I am keen to hear how others handle it.' }
        ]
      }
    ]
  }
];

export async function seedDemoCohorts({
  accounts,
  selectedOrganizationId
}: {
  accounts: DemoAccounts;
  selectedOrganizationId?: string;
}) {
  if (selectedOrganizationId && selectedOrganizationId !== accounts.udemyOrgId) return;

  const now = new Date();
  const personId = buildPeopleDirectory(accounts);
  const courseIdByKey = new Map(DEMO_CATALOG.map((demoCourse) => [demoCourse.key, demoCourseId(demoCourse)]));
  const cohortId = (demoCohort: DemoCohort) => demoId('b000', demoCohort.index);

  const existingCohorts = await db
    .select({ id: cohort.id })
    .from(cohort)
    .where(inArray(cohort.id, COHORTS.map(cohortId)));
  const existingCohortIds = new Set(existingCohorts.map((row) => row.id));
  const cohortsToInsert = COHORTS.filter((demoCohort) => !existingCohortIds.has(cohortId(demoCohort))).map(
    (demoCohort) => ({
      id: cohortId(demoCohort),
      organizationId: accounts.udemyOrgId,
      name: demoCohort.name,
      description: demoCohort.description,
      coverImage: demoCohort.coverImage,
      status: 'ACTIVE' as const,
      createdByProfileId: accounts.admin,
      createdAt: daysFromNow(now, -demoCohort.createdDaysAgo)
    })
  );

  if (cohortsToInsert.length > 0) {
    await db.insert(cohort).values(cohortsToInsert);
  }

  await db
    .insert(cohortCourse)
    .values(
      COHORTS.flatMap((demoCohort) =>
        demoCohort.courseKeys.map((courseKey) => ({
          cohortId: cohortId(demoCohort),
          courseId: courseIdByKey.get(courseKey)!,
          addedAt: daysFromNow(now, -demoCohort.createdDaysAgo)
        }))
      )
    )
    .onConflictDoNothing();

  await db
    .insert(cohortMember)
    .values(
      COHORTS.flatMap((demoCohort) => [
        {
          cohortId: cohortId(demoCohort),
          profileId: personId(demoCohort.tutorKey),
          roleId: ROLE.TUTOR,
          createdAt: daysFromNow(now, -demoCohort.createdDaysAgo)
        },
        ...demoCohort.memberKeys.map((memberKey, position) => ({
          cohortId: cohortId(demoCohort),
          profileId: personId(memberKey),
          roleId: ROLE.STUDENT,
          createdAt: daysFromNow(now, -demoCohort.createdDaysAgo + 1 + position)
        }))
      ])
    )
    .onConflictDoNothing();

  const members = await db
    .select({ id: cohortMember.id, cohortId: cohortMember.cohortId, profileId: cohortMember.profileId })
    .from(cohortMember)
    .where(inArray(cohortMember.cohortId, COHORTS.map(cohortId)));
  const memberId = (demoCohort: DemoCohort, personKey: string) =>
    members.find((row) => row.cohortId === cohortId(demoCohort) && row.profileId === personId(personKey))!.id;

  const goalId = (demoCohort: DemoCohort, goalIndex: number) => demoId('b100', demoCohort.index, goalIndex + 1);
  await db
    .insert(cohortGoal)
    .values(
      COHORTS.flatMap((demoCohort) =>
        demoCohort.goals.map((goal, goalIndex) => ({
          id: goalId(demoCohort, goalIndex),
          cohortId: cohortId(demoCohort),
          title: goal.title,
          description: goal.description,
          type: goal.type,
          courseIds: goal.courseKeys.map((courseKey) => courseIdByKey.get(courseKey)!),
          requiredCount: goal.requiredCount,
          scoreThreshold: goal.scoreThreshold ?? null,
          deadlineKind: 'absolute' as const,
          deadlineDate: daysFromNow(now, goal.dueInDays),
          status: 'active' as const,
          createdByProfileId: personId(demoCohort.tutorKey)
        }))
      )
    )
    .onConflictDoNothing();

  const assignments = COHORTS.flatMap((demoCohort) =>
    demoCohort.goals.flatMap((goal, goalIndex) =>
      demoCohort.memberKeys.map((memberKey) => {
        const plan = goal.statuses[memberKey] ?? goal.defaultStatus;

        return {
          goalId: goalId(demoCohort, goalIndex),
          cohortMemberId: memberId(demoCohort, memberKey),
          dueDate: daysFromNow(now, goal.dueInDays),
          status: plan.status,
          completedCount: plan.completed,
          requiredCount: goal.requiredCount,
          completedAt: plan.status === 'completed' ? daysFromNow(now, Math.min(goal.dueInDays, 0) - 3) : null,
          lastEvaluatedAt: daysFromNow(now, -0.2)
        };
      })
    )
  );
  const insertedAssignments = await db
    .insert(cohortGoalAssignment)
    .values(assignments)
    .onConflictDoNothing()
    .returning({ id: cohortGoalAssignment.id });

  const postId = (demoCohort: DemoCohort, postIndex: number) => demoId('b200', demoCohort.index, postIndex + 1);
  const existingPosts = await db
    .select({ id: cohortNewsfeed.id })
    .from(cohortNewsfeed)
    .where(
      inArray(
        cohortNewsfeed.id,
        COHORTS.flatMap((demoCohort) => demoCohort.posts.map((_, index) => postId(demoCohort, index)))
      )
    );
  const existingPostIds = new Set(existingPosts.map((row) => row.id));
  let postCount = 0;
  let commentCount = 0;

  for (const demoCohort of COHORTS) {
    for (const [postIndex, post] of demoCohort.posts.entries()) {
      const id = postId(demoCohort, postIndex);
      if (existingPostIds.has(id)) continue;

      const postedAt = now.getTime() - post.hoursAgo * 60 * 60 * 1000;
      const reactors = demoCohort.memberKeys.slice(1, 5).map((memberKey) => memberId(demoCohort, memberKey));
      await db.insert(cohortNewsfeed).values({
        id,
        cohortId: cohortId(demoCohort),
        authorId: memberId(demoCohort, post.author),
        content: post.content,
        isPinned: post.pinned ?? false,
        reaction: { clap: reactors.slice(0, 2), smile: [], thumbsup: reactors.slice(2), thumbsdown: [] },
        createdAt: new Date(postedAt).toISOString()
      });
      postCount += 1;

      const step = (post.hoursAgo * 60 * 60 * 1000) / (post.comments.length + 1);
      await db.insert(cohortNewsfeedComment).values(
        post.comments.map((comment, commentIndex) => ({
          cohortNewsfeedId: id,
          authorId: memberId(demoCohort, comment.author),
          content: comment.text,
          createdAt: new Date(postedAt + step * (commentIndex + 1)).toISOString()
        }))
      );
      commentCount += post.comments.length;
    }
  }

  console.log(
    `   ✓ Demo cohorts: ${cohortsToInsert.length} cohort(s), ${insertedAssignments.length} goal assignment(s), ${postCount} post(s), ${commentCount} comment(s)`
  );
}
