import crypto from 'node:crypto';

import { buildOrgInviteLink, getDashboardBaseUrl } from '../../config/dashboard-url';

export const ORG_INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export function hashInviteToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function normalizeInviteEmails(emails: string[]): string[] {
  return [...new Set(emails.map((email) => email.toLowerCase().trim()).filter(Boolean))];
}

export function buildPathInviteLink(
  token: string,
  organization: { siteName?: string | null; customDomain?: string | null; isCustomDomainVerified?: boolean | null }
): string {
  return buildOrgInviteLink(token, organization);
}

export function getInviteExpiryLabel(expiresAtIso: string): string {
  return new Date(expiresAtIso).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC'
  });
}

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
