import * as z from 'zod';

export const ZCourseInviteParam = z.object({
  courseId: z.string().min(1)
});
export type TCourseInviteParam = z.infer<typeof ZCourseInviteParam>;

export const ZCourseInviteRevokeParam = z.object({
  courseId: z.string().min(1),
  inviteId: z.string().uuid()
});
export type TCourseInviteRevokeParam = z.infer<typeof ZCourseInviteRevokeParam>;

export const ZCourseInviteAuditParam = z.object({
  courseId: z.string().min(1),
  inviteId: z.string().uuid()
});
export type TCourseInviteAuditParam = z.infer<typeof ZCourseInviteAuditParam>;

export const ZCourseInviteTokenParam = z.object({
  token: z.string().min(1)
});
export type TCourseInviteTokenParam = z.infer<typeof ZCourseInviteTokenParam>;

export const ZCreatePublicCourseInviteLink = z.object({
  courseId: z.uuid()
});
export type TCreatePublicCourseInviteLink = z.infer<typeof ZCreatePublicCourseInviteLink>;

export const ZCourseInvitePreset = z.enum(['ONE_TIME_24H', 'MULTI_USE_7D', 'MULTI_USE_30D', 'CUSTOM']);
export type TCourseInvitePreset = z.infer<typeof ZCourseInvitePreset>;

export const ZCreateCourseInvite = z.object({
  preset: ZCourseInvitePreset.default('MULTI_USE_30D'),
  expiresAt: z.string().min(1).optional(),
  maxUses: z.number().int().min(1).max(1000).optional(),
  allowedEmails: z.array(z.string().email()).max(100).optional(),
  allowedDomains: z.array(z.string().min(1)).max(100).optional(),
  recipientEmails: z.array(z.string().email()).max(500).optional(),
  recipientCsv: z.string().max(25000).optional(),
  sendEmail: z.boolean().default(false),
  metadata: z.record(z.string(), z.unknown()).optional()
});
export type TCreateCourseInvite = z.infer<typeof ZCreateCourseInvite>;
