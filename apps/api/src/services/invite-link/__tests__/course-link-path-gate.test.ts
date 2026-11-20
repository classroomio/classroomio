import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorCodes } from '@api/utils/errors';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  getCourseById: vi.fn(),
  getCourseWithOrgData: vi.fn(),
  getInviteLinkByTarget: vi.fn(),
  createInviteLink: vi.fn(),
  setInviteLinkRevoked: vi.fn(),
  getInviteLinkByTokenHash: vi.fn()
}));

vi.mock('@cio/db/drizzle', () => ({ db: { transaction: mocks.transaction } }));

vi.mock('@cio/db/queries/course', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@cio/db/queries/course')>()),
  getCourseById: mocks.getCourseById,
  getCourseWithOrgData: mocks.getCourseWithOrgData
}));

vi.mock('@cio/db/queries/invite-link', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@cio/db/queries/invite-link')>()),
  getInviteLinkByTarget: mocks.getInviteLinkByTarget,
  createInviteLink: mocks.createInviteLink,
  setInviteLinkRevoked: mocks.setInviteLinkRevoked,
  getInviteLinkByTokenHash: mocks.getInviteLinkByTokenHash
}));

import {
  acceptInviteLink,
  getOrCreateInviteLinkForResource,
  previewInviteLink,
  toggleInviteLinkForResource
} from '../invite-link';

const COURSE_ID = 'course-1';
const link = { id: 'link-1', token: 'token-1', isRevoked: false, joinCount: 0, lastUsedAt: null };

function givenCourse(enrollOnlyInLearningPath: boolean) {
  mocks.getCourseWithOrgData.mockResolvedValue({ orgId: 'org-1' });
  mocks.getCourseById.mockResolvedValue([{ id: COURSE_ID, enrollOnlyInLearningPath }]);
}

function givenExistingLink(enrollOnlyInLearningPath: boolean) {
  mocks.getInviteLinkByTokenHash.mockResolvedValue({
    invite: { id: 'link-1', resourceType: 'COURSE', roleId: 3, isRevoked: false },
    organization: { id: 'org-1', name: 'Org', siteName: 'org', theme: null, avatarUrl: null },
    course: { id: COURSE_ID, title: 'Excel', description: null, status: 'ACTIVE', enrollOnlyInLearningPath },
    cohort: null,
    learningPath: null
  });
}

describe('course share links and path-only courses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getInviteLinkByTarget.mockResolvedValue(null);
    mocks.createInviteLink.mockResolvedValue(link);
    mocks.setInviteLinkRevoked.mockImplementation(async (_target, _roleId, isRevoked: boolean) => ({
      ...link,
      isRevoked
    }));
  });

  it('refuses to create a link for a path-only course, or hand out one made before', async () => {
    givenCourse(true);

    await expect(getOrCreateInviteLinkForResource('COURSE', COURSE_ID, 'admin-1')).rejects.toMatchObject({
      code: ErrorCodes.VALIDATION_ERROR,
      statusCode: 400
    });
    expect(mocks.getInviteLinkByTarget).not.toHaveBeenCalled();
    expect(mocks.createInviteLink).not.toHaveBeenCalled();
  });

  it('creates a link for a course taken on its own', async () => {
    givenCourse(false);

    const created = await getOrCreateInviteLinkForResource('COURSE', COURSE_ID, 'admin-1');

    expect(created).toMatchObject({ id: 'link-1', isRevoked: false });
    expect(mocks.createInviteLink).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: 'org-1', resourceType: 'COURSE', courseId: COURSE_ID })
    );
  });

  it('refuses to re-enable the link of a path-only course', async () => {
    givenCourse(true);

    await expect(toggleInviteLinkForResource('COURSE', COURSE_ID, false, 'admin-1')).rejects.toMatchObject({
      code: ErrorCodes.VALIDATION_ERROR
    });
    expect(mocks.setInviteLinkRevoked).not.toHaveBeenCalled();
  });

  it('still lets an admin disable the link of a path-only course', async () => {
    givenCourse(true);

    const disabled = await toggleInviteLinkForResource('COURSE', COURSE_ID, true, 'admin-1');

    expect(disabled.isRevoked).toBe(true);
    expect(mocks.getCourseById).not.toHaveBeenCalled();
  });

  it('shows an old link to a path-only course as closed and turns joins away before writing', async () => {
    givenExistingLink(true);

    const preview = await previewInviteLink('token-1');
    expect(preview.resource.isResourceOpen).toBe(false);

    await expect(acceptInviteLink('token-1', { id: 'ada', email: 'ada@learner.test' })).rejects.toMatchObject({
      statusCode: 403
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('keeps links to courses taken on their own open', async () => {
    givenExistingLink(false);

    const preview = await previewInviteLink('token-1');

    expect(preview.resource.isResourceOpen).toBe(true);
  });
});
