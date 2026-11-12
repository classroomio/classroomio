export { mcpRateLimitResponse } from '../courses/docs';

export const TAG = 'Course Templates';
export const ORG_TEAM_RULE = 'the key creator must be an org admin or tutor';
export const ORG_ADMIN_RULE = 'the key creator must be an org admin';

export const forbiddenResponses = {
  read: {
    description: 'Missing the course:read scope, or the key creator is not an org admin or tutor'
  },
  create: {
    description: 'Missing the course:write scope, or the key creator is not an org admin'
  },
  save: {
    description:
      'Missing the course:write scope, the key creator is not an org admin, or the plan has no templates left (UPGRADE_REQUIRED)'
  }
};
