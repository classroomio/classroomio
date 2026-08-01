import type { AccountOrg } from '$features/app/types';
import { getOrgPublicUrl } from '$lib/utils/store/org';

export function buildPublicDocUrl(org: AccountOrg, slug: string) {
  return getOrgPublicUrl(org, `/doc/${slug}`);
}
