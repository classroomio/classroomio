export const COHORT_MEMBER_RULE = 'the key creator must be a cohort member or an org admin';
export const COHORT_TEAM_RULE = 'the key creator must be a cohort tutor/admin or an org admin';

export const cohortForbiddenResponses = {
  scope: { description: 'The key lacks the public_api:* or cohort:read/write scope' },
  member: {
    description:
      'The key lacks the public_api:* or cohort:read/write scope, or the automation actor is not a cohort member or org admin'
  },
  team: {
    description:
      'The key lacks the public_api:* or cohort:read/write scope, or the automation actor is not a cohort tutor/admin or org admin'
  }
};
