import * as z from 'zod';

import { MAX_WEEKLY_LESSON_TARGET, MIN_WEEKLY_LESSON_TARGET } from '../../constants/learner-goals';
import { isValidTimeZone } from '../../functions/learner-streak';

const ZTimeZone = z.string().max(64).refine(isValidTimeZone, { message: 'Unknown time zone' });

export const ZGetLearnerGoalsQuery = z.object({
  timezone: ZTimeZone.optional()
});
export type TGetLearnerGoalsQuery = z.infer<typeof ZGetLearnerGoalsQuery>;

export const ZUpdateLearnerGoal = z.object({
  weeklyLessonTarget: z.number().int().min(MIN_WEEKLY_LESSON_TARGET).max(MAX_WEEKLY_LESSON_TARGET)
});
export type TUpdateLearnerGoal = z.infer<typeof ZUpdateLearnerGoal>;

export const ZUpdateLearnerTimezone = z.object({
  timezone: ZTimeZone
});
export type TUpdateLearnerTimezone = z.infer<typeof ZUpdateLearnerTimezone>;

export const ZLiveClassParam = z.object({
  lessonId: z.uuid()
});
export type TLiveClassParam = z.infer<typeof ZLiveClassParam>;

export const ZLearnerAssistantChatBody = z.object({
  messages: z.array(z.any()).min(1).max(100)
});
export type TLearnerAssistantChatBody = z.infer<typeof ZLearnerAssistantChatBody>;
