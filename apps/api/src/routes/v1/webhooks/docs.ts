export const WEBHOOK_SUBSCRIPTIONS_TAG = 'Webhook Subscriptions';

export const CONNECTED_APP_RULE =
  'only apps connected through OAuth can call it, and the admin who connected the app must still be an org admin';

const webhookForbiddenBase = (scope: 'webhook:subscription:read' | 'webhook:subscription:write') =>
  `The token lacks the ${scope} scope, the credential is an automation key (code OAUTH_CONNECTION_REQUIRED), the plan does not include webhooks (code UPGRADE_REQUIRED), or the actor is not an organization admin (code ORG_TEAM_NOT_AUTHORIZED)`;

export const webhookSubscriptionForbidden = (scope: 'webhook:subscription:read' | 'webhook:subscription:write') => ({
  description: `${webhookForbiddenBase(scope)}, or the plan's trigger subscription cap is reached (code WEBHOOK_SUBSCRIPTION_LIMIT_EXCEEDED)`
});

export const webhookSubscriptionForbiddenWithoutCap = (
  scope: 'webhook:subscription:read' | 'webhook:subscription:write'
) => ({
  description: webhookForbiddenBase(scope)
});
