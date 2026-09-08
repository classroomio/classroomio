import type { AccountOrg } from '$features/app/types';
import { t } from '$lib/utils/functions/translations';
import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
import { ROLE } from '@cio/utils/constants';

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

export interface OrgLandingAuthAction {
  label: string;
  href: string;
  loading?: boolean;
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
}: OrgLandingAuthActionOptions): OrgLandingAuthAction | undefined {
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

    return { label: t.get('navigation.goto_lms'), href: '/lms' };
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
