import * as z from 'zod';

export const ZCertificateRevoke = z.object({
  reason: z.string().min(1).max(500),
  note: z.string().max(2000).optional()
});

export type TCertificateRevoke = z.infer<typeof ZCertificateRevoke>;

export const ZCertificateIdParam = z.object({
  courseId: z.string().min(1),
  certificateId: z.string().min(1)
});

export const ZCertificateMemberParam = z.object({
  courseId: z.string().min(1),
  memberId: z.string().min(1)
});

export const ZCertificateMetadata = z.object({
  metadata: z.record(z.string(), z.string().max(500))
});

export type TCertificateMetadata = z.infer<typeof ZCertificateMetadata>;
