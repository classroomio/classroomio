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
  getActiveOrganizationPlan: vi.fn(),
  getOrganizationByProfileId: vi.fn(),
  getUserOrgRolesMap: vi.fn()
}));

vi.mock('@cio/db/drizzle', () => ({ db: {} }));
vi.mock('@cio/db/queries/course', () => ({ countOrgTemplates: vi.fn() }));
vi.mock('@cio/core/services/webhook/emit', () => ({ emitOrganizationMemberWebhookEvent: vi.fn() }));
vi.mock('@cio/core/services/license', () => ({ getLicenseStatus: vi.fn() }));
vi.mock('@cio/core/config/env', () => ({ env: { PUBLIC_IS_SELFHOSTED: 'false' } }));
vi.mock('@api/services/account/profile-updated-email', () => ({ sendProfileUpdatedEmail: vi.fn() }));

import { ROLE } from '@cio/utils/constants';
import { getProfileById, syncProfileEmailVerificationFromAuthUser } from '@cio/db/queries/auth';
import {
  countActiveStudents,
  getActiveOrganizationPlan,
  getOrganizationByProfileId
} from '@cio/db/queries/organization';
import { countOrgTemplates } from '@cio/db/queries/course';
import { getAccountData } from '@api/services/account/profile';

const USER_ID = 'user-1';

function paidPlan(orgSuffix: string) {
  return {
    planName: 'EARLY_ADOPTER',
    isActive: true,
    provider: 'polar',
    subscriptionId: `sub_${orgSuffix}`,
    customerId: `cus_${orgSuffix}`
  };
}

function membership(id: string, roleId: number) {
  return { id, name: id, siteName: id, roleId, memberId: 1, plans: [paidPlan(id)] };
}

describe('getAccountData billing ids', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getProfileById).mockResolvedValue({ id: USER_ID, email: 'user@example.com' } as never);
    vi.mocked(syncProfileEmailVerificationFromAuthUser).mockResolvedValue(null as never);
    vi.mocked(countActiveStudents).mockResolvedValue(0 as never);
    vi.mocked(countOrgTemplates).mockResolvedValue(0 as never);
    vi.mocked(getActiveOrganizationPlan).mockResolvedValue(null as never);
    vi.mocked(getOrganizationByProfileId).mockResolvedValue([
      membership('student-org', ROLE.STUDENT),
      membership('admin-org', ROLE.ADMIN),
      membership('tutor-org', ROLE.TUTOR)
    ] as never);
  });

  it('nulls billing provider and ids on orgs where the user is a student', async () => {
    const { organizations } = await getAccountData(USER_ID);
    const studentOrg = organizations.find((org) => org.id === 'student-org');

    expect(studentOrg?.plans).toEqual([
      { planName: 'EARLY_ADOPTER', isActive: true, provider: null, subscriptionId: null, customerId: null }
    ]);
  });

  it('keeps billing provider and ids on orgs where the user is an admin or tutor', async () => {
    const { organizations } = await getAccountData(USER_ID);
    const adminOrg = organizations.find((org) => org.id === 'admin-org');
    const tutorOrg = organizations.find((org) => org.id === 'tutor-org');

    expect(adminOrg?.plans).toEqual([paidPlan('admin-org')]);
    expect(tutorOrg?.plans).toEqual([paidPlan('tutor-org')]);
  });
});
