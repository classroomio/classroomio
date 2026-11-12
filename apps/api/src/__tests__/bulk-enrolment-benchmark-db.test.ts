import 'dotenv/config';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ROLE } from '@cio/utils/constants';

const BENCHMARK_REDIS_DB = 15;
const COURSE_INVITE_MAX_RECIPIENTS = 500;

const hasDatabase = Boolean(process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL);
const enabled = process.env.BULK_ENROLMENT_BENCHMARK === '1' && hasDatabase && Boolean(process.env.REDIS_URL);

const sizes = (process.env.BULK_ENROLMENT_BENCHMARK_SIZES ?? '100,500,1000')
  .split(',')
  .map((size) => Number.parseInt(size.trim(), 10))
  .filter((size) => size > 0);

if (enabled) {
  const url = new URL(process.env.REDIS_URL!);
  url.pathname = `/${BENCHMARK_REDIS_DB}`;
  process.env.REDIS_URL = url.toString();
}

type Fixture = { orgId: string; adminId: string; courseIds: string[]; cohortId: string };
type Outcome = { rows: number; enrolled: number; emailsFailed: number };

type Scenario = {
  key: string;
  label: string;
  recipients: 'new' | 'known' | 'existing';
  maxRows?: number;
  act: (fixture: Fixture, recipients: { emails: string[]; profileIds: string[] }) => Promise<Outcome>;
};

type BenchmarkRow = {
  label: string;
  rows: number;
  ms: number;
  sql: number;
  redis: number;
  emailJobs: number;
} & Outcome;

/**
 * Times the bulk paths that add people (audience import, course add members, course email invites) against
 * the local database and Redis, counting SQL statements and Redis commands. Opt in with
 * `BULK_ENROLMENT_BENCHMARK=1`; jobs go to Redis db 15 so no running worker sends them.
 */
describe.skipIf(!enabled)('bulk enrolment benchmark', () => {
  const results: BenchmarkRow[] = [];
  const counters = { sql: 0, counting: false };

  let modules: Awaited<ReturnType<typeof loadModules>>;

  async function loadModules() {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const { like } = await import('drizzle-orm');
    const { deleteOrganization } = await import('@db/scripts/lib/org-deletion');
    const { getQueue, getSharedRedisConnection, QUEUE_NAMES } = await import('@cio/jobs');
    const { connectRedis, redis: cacheRedis } = await import('@cio/core/utils/redis/redis');
    const { importAudienceMembers } = await import('@api/services/organization/audience');
    const { addMembers } = await import('@api/services/course/people');
    const { createStudentInvite } = await import('@api/services/course/invite');

    await connectRedis();

    return {
      db,
      schema,
      like,
      deleteOrganization,
      redis: getSharedRedisConnection(),
      emailQueue: getQueue(QUEUE_NAMES.emails),
      cacheRedis,
      importAudienceMembers,
      addMembers,
      createStudentInvite
    };
  }

  const scenarios: Scenario[] = [
    {
      key: 'import-new',
      label: 'Import: new emails, no accounts',
      recipients: 'new',
      act: (fixture, { emails }) => importInto(fixture, emails)
    },
    {
      key: 'import-known',
      label: 'Import: new to org, have accounts',
      recipients: 'known',
      act: (fixture, { emails }) => importInto(fixture, emails)
    },
    {
      key: 'import-existing',
      label: 'Import: already students in org',
      recipients: 'existing',
      act: (fixture, { emails }) => importInto(fixture, emails)
    },
    {
      key: 'course-add-members',
      label: 'Course add members (compliance course)',
      recipients: 'existing',
      act: async (fixture, { emails, profileIds }) => {
        const added = await modules.addMembers(
          fixture.courseIds[2],
          profileIds.map((profileId, index) => ({ profileId, email: emails[index], roleId: ROLE.STUDENT })),
          'dashboard',
          { actorProfileId: fixture.adminId }
        );

        return { rows: added.length, enrolled: added.length, emailsFailed: 0 };
      }
    },
    {
      key: 'course-invites',
      label: 'Course email invites',
      recipients: 'new',
      maxRows: COURSE_INVITE_MAX_RECIPIENTS,
      act: async (fixture, { emails }) => {
        const result = await modules.createStudentInvite(
          fixture.courseIds[0],
          fixture.adminId,
          { preset: 'MULTI_USE_30D', recipientEmails: emails, sendEmail: true },
          'dashboard'
        );

        return {
          rows: result.invites.length,
          enrolled: 0,
          emailsFailed: result.delivery.failed
        };
      }
    }
  ];

  async function importInto(fixture: Fixture, emails: string[]): Promise<Outcome> {
    const result = await modules.importAudienceMembers(
      fixture.orgId,
      {
        recipients: emails.map((email) => ({ email })),
        courseIds: fixture.courseIds,
        cohortIds: [fixture.cohortId],
        sendEmail: true
      } as Parameters<typeof modules.importAudienceMembers>[1],
      fixture.adminId,
      'dashboard'
    );

    return {
      rows: result.rows.length,
      enrolled: result.enrolled,
      emailsFailed: result.emailsFailed
    };
  }

  async function redisCommandCount() {
    const info = await modules.redis.info('commandstats');

    return [...info.matchAll(/calls=(\d+)/g)].reduce((total, match) => total + Number(match[1]), 0);
  }

  async function createUsers(tag: string, count: number) {
    const { db, schema } = modules;
    const emails = Array.from({ length: count }, (_, index) => `bench-${tag}-${index}@bench.test`);
    const users = await db
      .insert(schema.user)
      .values(emails.map((email) => ({ name: email, email, emailVerified: true })))
      .returning({ id: schema.user.id, email: schema.user.email });

    await db.insert(schema.profile).values(
      users.map((user) => ({
        id: user.id,
        email: user.email,
        fullname: user.email,
        username: user.email,
        isEmailVerified: true
      }))
    );

    return users;
  }

  async function createOrgFixture(tag: string): Promise<Fixture> {
    const { db, schema } = modules;
    const [organization] = await db
      .insert(schema.organization)
      .values({ name: `Benchmark ${tag}`, siteName: `bench-${tag}` })
      .returning();

    await db
      .insert(schema.organizationPlan)
      .values({ orgId: organization.id, planName: 'EARLY_ADOPTER', isActive: true });

    const [admin] = await createUsers(`${tag}-admin`, 1);
    await db
      .insert(schema.organizationmember)
      .values({ organizationId: organization.id, profileId: admin.id, email: admin.email, roleId: ROLE.ADMIN });

    const deadline = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    const courseIds: string[] = [];

    for (const [index, type] of (['SELF_PACED', 'SELF_PACED', 'COMPLIANCE'] as const).entries()) {
      const [group] = await db
        .insert(schema.group)
        .values({ name: `bench-${tag}-${index}`, organizationId: organization.id })
        .returning();
      const [course] = await db
        .insert(schema.course)
        .values({
          title: `Benchmark course ${index + 1}`,
          description: 'Benchmark fixture',
          groupId: group.id,
          slug: `bench-${tag}-${index}`,
          type,
          ...(type === 'COMPLIANCE' ? { compliance: { retakeIntervalMonths: 12 }, certificate: { deadline } } : {})
        })
        .returning();

      courseIds.push(course.id);
    }

    const [cohort] = await db
      .insert(schema.cohort)
      .values({ organizationId: organization.id, name: `Benchmark cohort ${tag}`, createdByProfileId: admin.id })
      .returning();

    await db.insert(schema.cohortCourse).values({ cohortId: cohort.id, courseId: courseIds[0] });

    return { orgId: organization.id, adminId: admin.id, courseIds, cohortId: cohort.id };
  }

  async function prepareRecipients(kind: Scenario['recipients'], tag: string, orgId: string, count: number) {
    if (kind === 'new') {
      return {
        emails: Array.from({ length: count }, (_, index) => `bench-${tag}-${index}@bench.test`),
        profileIds: []
      };
    }

    const users = await createUsers(tag, count);

    if (kind === 'existing') {
      const { db, schema } = modules;
      await db.insert(schema.organizationmember).values(
        users.map((user) => ({
          organizationId: orgId,
          profileId: user.id,
          email: user.email,
          roleId: ROLE.STUDENT,
          verified: true
        }))
      );
    }

    return { emails: users.map((user) => user.email), profileIds: users.map((user) => user.id) };
  }

  async function cleanup(orgId: string, tag: string) {
    const { db, schema, like, deleteOrganization } = modules;

    await deleteOrganization(db.$client, orgId);
    await db.delete(schema.profile).where(like(schema.profile.email, `bench-${tag}%@bench.test`));
    await db.delete(schema.user).where(like(schema.user.email, `bench-${tag}%@bench.test`));
  }

  async function run(scenario: Scenario, count: number, record = true) {
    const tag = `${scenario.key}-${count}-${Date.now()}`;
    const fixture = await createOrgFixture(tag);

    try {
      const recipients = await prepareRecipients(scenario.recipients, tag, fixture.orgId, count);
      const emailJobsBefore = await modules.emailQueue.count();
      const redisBefore = await redisCommandCount();

      counters.sql = 0;
      counters.counting = true;
      const startedAt = performance.now();
      const outcome = await scenario.act(fixture, recipients);
      const ms = performance.now() - startedAt;
      counters.counting = false;

      const redis = (await redisCommandCount()) - redisBefore - 1;
      const emailJobs = (await modules.emailQueue.count()) - emailJobsBefore;

      if (record) {
        results.push({
          ...outcome,
          label: scenario.label,
          rows: count,
          ms: Math.round(ms),
          sql: counters.sql,
          redis,
          emailJobs
        });
      }

      return outcome;
    } finally {
      counters.counting = false;
      await cleanup(fixture.orgId, tag);
    }
  }

  beforeAll(async () => {
    modules = await loadModules();

    if (modules.redis.options.db !== BENCHMARK_REDIS_DB) {
      throw new Error(`Benchmark must enqueue into Redis db ${BENCHMARK_REDIS_DB}`);
    }

    await modules.redis.flushdb();
    modules.db.$client.options.debug = () => {
      if (counters.counting) counters.sql += 1;
    };

    for (const scenario of scenarios) {
      await run(scenario, 2, false);
    }
  }, 120_000);

  afterAll(async () => {
    if (!modules) return;

    modules.db.$client.options.debug = false;
    await modules.redis.flushdb();
    await modules.cacheRedis.quit();

    const header = '| Scenario | Rows | Time (ms) | SQL statements | Redis commands | Email jobs queued |';
    const divider = '|---|---:|---:|---:|---:|---:|';
    const lines = results.map(
      (row) => `| ${row.label} | ${row.rows} | ${row.ms} | ${row.sql} | ${row.redis} | ${row.emailJobs} |`
    );

    console.log(['', header, divider, ...lines, ''].join('\n'));
  }, 120_000);

  for (const scenario of scenarios) {
    for (const count of sizes.filter((size) => !scenario.maxRows || size <= scenario.maxRows)) {
      it(`${scenario.label}: ${count} rows`, { timeout: 600_000 }, async () => {
        const outcome = await run(scenario, count);

        expect(outcome.emailsFailed).toBe(0);
        expect(outcome.rows).toBe(count);
      });
    }
  }
});
