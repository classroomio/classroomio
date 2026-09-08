/** The `course.metadata` key holding the self-enrollment setting. */
export const SELF_ENROLLMENT_METADATA_KEY = 'allowSelfEnrollment';

/**
 * The key this setting used to live under. Still read as a fallback: there is no
 * backfill, so a course only gains the current key the first time its settings
 * are saved.
 */
export const LEGACY_SELF_ENROLLMENT_METADATA_KEY = 'allowNewStudent';

type SelfEnrollmentMetadata = {
  allowSelfEnrollment?: boolean | null;
  /** @deprecated Read-only legacy key. See {@link LEGACY_SELF_ENROLLMENT_METADATA_KEY}. */
  allowNewStudent?: boolean | null;
};

/**
 * Whether students may enroll themselves in this course from its landing page
 * or from Explore.
 *
 * This gates *self*-enrollment only. Course invite links and People > Add people
 * bypass it by design, and it never affects students who already joined.
 *
 * Absent means allowed: a course that has never had the setting saved is open,
 * which is what every read site did before the setting was centralized here.
 *
 * The SQL equivalent lives in `getExploreCourses` (packages/db) and must stay in
 * lockstep with this fallback order.
 */
export function isSelfEnrollmentAllowed(metadata: SelfEnrollmentMetadata | null | undefined): boolean {
  return metadata?.allowSelfEnrollment ?? metadata?.allowNewStudent ?? true;
}
