import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import { ROLE } from '@cio/utils/constants';

const queryMocks = vi.hoisted(() => ({
  select: vi.fn(),
  from: vi.fn(),
  selectWhere: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  update: vi.fn(),
  set: vi.fn(),
  updateWhere: vi.fn(),
  returning: vi.fn()
}));

vi.mock('@db/drizzle', () => ({
  db: { select: queryMocks.select, update: queryMocks.update }
}));

import { setLinkInviteRevoked } from '@cio/db/queries/organization/link-invite';

const ORGANIZATION_ID = 'organization-1';
const PROFILE_ID = 'admin-1';
const olderInvite = { id: 'older-invite', isRevoked: true };
const newestInvite = { id: 'newest-invite', isRevoked: true };

describe('organization link invite revocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryMocks.select.mockReturnValue({ from: queryMocks.from });
    queryMocks.from.mockReturnValue({ where: queryMocks.selectWhere });
    queryMocks.selectWhere.mockReturnValue({ orderBy: queryMocks.orderBy });
    queryMocks.orderBy.mockReturnValue({ limit: queryMocks.limit });
    queryMocks.limit.mockResolvedValue([newestInvite]);
    queryMocks.update.mockReturnValue({ set: queryMocks.set });
    queryMocks.set.mockReturnValue({ where: queryMocks.updateWhere });
    queryMocks.updateWhere.mockReturnValue({ returning: queryMocks.returning });
    queryMocks.returning.mockResolvedValue([olderInvite, newestInvite]);
  });

  it('revokes every link for the selected organization and role, including older duplicates', async () => {
    const result = await setLinkInviteRevoked(ORGANIZATION_ID, ROLE.TUTOR, true, PROFILE_ID);
    const dialect = new PgDialect();
    const predicate = dialect.sqlToQuery(queryMocks.updateWhere.mock.calls[0][0]);

    expect(predicate.params).toEqual([ORGANIZATION_ID, 'LINK', ROLE.TUTOR]);
    expect(predicate.sql).toContain('"organization_id" = $1');
    expect(predicate.sql).toContain('"type" = $2');
    expect(predicate.sql).toContain('"role_id" = $3');
    expect(predicate.sql).not.toContain('"id" =');
    expect(queryMocks.set).toHaveBeenCalledWith(
      expect.objectContaining({ isRevoked: true, revokedByProfileId: PROFILE_ID })
    );
    expect(result).toEqual(newestInvite);
  });

  it('only re-enables the newest link so historical revoked tokens stay disabled', async () => {
    queryMocks.returning.mockResolvedValue([{ ...newestInvite, isRevoked: false }]);

    const result = await setLinkInviteRevoked(ORGANIZATION_ID, ROLE.TUTOR, false, PROFILE_ID);
    const dialect = new PgDialect();
    const predicate = dialect.sqlToQuery(queryMocks.updateWhere.mock.calls[0][0]);

    expect(predicate.params).toEqual([newestInvite.id]);
    expect(predicate.sql).toContain('"id" = $1');
    expect(queryMocks.set).toHaveBeenCalledWith(
      expect.objectContaining({ isRevoked: false, revokedByProfileId: null, revokedAt: null })
    );
    expect(result?.isRevoked).toBe(false);
  });

  it('can revoke again when all matching links are already disabled', async () => {
    const result = await setLinkInviteRevoked(ORGANIZATION_ID, ROLE.TUTOR, true, PROFILE_ID);

    expect(result).toEqual(newestInvite);
    expect(queryMocks.update).toHaveBeenCalledOnce();
  });

  it('returns null without updating anything when that role has no links', async () => {
    queryMocks.limit.mockResolvedValue([]);

    const result = await setLinkInviteRevoked(ORGANIZATION_ID, ROLE.ADMIN, true, PROFILE_ID);

    expect(result).toBeNull();
    expect(queryMocks.update).not.toHaveBeenCalled();
  });
});
