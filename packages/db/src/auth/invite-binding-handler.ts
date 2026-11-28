import type { DbOrTxClient } from '@db/drizzle';
import type * as schema from '@db/schema';

/**
 * Injected invite-enrolment binding for `@cio/db` auth hooks.
 *
 * `@cio/db` cannot import `@cio/core` (core imports db queries), so the API
 * registers its core `bindProfileToOrgEmail` implementation at startup via
 * `setInviteBindingHandler`. Auth hooks (`ensureOrgMembership`) call through
 * `getInviteBindingHandler()` when it is set and fall back to their legacy
 * inline flow otherwise. Same pattern as #1098's `setInviteEnrollmentHandler`.
 */

export type TInviteBindingParams = {
  orgId: string;
  profileId: string;
  email: string;
  trigger:
    | 'org-invite'
    | 'course-invite'
    | 'invite-link'
    | 'self-enroll'
    | 'join-academy'
    | 'sso'
    | 'token-auth'
    | 'self-hosted';
  identityProven: boolean;
  roleForNewMember?: number;
  skipInviteIds?: string[];
};

export type TInviteBindingResult = {
  member: typeof schema.organizationmember.$inferSelect;
  createdMember: boolean;
  sideEffects?: Array<() => Promise<void>>;
};

export type TInviteBindingHandler = (tx: DbOrTxClient, params: TInviteBindingParams) => Promise<TInviteBindingResult>;

let handler: TInviteBindingHandler | null = null;

export function setInviteBindingHandler(next: TInviteBindingHandler | null): void {
  handler = next;
}

export function getInviteBindingHandler(): TInviteBindingHandler | null {
  return handler;
}
