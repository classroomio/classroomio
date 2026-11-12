import { describe, expect, it } from 'vitest';
import { ROLE } from '@cio/utils/constants';

import { findOrgById, groupOrgMemberships } from './org-memberships';

const learnerOrg = { id: 'org-learner', name: 'zeta academy', roleId: ROLE.STUDENT };
const secondLearnerOrg = { id: 'org-learner-2', name: 'Alpha School', roleId: ROLE.STUDENT };
const adminOrg = { id: 'org-admin', name: 'My Academy', roleId: ROLE.ADMIN };
const tutorOrg = { id: 'org-tutor', name: 'Bright Tutors', roleId: ROLE.TUTOR };

describe('groupOrgMemberships', () => {
  it('splits managed and learner memberships and sorts each by name', () => {
    const grouped = groupOrgMemberships([learnerOrg, adminOrg, secondLearnerOrg, tutorOrg]);

    expect(grouped.managed.map((org) => org.id)).toEqual(['org-tutor', 'org-admin']);
    expect(grouped.learning.map((org) => org.id)).toEqual(['org-learner-2', 'org-learner']);
  });

  it('does not reorder the input array', () => {
    const organizations = [learnerOrg, adminOrg];

    groupOrgMemberships(organizations);

    expect(organizations).toEqual([learnerOrg, adminOrg]);
  });
});

describe('findOrgById', () => {
  it('finds the org that was just created even when another membership comes first', () => {
    expect(findOrgById([learnerOrg, adminOrg], 'org-admin')).toBe(adminOrg);
  });

  it('returns undefined for an unknown id', () => {
    expect(findOrgById([learnerOrg], 'missing')).toBeUndefined();
  });
});
