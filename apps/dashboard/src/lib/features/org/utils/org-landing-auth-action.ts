import type { AccountOrg } from '$features/app/types';
import { t } from '$lib/utils/functions/translations';
import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
import { ROLE } from '@cio/utils/constants';
import type { LandingNavAuthAction } from '@cio/ui/custom/org-landing-page';

type OrganizationMembership = {
  id: string;
  roleId: number;
  siteName?: string | null;
};

interface OrgLandingAuthActionOptions {
  isLoggedIn: boolean;
  isInitialized: boolean;
  org: AccountOrg;
  organizations?: OrganizationMembership[];
  hasPendingInvite?: boolean;
}

/**
 * Builds the live academy navigation action from membership in the academy
 * currently being viewed, rather than from authentication alone.
 */
export function getOrgLandingAuthAction({
  isLoggedIn,
  isInitialized,
  org,
  organizations = [],
  hasPendingInvite = false
}: OrgLandingAuthActionOptions): LandingNavAuthAction | undefined {
  if (!isLoggedIn) {
    return { label: t.get('navigation.login'), href: '/login' };
  }

  if (!isInitialized) {
    return { label: '', href: '#', loading: true };
  }

  const membership = organizations.find((organization) => organization.id === org.id);
  if (membership) {
    const isSelfHostedManager =
      PUBLIC_IS_SELFHOSTED === 'true' &&
      !!membership.siteName &&
      (membership.roleId === ROLE.ADMIN || membership.roleId === ROLE.TUTOR);
    if (isSelfHostedManager) {
      return { label: t.get('navigation.goto_dashboard'), href: `/org/${membership.siteName}` };
    }

    return { label: t.get('landing.learner_menu.continue_learning'), href: '/lms' };
  }

  if (PUBLIC_IS_SELFHOSTED === 'true') {
    const managedOrganization = organizations.find(
      (organization) => organization.roleId === ROLE.ADMIN || organization.roleId === ROLE.TUTOR
    );
    if (managedOrganization?.siteName) {
      return {
        label: t.get('navigation.goto_dashboard'),
        href: `/org/${managedOrganization.siteName}`
      };
    }

    return undefined;
  }

  const inviteOnly = org.settings?.signup?.inviteOnly ?? false;
  if (hasPendingInvite || org.disableSignup || inviteOnly) {
    return undefined;
  }

  return { label: t.get('navigation.join_academy'), href: '/join-academy' };
}

export interface ResolveOrgLandingAuthActionOptions {
  org?: AccountOrg | null;
  locals?: {
    user?: { id?: string; name?: string | null; email?: string | null } | null;
    organizations?: OrganizationMembership[] | null;
  } | null;
  user: { isLoggedIn?: boolean };
  appInitApi: {
    isInitializedAndReady: boolean;
    data?: { success?: boolean; organizations?: OrganizationMembership[] } | null;
    pendingOrgInvite?: unknown;
  };
}

export function resolveOrgLandingAuthAction({
  org,
  locals,
  user,
  appInitApi
}: ResolveOrgLandingAuthActionOptions): LandingNavAuthAction | undefined {
  if (!org) {
    return undefined;
  }

  const isLoggedIn = !!(locals?.user || user.isLoggedIn);
  const isInitialized = appInitApi.isInitializedAndReady;
  const organizations = appInitApi.data?.success
    ? (appInitApi.data.organizations ?? locals?.organizations ?? [])
    : (locals?.organizations ?? []);
  const hasPendingInvite = !!appInitApi.pendingOrgInvite;

  return getOrgLandingAuthAction({
    isLoggedIn,
    isInitialized,
    org,
    organizations,
    hasPendingInvite
  });
}

export function getPreviewOrgLandingAuthAction(isLoggedIn: boolean): LandingNavAuthAction {
  return isLoggedIn
    ? {
        label: t.get('landing.learner_menu.continue_learning'),
        href: '#',
        disabled: true
      }
    : {
        label: t.get('navigation.login'),
        href: '#',
        disabled: true
      };
}
