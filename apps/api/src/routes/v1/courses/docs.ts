export const COURSE_TEAM_RULE =
  'The automation actor (the key creator) must be a course tutor/admin or an org admin, or this fails with 403.';

export const mcpRateLimitResponse = {
  description: 'MCP keys only: the per-key or per-organization MCP rate limit was hit'
};
export const forbiddenResponse = {
  description:
    'The key lacks the public_api:* or course:member:read/write scope, or the automation actor is not a course tutor/admin or org admin'
};
