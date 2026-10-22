import * as z from 'zod';

import { ZActorContext } from './media';

/**
 * Payload for the `activity-package` queue. The processor dispatches by
 * package format, so cmi5 and H5P add a processor, not a queue. Workers
 * re-fetch the version row for the latest state.
 */
export const ZActivityPackagePayload = z.object({
  mediaJobId: z.string().uuid(),
  assetId: z.string().uuid(),
  packageVersionId: z.string().uuid(),
  actorContext: ZActorContext
});
export type TActivityPackagePayload = z.infer<typeof ZActivityPackagePayload>;
