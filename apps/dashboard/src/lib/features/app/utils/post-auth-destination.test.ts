import { describe, expect, it } from 'vitest';
import { ROLE } from '@cio/utils/constants';

import { isOrgChooserAvailable, shouldShowOrgChooser } from './post-auth-destination';

const student = { roleId: ROLE.STUDENT };
const tutor = { roleId: ROLE.TUTOR };
const admin = { roleId: ROLE.ADMIN };

describe('shouldShowOrgChooser', () => {
  it('shows the chooser for a cloud learner on the admin host', () => {
    expect(shouldShowOrgChooser({ isCloud: true, isOrgSite: false, organizations: [student] })).toBe(true);
    expect(shouldShowOrgChooser({ isCloud: true, isOrgSite: false, organizations: [student, student] })).toBe(true);
  });

  it('keeps users who manage an org on their dashboard', () => {
    expect(shouldShowOrgChooser({ isCloud: true, isOrgSite: false, organizations: [student, admin] })).toBe(false);
    expect(shouldShowOrgChooser({ isCloud: true, isOrgSite: false, organizations: [student, tutor] })).toBe(false);
    expect(shouldShowOrgChooser({ isCloud: true, isOrgSite: false, organizations: [admin] })).toBe(false);
  });

  it('leaves users without memberships to onboarding', () => {
    expect(shouldShowOrgChooser({ isCloud: true, isOrgSite: false, organizations: [] })).toBe(false);
  });

  it('never shows on tenant sites or self-hosted', () => {
    expect(shouldShowOrgChooser({ isCloud: true, isOrgSite: true, organizations: [student] })).toBe(false);
    expect(shouldShowOrgChooser({ isCloud: false, isOrgSite: false, organizations: [student] })).toBe(false);
  });
});

describe('isOrgChooserAvailable', () => {
  it('is only available on the cloud admin host', () => {
    expect(isOrgChooserAvailable({ isCloud: true, isOrgSite: false })).toBe(true);
    expect(isOrgChooserAvailable({ isCloud: true, isOrgSite: true })).toBe(false);
    expect(isOrgChooserAvailable({ isCloud: false, isOrgSite: false })).toBe(false);
  });
});
