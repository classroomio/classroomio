import type { AccountOrganization } from '@/feature/account/types/account';

const CLOUD_ROOT_DOMAIN = 'classroomio.com';

export function exerciseWebUrlOf(org: AccountOrganization | null, courseId: string, exerciseId: string) {
  const path = `/courses/${courseId}/exercises/${exerciseId}`;
  if (!org) return `https://app.${CLOUD_ROOT_DOMAIN}${path}`;

  const customDomain = org.isCustomDomainVerified ? org.customDomain?.trim() : null;
  const host = customDomain || `${org.siteName}.${CLOUD_ROOT_DOMAIN}`;

  return `https://${host}${path}`;
}
