import type { AccountOrg } from '$features/app/types';

export function getOrgFaviconHref(
  org: Pick<AccountOrg, 'favicon' | 'avatarUrl'> | null | undefined,
  pageOrigin?: string
): string | null {
  const favicon = org?.favicon?.trim();
  const avatarUrl = org?.avatarUrl?.trim();
  const rawHref = favicon || avatarUrl;

  if (!rawHref) {
    return null;
  }

  try {
    return new URL(rawHref, pageOrigin || undefined).href;
  } catch {
    return rawHref;
  }
}
