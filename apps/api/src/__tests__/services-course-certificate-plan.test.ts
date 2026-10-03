import { beforeEach, describe, expect, it, vi } from 'vitest';

const { env } = vi.hoisted(() => ({ env: { PUBLIC_IS_SELFHOSTED: 'false' } }));

vi.mock('@cio/core/config/env', () => ({ env }));

vi.mock('@cio/db/queries', () => ({
  getCourseById: vi.fn(),
  getCourseOrganizationId: vi.fn()
}));

vi.mock('@cio/db/queries/organization', () => ({
  getActiveOrganizationPlan: vi.fn()
}));

vi.mock('@api/utils/certificate', async () => {
  const certificates = await import('@cio/certificates');

  return { resolveCertificateDesign: certificates.resolveCertificateDesign };
});

import { getCourseById, getCourseOrganizationId } from '@cio/db/queries';
import { getActiveOrganizationPlan } from '@cio/db/queries/organization';
import { PLAN } from '@cio/utils/plans';
import { ErrorCodes } from '@api/utils/errors';
import {
  assertCertificateChangeAllowed,
  assertCertificatesEnabled,
  orgHasCertificatesEnabled
} from '@api/services/course/certificate-plan';

type TPlanResult = Awaited<ReturnType<typeof getActiveOrganizationPlan>>;
type TCourseResult = Awaited<ReturnType<typeof getCourseById>>;

type TSignatory = { name: string; role: string; enabled: boolean };

const ORG_ID = 'org-1';
const COURSE_ID = 'course-1';

const storedCertificate = {
  isDownloadable: true,
  theme: 'classique',
  design: {
    templateId: 'classique' as const,
    accentColor: '#112233',
    signatories: [
      { name: 'A', role: 'Dean', enabled: true },
      { name: 'B', role: 'Tutor', enabled: true }
    ] as [TSignatory, TSignatory]
  },
  emailMessage: 'Well done'
};

const onPlan = (planName: string | null) =>
  vi.mocked(getActiveOrganizationPlan).mockResolvedValue((planName ? { planName } : null) as unknown as TPlanResult);

const upgradeRequired = { statusCode: 403, code: ErrorCodes.UPGRADE_REQUIRED };

beforeEach(() => {
  vi.clearAllMocks();
  env.PUBLIC_IS_SELFHOSTED = 'false';
  vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_ID);
  vi.mocked(getCourseById).mockResolvedValue([
    { id: COURSE_ID, type: 'SELF_PACED', compliance: null, certificate: storedCertificate }
  ] as unknown as TCourseResult);
});

describe('orgHasCertificatesEnabled', () => {
  it.each([
    [PLAN.BASIC, false],
    [null, false],
    [PLAN.EARLY_ADOPTER, true],
    [PLAN.ENTERPRISE, true]
  ])('on plan %s returns %s', async (planName, expected) => {
    onPlan(planName);

    await expect(orgHasCertificatesEnabled(ORG_ID)).resolves.toBe(expected);
  });

  it('always allows self-hosted deployments without a plan lookup', async () => {
    env.PUBLIC_IS_SELFHOSTED = 'true';

    await expect(orgHasCertificatesEnabled(ORG_ID)).resolves.toBe(true);
    expect(getActiveOrganizationPlan).not.toHaveBeenCalled();
  });
});

describe('assertCertificatesEnabled', () => {
  it('throws 403 UPGRADE_REQUIRED on the Basic plan', async () => {
    onPlan(PLAN.BASIC);

    await expect(assertCertificatesEnabled(ORG_ID)).rejects.toMatchObject(upgradeRequired);
  });

  it('passes on a paid plan', async () => {
    onPlan(PLAN.EARLY_ADOPTER);

    await expect(assertCertificatesEnabled(ORG_ID)).resolves.toBeUndefined();
  });
});

describe('assertCertificateChangeAllowed', () => {
  it('does nothing when the update has no certificate', async () => {
    await assertCertificateChangeAllowed(COURSE_ID, undefined);

    expect(getCourseById).not.toHaveBeenCalled();
    expect(getActiveOrganizationPlan).not.toHaveBeenCalled();
  });

  it('lets a Basic org resave the stored settings with defaults filled in, as the dashboard forms do', async () => {
    onPlan(PLAN.BASIC);

    await expect(
      assertCertificateChangeAllowed(COURSE_ID, {
        ...storedCertificate,
        theme: undefined,
        deadline: null,
        threshold: 100,
        requiredExerciseId: null,
        exerciseMinScorePercent: null
      })
    ).resolves.toBeUndefined();
    expect(getActiveOrganizationPlan).not.toHaveBeenCalled();
  });

  it.each([
    ['isDownloadable', { isDownloadable: false }],
    ['threshold', { threshold: 80 }],
    ['emailMessage', { emailMessage: 'Changed' }],
    ['design', { design: { ...storedCertificate.design, accentColor: '#445566' } }]
  ])('blocks a Basic org from changing %s', async (_field, change) => {
    onPlan(PLAN.BASIC);

    await expect(assertCertificateChangeAllowed(COURSE_ID, { ...storedCertificate, ...change })).rejects.toMatchObject(
      upgradeRequired
    );
    expect(getActiveOrganizationPlan).toHaveBeenCalledWith(ORG_ID);
  });

  it('lets a paid org change the settings', async () => {
    onPlan(PLAN.EARLY_ADOPTER);

    await expect(
      assertCertificateChangeAllowed(COURSE_ID, { ...storedCertificate, isDownloadable: false })
    ).resolves.toBeUndefined();
  });
});
