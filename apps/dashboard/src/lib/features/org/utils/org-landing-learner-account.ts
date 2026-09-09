import type { AccountOrg } from '$features/app/types';
import type { LandingLearnerAccount } from '@cio/ui/custom/org-landing-page/types';
import { t } from '$lib/utils/functions/translations';
import { markColorModeExplicit } from '$lib/utils/functions/color-mode';

type OrganizationMembership = {
  id: string;
  roleId: number;
  siteName?: string | null;
};

export interface OrgLandingLearnerAccountOptions {
  /** Server-known or client-known login state — from `data.locals.user || $user.isLoggedIn`. */
  isLoggedIn: boolean;
  isInitialized: boolean;
  profile: {
    fullname: string;
    email: string | null;
    avatarUrl: string | null;
  };
  org: AccountOrg;
  organizations?: OrganizationMembership[];
  hasPendingInvite?: boolean;
  inert?: boolean;
}

export function getOrgLandingLearnerAccount({
  isLoggedIn,
  isInitialized,
  profile,
  org,
  organizations = [],
  hasPendingInvite = false,
  inert = false
}: OrgLandingLearnerAccountOptions): LandingLearnerAccount | undefined {
  if (!isLoggedIn) {
    return undefined;
  }

  const themeLabel = t.get('landing.learner_menu.theme');
  const logoutLabel = t.get('settings.profile.logout');
  const logoutHref = '/logout';

  if (!isInitialized) {
    return {
      fullname: '',
      email: '',
      items: [],
      logoutLabel,
      logoutHref,
      themeLabel,
      triggerLabel: t.get('landing.learner_menu.trigger_label_anonymous'),
      loading: true,
      inert
    };
  }

  const isMember = organizations.some((organization) => organization.id === org.id);

  const items: LandingLearnerAccount['items'] = isMember
    ? [
        { key: 'myCourses', label: t.get('landing.learner_menu.my_courses'), href: '/lms' },
        { key: 'myCertificates', label: t.get('landing.learner_menu.my_certificates'), href: '/lms/certificates' },
        { key: 'accountSettings', label: t.get('landing.learner_menu.account_settings'), href: '/lms/settings' }
      ]
    : [{ key: 'accountSettings', label: t.get('landing.learner_menu.account_settings'), href: '/lms/settings' }];

  const inviteOnly = org.settings?.signup?.inviteOnly ?? false;
  const showNote = !isMember && !hasPendingInvite && !org.disableSignup && !inviteOnly;
  const note = showNote ? t.get('landing.learner_menu.not_enrolled_note') : undefined;

  const email = profile.email ?? '';

  return {
    fullname: profile.fullname || '',
    email,
    avatarUrl: profile.avatarUrl ?? undefined,
    items,
    note,
    logoutLabel,
    logoutHref,
    themeLabel,
    triggerLabel: email
      ? t.get('landing.learner_menu.trigger_label', { email })
      : t.get('landing.learner_menu.trigger_label_anonymous'),
    inert,
    onThemeChange: () => markColorModeExplicit()
  };
}

export interface ResolveOrgLandingLearnerAccountOptions {
  org?: AccountOrg | null;
  locals?: {
    user?: { id?: string; name?: string | null; email?: string | null } | null;
    profile?: { fullname?: string | null; email?: string | null; avatarUrl?: string | null } | null;
    organizations?: OrganizationMembership[] | null;
  } | null;
  user: { isLoggedIn?: boolean };
  profile: { fullname: string; email: string | null; avatarUrl: string | null };
  appInitApi: {
    isInitializedAndReady: boolean;
    data?: { success?: boolean; organizations?: OrganizationMembership[] } | null;
    pendingOrgInvite?: unknown;
  };
  inert?: boolean;
}

export function resolveOrgLandingLearnerAccount({
  org,
  locals,
  user,
  profile,
  appInitApi,
  inert = false
}: ResolveOrgLandingLearnerAccountOptions): LandingLearnerAccount | undefined {
  if (!org) {
    return undefined;
  }

  const isLoggedIn = !!(locals?.user || user.isLoggedIn);
  const isInitialized = appInitApi.isInitializedAndReady;

  const resolvedProfile = isInitialized
    ? profile
    : {
        fullname: locals?.profile?.fullname || locals?.user?.name || '',
        email: locals?.profile?.email || locals?.user?.email || null,
        avatarUrl: locals?.profile?.avatarUrl || null
      };

  const organizations = appInitApi.data?.success
    ? (appInitApi.data.organizations ?? locals?.organizations ?? [])
    : (locals?.organizations ?? []);

  const hasPendingInvite = !!appInitApi.pendingOrgInvite;

  return getOrgLandingLearnerAccount({
    isLoggedIn,
    isInitialized,
    profile: resolvedProfile,
    org,
    organizations,
    hasPendingInvite,
    inert
  });
}

export function getPreviewOrgLandingLearnerAccount(
  profile: { fullname: string; email: string | null; avatarUrl: string | null },
  org: AccountOrg
): LandingLearnerAccount | undefined {
  return getOrgLandingLearnerAccount({
    isLoggedIn: true,
    isInitialized: true,
    profile,
    org,
    organizations: [{ id: org.id, roleId: 1 }],
    inert: true
  });
}
