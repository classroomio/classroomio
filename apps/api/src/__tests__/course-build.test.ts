import { beforeEach, describe, expect, it, vi } from 'vitest';

type Row = Record<string, any>;

const store = vi.hoisted(() => ({
  jobs: new Map<string, Row>(),
  sources: new Map<string, Row>(),
  pages: [] as Row[],
  courses: new Map<string, Row>(),
  enqueued: [] as Array<{ stage: string; payload: Row }>,
  emails: [] as Array<{ message: Row; options: Row }>,
  nextId: 0
}));

const id = () => `00000000-0000-4000-8000-${String(++store.nextId).padStart(12, '0')}`;

vi.mock('@cio/db/queries/course-build', () => ({
  createCourseBuildJob: vi.fn(async (values: Row) => {
    const job = {
      id: id(),
      status: 'PENDING',
      stage: 'queued',
      costUsd: 0,
      costByRole: {},
      secondsByStage: {},
      ...values
    };
    store.jobs.set(job.id, job);
    return job;
  }),
  getCourseBuildJobById: vi.fn(async (jobId: string) => store.jobs.get(jobId) ?? null),
  claimCourseBuildJob: vi.fn(async (jobId: string) => {
    const job = store.jobs.get(jobId);
    if (job?.status !== 'PENDING') return null;
    Object.assign(job, { status: 'RUNNING', stage: 'discover' });
    return job;
  }),
  updateRunningCourseBuildJob: vi.fn(async (jobId: string, patch: Row) => {
    const job = store.jobs.get(jobId);
    if (job?.status !== 'RUNNING') return null;
    return Object.assign(job, patch);
  }),
  addCourseBuildJobCost: vi.fn(async (jobId: string, _stage: string, spend: Row) => {
    store.jobs.get(jobId)!.costUsd += spend.costUsd;
  }),
  createCourseBuildSources: vi.fn(async (rows: Row[]) =>
    rows.map((row) => {
      const source = { id: id(), status: 'PENDING', pagesRead: 0, ...row };
      store.sources.set(source.id, source);
      return source;
    })
  ),
  listCourseBuildSources: vi.fn(async (jobId: string) =>
    [...store.sources.values()].filter((source) => source.jobId === jobId)
  ),
  getCourseBuildSourceById: vi.fn(async (sourceId: string) => store.sources.get(sourceId) ?? null),
  updateCourseBuildSource: vi.fn(async (sourceId: string, patch: Row) =>
    Object.assign(store.sources.get(sourceId)!, patch)
  ),
  countUnfinishedCourseBuildSources: vi.fn(
    async (jobId: string) =>
      [...store.sources.values()].filter(
        (source) => source.jobId === jobId && ['PENDING', 'READING'].includes(source.status)
      ).length
  ),
  replaceCourseBuildSourcePages: vi.fn(async (sourceId: string, rows: Row[]) => {
    store.pages = [
      ...store.pages.filter((page) => page.sourceId !== sourceId),
      ...rows.map((row) => ({ id: id(), ...row }))
    ];
  }),
  listCourseBuildPages: vi.fn(async (jobId: string) => store.pages.filter((page) => page.jobId === jobId)),
  setCourseBuildPageCards: vi.fn(async () => undefined),
  createCourseBuildCourses: vi.fn(async (rows: Row[]) =>
    rows.map((row) => {
      const course = { id: id(), status: 'PLANNED', courseId: null, written: null, finished: null, ...row };
      store.courses.set(course.id, course);
      return course;
    })
  ),
  listCourseBuildCourses: vi.fn(async (jobId: string) =>
    [...store.courses.values()].filter((course) => course.jobId === jobId)
  ),
  getCourseBuildCourseById: vi.fn(async (courseId: string) => store.courses.get(courseId) ?? null),
  updateCourseBuildCourse: vi.fn(async (courseId: string, patch: Row) =>
    Object.assign(store.courses.get(courseId)!, patch)
  ),
  incrementCourseBuildSectionsWritten: vi.fn(async () => undefined)
}));

vi.mock('@cio/jobs', () => ({
  enqueueCourseBuildStage: vi.fn(async (stage: string, payload: Row) => {
    store.enqueued.push({ stage, payload });
  }),
  enqueueEmailSend: vi.fn(async (message: Row, options: Row) => {
    store.emails.push({ message, options });
  })
}));

vi.mock('@cio/db/queries/auth', () => ({
  getProfileById: vi.fn(async () => ({ id: 'profile-1', email: 'admin@acme.com' }))
}));

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationById: vi.fn(async () => ({ id: 'org-1', name: 'Acme' }))
}));

vi.mock('@cio/core/services/agent/usage', () => ({ recordTokenUsage: vi.fn(async () => undefined) }));

vi.mock('@cio/core/services/course-builder/publish', () => ({
  publishPackageCourse: vi.fn(async () => ({
    courseId: 'course-1',
    courseImportDraftId: 'draft-1',
    sections: 1,
    lessons: 1,
    exercises: 0,
    warnings: []
  }))
}));

const stages = vi.hoisted(() => ({ gatePassed: true, assetsLessons: 1 }));

vi.mock('@cio/course-builder', async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>();
  const source = (kind: string, url: string) => ({ kind, url, evidence: 'linked-from-site', access: 'open' });

  return {
    ...original,
    discoverSources: vi.fn(async () => ({
      inputUrl: 'https://acme.com/',
      siteUrl: 'https://acme.com/',
      brandDomain: 'acme.com',
      siteTitle: 'Acme',
      sources: [source('product-site', 'https://acme.com/'), source('help-center', 'https://help.acme.com/')],
      needsConfirmation: [],
      skipped: [],
      youtubeChannels: []
    })),
    readStage: vi.fn(async ({ source }: { source: Row }) => ({
      source,
      outcome: 'read',
      pages: [{ id: `${source.url}page`, url: `${source.url}page`, title: 'Page' }],
      media: {},
      completeness: { declared: 1, declaredBy: 'sitemap', read: 1, ratio: 1, status: 'complete' },
      readAt: '2026-11-20T00:00:00.000Z'
    })),
    prepareCorpus: vi.fn(() => ({
      corpus: { locale: 'en', pages: [], excluded: {} },
      gate: stages.gatePassed
        ? { passed: true, teachablePages: 10, words: 5000, reason: 'enough-material' }
        : { passed: false, teachablePages: 1, words: 100, reason: 'too-few-pages' },
      productPages: []
    })),
    understandStage: vi.fn(async () => ({ cards: [], cardFailures: [], glossary: [], aliasConflicts: [] })),
    planStage: vi.fn(async () => ({
      courseList: { courses: [], coverage: { used: [], excluded: [], unplaced: [] }, issues: [] },
      plans: [
        { title: 'Work orders', sections: [{ lessons: [{}] }, { lessons: [{}] }], course: { key: 'c1', pageIds: [] } },
        {
          title: 'Assets',
          sections: [{ lessons: Array.from({ length: stages.assetsLessons }, () => ({})) }],
          course: { key: 'c2', pageIds: [] }
        }
      ]
    })),
    writeStage: vi.fn(async () => ({ course: { key: 'c1' }, gaps: [], issues: [], stats: {} })),
    finishStage: vi.fn(async () => ({ course: { key: 'c1', title: 'Work orders' }, gaps: [], removedItems: [] })),
    packageLabels: vi.fn(async () => original.ENGLISH_PACKAGE_LABELS),
    buildReport: vi.fn(() => ({ sources: [] })),
    coursePackage: vi.fn(() => ({ courses: [] }))
  };
});

import {
  failCourseBuildCourse,
  failCourseBuildRead,
  runCourseBuildDiscover,
  runCourseBuildExport,
  runCourseBuildFinish,
  runCourseBuildPlan,
  runCourseBuildRead,
  runCourseBuildUnderstand,
  runCourseBuildWrite,
  startCourseBuild,
  type CourseBuildHost
} from '@cio/core/services/course-builder/build';

const host = { anthropicApiKey: 'unused', fetcher: {} } as unknown as CourseBuildHost;
const ORG = '00000000-0000-4000-8000-0000000000aa';
const PROFILE = '00000000-0000-4000-8000-0000000000bb';

async function started() {
  return startCourseBuild({
    organizationId: ORG,
    profileId: PROFILE,
    scope: {
      websiteUrl: 'https://acme.com/',
      locale: 'en',
      answers: { firstOutcome: 'onboard-customers', jobRole: 'x', companySize: '1-10', learningMethod: 'x' }
    }
  });
}

const enqueuedStages = () => store.enqueued.map((entry) => entry.stage);

beforeEach(() => {
  store.jobs.clear();
  store.sources.clear();
  store.pages = [];
  store.courses.clear();
  store.enqueued = [];
  store.emails = [];
  stages.gatePassed = true;
});

describe('course build orchestration', () => {
  it('stores the scope with its defaults and enqueues discovery', async () => {
    const job = await started();

    expect(job.scope).toMatchObject({ courseCount: 4, maxPagesPerSource: 300, budgetUsd: 12 });
    expect(store.enqueued).toEqual([{ stage: 'discover', payload: { jobId: job.id, organizationId: ORG } }]);
  });

  it('reads each discovered source and moves on only once every source has settled', async () => {
    const job = await started();
    await runCourseBuildDiscover(job.id, host);
    const reads = store.enqueued.filter((entry) => entry.stage === 'read');
    expect(reads).toHaveLength(2);

    await runCourseBuildRead(job.id, reads[0].payload.sourceId, host);
    expect(enqueuedStages()).not.toContain('understand');

    await failCourseBuildRead(job.id, reads[1].payload.sourceId, new Error('blocked'));
    expect(enqueuedStages()).toContain('understand');
    expect(store.sources.get(reads[1].payload.sourceId)).toMatchObject({ status: 'FAILED' });
    expect(store.pages).toHaveLength(1);
  });

  it('ends with nothing to build when the gate stops, before any paid stage', async () => {
    const job = await started();
    await runCourseBuildDiscover(job.id, host);
    stages.gatePassed = false;

    await runCourseBuildUnderstand(job.id, host);

    expect(store.jobs.get(job.id)).toMatchObject({ status: 'NOTHING_TO_BUILD', stage: 'done' });
    expect(enqueuedStages()).not.toContain('plan');
  });

  it('plans one row per course, then completes once every course is ready or failed', async () => {
    const job = await started();
    await runCourseBuildDiscover(job.id, host);
    await runCourseBuildUnderstand(job.id, host);
    await runCourseBuildPlan(job.id, host);

    const courses = [...store.courses.values()];
    expect(courses.map((course) => [course.title, course.sectionsTotal])).toEqual([
      ['Work orders', 2],
      ['Assets', 1]
    ]);

    const [first, second] = courses;
    await runCourseBuildWrite(job.id, first.id, host);
    await runCourseBuildFinish(job.id, first.id, host);
    await runCourseBuildExport(job.id, first.id, host);
    expect(store.courses.get(first.id)).toMatchObject({ status: 'READY', courseId: 'course-1' });
    expect(store.jobs.get(job.id)?.status).toBe('RUNNING');

    expect(store.emails).toEqual([]);

    await failCourseBuildCourse(job.id, second.id, new Error('budget spent'));
    await failCourseBuildCourse(job.id, second.id, new Error('budget spent'));
    expect(store.jobs.get(job.id)).toMatchObject({ status: 'COMPLETED', stage: 'done' });
    expect(store.emails).toHaveLength(1);
    expect(store.emails[0].message).toMatchObject({
      template: 'courseBuildReady',
      to: 'admin@acme.com',
      fields: { orgName: 'Acme', sourceSite: 'acme.com', courses: [{ title: 'Work orders' }] }
    });
    expect(store.emails[0].options).toEqual({ idempotencyKey: `course-build-ready:${job.id}` });
  });

  it('sets aside a planned course the remaining budget could not finish, before writing anything', async () => {
    stages.assetsLessons = 1_000;
    const job = await started();
    await runCourseBuildDiscover(job.id, host);
    await runCourseBuildUnderstand(job.id, host);
    await runCourseBuildPlan(job.id, host);
    stages.assetsLessons = 1;

    expect([...store.courses.values()].map((course) => course.title)).toEqual(['Work orders']);
    expect(store.jobs.get(job.id)?.courseList).toMatchObject({ droppedForBudget: ['Assets'] });
  });

  it('fails the build when no course could be created', async () => {
    const job = await started();
    await runCourseBuildDiscover(job.id, host);
    await runCourseBuildUnderstand(job.id, host);
    await runCourseBuildPlan(job.id, host);

    for (const course of store.courses.values()) await failCourseBuildCourse(job.id, course.id, new Error('refused'));

    expect(store.jobs.get(job.id)).toMatchObject({ status: 'FAILED', error: { message: 'No course could be built' } });
    expect(store.emails).toEqual([]);
  });

  it('does nothing for a build that is no longer running', async () => {
    const job = await started();
    await runCourseBuildDiscover(job.id, host);
    store.jobs.get(job.id)!.status = 'CANCELED';

    await runCourseBuildUnderstand(job.id, host);
    await runCourseBuildPlan(job.id, host);

    expect(store.courses.size).toBe(0);
    expect(store.jobs.get(job.id)?.status).toBe('CANCELED');
  });
});
