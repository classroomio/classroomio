import isEmpty from 'lodash/isEmpty';
import { get } from 'svelte/store';

import { goto } from '$app/navigation';
import { supabase } from '$lib/utils/functions/supabase';
import { orgs, currentOrg, orgAudience, orgTeam } from '$lib/utils/store/org';
import { ROLE, ROLE_LABEL } from '$lib/utils/constants/roles';

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
    .neq('role_id', ROLE.STUDENT)
    .order('id', { ascending: false });

  const team = [];
  if (data?.length) {
    data.forEach((teamMember) => {
      team.push({
        id: teamMember.id,
        email: teamMember?.profile?.email || teamMember.email,
        verified: teamMember.verified,
        profileId: teamMember?.profile?.id,
        fullname: teamMember?.profile?.fullname || '',
        role: ROLE_LABEL[teamMember?.role_id] || '',
        isAdmin: teamMember?.role_id === ROLE.ADMIN
      });
    });

    orgTeam.set(team);
  }

  return {
    team: get(orgTeam),
    error
  };
}

export async function getOrganizations(userId) {
  const { data, error } = await supabase
    .from('organizationmember')
    .select(
      `
      id,
      profile_id,
      role_id,
      created_at,
      organization!organizationmember_organization_id_fkey (
        id,
        name,
        siteName,
        avatar_url,
        landingpage,
        theme,
        created_at
      )
    `
    )
    .eq('profile_id', userId)
    .order('id', { ascending: false });

  const orgsArray = [];

  if (Array.isArray(data) && data.length) {
    data.forEach((orgMember) => {
      orgsArray.push({
        id: orgMember?.organization?.id,
        name: orgMember?.organization?.name,
        shortName: orgMember?.organization?.name?.substring(0, 2)?.toUpperCase() || '',
        siteName: orgMember?.organization?.siteName,
        theme: orgMember?.organization?.theme,
        avatar_url: orgMember?.organization?.avatar_url,
        memberId: orgMember?.id,
        role_id: orgMember?.role_id,
        landingpage: orgMember?.organization?.landingpage
      });
    });

    orgs.set(orgsArray);

    const _cOrg = get(currentOrg);
    if (!_cOrg.siteName) {
      currentOrg.set(orgsArray[0]);
    }
  }

  return {
    orgs: orgsArray,
    currentOrg: orgsArray[0],
    error
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
      organizationmember!inner(
        role_id,
        organization_id
      )
    `
    )
    .eq('organizationmember.organization_id', orgId)
    .eq('organizationmember.role_id', 3); // is a student, tutor is 2 and admin is 1

  console.log('data', data);

  const audience = (data || []).map((profile) => ({
    id: profile.id,
    name: profile.fullname,
    email: profile.email,
    avatar_url: profile.avatar_url,
    date_joined: new Date(profile.created_at).toDateString()
  }));
  orgAudience.set(audience);

  return {
    audience: audience,
    error
  };
}

export async function getCourseBySiteName(siteName) {
  const { data, error } = await supabase
    .from('course')
    .select(
      `
      *,
      lessons:lesson(count),
      group!inner(
        organization!inner(id, name, siteName, avatar_url)
      )
    `
    )
    .eq('group.organization.siteName', siteName)
    .eq('status', 'ACTIVE')
    .eq('is_published', true);

  if (error) {
    return [];
  }

  return data;
}

export async function getCurrentOrg(siteName, justGet = false) {
  const { data, error } = await supabase
    .from('organization')
    .select(
      `
      id,
      name,
      siteName,
      avatar_url,
      landingpage,
      theme
    `
    )
    .eq('siteName', siteName);

  if (!justGet && (error || isEmpty(data))) {
    console.error('Error getOrganization', error);
    return goto('/404');
  }

  if (!justGet) {
    currentOrg.set(data[0]);
  } else if (!isEmpty(data)) {
    return data[0];
  }
}
