import { getOrgPublicUrl } from '$lib/utils/store/org';

type OrgPublicUrlInput = Parameters<typeof getOrgPublicUrl>[0];

export function buildResourceInviteLink(token: string | null | undefined, organization: OrgPublicUrlInput): string {
  if (!token) {
    return '';
  }

  return getOrgPublicUrl(organization, `/invite/r/${encodeURIComponent(token)}`);
}
