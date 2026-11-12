export const ORG_ADMIN_RULE = 'the key creator must be an org admin';

export const ORG_ADMIN_FORBIDDEN = 'the key creator is not an org admin';

export const teamForbiddenResponse = (scope: 'team:read' | 'team:write') => ({
  description: `Missing the ${scope} scope, or ${ORG_ADMIN_FORBIDDEN}`
});
