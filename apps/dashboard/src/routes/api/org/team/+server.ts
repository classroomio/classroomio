import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getServerSupabase } from '$lib/utils/functions/supabase.server';
import { ROLE, ROLE_LABEL } from '$lib/utils/constants/roles';

export const GET: RequestHandler = async ({ request, url }) => {
  const orgId = url.searchParams.get('orgId');
  const userId = request.headers.get('user_id');

  if (!userId) {
    return json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  if (!orgId) {
    return json({ success: false, message: 'Organization ID is required' }, { status: 400 });
  }

  try {
    const supabase = getServerSupabase();

    // Check if user has access to this organization
    const { data: orgMember } = await supabase
      .from('organizationmember')
      .select('role_id')
      .eq('organization_id', orgId)
      .eq('profile_id', userId)
      .in('role_id', [1]) // Admin roles only
      .single();

    if (!orgMember) {
      return json(
        {
          success: false,
          message: 'Access denied. User is not a member of this organization.'
        },
        { status: 403 }
      );
    }

    // Fetch organization team
    const { data, error } = await supabase
      .from('organizationmember')
      .select(
        `
        id,
        email,
        verified,
        role_id,
        profile(
          id,
          fullname,
          email
        )
      `
      )
      .eq('organization_id', orgId)
      .neq('role_id', ROLE.STUDENT)
      .order('id', { ascending: false });

    if (error) {
      throw new Error('Error fetching organization team');
    }

    const team = (data || []).map((teamMember) => ({
      id: teamMember.id,
      email: teamMember?.profile?.email || teamMember.email,
      verified: teamMember.verified,
      profileId: teamMember?.profile?.id,
      fullname: teamMember?.profile?.fullname || '',
      role: ROLE_LABEL[teamMember?.role_id] || '',
      isAdmin: teamMember?.role_id === ROLE.ADMIN
    }));

    return json({
      success: true,
      team: team
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return json(
      {
        success: false,
        message
      },
      { status: 500 }
    );
  }
};
