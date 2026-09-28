import * as z from 'zod';

// @cio/jobs has no @cio/utils dependency, so the role ids are inlined here
// (TUTOR = 2, STUDENT = 3). Keep in sync with `ROLE` in `@cio/utils/constants`.
const TUTOR_ROLE_ID = 2;
const STUDENT_ROLE_ID = 3;

/**
 * A learning-path member add too large to run inside the request.
 *
 * Carries the validated member entries (not live lookups): profiles may gain
 * accounts and org membership may change between enqueue and execution, so
 * the worker resolves email-only entries itself, exactly like the sync path.
 *
 * Chunked by the worker so each transaction stays small.
 */
export const ZPathBulkEnrollPayload = z
  .object({
    organizationId: z.string().min(1),
    actorProfileId: z.string().min(1),
    pathId: z.string().min(1),
    members: z
      .array(
        z.object({
          profileId: z.string().uuid().optional(),
          email: z.string().email().optional(),
          roleId: z.union([z.literal(TUTOR_ROLE_ID), z.literal(STUDENT_ROLE_ID)])
        })
      )
      .min(1),
    /** Members per transaction. */
    chunkSize: z.number().int().positive().max(500).default(50)
  })
  .refine((payload) => payload.members.every((member) => Boolean(member.profileId) || Boolean(member.email)), {
    message: 'Each member must provide a profileId or email'
  });

export type TPathBulkEnrollPayload = z.infer<typeof ZPathBulkEnrollPayload>;
