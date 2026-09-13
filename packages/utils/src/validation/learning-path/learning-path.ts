import * as z from 'zod';

import {
  LEARNING_PATH_DIFFICULTY_VALUES,
  LEARNING_PATH_STATUS_VALUES,
  LEARNING_PATH_VISITOR_ACCESS_VALUES
} from '../../constants/learning-path';
import { ROLE } from '../../constants/roles';

export const ZLearningPathStatus = z.enum(LEARNING_PATH_STATUS_VALUES);
export const ZLearningPathDifficulty = z.enum(LEARNING_PATH_DIFFICULTY_VALUES);
export const ZLearningPathVisitorAccess = z.enum(LEARNING_PATH_VISITOR_ACCESS_VALUES);

const ZLearningPathTestimonial = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  role: z.string().max(160).optional(),
  avatarUrl: z.string().url().optional(),
  quote: z.string().min(1).max(1000)
});

const ZLearningPathFaq = z.object({
  id: z.string().min(1),
  question: z.string().min(1).max(300),
  answer: z.string().min(1).max(2000)
});

export const ZLearningPathLandingPage = z.object({
  headline: z.string().max(160).optional(),
  subheadline: z.string().max(600).optional(),
  visitorAccess: ZLearningPathVisitorAccess.optional(),
  outcomes: z.array(z.string().min(1).max(300)).max(12).optional(),
  skills: z.array(z.string().min(1).max(60)).max(24).optional(),
  showInstructors: z.boolean().optional(),
  showTestimonials: z.boolean().optional(),
  testimonials: z.array(ZLearningPathTestimonial).max(24).optional(),
  showFaqs: z.boolean().optional(),
  faqs: z.array(ZLearningPathFaq).max(24).optional(),
  showRating: z.boolean().optional(),
  rating: z.object({ average: z.number().min(0).max(5), count: z.number().int().min(0) }).optional()
});
export type TLearningPathLandingPage = z.infer<typeof ZLearningPathLandingPage>;

export const ZLearningPathCertificateDesign = z.object({
  templateId: z.enum(['classique', 'brutalist', 'noir', 'poster', 'minimal']).optional(),
  accentColor: z.string().max(40).optional(),
  subtitle: z.string().max(160).optional(),
  descriptionOverride: z.string().max(600).optional(),
  signatories: z
    .array(
      z.object({
        name: z.string().max(120),
        role: z.string().max(120),
        enabled: z.boolean().optional(),
        signatureUrl: z.string().url().optional()
      })
    )
    .max(2)
    .optional(),
  idFormat: z.string().max(60).optional()
});
export type TLearningPathCertificateDesign = z.infer<typeof ZLearningPathCertificateDesign>;

export const ZCreateLearningPath = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens')
    .optional()
});
export type TCreateLearningPath = z.infer<typeof ZCreateLearningPath>;

export const ZUpdateLearningPath = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens')
    .optional(),
  description: z.string().max(2000).nullable().optional(),
  coverImage: z.string().url().nullable().optional(),
  status: ZLearningPathStatus.optional(),
  difficulty: ZLearningPathDifficulty.nullable().optional(),
  estimatedDurationMinutes: z.number().int().min(0).max(100000).nullable().optional(),
  cost: z.number().int().min(0).optional(),
  currency: z.string().length(3).optional(),
  showSavings: z.boolean().optional(),
  sequentialUnlock: z.boolean().optional(),
  selfEnrollment: z.boolean().optional(),
  autoEnroll: z.boolean().optional(),
  certificateEnabled: z.boolean().optional(),
  certificateTitle: z.string().max(255).nullable().optional(),
  certificateIssuer: z.string().max(255).nullable().optional(),
  certificateDesign: ZLearningPathCertificateDesign.optional(),
  landingPage: ZLearningPathLandingPage.optional()
});
export type TUpdateLearningPath = z.infer<typeof ZUpdateLearningPath>;

export const ZAddCourseToLearningPath = z.object({
  courseId: z.string().uuid(),
  outcomes: z.array(z.string().min(1).max(300)).max(8).optional()
});
export type TAddCourseToLearningPath = z.infer<typeof ZAddCourseToLearningPath>;

export const ZUpdateLearningPathCourse = z.object({
  outcomes: z.array(z.string().min(1).max(300)).max(8)
});
export type TUpdateLearningPathCourse = z.infer<typeof ZUpdateLearningPathCourse>;

/** Full ordered list of the path's courses — reordering rewrites every position at once. */
export const ZReorderLearningPathCourses = z.object({
  courseIds: z.array(z.string().uuid()).min(1)
});
export type TReorderLearningPathCourses = z.infer<typeof ZReorderLearningPathCourses>;

export const ZAddLearningPathMembers = z.object({
  members: z
    .array(
      z.object({
        profileId: z.string().uuid().optional(),
        email: z.string().email().optional(),
        name: z.string().optional(),
        roleId: z.union([z.literal(ROLE.TUTOR), z.literal(ROLE.STUDENT)])
      })
    )
    .min(1)
    .refine((members) => members.every((member) => member.profileId || member.email), {
      message: 'Each member must include a profileId or email'
    })
});
export type TAddLearningPathMembers = z.infer<typeof ZAddLearningPathMembers>;
