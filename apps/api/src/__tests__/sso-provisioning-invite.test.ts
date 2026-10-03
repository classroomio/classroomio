import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * SSO / token-auth acceptance (`ensureOrgMembership`) of a pending org invite:
 * the expiry filter, the student-limit check before a new STUDENT row, the
 * shared metadata parsers, the registered enrollment handler, and the
 * fail-safe when no handler is registered.
 */

const { state, chain, tx } = vi.hoisted(() => {
  const state = {
    selectResults: [] as unknown[][],
    inserts: [] as Array<{ values: unknown }>,
    updates: [] as Array<{ set: unknown }>
  };

  function chain(result: unknown[]) {
    const builder: Record<string, unknown> = {};
    builder.from = () => builder;
    builder.where = () => builder;
    builder.orderBy = () => builder;
    builder.limit = async () => result;

    return builder;
  }

  const tx = {
    insert: () => ({
      values: async (values: unknown) => {
        state.inserts.push({ values });
      }
    }),
    update: () => ({
      set: (set: unknown) => ({
        where: async () => {
          state.updates.push({ set });
        }
      })
    })
  };

  return { state, chain, tx };
});

vi.mock('@db/drizzle', () => ({
  db: {
    select: () => chain(state.selectResults.shift() ?? []),
    insert: tx.insert,
    update: tx.update,
    transaction: async (callback: (client: unknown) => Promise<unknown>) => callback(tx)
  }
}));

vi.mock('@db/queries/auth', () => ({
  markUserAndProfileEmailVerified: vi.fn().mockResolvedValue(undefined)
}));

import { ensureOrgMembership } from '@cio/db/auth/hooks/sso-provisioning';
import { setInviteEnrollmentHandler } from '@cio/db/auth/invite-handler';
import { ROLE } from '@cio/utils/constants';

const ORG_ID = 'org-1';
const USER_ID = 'user-1';

function invite(overrides: Record<string, unknown> = {}) {
  return {
    id: 'invite-1',
    organizationId: ORG_ID,
    email: 'learner@acme.test',
    roleId: ROLE.STUDENT,
    isRevoked: false,
    acceptedAt: null,
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    createdByProfileId: 'admin-1',
    metadata: { courseIds: ['c-1'] },
    ...overrides
  };
}

/** Queues the three selects: existing-by-profile, existing-by-email, pending invite. */
function queueSelects(pendingInvite: unknown | null, existingByEmail: unknown | null = null) {
  state.selectResults = [[], existingByEmail ? [existingByEmail] : [], pendingInvite ? [pendingInvite] : []];
}

const enroll = vi.fn();
const assertStudentCapacity = vi.fn();

describe('ensureOrgMembership — invite acceptance', () => {
  beforeEach(() => {
    state.selectResults = [];
    state.inserts = [];
    state.updates = [];
    enroll.mockReset().mockResolvedValue({ enrolledCount: 1, skippedPathOnlyCourseIds: [], enrolledPathIds: [] });
    assertStudentCapacity.mockReset().mockResolvedValue(null);
    setInviteEnrollmentHandler({ enroll, assertStudentCapacity });
  });

  it('accepts, checks the student limit, and enrolls through the handler with the inviter as grantor', async () => {
    queueSelects(invite());

    await ensureOrgMembership(USER_ID, 'Learner@Acme.test', ORG_ID);

    expect(assertStudentCapacity).toHaveBeenCalledWith(ORG_ID, 1, tx);
    expect(state.inserts).toHaveLength(1);
    expect(enroll).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        courseIds: ['c-1'],
        cohortIds: [],
        pathIds: [],
        organizationId: ORG_ID,
        profileId: USER_ID,
        email: 'learner@acme.test',
        roleId: ROLE.STUDENT,
        grantedByProfileId: 'admin-1'
      })
    );
  });

  it('parses legacy metadata keys the same way as the API flow', async () => {
    queueSelects(invite({ metadata: { course_ids: ['c-1'], program_ids: ['co-1'], path_ids: ['p-1'] } }));

    await ensureOrgMembership(USER_ID, 'learner@acme.test', ORG_ID);

    expect(enroll).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ courseIds: ['c-1'], cohortIds: ['co-1'], pathIds: ['p-1'] })
    );
  });

  it('rolls back (no membership, invite stays pending) when the org is at its student limit', async () => {
    queueSelects(invite());
    assertStudentCapacity.mockRejectedValue(new Error('Student limit reached'));

    await expect(ensureOrgMembership(USER_ID, 'learner@acme.test', ORG_ID)).rejects.toThrow('Student limit reached');

    expect(state.inserts).toHaveLength(0);
    expect(state.updates).toHaveLength(0);
    expect(enroll).not.toHaveBeenCalled();
  });

  it('does not take a new seat for an audience-imported row that already holds one', async () => {
    queueSelects(invite(), { id: 7, profileId: null, email: 'learner@acme.test' });

    await ensureOrgMembership(USER_ID, 'learner@acme.test', ORG_ID);

    expect(assertStudentCapacity).not.toHaveBeenCalled();
    expect(enroll).toHaveBeenCalledOnce();
  });

  it('does not check the student limit for a staff invite', async () => {
    queueSelects(invite({ roleId: ROLE.TUTOR }));

    await ensureOrgMembership(USER_ID, 'learner@acme.test', ORG_ID);

    expect(assertStudentCapacity).not.toHaveBeenCalled();
  });

  it('leaves a resource-bearing invite pending when no handler is registered', async () => {
    setInviteEnrollmentHandler(null as never);
    queueSelects(invite());

    await ensureOrgMembership(USER_ID, 'learner@acme.test', ORG_ID);

    expect(state.inserts).toHaveLength(0);
    expect(state.updates).toHaveLength(0);
  });

  it('an expired invite never matches: the user joins with the policy default role and no enrollment', async () => {
    // The expiry filter lives in the invite query, so an expired invite is not returned.
    queueSelects(null);
    state.selectResults.push([]); // auth policy lookup

    await ensureOrgMembership(USER_ID, 'learner@acme.test', ORG_ID);

    expect(enroll).not.toHaveBeenCalled();
    expect(state.inserts).toEqual([{ values: expect.objectContaining({ roleId: ROLE.STUDENT }) }]);
  });
});
