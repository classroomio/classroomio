export const COHORT_MEMBER_RULE =
  'The automation actor (the key creator) must be a member of the cohort or an org admin, or this fails with 403.';
export const COHORT_TEAM_RULE =
  'The automation actor (the key creator) must be a cohort tutor/admin or an org admin, or this fails with 403.';
export const PAGINATION_NOTE = 'Paginated with page (default 1) and limit (default 20, max 100).';

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

export const ACTOR_OWN_DATA_NOTE =
  "Returns data for the automation actor (the key creator) only, limited to cohorts in the key's organization.";
