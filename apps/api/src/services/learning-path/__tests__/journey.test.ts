import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorCodes } from '@api/utils/errors';
import type { TLearningPath, TLearningPathMember } from '@cio/db/types';
import type { TPathJourneyCourse } from '@cio/db/queries/learning-path';

const mocks = vi.hoisted(() => ({
  getMemberByPathAndProfile: vi.fn(),
  getPathJourney: vi.fn(),
  listLearnerPathCertificates: vi.fn(),
  orgHasCertificatesEnabled: vi.fn()
}));

vi.mock('@cio/db/queries/learning-path', () => ({
  getMemberByPathAndProfile: mocks.getMemberByPathAndProfile,
  getPathJourney: mocks.getPathJourney,
  listLearnerPathCertificates: mocks.listLearnerPathCertificates
}));

vi.mock('@api/utils/plan-features', () => ({
  orgHasCertificatesEnabled: mocks.orgHasCertificatesEnabled
}));

import { getPathJourneyService } from '../journey';
import { listMyPathCertificatesService } from '../certificate';

const path = {
  id: 'path-1',
  publicId: 'Ab12Cd34',
  organizationId: 'org-1',
  name: 'Data Science',
  slug: 'data-science',
  description: 'Learn data',
  coverImage: null,
  sequentialUnlock: true,
  certificate: { isDownloadable: true }
} as unknown as TLearningPath;

const member = {
  id: 'member-1',
  status: 'COMPLETED',
  enrolledAt: '2026-09-01 00:00:00+00',
  completedAt: '2026-09-20 00:00:00+00'
} as unknown as TLearningPathMember;

const issued = { certificateId: 'CERT-1', issuedAt: '2026-09-20 00:00:00+00' };

function course(courseId: string, isComplete: boolean): TPathJourneyCourse {
  return {
    courseId,
    position: 0,
    title: courseId,
    description: '',
    slug: null,
    logo: '',
    type: 'SELF_PACED',
    status: isComplete ? 'COMPLETED' : 'NOT_STARTED',
    isUnlocked: true,
    isComplete,
    progress: isComplete ? 100 : 0,
    lessonsCompleted: 0,
    lessonsTotal: 0,
    exercisesCompleted: 0,
    exercisesTotal: 0,
    lastProgressAt: null
  };
}

function journeyRows(courses: TPathJourneyCourse[], certificate: typeof issued | null = null) {
  return { courses, lastProgressAt: '2026-09-18 10:00:00+00', certificate };
}

describe('getPathJourneyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.orgHasCertificatesEnabled.mockResolvedValue(true);
  });

  it('summarises live course completion the way evaluatePathCompletion does', async () => {
    mocks.getPathJourney.mockResolvedValue(journeyRows([course('a', true), course('b', false), course('c', false)]));

    const journey = await getPathJourneyService(path, { ...member, status: 'IN_PROGRESS' }, 'ada');

    expect(mocks.getPathJourney).toHaveBeenCalledWith({
      pathId: 'path-1',
      memberId: 'member-1',
      profileId: 'ada',
      sequentialUnlock: true
    });
    expect(journey).toMatchObject({
      status: 'IN_PROGRESS',
      isComplete: false,
      progress: 33,
      completedCourses: 1,
      totalCourses: 3,
      currentCourseId: 'b',
      completedAt: null,
      lastProgressAt: '2026-09-18 10:00:00+00',
      certificate: null
    });
    expect(journey.path).toEqual({
      id: 'path-1',
      publicId: 'Ab12Cd34',
      name: 'Data Science',
      slug: 'data-science',
      description: 'Learn data',
      coverImage: null,
      sequentialUnlock: true
    });
    expect(mocks.orgHasCertificatesEnabled).not.toHaveBeenCalled();
  });

  it('points a finished path at its last course and offers the downloadable certificate', async () => {
    mocks.getPathJourney.mockResolvedValue(journeyRows([course('a', true), course('b', true)], issued));

    const journey = await getPathJourneyService(path, member, 'ada');

    expect(journey).toMatchObject({
      status: 'COMPLETED',
      isComplete: true,
      progress: 100,
      currentCourseId: 'b',
      completedAt: '2026-09-20 00:00:00+00',
      certificate: issued
    });
    expect(mocks.orgHasCertificatesEnabled).toHaveBeenCalledWith('org-1');
  });

  it('never counts a path with no courses as complete', async () => {
    mocks.getPathJourney.mockResolvedValue(journeyRows([]));

    const journey = await getPathJourneyService(path, { ...member, status: 'NOT_STARTED' }, 'ada');

    expect(journey).toMatchObject({
      status: 'NOT_STARTED',
      isComplete: false,
      progress: 0,
      totalCourses: 0,
      currentCourseId: null,
      completedAt: null
    });
  });

  it.each([
    ['the plan has no certificates', member, path, false],
    ['the path certificate is not downloadable', member, { ...path, certificate: {} }, true],
    ['the membership is no longer completed', { ...member, status: 'IN_PROGRESS' }, path, true]
  ] as const)('hides an issued certificate when %s', async (_reason, pathMember, pathRow, plan) => {
    mocks.orgHasCertificatesEnabled.mockResolvedValue(plan);
    mocks.getPathJourney.mockResolvedValue(journeyRows([course('a', true)], issued));

    const journey = await getPathJourneyService(
      pathRow as TLearningPath,
      pathMember as unknown as TLearningPathMember,
      'ada'
    );

    expect(journey.certificate).toBeNull();
  });

  it('finds the enrollment of an org admin, whom the middleware passes without one', async () => {
    mocks.getMemberByPathAndProfile.mockResolvedValue(member);
    mocks.getPathJourney.mockResolvedValue(journeyRows([course('a', true)]));

    await getPathJourneyService(path, null, 'admin-1');

    expect(mocks.getMemberByPathAndProfile).toHaveBeenCalledWith('path-1', 'admin-1');
    expect(mocks.getPathJourney).toHaveBeenCalledWith(expect.objectContaining({ memberId: 'member-1' }));
  });

  it('returns 404 for an org admin who is not enrolled', async () => {
    mocks.getMemberByPathAndProfile.mockResolvedValue(null);

    await expect(getPathJourneyService(path, null, 'admin-1')).rejects.toMatchObject({
      code: ErrorCodes.LEARNING_PATH_MEMBER_NOT_FOUND,
      statusCode: 404
    });
    expect(mocks.getPathJourney).not.toHaveBeenCalled();
  });
});

describe('listMyPathCertificatesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns nothing without reading certificates when the plan has none', async () => {
    mocks.orgHasCertificatesEnabled.mockResolvedValue(false);

    await expect(listMyPathCertificatesService('org-1', 'ada')).resolves.toEqual([]);
    expect(mocks.listLearnerPathCertificates).not.toHaveBeenCalled();
  });

  it("returns the learner's downloadable certificates when the plan allows them", async () => {
    const certificates = [{ certificateId: 'CERT-1', name: 'Data Science' }];
    mocks.orgHasCertificatesEnabled.mockResolvedValue(true);
    mocks.listLearnerPathCertificates.mockResolvedValue(certificates);

    await expect(listMyPathCertificatesService('org-1', 'ada')).resolves.toEqual(certificates);
    expect(mocks.listLearnerPathCertificates).toHaveBeenCalledWith('org-1', 'ada');
  });
});
