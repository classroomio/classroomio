import * as z from 'zod';

export const CERTIFICATE_VERIFICATION_STATUSES = ['valid', 'expired', 'revoked'] as const;

export const ZPublicApiCertificateVerificationStatus = z.enum(CERTIFICATE_VERIFICATION_STATUSES);
export type TPublicApiCertificateVerificationStatus = z.infer<typeof ZPublicApiCertificateVerificationStatus>;

export const ZPublicApiVerifyCertificateParam = z.object({
  verificationId: z.string().uuid().describe('The verificationId of an issued certificate.')
});
export type TPublicApiVerifyCertificateParam = z.infer<typeof ZPublicApiVerifyCertificateParam>;
