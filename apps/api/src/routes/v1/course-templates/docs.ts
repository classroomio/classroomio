export { mcpRateLimitResponse } from '../courses/docs';

export const TAG = 'Course Templates';
export const ORG_TEAM_RULE = 'the key creator must be an org admin or tutor';
export const ORG_ADMIN_RULE = 'the key creator must be an org admin';

const ROLE_CHECKED_NOTE = "The key creator's role is checked on every call, so losing access ends it for the key too.";

export const forbiddenResponses = {
  read: {
    description: `The key has neither the public_api:* nor the course:read scope, or the automation actor is not an organization admin or tutor. ${ROLE_CHECKED_NOTE}`
  },
  create: {
    description: `The key has neither the public_api:* nor the course:write scope, or the automation actor is not an organization admin. ${ROLE_CHECKED_NOTE}`
  },
  save: {
    description: `The key has neither the public_api:* nor the course:write scope, the automation actor is not an organization admin, or the organization has used every template its plan includes (UPGRADE_REQUIRED). ${ROLE_CHECKED_NOTE}`
  }
};
