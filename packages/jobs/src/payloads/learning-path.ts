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
    chunkSize: z.number().int().positive().max(500).default(50),
    /** False skips welcome/invite sends; invites are still created. */
    sendEmail: z.boolean().default(true)
  })
  .refine((payload) => payload.members.every((member) => Boolean(member.profileId) || Boolean(member.email)), {
    message: 'Each member must provide a profileId or email'
  });

export type TPathBulkEnrollPayload = z.infer<typeof ZPathBulkEnrollPayload>;

export interface PathBulkEnrollFailure {
  /** profileId when known, otherwise the invite email. */
  key: string;
  reason: string;
}

export interface PathBulkEnrollOutcome {
  requested: number;
  enrolled: number;
  invited: number;
  failed: PathBulkEnrollFailure[];
}

/**
 * Re-derive the learning-path progress cache (and completion, certificate and
 * completion email) for members of one path, after an event that changes it
 * without a learner action: a course added, removed or reordered, sequential
 * unlock toggled, a grade, or an enrollment of someone with prior progress.
 */
export const ZLearningPathProgressSyncPayload = z.object({
  pathId: z.string().uuid(),
  /** Omit to sync every active student of the path. */
  profileIds: z.array(z.string().uuid()).min(1).optional()
});

export type TLearningPathProgressSyncPayload = z.infer<typeof ZLearningPathProgressSyncPayload>;

/**
 * Daily safety net for changes no event covers, chiefly course content edits
 * (lessons or exercises added, deleted, or given a new completion policy).
 * Syncs unfinished students who were active or enrolled recently, plus every
 * unfinished student of a path whose course content changed recently.
 */
export const ZLearningPathProgressReconcilePayload = z.object({
  activeWithinDays: z.number().int().positive().default(30),
  contentChangedWithinHours: z.number().int().positive().default(26)
});

export type TLearningPathProgressReconcilePayload = z.infer<typeof ZLearningPathProgressReconcilePayload>;
