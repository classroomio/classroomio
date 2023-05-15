import { supabase } from '../../functions/supabase';
import { orgs, currentOrg, orgAudience, orgTeam } from '../../store/org';
import { ROLE, ROLE_LABEL } from '../../constants/roles';

export async function getOrgTeam(orgId) {
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
    .order('id', { ascending: false });

  const team = [];
  if (data?.length) {
    data.forEach((teamMember) => {
      team.push({
        id: teamMember.id,
        email: teamMember?.profile?.email || teamMember?.email,
        verified: teamMember?.verified,
        profileId: teamMember?.profile?.id,
        role: ROLE_LABEL[teamMember?.role_id] || '',
        isAdmin: teamMember?.role_id === ROLE.ADMIN,
      });
    });

    orgTeam.set(team);
  }

  return {
    team,
    error,
  };
}

export async function getOrganizations(userId) {
  const { data, error } = await supabase
    .from('organizationmember')
    .select(
      `
      id,
      profile_id,
      organization (
        id,
        name,
        siteName,
        avatar_url
      )
    `
    )
    .eq('profile_id', userId);

  const orgsArray = [];
  if (data.length) {
    data.forEach((orgMember) => {
      orgsArray.push({
        id: orgMember?.organization?.id,
        name: orgMember?.organization?.name,
        shortName:
          orgMember?.organization?.name?.substring(0, 2)?.toUpperCase() || '',
        siteName: orgMember?.organization?.siteName,
        avatar_url: orgMember?.organization?.avatar_url,
      });
    });

    orgs.set(orgsArray);
    currentOrg.set(orgsArray[0]);
  }

  return {
    orgs: orgsArray,
    currentOrg: orgsArray[0],
    error,
  };
}

export async function getOrgAudience(orgId) {
  // get all students who are participants in any course belonging to an org
  const { data, error } = await supabase
    .from('profile')
    .select(
      `
      id,
      fullname,
      email,
      avatar_url,
      created_at,
      groupmember!inner(
        role_id,
        group!inner(
          organization!inner(id)
        )
      )
    `
    )
    .eq('groupmember.group.organization.id', orgId)
    .eq('groupmember.role_id', 3); // is a student, tutor is 2 and admin is 1

  console.log('data', data);

  const audience = (data || []).map((profile) => ({
    id: profile.id,
    name: profile.fullname,
    email: profile.email,
    avatar_url: profile.avatar_url,
    date_joined: new Date(profile.created_at).toDateString(),
  }));
  orgAudience.set(audience);

  return {
    audience: audience,
    error,
  };
}

export async function getCourseBySiteName(siteName) {
  const { data, error } = await supabase
    .from('course')
    .select(
      `
      *,
      group!inner(
        organization!inner(id, name, siteName, avatar_url)
      )
    `
    )
    .eq('group.organization.siteName', siteName)
    .eq('is_published', true);

  if (error) {
    return [];
  }

  return data;
}
