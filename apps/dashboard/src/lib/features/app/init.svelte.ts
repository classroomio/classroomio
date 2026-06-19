import { BaseApi, classroomio } from '$lib/utils/services/api';
import { getOrgSiteUrl } from '$lib/utils/functions/org';
import { currentOrg, mergeAccountOrgFromServer, orgs } from '$lib/utils/store/org';
import { defaultProfileState, defaultUserState, profile, user } from '$lib/utils/store/user';

import type { AccountResponse } from './types';
import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
import type { TUser } from '@cio/db/types';
import { authClient } from '$lib/utils/services/auth/client';
import { get } from 'svelte/store';
import { goto } from '$app/navigation';
import { handleLocaleChange } from '$lib/utils/functions/translations';
import { identifyPosthogUser } from '$lib/utils/services/posthog';
import { identifyUserJotUser } from '$lib/utils/services/userjot';
import { isOrgStudent } from '$lib/utils/store/app';
import { isPublicRoute } from '$lib/utils/functions/routes/isPublicRoute';
import { licenseApi } from '$features/license/api/license.svelte';
import { logout } from '$lib/utils/functions/logout';
import { page } from '$app/state';
import { resolve } from '$app/paths';
import { setSentryUser } from '$lib/utils/services/sentry';
import { setTheme } from '$lib/utils/functions/theme';
import { setupAnalyticsBasedOnLicense } from '$lib/utils/functions/appSetup';
import shouldRedirectOnAuth from '$lib/utils/functions/routes/shouldRedirectOnAuth';

type AppSetupParams = {
  isOrgSite: boolean;
  orgSiteName: string;
  /** Tenant org id from `getOrgSiteInfo`; used to auto-enroll the user if they aren't a member yet. */
  orgId?: string | null;
};

/*
  Manages everything related to loading the logged in user and setting up the organization.
*/
class AppInitApi extends BaseApi {
  data = $state<AccountResponse>(null);
  session = $state<App.Locals | null>(null);

  get loading() {
    return this.isLoading;
  }

  async setupApp(locals: App.Locals, params: AppSetupParams): Promise<boolean | undefined> {
    if (!locals.user) {
      if (!params.isOrgSite) {
        goto(resolve('/login', {}));
        return false;
      }

      console.log('No user found in locals');
      return;
    }

    this.session = locals;

    // Auto-enroll on tenant sites for first-time signups. Idempotent on the
    // API side (no-ops for existing members so invited admins/tutors keep
    // their roles). Runs BEFORE the account fetch so the returned org list
    // already reflects the new membership.
    if (params.isOrgSite && params.orgId) {
      await this.autoEnrollOnTenantSite(params.orgId);
    }

    await this.execute<typeof classroomio.account.$get>({
      requestFn: () => classroomio.account.$get(),
      logContext: 'fetching account',
      onSuccess: (data) => {
        this.data = data;
        this.setupStores(params);
        licenseApi.syncFromAccount(data.licenseFeatures, get(currentOrg));
        setupAnalyticsBasedOnLicense(
          data.profile?.id ? { id: data.profile.id, email: data.profile.email, name: data.profile.fullname } : undefined
        );
        this.setUserAnalytics();
        this.routeUserToNextPage(params);
      },
      onError: () => {
        logout();
      }
    });
  }

  private async autoEnrollOnTenantSite(orgId: string): Promise<void> {
    try {
      const response = await classroomio.organization['auto-enroll-student'].$post(
        {},
        { headers: { 'cio-org-id': orgId } }
      );

      if (!response.ok) {
        // 403 is expected for invite-only / disabled-signup orgs — the user
        // visited a tenant site but isn't allowed to enroll. Other failures
        // shouldn't block the rest of setupApp.
        console.warn('auto-enroll-student failed', response.status, await response.text().catch(() => ''));
        return;
      }

      // The user is a new member, so the session cookie cache (orgRoles)
      // is stale. Force Better Auth to refetch from DB and rewrite the
      // session_data cookie — Better Auth manages the cookie name itself.
      await authClient.getSession({ query: { disableCookieCache: true } });
    } catch (error) {
      console.warn('auto-enroll-student threw', error);
    }
  }

  /*
    1. Update user store
    2. Update profile store
    3. Update organizations store
  */
  setupStores(params?: AppSetupParams) {
    if (!this.data?.success || !this.session) {
      return;
    }

    user.update((_user) => ({
      ..._user,
      fetchingUser: false,
      isLoggedIn: true,
      currentSession: (this.session?.user as unknown as TUser) || undefined
    }));

    profile.set(this.data.profile);
    handleLocaleChange(this.data.profile.locale ?? 'en');

    this.setOrgStore(params);
  }

  setOrgStore(params?: AppSetupParams) {
    if (!this.data?.success || !this.data) {
      return;
    }

    if (!this.data.organizations.length) {
      return;
    }

    orgs.set(this.data.organizations.map((org) => mergeAccountOrgFromServer(org)));

    // On a tenant site, pin currentOrg to that tenant — never fall back to
    // localStorage / the user's first org, which is what was making a user
    // logged in on dblocked.* see the Dblocked dashboard on ciodevs.*.
    let nextOrg: (typeof this.data.organizations)[number] | undefined;
    if (params?.isOrgSite && params.orgSiteName) {
      nextOrg = this.data.organizations.find((org) => org.siteName === params.orgSiteName);
    }

    if (!nextOrg) {
      const lastOrgSiteName = localStorage.getItem('classroomio_org_sitename');
      nextOrg = this.data.organizations.find((org) => org.siteName === lastOrgSiteName) ?? this.data.organizations[0];
    }

    currentOrg.set(mergeAccountOrgFromServer(nextOrg));

    const theme = get(currentOrg)?.theme;

    setTheme(theme || 'blue');
  }

  routeUserToNextPage({ isOrgSite }: AppSetupParams) {
    console.log('routeUserToNextPage', window.location.pathname);
    if (!this.data?.success) {
      return;
    }

    const redirect = page.url.searchParams.get('redirect');
    if (redirect) {
      console.log('redirecting to', redirect);
      // goto redirect won't accept dynamic url so we need to use window.location.href
      window.location.href = redirect;
      return;
    }

    // This allows you to be on the landing page of an organization site and not be redirected
    const path = window.location.pathname;
    if (isPublicRoute(path) && (path !== '/' || isOrgSite)) {
      console.log('no redirect is needed');
      return;
    }

    const isStudent = get(isOrgStudent);
    const userHasOrganizations = this.data.organizations.length > 0;
    const isCloud = PUBLIC_IS_SELFHOSTED !== 'true';

    // CLOUD: when user has no orgs and isOrgSite is false, route to /onboarding
    // isOrgSite - means the user is on a multi tenant organization site, we don't want to redirect to /onboarding in this case
    if (isCloud) {
      const shouldRedirectToOnboarding = !userHasOrganizations && !isOrgSite;
      if (shouldRedirectToOnboarding) {
        console.log('cloud: redirecting to onboarding');
        return goto(resolve(`/onboarding`, {}));
      }
    } else {
      // Self-hosted: when user has no orgs, route to /onboarding
      if (!userHasOrganizations) {
        console.log('self-hosted: redirecting to onboarding');
        return goto(resolve(`/onboarding`, {}));
      }
    }

    if (!shouldRedirectOnAuth(page.url.pathname)) return;

    // Students with existing org memberships who open /onboarding may intend to create their own academy.
    if (path.includes('/onboarding') && isStudent && userHasOrganizations) {
      return;
    }

    const shouldGoToLMS = isCloud ? isOrgSite || !!isStudent : !!isStudent;
    console.log('redirecting to', shouldGoToLMS ? 'lms' : 'org');
    return shouldGoToLMS ? this.goToLMS(isOrgSite) : this.goToOrg();
  }

  goToLMS(isOrgSite: boolean) {
    const isCloud = PUBLIC_IS_SELFHOSTED !== 'true';
    const isStudent = get(isOrgStudent);
    const selectedOrg = get(currentOrg);

    if (isCloud && !isOrgSite && isStudent && selectedOrg.siteName) {
      window.location.href = getOrgSiteUrl(selectedOrg, '/lms');
      return;
    }

    goto(resolve('/lms', {}));
  }

  goToOrg() {
    const selectedOrg = get(currentOrg);

    goto(resolve(`/org/${selectedOrg.siteName}`, {}));
  }

  setUserAnalytics() {
    const profileStore = get(profile);

    if (!profileStore?.id) return;

    setSentryUser({
      id: profileStore.id,
      username: profileStore.username,
      email: profileStore.email,
      fullname: profileStore.fullname
    });

    identifyPosthogUser(profileStore.id, {
      email: profileStore.email,
      name: profileStore.fullname
    });

    identifyUserJotUser({
      id: profileStore.id,
      email: profileStore.email,
      fullname: profileStore.fullname,
      avatarUrl: profileStore.avatarUrl
    });
  }

  reset() {
    super.reset();
    this.data = null;
    licenseApi.reset();

    user.set(defaultUserState);
    profile.set(defaultProfileState);
  }

  get isInitializedAndReady() {
    return !this.isLoading && !this.error && this.data !== null;
  }
}

export const appInitApi = new AppInitApi();
