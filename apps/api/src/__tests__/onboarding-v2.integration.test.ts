import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const runIntegration = Boolean(process.env.DATABASE_URL);

const publishControl = vi.hoisted(() => ({ failuresLeft: 0 }));

vi.mock('@api/services/course-import/course-import', async (importOriginal) => {
  const original = await importOriginal<typeof import('@api/services/course-import/course-import')>();

  return {
    ...original,
    publishCourseImportDraftToExistingCourseService: async (
      ...args: Parameters<typeof original.publishCourseImportDraftToExistingCourseService>
    ) => {
      if (publishControl.failuresLeft > 0) {
        publishControl.failuresLeft -= 1;
        throw new Error('Simulated publish failure');
      }

      return original.publishCourseImportDraftToExistingCourseService(...args);
    }
  };
});

describe.skipIf(!runIntegration)('onboarding v2 flow', () => {
  let profileId = '';
  let services: typeof import('@api/services/onboarding');
  let db: typeof import('@cio/db/drizzle').db;
  let schema: typeof import('@cio/db/schema');

  beforeAll(async () => {
    services = await import('@api/services/onboarding');
    ({ db } = await import('@cio/db/drizzle'));
    schema = await import('@cio/db/schema');

    profileId = randomUUID();
    const email = `onboarding-${profileId}@example.test`;
    await db.insert(schema.user).values({ id: profileId, name: 'Test Owner', email, emailVerified: true });
    await db.insert(schema.profile).values({
      id: profileId,
      fullname: 'Test Owner',
      username: `u${profileId.slice(0, 8)}`,
      email,
      isEmailVerified: true
    });
  }, 60_000);

  afterAll(async () => {
    const { eq } = await import('drizzle-orm');
    await db.delete(schema.onboardingSession).where(eq(schema.onboardingSession.profileId, profileId));
  });

  const business = {
    firstOutcome: 'onboard-customers',
    contextMode: 'none',
    jobRole: 'founder',
    companySize: 'solo',
    learningMethod: 'self-serve'
  } as never;

  it('rejects steps out of order', async () => {
    await expect(services.submitBusiness(profileId, business)).rejects.toMatchObject({ statusCode: 404 });

    await services.startOnboarding(profileId, { termsAccepted: true });

    await expect(
      services.submitWorkspace(profileId, {
        fullname: 'Test Owner',
        orgName: 'Acme',
        siteName: `acme-${profileId.slice(0, 6)}`
      })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('walks business, workspace, customise and complete', async () => {
    const afterBusiness = await services.submitBusiness(profileId, business);
    expect(afterBusiness.phase).toBe('workspace');

    const siteName = `acme-${profileId.slice(0, 6)}`;
    const afterWorkspace = await services.submitWorkspace(profileId, {
      fullname: 'Test Owner',
      orgName: 'Acme',
      siteName
    });
    expect(afterWorkspace.phase).toBe('customise');
    expect(afterWorkspace.organization?.siteName).toBe(siteName);
    expect((await services.checkOnboardingSiteName(profileId, siteName)).available).toBe(true);

    const again = await services.submitWorkspace(profileId, {
      fullname: 'Test Owner',
      orgName: 'Acme Co',
      siteName
    });
    expect(again.organization?.id).toBe(afterWorkspace.organization?.id);
    expect(again.organization?.name).toBe('Acme Co');

    const status = await services.getStarterStatus(profileId);
    expect(status.drafts).toHaveLength(4);

    await expect(
      services.applyCustomisation(profileId, { orgName: 'Acme Co', brandColour: 'blue', landingTheme: 'bold' as never })
    ).rejects.toMatchObject({ statusCode: 403, code: 'UPGRADE_REQUIRED' });
    expect((await services.getOnboardingState(profileId)).phase).toBe('customise');

    const applied = await services.applyCustomisation(profileId, {
      orgName: 'Acme Co',
      brandColour: 'blue',
      landingTheme: 'quartz'
    });
    expect(applied.phase).toBe('customise');
    expect(applied.starterCourseIds).toHaveLength(4);

    const reapplied = await services.applyCustomisation(profileId, {
      orgName: 'Acme Co',
      brandColour: 'blue',
      landingTheme: 'quartz'
    });
    expect([...reapplied.starterCourseIds].sort()).toEqual([...applied.starterCourseIds].sort());

    const done = await services.completeOnboarding(profileId, { via: 'skip_to_academy' } as never);
    expect(done.phase).toBe('complete');
    expect(done.tour.status).toBe('dismissed');

    const repeat = await services.completeOnboarding(profileId, { via: 'skip_to_academy' } as never);
    expect(repeat.phase).toBe('complete');
  });

  it('discards a half-created course and creates it again on retry', async () => {
    const { and, like, ne } = await import('drizzle-orm');
    const ownerId = randomUUID();
    const email = `onboarding-${ownerId}@example.test`;
    await db.insert(schema.user).values({ id: ownerId, name: 'Rollback Owner', email, emailVerified: true });
    await db.insert(schema.profile).values({
      id: ownerId,
      fullname: 'Rollback Owner',
      username: `r${ownerId.slice(0, 8)}`,
      email,
      isEmailVerified: true
    });

    await services.startOnboarding(ownerId, { termsAccepted: true });
    await services.submitBusiness(ownerId, business);
    const workspace = await services.submitWorkspace(ownerId, {
      fullname: 'Rollback Owner',
      orgName: 'Rollback Co',
      siteName: `rb-${ownerId.slice(0, 6)}`
    });
    const organizationId = workspace.organization!.id;
    const liveStarterCourses = () =>
      db
        .select({ id: schema.course.id, title: schema.course.title })
        .from(schema.course)
        .where(and(like(schema.course.seedKey, `onboarding:${organizationId}:%`), ne(schema.course.status, 'DELETED')));

    publishControl.failuresLeft = 1;
    await expect(
      services.applyCustomisation(ownerId, { orgName: 'Renamed Co', brandColour: 'blue', landingTheme: 'quartz' })
    ).rejects.toMatchObject({ code: 'ONBOARDING_STARTER_APPLY_FAILED' });

    expect(await liveStarterCourses()).toHaveLength(0);
    expect((await services.getOnboardingState(ownerId)).phase).toBe('customise');

    const applied = await services.applyCustomisation(ownerId, {
      orgName: 'Renamed Co',
      brandColour: 'blue',
      landingTheme: 'quartz'
    });
    const courses = await liveStarterCourses();

    expect(applied.phase).toBe('customise');
    expect(courses).toHaveLength(4);
    expect([...applied.starterCourseIds].sort()).toEqual(courses.map((course) => course.id).sort());
    expect(courses.some((course) => course.title.includes('Renamed Co'))).toBe(true);
    expect(courses.some((course) => course.title.includes('Rollback Co'))).toBe(false);
  });

  it('keeps a single organisation when the workspace step is submitted twice at once', async () => {
    const ownerId = randomUUID();
    const email = `onboarding-${ownerId}@example.test`;
    await db.insert(schema.user).values({ id: ownerId, name: 'Race Owner', email, emailVerified: true });
    await db.insert(schema.profile).values({
      id: ownerId,
      fullname: 'Race Owner',
      username: `race${ownerId.slice(0, 6)}`,
      email,
      isEmailVerified: true
    });

    await services.startOnboarding(ownerId, { termsAccepted: true });
    await services.submitBusiness(ownerId, business);

    const siteName = `race-${ownerId.slice(0, 6)}`;
    const payload = { fullname: 'Race Owner', orgName: 'Race Co', siteName };
    const results = await Promise.allSettled([
      services.submitWorkspace(ownerId, payload),
      services.submitWorkspace(ownerId, payload)
    ]);

    const { eq } = await import('drizzle-orm');
    const organizations = await db
      .select({ id: schema.organization.id })
      .from(schema.organization)
      .where(eq(schema.organization.siteName, siteName));

    expect(organizations).toHaveLength(1);
    expect(results.some((result) => result.status === 'fulfilled')).toBe(true);

    for (const result of results) {
      if (result.status === 'rejected') {
        expect(result.reason).toMatchObject({ statusCode: 409, code: 'SITENAME_EXISTS' });
      }
    }

    const state = await services.getOnboardingState(ownerId);
    expect(state.organization?.id).toBe(organizations[0].id);
    expect(state.phase).toBe('customise');
  });

  it('records onboarding spend without taking it from the allowance or credits', async () => {
    const { eq, and } = await import('drizzle-orm');
    const { getMonthlyTokenUsage, insertTokenUsageAndDrainCredits } = await import('@cio/db/queries/agent');
    const state = await services.getOnboardingState(profileId);
    const orgId = state.organization!.id;
    const since = new Date(Date.now() - 60_000);
    const before = await getMonthlyTokenUsage(orgId, since);

    await insertTokenUsageAndDrainCredits({
      orgId,
      userId: profileId,
      courseId: '00000000-0000-0000-0000-000000000000',
      promptTokens: 4_000,
      completionTokens: 1_000,
      costUnits: 5_000,
      model: 'gemini-3.1-flash-lite',
      planAllowance: 0,
      since,
      countsTowardBalance: false
    });

    const rows = await db
      .select({ countsTowardBalance: schema.aiTokenUsage.countsTowardBalance })
      .from(schema.aiTokenUsage)
      .where(and(eq(schema.aiTokenUsage.orgId, orgId), eq(schema.aiTokenUsage.costUnits, 5_000)));

    expect(rows).toEqual([{ countsTowardBalance: false }]);
    expect(await getMonthlyTokenUsage(orgId, since)).toBe(before);
  });
});
