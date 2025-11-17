import { currentOrg, isOrgStudent, orgs } from '$lib/utils/store/org';
import { defaultProfileState, defaultUserState, profile, user } from '$lib/utils/store/user';

import type { AccountResponse } from './types';
import type { TUser } from '@cio/db/types';
import { classroomio } from '$lib/utils/services/api';
import { get } from 'svelte/store';
import { goto } from '$app/navigation';
import { handleLocaleChange } from '$lib/utils/functions/translations';
import { identifyPosthogUser } from '$lib/utils/services/posthog';
import { page } from '$app/state';
import { resolve } from '$app/paths';
import { setSentryUser } from '$lib/utils/services/sentry';
import shouldRedirectOnAuth from '$lib/utils/functions/routes/shouldRedirectOnAuth';

type AppSetupParams = {
  isOrgSite: boolean;
  orgSiteName: string;
};

/*
  Manages everything related to loading the logged in user and setting up the organization.
*/
class AppInitApi {
  loading = $state(true);
  error = $state<string | null>(null);
  data = $state<AccountResponse>(null);
  session = $state<App.Locals | null>(null);

  async setupApp(locals: App.Locals, params: AppSetupParams): Promise<boolean | undefined> {
    if (!locals.user) {
      console.log('No user found in locals');
      return;
    }

    this.loading = true;
    this.error = null;
    this.session = locals;

    try {
      // Automatically uses cookie auth to fetch account data for currently logged in user
      const response = await classroomio.account.$get();
      const accountData = await response.json();

      this.data = accountData;

      this.setupStores();

      this.setUserAnalytics();

      this.routeUserToNextPage(params);

      return true;
    } catch (error) {
      console.error('Error fetching account', error);

      this.error = error instanceof Error ? error.message : 'Failed to fetch account';
    } finally {
      this.loading = false;
    }
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
  }

  routeUserToNextPage({ isOrgSite }: AppSetupParams) {
    if (!this.data?.success) {
      return;
    }

    const userHasOrganizations = this.data.organizations.length > 0;
    const shouldRedirectToOnboarding = !isOrgSite && !userHasOrganizations;
    if (shouldRedirectToOnboarding) {
      return goto(resolve(`/onboarding`, {}));
    }

    const redirect = page.url.searchParams.get('redirect');
    if (redirect) {
      // goto redirect won't accept dynamic url so we need to use window.location.href
      window.location.href = redirect;
      return;
    }

    if (!shouldRedirectOnAuth(page.url.pathname)) return;

    const isStudent = get(isOrgStudent);

    return isOrgSite || isStudent ? this.goToLMS() : this.goToOrg();
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
    this.loading = false;
    this.error = null;
    this.data = null;

    user.set(defaultUserState);
    profile.set(defaultProfileState);
  }

  get isInitializedAndReady() {
    return !this.loading && !this.error && this.data !== null;
  }
}

export const appInitApi = new AppInitApi();
