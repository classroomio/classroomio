import type { DbOrTxClient } from '../drizzle';

export interface TInviteEnrollmentParams {
  courseIds: string[];
  cohortIds: string[];
  pathIds: string[];
  organizationId: string;
  profileId: string;
  email: string;
  roleId: number;
  grantedByProfileId?: string;
  assertCapacity?: (organizationId: string, additional: number, tx: DbOrTxClient) => Promise<unknown>;
  ensureCompliance?: (courseIds: string[], profileIds: string[], tx: DbOrTxClient) => Promise<unknown>;
}

export interface TInviteEnrollmentResult {
  enrolledCount: number;
  skippedPathOnlyCourseIds: string[];
  enrolledPathIds: string[];
}

/**
 * Invite enrollment lives in `@cio/core` (it composes course, cohort and path
 * services), which `@cio/db` cannot import. The API registers it at startup;
 * the SSO/token-auth hooks call it inside their acceptance transaction.
 */
export interface InviteEnrollmentHandler {
  /** Enrolls the accepter into the invite's courses, cohorts and paths. */
  enroll: (tx: DbOrTxClient, params: TInviteEnrollmentParams) => Promise<TInviteEnrollmentResult>;
  /** Throws when the org has no room for `additional` more students. */
  assertStudentCapacity: (organizationId: string, additional: number, tx: DbOrTxClient) => Promise<unknown>;
}

let inviteEnrollmentHandler: InviteEnrollmentHandler | null = null;

/** Registers the invite enrollment handler. Called once at API startup. */
export function setInviteEnrollmentHandler(handler: InviteEnrollmentHandler): void {
  inviteEnrollmentHandler = handler;
}

/** Returns the registered handler, or null when none was registered in this process. */
export function getInviteEnrollmentHandler(): InviteEnrollmentHandler | null {
  return inviteEnrollmentHandler;
}
