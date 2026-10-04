import * as z from 'zod';

export const ZUpdateOrgCapability = z.object({
  isEnabled: z.boolean()
});

export type TUpdateOrgCapability = z.infer<typeof ZUpdateOrgCapability>;

import { ZCertificateDesign, type TCertificateDesign } from '../course';

export const ZCreateOrgCertificatePreset = z
  .object({
    name: z.string().trim().min(1).max(128),
    description: z.string().trim().max(500).optional(),
    design: ZCertificateDesign
  })
  .strict();

export const ZUpdateOrgCertificatePreset = z
  .object({
    name: z.string().trim().min(1).max(128).optional(),
    description: z.string().trim().max(500).optional().nullable(),
    design: ZCertificateDesign.optional()
  })
  .strict()
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'At least one certificate preset field is required'
  });

export type TCreateOrgCertificatePreset = z.infer<typeof ZCreateOrgCertificatePreset>;
export type TUpdateOrgCertificatePreset = z.infer<typeof ZUpdateOrgCertificatePreset>;

export const ZApplyCertificatePreset = z
  .object({
    presetId: z.string().uuid()
  })
  .strict();

export type TApplyCertificatePreset = z.infer<typeof ZApplyCertificatePreset>;
