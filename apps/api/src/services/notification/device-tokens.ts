import { deleteDeviceToken, upsertDeviceToken } from '@cio/db/queries/notifications/device-token';
import type { TDeviceTokenRegister } from '@cio/utils/validation/notifications';

export async function registerDeviceToken(profileId: string, input: TDeviceTokenRegister) {
  const row = await upsertDeviceToken({ profileId, ...input });

  return { id: row.id, platform: row.platform, lastSeenAt: row.lastSeenAt };
}

/** Removes the token from this profile. Unknown tokens succeed so sign-out never fails on it. */
export async function unregisterDeviceToken(profileId: string, token: string) {
  const removed = await deleteDeviceToken(profileId, token);

  return { removed };
}
