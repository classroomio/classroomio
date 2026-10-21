import { AppError } from '@api/utils/errors';
import { authorizePluginRequest } from '@api/services/plugin/authorization';
import { getProfileById } from '@cio/db/queries';

export interface PluginIdentityProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  locale: string;
  role: 'admin' | 'tutor' | 'student';
}

export async function getPluginIdentityProfile(
  installationId: string,
  orgId: string,
  actorId?: string
): Promise<PluginIdentityProfile> {
  if (!actorId) {
    throw new AppError('Actor ID is required for identity profile', 'BAD_REQUEST', 400);
  }

  const auth = await authorizePluginRequest({
    installationId,
    organizationId: orgId,
    actorId,
    requiredScope: 'identity.profile:read'
  });

  const profile = await getProfileById(actorId);
  if (!profile) {
    throw new AppError('Profile not found', 'NOT_FOUND', 404);
  }

  const trimmedFullname = profile.fullname?.trim();
  const trimmedUsername = profile.username?.trim();
  const displayName = trimmedFullname || trimmedUsername || 'User';
  const role = auth.organizationRole ?? 'student';

  return {
    id: profile.id,
    displayName,
    avatarUrl: profile.avatarUrl ?? null,
    locale: profile.locale ?? 'en',
    role
  };
}
