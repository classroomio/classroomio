import { ROLE } from '$lib/utils/constants/roles';
import { supabase } from '$lib/utils/functions/supabase';

export async function fetchGroupData(table: string, id: string) {
  const { data, error } = await supabase.from(table).select('group_id').eq('id', id).single();

  if (error) {
    console.error(`Error fetching group data from ${table}`, error);
    return null;
  }

  return data;
}

export async function fetchTeacherMembers(groupId: string) {
  const { data, error } = await supabase
    .from('groupmember')
    .select('id, profile(email)')
    .eq('group_id', groupId)
    .eq('role_id', ROLE.TUTOR);

  if (error) {
    console.error('Error fetching teacher members', error);
    return [];
  }

  return data.map((teacher) => teacher.profile?.email || '');
}

export async function fetchCourseGroupIds(pathwayId: string) {
  const { data, error } = await supabase
    .from('pathway_course')
    .select('course(group_id)')
    .eq('pathway_id', pathwayId);

  if (error) {
    console.error('Error fetching course group IDs', error);
    return [];
  }

  return data.map((row) => row.course.group_id);
}

export async function addMemberToGroup(member) {
  // Check if the member already exists in the group
  const { data: existingMember, error: fetchError } = await supabase
    .from('groupmember')
    .select('id')
    .eq('profile_id', member.profile_id)
    .eq('group_id', member.group_id)
    .single();

  console.log(`checking for ${member.profile_id} ${member.group_id}`);

  if (fetchError && fetchError.code !== 'PGRST116') {
    // PGRST116 is the code for no rows found
    console.error('Error checking existing member', fetchError);
    return { error: fetchError };
  }

  if (existingMember) {
    console.log('Member already exists in the group', member.group_id);
    return { data: existingMember, message: 'Member already exists' };
  }

  // Add the member to the group
  console.log('adding member to group', member);
  const { data, error } = await supabase.from('groupmember').insert(member);

  if (error) {
    console.error('Error adding member to group', error);
    return { error };
  }

  return { data };
}
