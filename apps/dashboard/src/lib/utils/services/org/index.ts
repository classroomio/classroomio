import type { CurrentOrg, OrgTeamMember } from '$lib/utils/types/org';
import { ROLE, ROLE_LABEL } from '$lib/utils/constants/roles';
import { currentOrg, orgAudience, orgTeam, orgs } from '$lib/utils/store/org';

import type { OrganizationPlan } from '$lib/utils/types';
import type { PostgrestError } from '@supabase/supabase-js';
import { get } from 'svelte/store';
import { goto } from '$app/navigation';
import { supabase } from '$lib/utils/functions/supabase';

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

export async function getOrganizations(userId: string, isOrgSite?: boolean, orgSiteName?: string) {
  const { data, error } = await supabase
    .from('organizationmember')
    .select(
      `
      id,
      profile_id,
      role_id,
      created_at,
      organization!organizationmember_organization_id_fkey (
        *,
        organization_plan(
          plan_name,
          is_active,
          provider,
          subscriptionId:payload->id,
          customerId:payload->customerId
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
        ...(orgMember?.organization || {}),
        memberId: orgMember?.id,
        role_id: parseInt(orgMember?.role_id),
        shortName: orgMember?.organization?.name?.substring(0, 2)?.toUpperCase() || ''
      });
    });

    orgs.set(orgsArray);

    // If this is a student dashboard
    if (isOrgSite && orgSiteName) {
      const orgData = orgsArray.find((org) => org.siteName === orgSiteName);

      if (orgData) {
        currentOrg.set(orgData);
      }
    } else {
      // Check if org was last visited in localhost
      if (localStorage) {
        const lastOrgSiteName = localStorage.getItem('classroomio_org_sitename');

        const lastOrg = orgsArray.find((org) => org.siteName === lastOrgSiteName);

        if (lastOrg) {
          currentOrg.set(lastOrg);
        }
      }

      // Default to setting the first org in the array of orgs
      const _currentOrg = get(currentOrg);
      if (!_currentOrg.siteName) {
        currentOrg.set(orgsArray[0]);
      }
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

const CURRENT_ORG_QUERY = `
  id,
  name,
  siteName,
  avatar_url,
  landingpage,
  is_restricted,
  customization,
  theme,
  favicon,
  customDomain,
  isCustomDomainVerified,
  customCode,
  organization_plan(
    plan_name,
    is_active
  )
`;
export async function getCurrentOrg(siteName: string, justGet = false, isCustomDomain = false) {
  let response: { data: CurrentOrg[] | null; error: PostgrestError | null } | null = null;

  if (isCustomDomain) {
    response = await supabase
      .from('organization')
      .select(CURRENT_ORG_QUERY)
      .eq('customDomain', siteName)
      .filter('isCustomDomainVerified', 'eq', true)
      .returns<CurrentOrg[]>();
  } else {
    response = await supabase
      .from('organization')
      .select(CURRENT_ORG_QUERY)
      .eq('siteName', siteName)
      .returns<CurrentOrg[]>();
  }
  const { data, error } = response;

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

export async function updateOrgPlan(params: {
  supabase: typeof supabase;
  subscriptionId: string;
  data: OrganizationPlan['payload'];
}) {
  return await params.supabase
    .from('organization_plan')
    .update({
      payload: params.data
    })
    .match({
      subscription_id: params.subscriptionId
    });
}

export async function createOrgPlan(params: {
  orgId: OrganizationPlan['org_id'];
  planName: OrganizationPlan['plan_name'];
  subscriptionId: OrganizationPlan['subscription_id'];
  triggeredBy: OrganizationPlan['triggered_by'];
  data: OrganizationPlan['payload'];
  supabase: typeof supabase;
}) {
  return await params.supabase.from('organization_plan').insert({
    activated_at: new Date().toDateString(),
    org_id: params.orgId,
    triggered_by: params.triggeredBy,
    plan_name: params.planName,
    is_active: true,
    payload: params.data,
    subscription_id: params.subscriptionId,
    provider: 'polar'
  });
}

export async function cancelOrgPlan(params: { subscriptionId: string; data: OrganizationPlan['payload'] }) {
  return await supabase
    .from('organization_plan')
    .update({
      is_active: false,
      deactivated_at: new Date().toDateString(),
      payload: params.data
    })
    .match({
      subscription_id: params.subscriptionId
    });
}
