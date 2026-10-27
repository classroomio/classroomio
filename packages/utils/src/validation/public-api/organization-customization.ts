import * as z from 'zod';

const ZImageUrl = z.url({ protocol: /^https?$/ }).nullable();

export const ZPublicApiUpdateOrganizationCustomization = z
  .object({
    dashboard: z
      .object({
        community: z.boolean().optional().describe('Show Community in the student sidebar'),
        exercise: z.boolean().optional().describe('Show Exercises in the student sidebar'),
        bannerImage: ZImageUrl.optional().describe(
          'Public http(s) URL of the dashboard banner image; null removes it. Upload the image first, then send its URL.'
        ),
        bannerText: z.string().max(500).optional().describe('Dashboard banner text; an empty string removes it')
      })
      .optional(),
    course: z
      .object({
        newsfeed: z.boolean().optional().describe('Let students open the course News Feed'),
        grading: z.boolean().optional().describe('Let students see their marks in a course')
      })
      .optional(),
    apps: z
      .object({
        comments: z.boolean().optional().describe('Show lesson comments, where the course and lesson allow them')
      })
      .optional(),
    auth: z
      .object({
        backgroundImage: ZImageUrl.optional().describe(
          'Public http(s) URL of the login and signup page background; null restores the default. Setting one needs a paid plan.'
        )
      })
      .optional()
  })
  .refine((data) => Object.values(data).some((section) => section && Object.keys(section).length > 0), {
    message: 'No fields to update'
  });
export type TPublicApiUpdateOrganizationCustomization = z.infer<typeof ZPublicApiUpdateOrganizationCustomization>;
