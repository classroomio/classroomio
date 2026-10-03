import crypto from 'node:crypto';

import { buildOrgInviteLink, getDashboardBaseUrl } from '../../config/dashboard-url';

export const ORG_INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

/** SHA-256 hex of a raw invite token; only the hash is stored. */
export function hashInviteToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Lowercases, trims and dedupes invite emails. */
export function normalizeInviteEmails(emails: string[]): string[] {
  return [...new Set(emails.map((email) => email.toLowerCase().trim()).filter(Boolean))];
}

/** Public invite URL for a raw path-invite token on the org's site. */
export function buildPathInviteLink(
  token: string,
  organization: { siteName?: string | null; customDomain?: string | null; isCustomDomainVerified?: boolean | null }
): string {
  return buildOrgInviteLink(token, organization);
}

/** Human UTC label for an invite expiry shown in emails. */
export function getInviteExpiryLabel(expiresAtIso: string): string {
  return new Date(expiresAtIso).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC'
  });
}

/** Where an invited learner lands: the path hub when a publicId exists, else the org site. */
export function buildLearningPathLoginUrl(
  organization: { siteName?: string | null; customDomain?: string | null; isCustomDomainVerified?: boolean | null },
  path: { publicId?: string | null }
): string {
  const baseUrl = getDashboardBaseUrl(organization);

  if (path.publicId) {
    return `${baseUrl}/paths/${path.publicId}`;
  }

  return baseUrl;
}
