import { describe, expect, it } from 'vitest';
import { canUseCourseTemplate, isGlobalCourseTemplate } from '@cio/db/queries/course/template-access';

const platformOrgId = '11111111-1111-4111-8111-111111111111';
const customerOrgId = '22222222-2222-4222-8222-222222222222';

const globalTemplate = { isTemplate: true, publicForAll: true, status: 'ACTIVE' };
const orgTemplate = { isTemplate: true, publicForAll: false, status: 'ACTIVE' };

describe('canUseCourseTemplate', () => {
  it('allows an org to use its own template', () => {
    expect(canUseCourseTemplate(orgTemplate, customerOrgId, customerOrgId, platformOrgId)).toBe(true);
  });

  it('allows any org to use a platform template', () => {
    expect(canUseCourseTemplate(globalTemplate, platformOrgId, customerOrgId, platformOrgId)).toBe(true);
  });

  it('hides a public_for_all course that is not in the platform org', () => {
    expect(canUseCourseTemplate(globalTemplate, customerOrgId, platformOrgId, platformOrgId)).toBe(false);
    expect(isGlobalCourseTemplate(globalTemplate, customerOrgId, platformOrgId)).toBe(false);
  });

  it('hides global templates when the platform org is unset', () => {
    expect(canUseCourseTemplate(globalTemplate, platformOrgId, customerOrgId, undefined)).toBe(false);
  });

  it('rejects a course that is not a template', () => {
    expect(
      canUseCourseTemplate(
        { isTemplate: false, publicForAll: false, status: 'ACTIVE' },
        customerOrgId,
        customerOrgId,
        platformOrgId
      )
    ).toBe(false);
  });
});
