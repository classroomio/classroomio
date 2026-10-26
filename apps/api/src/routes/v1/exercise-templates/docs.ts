export { mcpRateLimitResponse } from '../courses/docs';

export const TAG = 'Exercise Templates';
export const ORG_TEAM_RULE = 'the key creator must be an org admin or tutor';
export const forbiddenResponse = {
  description:
    'The key has neither the public_api:* nor the course:exercise:read scope, or the automation actor is not an organization admin or tutor.'
};
