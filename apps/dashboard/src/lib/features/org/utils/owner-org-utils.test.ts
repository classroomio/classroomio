import { describe, expect, it } from 'vitest';
import type { AccountOrg } from '$features/app/types';

import { findOwnerOrgToSwitch } from './owner-org-utils';

const udemy = { id: 'org-udemy', siteName: 'udemy-test' } as AccountOrg;
const states = { id: 'org-states', siteName: 'analytics-states' } as AccountOrg;

describe('findOwnerOrgToSwitch', () => {
  it('returns the owner org when the user belongs to it and another org is current', () => {
    expect(findOwnerOrgToSwitch('org-states', 'org-udemy', [udemy, states])).toBe(states);
  });

  it('returns null when the owner org is already current', () => {
    expect(findOwnerOrgToSwitch('org-states', 'org-states', [udemy, states])).toBeNull();
  });

  it('returns null when the user does not belong to the owner org', () => {
    expect(findOwnerOrgToSwitch('org-other', 'org-udemy', [udemy, states])).toBeNull();
  });

  it('returns null while the owner org is unknown', () => {
    expect(findOwnerOrgToSwitch(undefined, 'org-udemy', [udemy, states])).toBeNull();
  });
});
