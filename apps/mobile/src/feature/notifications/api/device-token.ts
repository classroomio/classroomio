import { request } from '@/feature/common/api/request';
import type { ApiClient } from '@/feature/common/api/api-client';
import type { DeviceTokenInput } from '@/feature/notifications/types/notifications';

export function registerDeviceToken(api: ApiClient, input: DeviceTokenInput) {
  return request(api.account['device-tokens'].$post({ json: input }));
}

export function unregisterDeviceToken(api: ApiClient, token: string) {
  return request(api.account['device-tokens'][':token'].$delete({ param: { token } }));
}
