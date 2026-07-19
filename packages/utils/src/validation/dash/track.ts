import * as z from 'zod';

const CLIENT_EVENT_TYPES = [
  'landing_view',
  'course_page_view',
  'note_page_view',
  'signup_view',
  'signin_view',
  'pricing_view',
  'cta_click'
] as const;

export const ZTrackEvent = z.object({
  eventType: z.enum(CLIENT_EVENT_TYPES),
  occurredAt: z.string().optional(),
  orgId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
  noteId: z.string().uuid().optional(),
  path: z.string().max(2048).optional(),
  referrerHost: z.string().max(255).optional(),
  utmSource: z.string().max(128).optional(),
  utmMedium: z.string().max(128).optional(),
  utmCampaign: z.string().max(128).optional(),
  locale: z.string().max(8).optional(),
  props: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional()
});

export const ZIngestBatch = z.object({
  sessionId: z.string().min(8).max(128),
  events: z.array(ZTrackEvent).min(1).max(50)
});

export const ZDeidentifyUser = z.object({
  userId: z.string().uuid()
});

export type TTrackEvent = z.infer<typeof ZTrackEvent>;
export type TIngestBatch = z.infer<typeof ZIngestBatch>;
export type TDeidentifyUser = z.infer<typeof ZDeidentifyUser>;
