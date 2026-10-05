import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/organization', () => ({
  getActiveOrganizationPlan: vi.fn(),
  getOrganizationById: vi.fn(),
  getOrganizationStudentEmailTemplate: vi.fn()
}));

vi.mock('@cio/core/config/env', () => ({
  env: { PUBLIC_IS_SELFHOSTED: 'false' }
}));

import { getStudentEmailTemplateOverride } from '@cio/core/services/email/localization';
import { getActiveOrganizationPlan, getOrganizationStudentEmailTemplate } from '@cio/db/queries/organization';

const savedTemplate = { content: '<p>Custom welcome</p>', subject: 'Custom subject' };

describe('getStudentEmailTemplateOverride', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrganizationStudentEmailTemplate).mockResolvedValue(savedTemplate);
  });

  it('returns the saved template for a paid organization', async () => {
    vi.mocked(getActiveOrganizationPlan).mockResolvedValue({ planName: 'EARLY_ADOPTER' } as never);

    await expect(getStudentEmailTemplateOverride('org-1', 'studentCourseWelcome', 'en')).resolves.toEqual(
      savedTemplate
    );
  });

  it('ignores a saved template once the organization is back on the free plan', async () => {
    vi.mocked(getActiveOrganizationPlan).mockResolvedValue({ planName: 'BASIC' } as never);

    await expect(getStudentEmailTemplateOverride('org-1', 'studentCourseWelcome', 'en')).resolves.toBeUndefined();
    expect(getOrganizationStudentEmailTemplate).not.toHaveBeenCalled();
  });

  it('ignores emails that are not student templates', async () => {
    vi.mocked(getActiveOrganizationPlan).mockResolvedValue({ planName: 'EARLY_ADOPTER' } as never);

    await expect(getStudentEmailTemplateOverride('org-1', 'teacherStudentJoined', 'en')).resolves.toBeUndefined();
  });
});
