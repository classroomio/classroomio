import { beforeEach, describe, expect, it, vi } from 'vitest';

const { env } = vi.hoisted(() => ({
  env: {
    PUBLIC_IS_SELFHOSTED: 'false',
    FIRST_PARTY_ORG_SITE_HOSTS: '',
    APPROXIMATED_API_KEY: 'key',
    APPROXIMATED_TARGET_ADDRESS: 'target.example.net',
    APPROXIMATED_DNS_TARGET_IP: '1.2.3.4',
    APPROXIMATED_DNS_TARGET_CNAME: undefined as string | undefined
  }
}));

vi.mock('@cio/core/config/env', () => ({ env }));

vi.mock('@cio/db/queries/organization', () => ({
  getActiveOrganizationPlan: vi.fn(),
  getOrganizationById: vi.fn(),
  getOrganizations: vi.fn()
}));

vi.mock('@api/services/organization', () => ({
  updateOrg: vi.fn()
}));

import { getActiveOrganizationPlan, getOrganizationById, getOrganizations } from '@cio/db/queries/organization';
import { updateOrg } from '@api/services/organization';
import { PLAN } from '@cio/utils/plans';
import { ZUpdateOrganization } from '@cio/utils/validation/organization';
import { ErrorCodes } from '@api/utils/errors';
import { connectOrgDomain, refreshOrgDomain, removeOrgDomain } from '@api/services/org/domain';

const ORG_ID = 'org-1';
const fetchMock = vi.fn();

const withPlan = (planName: string | null) =>
  vi
    .mocked(getActiveOrganizationPlan)
    .mockResolvedValue((planName ? { planName } : null) as Awaited<ReturnType<typeof getActiveOrganizationPlan>>);

const withStoredDomain = (customDomain: string | null) =>
  vi
    .mocked(getOrganizationById)
    .mockResolvedValue({ id: ORG_ID, customDomain } as Awaited<ReturnType<typeof getOrganizationById>>);

const vhost = { incoming_address: 'courses.example.com', is_resolving: true, has_ssl: true, dns_pointed_at: '1.2.3.4' };
const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify({ data: body }), { status });

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  env.PUBLIC_IS_SELFHOSTED = 'false';
  env.APPROXIMATED_API_KEY = 'key';
  withPlan(PLAN.EARLY_ADOPTER);
  withStoredDomain(null);
  vi.mocked(getOrganizations).mockResolvedValue([]);
  fetchMock.mockResolvedValue(jsonResponse(vhost));
});

describe('connectOrgDomain', () => {
  it('connects and stores the normalized hostname', async () => {
    const result = await connectOrgDomain(ORG_ID, 'https://Courses.Example.com/');

    expect(result).toMatchObject({ hostname: 'courses.example.com', verified: true });
    expect(updateOrg).toHaveBeenCalledWith(ORG_ID, {
      customDomain: 'courses.example.com',
      isCustomDomainVerified: true
    });
  });

  it.each([
    ['the free plan', PLAN.BASIC],
    ['no plan', null]
  ])('refuses %s with UPGRADE_REQUIRED before calling the provider', async (_label, planName) => {
    withPlan(planName);

    await expect(connectOrgDomain(ORG_ID, 'courses.example.com')).rejects.toMatchObject({
      code: ErrorCodes.UPGRADE_REQUIRED,
      statusCode: 403
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(updateOrg).not.toHaveBeenCalled();
  });

  it('allows a self-hosted org without a plan', async () => {
    env.PUBLIC_IS_SELFHOSTED = 'true';
    withPlan(null);

    await expect(connectOrgDomain(ORG_ID, 'courses.example.com')).resolves.toMatchObject({ verified: true });
  });

  it('reconnects the domain the org already has', async () => {
    withStoredDomain('courses.example.com');

    await expect(connectOrgDomain(ORG_ID, 'courses.example.com')).resolves.toMatchObject({ verified: true });
  });

  it('asks to remove the current domain before connecting another', async () => {
    withStoredDomain('old.example.com');

    await expect(connectOrgDomain(ORG_ID, 'courses.example.com')).rejects.toMatchObject({
      code: ErrorCodes.CONFLICT,
      statusCode: 409
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses another organization's domain before calling the provider", async () => {
    vi.mocked(getOrganizations).mockResolvedValue([{ id: 'org-2' }] as Awaited<ReturnType<typeof getOrganizations>>);

    await expect(connectOrgDomain(ORG_ID, 'courses.example.com')).rejects.toMatchObject({
      code: ErrorCodes.CUSTOM_DOMAIN_TAKEN,
      statusCode: 409
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects classroomio hostnames', async () => {
    await expect(connectOrgDomain(ORG_ID, 'evil.classroomio.com')).rejects.toMatchObject({ statusCode: 400 });
  });

  it('reports a missing provider config as CUSTOM_DOMAIN_UNAVAILABLE without naming env vars', async () => {
    env.APPROXIMATED_API_KEY = '';
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const error = await connectOrgDomain(ORG_ID, 'courses.example.com').catch((err: Error) => err);

    expect(error).toMatchObject({ code: ErrorCodes.CUSTOM_DOMAIN_UNAVAILABLE, statusCode: 409 });
    expect((error as Error).message).not.toContain('APPROXIMATED');
  });
});

describe('refreshOrgDomain and removeOrgDomain', () => {
  it("refresh checks the org's stored domain", async () => {
    withStoredDomain('courses.example.com');

    await refreshOrgDomain(ORG_ID);

    expect(fetchMock.mock.calls[0][0]).toContain('/vhosts/by/incoming/courses.example.com');
    expect(updateOrg).toHaveBeenCalledWith(ORG_ID, {
      customDomain: 'courses.example.com',
      isCustomDomainVerified: true
    });
  });

  it("remove deletes only the org's stored domain, on any plan", async () => {
    withStoredDomain('courses.example.com');
    withPlan(PLAN.BASIC);
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }));

    const result = await removeOrgDomain(ORG_ID);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain('/vhosts/by/incoming/courses.example.com');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'DELETE' });
    expect(result.status).toBe('removed');
    expect(updateOrg).toHaveBeenCalledWith(ORG_ID, { customDomain: null, isCustomDomainVerified: false });
  });

  it.each([
    ['refresh', refreshOrgDomain],
    ['remove', removeOrgDomain]
  ])('%s returns 404 when no domain is connected', async (_label, action) => {
    await expect(action(ORG_ID)).rejects.toMatchObject({
      code: ErrorCodes.CUSTOM_DOMAIN_NOT_FOUND,
      statusCode: 404
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('ZUpdateOrganization', () => {
  it('drops the custom domain fields so verification cannot be set directly', () => {
    const parsed = ZUpdateOrganization.parse({ customDomain: 'evil.example.com', isCustomDomainVerified: true });

    expect(parsed).toEqual({});
  });

  it.each(['abc', 'staging', '-myschool'])('rejects the subdomain %s', (siteName) => {
    expect(ZUpdateOrganization.safeParse({ siteName }).success).toBe(false);
  });
});
