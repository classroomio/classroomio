import { createAutomationChangeLog } from '@cio/db/queries/organization';
import type { TOrganizationApiKey } from '@cio/db/types';

import { getAutomationChannel } from '@api/utils/event-source';

const MAX_ROUTE_LENGTH = 255;
const MAX_ACTION_LENGTH = 160;
const MAX_RESOURCE_ID_LENGTH = 255;

export type TAutomationChange = {
  automationKey: TOrganizationApiKey;
  oauthClientId?: string | null;
  clientName: string | null;
  actorProfileId: string | null;
  method: string;
  route: string;
  action: string;
  resourceIds: Record<string, string>;
  statusCode: number;
};

function truncateResourceIds(resourceIds: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(resourceIds).map(([name, value]) => [name, value.slice(0, MAX_RESOURCE_ID_LENGTH)])
  );
}

/**
 * Stores one successful write made with an API key or OAuth token, attributed to the key's organization.
 * Throws when the row cannot be written.
 */
export async function recordAutomationChange(change: TAutomationChange) {
  const resourceIds = truncateResourceIds(change.resourceIds);
  const channel = getAutomationChannel(change.automationKey);

  return createAutomationChangeLog({
    organizationId: change.automationKey.organizationId,
    organizationApiKeyId: change.automationKey.id,
    oauthClientId: change.oauthClientId ?? null,
    keyType: change.automationKey.type,
    channel,
    clientName: change.clientName,
    actorProfileId: change.actorProfileId,
    method: change.method,
    route: change.route.slice(0, MAX_ROUTE_LENGTH),
    action: change.action.slice(0, MAX_ACTION_LENGTH),
    resourceIds,
    statusCode: change.statusCode
  });
}
