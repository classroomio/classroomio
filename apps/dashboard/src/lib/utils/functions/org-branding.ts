import type { AccountOrg } from '$features/app/types';

export function getOrgFaviconHref(org: Pick<AccountOrg, 'favicon' | 'avatarUrl'> | null | undefined): string | null {
  const favicon = org?.favicon?.trim();
  if (favicon) {
    return favicon;
  }

  const avatarUrl = org?.avatarUrl?.trim();
  if (avatarUrl) {
    return avatarUrl;
  }

  return null;
}
