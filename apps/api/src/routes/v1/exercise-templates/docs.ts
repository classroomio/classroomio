export { PAGINATION_NOTE, mcpRateLimitResponse } from '../courses/docs';

export const TAG = 'Exercise Templates';
export const ORG_TEAM_RULE =
  'The automation actor (the key creator) must be an organization admin or tutor, or this fails with 403.';
export const forbiddenResponse = {
  description:
    'The key has neither the public_api:* nor the course:exercise:read scope, or the automation actor is not an organization admin or tutor'
};
