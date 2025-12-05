import * as z from 'zod';

const fullnameValidation = z.string().min(5);

export const ZOnboardingCreateOrg = z.object({
  fullname: fullnameValidation,
  orgName: z
    .string()
    .min(5)
    .refine((val) => !/^[-]|[-]$/.test(val), {
      message: 'validations.organization_name.hyphen_rule'
    }),
  siteName: z
    .string()
    .min(5)
    .refine((val) => !/^[-]|[-]$/.test(val), {
      message: 'validations.site_name.hyphen_rule'
    })
});
export type TOnboardingCreateOrg = z.infer<typeof ZOnboardingCreateOrg>;

export const ZOnboardingUpdateMetadata = z.object({
  fullname: fullnameValidation,
  goal: z.string().min(5),
  source: z.string().min(5)
});
export type TOnboardingUpdateMetadata = z.infer<typeof ZOnboardingUpdateMetadata>;
