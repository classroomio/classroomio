export const COHORT_MEMBER_RULE = 'the key creator must be a cohort member or an org admin';
export const COHORT_TEAM_RULE = 'the key creator must be a cohort tutor/admin or an org admin';

export const cohortForbiddenResponses = {
  scope: { description: 'Missing the cohort:read/write scope' },
  member: {
    description: 'Missing the cohort:read/write scope, or the key creator is not a cohort member or org admin'
  },
  team: {
    description: 'Missing the cohort:read/write scope, or the key creator is not a cohort tutor/admin or org admin'
  }
};
