import 'dotenv/config';

import { beforeAll, describe, expect, it } from 'vitest';
import { and, eq } from 'drizzle-orm';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

beforeAll(async () => {
  if (!hasDatabase) return;
  const { db } = await import('@db/drizzle');
  const { sql } = await import('drizzle-orm');
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "activity_completion_side_effect" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "activity_id" uuid NOT NULL,
      "profile_id" uuid NOT NULL,
      "certification_pending" boolean DEFAULT false NOT NULL,
      "compliance_pending" boolean DEFAULT false NOT NULL,
      "generation" integer DEFAULT 0 NOT NULL,
      "attempts" integer DEFAULT 0 NOT NULL,
      "next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
      "last_error" text,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "activity_completion_side_effect_activity_profile_key" UNIQUE("activity_id","profile_id")
    );
    CREATE INDEX IF NOT EXISTS "activity_completion_side_effect_next_attempt_at_idx" ON "activity_completion_side_effect" ("next_attempt_at");
  `);
});

type ResultsFixture = {
  orgId: string;
  groupId: string;
  courseId: string;
  activityId: string;
  profileId: string;
  groupMemberId: string;
  versionId: string;
  unitIds: string[];
};

async function createResultsFixture(suffix: string): Promise<ResultsFixture> {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');

  const [organization] = await db
    .insert(schema.organization)
    .values({ name: `scorm-results-${suffix}` })
    .returning();
  const [group] = await db
    .insert(schema.group)
    .values({ name: `scorm-results-${suffix}`, organizationId: organization.id })
    .returning();
  const [course] = await db
    .insert(schema.course)
    .values({
      title: 'SCORM results',
      description: 'Results, attempts and reset coverage',
      groupId: group.id,
      slug: `scorm-results-${suffix}`,
      type: 'SELF_PACED' as never,
      status: 'ACTIVE'
    })
    .returning();
  const [activity] = await db
    .insert(schema.courseActivity)
    .values({ courseId: course.id, kind: 'scorm', title: 'Package', order: 1 })
    .returning();
  await db.insert(schema.activityScorm).values({ activityId: activity.id });
  const [asset] = await db
    .insert(schema.asset)
    .values({ organizationId: organization.id, kind: 'scorm', title: 'Package zip' })
    .returning();
  const [version] = await db
    .insert(schema.contentPackageVersion)
    .values({
      assetId: asset.id,
      versionNumber: 1,
      isCurrent: true,
      status: 'ready',
      format: 'scorm12',
      uploadKey: `zip/${suffix}.zip`,
      contentPrefix: `scorm/${suffix}/v1`
    })
    .returning();
  const units = await db
    .insert(schema.contentPackageUnit)
    .values([
      {
        packageVersionId: version.id,
        identifier: 'sco-graded',
        title: 'Graded module',
        position: 0,
        unitType: 'sco',
        href: 'quiz.html',
        masteryScoreRaw: '80'
      },
      {
        packageVersionId: version.id,
        identifier: 'sco-plain',
        title: 'Plain module',
        position: 1,
        unitType: 'sco',
        href: 'content.html'
      }
    ])
    .returning();

  const userId = crypto.randomUUID();
  await db
    .insert(schema.user)
    .values({ id: userId, name: `Scorm Results ${suffix}`, email: `sr-${suffix}@example.com` });
  await db.insert(schema.profile).values({
    id: userId,
    fullname: `Scorm Results ${suffix}`,
    username: `scorm-results-${suffix}`,
    email: `sr-${suffix}@example.com`
  });
  const [member] = await db
    .insert(schema.groupmember)
    .values({ groupId: group.id, roleId: 3, profileId: userId, email: `sr-${suffix}@example.com` })
    .returning();

  return {
    orgId: organization.id,
    groupId: group.id,
    courseId: course.id,
    activityId: activity.id,
    profileId: userId,
    groupMemberId: member.id,
    versionId: version.id,
    unitIds: units.map((unit) => unit.id)
  };
}

async function cleanupResultsFixture(ids: ResultsFixture) {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');

  await db.delete(schema.activityCompletion).where(eq(schema.activityCompletion.profileId, ids.profileId));
  await db.delete(schema.courseActivity).where(eq(schema.courseActivity.courseId, ids.courseId));
  await db.delete(schema.asset).where(eq(schema.asset.organizationId, ids.orgId));
  await db.delete(schema.course).where(eq(schema.course.id, ids.courseId));
  await db.delete(schema.groupmember).where(eq(schema.groupmember.id, ids.groupMemberId));
  await db.delete(schema.organizationmember).where(eq(schema.organizationmember.profileId, ids.profileId));
  await db.delete(schema.group).where(eq(schema.group.id, ids.groupId));
  await db.delete(schema.profile).where(eq(schema.profile.id, ids.profileId));
  await db.delete(schema.user).where(eq(schema.user.id, ids.profileId));
  await db.delete(schema.organization).where(eq(schema.organization.id, ids.orgId));
}

function suffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

type TypedUnitSeed = {
  identifier: string;
  title: string;
  href: string;
  masteryScoreRaw?: string | null;
  passingScoreScaled?: string | null;
  completionThreshold?: string | null;
  formatDetails?:
    | { format: 'scorm12'; maxTimeAllowed?: string | null; timeLimitAction?: string | null }
    | { format: 'scorm2004'; maxTimeAllowed: string | null; timeLimitAction: string | null };
};

async function createTypedFixture(
  sfx: string,
  format: 'scorm12' | 'scorm2004_4',
  seeds: TypedUnitSeed[]
): Promise<ResultsFixture> {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');

  const [organization] = await db
    .insert(schema.organization)
    .values({ name: `scorm-typed-${sfx}` })
    .returning();
  const [group] = await db
    .insert(schema.group)
    .values({ name: `scorm-typed-${sfx}`, organizationId: organization.id })
    .returning();
  const [course] = await db
    .insert(schema.course)
    .values({
      title: 'SCORM typed',
      description: 'Typed pass-mark chain',
      groupId: group.id,
      slug: `scorm-typed-${sfx}`,
      type: 'SELF_PACED' as never,
      status: 'ACTIVE'
    })
    .returning();
  const [activity] = await db
    .insert(schema.courseActivity)
    .values({ courseId: course.id, kind: 'scorm', title: 'Package', order: 1 })
    .returning();
  await db.insert(schema.activityScorm).values({ activityId: activity.id });
  const [asset] = await db
    .insert(schema.asset)
    .values({ organizationId: organization.id, kind: 'scorm', title: 'Package zip' })
    .returning();
  const [version] = await db
    .insert(schema.contentPackageVersion)
    .values({
      assetId: asset.id,
      versionNumber: 1,
      isCurrent: true,
      status: 'ready',
      format,
      uploadKey: `zip/${sfx}.zip`,
      contentPrefix: `scorm/${sfx}/v1`
    })
    .returning();
  const units = await db
    .insert(schema.contentPackageUnit)
    .values(
      seeds.map((seed, position) => ({
        packageVersionId: version.id,
        identifier: seed.identifier,
        title: seed.title,
        position,
        unitType: 'sco' as const,
        href: seed.href,
        masteryScoreRaw: seed.masteryScoreRaw ?? null,
        passingScoreScaled: seed.passingScoreScaled ?? null,
        completionThreshold: seed.completionThreshold ?? null,
        formatDetails: (seed.formatDetails ?? { format: 'scorm12' }) as never
      }))
    )
    .returning();

  const userId = crypto.randomUUID();
  await db.insert(schema.user).values({ id: userId, name: `Scorm Typed ${sfx}`, email: `st-${sfx}@example.com` });
  await db.insert(schema.profile).values({
    id: userId,
    fullname: `Scorm Typed ${sfx}`,
    username: `scorm-typed-${sfx}`,
    email: `st-${sfx}@example.com`
  });
  const [member] = await db
    .insert(schema.groupmember)
    .values({ groupId: group.id, roleId: 3, profileId: userId, email: `st-${sfx}@example.com` })
    .returning();

  return {
    orgId: organization.id,
    groupId: group.id,
    courseId: course.id,
    activityId: activity.id,
    profileId: userId,
    groupMemberId: member.id,
    versionId: version.id,
    unitIds: units.map((unit) => unit.id)
  };
}

describe.skipIf(!hasDatabase)('scorm outcome mapping parity', () => {
  it('matches the TypeScript mapping on shared CMI samples', { timeout: 30000 }, async () => {
    const { evaluateTryOutcome } = await import('@db/queries/scorm/outcome');
    const { moduleOutcomeFromCmi } = await import('@cio/activity-packages');

    const samples: Array<{
      cmi: Record<string, unknown>;
      format: 'scorm12' | 'scorm2004_4';
      masteryScoreRaw: number | null;
      passingScoreScaled: number | null;
    }> = [
      {
        cmi: { core: { lesson_status: 'passed' } },
        format: 'scorm12',
        masteryScoreRaw: null,
        passingScoreScaled: null
      },
      {
        cmi: { core: { lesson_status: 'completed' } },
        format: 'scorm12',
        masteryScoreRaw: null,
        passingScoreScaled: null
      },
      {
        cmi: { core: { lesson_status: 'failed' } },
        format: 'scorm12',
        masteryScoreRaw: null,
        passingScoreScaled: null
      },
      {
        cmi: { core: { lesson_status: 'incomplete' } },
        format: 'scorm12',
        masteryScoreRaw: null,
        passingScoreScaled: null
      },
      {
        cmi: { core: { lesson_status: 'browsed' } },
        format: 'scorm12',
        masteryScoreRaw: null,
        passingScoreScaled: null
      },
      {
        cmi: { core: { lesson_status: 'not attempted' } },
        format: 'scorm12',
        masteryScoreRaw: null,
        passingScoreScaled: null
      },
      { cmi: { core: {} }, format: 'scorm12', masteryScoreRaw: null, passingScoreScaled: null },
      { cmi: {}, format: 'scorm12', masteryScoreRaw: null, passingScoreScaled: null },
      {
        cmi: { core: { lesson_status: 'weird-status' } },
        format: 'scorm12',
        masteryScoreRaw: null,
        passingScoreScaled: null
      },
      {
        cmi: { core: { lesson_status: 'PASSED' } },
        format: 'scorm12',
        masteryScoreRaw: null,
        passingScoreScaled: null
      },
      {
        cmi: { core: { lesson_status: '', score: { raw: '85' } } },
        format: 'scorm12',
        masteryScoreRaw: 80,
        passingScoreScaled: null
      },
      {
        cmi: { core: { lesson_status: 'completed', score: { raw: '70', min: '0', max: '100' } } },
        format: 'scorm12',
        masteryScoreRaw: 80,
        passingScoreScaled: null
      },
      {
        cmi: { core: { score: { raw: '30', min: '10', max: '110' } } },
        format: 'scorm12',
        masteryScoreRaw: null,
        passingScoreScaled: null
      },
      {
        cmi: { core: { lesson_status: 'completed', score: { raw: '8', max: '10' } } },
        format: 'scorm12',
        masteryScoreRaw: null,
        passingScoreScaled: null
      },
      {
        cmi: { core: { score: { raw: 'not-a-number' } } },
        format: 'scorm12',
        masteryScoreRaw: null,
        passingScoreScaled: null
      },
      {
        cmi: { completion_status: 'completed', success_status: 'passed', score: { scaled: '0.9' } },
        format: 'scorm2004_4',
        masteryScoreRaw: null,
        passingScoreScaled: 0.8
      },
      {
        cmi: { completion_status: 'incomplete', success_status: 'failed' },
        format: 'scorm2004_4',
        masteryScoreRaw: null,
        passingScoreScaled: null
      },
      {
        cmi: { completion_status: 'COMPLETED', success_status: '' },
        format: 'scorm2004_4',
        masteryScoreRaw: null,
        passingScoreScaled: null
      },
      { cmi: {}, format: 'scorm2004_4', masteryScoreRaw: null, passingScoreScaled: null }
    ];

    for (const sample of samples) {
      const fromSql = await evaluateTryOutcome(sample);
      const fromTs = moduleOutcomeFromCmi(sample.cmi, sample.format, {
        masteryScoreRaw: sample.masteryScoreRaw,
        passingScoreScaled: sample.passingScoreScaled
      });

      expect(fromSql, JSON.stringify(sample)).toEqual({
        completion: fromTs.completion,
        success: fromTs.success,
        scaledScore: fromTs.scaledScore,
        hasPassMark: fromTs.hasPassMark
      });
    }
  });

  it('carries typed pass marks from manifest through rules with TS/SQL parity', { timeout: 60000 }, async () => {
    const { parseScormManifest, applyLmsRules, isScormRuleMet, moduleOutcomeFromCmi } = await import(
      '@cio/activity-packages'
    );
    const { evaluateTryOutcome } = await import('@db/queries/scorm/outcome');

    const manifest12 = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="T12" version="1"
  xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3">
  <metadata><schema>ADL SCORM</schema><schemaversion>1.2</schemaversion></metadata>
  <organizations default="ORG-1"><organization identifier="ORG-1"><title>Typed</title>
    <item identifier="QUIZ" identifierref="RES-Q"><title>Quiz</title><adlcp:masteryscore>80</adlcp:masteryscore></item>
    <item identifier="PLAIN12" identifierref="RES-P"><title>Plain</title></item>
  </organization></organizations>
  <resources>
    <resource identifier="RES-Q" type="webcontent" adlcp:scormType="sco" href="quiz.html"><file href="quiz.html"/></resource>
    <resource identifier="RES-P" type="webcontent" adlcp:scormType="sco" href="plain.html"><file href="plain.html"/></resource>
  </resources>
</manifest>`;
    const manifest2004 = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="T04" version="1"
  xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3">
  <metadata><schema>ADL SCORM</schema><schemaversion>2004 4th Edition</schemaversion></metadata>
  <organizations default="ORG-1"><organization identifier="ORG-1"><title>Typed</title>
    <item identifier="PASS" identifierref="RES-PASS"><title>Graded</title><imsss:objectives xmlns:imsss="http://www.imsglobal.org/xsd/imsss"><imsss:primaryObjective satisfiedByMeasure="true"><imsss:minNormalizedMeasure>0.8</imsss:minNormalizedMeasure></imsss:primaryObjective></imsss:objectives></item>
    <item identifier="TH" identifierref="RES-TH"><title>Threshold</title><adlcp:completionThreshold>0.6</adlcp:completionThreshold><imsss:maxTimeAllowed xmlns:imsss="http://www.imsglobal.org/xsd/imsss">PT45M</imsss:maxTimeAllowed></item>
    <item identifier="PLAIN04" identifierref="RES-PLAIN"><title>Plain</title></item>
  </organization></organizations>
  <resources>
    <resource identifier="RES-PASS" type="webcontent" adlcp:scormType="sco" href="pass.html"><file href="pass.html"/></resource>
    <resource identifier="RES-TH" type="webcontent" adlcp:scormType="sco" href="th.html"><file href="th.html"/></resource>
    <resource identifier="RES-PLAIN" type="webcontent" adlcp:scormType="sco" href="plain.html"><file href="plain.html"/></resource>
  </resources>
</manifest>`;

    const parsed12 = parseScormManifest(manifest12, ['quiz.html', 'plain.html']);
    expect(parsed12.format).toBe('scorm12');
    expect(parsed12.units).toHaveLength(2);
    const quizUnit = parsed12.units.find((unit) => unit.identifier === 'QUIZ')!;
    expect(quizUnit.masteryScoreRaw).toBe(80);
    expect(quizUnit.passingScoreScaled).toBeNull();
    expect(quizUnit.completionThreshold).toBeNull();
    expect(quizUnit.formatDetails).toEqual({ format: 'scorm12' });

    const parsed2004 = parseScormManifest(manifest2004, ['pass.html', 'th.html', 'plain.html']);
    expect(parsed2004.format).toBe('scorm2004_4');
    expect(parsed2004.units).toHaveLength(3);
    const passUnit = parsed2004.units.find((unit) => unit.identifier === 'PASS')!;
    const thresholdUnit = parsed2004.units.find((unit) => unit.identifier === 'TH')!;
    expect(passUnit.passingScoreScaled).toBe(0.8);
    expect(passUnit.completionThreshold).toBeNull();
    expect(thresholdUnit.passingScoreScaled).toBeNull();
    expect(thresholdUnit.completionThreshold).toBe(0.6);
    expect(thresholdUnit.formatDetails).toEqual({
      format: 'scorm2004',
      maxTimeAllowed: 'PT45M',
      timeLimitAction: null
    });

    const toInserted = (unit: {
      masteryScoreRaw: number | null;
      passingScoreScaled: number | null;
      completionThreshold: number | null;
    }) => ({
      masteryScoreRaw: unit.masteryScoreRaw == null ? null : String(unit.masteryScoreRaw),
      passingScoreScaled: unit.passingScoreScaled == null ? null : String(unit.passingScoreScaled),
      completionThreshold: unit.completionThreshold == null ? null : String(unit.completionThreshold)
    });
    expect(toInserted(quizUnit)).toEqual({
      masteryScoreRaw: '80',
      passingScoreScaled: null,
      completionThreshold: null
    });
    expect(toInserted(passUnit)).toEqual({
      masteryScoreRaw: null,
      passingScoreScaled: '0.8',
      completionThreshold: null
    });
    expect(toInserted(thresholdUnit)).toEqual({
      masteryScoreRaw: null,
      passingScoreScaled: null,
      completionThreshold: '0.6'
    });

    const ruledQuiz = applyLmsRules(
      { core: { score: { raw: 85 } } },
      { masteryScoreRaw: quizUnit.masteryScoreRaw, passingScoreScaled: null, completionThreshold: null },
      'scorm12',
      { terminated: false }
    );
    expect(ruledQuiz).toMatchObject({ core: { lesson_status: 'passed' } });

    const ruledThreshold = applyLmsRules(
      { progress_measure: '0.7' },
      { masteryScoreRaw: null, passingScoreScaled: null, completionThreshold: thresholdUnit.completionThreshold },
      'scorm2004_4',
      { terminated: true }
    );
    expect(ruledThreshold).toMatchObject({ completion_status: 'completed' });

    const fixture12 = await createTypedFixture(suffix(), 'scorm12', [
      {
        identifier: 'QUIZ',
        title: 'Quiz',
        href: 'quiz.html',
        masteryScoreRaw: '80',
        formatDetails: { format: 'scorm12' }
      },
      { identifier: 'PLAIN12', title: 'Plain', href: 'plain.html', formatDetails: { format: 'scorm12' } }
    ]);
    const fixture2004 = await createTypedFixture(suffix(), 'scorm2004_4', [
      {
        identifier: 'PASS',
        title: 'Graded',
        href: 'pass.html',
        passingScoreScaled: '0.8',
        formatDetails: { format: 'scorm2004', maxTimeAllowed: null, timeLimitAction: null }
      },
      {
        identifier: 'TH',
        title: 'Threshold',
        href: 'th.html',
        completionThreshold: '0.6',
        formatDetails: { format: 'scorm2004', maxTimeAllowed: 'PT45M', timeLimitAction: null }
      },
      {
        identifier: 'PLAIN04',
        title: 'Plain',
        href: 'plain.html',
        formatDetails: { format: 'scorm2004', maxTimeAllowed: null, timeLimitAction: null }
      }
    ]);

    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const { listScormResults } = await import('@cio/core/services/activity/providers/scorm/results');

      const [attempt12] = await db
        .insert(schema.scormAttempt)
        .values({
          activityId: fixture12.activityId,
          profileId: fixture12.profileId,
          packageVersionId: fixture12.versionId,
          attemptNumber: 1
        })
        .returning();
      await db.insert(schema.scormScoAttempt).values([
        {
          attemptId: attempt12!.id,
          unitId: fixture12.unitIds[0]!,
          status: 'closed',
          cmi: ruledQuiz,
          commitSeq: 1,
          lastCommitAt: new Date().toISOString(),
          terminatedAt: new Date().toISOString()
        },
        {
          attemptId: attempt12!.id,
          unitId: fixture12.unitIds[1]!,
          status: 'closed',
          cmi: { core: { lesson_status: 'completed' } },
          commitSeq: 1,
          lastCommitAt: new Date().toISOString(),
          terminatedAt: new Date().toISOString()
        }
      ]);

      const [attempt2004] = await db
        .insert(schema.scormAttempt)
        .values({
          activityId: fixture2004.activityId,
          profileId: fixture2004.profileId,
          packageVersionId: fixture2004.versionId,
          attemptNumber: 1
        })
        .returning();
      await db.insert(schema.scormScoAttempt).values([
        {
          attemptId: attempt2004!.id,
          unitId: fixture2004.unitIds[0]!,
          status: 'closed',
          cmi: { completion_status: 'completed', success_status: 'passed', score: { scaled: '0.9' } },
          commitSeq: 1,
          lastCommitAt: new Date().toISOString(),
          terminatedAt: new Date().toISOString()
        },
        {
          attemptId: attempt2004!.id,
          unitId: fixture2004.unitIds[1]!,
          status: 'closed',
          cmi: ruledThreshold,
          commitSeq: 1,
          lastCommitAt: new Date().toISOString(),
          terminatedAt: new Date().toISOString()
        },
        {
          attemptId: attempt2004!.id,
          unitId: fixture2004.unitIds[2]!,
          status: 'closed',
          cmi: { completion_status: 'completed' },
          commitSeq: 1,
          lastCommitAt: new Date().toISOString(),
          terminatedAt: new Date().toISOString()
        }
      ]);

      const expected12 = [
        moduleOutcomeFromCmi(ruledQuiz, 'scorm12', { masteryScoreRaw: 80, passingScoreScaled: null }),
        moduleOutcomeFromCmi({ core: { lesson_status: 'completed' } }, 'scorm12', {
          masteryScoreRaw: null,
          passingScoreScaled: null
        })
      ];
      expect(isScormRuleMet({ rule: 'auto' }, expected12)).toBe(true);

      const expected2004 = [
        moduleOutcomeFromCmi(
          { completion_status: 'completed', success_status: 'passed', score: { scaled: '0.9' } },
          'scorm2004_4',
          { masteryScoreRaw: null, passingScoreScaled: 0.8 }
        ),
        moduleOutcomeFromCmi(ruledThreshold, 'scorm2004_4', { masteryScoreRaw: null, passingScoreScaled: null }),
        moduleOutcomeFromCmi({ completion_status: 'completed' }, 'scorm2004_4', {
          masteryScoreRaw: null,
          passingScoreScaled: null
        })
      ];
      expect(isScormRuleMet({ rule: 'auto' }, expected2004)).toBe(true);

      for (const [cmi, format, unit] of [
        [ruledQuiz, 'scorm12', { masteryScoreRaw: 80, passingScoreScaled: null }],
        [{ core: { lesson_status: 'completed' } }, 'scorm12', { masteryScoreRaw: null, passingScoreScaled: null }],
        [
          { completion_status: 'completed', success_status: 'passed', score: { scaled: '0.9' } },
          'scorm2004_4',
          { masteryScoreRaw: null, passingScoreScaled: 0.8 }
        ],
        [ruledThreshold, 'scorm2004_4', { masteryScoreRaw: null, passingScoreScaled: null }],
        [{ completion_status: 'completed' }, 'scorm2004_4', { masteryScoreRaw: null, passingScoreScaled: null }]
      ] as Array<
        [
          Record<string, unknown>,
          'scorm12' | 'scorm2004_4',
          { masteryScoreRaw: number | null; passingScoreScaled: number | null }
        ]
      >) {
        const fromSql = await evaluateTryOutcome({
          cmi: cmi as Record<string, unknown>,
          format,
          masteryScoreRaw: unit.masteryScoreRaw,
          passingScoreScaled: unit.passingScoreScaled
        });
        const fromTs = moduleOutcomeFromCmi(cmi as Record<string, unknown>, format, unit);

        expect(fromSql).toEqual({
          completion: fromTs.completion,
          success: fromTs.success,
          scaledScore: fromTs.scaledScore,
          hasPassMark: fromTs.hasPassMark
        });
      }

      const listed12 = await listScormResults(fixture12.activityId, [fixture12.profileId], {
        page: 1,
        limit: 20,
        sort: 'name',
        direction: 'asc'
      });
      expect(listed12.learners).toHaveLength(1);
      expect(listed12.learners[0]?.scorePercent).toBe(85);
      expect(listed12.learners[0]?.passFail).toBe('passed');

      const listed2004 = await listScormResults(fixture2004.activityId, [fixture2004.profileId], {
        page: 1,
        limit: 20,
        sort: 'name',
        direction: 'asc'
      });
      expect(listed2004.learners).toHaveLength(1);
      expect(listed2004.learners[0]?.scorePercent).toBe(90);
      expect(listed2004.learners[0]?.passFail).toBe('passed');
    } finally {
      await cleanupResultsFixture(fixture12);
      await cleanupResultsFixture(fixture2004);
    }
  });
});

describe.skipIf(!hasDatabase)('scorm results and reset', () => {
  it(
    'lists learner rows with scores, agrees with the TypeScript rule, and summarizes',
    { timeout: 30000 },
    async () => {
      const ids = await createResultsFixture(suffix());
      try {
        const { db } = await import('@db/drizzle');
        const schema = await import('@db/schema');
        const { listScormResults } = await import('@cio/core/services/activity/providers/scorm/results');
        const { isScormRuleMet } = await import('@cio/activity-packages');

        const [attempt] = await db
          .insert(schema.scormAttempt)
          .values({
            activityId: ids.activityId,
            profileId: ids.profileId,
            packageVersionId: ids.versionId,
            attemptNumber: 1
          })
          .returning();
        await db.insert(schema.scormScoAttempt).values([
          {
            attemptId: attempt!.id,
            unitId: ids.unitIds[0]!,
            status: 'closed',
            cmi: { core: { lesson_status: 'passed', score: { raw: '90' } } },
            commitSeq: 3,
            lastCommitAt: new Date().toISOString(),
            terminatedAt: new Date().toISOString()
          },
          {
            attemptId: attempt!.id,
            unitId: ids.unitIds[1]!,
            status: 'closed',
            cmi: { core: { lesson_status: 'completed' } },
            commitSeq: 2,
            lastCommitAt: new Date().toISOString(),
            terminatedAt: new Date().toISOString()
          }
        ]);
        await db.insert(schema.activityCompletion).values({
          activityId: ids.activityId,
          profileId: ids.profileId,
          isComplete: true,
          completedAt: new Date().toISOString()
        });

        const { summary, learners, total } = await listScormResults(ids.activityId, [ids.profileId], {
          page: 1,
          limit: 20,
          sort: 'name',
          direction: 'asc'
        });

        expect(total).toBe(1);
        expect(learners).toHaveLength(1);

        const learner = learners[0]!;
        expect(learner.attempts).toBe(1);
        expect(learner.status).toBe('completed');
        expect(learner.passFail).toBe('passed');
        expect(learner.scorePercent).toBe(90);
        expect(learner.bestScorePercent).toBe(90);

        const ruleMet = isScormRuleMet({ rule: 'auto', minScorePercent: null }, [
          { completion: 'completed', success: 'passed', hasPassMark: true, scaledScore: 0.9 },
          { completion: 'completed', success: 'unknown', hasPassMark: false, scaledScore: null }
        ]);
        expect(ruleMet).toBe(true);

        expect(summary).toEqual({ enrolled: 1, started: 1, completed: 1, passed: 1, averageScore: 90 });
      } finally {
        await cleanupResultsFixture(ids);
      }
    }
  );

  it('resets attempts and completions, and counts attempts in the impact', { timeout: 30000 }, async () => {
    const ids = await createResultsFixture(suffix());
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const { resetActivityLearner } = await import('@cio/core/services/activity/activity');
      const { getStudentCourseProgressImpactCounts } = await import('@db/queries/course/reset-progress');

      const [attempt] = await db
        .insert(schema.scormAttempt)
        .values({
          activityId: ids.activityId,
          profileId: ids.profileId,
          packageVersionId: ids.versionId,
          attemptNumber: 1
        })
        .returning();
      await db.insert(schema.scormScoAttempt).values({
        attemptId: attempt!.id,
        unitId: ids.unitIds[0]!,
        status: 'suspended',
        cmi: { core: { lesson_status: 'incomplete' } },
        commitSeq: 1,
        lastCommitAt: new Date().toISOString()
      });
      await db.insert(schema.activityCompletion).values({
        activityId: ids.activityId,
        profileId: ids.profileId,
        isComplete: false
      });

      const impact = await getStudentCourseProgressImpactCounts({
        courseId: ids.courseId,
        groupMemberId: ids.groupMemberId,
        profileId: ids.profileId
      });

      expect(impact.activityAttempts).toBe(1);
      expect(impact.completedActivities).toBe(0);
      expect(impact.totalActivities).toBe(1);

      const reset = await resetActivityLearner(ids.courseId, ids.activityId, ids.profileId);

      expect(reset.attempts).toBe(1);
      expect(reset.completions).toBe(1);

      const remainingAttempts = await db
        .select()
        .from(schema.scormAttempt)
        .where(eq(schema.scormAttempt.profileId, ids.profileId));
      const remainingTries = await db
        .select()
        .from(schema.scormScoAttempt)
        .where(eq(schema.scormScoAttempt.attemptId, attempt!.id));
      const remainingCompletions = await db
        .select()
        .from(schema.activityCompletion)
        .where(eq(schema.activityCompletion.profileId, ids.profileId));

      expect(remainingAttempts).toHaveLength(0);
      expect(remainingTries).toHaveLength(0);
      expect(remainingCompletions).toHaveLength(0);
    } finally {
      await cleanupResultsFixture(ids);
    }
  });

  it('snapshots best score, attempt count and minutes for compliance', { timeout: 30000 }, async () => {
    const ids = await createResultsFixture(suffix());
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const { getComplianceSnapshot } = await import('@cio/core/services/activity/providers/scorm/results');

      const base = Date.parse('2026-01-01T00:00:00.000Z');
      const iso = (offsetMs: number) => new Date(base + offsetMs).toISOString();
      const [first] = await db
        .insert(schema.scormAttempt)
        .values({
          activityId: ids.activityId,
          profileId: ids.profileId,
          packageVersionId: ids.versionId,
          attemptNumber: 1,
          startedAt: iso(0),
          closedAt: iso(160_000),
          closeReason: 'finished'
        })
        .returning();
      const [second] = await db
        .insert(schema.scormAttempt)
        .values({
          activityId: ids.activityId,
          profileId: ids.profileId,
          packageVersionId: ids.versionId,
          attemptNumber: 2,
          startedAt: iso(200_000)
        })
        .returning();
      await db.insert(schema.scormScoAttempt).values([
        {
          attemptId: first!.id,
          unitId: ids.unitIds[0]!,
          status: 'closed',
          cmi: { core: { lesson_status: 'passed', score: { raw: '80' } } },
          commitSeq: 2,
          startedAt: iso(0),
          lastCommitAt: iso(150_000),
          terminatedAt: iso(150_000),
          timeSpentSeconds: 150
        },
        {
          attemptId: second!.id,
          unitId: ids.unitIds[0]!,
          status: 'closed',
          cmi: { core: { lesson_status: 'passed', score: { raw: '90' } } },
          commitSeq: 1,
          startedAt: iso(200_000),
          lastCommitAt: iso(260_000),
          terminatedAt: iso(260_000),
          timeSpentSeconds: 60
        }
      ]);

      const snapshot = await getComplianceSnapshot(ids.activityId, ids.profileId);

      expect(snapshot).toEqual({ score: 90, attempts: 2, minutes: 3 });

      const empty = await getComplianceSnapshot(ids.activityId, crypto.randomUUID());

      expect(empty).toBeNull();
    } finally {
      await cleanupResultsFixture(ids);
    }
  });

  it('evaluates graded_only in SQL exactly like the TypeScript rule', { timeout: 30000 }, async () => {
    const ids = await createResultsFixture(suffix());
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const { listScormLearnerResults } = await import('@cio/db/queries/scorm/report');
      const { isScormRuleMet, moduleOutcomeFromCmi } = await import('@cio/activity-packages');

      await db
        .update(schema.activityScorm)
        .set({ completionModules: 'graded_only' })
        .where(eq(schema.activityScorm.activityId, ids.activityId));

      const [attempt] = await db
        .insert(schema.scormAttempt)
        .values({
          activityId: ids.activityId,
          profileId: ids.profileId,
          packageVersionId: ids.versionId,
          attemptNumber: 1
        })
        .returning();
      await db.insert(schema.scormScoAttempt).values({
        attemptId: attempt!.id,
        unitId: ids.unitIds[0]!,
        status: 'closed',
        cmi: { core: { lesson_status: 'passed', score: { raw: '90' } } },
        commitSeq: 2,
        lastCommitAt: new Date().toISOString(),
        terminatedAt: new Date().toISOString(),
        timeSpentSeconds: 150
      });

      const outcomes = [
        moduleOutcomeFromCmi({ core: { lesson_status: 'passed', score: { raw: '90' } } }, 'scorm12', {
          masteryScoreRaw: 80,
          passingScoreScaled: null
        }),
        { completion: 'not_attempted', success: 'unknown', hasPassMark: false, scaledScore: null }
      ] as Parameters<typeof isScormRuleMet>[1];

      const scoped = await listScormLearnerResults(
        ids.activityId,
        [ids.profileId],
        { rule: 'auto', minScorePercent: null, completionModules: 'graded_only' },
        { page: 1, limit: 20, sort: 'name', direction: 'asc' }
      );
      expect(scoped.rows[0]?.latestRuleMet).toBe(true);
      expect(scoped.rows[0]?.timeSpentSeconds).toBe(150);
      expect(isScormRuleMet({ rule: 'auto', completionModules: 'graded_only' }, outcomes)).toBe(true);

      await db
        .update(schema.activityScorm)
        .set({ completionModules: 'all' })
        .where(eq(schema.activityScorm.activityId, ids.activityId));

      const unscoped = await listScormLearnerResults(
        ids.activityId,
        [ids.profileId],
        { rule: 'auto', minScorePercent: null, completionModules: 'all' },
        { page: 1, limit: 20, sort: 'name', direction: 'asc' }
      );
      expect(unscoped.rows[0]?.latestRuleMet).toBe(false);
      expect(isScormRuleMet({ rule: 'auto', completionModules: 'all' }, outcomes)).toBe(false);
    } finally {
      await cleanupResultsFixture(ids);
    }
  });

  it('counts score-only modules as graded but completes them by completion', { timeout: 30000 }, async () => {
    const ids = await createResultsFixture(suffix());
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const { listScormLearnerResults } = await import('@cio/db/queries/scorm/report');
      const { isScormRuleMet } = await import('@cio/activity-packages');

      await db
        .update(schema.activityScorm)
        .set({ completionModules: 'graded_only' })
        .where(eq(schema.activityScorm.activityId, ids.activityId));

      const [attempt] = await db
        .insert(schema.scormAttempt)
        .values({
          activityId: ids.activityId,
          profileId: ids.profileId,
          packageVersionId: ids.versionId,
          attemptNumber: 1
        })
        .returning();
      await db.insert(schema.scormScoAttempt).values([
        {
          attemptId: attempt!.id,
          unitId: ids.unitIds[0]!,
          status: 'closed',
          cmi: { core: { lesson_status: 'passed', score: { raw: '90' } } },
          commitSeq: 2,
          lastCommitAt: new Date().toISOString(),
          terminatedAt: new Date().toISOString(),
          timeSpentSeconds: 150
        },
        {
          attemptId: attempt!.id,
          unitId: ids.unitIds[1]!,
          status: 'closed',
          cmi: { core: { lesson_status: 'completed', score: { raw: '70' } } },
          commitSeq: 1,
          lastCommitAt: new Date().toISOString(),
          terminatedAt: new Date().toISOString(),
          timeSpentSeconds: 60
        }
      ]);

      const settings = { rule: 'auto', minScorePercent: null, completionModules: 'graded_only' } as const;
      const paging = { page: 1, limit: 20, sort: 'name', direction: 'asc' } as const;
      const outcomes = [
        { completion: 'completed', success: 'passed', hasPassMark: true, scaledScore: 0.9 },
        { completion: 'completed', success: 'unknown', hasPassMark: false, scaledScore: 0.7 }
      ] as Parameters<typeof isScormRuleMet>[1];

      const completed = await listScormLearnerResults(ids.activityId, [ids.profileId], settings, paging);
      expect(completed.rows[0]?.latestRuleMet).toBe(true);
      expect(isScormRuleMet({ rule: 'auto', completionModules: 'graded_only' }, outcomes)).toBe(true);

      await db
        .update(schema.scormScoAttempt)
        .set({ cmi: { core: { lesson_status: 'incomplete', score: { raw: '70' } } } })
        .where(eq(schema.scormScoAttempt.unitId, ids.unitIds[1]!));

      const incomplete = await listScormLearnerResults(ids.activityId, [ids.profileId], settings, paging);
      expect(incomplete.rows[0]?.latestRuleMet).toBe(false);
      expect(
        isScormRuleMet({ rule: 'auto', completionModules: 'graded_only' }, [
          outcomes[0]!,
          { completion: 'incomplete', success: 'unknown', hasPassMark: false, scaledScore: 0.7 }
        ])
      ).toBe(false);
    } finally {
      await cleanupResultsFixture(ids);
    }
  });

  it('falls back to all modules when graded_only finds nothing graded', { timeout: 30000 }, async () => {
    const ids = await createTypedFixture(suffix(), 'scorm12', [
      { identifier: 'PLAIN-A', title: 'Plain A', href: 'a.html', formatDetails: { format: 'scorm12' } },
      { identifier: 'PLAIN-B', title: 'Plain B', href: 'b.html', formatDetails: { format: 'scorm12' } }
    ]);
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const { listScormLearnerResults } = await import('@cio/db/queries/scorm/report');
      const { isScormRuleMet } = await import('@cio/activity-packages');

      await db
        .update(schema.activityScorm)
        .set({ completionModules: 'graded_only' })
        .where(eq(schema.activityScorm.activityId, ids.activityId));

      const [attempt] = await db
        .insert(schema.scormAttempt)
        .values({
          activityId: ids.activityId,
          profileId: ids.profileId,
          packageVersionId: ids.versionId,
          attemptNumber: 1
        })
        .returning();
      await db.insert(schema.scormScoAttempt).values([
        {
          attemptId: attempt!.id,
          unitId: ids.unitIds[0]!,
          status: 'closed',
          cmi: { core: { lesson_status: 'completed' } },
          commitSeq: 1,
          lastCommitAt: new Date().toISOString(),
          terminatedAt: new Date().toISOString(),
          timeSpentSeconds: 45
        },
        {
          attemptId: attempt!.id,
          unitId: ids.unitIds[1]!,
          status: 'closed',
          cmi: { core: { lesson_status: 'incomplete' } },
          commitSeq: 1,
          lastCommitAt: new Date().toISOString(),
          terminatedAt: new Date().toISOString(),
          timeSpentSeconds: 30
        }
      ]);

      const outcomes = [
        { completion: 'completed', success: 'unknown', hasPassMark: false, scaledScore: null },
        { completion: 'incomplete', success: 'unknown', hasPassMark: false, scaledScore: null }
      ] as Parameters<typeof isScormRuleMet>[1];
      const paging = { page: 1, limit: 20, sort: 'name', direction: 'asc' } as const;

      const blocked = await listScormLearnerResults(
        ids.activityId,
        [ids.profileId],
        { rule: 'auto', minScorePercent: null, completionModules: 'graded_only' },
        paging
      );
      expect(blocked.rows[0]?.latestRuleMet).toBe(false);
      expect(blocked.rows[0]?.timeSpentSeconds).toBe(75);
      expect(isScormRuleMet({ rule: 'auto', completionModules: 'graded_only' }, outcomes)).toBe(false);

      await db
        .update(schema.scormScoAttempt)
        .set({ cmi: { core: { lesson_status: 'completed' } } })
        .where(eq(schema.scormScoAttempt.unitId, ids.unitIds[1]!));

      const finished = await listScormLearnerResults(
        ids.activityId,
        [ids.profileId],
        { rule: 'auto', minScorePercent: null, completionModules: 'graded_only' },
        paging
      );
      expect(finished.rows[0]?.latestRuleMet).toBe(true);
      expect(
        isScormRuleMet({ rule: 'auto', completionModules: 'graded_only' }, [
          outcomes[0]!,
          { completion: 'completed', success: 'unknown', hasPassMark: false, scaledScore: null }
        ])
      ).toBe(true);
    } finally {
      await cleanupResultsFixture(ids);
    }
  });

  it('averages the score rule over graded modules only, in SQL and TypeScript', { timeout: 60000 }, async () => {
    const seeds = [
      { identifier: 'QUIZ', title: 'Quiz', href: 'quiz.html', masteryScoreRaw: '80' },
      { identifier: 'PLAIN', title: 'Plain', href: 'plain.html' }
    ];
    const passing = await createTypedFixture(suffix(), 'scorm12', seeds);
    const failing = await createTypedFixture(suffix(), 'scorm12', seeds);
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const { listScormLearnerResults } = await import('@cio/db/queries/scorm/report');
      const { isScormRuleMet } = await import('@cio/activity-packages');

      const paging = { page: 1, limit: 20, sort: 'name', direction: 'asc' } as const;
      const settings = { rule: 'score', minScorePercent: 80, completionModules: 'graded_only' };

      for (const ids of [passing, failing]) {
        await db
          .update(schema.activityScorm)
          .set({ completionRule: 'score', minScorePercent: 80, completionModules: 'graded_only' })
          .where(eq(schema.activityScorm.activityId, ids.activityId));
      }

      const seedAttempt = async (ids: ResultsFixture, quizScore: string, plainCmi: Record<string, unknown> | null) => {
        const [attempt] = await db
          .insert(schema.scormAttempt)
          .values({
            activityId: ids.activityId,
            profileId: ids.profileId,
            packageVersionId: ids.versionId,
            attemptNumber: 1
          })
          .returning();
        await db.insert(schema.scormScoAttempt).values({
          attemptId: attempt!.id,
          unitId: ids.unitIds[0]!,
          status: 'closed',
          cmi: { core: { lesson_status: 'completed', score: { raw: quizScore } } },
          commitSeq: 1,
          lastCommitAt: new Date().toISOString(),
          terminatedAt: new Date().toISOString(),
          timeSpentSeconds: 120
        });
        if (plainCmi) {
          await db.insert(schema.scormScoAttempt).values({
            attemptId: attempt!.id,
            unitId: ids.unitIds[1]!,
            status: 'closed',
            cmi: plainCmi,
            commitSeq: 1,
            lastCommitAt: new Date().toISOString(),
            terminatedAt: new Date().toISOString(),
            timeSpentSeconds: 60
          });
        }
      };

      await seedAttempt(passing, '90', null);
      const passingOutcomes = [
        { completion: 'completed', success: 'unknown', hasPassMark: true, scaledScore: 0.9 },
        { completion: 'not_attempted', success: 'unknown', hasPassMark: false, scaledScore: null }
      ] as Parameters<typeof isScormRuleMet>[1];

      const passed = await listScormLearnerResults(passing.activityId, [passing.profileId], settings, paging);
      expect(passed.rows[0]?.latestRuleMet).toBe(true);
      expect(
        isScormRuleMet({ rule: 'score', minScorePercent: 80, completionModules: 'graded_only' }, passingOutcomes)
      ).toBe(true);

      await seedAttempt(failing, '70', { core: { lesson_status: 'completed' } });
      const failingOutcomes = [
        { completion: 'completed', success: 'unknown', hasPassMark: true, scaledScore: 0.7 },
        { completion: 'completed', success: 'unknown', hasPassMark: false, scaledScore: null }
      ] as Parameters<typeof isScormRuleMet>[1];

      const failed = await listScormLearnerResults(failing.activityId, [failing.profileId], settings, paging);
      expect(failed.rows[0]?.latestRuleMet).toBe(false);
      expect(
        isScormRuleMet({ rule: 'score', minScorePercent: 80, completionModules: 'graded_only' }, failingOutcomes)
      ).toBe(false);
    } finally {
      await cleanupResultsFixture(passing);
      await cleanupResultsFixture(failing);
    }
  });

  it('reconciles last active from SCORM commits alone', { timeout: 30000 }, async () => {
    const ids = await createResultsFixture(suffix());
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const { reconcileMemberLastActive } = await import('@db/queries/organization/member-lifecycle');

      const [attempt] = await db
        .insert(schema.scormAttempt)
        .values({
          activityId: ids.activityId,
          profileId: ids.profileId,
          packageVersionId: ids.versionId,
          attemptNumber: 1
        })
        .returning();
      await db.insert(schema.scormScoAttempt).values({
        attemptId: attempt!.id,
        unitId: ids.unitIds[0]!,
        status: 'active',
        cmi: {},
        commitSeq: 1,
        lastCommitAt: new Date().toISOString()
      });
      await db.insert(schema.organizationmember).values({
        organizationId: ids.orgId,
        roleId: 3,
        profileId: ids.profileId,
        email: `sr-${ids.profileId}@example.com`
      });

      const updated = await reconcileMemberLastActive(30);

      expect(updated).toBeGreaterThanOrEqual(1);

      const [member] = await db
        .select()
        .from(schema.organizationmember)
        .where(eq(schema.organizationmember.profileId, ids.profileId));

      expect(member?.lastActiveAt).not.toBeNull();
    } finally {
      await cleanupResultsFixture(ids);
    }
  });
});

describe.skipIf(!hasDatabase)('scorm settings recompute completions', () => {
  it('flips completion to match a changed rule', { timeout: 30000 }, async () => {
    const ids = await createResultsFixture(suffix());
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const { updateActivitySettings } = await import('@cio/core/services/activity/activity');

      const [attempt] = await db
        .insert(schema.scormAttempt)
        .values({
          activityId: ids.activityId,
          profileId: ids.profileId,
          packageVersionId: ids.versionId,
          attemptNumber: 1
        })
        .returning();
      const stampedAt = new Date().toISOString();
      await db.insert(schema.scormScoAttempt).values([
        {
          attemptId: attempt!.id,
          unitId: ids.unitIds[0]!,
          status: 'closed',
          cmi: { core: { lesson_status: 'passed', score: { raw: '90' } } },
          commitSeq: 3,
          lastCommitAt: stampedAt,
          terminatedAt: stampedAt
        },
        {
          attemptId: attempt!.id,
          unitId: ids.unitIds[1]!,
          status: 'closed',
          cmi: { core: { lesson_status: 'completed' } },
          commitSeq: 2,
          lastCommitAt: stampedAt,
          terminatedAt: stampedAt
        }
      ]);
      await db.insert(schema.activityCompletion).values({
        activityId: ids.activityId,
        profileId: ids.profileId,
        isComplete: true,
        completedAt: stampedAt
      });

      const completionOf = async () => {
        const [row] = await db
          .select()
          .from(schema.activityCompletion)
          .where(
            and(
              eq(schema.activityCompletion.activityId, ids.activityId),
              eq(schema.activityCompletion.profileId, ids.profileId)
            )
          )
          .limit(1);

        return row ?? null;
      };

      await updateActivitySettings(ids.courseId, ids.activityId, {
        completionRule: 'passed',
        minScorePercent: null,
        allowRetakes: false,
        moduleOrder: 'free',
        completionModules: 'all'
      });
      expect((await completionOf())?.isComplete).toBe(false);

      const reopened = await updateActivitySettings(ids.courseId, ids.activityId, {
        completionRule: 'auto',
        minScorePercent: null,
        allowRetakes: false,
        moduleOrder: 'free',
        completionModules: 'all'
      });
      expect((await completionOf())?.isComplete).toBe(true);
      expect(reopened.newlyCompletedProfileIds).toEqual([ids.profileId]);
    } finally {
      await cleanupResultsFixture(ids);
    }
  });

  it('leaves earlier compliance cycles alone and refreshes a carried-over completion', { timeout: 30000 }, async () => {
    const ids = await createResultsFixture(suffix());
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const { updateActivitySettings } = await import('@cio/core/services/activity/activity');
      const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();
      const settings = {
        completionRule: 'auto',
        minScorePercent: null,
        allowRetakes: false,
        moduleOrder: 'free',
        completionModules: 'all'
      };
      const passingTries = (attemptId: string, at: string) => [
        {
          attemptId,
          unitId: ids.unitIds[0]!,
          status: 'closed' as const,
          cmi: { core: { lesson_status: 'passed', score: { raw: '90' } } },
          commitSeq: 2,
          startedAt: at,
          lastCommitAt: at,
          terminatedAt: at
        },
        {
          attemptId,
          unitId: ids.unitIds[1]!,
          status: 'closed' as const,
          cmi: { core: { lesson_status: 'completed' } },
          commitSeq: 2,
          startedAt: at,
          lastCommitAt: at,
          terminatedAt: at
        }
      ];
      const completionOf = async () => {
        const [row] = await db
          .select()
          .from(schema.activityCompletion)
          .where(
            and(
              eq(schema.activityCompletion.activityId, ids.activityId),
              eq(schema.activityCompletion.profileId, ids.profileId)
            )
          );
        return row ?? null;
      };

      await db
        .update(schema.course)
        .set({ type: 'COMPLIANCE' as never })
        .where(eq(schema.course.id, ids.courseId));
      const cycleStart = daysAgo(1);
      await db.insert(schema.courseCompletionRecord).values({
        courseId: ids.courseId,
        groupMemberId: ids.groupMemberId,
        profileId: ids.profileId,
        cycleNumber: 2,
        status: 'in_progress',
        dueDate: daysAgo(-30),
        createdAt: cycleStart
      });
      const [earlierAttempt] = await db
        .insert(schema.scormAttempt)
        .values({
          activityId: ids.activityId,
          profileId: ids.profileId,
          packageVersionId: ids.versionId,
          attemptNumber: 1,
          startedAt: daysAgo(10),
          closedAt: daysAgo(10),
          closeReason: 'finished'
        })
        .returning();
      await db.insert(schema.scormScoAttempt).values(passingTries(earlierAttempt!.id, daysAgo(10)));

      const fromEarlierCycle = await updateActivitySettings(ids.courseId, ids.activityId, settings);
      expect(fromEarlierCycle.newlyCompletedProfileIds).toEqual([]);
      expect(await completionOf()).toBeNull();

      await db.insert(schema.activityCompletion).values({
        activityId: ids.activityId,
        profileId: ids.profileId,
        isComplete: true,
        completedAt: daysAgo(10)
      });
      const [currentAttempt] = await db
        .insert(schema.scormAttempt)
        .values({
          activityId: ids.activityId,
          profileId: ids.profileId,
          packageVersionId: ids.versionId,
          attemptNumber: 2,
          startedAt: daysAgo(0)
        })
        .returning();
      await db.insert(schema.scormScoAttempt).values(passingTries(currentAttempt!.id, daysAgo(0)));

      const fromCurrentCycle = await updateActivitySettings(ids.courseId, ids.activityId, settings);
      const refreshed = await completionOf();
      expect(fromCurrentCycle.newlyCompletedProfileIds).toEqual([ids.profileId]);
      expect(refreshed?.isComplete).toBe(true);
      expect(new Date(refreshed!.completedAt!).getTime()).toBeGreaterThanOrEqual(new Date(cycleStart).getTime());

      const unchanged = await updateActivitySettings(ids.courseId, ids.activityId, settings);
      expect(unchanged.newlyCompletedProfileIds).toEqual([]);
    } finally {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      await db.delete(schema.courseCompletionRecord).where(eq(schema.courseCompletionRecord.courseId, ids.courseId));
      await cleanupResultsFixture(ids);
    }
  });

  it('excludes replaced attempts from results cards, summary, table, and stats, and restores them on version reopen', async () => {
    const ids = await createResultsFixture(suffix());
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const {
        getScormResultsSummary,
        listScormLearnerResults,
        getScormActivityStatsForProfile,
        getScormLearnerAttempts
      } = await import('@cio/db/queries/scorm/report');
      const { reopenReplacedAttemptsForVersion } = await import('@cio/db/queries/scorm/attempt');

      const settings = { rule: 'score', minScorePercent: 70, completionModules: 'all' as const };
      const paging = { page: 1, limit: 20, sort: 'name' as const, direction: 'asc' as const };

      const [attempt] = await db
        .insert(schema.scormAttempt)
        .values({
          activityId: ids.activityId,
          profileId: ids.profileId,
          packageVersionId: ids.versionId,
          attemptNumber: 1,
          closedAt: new Date().toISOString(),
          closeReason: 'replaced'
        })
        .returning();

      await db.insert(schema.scormScoAttempt).values({
        attemptId: attempt!.id,
        unitId: ids.unitIds[0],
        status: 'closed',
        cmi: { core: { lesson_status: 'completed', score: { raw: '85', max: '100' } } },
        timeSpentSeconds: 120
      });

      // 1. Results summary should show started = 0, averageScore = null
      const summaryAfterReplace = await getScormResultsSummary(ids.activityId, [ids.profileId], settings);
      expect(summaryAfterReplace.enrolled).toBe(1);
      expect(summaryAfterReplace.started).toBe(0);
      expect(summaryAfterReplace.completed).toBe(0);
      expect(summaryAfterReplace.averageScore).toBeNull();

      // 2. Results table should show learner with 0 attempts and null score
      const listAfterReplace = await listScormLearnerResults(ids.activityId, [ids.profileId], settings, paging);
      expect(listAfterReplace.rows[0]?.attempts).toBe(0);
      expect(listAfterReplace.rows[0]?.scorePercent).toBeNull();
      expect(listAfterReplace.rows[0]?.bestScorePercent).toBeNull();

      // 3. Stats for profile should show 0 attempts, null score, 0 time
      const statsAfterReplace = await getScormActivityStatsForProfile([ids.activityId], ids.profileId);
      expect(statsAfterReplace[0]?.attempts).toBe(0);
      expect(statsAfterReplace[0]?.scorePercent).toBeNull();
      expect(statsAfterReplace[0]?.timeSpentSeconds).toBe(0);

      // 4. Learner sheet audit trail still shows the attempt as replaced (one row per unit)
      const attemptsAudit = await getScormLearnerAttempts(ids.activityId, ids.profileId);
      expect(attemptsAudit.length).toBe(2);
      expect(attemptsAudit[0]?.attemptCloseReason).toBe('replaced');
      expect(attemptsAudit[1]?.attemptCloseReason).toBe('replaced');

      // 5. Restore the version / reopen replaced attempt
      const reopened = await reopenReplacedAttemptsForVersion(ids.versionId, ids.activityId);
      expect(reopened).toEqual([attempt!.id]);

      // 6. Results summary now shows started = 1, averageScore = 85
      const summaryAfterRestore = await getScormResultsSummary(ids.activityId, [ids.profileId], settings);
      expect(summaryAfterRestore.started).toBe(1);
      expect(summaryAfterRestore.averageScore).toBe(85);

      // 7. Results table now shows learner with 1 attempt and 85 score
      const listAfterRestore = await listScormLearnerResults(ids.activityId, [ids.profileId], settings, paging);
      expect(listAfterRestore.rows[0]?.attempts).toBe(1);
      expect(listAfterRestore.rows[0]?.scorePercent).toBe(85);

      // 8. Stats for profile now shows 1 attempt, 85 score, 120s
      const statsAfterRestore = await getScormActivityStatsForProfile([ids.activityId], ids.profileId);
      expect(statsAfterRestore[0]?.attempts).toBe(1);
      expect(statsAfterRestore[0]?.scorePercent).toBe(85);
      expect(statsAfterRestore[0]?.timeSpentSeconds).toBe(120);
    } finally {
      await cleanupResultsFixture(ids);
    }
  });
});
