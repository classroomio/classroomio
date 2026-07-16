import * as z from 'zod';

export const ZPersonalEmailNotificationToggleFields = {
  newStudent: z.boolean(),
  newSubmission: z.boolean(),
  gradingResult: z.boolean(),
  newsfeed: z.boolean(),
  quizAssigned: z.boolean(),
  cohortReminder: z.boolean(),
  session: z.boolean(),
  courseCompletion: z.boolean()
};

export const ZMemberEmailNotificationPreferences = z.object(ZPersonalEmailNotificationToggleFields);

export type TMemberEmailNotificationPreferences = z.infer<typeof ZMemberEmailNotificationPreferences>;

export const ZMemberEmailNotificationPreferencesUpdate = z.object(ZPersonalEmailNotificationToggleFields).partial();

export type TMemberEmailNotificationPreferencesUpdate = z.infer<typeof ZMemberEmailNotificationPreferencesUpdate>;
