import * as z from 'zod';

import { ZPublicApiCertificateVerificationStatus } from './certificate-verification';

// Response shapes for OpenAPI docs only; handlers don't validate against them. Timestamps are Postgres text, not strict ISO.
export const ZPublicApiCertificateVerificationResponse = z.object({
  verificationId: z.string(),
  status: ZPublicApiCertificateVerificationStatus.describe(
    'revoked when the student was deleted from the course or the organization, or their course progress was reset (archiving a student or resetting a compliance cycle does not revoke); otherwise expired once expiresAt has passed; otherwise valid.'
  ),
  studentName: z.string().nullable().describe('The current name on the student profile; null when it is empty.'),
  courseTitle: z.string(),
  organizationName: z.string(),
  issuedAt: z.string(),
  expiresAt: z
    .string()
    .nullable()
    .describe('Set for compliance courses only; null means the certificate never expires.'),
  revokedAt: z.string().nullable()
});
