import type { AccountOrg } from '$features/app/types';
import { getOrgPublicUrl } from '$lib/utils/store/org';

export function buildPublicNoteUrl(org: AccountOrg, slug: string) {
  return getOrgPublicUrl(org, `/note/${slug}`);
}
