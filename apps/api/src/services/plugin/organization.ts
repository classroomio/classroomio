import { AppError } from '@api/utils/errors';
import { authorizePluginRequest } from '@api/services/plugin/authorization';
import { getOrganizationById } from '@cio/db/queries';

export interface PluginOrganizationProfile {
  id: string;
  name: string;
  avatarUrl: string | null;
  locale: string;
}

export async function getPluginOrganizationProfile(
  installationId: string,
  orgId: string,
  actorId?: string
): Promise<PluginOrganizationProfile> {
  await authorizePluginRequest({
    installationId,
    organizationId: orgId,
    actorId,
    requiredScope: 'organization.profile:read'
  });

  const org = await getOrganizationById(orgId);
  if (!org) {
    throw new AppError('Organization not found', 'NOT_FOUND', 404);
  }

  return {
    id: org.id,
    name: org.name,
    avatarUrl: org.avatarUrl ?? null,
    locale: org.settings?.language?.locale ?? 'en'
  };
}
