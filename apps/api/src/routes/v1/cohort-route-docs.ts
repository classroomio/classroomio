export const COHORT_MEMBER_RULE =
  'The automation actor (the key creator) must be a member of the cohort or an org admin, or this fails with 403.';
export const COHORT_TEAM_RULE =
  'The automation actor (the key creator) must be a cohort tutor/admin or an org admin, or this fails with 403.';
export const PAGINATION_NOTE = 'Paginated with page (default 1) and limit (default 20, max 100).';

export const cohortForbiddenResponses = {
  member: {
    description: 'The key lacks the public_api:* scope, or the automation actor is not a cohort member or org admin'
  },
  team: {
    description:
      'The key lacks the public_api:* scope, or the automation actor is not a cohort tutor/admin or org admin'
  }
};

export const NewsfeedPageResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    data: {
      type: 'object' as const,
      properties: {
        items: { type: 'array' as const, items: { type: 'object' as const } },
        totalCount: { type: 'number' as const },
        hasMore: { type: 'boolean' as const },
        nextCursor: { type: 'string' as const, nullable: true }
      },
      required: ['items', 'totalCount', 'hasMore', 'nextCursor']
    }
  },
  required: ['success', 'data']
};
