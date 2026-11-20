import * as z from 'zod';

/**
 * Payload for the onboarding starter-course job. The worker re-loads the job row from Postgres by id.
 */
export const ZOnboardingStarterPayload = z.object({
  jobId: z.string().uuid(),
  organizationId: z.string().uuid()
});

export type TOnboardingStarterPayload = z.infer<typeof ZOnboardingStarterPayload>;
