import * as z from 'zod';

export const ZLearningChatBody = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(4000)
});

export const ZLearningOfferParams = z.object({ offerId: z.string().uuid() });
export const ZPersonalLearningJourneyParams = z.object({ journeyId: z.string().uuid() });
export const ZPersonalLearningJourneyChatBody = z.object({
  message: z.string().trim().min(1).max(4000)
});
export const ZPersonalLearningRetryBody = z.object({
  sourceUrls: z.array(z.string().url().max(2048)).min(1).max(5)
});
export const ZAcceptLearningOfferBody = z.object({
  consent: z.literal(true),
  goal: z.string().trim().min(1).max(2000),
  language: z.string().trim().min(2).max(16).default('en'),
  targetStudyDays: z.union([z.literal(1), z.literal(7), z.literal(30)]),
  dailyMinutes: z.union([z.literal(30), z.literal(60), z.literal(120)])
});
