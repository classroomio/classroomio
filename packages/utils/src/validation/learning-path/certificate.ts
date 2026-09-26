import * as z from 'zod';

import { CERTIFICATE_TEMPLATE_IDS } from '@cio/certificates';
import { isAllowedHref } from '../shared';

export const ZLearningPathCertificateSignatory = z.object({
  name: z.string().min(1).max(255),
  role: z.string().max(255),
  enabled: z.boolean().optional(),
  signatureUrl: z
    .string()
    .max(2048)
    .refine((value) => !value || isAllowedHref(value), {
      message: 'URL scheme not allowed'
    })
    .optional()
});
export type TLearningPathCertificateSignatory = z.infer<typeof ZLearningPathCertificateSignatory>;

export const ZLearningPathCertificateDesign = z.object({
  templateId: z.enum(CERTIFICATE_TEMPLATE_IDS).optional(),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{3,8}$/, {
      message: 'Accent color must be a hex color'
    })
    .optional(),
  subtitle: z.string().max(255).optional(),
  descriptionOverride: z.string().max(2000).optional(),
  signatories: z.array(ZLearningPathCertificateSignatory).max(5).optional(),
  idFormat: z
    .string()
    .max(50)
    .refine((value) => !value || value.includes('{seq}'), {
      message: 'idFormat must contain {seq}'
    })
    .optional()
});
export type TLearningPathCertificateDesign = z.infer<typeof ZLearningPathCertificateDesign>;

export const ZLearningPathCertificateConfig = z.object({
  isDownloadable: z.boolean().optional(),
  emailMessage: z.string().max(5000).nullable().optional(),
  theme: z.string().optional(),
  design: ZLearningPathCertificateDesign.optional()
});
export type TLearningPathCertificateConfig = z.infer<typeof ZLearningPathCertificateConfig>;
