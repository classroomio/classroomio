import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  courseBuildAvailable: true,
  startCourseBuild: vi.fn(),
  runStarterJob: vi.fn(),
  updateStarterJob: vi.fn(),
  createStarterJob: vi.fn(async (values: Record<string, unknown>) => ({
    id: 'starter-1',
    status: 'PENDING',
    ...values
  }))
}));

vi.mock('@cio/core/services/course-builder/build', () => ({
  startCourseBuild: mocks.startCourseBuild,
  cancelCourseBuild: vi.fn(),
  getCourseBuildSummary: vi.fn()
}));

vi.mock('@cio/core/services/onboarding/index', () => ({
  isCourseBuildAvailable: () => mocks.courseBuildAvailable,
  isOnboardingAiAvailable: () => true,
  runStarterJob: mocks.runStarterJob,
  fillMissingStarterSlots: vi.fn()
}));

vi.mock('@cio/jobs', () => ({
  isRedisConfigured: () => true,
  enqueueOnboardingStarterJob: vi.fn()
}));

vi.mock('@cio/db/queries', () => ({
  createStarterJob: mocks.createStarterJob,
  updateStarterJob: mocks.updateStarterJob,
  getOnboardingSession: vi.fn(async () => ({
    business: {
      contextMode: 'website',
      websiteUrl: 'acme.com',
      firstOutcome: 'onboard-customers',
      jobRole: 'founder',
      companySize: '11-50',
      learningMethod: 'self-serve'
    },
    brand: { productName: 'Acme' }
  })),
  getOrganizationById: vi.fn(async () => ({ id: 'org-1', name: 'Acme' })),
  archiveUnpublishedStarterDrafts: vi.fn(),
  cancelActiveStarterJobs: vi.fn(),
  countStarterJobs: vi.fn(),
  discardStarterCourse: vi.fn(),
  getCourseBySeedKey: vi.fn(),
  getLatestStarterJob: vi.fn(),
  listStarterDrafts: vi.fn(),
  markStarterDraftPublished: vi.fn(),
  renameStarterDraft: vi.fn(),
  replaceStarterDraftContent: vi.fn(),
  setStarterDraftArchived: vi.fn()
}));

vi.mock('@cio/db/queries/auth', () => ({ getProfileById: vi.fn(async () => ({ id: 'profile-1', locale: 'en' })) }));

import { startStarterJob } from '@api/services/onboarding/starter';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.courseBuildAvailable = true;
  mocks.startCourseBuild.mockResolvedValue({ id: 'build-1' });
});

describe('onboarding website builds', () => {
  it('hands a website answer to a course build and lets the user continue at once', async () => {
    const job = await startStarterJob({ organizationId: 'org-1', profileId: 'profile-1' });

    expect(job.mode).toBe('website');
    expect(mocks.startCourseBuild).toHaveBeenCalledWith({
      organizationId: 'org-1',
      profileId: 'profile-1',
      scope: {
        websiteUrl: 'https://acme.com/',
        locale: 'en',
        answers: {
          firstOutcome: 'onboard-customers',
          jobRole: 'founder',
          companySize: '11-50',
          learningMethod: 'self-serve'
        }
      }
    });
    expect(mocks.updateStarterJob).toHaveBeenCalledWith(
      'starter-1',
      expect.objectContaining({ courseBuildJobId: 'build-1', status: 'COMPLETED', stage: 'done' })
    );
    expect(mocks.runStarterJob).not.toHaveBeenCalled();
  });

  it('marks the starter job failed when the build cannot be queued', async () => {
    mocks.startCourseBuild.mockRejectedValue(new Error('redis down'));

    await startStarterJob({ organizationId: 'org-1', profileId: 'profile-1' });

    expect(mocks.updateStarterJob).toHaveBeenCalledWith(
      'starter-1',
      expect.objectContaining({
        status: 'FAILED',
        error: expect.objectContaining({ code: 'COURSE_BUILD_NOT_STARTED' })
      })
    );
  });

  it('keeps starter drafts when website builds are switched off', async () => {
    mocks.courseBuildAvailable = false;

    const job = await startStarterJob({ organizationId: 'org-1', profileId: 'profile-1' });

    expect(job.mode).toBe('ai');
    expect(mocks.startCourseBuild).not.toHaveBeenCalled();
  });
});
