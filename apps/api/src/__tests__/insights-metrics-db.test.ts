import 'dotenv/config';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { inArray } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';
import { ZInsightsQuerySpec } from '@cio/utils/validation/insights';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

type Scope = { orgId: string; type: 'cohort' | 'course' | 'org'; id: string };
type Measure = { metric: string; agg: string };

describe.skipIf(!hasDatabase)('insights metrics against the database', () => {
  const suffix = `${Date.now()}`;

  const organizationIds: string[] = [];
  const userIds: string[] = [];
  const profileIds: string[] = [];
  const groupIds: string[] = [];
  const groupMemberIds: string[] = [];
  const courseIds: string[] = [];
  const exerciseIds: string[] = [];
  const questionIds: number[] = [];
  const cohortIds: string[] = [];
  const goalIds: string[] = [];

  let orgAId = '';
  let orgBId = '';
  let orgFTId = '';
  let orgPId = '';
  let cohortC1Id = '';
  let cohortC2Id = '';
  let cohortC3Id = '';
  let cohortC4Id = '';
  let lessonXId = '';
  let lessonLPId = '';
  let courseK1Id = '';
  let courseK2Id = '';
  let courseKBId = '';
  let courseKFTId = '';
  let courseKPId = '';
  let courseKRId = '';

  const profiles: Record<string, string> = {};
  const membersByCourse: Record<string, Record<string, string>> = {};
  const exercisesByLabel: Record<string, string> = {};
  const coursesByLabel: Record<string, string> = {};
  const studentsByLabel: Record<string, string> = {};

  const daysAgoDate = (days: number) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - days);

    return date.toISOString().slice(0, 10);
  };

  const daysAgoTimestamp = (days: number) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - days);

    return date.toISOString().slice(0, 19);
  };

  const isoDaysAgo = (days: number) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - days);

    return date.toISOString();
  };

  const expectRows = (rows: Array<Record<string, unknown>>, count: number) => {
    expect(rows).toHaveLength(count);
  };

  const rowKey = (row: Record<string, unknown>, ...keys: string[]) =>
    keys.map((key) => String(row[key] ?? 'null')).join('|');

  const indexRows = (rows: Array<Record<string, unknown>>, ...keys: string[]) =>
    new Map(rows.map((row) => [rowKey(row, ...keys), row]));

  const runQuery = async (params: {
    source: string;
    dimensions?: string[];
    measures: Measure[];
    filters?: Array<Record<string, unknown>>;
    scope?: Scope;
    limit?: number;
    page?: number;
    days?: number;
    range?: string;
    sort?: Array<{ field: string; dir: 'asc' | 'desc' }>;
    search?: string;
    orderedItems?: Array<Record<string, unknown>>;
  }) => {
    const { runInsightsQuery } = await import('@cio/db/queries/insights');
    const spec = ZInsightsQuerySpec.parse({
      source: params.source,
      dimensions: params.dimensions ?? [],
      measures: params.measures,
      filters: params.filters ?? [],
      sort: params.sort ?? [],
      search: params.search,
      limit: params.limit ?? 100,
      page: params.page ?? 1,
      ...(params.days ? { days: params.days } : {}),
      ...(params.range ? { range: params.range } : {})
    });
    const scope = params.scope ?? { orgId: orgAId, type: 'cohort' as const, id: cohortC1Id };
    const result = await runInsightsQuery(spec, {
      scope,
      orderedItems: (params.orderedItems ?? []) as never
    });

    return result.rows as Array<Record<string, unknown>>;
  };

  const rowCountMeasure: Measure = { metric: 'rows', agg: 'count' };

  beforeAll(async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    await db
      .insert(schema.role)
      .values([
        { id: ROLE.ADMIN, type: 'ADMIN' },
        { id: ROLE.TUTOR, type: 'TUTOR' },
        { id: ROLE.STUDENT, type: 'STUDENT' }
      ])
      .onConflictDoNothing();
    await db.insert(schema.submissionstatus).values({ id: 1, label: 'Submitted' }).onConflictDoNothing();
    await db.insert(schema.questionType).values({ id: 1, label: 'Radio', typename: 'radio' }).onConflictDoNothing();

    const createProfile = async (label: string) => {
      const email = `${label.toLowerCase()}-${suffix}@insights.test`;
      const [user] = await db.insert(schema.user).values({ name: label, email, emailVerified: true }).returning();
      userIds.push(user.id);

      const [profile] = await db
        .insert(schema.profile)
        .values({ id: user.id, fullname: label, username: `${label.toLowerCase()}-${suffix}`, email })
        .returning();
      profileIds.push(profile.id);
      profiles[label] = profile.id;
      studentsByLabel[label] = profile.id;

      return profile;
    };

    const [orgA] = await db
      .insert(schema.organization)
      .values({ name: `Insights A ${suffix}`, siteName: `insights-a-${suffix}` })
      .returning();
    const [orgB] = await db
      .insert(schema.organization)
      .values({ name: `Insights B ${suffix}`, siteName: `insights-b-${suffix}` })
      .returning();
    orgAId = orgA.id;
    orgBId = orgB.id;
    organizationIds.push(orgAId, orgBId);

    const students = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7'];
    for (const student of students) {
      await createProfile(student);
    }

    const addOrgMember = async (
      organizationId: string,
      profileId: string,
      status: 'ACTIVE' | 'DEACTIVATED',
      createdAt?: string
    ) => {
      await db.insert(schema.organizationmember).values({
        organizationId,
        roleId: ROLE.STUDENT,
        profileId,
        email: `${profileId}@insights.test`,
        status,
        ...(createdAt ? { createdAt } : {})
      });
    };

    for (const student of ['L1', 'L2', 'L3', 'L4']) {
      await addOrgMember(orgAId, profiles[student], 'ACTIVE');
    }
    await addOrgMember(orgAId, profiles.L6, 'DEACTIVATED');
    await addOrgMember(orgBId, profiles.L7, 'ACTIVE');

    const createGroup = async (organizationId: string, label: string) => {
      const [group] = await db
        .insert(schema.group)
        .values({ name: `${label}-${suffix}`, organizationId })
        .returning();
      groupIds.push(group.id);

      return group;
    };

    const groupG1 = await createGroup(orgAId, 'G1');
    const groupG2 = await createGroup(orgAId, 'G2');
    const groupGB = await createGroup(orgBId, 'GB');

    const addGroupMember = async (
      groupId: string,
      profileId: string,
      label: string,
      createdAt?: string,
      certificateEarnedAt?: string
    ) => {
      const [member] = await db
        .insert(schema.groupmember)
        .values({
          groupId,
          roleId: ROLE.STUDENT,
          profileId,
          email: `${label.toLowerCase()}-member-${suffix}@insights.test`,
          ...(createdAt ? { createdAt } : {}),
          ...(certificateEarnedAt ? { certificateEarnedAt } : {})
        })
        .returning();
      groupMemberIds.push(member.id);

      return member;
    };

    const createCourse = async (groupId: string, label: string, description: string, grouped: boolean) => {
      const [course] = await db
        .insert(schema.course)
        .values({
          title: label,
          description,
          groupId,
          slug: `${label.toLowerCase()}-${suffix}`,
          status: 'ACTIVE',
          metadata: { isContentGroupingEnabled: grouped }
        })
        .returning();
      courseIds.push(course.id);
      coursesByLabel[label] = course.id;

      return course;
    };

    const courseK1 = await createCourse(groupG1.id, 'K1', 'Grouped course', true);
    const courseK2 = await createCourse(groupG2.id, 'K2', 'Ungrouped course', false);
    const courseKB = await createCourse(groupGB.id, 'KB', 'Other org course', true);
    courseK1Id = courseK1.id;
    courseK2Id = courseK2.id;
    courseKBId = courseKB.id;

    const [sectionS1] = await db
      .insert(schema.courseSection)
      .values({ courseId: courseK1.id, title: 'S1', order: 1 })
      .returning();
    const [sectionS2] = await db
      .insert(schema.courseSection)
      .values({ courseId: courseK1.id, title: 'S2', order: 2 })
      .returning();

    const [lessonX] = await db
      .insert(schema.lesson)
      .values({
        courseId: courseK1.id,
        sectionId: sectionS1.id,
        title: 'Lesson X',
        slug: `lesson-x-${suffix}`,
        order: 1,
        completionPolicy: 'video_watch',
        videos: [{ type: 'upload', link: '', assetId: `asset-${suffix}` }]
      })
      .returning();
    lessonXId = lessonX.id;

    const createExercise = async (values: {
      label: string;
      courseId?: string;
      sectionId?: string;
      order: number;
      completionPolicy: 'submitted' | 'passed';
      passThreshold?: number | null;
      isUnlocked?: boolean;
      dueBy?: string;
    }) => {
      const [exercise] = await db
        .insert(schema.exercise)
        .values({
          title: values.label,
          courseId: values.courseId ?? null,
          sectionId: values.sectionId ?? null,
          order: values.order,
          slug: `${values.label.toLowerCase()}-${suffix}`,
          completionPolicy: values.completionPolicy,
          passThreshold: values.passThreshold ?? null,
          isUnlocked: values.isUnlocked ?? true,
          dueBy: values.dueBy ?? null
        })
        .returning();
      exerciseIds.push(exercise.id);
      exercisesByLabel[values.label] = exercise.id;

      return exercise;
    };

    const exerciseE1 = await createExercise({
      label: 'E1',
      courseId: courseK1.id,
      sectionId: sectionS1.id,
      order: 1,
      completionPolicy: 'submitted'
    });
    const exerciseE2 = await createExercise({
      label: 'E2',
      courseId: courseK1.id,
      sectionId: sectionS2.id,
      order: 2,
      completionPolicy: 'passed',
      passThreshold: 70
    });
    const exerciseE3 = await createExercise({
      label: 'E3',
      courseId: courseK1.id,
      sectionId: sectionS2.id,
      order: 3,
      completionPolicy: 'passed',
      passThreshold: 70,
      isUnlocked: false
    });
    const exerciseE4 = await createExercise({
      label: 'E4',
      courseId: courseK1.id,
      order: 4,
      completionPolicy: 'submitted',
      dueBy: daysAgoTimestamp(2)
    });
    const exerciseE5 = await createExercise({
      label: 'E5',
      courseId: courseK1.id,
      sectionId: sectionS1.id,
      order: 5,
      completionPolicy: 'submitted'
    });
    const exerciseE6 = await createExercise({
      label: 'E6',
      courseId: courseK2.id,
      order: 1,
      completionPolicy: 'passed'
    });
    const exerciseEB = await createExercise({
      label: 'EB',
      courseId: courseKB.id,
      order: 1,
      completionPolicy: 'submitted'
    });

    const createQuestion = async (exerciseId: string, label: string, points: number) => {
      const [question] = await db
        .insert(schema.question)
        .values({ exerciseId, questionTypeId: 1, title: label, points, order: 1 })
        .returning();
      questionIds.push(question.id);

      const [option] = await db
        .insert(schema.option)
        .values({ questionId: question.id, label: `${label} wrong`, isCorrect: false })
        .returning();

      return { question, option };
    };

    const q1 = await createQuestion(exerciseE1.id, 'Q1', 100);
    const q2 = await createQuestion(exerciseE2.id, 'Q2', 100);
    const q6 = await createQuestion(exerciseE6.id, 'Q6', 100);
    await createQuestion(exerciseEB.id, 'QB', 100);

    const gm1K1 = await addGroupMember(groupG1.id, profiles.L1, 'L1');
    const gm2K1 = await addGroupMember(groupG1.id, profiles.L2, 'L2');
    const gm3K1 = await addGroupMember(groupG1.id, profiles.L3, 'L3');
    const gm4K1 = await addGroupMember(groupG1.id, profiles.L4, 'L4');
    const gm6K1 = await addGroupMember(groupG1.id, profiles.L6, 'L6');
    const gm1K2 = await addGroupMember(groupG2.id, profiles.L1, 'L1');
    const gm2K2 = await addGroupMember(groupG2.id, profiles.L2, 'L2');
    const gm7B = await addGroupMember(groupGB.id, profiles.L7, 'L7');

    membersByCourse.K1 = { L1: gm1K1.id, L2: gm2K1.id, L3: gm3K1.id, L4: gm4K1.id };
    membersByCourse.K2 = { L1: gm1K2.id, L2: gm2K2.id };

    void gm6K1;
    void gm7B;

    const createSubmission = async (params: {
      exerciseId: string;
      courseId: string;
      groupMemberId: string;
      total: number;
      gradingState: string;
      createdAt?: string;
    }) => {
      const createdAt = params.createdAt ?? new Date().toISOString();
      const [submission] = await db
        .insert(schema.submission)
        .values({
          exerciseId: params.exerciseId,
          courseId: params.courseId,
          submittedBy: params.groupMemberId,
          statusId: 1,
          gradingState: params.gradingState,
          total: params.total,
          createdAt,
          updatedAt: createdAt
        })
        .returning();

      return submission;
    };

    const answer = async (
      submissionId: string,
      groupMemberId: string,
      question: { id: number },
      option: { id: number },
      point: number
    ) => {
      await db.insert(schema.questionAnswer).values({
        submissionId,
        groupMemberId,
        questionId: question.id,
        point,
        answerData: { optionId: String(option.id) } as never
      });
    };

    const l1E1 = await createSubmission({
      exerciseId: exerciseE1.id,
      courseId: courseK1.id,
      groupMemberId: gm1K1.id,
      total: 50,
      gradingState: 'completed'
    });
    await answer(l1E1.id, gm1K1.id, q1.question, q1.option, 50);

    const l1E2First = await createSubmission({
      exerciseId: exerciseE2.id,
      courseId: courseK1.id,
      groupMemberId: gm1K1.id,
      total: 60,
      gradingState: 'completed',
      createdAt: isoDaysAgo(2)
    });
    await answer(l1E2First.id, gm1K1.id, q2.question, q2.option, 60);

    const l1E2Best = await createSubmission({
      exerciseId: exerciseE2.id,
      courseId: courseK1.id,
      groupMemberId: gm1K1.id,
      total: 80,
      gradingState: 'completed',
      createdAt: isoDaysAgo(1)
    });
    await answer(l1E2Best.id, gm1K1.id, q2.question, q2.option, 80);

    await createSubmission({
      exerciseId: exerciseE4.id,
      courseId: courseK1.id,
      groupMemberId: gm1K1.id,
      total: 0,
      gradingState: 'completed'
    });

    const l1E6 = await createSubmission({
      exerciseId: exerciseE6.id,
      courseId: courseK2.id,
      groupMemberId: gm1K2.id,
      total: 100,
      gradingState: 'completed'
    });
    await answer(l1E6.id, gm1K2.id, q6.question, q6.option, 100);

    await createSubmission({
      exerciseId: exerciseE2.id,
      courseId: courseK1.id,
      groupMemberId: gm2K1.id,
      total: 0,
      gradingState: 'awaiting_manual'
    });

    await db.insert(schema.lessonCompletion).values({ lessonId: lessonX.id, profileId: profiles.L1, isComplete: true });
    await db.insert(schema.groupAttendance).values([
      { courseId: courseK1.id, lessonId: lessonX.id, studentId: gm1K1.id, isPresent: true },
      { courseId: courseK1.id, lessonId: lessonX.id, studentId: gm2K1.id, isPresent: false }
    ]);

    await db.insert(schema.analyticsLoginEvents).values([
      {
        userId: profiles.L1,
        loggedInAt: new Date().toISOString(),
        loggedInDate: daysAgoDate(0)
      },
      {
        userId: profiles.L2,
        loggedInAt: isoDaysAgo(3),
        loggedInDate: daysAgoDate(3)
      }
    ]);

    const [cohortC1] = await db
      .insert(schema.cohort)
      .values({ organizationId: orgAId, name: `C1-${suffix}`, status: 'ACTIVE' })
      .returning();
    const [cohortC2] = await db
      .insert(schema.cohort)
      .values({ organizationId: orgAId, name: `C2-${suffix}`, status: 'ACTIVE' })
      .returning();
    const [cohortCB] = await db
      .insert(schema.cohort)
      .values({ organizationId: orgBId, name: `CB-${suffix}`, status: 'ACTIVE' })
      .returning();
    cohortC1Id = cohortC1.id;
    cohortC2Id = cohortC2.id;
    cohortIds.push(cohortC1Id, cohortC2Id, cohortCB.id);

    await db.insert(schema.cohortCourse).values([
      { cohortId: cohortC1Id, courseId: courseK1.id },
      { cohortId: cohortC1Id, courseId: courseK2.id },
      { cohortId: cohortC2Id, courseId: courseK1.id },
      { cohortId: cohortCB.id, courseId: courseKB.id }
    ]);

    const cohortMembers: Record<string, { id: string; profileId: string | null }> = {};
    const addCohortMember = async (cohortId: string, profileId: string | null, email: string, label: string) => {
      const [member] = await db
        .insert(schema.cohortMember)
        .values({ cohortId, profileId, roleId: ROLE.STUDENT, email: `${label}-${suffix}@insights.test` })
        .returning();
      cohortMembers[label] = { id: member.id, profileId };

      return member;
    };

    for (const student of ['L1', 'L2', 'L3', 'L4']) {
      await addCohortMember(cohortC1Id, profiles[student], `${student}-c1-${suffix}@insights.test`, `${student}C1`);
    }
    await addCohortMember(cohortC1Id, null, `pending-${suffix}@insights.test`, 'PENDING');
    await addCohortMember(cohortC1Id, profiles.L6, `L6-c1-${suffix}@insights.test`, 'L6C1');
    await addCohortMember(cohortC2Id, profiles.L3, `L3-c2-${suffix}@insights.test`, 'L3C2');
    await addCohortMember(cohortCB.id, profiles.L7, `L7-cb-${suffix}@insights.test`, 'L7CB');

    const [goal] = await db
      .insert(schema.cohortGoal)
      .values({
        cohortId: cohortC1Id,
        title: 'Finish K1',
        type: 'complete_all',
        courseIds: [courseK1.id],
        status: 'active',
        deadlineKind: 'none'
      })
      .returning();
    goalIds.push(goal.id);

    await db.insert(schema.cohortGoalAssignment).values([
      {
        goalId: goal.id,
        cohortMemberId: cohortMembers.L2C1.id,
        dueDate: isoDaysAgo(3),
        status: 'not_started'
      },
      {
        goalId: goal.id,
        cohortMemberId: cohortMembers.L1C1.id,
        dueDate: isoDaysAgo(3),
        status: 'completed',
        completedAt: isoDaysAgo(1)
      }
    ]);

    const [cohortC3] = await db
      .insert(schema.cohort)
      .values({ organizationId: orgAId, name: `C3-${suffix}`, status: 'ARCHIVED' })
      .returning();
    const [cohortC4] = await db
      .insert(schema.cohort)
      .values({ organizationId: orgAId, name: `C4-${suffix}`, status: 'ACTIVE' })
      .returning();
    cohortC3Id = cohortC3.id;
    cohortC4Id = cohortC4.id;
    cohortIds.push(cohortC3Id, cohortC4Id);

    await db.insert(schema.cohortCourse).values([
      { cohortId: cohortC3Id, courseId: courseK1.id },
      { cohortId: cohortC4Id, courseId: courseK1.id }
    ]);

    const [goalL3a] = await db
      .insert(schema.cohortGoal)
      .values({
        cohortId: cohortC1Id,
        title: 'Goal L3 a',
        type: 'complete_all',
        courseIds: [courseK1.id],
        status: 'active',
        deadlineKind: 'none'
      })
      .returning();
    const [goalL3b] = await db
      .insert(schema.cohortGoal)
      .values({
        cohortId: cohortC1Id,
        title: 'Goal L3 b',
        type: 'complete_all',
        courseIds: [courseK1.id],
        status: 'active',
        deadlineKind: 'none'
      })
      .returning();
    goalIds.push(goalL3a.id, goalL3b.id);

    await db.insert(schema.cohortGoalAssignment).values([
      {
        goalId: goalL3a.id,
        cohortMemberId: cohortMembers.L3C1.id,
        dueDate: isoDaysAgo(5),
        status: 'not_started'
      },
      {
        goalId: goalL3b.id,
        cohortMemberId: cohortMembers.L3C1.id,
        dueDate: isoDaysAgo(4),
        status: 'not_started'
      }
    ]);

    const [orgFT] = await db
      .insert(schema.organization)
      .values({ name: `Insights FT ${suffix}`, siteName: `insights-ft-${suffix}` })
      .returning();
    const [orgP] = await db
      .insert(schema.organization)
      .values({ name: `Insights period ${suffix}`, siteName: `insights-period-${suffix}` })
      .returning();
    orgFTId = orgFT.id;
    orgPId = orgP.id;
    organizationIds.push(orgFTId, orgPId);

    for (const label of ['F1', 'F2', 'F3', 'F4', 'P1', 'P2', 'P3', 'P4']) {
      await createProfile(label);
    }
    for (const label of ['F1', 'F2', 'F3', 'F4']) {
      await addOrgMember(orgFTId, profiles[label], 'ACTIVE');
    }
    await addOrgMember(orgPId, profiles.P1, 'ACTIVE');
    await addOrgMember(orgPId, profiles.P2, 'ACTIVE', isoDaysAgo(3));
    await addOrgMember(orgPId, profiles.P3, 'ACTIVE', isoDaysAgo(30));
    await addOrgMember(orgPId, profiles.P4, 'ACTIVE', isoDaysAgo(60));

    const groupGFT = await createGroup(orgFTId, 'GFT');
    const groupGP = await createGroup(orgPId, 'GP');
    const groupGR = await createGroup(orgPId, 'GR');

    const courseKFT = await createCourse(groupGFT.id, 'KFT', 'First try course', true);
    const courseKP = await createCourse(groupGP.id, 'KP', 'Period course', true);
    const courseKR = await createCourse(groupGR.id, 'KR', 'Range course', true);
    courseKFTId = courseKFT.id;
    courseKPId = courseKP.id;
    courseKRId = courseKR.id;

    const exerciseEFT = await createExercise({
      label: 'EFT',
      courseId: courseKFT.id,
      order: 1,
      completionPolicy: 'passed',
      passThreshold: 70
    });
    const exerciseEP = await createExercise({
      label: 'EP',
      courseId: courseKP.id,
      order: 2,
      completionPolicy: 'submitted'
    });
    const exerciseER = await createExercise({
      label: 'ER',
      courseId: courseKR.id,
      order: 1,
      completionPolicy: 'passed',
      passThreshold: 70
    });

    const [lessonLP] = await db
      .insert(schema.lesson)
      .values({
        courseId: courseKP.id,
        title: 'LP',
        slug: `lesson-lp-${suffix}`,
        order: 1,
        completionPolicy: 'video_watch',
        videos: [{ type: 'upload', link: '', assetId: `asset-lp-${suffix}` }]
      })
      .returning();
    lessonLPId = lessonLP.id;

    const qFT = await createQuestion(exerciseEFT.id, 'QFT', 100);
    const qER = await createQuestion(exerciseER.id, 'QER', 100);

    const gmF: Record<string, string> = {};
    for (const label of ['F1', 'F2', 'F3', 'F4']) {
      const member = await addGroupMember(groupGFT.id, profiles[label], `${label}FT`);
      gmF[label] = member.id;
    }
    const gmP1 = await addGroupMember(groupGP.id, profiles.P1, 'P1P');
    const gmP2 = await addGroupMember(groupGP.id, profiles.P2, 'P2P', isoDaysAgo(3));
    const gmP3 = await addGroupMember(groupGP.id, profiles.P3, 'P3P', isoDaysAgo(10), isoDaysAgo(10));
    const gmP4 = await addGroupMember(groupGP.id, profiles.P4, 'P4P', isoDaysAgo(40));
    const gmR1 = await addGroupMember(groupGR.id, profiles.P1, 'P1R', isoDaysAgo(60));

    const ftF1First = await createSubmission({
      exerciseId: exerciseEFT.id,
      courseId: courseKFT.id,
      groupMemberId: gmF.F1,
      total: 60,
      gradingState: 'completed',
      createdAt: isoDaysAgo(2)
    });
    await answer(ftF1First.id, gmF.F1, qFT.question, qFT.option, 60);

    const ftF1Best = await createSubmission({
      exerciseId: exerciseEFT.id,
      courseId: courseKFT.id,
      groupMemberId: gmF.F1,
      total: 80,
      gradingState: 'completed',
      createdAt: isoDaysAgo(1)
    });
    await answer(ftF1Best.id, gmF.F1, qFT.question, qFT.option, 80);

    await createSubmission({
      exerciseId: exerciseEFT.id,
      courseId: courseKFT.id,
      groupMemberId: gmF.F2,
      total: 0,
      gradingState: 'awaiting_manual',
      createdAt: isoDaysAgo(1)
    });

    const ftF3 = await createSubmission({
      exerciseId: exerciseEFT.id,
      courseId: courseKFT.id,
      groupMemberId: gmF.F3,
      total: 90,
      gradingState: 'completed',
      createdAt: isoDaysAgo(1)
    });
    await answer(ftF3.id, gmF.F3, qFT.question, qFT.option, 90);

    const ftF4 = await createSubmission({
      exerciseId: exerciseEFT.id,
      courseId: courseKFT.id,
      groupMemberId: gmF.F4,
      total: 40,
      gradingState: 'completed',
      createdAt: isoDaysAgo(1)
    });
    await answer(ftF4.id, gmF.F4, qFT.question, qFT.option, 40);

    await createSubmission({
      exerciseId: exerciseEP.id,
      courseId: courseKP.id,
      groupMemberId: gmP3.id,
      total: 100,
      gradingState: 'completed',
      createdAt: isoDaysAgo(10)
    });

    await db.insert(schema.lessonCompletion).values([
      {
        lessonId: lessonLP.id,
        profileId: profiles.P3,
        isComplete: true,
        createdAt: isoDaysAgo(10),
        updatedAt: isoDaysAgo(10)
      },
      {
        lessonId: lessonLP.id,
        profileId: profiles.P2,
        isComplete: true,
        createdAt: isoDaysAgo(1),
        updatedAt: isoDaysAgo(1)
      },
      {
        lessonId: lessonLP.id,
        profileId: profiles.P4,
        isComplete: true,
        createdAt: isoDaysAgo(10),
        updatedAt: isoDaysAgo(10)
      }
    ]);

    const r1First = await createSubmission({
      exerciseId: exerciseER.id,
      courseId: courseKR.id,
      groupMemberId: gmR1.id,
      total: 90,
      gradingState: 'completed',
      createdAt: isoDaysAgo(40)
    });
    await answer(r1First.id, gmR1.id, qER.question, qER.option, 90);

    const r1Recent = await createSubmission({
      exerciseId: exerciseER.id,
      courseId: courseKR.id,
      groupMemberId: gmR1.id,
      total: 80,
      gradingState: 'completed',
      createdAt: isoDaysAgo(5)
    });
    await answer(r1Recent.id, gmR1.id, qER.question, qER.option, 80);

    await db.insert(schema.analyticsLoginEvents).values({
      userId: profiles.P1,
      loggedInAt: new Date().toISOString(),
      loggedInDate: daysAgoDate(0)
    });

    void gmP1;
    void gmP2;
    void gmP4;
  });

  afterAll(async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    const remove = async (table: any, column: any, values: Array<string | number>) => {
      if (values.length === 0) return;

      await db.delete(table).where(inArray(column, values));
    };

    await remove(schema.analyticsLoginEvents, schema.analyticsLoginEvents.userId, profileIds);
    await remove(schema.questionAnswer, schema.questionAnswer.questionId, questionIds);
    if (courseIds.length > 0) {
      await db.delete(schema.submission).where(inArray(schema.submission.courseId, courseIds));
    }
    await remove(schema.question, schema.question.id, questionIds);
    await remove(schema.exercise, schema.exercise.id, exerciseIds);
    if (courseIds.length > 0) {
      await db.delete(schema.lesson).where(inArray(schema.lesson.courseId, courseIds));
      await db.delete(schema.courseSection).where(inArray(schema.courseSection.courseId, courseIds));
    }
    await remove(schema.lessonCompletion, schema.lessonCompletion.profileId, profileIds);
    if (courseIds.length > 0) {
      await db.delete(schema.groupAttendance).where(inArray(schema.groupAttendance.courseId, courseIds));
    }
    await remove(schema.cohortGoal, schema.cohortGoal.id, goalIds);
    await remove(schema.cohortMember, schema.cohortMember.cohortId, cohortIds);
    await remove(schema.cohortCourse, schema.cohortCourse.cohortId, cohortIds);
    await remove(schema.cohort, schema.cohort.id, cohortIds);
    await remove(schema.groupmember, schema.groupmember.groupId, groupIds);
    await remove(schema.course, schema.course.id, courseIds);
    await remove(schema.group, schema.group.id, groupIds);
    await remove(schema.organizationmember, schema.organizationmember.organizationId, organizationIds);
    await remove(schema.profile, schema.profile.id, profileIds);
    await remove(schema.user, schema.user.id, userIds);
    await remove(schema.organization, schema.organization.id, organizationIds);
  });

  it('rolls student course progress, score, completion and overdue per student and course', async () => {
    const rows = await runQuery({
      source: 'student_course',
      dimensions: ['student', 'course'],
      measures: [
        rowCountMeasure,
        { metric: 'progress_pct', agg: 'value' },
        { metric: 'avg_score_pct', agg: 'value' },
        { metric: 'pass_mark_exercises', agg: 'value' },
        { metric: 'pass_mark_passed', agg: 'value' },
        { metric: 'still_to_pass', agg: 'value' },
        { metric: 'took_pass_mark', agg: 'value' },
        { metric: 'is_completed', agg: 'value' },
        { metric: 'is_overdue', agg: 'value' }
      ]
    });

    expectRows(rows, 6);
    const byPair = indexRows(rows, 'student_label', 'course_label');

    expect(byPair.get('L1|K1')).toMatchObject({
      progress_pct__value: 67,
      avg_score_pct__value: 65,
      pass_mark_exercises__value: 2,
      pass_mark_passed__value: 1,
      still_to_pass__value: 0,
      took_pass_mark__value: true,
      is_completed__value: false,
      is_overdue__value: false
    });
    expect(byPair.get('L1|K2')).toMatchObject({
      progress_pct__value: 100,
      avg_score_pct__value: 100,
      pass_mark_exercises__value: 1,
      pass_mark_passed__value: 1,
      still_to_pass__value: 0,
      took_pass_mark__value: true,
      is_completed__value: true,
      is_overdue__value: false
    });
    expect(byPair.get('L2|K1')).toMatchObject({
      progress_pct__value: 0,
      avg_score_pct__value: null,
      pass_mark_exercises__value: 2,
      pass_mark_passed__value: 0,
      still_to_pass__value: 0,
      took_pass_mark__value: false,
      is_completed__value: false,
      is_overdue__value: true
    });
    expect(byPair.get('L2|K2')).toMatchObject({
      progress_pct__value: 0,
      avg_score_pct__value: null,
      pass_mark_exercises__value: 1,
      pass_mark_passed__value: 0,
      still_to_pass__value: 0,
      took_pass_mark__value: false,
      is_completed__value: false,
      is_overdue__value: false
    });
    expect(byPair.get('L3|K1')).toMatchObject({ progress_pct__value: 0, is_overdue__value: true });
    expect(byPair.get('L4|K1')).toMatchObject({ progress_pct__value: 0, is_overdue__value: true });
  });

  it('excludes the pending and deactivated cohort members', async () => {
    const rows = await runQuery({
      source: 'student',
      dimensions: ['student'],
      measures: [rowCountMeasure, { metric: 'name', agg: 'value' }]
    });

    expectRows(rows, 4);
    expect(rows.map((row) => row.student_label).sort()).toEqual(['L1', 'L2', 'L3', 'L4']);
  });

  it('rolls student activity into one row per student', async () => {
    const rows = await runQuery({
      source: 'student',
      dimensions: ['student'],
      measures: [
        rowCountMeasure,
        { metric: 'overall_progress_pct', agg: 'value' },
        { metric: 'avg_score_pct', agg: 'value' },
        { metric: 'video_pct', agg: 'value' },
        { metric: 'attendance_pct', agg: 'value' },
        { metric: 'courses_total', agg: 'value' },
        { metric: 'courses_completed', agg: 'value' },
        { metric: 'certificates', agg: 'value' },
        { metric: 'days_since_login', agg: 'value' },
        { metric: 'logged_in_today', agg: 'value' },
        { metric: 'is_overdue', agg: 'value' },
        { metric: 'status', agg: 'value' },
        { metric: 'status_rank', agg: 'value' }
      ]
    });

    expectRows(rows, 4);
    const byStudent = indexRows(rows, 'student_label');

    expect(byStudent.get('L1')).toMatchObject({
      overall_progress_pct__value: 71,
      avg_score_pct__value: 77,
      video_pct__value: 100,
      attendance_pct__value: 100,
      courses_total__value: 2,
      courses_completed__value: 1,
      certificates__value: 0,
      days_since_login__value: 0,
      logged_in_today__value: true,
      is_overdue__value: false,
      status__value: 'on_track',
      status_rank__value: 2
    });
    expect(byStudent.get('L2')).toMatchObject({
      overall_progress_pct__value: 0,
      avg_score_pct__value: null,
      video_pct__value: 0,
      attendance_pct__value: 0,
      courses_total__value: 2,
      courses_completed__value: 0,
      days_since_login__value: 3,
      logged_in_today__value: false,
      is_overdue__value: true,
      status__value: 'at_risk',
      status_rank__value: 0
    });
    expect(byStudent.get('L3')).toMatchObject({
      overall_progress_pct__value: 0,
      avg_score_pct__value: null,
      video_pct__value: 0,
      attendance_pct__value: 0,
      courses_total__value: 1,
      days_since_login__value: null,
      is_overdue__value: true,
      status__value: 'at_risk'
    });
    expect(byStudent.get('L4')).toMatchObject({
      courses_total__value: 1,
      is_overdue__value: true,
      status__value: 'at_risk'
    });
  });

  it('returns one assessment row per student and exercise with the best graded attempt', async () => {
    const rows = await runQuery({
      source: 'assessment_result',
      dimensions: ['student', 'exercise'],
      measures: [
        rowCountMeasure,
        { metric: 'state', agg: 'value' },
        { metric: 'best_score_pct', agg: 'value' },
        { metric: 'passed', agg: 'value' },
        { metric: 'is_complete', agg: 'value' },
        { metric: 'attempts', agg: 'value' }
      ]
    });

    expectRows(rows, 22);
    const byPair = indexRows(rows, 'student_label', 'exercise_label');

    expect(byPair.get('L1|E1')).toMatchObject({
      state__value: 'graded',
      best_score_pct__value: 50,
      passed__value: null,
      is_complete__value: true,
      attempts__value: 1
    });
    expect(byPair.get('L1|E2')).toMatchObject({
      state__value: 'graded',
      best_score_pct__value: 80,
      passed__value: true,
      is_complete__value: true,
      attempts__value: 2
    });
    expect(byPair.get('L1|E3')).toMatchObject({
      state__value: 'not_taken',
      best_score_pct__value: null,
      passed__value: false,
      is_complete__value: false,
      attempts__value: 0
    });
    expect(byPair.get('L1|E4')).toMatchObject({
      state__value: 'graded',
      best_score_pct__value: null,
      is_complete__value: true
    });
    expect(byPair.get('L1|E5')).toMatchObject({ state__value: 'not_taken', is_complete__value: false });
    expect(byPair.get('L1|E6')).toMatchObject({
      state__value: 'graded',
      best_score_pct__value: 100,
      passed__value: true,
      is_complete__value: true
    });
    expect(byPair.get('L2|E2')).toMatchObject({
      state__value: 'awaiting_grade',
      best_score_pct__value: null,
      passed__value: false,
      is_complete__value: false,
      attempts__value: 1
    });
    expect(byPair.get('L3|E2')).toMatchObject({ state__value: 'not_taken', attempts__value: 0 });
  });

  it('narrows assessment rows to attempted cells for the requested students', async () => {
    const rows = await runQuery({
      source: 'assessment_result',
      dimensions: ['student', 'exercise'],
      measures: [
        { metric: 'state', agg: 'value' },
        { metric: 'best_score_pct', agg: 'value' }
      ],
      filters: [
        { field: 'is_attempted', op: 'is_true' },
        { field: 'student', op: 'in', value: [profiles.L1, profiles.L2] }
      ]
    });

    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.state__value).not.toBe('not_taken');
      expect(['L1', 'L2']).toContain(String(row.student_label));
    }
  });

  it('rolls section activity, video and attendance and treats a missing attendance row as absent', async () => {
    const sectionRowsFor = (studentId: string, courseId: string) =>
      runQuery({
        source: 'section_activity',
        dimensions: ['section'],
        filters: [
          { field: 'course', op: 'eq', value: courseId },
          { field: 'student', op: 'eq', value: studentId }
        ],
        measures: [
          rowCountMeasure,
          { metric: 'section_score_pct', agg: 'value' },
          { metric: 'video_pct', agg: 'value' },
          { metric: 'attendance', agg: 'pooled' },
          { metric: 'took_all', agg: 'value' },
          { metric: 'passed_first_try', agg: 'rate' }
        ]
      });

    const l1K1 = await sectionRowsFor(profiles.L1, courseK1Id);
    expectRows(l1K1, 3);
    const l1K1BySection = indexRows(l1K1, 'section_label');
    expect(l1K1BySection.get('S1')).toMatchObject({
      section_score_pct__value: 50,
      video_pct__value: 100,
      attendance__pooled: 100,
      took_all__value: false,
      passed_first_try__rate: null
    });
    expect(l1K1BySection.get('S2')).toMatchObject({
      section_score_pct__value: 80,
      video_pct__value: null,
      attendance__pooled: null,
      took_all__value: false,
      passed_first_try__rate: null
    });
    expect(l1K1BySection.get('null')).toMatchObject({
      section_score_pct__value: null,
      attendance__pooled: null,
      took_all__value: true
    });

    const l2K1 = await sectionRowsFor(profiles.L2, courseK1Id);
    expectRows(l2K1, 3);
    const l2K1BySection = indexRows(l2K1, 'section_label');
    expect(l2K1BySection.get('S1')).toMatchObject({
      video_pct__value: 0,
      attendance__pooled: 0,
      took_all__value: false
    });
    expect(l2K1BySection.get('null')).toMatchObject({ took_all__value: false });

    const l3K1 = await sectionRowsFor(profiles.L3, courseK1Id);
    expectRows(l3K1, 3);
    expect(indexRows(l3K1, 'section_label').get('S1')).toMatchObject({
      video_pct__value: 0,
      attendance__pooled: 0
    });

    const l1K2 = await sectionRowsFor(profiles.L1, courseK2Id);
    expectRows(l1K2, 1);
    expect(l1K2[0]).toMatchObject({
      section_score_pct__value: 100,
      took_all__value: true,
      passed_first_try__rate: 100
    });

    const l2K2 = await sectionRowsFor(profiles.L2, courseK2Id);
    expectRows(l2K2, 1);
    expect(l2K2[0]).toMatchObject({ section_score_pct__value: null, took_all__value: false });
  });

  it('matches question results to the best graded submission and names the section or exercise', async () => {
    const { getInsightsCourseStructure, toOrderedItems } = await import('@api/services/insights/structure');
    const orderedItems = [
      ...toOrderedItems(await getInsightsCourseStructure(orgAId, courseK1Id)),
      ...toOrderedItems(await getInsightsCourseStructure(orgAId, courseK2Id))
    ];

    const rows = await runQuery({
      source: 'question_result',
      dimensions: ['exercise', 'question'],
      filters: [{ field: 'student', op: 'eq', value: profiles.L1 }],
      measures: [
        rowCountMeasure,
        { metric: 'correct_pct', agg: 'value' },
        { metric: 'wrong_answer', agg: 'value' },
        { metric: 'question_context', agg: 'value' }
      ],
      orderedItems
    });

    expectRows(rows, 3);
    const byPair = indexRows(rows, 'exercise_label', 'question_label');

    expect(byPair.get('E1|Q1')).toMatchObject({
      correct_pct__value: 50,
      wrong_answer__value: 'Q1 wrong',
      question_context__value: 'S1'
    });
    expect(byPair.get('E2|Q2')).toMatchObject({
      correct_pct__value: 80,
      wrong_answer__value: 'Q2 wrong',
      question_context__value: 'S2'
    });
    expect(byPair.get('E6|Q6')).toMatchObject({
      correct_pct__value: 100,
      wrong_answer__value: null,
      question_context__value: 'E6'
    });
  });

  it('reports lesson completion and login days per student', async () => {
    const lessons = await runQuery({
      source: 'lesson_progress',
      dimensions: ['lesson'],
      measures: [rowCountMeasure, { metric: 'is_complete', agg: 'rate' }]
    });

    expectRows(lessons, 1);
    expect(lessons[0]).toMatchObject({ rows__count: 4, is_complete__rate: 25 });

    const loginRowsFor = (studentId: string) =>
      runQuery({
        source: 'login_day',
        measures: [rowCountMeasure, { metric: 'logged_in', agg: 'count_if' }],
        filters: [{ field: 'student', op: 'eq', value: studentId }]
      });

    for (const [student, expectedLogins] of [
      ['L1', 1],
      ['L2', 1],
      ['L3', 0],
      ['L4', 0]
    ] as const) {
      const loginRows = await loginRowsFor(profiles[student]);

      expectRows(loginRows, 1);
      expect(loginRows[0]).toMatchObject({ rows__count: 14, logged_in__count_if: expectedLogins });
    }
  });

  it('lists overdue goals and exercises with days overdue and course titles', async () => {
    const rows = await runQuery({
      source: 'overdue_item',
      dimensions: ['student', 'overdue_kind'],
      measures: [
        rowCountMeasure,
        { metric: 'title', agg: 'value' },
        { metric: 'course_titles', agg: 'value' },
        { metric: 'days_overdue', agg: 'value' }
      ]
    });

    expectRows(rows, 5);
    const byPair = indexRows(rows, 'student_label', 'overdue_kind_id');

    expect(byPair.get('L2|goal')).toMatchObject({
      title__value: 'Finish K1',
      course_titles__value: 'K1',
      days_overdue__value: 3
    });
    expect(byPair.get('L2|exercise')).toMatchObject({
      title__value: 'E4',
      course_titles__value: 'K1',
      days_overdue__value: 2
    });
    expect(byPair.get('L3|goal')).toMatchObject({ course_titles__value: 'K1', rows__count: 2 });
    expect(byPair.get('L3|exercise')).toMatchObject({ title__value: 'E4', days_overdue__value: 2 });
    expect(byPair.get('L4|exercise')).toMatchObject({ title__value: 'E4', days_overdue__value: 2 });

    const courseRows = await runQuery({
      source: 'overdue_item',
      dimensions: ['overdue_kind'],
      measures: [rowCountMeasure]
    });
    const byKind = indexRows(courseRows, 'overdue_kind_id');
    expect(byKind.get('goal')?.rows__count).toBe(3);
    expect(byKind.get('exercise')?.rows__count).toBe(3);
  });

  it('keeps each organization inside its own tenant', async () => {
    const orgARows = await runQuery({
      source: 'student_course',
      dimensions: ['student', 'course'],
      measures: [rowCountMeasure],
      scope: { orgId: orgAId, type: 'org', id: orgAId }
    });
    expectRows(orgARows, 6);

    const orgBRows = await runQuery({
      source: 'student_course',
      dimensions: ['student', 'course'],
      measures: [rowCountMeasure],
      scope: { orgId: orgBId, type: 'org', id: orgBId }
    });
    expectRows(orgBRows, 1);
    expect(orgBRows[0]).toMatchObject({ student_label: 'L7', course_label: 'KB' });

    const crossOrgRows = await runQuery({
      source: 'student_course',
      dimensions: ['student'],
      measures: [rowCountMeasure],
      filters: [{ field: 'course', op: 'eq', value: courseKBId }]
    });
    expectRows(crossOrgRows, 0);
  });

  it('counts organization members per period, with empty periods and a running total', async () => {
    const measures: Measure[] = [
      { metric: 'members_added', agg: 'value' },
      { metric: 'members_total', agg: 'value' }
    ];
    const rows = await runQuery({
      source: 'org_member',
      dimensions: ['period'],
      measures,
      scope: { orgId: orgAId, type: 'org', id: orgAId }
    });

    expectRows(rows, 6);
    expect(rows.slice(0, 5).every((row) => row.members_added__value === 0 && row.members_total__value === 0)).toBe(
      true
    );
    expect(rows[5]).toMatchObject({ members_added__value: 4, members_total__value: 4 });

    const otherOrgRows = await runQuery({
      source: 'org_member',
      dimensions: ['period'],
      measures,
      scope: { orgId: orgBId, type: 'org', id: orgBId }
    });
    expectRows(otherOrgRows, 6);
    expect(otherOrgRows[5]).toMatchObject({ members_added__value: 1, members_total__value: 1 });
  });

  it('counts a student once per cohort when grouped by cohort, and once overall', async () => {
    const orgScope: Scope = { orgId: orgAId, type: 'org', id: orgAId };
    const courseScope: Scope = { orgId: orgAId, type: 'course', id: courseK1Id };

    const orgByCohort = await runQuery({
      source: 'student',
      dimensions: ['cohort'],
      measures: [rowCountMeasure],
      scope: orgScope
    });
    expectRows(orgByCohort, 2);
    const orgCohorts = indexRows(orgByCohort, 'cohort_id');
    expect(orgCohorts.get(cohortC1Id)?.rows__count).toBe(4);
    expect(orgCohorts.get(cohortC2Id)?.rows__count).toBe(1);

    const orgOverall = await runQuery({ source: 'student', measures: [rowCountMeasure], scope: orgScope });
    expect(orgOverall[0].rows__count).toBe(4);

    const courseByCohort = await runQuery({
      source: 'student_course',
      dimensions: ['cohort'],
      measures: [rowCountMeasure],
      scope: courseScope
    });
    const courseCohorts = indexRows(courseByCohort, 'cohort_id');
    expectRows(courseByCohort, 2);
    expect(courseCohorts.get(cohortC1Id)?.rows__count).toBe(4);
    expect(courseCohorts.get(cohortC2Id)?.rows__count).toBe(1);

    const c2Only = await runQuery({
      source: 'student',
      measures: [rowCountMeasure],
      filters: [{ field: 'cohort', op: 'eq', value: cohortC2Id }],
      scope: orgScope
    });
    expect(c2Only[0].rows__count).toBe(1);
  });

  it('groups enrollments outside every cohort under no cohort', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const { eq } = await import('drizzle-orm');
    const orgScope: Scope = { orgId: orgAId, type: 'org', id: orgAId };
    const [course] = await db.select().from(schema.course).where(eq(schema.course.id, courseK2Id));
    const [l5Member] = await db
      .insert(schema.groupmember)
      .values({
        groupId: course.groupId!,
        roleId: ROLE.STUDENT,
        profileId: profiles.L5,
        email: `l5-member-${suffix}@insights.test`
      })
      .returning();

    try {
      const rows = await runQuery({
        source: 'student',
        dimensions: ['cohort'],
        measures: [rowCountMeasure],
        scope: orgScope
      });
      const byCohort = indexRows(rows, 'cohort_id');

      expectRows(rows, 3);
      expect(byCohort.get('null')).toMatchObject({ cohort_label: null, rows__count: 1 });
      expect(byCohort.get(cohortC1Id)?.rows__count).toBe(4);

      const overall = await runQuery({ source: 'student', measures: [rowCountMeasure], scope: orgScope });
      expect(overall[0].rows__count).toBe(5);
    } finally {
      await db.delete(schema.groupmember).where(eq(schema.groupmember.id, l5Member.id));
    }
  });

  it('computes every organization preset widget for the org scope', async () => {
    const { runInsightsQuery } = await import('@cio/db/queries/insights');
    const { INSIGHTS_PRESETS } = await import('@api/services/insights/presets');
    const orgScope = { orgId: orgAId, type: 'org' as const, id: orgAId };
    const resultsById: Record<string, Array<Record<string, unknown>>> = {};

    for (const widget of INSIGHTS_PRESETS.org) {
      const result = await runInsightsQuery(widget.spec, { scope: orgScope, orderedItems: [] });
      resultsById[widget.id] = result.rows as Array<Record<string, unknown>>;
    }

    expect(resultsById.kpi_logged_in_week[0]).toMatchObject({ logged_in_period__count_if: 2, rows__count: 4 });
    expect(resultsById.kpi_progress_trend[0]).toMatchObject({ overall_progress_pct__avg: 17.8 });
    expect(resultsById.kpi_completions[0]).toMatchObject({
      is_completed__count_if: 1,
      completed_in_period__count_if: 1,
      rows__count: 6
    });
    expect(resultsById.kpi_certificates[0]).toMatchObject({
      is_certified__count_if: 0,
      certified_in_period__count_if: 0
    });
    expect(resultsById.kpi_needs_attention[0]).toMatchObject({ is_at_risk__count_if: 3 });
    expect(resultsById.needs_attention[0]).toMatchObject({
      is_inactive__count_if: 3,
      is_low_score__count_if: 0,
      is_overdue__count_if: 3,
      is_low_video__count_if: 3
    });

    const glance = resultsById.cohorts_at_a_glance;
    expectRows(glance, 3);
    const glanceById = indexRows(glance, 'cohort_id');

    expect(glanceById.get(cohortC1Id)).toMatchObject({
      students__value: 4,
      pending_invites__value: 1,
      avg_progress_pct__value: 17.8,
      avg_score_pct__value: 77,
      first_try_pass__pooled: 50,
      overdue_students__value: 3,
      at_risk_students__value: 3,
      completed_students__value: 0
    });
    expect(glanceById.get(cohortC2Id)).toMatchObject({
      students__value: 1,
      pending_invites__value: 0,
      avg_progress_pct__value: 0,
      avg_score_pct__value: null,
      first_try_pass__pooled: null,
      overdue_students__value: 1,
      at_risk_students__value: 1,
      completed_students__value: 0
    });
    expect(glanceById.get(cohortC4Id)).toMatchObject({
      students__value: 0,
      pending_invites__value: 0,
      avg_progress_pct__value: null,
      avg_score_pct__value: null,
      first_try_pass__pooled: null,
      overdue_students__value: 0,
      at_risk_students__value: 0,
      completed_students__value: 0
    });
    expect(glanceById.has(cohortC3Id)).toBe(false);

    expectRows(resultsById.cohort_health, 3);
    expectRows(resultsById.hiring_ramp, 6);
    expect(resultsById.hiring_ramp[0].members_total__value).toBe(0);
    expect(resultsById.hiring_ramp[5].members_total__value).toBe(4);

    const logins = resultsById.logins_per_day;
    expectRows(logins, 7);
    expect(logins.at(-1)).toMatchObject({ day_id: daysAgoDate(0), logged_in__count_if: 1 });
    expect(logins.find((row) => row.day_id === daysAgoDate(3))?.logged_in__count_if).toBe(1);
    expect(logins.reduce((total, row) => total + Number(row.logged_in__count_if), 0)).toBe(2);

    const scoreByCohort = indexRows(resultsById.avg_score_by_cohort, 'cohort_id');
    expectRows(resultsById.avg_score_by_cohort, 3);
    expect(scoreByCohort.get(cohortC1Id)?.avg_score_pct__value).toBe(77);
    expect(scoreByCohort.get(cohortC2Id)?.avg_score_pct__value).toBeNull();
    expect(scoreByCohort.get(cohortC4Id)?.avg_score_pct__value).toBeNull();

    expect(resultsById.courses_by_completion).toEqual([
      expect.objectContaining({ course_id: courseK2Id, is_completed__rate: 50 }),
      expect.objectContaining({ course_id: courseK1Id, is_completed__rate: 0 })
    ]);
  });

  it('counts a first-try pass only for graded first attempts and keeps still-to-pass for graded misses', async () => {
    const scopeFT: Scope = { orgId: orgFTId, type: 'course', id: courseKFTId };

    const courseRows = await runQuery({
      source: 'student_course',
      scope: scopeFT,
      measures: [
        { metric: 'first_try_pass', agg: 'pooled' },
        { metric: 'took_pass_mark', agg: 'count_if' },
        { metric: 'has_still_to_pass', agg: 'count_if' },
        { metric: 'rows', agg: 'count' }
      ]
    });

    expect(courseRows[0]).toMatchObject({
      first_try_pass__pooled: 33.3,
      took_pass_mark__count_if: 3,
      has_still_to_pass__count_if: 1,
      rows__count: 4
    });

    const rows = await runQuery({
      source: 'student_course',
      scope: scopeFT,
      dimensions: ['student'],
      measures: [
        { metric: 'pass_mark_exercises', agg: 'value' },
        { metric: 'pass_mark_passed', agg: 'value' },
        { metric: 'still_to_pass', agg: 'value' },
        { metric: 'took_pass_mark', agg: 'value' },
        { metric: 'has_still_to_pass', agg: 'value' },
        { metric: 'first_try_pass', agg: 'pooled' }
      ]
    });

    expectRows(rows, 4);
    const byStudent = indexRows(rows, 'student_label');

    expect(byStudent.get('F1')).toMatchObject({
      pass_mark_exercises__value: 1,
      pass_mark_passed__value: 1,
      still_to_pass__value: 0,
      took_pass_mark__value: true,
      has_still_to_pass__value: false,
      first_try_pass__pooled: 0
    });
    expect(byStudent.get('F2')).toMatchObject({
      pass_mark_passed__value: 0,
      took_pass_mark__value: false,
      first_try_pass__pooled: null
    });
    expect(byStudent.get('F3')).toMatchObject({
      pass_mark_passed__value: 1,
      first_try_pass__pooled: 100
    });
    expect(byStudent.get('F4')).toMatchObject({
      pass_mark_passed__value: 0,
      still_to_pass__value: 1,
      has_still_to_pass__value: true,
      first_try_pass__pooled: 0
    });
  });

  it('keeps standing current while reporting progress and completions around the period start', async () => {
    const scopeP: Scope = { orgId: orgPId, type: 'course', id: courseKPId };

    const students = await runQuery({
      source: 'student',
      scope: scopeP,
      dimensions: ['student'],
      measures: [
        { metric: 'overall_progress_pct', agg: 'value' },
        { metric: 'overall_progress_pct_existing', agg: 'value' },
        { metric: 'overall_progress_pct_at_period_start', agg: 'value' }
      ]
    });

    expectRows(students, 4);
    const byStudent = indexRows(students, 'student_label');

    expect(byStudent.get('P1')).toMatchObject({
      overall_progress_pct__value: 0,
      overall_progress_pct_existing__value: null,
      overall_progress_pct_at_period_start__value: null
    });
    expect(byStudent.get('P2')).toMatchObject({
      overall_progress_pct__value: 50,
      overall_progress_pct_existing__value: null,
      overall_progress_pct_at_period_start__value: null
    });
    expect(byStudent.get('P3')).toMatchObject({
      overall_progress_pct__value: 100,
      overall_progress_pct_existing__value: 100,
      overall_progress_pct_at_period_start__value: 100
    });
    expect(byStudent.get('P4')).toMatchObject({
      overall_progress_pct__value: 50,
      overall_progress_pct_existing__value: 50,
      overall_progress_pct_at_period_start__value: 50
    });

    const allTime = await runQuery({
      source: 'student_course',
      scope: scopeP,
      dimensions: ['student'],
      measures: [
        { metric: 'progress_pct_at_period_start', agg: 'value' },
        { metric: 'enrolled_in_period', agg: 'value' },
        { metric: 'completed_in_period', agg: 'value' },
        { metric: 'certified_in_period', agg: 'value' },
        { metric: 'is_certified', agg: 'value' },
        { metric: 'completed_in_window', agg: 'value' },
        { metric: 'completion_rate_at_period_start', agg: 'pooled' },
        { metric: 'days_to_finish', agg: 'value' }
      ]
    });

    const allByStudent = indexRows(allTime, 'student_label');

    expect(allByStudent.get('P1')).toMatchObject({ enrolled_in_period__value: true });
    expect(allByStudent.get('P2')).toMatchObject({
      progress_pct_at_period_start__value: 0,
      enrolled_in_period__value: true
    });
    expect(allByStudent.get('P3')).toMatchObject({
      progress_pct_at_period_start__value: 100,
      enrolled_in_period__value: false,
      completed_in_period__value: false,
      certified_in_period__value: false,
      is_certified__value: true,
      completed_in_window__value: true,
      completion_rate_at_period_start__pooled: 100,
      days_to_finish__value: 0
    });
    expect(allByStudent.get('P4')).toMatchObject({
      progress_pct_at_period_start__value: 50,
      enrolled_in_period__value: false,
      completion_rate_at_period_start__pooled: 0
    });

    const thirtyDays = await runQuery({
      source: 'student_course',
      scope: scopeP,
      dimensions: ['student'],
      range: '30d',
      measures: [
        { metric: 'progress_pct_at_period_start', agg: 'value' },
        { metric: 'enrolled_in_period', agg: 'value' },
        { metric: 'completed_in_period', agg: 'value' },
        { metric: 'certified_in_period', agg: 'value' },
        { metric: 'completed_in_window', agg: 'value' },
        { metric: 'days_to_finish', agg: 'value' }
      ]
    });

    const thirtyByStudent = indexRows(thirtyDays, 'student_label');

    expect(thirtyByStudent.get('P3')).toMatchObject({
      progress_pct_at_period_start__value: 0,
      enrolled_in_period__value: true,
      completed_in_period__value: true,
      certified_in_period__value: true,
      completed_in_window__value: true,
      days_to_finish__value: 0
    });

    const week = await runQuery({
      source: 'student_course',
      scope: scopeP,
      dimensions: ['student'],
      filters: [{ field: 'student', op: 'eq', value: profiles.P3 }],
      range: '7d',
      measures: [
        { metric: 'completed_in_period', agg: 'value' },
        { metric: 'completed_in_window', agg: 'value' },
        { metric: 'days_to_finish', agg: 'value' }
      ]
    });

    expect(week[0]).toMatchObject({
      completed_in_period__value: false,
      completed_in_window__value: false,
      days_to_finish__value: null
    });
  });

  it('summarizes cohorts per scope, keeps empty cohorts and skips archived ones', async () => {
    const measures: Measure[] = [
      { metric: 'students', agg: 'value' },
      { metric: 'pending_invites', agg: 'value' },
      { metric: 'cohort_created_at', agg: 'value' }
    ];

    const orgRows = await runQuery({
      source: 'cohort_summary',
      dimensions: ['cohort'],
      measures,
      scope: { orgId: orgAId, type: 'org', id: orgAId }
    });

    expectRows(orgRows, 3);
    const orgById = indexRows(orgRows, 'cohort_id');

    expect(orgById.get(cohortC1Id)).toMatchObject({ students__value: 4, pending_invites__value: 1 });
    expect(orgById.get(cohortC2Id)).toMatchObject({ students__value: 1, pending_invites__value: 0 });
    expect(orgById.get(cohortC4Id)).toMatchObject({ students__value: 0, pending_invites__value: 0 });
    expect(orgById.has(cohortC3Id)).toBe(false);

    const courseRows = await runQuery({
      source: 'cohort_summary',
      dimensions: ['cohort'],
      measures,
      scope: { orgId: orgAId, type: 'course', id: courseK1Id }
    });

    expectRows(courseRows, 3);
    expect(courseRows.map((row) => row.cohort_id).sort()).toEqual([cohortC1Id, cohortC2Id, cohortC4Id].sort());

    const filtered = await runQuery({
      source: 'cohort_summary',
      dimensions: ['cohort'],
      measures,
      filters: [{ field: 'cohort', op: 'eq', value: cohortC2Id }],
      scope: { orgId: orgAId, type: 'org', id: orgAId }
    });

    expectRows(filtered, 1);
    expect(filtered[0].cohort_id).toBe(cohortC2Id);

    const courseFiltered = await runQuery({
      source: 'cohort_summary',
      dimensions: ['cohort'],
      measures,
      filters: [{ field: 'course', op: 'eq', value: courseK2Id }],
      scope: { orgId: orgAId, type: 'org', id: orgAId }
    });

    expectRows(courseFiltered, 1);
    expect(courseFiltered[0].cohort_id).toBe(cohortC1Id);

    const searched = await runQuery({
      source: 'cohort_summary',
      dimensions: ['cohort'],
      measures,
      search: `C2-${suffix}`,
      scope: { orgId: orgAId, type: 'org', id: orgAId }
    });

    expectRows(searched, 1);
    expect(searched[0].cohort_id).toBe(cohortC2Id);
  });

  it('does not leak an overdue course into a cohort that does not take it', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const { eq } = await import('drizzle-orm');

    const [cohort] = await db
      .insert(schema.cohort)
      .values({ organizationId: orgAId, name: `C5-${suffix}`, status: 'ACTIVE' })
      .returning();

    try {
      await db.insert(schema.cohortCourse).values({ cohortId: cohort.id, courseId: courseK2Id });
      await db.insert(schema.cohortMember).values({
        cohortId: cohort.id,
        profileId: profiles.L1,
        roleId: ROLE.STUDENT,
        email: `L1-c5-${suffix}@insights.test`
      });

      const rows = await runQuery({
        source: 'cohort_summary',
        dimensions: ['cohort'],
        measures: [
          { metric: 'students', agg: 'value' },
          { metric: 'overdue_students', agg: 'value' }
        ],
        scope: { orgId: orgAId, type: 'org', id: orgAId }
      });
      const row = rows.find((entry) => entry.cohort_id === cohort.id);

      expect(row).toMatchObject({ students__value: 1, overdue_students__value: 0 });
    } finally {
      await db.delete(schema.cohortMember).where(eq(schema.cohortMember.cohortId, cohort.id));
      await db.delete(schema.cohortCourse).where(eq(schema.cohortCourse.cohortId, cohort.id));
      await db.delete(schema.cohort).where(eq(schema.cohort.id, cohort.id));
    }
  });

  it('lists each overdue student once with every overdue course and the goal flag', async () => {
    const rows = await runQuery({
      source: 'overdue_student',
      dimensions: ['student'],
      measures: [
        rowCountMeasure,
        { metric: 'name', agg: 'value' },
        { metric: 'course_titles', agg: 'value' },
        { metric: 'item_titles', agg: 'value' },
        { metric: 'course_progress_pct', agg: 'value' },
        { metric: 'days_overdue', agg: 'value' },
        { metric: 'has_goal', agg: 'value' }
      ]
    });

    expectRows(rows, 3);
    const byStudent = indexRows(rows, 'student_label');

    expect(byStudent.get('L2')).toMatchObject({
      course_titles__value: 'K1',
      course_progress_pct__value: 0,
      days_overdue__value: 3,
      has_goal__value: true
    });
    expect(byStudent.get('L3')).toMatchObject({
      course_titles__value: 'K1',
      course_progress_pct__value: 0,
      days_overdue__value: 5,
      has_goal__value: true
    });
    expect(byStudent.get('L4')).toMatchObject({
      course_titles__value: 'K1',
      course_progress_pct__value: 0,
      days_overdue__value: 2,
      has_goal__value: false
    });

    const sortedRows = await runQuery({
      source: 'overdue_student',
      dimensions: ['student'],
      measures: [
        { metric: 'days_overdue', agg: 'value' },
        { metric: 'has_goal', agg: 'value' }
      ],
      sort: [
        { field: 'has_goal__value', dir: 'desc' },
        { field: 'days_overdue__value', dir: 'desc' }
      ]
    });

    expect(sortedRows.map((row) => row.student_label)).toEqual(['L3', 'L2', 'L4']);
  });

  it('names the section of the first incomplete item, or the item title when it has none', async () => {
    const { getInsightsCourseStructure, toOrderedItems } = await import('@api/services/insights/structure');
    const k1Items = toOrderedItems(await getInsightsCourseStructure(orgAId, courseK1Id));
    const k2Items = toOrderedItems(await getInsightsCourseStructure(orgAId, courseK2Id));

    const l3K1 = await runQuery({
      source: 'student_course',
      dimensions: ['course'],
      filters: [{ field: 'student', op: 'eq', value: profiles.L3 }],
      measures: [{ metric: 'now_at_title', agg: 'value' }],
      scope: { orgId: orgAId, type: 'course', id: courseK1Id },
      orderedItems: k1Items
    });

    expect(l3K1[0]).toMatchObject({ now_at_title__value: 'S1' });

    const l2K2 = await runQuery({
      source: 'student_course',
      dimensions: ['course'],
      filters: [{ field: 'student', op: 'eq', value: profiles.L2 }],
      measures: [{ metric: 'now_at_title', agg: 'value' }],
      scope: { orgId: orgAId, type: 'course', id: courseK2Id },
      orderedItems: k2Items
    });

    expect(l2K2[0]).toMatchObject({ now_at_title__value: 'E6' });
  });

  it('windows attempts and first-try passes without hiding the standing state', async () => {
    const scopeR: Scope = { orgId: orgPId, type: 'course', id: courseKRId };
    const measures: Measure[] = [
      { metric: 'best_score_pct', agg: 'value' },
      { metric: 'attempts', agg: 'value' },
      { metric: 'passed_first_try', agg: 'value' },
      { metric: 'state', agg: 'value' }
    ];

    const allTime = await runQuery({
      source: 'assessment_result',
      dimensions: ['exercise'],
      measures,
      scope: scopeR
    });

    expectRows(allTime, 1);
    expect(allTime[0]).toMatchObject({
      best_score_pct__value: 90,
      attempts__value: 2,
      passed_first_try__value: true,
      state__value: 'graded'
    });

    const thirtyDays = await runQuery({
      source: 'assessment_result',
      dimensions: ['exercise'],
      measures,
      scope: scopeR,
      range: '30d'
    });

    expectRows(thirtyDays, 1);
    expect(thirtyDays[0]).toMatchObject({
      best_score_pct__value: 80,
      attempts__value: 1,
      passed_first_try__value: null,
      state__value: 'graded'
    });

    const avgScoreMeasures: Measure[] = [{ metric: 'avg_score_pct', agg: 'value' }];
    const avgScoreFilters = [{ field: 'student' as const, op: 'eq' as const, value: profiles.P1 }];

    const allTimeAvg = await runQuery({
      source: 'student_course',
      dimensions: ['student'],
      filters: avgScoreFilters,
      measures: avgScoreMeasures,
      scope: scopeR
    });

    expect(allTimeAvg[0]).toMatchObject({ avg_score_pct__value: 90 });

    const thirtyDaysAvg = await runQuery({
      source: 'student_course',
      dimensions: ['student'],
      filters: avgScoreFilters,
      measures: avgScoreMeasures,
      scope: scopeR,
      range: '30d'
    });

    expect(thirtyDaysAvg[0]).toMatchObject({ avg_score_pct__value: 80 });
  });

  it('takes question results from the best graded attempt inside the range', async () => {
    const scopeR: Scope = { orgId: orgPId, type: 'course', id: courseKRId };
    const measures: Measure[] = [
      { metric: 'correct_pct', agg: 'value' },
      { metric: 'wrong_answer', agg: 'value' }
    ];

    const allTime = await runQuery({
      source: 'question_result',
      dimensions: ['exercise', 'question'],
      measures,
      scope: scopeR
    });

    expect(allTime[0]).toMatchObject({ correct_pct__value: 90 });

    const week = await runQuery({
      source: 'question_result',
      dimensions: ['exercise', 'question'],
      measures,
      scope: scopeR,
      range: '7d'
    });

    expect(week[0]).toMatchObject({ correct_pct__value: 80 });
  });

  it('keeps standing columns identical under a range and all time', async () => {
    const scopeK1: Scope = { orgId: orgAId, type: 'course', id: courseK1Id };
    const measures: Measure[] = [
      { metric: 'progress_pct', agg: 'value' },
      { metric: 'pass_mark_passed', agg: 'value' },
      { metric: 'is_completed', agg: 'value' }
    ];

    const allTime = await runQuery({
      source: 'student_course',
      dimensions: ['student', 'course'],
      measures,
      scope: scopeK1
    });

    const week = await runQuery({
      source: 'student_course',
      dimensions: ['student', 'course'],
      measures,
      scope: scopeK1,
      range: '7d'
    });

    expect(week).toEqual(allTime);

    const studentAllTime = await runQuery({
      source: 'student',
      dimensions: ['student'],
      measures: [{ metric: 'status', agg: 'value' }],
      scope: scopeK1
    });

    const studentWeek = await runQuery({
      source: 'student',
      dimensions: ['student'],
      measures: [{ metric: 'status', agg: 'value' }],
      scope: scopeK1,
      range: '7d'
    });

    expect(studentWeek).toEqual(studentAllTime);
  });

  it('grows the organization chart on daily or weekly buckets by range', async () => {
    const scopeP: Scope = { orgId: orgPId, type: 'org', id: orgPId };
    const measures: Measure[] = [
      { metric: 'members_added', agg: 'value' },
      { metric: 'members_total', agg: 'value' }
    ];

    for (const [range, expectedRows] of [
      ['all', 6],
      ['7d', 7],
      ['30d', 30],
      ['90d', 13]
    ] as const) {
      const rows = await runQuery({ source: 'org_member', dimensions: ['period'], measures, scope: scopeP, range });

      expectRows(rows, expectedRows);
      expect(rows.at(-1)?.members_total__value).toBe(4);

      for (let index = 1; index < rows.length; index += 1) {
        expect(Number(rows[index].members_total__value)).toBeGreaterThanOrEqual(
          Number(rows[index - 1].members_total__value)
        );
      }
    }
  });

  it('widens the login window with the range', async () => {
    const rows = await runQuery({
      source: 'login_day',
      dimensions: ['day'],
      measures: [rowCountMeasure, { metric: 'logged_in', agg: 'count_if' }],
      filters: [{ field: 'student', op: 'eq', value: profiles.P1 }],
      scope: { orgId: orgPId, type: 'org', id: orgPId },
      range: '90d'
    });

    expectRows(rows, 90);
    expect(rows.reduce((total, row) => total + Number(row.logged_in__count_if), 0)).toBe(1);
  });

  it('keeps progress, assessment completion and course completion in parity with the shared helpers', async () => {
    const { getCourseProgress } = await import('@cio/db/queries/course/course');
    const { getBatchCompletedExerciseIdsForMembers } = await import('@cio/db/queries/course/member-progress');
    const { calcCourseProgressPercent } = await import('@api/utils/course-completion');

    const studentCourseRows = await runQuery({
      source: 'student_course',
      dimensions: ['student', 'course'],
      measures: [
        { metric: 'progress_pct', agg: 'value' },
        { metric: 'is_completed', agg: 'value' }
      ]
    });

    for (const row of studentCourseRows) {
      const studentLabel = String(row.student_label);
      const courseLabel = String(row.course_label);
      const profileId = studentsByLabel[studentLabel];
      const courseId = coursesByLabel[courseLabel];
      const progress = await getCourseProgress(courseId, profileId);
      const expectedProgress = calcCourseProgressPercent({
        lessonsCompleted: progress.lessonsCompleted,
        totalLessons: progress.lessonsCount,
        exercisesCompleted: progress.exercisesCompleted,
        exercisesCount: progress.exercisesCount
      });
      const hasContent = progress.lessonsCount + progress.exercisesCount > 0;

      expect(row.progress_pct__value).toBe(expectedProgress);
      expect(row.is_completed__value).toBe(hasContent && expectedProgress === 100);
    }

    const assessmentRows = await runQuery({
      source: 'assessment_result',
      dimensions: ['student', 'exercise'],
      measures: [{ metric: 'is_complete', agg: 'value' }]
    });
    const completedByCourse: Record<string, Map<string, Set<string>>> = {};
    for (const courseLabel of ['K1', 'K2']) {
      const memberIds = Object.values(membersByCourse[courseLabel]);
      completedByCourse[courseLabel] = await getBatchCompletedExerciseIdsForMembers(
        coursesByLabel[courseLabel],
        memberIds
      );
    }

    for (const row of assessmentRows) {
      const studentLabel = String(row.student_label);
      const exerciseLabel = String(row.exercise_label);
      const courseLabel = exerciseLabel === 'E6' ? 'K2' : 'K1';
      const groupMemberId = membersByCourse[courseLabel][studentLabel];
      const completed = completedByCourse[courseLabel].get(groupMemberId)?.has(exercisesByLabel[exerciseLabel]);

      expect(row.is_complete__value).toBe(Boolean(completed));
    }
  }, 30_000);

  it('counts a completion inside the week window', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const { and, eq } = await import('drizzle-orm');

    const [course] = await db
      .select({ groupId: schema.course.groupId })
      .from(schema.course)
      .where(eq(schema.course.id, courseKPId));
    const groupId = course?.groupId;

    if (!groupId) throw new Error('The period course is missing its group');

    const [member] = await db
      .update(schema.groupmember)
      .set({ createdAt: isoDaysAgo(2), certificateEarnedAt: isoDaysAgo(2) })
      .where(and(eq(schema.groupmember.groupId, groupId), eq(schema.groupmember.profileId, profiles.P1)))
      .returning();

    if (!member) throw new Error('The period student is missing their course membership');

    await db.insert(schema.lessonCompletion).values({
      lessonId: lessonLPId,
      profileId: profiles.P1,
      isComplete: true,
      createdAt: isoDaysAgo(2),
      updatedAt: isoDaysAgo(2)
    });

    await db.insert(schema.submission).values({
      exerciseId: exercisesByLabel.EP,
      courseId: courseKPId,
      submittedBy: member.id,
      statusId: 1,
      gradingState: 'completed',
      total: 100,
      createdAt: isoDaysAgo(2),
      updatedAt: isoDaysAgo(2)
    });

    const rows = await runQuery({
      source: 'student_course',
      dimensions: ['student', 'course'],
      filters: [{ field: 'student', op: 'eq', value: profiles.P1 }],
      measures: [
        { metric: 'is_completed', agg: 'value' },
        { metric: 'completed_in_period', agg: 'value' },
        { metric: 'progress_pct_at_period_start', agg: 'value' }
      ],
      scope: { orgId: orgPId, type: 'course', id: courseKPId },
      range: '7d'
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      is_completed__value: true,
      completed_in_period__value: true,
      progress_pct_at_period_start__value: 0
    });
  });
});
