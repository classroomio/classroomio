import { currentOrg, isOrgStudent, orgs } from '$lib/utils/store/org';
import { get, writable } from 'svelte/store';
import { profile, user } from '$lib/utils/store/user';

import type { AccountResponse } from './types';
import type { User } from '@cio/utils/types';
import { classroomio } from '$lib/utils/services/api';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import { resolve } from '$app/paths';
import shouldRedirectOnAuth from '$lib/utils/functions/routes/shouldRedirectOnAuth';

type AppSetupParams = {
  isOrgSite: boolean;
  orgSiteName: string;
};

/*
  Manages everything related to loading the logged in user and setting up the organization.
*/
class AccountManager {
  loading = writable(false);
  error = writable<string | null>(null);
  data = writable<AccountResponse>(null);

  async setupApp(locals: App.Locals, params: AppSetupParams): Promise<boolean | undefined> {
    if (!locals.user) {
      console.log('No user found in locals');
      this.error.set('No user found');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      // Automatically uses cookie auth to fetch account data for currently logged in user
      const response = await classroomio.account.$get();
      const accountData = await response.json();

      this.data.set(accountData);

      this.setupStores();

      this.routeUserToNextPage(params);

      return true;
    } catch (error) {
      console.error('Error fetching account', error);

      this.error.set(error instanceof Error ? error.message : 'Failed to fetch account');
    } finally {
      this.loading.set(false);
    }
  }

  /*
    1. Update user store
    2. Update profile store
    3. Update organizations store
  */
  setupStores() {
    const data = get(this.data);

    if (!data?.success) {
      return;
    }

    user.update((_user) => ({
      ..._user,
      fetchingUser: false,
      isLoggedIn: true,
      currentSession: (data.user as unknown as User) || undefined
    }));

    profile.set(data.profile);

    this.setOrgStore();
  }

  setOrgStore() {
    const data = get(this.data);
    if (!data?.success) {
      return;
    }

    orgs.set(data.organizations);

    const lastOrgSiteName = localStorage.getItem('classroomio_org_sitename');

    const lastOrg = data.organizations.find((org) => org.siteName === lastOrgSiteName);

    currentOrg.set(lastOrg || data.organizations[0]);
  }

  routeUserToNextPage({ isOrgSite }: AppSetupParams) {
    const isStudent = get(isOrgStudent);

    // LMS domain school.classroomio.com | mycustomschool.com
    if (isOrgSite) {
      // Handle rerouting
      const redirect = page.url.searchParams.get('redirect');
      if (redirect) {
        window.location.href = redirect;
        return;
      }

      if (shouldRedirectOnAuth(page.url.pathname)) {
        return this.goToLMS();
      }

      return;
    }

    if (isStudent) {
      return this.goToLMS();
    }

    return this.goToOrg();
  }

  goToLMS() {
    goto(resolve('/lms'));
  }

  goToOrg() {
    const selectedOrg = get(currentOrg);

    goto(resolve(`/org/${selectedOrg.siteName}`));
  }

  reset() {
    this.loading.set(false);
    this.error.set(null);
    this.data.set(null);
  }
}

export const accountManager = new AccountManager();
