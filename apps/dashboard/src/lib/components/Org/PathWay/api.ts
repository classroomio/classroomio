import { supabase } from '$lib/utils/functions/supabase';
import { get } from 'svelte/store';
import { isOrgAdmin } from '$lib/utils/store/org';

export async function fetchPathways(profileId: string | undefined, orgId: string | undefined) {
  if (!orgId || !profileId) return;

  const match: any = {};
  // Filter by profile_id if role isn't admin within organization
  if (!get(isOrgAdmin)) {
    match.member_profile_id = profileId;
  }

  const { data: allPathways } = await supabase
    .rpc('get_pathways', {
      org_id_arg: orgId,
      profile_id_arg: profileId
    })
    .match(match);

  if (!Array.isArray(allPathways)) {
    return {
      allPathways: []
    };
  }

  return { allPathways };
}
