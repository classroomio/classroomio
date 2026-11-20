import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';

vi.mock('@cio/db/queries/course/invite', () => ({
  getCourseInviteByTokenHash: vi.fn()
}));

vi.mock('@cio/db/queries/organization', () => ({
  checkEmailExistsInOrg: vi.fn(),
  getFirstOrganization: vi.fn(),
  getOrganizationById: vi.fn(),
  hasActiveOrganizationInviteForEmail: vi.fn()
}));

vi.mock('@cio/core/config/env', () => ({
  env: { PUBLIC_IS_SELFHOSTED: 'false' }
}));

import { getCourseInviteByTokenHash } from '@cio/db/queries/course/invite';
import { getOrganizationById, hasActiveOrganizationInviteForEmail } from '@cio/db/queries/organization';
import { canSignUpWithCourseInvite } from '@api/services/course/invite';
import { signupGuard } from '@api/middlewares/signup-guard';

const ORG_ID = 'org-1';
const OTHER_ORG_ID = 'org-2';
const TOKEN = 'course-invite-token';
const EMAIL = 'learner@example.com';

const FUTURE = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
const PAST = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

function buildInviteData(overrides: Record<string, unknown> = {}, organizationId = ORG_ID) {
  return {
    invite: {
      isRevoked: false,
      expiresAt: FUTURE,
      usedCount: 0,
      maxUses: 1,
      allowedEmails: null,
      allowedDomains: null,
      ...overrides
    },
    organization: { id: organizationId }
  } as never;
}

describe('canSignUpWithCourseInvite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accepts an active invite of the organization', async () => {
    vi.mocked(getCourseInviteByTokenHash).mockResolvedValue(buildInviteData());

    await expect(canSignUpWithCourseInvite(ORG_ID, TOKEN, EMAIL)).resolves.toBe(true);
  });

  it('rejects an unknown token', async () => {
    vi.mocked(getCourseInviteByTokenHash).mockResolvedValue(null);

    await expect(canSignUpWithCourseInvite(ORG_ID, TOKEN, EMAIL)).resolves.toBe(false);
  });

  it('rejects an invite that belongs to another organization', async () => {
    vi.mocked(getCourseInviteByTokenHash).mockResolvedValue(buildInviteData({}, OTHER_ORG_ID));

    await expect(canSignUpWithCourseInvite(ORG_ID, TOKEN, EMAIL)).resolves.toBe(false);
  });

  it.each([
    ['revoked', { isRevoked: true }],
    ['expired', { expiresAt: PAST }],
    ['used up', { usedCount: 1, maxUses: 1 }]
  ])('rejects a %s invite', async (_label, overrides) => {
    vi.mocked(getCourseInviteByTokenHash).mockResolvedValue(buildInviteData(overrides));

    await expect(canSignUpWithCourseInvite(ORG_ID, TOKEN, EMAIL)).resolves.toBe(false);
  });

  it('enforces allowed emails case-insensitively', async () => {
    vi.mocked(getCourseInviteByTokenHash).mockResolvedValue(
      buildInviteData({ allowedEmails: ['Learner@Example.com'] })
    );

    await expect(canSignUpWithCourseInvite(ORG_ID, TOKEN, 'LEARNER@example.com')).resolves.toBe(true);
    await expect(canSignUpWithCourseInvite(ORG_ID, TOKEN, 'someone.else@example.com')).resolves.toBe(false);
  });

  it('enforces allowed domains', async () => {
    vi.mocked(getCourseInviteByTokenHash).mockResolvedValue(buildInviteData({ allowedDomains: ['example.com'] }));

    await expect(canSignUpWithCourseInvite(ORG_ID, TOKEN, EMAIL)).resolves.toBe(true);
    await expect(canSignUpWithCourseInvite(ORG_ID, TOKEN, 'learner@other.com')).resolves.toBe(false);
  });

  it('treats a lookup failure as not allowed', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(getCourseInviteByTokenHash).mockRejectedValue(new Error('db down'));

    await expect(canSignUpWithCourseInvite(ORG_ID, TOKEN, EMAIL)).resolves.toBe(false);
  });
});

describe('signupGuard with a course invite token', () => {
  const app = new Hono().use('*', signupGuard).post('/', (c) => c.json({ ok: true }));

  function signUp(headers: Record<string, string> = {}) {
    return app.request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'cio-org-id': ORG_ID, ...headers },
      body: JSON.stringify({ email: EMAIL })
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(hasActiveOrganizationInviteForEmail).mockResolvedValue(false);
    vi.mocked(getOrganizationById).mockResolvedValue({
      id: ORG_ID,
      disableSignup: false,
      settings: { signup: { inviteOnly: true } }
    } as never);
    vi.mocked(getCourseInviteByTokenHash).mockResolvedValue(buildInviteData());
  });

  it('lets an invited learner sign up on an invite-only organization', async () => {
    const response = await signUp({ 'cio-invite-token': TOKEN });

    expect(response.status).toBe(200);
  });

  it('rejects sign-up without a token or organization invite', async () => {
    const response = await signUp();

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ code: 'INVITE_REQUIRED' });
  });

  it('rejects a token from another organization', async () => {
    vi.mocked(getCourseInviteByTokenHash).mockResolvedValue(buildInviteData({}, OTHER_ORG_ID));

    const response = await signUp({ 'cio-invite-token': TOKEN });

    expect(response.status).toBe(403);
  });

  it('still accepts an organization invite without a token', async () => {
    vi.mocked(hasActiveOrganizationInviteForEmail).mockResolvedValue(true);

    const response = await signUp();

    expect(response.status).toBe(200);
  });

  it('keeps disableSignup ahead of any invite', async () => {
    vi.mocked(getOrganizationById).mockResolvedValue({
      id: ORG_ID,
      disableSignup: true,
      settings: { signup: { inviteOnly: true } }
    } as never);

    const response = await signUp({ 'cio-invite-token': TOKEN });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ code: 'SIGNUP_DISABLED' });
  });
});
