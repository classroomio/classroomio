import type { InferRequestType, InferResponseType } from '@cio/api/rpc-types';

import type { ApiClient } from '@/feature/common/api/api-client';

type NotificationsResponse = Extract<
  InferResponseType<ApiClient['account']['notifications']['$get'], 200>,
  { success: true }
>;

export type NotificationPage = NotificationsResponse['data'];

export type NotificationItem = NotificationPage['items'][number];

export type NotificationType = NotificationItem['type'];

export type NotificationCategory = NotificationItem['category'];

type PreferencesResponse = Extract<
  InferResponseType<ApiClient['account']['notification-preferences']['$get'], 200>,
  { success: true }
>;

export type NotificationPreferences = PreferencesResponse['data'];

export type CategoryPreference = NotificationPreferences['categories'][number];

export type QuietHours = NonNullable<NotificationPreferences['quietHours']>;

export type NotificationPreferencesUpdate = InferRequestType<
  ApiClient['account']['notification-preferences']['$put']
>['json'];

export type NotificationChannel = 'push' | 'inApp' | 'email';

export type DeviceTokenInput = InferRequestType<ApiClient['account']['device-tokens']['$post']>['json'];

/** Data a ClassroomIO push carries so a tap can route without a fetch. */
export type PushPayload = {
  notificationId?: string;
  type?: string;
  entityId?: string;
  deepLink?: string;
  orgId?: string;
};

export type PushPermission = 'granted' | 'undetermined' | 'denied' | 'unavailable';
