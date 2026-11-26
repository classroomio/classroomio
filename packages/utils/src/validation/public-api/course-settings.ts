import * as z from 'zod';

import { COURSE_PROGRESSION_MODES } from '../../functions/course-progression';

const PROGRESSION_MODE_DESCRIPTION =
  'free: students open any released item. sequential: each item opens once the previous required item is complete.';

export const ZPublicApiCourseSettingsResponse = z.object({
  progressionMode: z.enum(COURSE_PROGRESSION_MODES).describe(PROGRESSION_MODE_DESCRIPTION),
  allowSelfEnrollment: z.boolean().describe('Whether students may enroll themselves from the landing page or Explore'),
  allowMarkdownExport: z.boolean().describe('Whether public lesson pages offer Copy Page and Markdown export'),
  commentsEnabled: z.boolean().describe('Whether students can comment on lessons')
});
export type TPublicApiCourseSettingsResponse = z.infer<typeof ZPublicApiCourseSettingsResponse>;

export const ZPublicApiUpdateCourseSettings = z
  .object({
    progressionMode: z.enum(COURSE_PROGRESSION_MODES).optional().describe(PROGRESSION_MODE_DESCRIPTION),
    allowSelfEnrollment: z.boolean().optional().describe('A private course cannot allow self-enrollment.'),
    allowMarkdownExport: z.boolean().optional(),
    commentsEnabled: z.boolean().optional()
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Send at least one setting to update'
  })
  .describe('Send only the settings to change; omitted settings keep their current value.');
export type TPublicApiUpdateCourseSettings = z.infer<typeof ZPublicApiUpdateCourseSettings>;
