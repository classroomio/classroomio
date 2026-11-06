import { getOrganizationById } from '@cio/db/queries/organization';
import { listLatestWebhookEvents } from '@cio/db/queries/webhook';
import { buildWebhookExampleEnvelope } from '@cio/utils/validation/webhook';
import type { TPublicApiWebhookSamplesQuery } from '@cio/utils/validation/public-api';

import { assertWebhooksAllowed } from '@api/services/webhook/webhook';
import { assertOrgAdmin } from '../shared';

/**
 * The organization's latest real events of the requested type, or one documented example when none exist yet.
 * Every item has the exact shape of a delivery.
 */
export async function listWebhookSamplesService(
  orgId: string,
  actorId: string | null,
  query: TPublicApiWebhookSamplesQuery
) {
  await assertOrgAdmin(orgId, actorId);
  await assertWebhooksAllowed(orgId);

  const events = await listLatestWebhookEvents(orgId, query.eventType, {
    courseId: query.courseId,
    cohortId: query.cohortId,
    limit: query.limit
  });

  if (events.length > 0) return events;

  const organization = await getOrganizationById(orgId);
  const exampleOrganization = { id: orgId, name: organization?.name ?? null, siteName: organization?.siteName ?? null };

  return [buildWebhookExampleEnvelope(query.eventType, exampleOrganization)];
}
