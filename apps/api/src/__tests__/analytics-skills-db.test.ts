import 'dotenv/config';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { inArray } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';
import { ZAnalyticsQuerySpec } from '@cio/utils/validation/analytics';
import { computeDiscrimination, computeFacility } from '@cio/question-types/item-analysis';
import { computeSkillMastery } from '@cio/question-types/skill-mastery';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

describe.skipIf(!hasDatabase)('skill mastery and item analysis metrics against the database', () => {
  const suffix = `${Date.now()}`;
  const userIds: string[] = [];
  const organizationIds: string[] = [];
  const groupIds: string[] = [];
  const courseIds: string[] = [];
  const exerciseIds: string[] = [];
  const cohortIds: string[] = [];

  let orgId = '';
  let courseId = '';
  let cohortId = '';
  let skillAId = '';
  let skillCId = '';
  const profiles: Record<string, string> = {};
  const questionIds: Record<string, number> = {};
  const q3Points: number[] = [];
  const q1Points: number[] = [];
  const q2Points: number[] = [];
  const c1Points = [1, 1, 0, 1, 1, 1];
  const c2Points = [0, 0, 0, 1, 0, 0];

  const run = async (
    source: string,
    dimensions: string[],
    measures: Array<{ metric: string; agg: string }>,
    scope: { type: 'cohort' | 'course' | 'org'; id: string } = { type: 'course', id: courseId },
    filters: Array<Record<string, unknown>> = []
  ) => {
    const { runAnalyticsQuery } = await import('@cio/db/queries/analytics');
    const { groupCommonWrongAnswers } = await import('@api/services/analytics/wrong-answers');
    const spec = ZAnalyticsQuerySpec.parse({ source, dimensions, measures, filters, limit: 100 });
    const output = await runAnalyticsQuery(spec, { scope: { orgId, ...scope }, orderedItems: [] });
    const grouped = await groupCommonWrongAnswers(output);

    return grouped.rows as Array<Record<string, unknown>>;
  };

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

    const [org] = await db
      .insert(schema.organization)
      .values({ name: `Skills ${suffix}`, siteName: `skills-${suffix}` })
      .returning();
    orgId = org.id;
    organizationIds.push(orgId);

    const [group] = await db
      .insert(schema.group)
      .values({ name: `G-${suffix}`, organizationId: orgId })
      .returning();
    groupIds.push(group.id);
    const [course] = await db
      .insert(schema.course)
      .values({
        title: 'Skills course',
        description: 'd',
        groupId: group.id,
        slug: `skills-${suffix}`,
        status: 'ACTIVE'
      })
      .returning();
    courseId = course.id;
    courseIds.push(courseId);

    const [cohort] = await db
      .insert(schema.cohort)
      .values({ organizationId: orgId, name: `Cohort-${suffix}`, status: 'ACTIVE' })
      .returning();
    cohortId = cohort.id;
    cohortIds.push(cohortId);
    await db.insert(schema.cohortCourse).values({ cohortId, courseId });

    const members: Record<string, string> = {};
    for (let index = 1; index <= 10; index += 1) {
      const label = `S${index}`;
      const email = `${label.toLowerCase()}-${suffix}@skills.test`;
      const [user] = await db.insert(schema.user).values({ name: label, email, emailVerified: true }).returning();
      userIds.push(user.id);
      await db
        .insert(schema.profile)
        .values({ id: user.id, fullname: label, username: `${label.toLowerCase()}-${suffix}`, email });
      profiles[label] = user.id;
      await db
        .insert(schema.organizationmember)
        .values({ organizationId: orgId, roleId: ROLE.STUDENT, profileId: user.id, email, status: 'ACTIVE' });
      const [member] = await db
        .insert(schema.groupmember)
        .values({ groupId: group.id, roleId: ROLE.STUDENT, profileId: user.id, email })
        .returning();
      members[label] = member.id;
      await db.insert(schema.cohortMember).values({ cohortId, profileId: user.id, roleId: ROLE.STUDENT, email });
    }

    const [skillA] = await db
      .insert(schema.skill)
      .values({ organizationId: orgId, code: `A.${suffix}`, name: 'Skill A' })
      .returning();
    const [skillB] = await db
      .insert(schema.skill)
      .values({ organizationId: orgId, code: `B.${suffix}`, name: 'Skill B' })
      .returning();
    const [skillC] = await db
      .insert(schema.skill)
      .values({ organizationId: orgId, code: `C.${suffix}`, name: 'Skill C' })
      .returning();
    skillAId = skillA.id;
    skillCId = skillC.id;

    const makeExercise = async (label: string, order: number) => {
      const [exercise] = await db
        .insert(schema.exercise)
        .values({
          title: label,
          courseId,
          order,
          slug: `${label.toLowerCase()}-${suffix}`,
          completionPolicy: 'submitted',
          isUnlocked: true
        })
        .returning();
      exerciseIds.push(exercise.id);

      return exercise;
    };
    const makeQuestion = async (exerciseId: string, label: string, points: number, skillId: string) => {
      const [question] = await db
        .insert(schema.question)
        .values({ exerciseId, questionTypeId: 1, title: label, points, order: 1 })
        .returning();
      questionIds[label] = question.id;
      await db.insert(schema.questionSkill).values({ questionId: question.id, skillId });

      return question;
    };

    const exerciseE = await makeExercise('E', 1);
    const exerciseF = await makeExercise('F', 2);
    const q1 = await makeQuestion(exerciseE.id, 'Q1', 2, skillA.id);
    const q2 = await makeQuestion(exerciseE.id, 'Q2', 1, skillB.id);
    const q3 = await makeQuestion(exerciseE.id, 'Q3', 20, skillB.id);
    const [optionA] = await db
      .insert(schema.option)
      .values({ questionId: q1.id, label: 'x = 3', isCorrect: false })
      .returning();
    const [optionB] = await db
      .insert(schema.option)
      .values({ questionId: q1.id, label: 'x = -3', isCorrect: false })
      .returning();
    const [optionRight] = await db
      .insert(schema.option)
      .values({ questionId: q1.id, label: 'x = 2', isCorrect: true })
      .returning();

    const submit = async (label: string, exerciseId: string, total: number) => {
      const [submission] = await db
        .insert(schema.submission)
        .values({
          exerciseId,
          courseId,
          submittedBy: members[label],
          statusId: 1,
          gradingState: 'completed',
          total
        })
        .returning();

      return submission;
    };
    const answer = (submissionId: string, label: string, questionId: number, point: number, answerData: object) =>
      db
        .insert(schema.questionAnswer)
        .values({ submissionId, groupMemberId: members[label], questionId, point, answerData: answerData as never });

    for (let index = 1; index <= 10; index += 1) {
      const label = `S${index}`;
      const point1 = index >= 6 ? 2 : 0;
      const point2 = index % 2 === 1 ? 1 : 0;
      const point3 = index * 2;
      q1Points.push(point1);
      q2Points.push(point2);
      q3Points.push(point3);
      const submission = await submit(label, exerciseE.id, point1 + point2 + point3);
      const wrongOption = index <= 3 ? optionA : optionB;
      await answer(submission.id, label, q1.id, point1, {
        type: 'RADIO',
        optionId: point1 > 0 ? optionRight.id : wrongOption.id,
        startedAt: '2026-11-16T10:00:00.000Z',
        answeredAt: `2026-11-16T10:00:${String(10 + index).padStart(2, '0')}.000Z`
      });
      await answer(submission.id, label, q2.id, point2, { optionId: optionRight.id });
      await answer(submission.id, label, q3.id, point3, { optionId: optionRight.id });
    }

    const attempts: Array<[string, number[]]> = [
      ['S1', c1Points],
      ['S2', c2Points]
    ];
    for (const [label, points] of attempts) {
      const submission = await submit(
        label,
        exerciseF.id,
        points.reduce((sum, point) => sum + point, 0)
      );
      for (const [position, point] of points.entries()) {
        const question = await makeQuestion(exerciseF.id, `C${label}${position}`, 1, skillC.id);
        await answer(submission.id, label, question.id, point, { optionId: optionRight.id });
      }
    }
    void skillB;
  });

  afterAll(async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    if (courseIds.length) await db.delete(schema.submission).where(inArray(schema.submission.courseId, courseIds));
    if (exerciseIds.length) await db.delete(schema.exercise).where(inArray(schema.exercise.id, exerciseIds));
    if (cohortIds.length) {
      await db.delete(schema.cohortMember).where(inArray(schema.cohortMember.cohortId, cohortIds));
      await db.delete(schema.cohortCourse).where(inArray(schema.cohortCourse.cohortId, cohortIds));
      await db.delete(schema.cohort).where(inArray(schema.cohort.id, cohortIds));
    }
    if (groupIds.length) await db.delete(schema.groupmember).where(inArray(schema.groupmember.groupId, groupIds));
    if (courseIds.length) await db.delete(schema.course).where(inArray(schema.course.id, courseIds));
    if (groupIds.length) await db.delete(schema.group).where(inArray(schema.group.id, groupIds));
    if (organizationIds.length) {
      await db
        .delete(schema.organizationmember)
        .where(inArray(schema.organizationmember.organizationId, organizationIds));
      await db.delete(schema.organization).where(inArray(schema.organization.id, organizationIds));
    }
    if (userIds.length) {
      await db.delete(schema.profile).where(inArray(schema.profile.id, userIds));
      await db.delete(schema.user).where(inArray(schema.user.id, userIds));
    }
  });

  const itemMeasures = [
    { metric: 'question_facility', agg: 'rate' },
    { metric: 'question_discrimination', agg: 'upper_lower_gap' },
    { metric: 'time_on_question', agg: 'median' },
    { metric: 'common_wrong_answers', agg: 'collect_json' }
  ];

  it('computes facility and discrimination like the TypeScript algorithms', async () => {
    const rows = await run('question_result', ['question'], itemMeasures);
    const byQuestion = new Map(rows.map((row) => [row.question_label, row]));
    const totals = q3Points.map((point, index) => (q1Points[index] + q2Points[index] + point) / 23);
    const expected = (pointsByStudent: number[], max: number) =>
      pointsByStudent.map((point, index) => ({ ratio: point / max, totalRatio: totals[index] }));

    for (const [label, points, max] of [
      ['Q1', q1Points, 2],
      ['Q2', q2Points, 1],
      ['Q3', q3Points, 20]
    ] as const) {
      const row = byQuestion.get(label)!;
      const responses = expected(points, max);

      expect(row.question_facility__rate).toBe(computeFacility(responses));
      expect(row.question_discrimination__upper_lower_gap).toBe(computeDiscrimination(responses));
    }
    expect(byQuestion.get('Q1')!.question_facility__rate).toBe(50);
    expect(byQuestion.get('Q1')!.question_discrimination__upper_lower_gap).toBe(1);
  });

  it('records time on question from the stored start and answer times', async () => {
    const rows = await run('question_result', ['question'], itemMeasures);
    const byQuestion = new Map(rows.map((row) => [row.question_label, row]));

    expect(byQuestion.get('Q1')!.time_on_question__median).toBe(15.5);
    expect(byQuestion.get('Q2')!.time_on_question__median).toBeNull();
  });

  it('groups the most common wrong answers with the results-grid clustering', async () => {
    const rows = await run('question_result', ['question'], itemMeasures);
    const q1 = rows.find((row) => row.question_label === 'Q1')!;

    expect(JSON.parse(q1.common_wrong_answers__collect_json as string)).toEqual([
      expect.objectContaining({ label: 'x = 3', count: 3 }),
      expect.objectContaining({ label: 'x = -3', count: 2 })
    ]);
  });

  it('computes mastery per student and skill like the TypeScript algorithm', async () => {
    const rows = await run(
      'skill_result',
      ['student', 'skill'],
      [
        { metric: 'skill_mastery', agg: 'value' },
        { metric: 'mastery_level', agg: 'value' },
        { metric: 'mastery_evidence', agg: 'value' }
      ],
      { type: 'course', id: courseId },
      [{ field: 'skill', op: 'eq', value: skillCId }]
    );
    const byStudent = new Map(rows.map((row) => [row.student_label, row]));

    for (const [label, points] of [
      ['S1', c1Points],
      ['S2', c2Points]
    ] as const) {
      const expected = computeSkillMastery(points.map((point, position) => ({ ratio: point, attemptedAt: position })));
      const row = byStudent.get(label)!;

      expect(row.skill_mastery__value).toBe(expected.score);
      expect(row.mastery_level__value).toBe(expected.level);
      expect(row.mastery_evidence__value).toBe(expected.evidenceCount);
    }
    expect(byStudent.get('S1')!.mastery_level__value).toBe('mastered');
    expect(byStudent.get('S2')!.mastery_level__value).toBe('learning');
    expect(skillAId).not.toBe('');
  });

  it('works at cohort and org scope', async () => {
    const measures = [{ metric: 'question_facility', agg: 'rate' }];
    const masteryMeasures = [{ metric: 'skill_proficient', agg: 'rate' }];

    for (const scope of [
      { type: 'cohort' as const, id: cohortId },
      { type: 'org' as const, id: orgId }
    ]) {
      const questionRows = await run('question_result', ['question'], measures, scope);
      const skillRows = await run('skill_result', ['skill'], masteryMeasures, scope);

      expect(questionRows.find((row) => row.question_label === 'Q1')!.question_facility__rate).toBe(50);
      expect(skillRows.length).toBeGreaterThanOrEqual(3);
    }
  });
});
