import { supabase } from '../../utils/functions/supabase';

export async function fetchCourses(userId) {
  const { data: orgMember } = await supabase
    .from('organizationmember')
    .select(`organization_id`)
    .eq('profile_id', userId)
    .single();

  const { data: allCourses } = await supabase
    .from('course')
    .select(`id, title, description`)
    .eq('organization_id', orgMember.organization_id);

  return { allCourses, organizationId: orgMember.organization_id };
}
