import * as z from 'zod';

/**
 * Background motion options for the public course callout.
 */
export const ZCourseCalloutAnimation = z.enum(['waves', 'dotted', 'none']);
export type TCourseCalloutAnimation = z.infer<typeof ZCourseCalloutAnimation>;

/**
 * Creator-configured callout shown on public course lesson pages.
 * Rendered inline at the bottom of every item body, and as the full replacement
 * for locked items.
 */
export const ZCourseCallout = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(500),
  buttonLabel: z.string().min(1).max(40),
  buttonUrl: z.string().url(),
  animation: ZCourseCalloutAnimation.default('waves')
});
export type TCourseCallout = z.infer<typeof ZCourseCallout>;

/**
 * Accepts the callout object, or `null` to clear it.
 */
export const ZCourseCalloutInput = ZCourseCallout.nullable();
export type TCourseCalloutInput = z.infer<typeof ZCourseCalloutInput>;
