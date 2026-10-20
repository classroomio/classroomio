export const ORG_ADMIN_RULE = 'the key creator must be an org admin';

export const ORG_ADMIN_FORBIDDEN =
  "the automation actor is not an org admin. The key creator's role is checked on every call, so losing admin access ends it for the key too.";

export const teamForbiddenResponse = (scope: 'team:read' | 'team:write') => ({
  description: `The key has neither the public_api:* nor the ${scope} scope, or ${ORG_ADMIN_FORBIDDEN}`
});
