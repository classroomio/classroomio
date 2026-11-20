import * as z from 'zod';

export const ZComplianceOverview = z.object({
  orgId: z.string().uuid()
});

export type TComplianceOverview = z.infer<typeof ZComplianceOverview>;
