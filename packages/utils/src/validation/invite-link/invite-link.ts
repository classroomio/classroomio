import * as z from 'zod';

/** Resources that support a shareable join link. Extend with the accept dispatcher. */
export const ZInviteLinkResourceType = z.enum(['COURSE', 'COHORT']);
export type TInviteLinkResourceType = z.infer<typeof ZInviteLinkResourceType>;

export const ZInviteLinkTokenParam = z.object({
  token: z.string().min(10).max(512)
});
export type TInviteLinkTokenParam = z.infer<typeof ZInviteLinkTokenParam>;

export const ZToggleInviteLink = z.object({
  isRevoked: z.boolean()
});
export type TToggleInviteLink = z.infer<typeof ZToggleInviteLink>;
