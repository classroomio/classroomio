import type { SupabaseClient } from '@supabase/supabase-js';

export interface UserPermissionResult {
  hasAccess: boolean;
  isOrgAdmin: boolean;
  userMembership: any;
  isStudent: boolean;
}

/**
 * Check if a user has access to a course and determine their role
 */
export async function checkUserCoursePermissions(
  supabase: SupabaseClient,
  userId: string,
  courseGroupId: string
): Promise<UserPermissionResult> {
  // Check if user is a member of the course group
  const { data: userMembership } = await supabase
    .from('groupmember')
    .select('role_id, id, profile_id, email, created_at, assigned_student_id, profile(*)')
    .eq('group_id', courseGroupId)
    .eq('profile_id', userId)
    .single();

  // Check if user is org admin
  const { data: orgData } = await supabase.from('group').select('organization_id').eq('id', courseGroupId).single();

  let isOrgAdmin = false;
  if (orgData?.organization_id) {
    const { data: orgMembership } = await supabase
      .from('organizationmember')
      .select('role_id')
      .eq('organization_id', orgData.organization_id)
      .eq('profile_id', userId)
      .eq('role_id', 1) // Admin role
      .single();

    isOrgAdmin = !!orgMembership;
  }

  // Check if user has access (either is course member or org admin)
  const hasAccess = !!userMembership || isOrgAdmin;
  const isStudent = userMembership?.role_id === 3 && !isOrgAdmin;

  return {
    hasAccess,
    isOrgAdmin,
    userMembership,
    isStudent
  };
}
