import * as z from 'zod';

import {
  LIVE_SESSION_REMINDER_MAX_COUNT,
  LIVE_SESSION_REMINDER_MAX_OFFSET_MINUTES,
  LIVE_SESSION_REMINDER_MIN_OFFSET_MINUTES,
  LIVE_SESSION_REMINDER_STATUS_VALUES
} from '../../constants/live-session-reminder';

export const ZLiveSessionReminderOffsets = z
  .array(z.number().int().min(LIVE_SESSION_REMINDER_MIN_OFFSET_MINUTES).max(LIVE_SESSION_REMINDER_MAX_OFFSET_MINUTES))
  .max(LIVE_SESSION_REMINDER_MAX_COUNT)
  .refine((offsets) => new Set(offsets).size === offsets.length, {
    message: 'Reminder offsets must be unique'
  });
export type TLiveSessionReminderOffsets = z.infer<typeof ZLiveSessionReminderOffsets>;

export const ZLiveSessionReminderDeliveriesQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: z.enum(LIVE_SESSION_REMINDER_STATUS_VALUES).optional(),
  lessonId: z.uuid().optional()
});
export type TLiveSessionReminderDeliveriesQuery = z.infer<typeof ZLiveSessionReminderDeliveriesQuery>;
