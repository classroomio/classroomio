export const WEBHOOK_SUBSCRIPTIONS_TAG = 'Webhook Subscriptions';

export const CONNECTED_APP_RULE =
  'only OAuth-connected apps can call it, and their connecting admin must still be an org admin';

const webhookForbiddenBase = (scope: 'webhook:subscription:read' | 'webhook:subscription:write') =>
  `${scope}; OAuth admin only. Codes: OAUTH_CONNECTION_REQUIRED, UPGRADE_REQUIRED, ORG_TEAM_NOT_AUTHORIZED`;

export const webhookSubscriptionForbidden = (scope: 'webhook:subscription:read' | 'webhook:subscription:write') => ({
  description: `${webhookForbiddenBase(scope)}, WEBHOOK_SUBSCRIPTION_LIMIT_EXCEEDED`
});

export const webhookSubscriptionForbiddenWithoutCap = (
  scope: 'webhook:subscription:read' | 'webhook:subscription:write'
) => ({
  description: webhookForbiddenBase(scope)
});
