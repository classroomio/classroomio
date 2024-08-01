import { supabase } from '$lib/utils/functions/supabase';

export function addPathwayGroupMember(member: any) {
  return supabase.from('groupmember').insert(member).select();
}
