import type { PostgrestError } from '@supabase/supabase-js';
import type { ProfilePathwayProgress } from '$lib/utils/types';
import { supabase } from '$lib/utils/functions/supabase';

export function addPathwayGroupMember(member: any) {
  return supabase.from('groupmember').insert(member).select();
}

export async function fetchPathwayCourseProgress(
  pathwayId,
  profileId
): Promise<{
  data: ProfilePathwayProgress[] | null;
  error: PostgrestError | null;
}> {
  const { data, error } = await supabase
    .rpc('get_course_progress', {
      pathway_id_arg: pathwayId,
      profile_id_arg: profileId
    })
    .returns<ProfilePathwayProgress[]>();

  return { data, error };
}