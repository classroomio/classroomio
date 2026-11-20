import * as z from 'zod';

import {
  STARTER_JOB_WARNINGS,
  STARTER_LESSONS_PER_SECTION,
  STARTER_SECTIONS_PER_COURSE
} from '../../constants/onboarding';
import { ONBOARDING_CONTEXT_MODES, ONBOARDING_DESCRIPTION_MAX_LENGTH, ONBOARDING_FIRST_OUTCOMES } from './onboarding';

export const ZStarterBlueprintLesson = z.object({
  title: z.string().trim().min(3).max(90),
  bodyHtml: z
    .string()
    .trim()
    .min(200)
    .max(6000)
    .describe(
      'Lesson body HTML, without the title. Use h3, h4, p, ul, ol, li, strong and em only. No h1 or h2, no scripts, styles, images or links.'
    )
});
export type TStarterBlueprintLesson = z.infer<typeof ZStarterBlueprintLesson>;

export const ZStarterBlueprintSection = z.object({
  title: z.string().trim().min(3).max(80),
  lessons: z.array(ZStarterBlueprintLesson).length(STARTER_LESSONS_PER_SECTION)
});
export type TStarterBlueprintSection = z.infer<typeof ZStarterBlueprintSection>;

/** One starter course's content. The course title is fixed per slot and is not part of the blueprint. */
export const ZStarterBlueprint = z.object({
  description: z.string().trim().min(40).max(400),
  sections: z.array(ZStarterBlueprintSection).length(STARTER_SECTIONS_PER_COURSE)
});
export type TStarterBlueprint = z.infer<typeof ZStarterBlueprint>;

export const ZOnboardingStarterInput = z.object({
  productName: z.string().trim().min(1).max(80),
  firstOutcome: z.enum(ONBOARDING_FIRST_OUTCOMES),
  contextMode: z.enum(ONBOARDING_CONTEXT_MODES),
  websiteUrl: z.string().max(2048).optional(),
  description: z.string().max(ONBOARDING_DESCRIPTION_MAX_LENGTH).optional(),
  jobRole: z.string().max(40),
  companySize: z.string().max(20),
  learningMethod: z.string().max(40),
  locale: z.string().max(10)
});
export type TOnboardingStarterInput = z.infer<typeof ZOnboardingStarterInput>;

export const ZOnboardingWebsiteExtraction = z.object({
  finalUrl: z.string().max(2048).nullable(),
  pageTitle: z.string().max(200).nullable(),
  sourceUrls: z.array(z.string().max(2048)).max(10),
  warning: z.enum(STARTER_JOB_WARNINGS).nullable()
});
export type TOnboardingWebsiteExtraction = z.infer<typeof ZOnboardingWebsiteExtraction>;
