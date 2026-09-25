import * as z from 'zod';

export const ZUpdateOrgCapability = z.object({
  isEnabled: z.boolean()
});

export type TUpdateOrgCapability = z.infer<typeof ZUpdateOrgCapability>;

import { ZCertificateDesign, type TCertificateDesign } from '../course';

export const ZCreateOrgCertificatePreset = z.object({
  name: z.string().min(1).max(128),
  description: z.string().max(500).optional(),
  design: ZCertificateDesign
});

export const ZUpdateOrgCertificatePreset = z.object({
  name: z.string().min(1).max(128).optional(),
  description: z.string().max(500).optional().nullable(),
  design: ZCertificateDesign.optional()
});

export type TCreateOrgCertificatePreset = z.infer<typeof ZCreateOrgCertificatePreset>;
export type TUpdateOrgCertificatePreset = z.infer<typeof ZUpdateOrgCertificatePreset>;

export const ZApplyCertificatePreset = z.object({
  presetId: z.string().uuid()
});

export type TApplyCertificatePreset = z.infer<typeof ZApplyCertificatePreset>;
