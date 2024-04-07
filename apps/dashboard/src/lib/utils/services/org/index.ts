import { get } from 'svelte/store';

import { goto } from '$app/navigation';
import { supabase } from '$lib/utils/functions/supabase';
import { orgs, currentOrg, orgAudience, orgTeam } from '$lib/utils/store/org';
import { ROLE, ROLE_LABEL } from '$lib/utils/constants/roles';
import type { CurrentOrg, OrgTeamMember } from '$lib/utils/types/org';
import type { OrganizationPlan } from '$lib/utils/types';

export async function getOrgTeam(orgId: string) {
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
    .order('id', { ascending: false })
    .returns<
      {
        id: number;
        email: string;
        verified: boolean;
        role_id: number;
        profile: {
          id: string;
          fullname: string;
          email: string;
        };
      }[]
    >();

  const team: OrgTeamMember[] = [];
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

export async function getOrganizations(userId: string) {
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
        created_at,
        organization_plan(
          plan_name,
          is_active,
          subscriptionId:lmz_data->id
        )
      )
    `
    )
    .eq('profile_id', userId)
    .order('id', { ascending: false })
    .returns<
      {
        id: string;
        profile_id: string;
        role_id: string;
        created_at: string;
        organization: CurrentOrg;
      }[]
    >();

  const orgsArray: CurrentOrg[] = [];

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
        landingpage: orgMember?.organization?.landingpage,
        organization_plan: orgMember?.organization?.organization_plan
      });
    });

    orgs.set(orgsArray);

    if (localStorage) {
      const lastOrgSiteName = localStorage.getItem('classroomio_org_sitename');

      const lastOrg = orgsArray.find((org) => org.siteName === lastOrgSiteName);

      if (lastOrg) {
        currentOrg.set(lastOrg);
      }
    }

    const _currentOrg = get(currentOrg);
    if (!_currentOrg.siteName) {
      currentOrg.set(orgsArray[0]);
    }
  }

  return {
    orgs: orgsArray,
    currentOrg: get(currentOrg),
    error
  };
}

export async function getOrgAudience(orgId: string) {
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
        group_id:group!inner(
          organization_id
        )
      )
    `
    )
    .eq('groupmember.group.organization_id', orgId)
    .eq('groupmember.role_id', ROLE.STUDENT);

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

export async function getCourseBySiteName(siteName: string) {
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

export async function getCurrentOrg(siteName: string, justGet = false) {
  const { data, error } = await supabase
    .from('organization')
    .select(
      `
      id,
      name,
      siteName,
      avatar_url,
      landingpage,
      theme,
      organization_plan(
        plan_name,
        is_active
      )
    `
    )
    .eq('siteName', siteName)
    .returns<CurrentOrg[]>();
  console.log('data =', data);
  console.log('error =', error);

  const isDataEmpty = !data?.[0];

  if (!justGet && (error || isDataEmpty)) {
    console.error('Error getOrganization', error);
    return goto('/404');
  }

  if (!justGet) {
    if (isDataEmpty) return;

    currentOrg.set(data[0]);
  } else if (!isDataEmpty) {
    return data[0];
  }
}

export async function createOrgPlan(params: {
  orgId: string;
  planName: string;
  triggeredBy: number;
  data: OrganizationPlan['lmz_data'];
}) {
  return await supabase.from('organization_plan').insert({
    activated_at: new Date().toDateString(),
    org_id: params.orgId,
    triggered_by: params.triggeredBy,
    plan_name: params.planName,
    is_active: true,
    lmz_data: params.data
  });
}

export async function cancelOrgPlan(params: { orgId: string; planName: string }) {
  return await supabase
    .from('organization_plan')
    .update({
      is_active: false,
      deactivated_at: new Date().toDateString()
    })
    .match({
      plan_name: params.planName,
      org_id: params.orgId
    });
}
