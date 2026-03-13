import { BaseApi, classroomio } from '$lib/utils/services/api';
import { currentOrg, isOrgStudent, orgs } from '$lib/utils/store/org';
import { defaultProfileState, defaultUserState, profile, user } from '$lib/utils/store/user';

import type { AccountResponse } from './types';
import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
import type { TUser } from '@cio/db/types';
import { get } from 'svelte/store';
import { goto } from '$app/navigation';
import { handleLocaleChange } from '$lib/utils/functions/translations';
import { identifyPosthogUser } from '$lib/utils/services/posthog';
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
      console.log('No user found in locals');
      return;
    }

    this.session = locals;

    await this.execute<typeof classroomio.account.$get>({
      requestFn: () => classroomio.account.$get(),
      logContext: 'fetching account',
      onSuccess: (accountData) => {
        this.data = accountData;
        licenseApi.setFeatures(accountData.licenseFeatures);
        setupAnalyticsBasedOnLicense();
        this.setupStores();
        this.setUserAnalytics();
        this.routeUserToNextPage(params);
      },
      onError: () => {
        logout();
      }
    });
  }

  /*
    1. Update user store
    2. Update profile store
    3. Update organizations store
  */
  setupStores() {
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

    this.setOrgStore();
  }

  setOrgStore() {
    if (!this.data?.success || !this.data) {
      return;
    }

    if (!this.data.organizations.length) {
      return;
    }

    orgs.set(this.data.organizations);

    const lastOrgSiteName = localStorage.getItem('classroomio_org_sitename');
    const lastOrg = this.data.organizations.find((org) => org.siteName === lastOrgSiteName);

    currentOrg.set(lastOrg || this.data.organizations[0]);

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
    if (isOrgSite && isPublicRoute(window.location.pathname)) {
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

    const shouldGoToLMS = isCloud ? isOrgSite || !!isStudent : !!isStudent;
    console.log('redirecting to', shouldGoToLMS ? 'lms' : 'org');
    return shouldGoToLMS ? this.goToLMS() : this.goToOrg();
  }

  goToLMS() {
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
