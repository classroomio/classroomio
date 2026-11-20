import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLE } from '@cio/utils/constants';
import { ErrorCodes } from '@api/utils/errors';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  resolveLearningPath: vi.fn(),
  assertCanManageLearningPath: vi.fn(),
  getMemberById: vi.fn(),
  removeMember: vi.fn(),
  revokeLearningPathGrants: vi.fn()
}));

const transactionClient = { id: 'test-transaction-client' };

vi.mock('@cio/db/drizzle', () => ({
  db: {
    transaction: mocks.transaction
  }
}));

vi.mock('@api/services/learning-path/learning-path', () => ({
  resolveLearningPath: mocks.resolveLearningPath,
  assertCanManageLearningPath: mocks.assertCanManageLearningPath
}));

vi.mock('@cio/db/queries/learning-path', () => ({
  getMemberById: mocks.getMemberById,
  removeMember: mocks.removeMember,
  revokeLearningPathGrants: mocks.revokeLearningPathGrants
}));

import { removePathMemberService } from '../member-management';

const ORG_ID = '11111111-1111-1111-1111-111111111111';
const PATH_ID = '22222222-2222-2222-2222-222222222222';
const ORG_ROLES = { [ORG_ID]: ROLE.ADMIN };

describe('removePathMemberService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback(transactionClient)
    );
    mocks.resolveLearningPath.mockResolvedValue({ id: PATH_ID, organizationId: ORG_ID });
    mocks.assertCanManageLearningPath.mockResolvedValue(undefined);
  });

  it('soft-removes the member and revokes their path grants in one transaction', async () => {
    const member = { id: 'member-1', learningPathId: PATH_ID, profileId: 'profile-1', removedAt: null };
    const removed = { ...member, removedAt: new Date().toISOString() };
    mocks.getMemberById.mockResolvedValue(member);
    mocks.removeMember.mockResolvedValue(removed);
    mocks.revokeLearningPathGrants.mockResolvedValue(undefined);

    const result = await removePathMemberService(PATH_ID, 'member-1', 'admin-1', ORG_ROLES);

    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.removeMember).toHaveBeenCalledWith('member-1', transactionClient);
    expect(mocks.revokeLearningPathGrants).toHaveBeenCalledWith(PATH_ID, 'profile-1', transactionClient);
    expect(result).toEqual(removed);
  });

  it('skips grant revocation for email-only members without a profile', async () => {
    const member = { id: 'member-2', learningPathId: PATH_ID, profileId: null, removedAt: null };
    mocks.getMemberById.mockResolvedValue(member);
    mocks.removeMember.mockResolvedValue({ ...member, removedAt: new Date().toISOString() });

    await removePathMemberService(PATH_ID, 'member-2', 'admin-1', ORG_ROLES);

    expect(mocks.removeMember).toHaveBeenCalledWith('member-2', transactionClient);
    expect(mocks.revokeLearningPathGrants).not.toHaveBeenCalled();
  });

  it('rejects members from another path without writing anything', async () => {
    mocks.getMemberById.mockResolvedValue({
      id: 'member-3',
      learningPathId: 'other-path',
      profileId: 'profile-3',
      removedAt: null
    });

    await expect(removePathMemberService(PATH_ID, 'member-3', 'admin-1', ORG_ROLES)).rejects.toMatchObject({
      code: ErrorCodes.LEARNING_PATH_MEMBER_NOT_FOUND,
      statusCode: 404
    });

    expect(mocks.removeMember).not.toHaveBeenCalled();
    expect(mocks.revokeLearningPathGrants).not.toHaveBeenCalled();
  });

  it('surfaces grant-revocation failures instead of a partial removal', async () => {
    // Both writes share one transaction: with a real database the throw below
    // rolls back the member soft-remove too, so callers never observe a
    // member without grants or grants without a member.
    const member = { id: 'member-4', learningPathId: PATH_ID, profileId: 'profile-4', removedAt: null };
    mocks.getMemberById.mockResolvedValue(member);
    mocks.removeMember.mockResolvedValue({ ...member, removedAt: new Date().toISOString() });
    mocks.revokeLearningPathGrants.mockRejectedValue(new Error('grant store unavailable'));

    await expect(removePathMemberService(PATH_ID, 'member-4', 'admin-1', ORG_ROLES)).rejects.toMatchObject({
      code: ErrorCodes.INTERNAL_ERROR,
      statusCode: 500
    });

    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.removeMember).toHaveBeenCalledWith('member-4', transactionClient);
    expect(mocks.revokeLearningPathGrants).toHaveBeenCalledWith(PATH_ID, 'profile-4', transactionClient);
  });
});
