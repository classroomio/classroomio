import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/auth', () => ({
  getProfileByEmail: vi.fn(),
  getProfileById: vi.fn(),
  syncProfileEmailVerificationFromAuthUser: vi.fn(),
  updateAuthUserProfile: vi.fn(),
  updateProfile: vi.fn()
}));

vi.mock('@cio/db/queries/organization', () => ({
  countActiveStudents: vi.fn(),
  ensureSelfHostedStudentMembership: vi.fn(),
  getOrganizationById: vi.fn(),
  getOrganizationByProfileId: vi.fn(),
  getUserOrgRolesMap: vi.fn()
}));

const TX = { tx: true };
vi.mock('@cio/db/drizzle', () => ({
  db: { transaction: vi.fn((run: (tx: unknown) => unknown) => run(TX)) }
}));

vi.mock('@cio/db/queries/course', () => ({ countOrgTemplates: vi.fn() }));
vi.mock('@cio/core/services/webhook/emit', () => ({ emitOrganizationMemberWebhookEvent: vi.fn() }));
vi.mock('@cio/core/services/license', () => ({ getLicenseStatus: vi.fn() }));
vi.mock('@cio/core/config/env', () => ({ env: { PUBLIC_IS_SELFHOSTED: 'false' } }));
vi.mock('@cio/core/config/dashboard-url', () => ({
  getAppBaseUrl: vi.fn(() => 'https://app.example.com'),
  getDashboardBaseUrl: vi.fn((org?: { siteName?: string }) => `https://${org?.siteName}.example.com`)
}));
vi.mock('@api/services/jobs', () => ({ enqueueTransactionalEmail: vi.fn() }));

import { ROLE } from '@cio/utils/constants';
import { db } from '@cio/db/drizzle';
import { getProfileById, updateAuthUserProfile, updateProfile } from '@cio/db/queries/auth';
import { getOrganizationById, getOrganizationByProfileId } from '@cio/db/queries/organization';
import { enqueueTransactionalEmail } from '@api/services/jobs';
import { applyProfileUpdate, updateUser } from '@api/services/account/profile';
import { sendProfileUpdatedEmail } from '@api/services/account/profile-updated-email';

const USER_ID = 'user-1';
const ADMIN_ID = 'admin-1';
const ORG_ID = 'org-1';

const profile = {
  id: USER_ID,
  fullname: 'Sam Student',
  username: 'sam',
  avatarUrl: null,
  locale: 'fr',
  email: 'sam@example.com'
};

const academy = {
  id: ORG_ID,
  name: 'Academy',
  siteName: 'academy',
  avatarUrl: null,
  theme: null,
  roleId: ROLE.STUDENT
};
const otherOrg = { id: 'org-2', name: 'Other', siteName: 'other', avatarUrl: null, theme: null, roleId: ROLE.TUTOR };

function uniqueViolation(constraint: string) {
  return new Error('Failed query', { cause: { code: '23505', constraint_name: constraint } });
}

describe('applyProfileUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getProfileById).mockResolvedValue(profile as never);
    vi.mocked(updateProfile).mockImplementation(async (_id, data) => ({ ...profile, ...data }) as never);
  });

  it('writes and reports only the fields whose value changes', async () => {
    const result = await applyProfileUpdate(
      USER_ID,
      { fullname: 'Sam Student', username: 'samuel', locale: 'fr' },
      TX as never
    );

    expect(updateProfile).toHaveBeenCalledWith(USER_ID, { username: 'samuel' }, TX);
    expect(result.changedFields).toEqual(['username']);
    expect(result.previous).toBe(profile);
    expect(result.profile.username).toBe('samuel');
  });

  it('writes nothing when no value changes', async () => {
    const result = await applyProfileUpdate(USER_ID, { fullname: 'Sam Student', locale: 'fr' });

    expect(updateProfile).not.toHaveBeenCalled();
    expect(updateAuthUserProfile).not.toHaveBeenCalled();
    expect(result.changedFields).toEqual([]);
  });

  it('keeps the auth user name and image in step with the profile', async () => {
    await applyProfileUpdate(USER_ID, { fullname: 'Samuel', avatarUrl: 'https://cdn.example.com/s.png' }, TX as never);

    expect(updateAuthUserProfile).toHaveBeenCalledWith(
      USER_ID,
      { name: 'Samuel', image: 'https://cdn.example.com/s.png' },
      TX
    );
  });

  it('leaves the auth user alone for a username or language change', async () => {
    await applyProfileUpdate(USER_ID, { username: 'samuel', locale: 'de' });

    expect(updateAuthUserProfile).not.toHaveBeenCalled();
  });

  it('turns a taken username into a 400 on the username field', async () => {
    vi.mocked(updateProfile).mockRejectedValue(uniqueViolation('profile_username_key'));

    await expect(applyProfileUpdate(USER_ID, { username: 'taken' })).rejects.toMatchObject({
      statusCode: 400,
      field: 'username',
      message: 'Username already exists'
    });
    expect(updateAuthUserProfile).not.toHaveBeenCalled();
  });

  it('rethrows any other database error', async () => {
    const error = uniqueViolation('profile_email_key');
    vi.mocked(updateProfile).mockRejectedValue(error);

    await expect(applyProfileUpdate(USER_ID, { username: 'samuel' })).rejects.toBe(error);
  });

  it('returns 404 when the profile does not exist', async () => {
    vi.mocked(getProfileById).mockResolvedValue(undefined as never);

    await expect(applyProfileUpdate(USER_ID, { username: 'samuel' })).rejects.toMatchObject({ statusCode: 404 });
    expect(updateProfile).not.toHaveBeenCalled();
  });
});

describe('updateUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getProfileById).mockResolvedValue(profile as never);
    vi.mocked(updateProfile).mockImplementation(async (_id, data) => ({ ...profile, ...data }) as never);
    vi.mocked(getOrganizationByProfileId).mockResolvedValue([academy] as never);
  });

  it('saves in one transaction, then emails the person once', async () => {
    const saved = await updateUser(USER_ID, { fullname: 'Samuel', username: 'samuel' });

    expect(db.transaction).toHaveBeenCalledTimes(1);
    expect(updateProfile).toHaveBeenCalledWith(USER_ID, { fullname: 'Samuel', username: 'samuel' }, TX);
    expect(saved.fullname).toBe('Samuel');
    expect(enqueueTransactionalEmail).toHaveBeenCalledTimes(1);
    expect(vi.mocked(enqueueTransactionalEmail).mock.calls[0][1].fields).toMatchObject({
      changedFields: ['fullname', 'username'],
      changedBy: 'self'
    });
  });

  it('sends no email when the save fails', async () => {
    vi.mocked(updateProfile).mockRejectedValue(uniqueViolation('profile_username_key'));

    await expect(updateUser(USER_ID, { username: 'taken' })).rejects.toMatchObject({ statusCode: 400 });
    expect(enqueueTransactionalEmail).not.toHaveBeenCalled();
  });

  it('sends no email when nothing changed', async () => {
    await updateUser(USER_ID, { fullname: 'Sam Student', username: 'sam', locale: 'fr' });

    expect(enqueueTransactionalEmail).not.toHaveBeenCalled();
  });
});

describe('sendProfileUpdatedEmail', () => {
  const update = { profile: { ...profile, locale: 'de' }, previous: profile, changedFields: ['locale'] } as never;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrganizationByProfileId).mockResolvedValue([otherOrg, academy] as never);
  });

  it('tells a student an admin of the organization changed their profile, in the language they had before', async () => {
    await sendProfileUpdatedEmail(update, { kind: 'org_admin', orgId: ORG_ID, actorId: ADMIN_ID });

    expect(enqueueTransactionalEmail).toHaveBeenCalledWith(
      'profileUpdated',
      expect.objectContaining({
        to: 'sam@example.com',
        fields: expect.objectContaining({
          name: 'Sam Student',
          changedFields: ['locale'],
          changedBy: 'admin',
          orgName: 'Academy',
          locale: 'fr',
          loginUrl: 'https://academy.example.com'
        }),
        from: expect.stringContaining('Academy (via ClassroomIO.com)')
      })
    );
  });

  it('calls an admin editing their own profile a change they made', async () => {
    await sendProfileUpdatedEmail(update, { kind: 'org_admin', orgId: ORG_ID, actorId: USER_ID });

    expect(vi.mocked(enqueueTransactionalEmail).mock.calls[0][1].fields).toMatchObject({ changedBy: 'self' });
  });

  it('brands a self edit with the organization the dashboard sent, when the person belongs to it', async () => {
    await sendProfileUpdatedEmail(update, { kind: 'self', orgId: ORG_ID });

    expect(vi.mocked(enqueueTransactionalEmail).mock.calls[0][1].fields).toMatchObject({
      orgName: 'Academy',
      changedBy: 'self'
    });
  });

  it('ignores an organization the person does not belong to and uses their first one', async () => {
    await sendProfileUpdatedEmail(update, { kind: 'self', orgId: 'not-mine' });

    expect(vi.mocked(enqueueTransactionalEmail).mock.calls[0][1].fields).toMatchObject({
      orgName: 'Other',
      loginUrl: 'https://app.example.com'
    });
  });

  it("names the admin's organization even when the person's membership is not active", async () => {
    vi.mocked(getOrganizationByProfileId).mockResolvedValue([] as never);
    vi.mocked(getOrganizationById).mockResolvedValue(academy as never);

    await sendProfileUpdatedEmail(update, { kind: 'org_admin', orgId: ORG_ID, actorId: ADMIN_ID });

    expect(getOrganizationById).toHaveBeenCalledWith(ORG_ID);
    expect(vi.mocked(enqueueTransactionalEmail).mock.calls[0][1].fields).toMatchObject({ orgName: 'Academy' });
  });

  it('sends nothing when no field changed', async () => {
    await sendProfileUpdatedEmail({ ...(update as object), changedFields: [] } as never, { kind: 'self' });

    expect(enqueueTransactionalEmail).not.toHaveBeenCalled();
  });

  it('never fails the save when the email cannot be queued', async () => {
    vi.mocked(enqueueTransactionalEmail).mockRejectedValue(new Error('redis down'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(sendProfileUpdatedEmail(update, { kind: 'self' })).resolves.toBeUndefined();
    consoleError.mockRestore();
  });
});
