import * as z from 'zod';

import { containsDisallowedHrefs, isAllowedHref } from '../shared';

export const ZLandingPageReview = z.object({
  id: z.number(),
  hide: z.boolean(),
  name: z.string().min(1).max(255),
  avatar_url: z
    .string()
    .max(2048)
    .refine((value) => !value || isAllowedHref(value), {
      message: 'URL scheme not allowed'
    }),
  rating: z.number().min(1).max(5).nullable(),
  created_at: z.number(),
  description: z.string().min(1).max(2000)
});
export type TLandingPageReview = z.infer<typeof ZLandingPageReview>;

export const ZLandingPageFaq = z.object({
  id: z.string().min(1),
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(2000)
});
export type TLandingPageFaq = z.infer<typeof ZLandingPageFaq>;

export const ZLandingPageInstructor = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string().min(1).max(255),
  role: z.string().max(255).optional(),
  imgUrl: z
    .string()
    .max(2048)
    .refine((value) => !value || isAllowedHref(value), {
      message: 'URL scheme not allowed'
    })
    .optional(),
  description: z.string().max(2000).optional(),
  coursesNo: z.union([z.string(), z.number()]).optional()
});
export type TLandingPageInstructor = z.infer<typeof ZLandingPageInstructor>;

export const ZLandingPage = z
  .object({
    // Header section (course parity: title/description, no show toggle)
    title: z.string().max(255).optional(),
    description: z.string().max(20000).optional(),
    showDescription: z.boolean().optional(),

    // Requirements section (course parity: rich HTML + show toggle)
    requirements: z.string().max(20000).optional(),
    showRequirements: z.boolean().optional(),

    // Visitor access section (path-only)
    visitorAccess: z.enum(['teaser', 'syllabus', 'preview']).optional(),

    // Goals section (course parity: rich HTML string + show toggle)
    goals: z.string().max(10000).optional(),
    showGoals: z.boolean().optional(),

    // Skills section (skills only, no tools; no show toggle like courses)
    skills: z.array(z.string().max(100)).max(30).optional(),

    // Instructors (min 1, no show toggle)
    instructors: z.array(ZLandingPageInstructor).min(1).max(20).optional(),

    // Reviews (course parity: array only, no section-level show toggle)
    reviews: z.array(ZLandingPageReview).max(20).optional(),

    // Certificate section (course parity)
    showCertificate: z.boolean().optional(),
    certificateTemplateUrl: z
      .string()
      .max(2048)
      .refine((value) => !value || isAllowedHref(value), {
        message: 'URL scheme not allowed'
      })
      .optional(),

    // Pricing section (course parity: payment fields only, no showPricing/showSavings)
    paymentEnabled: z.boolean().optional(),
    paymentLink: z
      .string()
      .max(2048)
      .refine((value) => !value || isAllowedHref(value), {
        message: 'URL scheme not allowed'
      })
      .optional(),
    showDiscount: z.boolean().optional(),
    discount: z.number().min(0).max(100).optional(),
    reward: z
      .object({
        show: z.boolean(),
        description: z.string().optional()
      })
      .optional(),

    // FAQs section (path-only)
    showFaqs: z.boolean().optional(),
    faqs: z.array(ZLandingPageFaq).max(30).optional(),

    // Rating
    showRating: z.boolean().optional(),
    rating: z
      .object({
        average: z.number().min(0).max(5),
        count: z.number().int().min(0)
      })
      .nullable()
      .optional()
  })
  .refine((val) => !val || !containsDisallowedHrefs(val), {
    message: 'Landing page contains disallowed links'
  });
export type TLandingPage = z.infer<typeof ZLandingPage>;
