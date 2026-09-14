import * as z from 'zod';

/**
 * A bulk lifecycle change too large to apply inside a request.
 *
 * Carries the resolved member ids rather than the filter: the target was
 * verified against the admin's preview hash before enqueueing, and re-running
 * the filter in the worker would hit a different population, since the action
 * itself changes who matches.
 *
 * Chunked by the worker so each transaction stays small.
 */
export const ZAudienceBulkActionPayload = z.object({
  organizationId: z.string().min(1),
  actorProfileId: z.string().min(1),
  action: z.enum(['deactivate', 'reactivate', 'archive', 'unarchive', 'delete']),
  memberIds: z.array(z.number().int().positive()).min(1),
  reason: z.string().max(500).optional(),
  /** The filter the action came from, recorded on each audit row. */
  filterSnapshot: z.record(z.string(), z.unknown()).optional(),
  /** Members per transaction. */
  chunkSize: z.number().int().positive().max(500).default(200)
});

export type TAudienceBulkActionPayload = z.infer<typeof ZAudienceBulkActionPayload>;
