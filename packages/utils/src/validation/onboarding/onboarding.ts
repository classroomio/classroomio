import * as z from 'zod';

const fullnameValidation = z.string().min(5);

export const ZOnboardingStep1 = z.object({
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
export type TOnboardingStep1 = z.infer<typeof ZOnboardingStep1>;

export const ZOnboardingStep2 = z.object({
  fullname: fullnameValidation,
  goal: z.string().min(5),
  source: z.string().min(5)
});
export type TOnboardingStep2 = z.infer<typeof ZOnboardingStep2>;
