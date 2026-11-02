import * as z from 'zod';

import { DEVICE_PLATFORMS, MINUTES_PER_DAY, NOTIFICATION_CATEGORIES } from '../../constants/notifications';

export const ZNotificationListQuery = z.object({
  cursor: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20)
});
export type TNotificationListQuery = z.infer<typeof ZNotificationListQuery>;

export const ZNotificationIdParam = z.object({
  notificationId: z.uuid()
});
export type TNotificationIdParam = z.infer<typeof ZNotificationIdParam>;

const ZMinuteOfDay = z
  .number()
  .int()
  .min(0)
  .max(MINUTES_PER_DAY - 1);

export const ZQuietHours = z.object({
  startMinute: ZMinuteOfDay,
  endMinute: ZMinuteOfDay,
  timezone: z.string().min(1).max(64)
});
export type TQuietHours = z.infer<typeof ZQuietHours>;

export const ZNotificationCategoryPreferenceUpdate = z.object({
  category: z.enum(NOTIFICATION_CATEGORIES),
  push: z.boolean().optional(),
  inApp: z.boolean().optional(),
  email: z.boolean().optional()
});
export type TNotificationCategoryPreferenceUpdate = z.infer<typeof ZNotificationCategoryPreferenceUpdate>;

export const ZNotificationPreferencesUpdate = z.object({
  categories: z.array(ZNotificationCategoryPreferenceUpdate).max(NOTIFICATION_CATEGORIES.length).optional(),
  quietHours: ZQuietHours.nullable().optional()
});
export type TNotificationPreferencesUpdate = z.infer<typeof ZNotificationPreferencesUpdate>;

export const ZDeviceTokenRegister = z.object({
  token: z.string().min(1).max(255),
  platform: z.enum(DEVICE_PLATFORMS),
  appVersion: z.string().max(32).optional(),
  deviceName: z.string().max(120).optional(),
  locale: z.string().max(35).optional()
});
export type TDeviceTokenRegister = z.infer<typeof ZDeviceTokenRegister>;

export const ZDeviceTokenParam = z.object({
  token: z.string().min(1).max(255)
});
export type TDeviceTokenParam = z.infer<typeof ZDeviceTokenParam>;
