import { BaseApi, classroomio } from '$lib/utils/services/api';
import {
  currentOrg,
  getAppOrigin,
  getOrgPublicUrl,
  isOrgManagerRole,
  mergeAccountOrgFromServer,
  orgs
} from '$lib/utils/store/org';
import { defaultProfileState, defaultUserState, profile, user } from '$lib/utils/store/user';

import type { AccountResponse, AccountSuccess } from './types';
import { type AppOrgParams } from './resolve-app-org-params';
import type { PendingOrgInvite } from '$features/lms/utils/types';
import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
import type { TUser } from '@cio/db/types';
import { authClient } from '$lib/utils/services/auth/client';
import { get } from 'svelte/store';
import { goto } from '$app/navigation';
import { handleLocaleChange } from '$lib/utils/functions/translations';
import { identifyPosthogUser } from '$lib/utils/services/posthog';
import { identifyUserJotUser } from '$lib/utils/services/userjot';
import { isOrgStudent, globalStore } from '$lib/utils/store/app';
import { isPublicRoute } from '$lib/utils/functions/routes/isPublicRoute';
import { licenseApi } from '$features/license/api/license.svelte';
import { logout } from '$lib/utils/functions/logout';
import { page } from '$app/state';
import { resolve } from '$app/paths';
import { setSentryUser } from '$lib/utils/services/sentry';
import { setTheme } from '$lib/utils/functions/theme';
import { setupAnalyticsBasedOnLicense } from '$lib/utils/functions/appSetup';
import shouldRedirectOnAuth from '$lib/utils/functions/routes/shouldRedirectOnAuth';
import { ROLE } from '@cio/utils/constants';

type AppSetupParams = AppOrgParams;

function tenantSyncKey(params: AppSetupParams): string | null {
  if (!params.orgSiteName) {
    return null;
  }

  if (params.isOrgSite) {
    return `tenant:${params.orgSiteName}:${params.orgId ?? ''}`;
  }

  return `admin:${params.orgSiteName}`;
}

/*
  Manages everything related to loading the logged in user and setting up the organization.
*/
class AppInitApi extends BaseApi {
  data = $state<AccountResponse>(null);
  session = $state<App.Locals | null>(null);
  pendingOrgInvite = $state<PendingOrgInvite | null>(null);
  showPendingInviteModal = $state(false);
  private syncedTenantKey: string | null = null;

  get loading() {
    return this.isLoading;
  }

  async setupApp(locals: App.Locals, params: AppSetupParams): Promise<boolean | undefined> {
    if (this.isLoading || this.isInitializedAndReady) {
      return;
    }

    this.isLoading = true;

    try {
      if (!locals.user) {
        if (!params.isOrgSite) {
          goto(resolve('/login', {}));
          return false;
        }

        console.log('No user found in locals');
        return;
      }

      this.session = locals;

      const needsTenantMembership = params.isOrgSite && params.orgId && !this.isMemberOfOrg(locals, params.orgId);

      if (needsTenantMembership && params.orgId) {
        const orgId = params.orgId;
        const [pendingInvite, accountData] = await Promise.all([
          this.fetchPendingOrgInvite(orgId),
          this.fetchAccountData()
        ]);

        if (!accountData) {
          return false;
        }

        if (pendingInvite) {
          this.showPendingOrgInvite(pendingInvite);
          this.applyAccountData(accountData, params);
          return;
        }

        const joined = await this.autoJoinOnTenantSite(orgId);
        if (joined) {
          const refreshedAccount = await this.fetchAccountData();
          if (refreshedAccount) {
            this.applyAccountData(refreshedAccount, params);
            return;
          }
        }

        this.applyAccountData(accountData, params);
        return;
      }

      const accountData = await this.fetchAccountData();
      if (accountData) {
        this.applyAccountData(accountData, params);
      }
    } finally {
      if (!this.isInitializedAndReady) {
        this.isLoading = false;
      }
    }
  }

  /**
   * Whether the current session already reflects membership in `orgId`.
   * Better Auth's `customSession` attaches an `orgRoles` map ({ orgId: roleId })
   * that RBAC middlewares also use, so a present key means the user is a member.
   */
  private isMemberOfOrg(locals: App.Locals, orgId: string): boolean {
    const orgRoles = (locals as { orgRoles?: Record<string, number> }).orgRoles;

    return !!orgRoles && orgId in orgRoles;
  }

  private applyAccountData(accountData: AccountSuccess, params: AppSetupParams) {
    this.resetErrors();
    this.success = true;
    this.data = accountData;
    this.setupStores(params);
    licenseApi.syncFromAccount(accountData.licenseFeatures, get(currentOrg));
    setupAnalyticsBasedOnLicense(
      accountData.profile?.id
        ? { id: accountData.profile.id, email: accountData.profile.email, name: accountData.profile.fullname }
        : undefined
    );
    this.setUserAnalytics();
    this.routeUserToNextPage(params);
  }

  private async fetchAccountData(): Promise<AccountSuccess | undefined> {
    try {
      const response = await classroomio.account.$get();
      const result = (await response.json()) as AccountResponse;

      if (!result?.success) {
        this.error = JSON.stringify(result);
        logout();
        return undefined;
      }

      return result;
    } catch (error) {
      console.error('Error fetching account:', error);
      this.error = error instanceof Error ? error.message : 'Error fetching account';
      logout();
      return undefined;
    }
  }

  private showPendingOrgInvite(pendingInvite: PendingOrgInvite) {
    this.pendingOrgInvite = pendingInvite;
    this.showPendingInviteModal = true;
  }

  /**
   * On tenant sites, link an existing roster row or auto-join the org as STUDENT —
   * unless the user has a pending org invite, in which case we surface accept UI.
   * Returns true when a new membership was created or an email-only row was linked.
   */
  private async ensureTenantMembership(
    orgId: string,
    options?: { knownPendingInvite?: PendingOrgInvite | null }
  ): Promise<boolean> {
    const pendingInvite =
      options && 'knownPendingInvite' in options
        ? (options.knownPendingInvite ?? null)
        : await this.fetchPendingOrgInvite(orgId);

    if (pendingInvite) {
      this.showPendingOrgInvite(pendingInvite);
      return false;
    }

    return this.autoJoinOnTenantSite(orgId);
  }

  private async fetchPendingOrgInvite(orgId: string): Promise<PendingOrgInvite | null> {
    try {
      const response = await classroomio.invite.organization.pending.$get({}, { headers: { 'cio-org-id': orgId } });
      const result = await response.json();

      if (result.success && result.data) {
        return result.data;
      }
    } catch (error) {
      console.warn('pending org invite check failed', error);
    }

    return null;
  }

  private async autoJoinOnTenantSite(orgId: string): Promise<boolean> {
    try {
      const response = await classroomio.organization['auto-join'].$post(
        {},
        { headers: { 'cio-org-id': orgId } }
      );

      if (!response.ok) {
        // 403 is expected for invite-only / disabled-signup orgs — the user
        // visited a tenant site but isn't allowed to join. Other failures
        // shouldn't block the rest of setupApp.
        console.warn('auto-join failed', response.status, await response.text().catch(() => ''));
        return false;
      }

      const result = await response.json();
      if (result.success && result.data?.pendingInvite) {
        const pendingInvite = await this.fetchPendingOrgInvite(orgId);
        if (pendingInvite) {
          this.showPendingOrgInvite(pendingInvite);
        }

        return false;
      }

      // The user is a new member, so the session cookie cache (orgRoles)
      // is stale. Force Better Auth to refetch from DB and rewrite the
      // session_data cookie — Better Auth manages the cookie name itself.
      await authClient.getSession({ query: { disableCookieCache: true } });
      return true;
    } catch (error) {
      console.warn('auto-join threw', error);
      return false;
    }
  }

  /**
   * Re-pin org context after setupApp when the URL org changes.
   *
   * setupApp only runs once per session; tenant subdomains and `/org/[slug]`
   * routes can change without another /account fetch. This keeps `currentOrg`
   * aligned with the URL and attempts auto-join on org sites when needed.
   */
  async syncOrgContext(params: AppSetupParams): Promise<void> {
    if (!this.data?.success || !params.orgSiteName) {
      return;
    }

    const nextTenantKey = tenantSyncKey(params);
    if (nextTenantKey && nextTenantKey === this.syncedTenantKey) {
      return;
    }

    const isMember = this.data.organizations.some((org) => org.siteName === params.orgSiteName);
    if (params.isOrgSite && params.orgId && !isMember) {
      const pendingInvite = await this.fetchPendingOrgInvite(params.orgId);
      const enrolled = await this.ensureTenantMembership(params.orgId, { knownPendingInvite: pendingInvite });
      if (enrolled) {
        const accountData = await this.fetchAccountData();
        if (accountData) {
          this.data = accountData;
        }
      }
    }

    this.setOrgStore(params);
    licenseApi.syncFromAccount(this.data.licenseFeatures, get(currentOrg));
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

    orgs.set(this.data.organizations.map((org) => mergeAccountOrgFromServer(org)));

    const nextOrg = this.pickCurrentOrg(params);
    if (!nextOrg) {
      return;
    }

    currentOrg.set(mergeAccountOrgFromServer(nextOrg));

    if (nextOrg.siteName) {
      localStorage.setItem('classroomio_org_sitename', nextOrg.siteName);
    }

    const theme = get(currentOrg)?.theme;

    setTheme(theme || 'blue');
    this.syncedTenantKey = tenantSyncKey(params ?? { isOrgSite: false, orgSiteName: '' });
  }

  /**
   * Prefer the tenant from the current URL on org sites. Only fall back to
   * localStorage / the first account org on the admin host (`app.*`).
   */
  private pickCurrentOrg(params?: AppSetupParams) {
    const organizations = this.data?.success ? this.data.organizations : [];
    const urlResolvedOrg = get(currentOrg);

    if (params?.orgSiteName) {
      const membership = organizations.find((org) => org.siteName === params.orgSiteName);
      if (membership) {
        return membership;
      }

      if (params.isOrgSite) {
        // Keep the server-resolved tenant org (set from URL in +layout.svelte) instead
        // of switching to another membership from /account.
        if (urlResolvedOrg.siteName === params.orgSiteName && urlResolvedOrg.id) {
          return urlResolvedOrg;
        }

        if (params.orgId && urlResolvedOrg.id === params.orgId) {
          return urlResolvedOrg;
        }

        return undefined;
      }
    }

    if (!organizations.length) {
      return undefined;
    }

    const managedOrganizations = organizations.filter((org) => isOrgManagerRole(org.roleId));
    const lastOrgSiteName = localStorage.getItem('classroomio_org_sitename');

    return (
      managedOrganizations.find((org) => org.siteName === lastOrgSiteName) ??
      managedOrganizations[0] ??
      organizations[0]
    );
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
    const userHasOneOrg = this.data.organizations.length === 1;
    const userIsStudentInAllOrgs = this.data.organizations.every((org) => org.roleId === ROLE.STUDENT);
    const userIsAdminInAtleastOneOrg = this.data.organizations.some((org) => org.roleId === ROLE.ADMIN);

    if (userHasOneOrg && isCloud && !isOrgSite && isStudent && selectedOrg.siteName && userIsStudentInAllOrgs) {
      window.location.href = getOrgPublicUrl(selectedOrg, '/lms');
      return;
    }

    // User is an admin in at least one org, so they should be redirected to the org dashboard.
    if (userIsAdminInAtleastOneOrg && isCloud && !isOrgSite) {
      const orgWithAdminRole = this.data.organizations.find((org) => org.roleId === ROLE.ADMIN);

      goto(resolve(`/org/${orgWithAdminRole.siteName}`, {}));
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

  async handlePendingInviteAccepted(redirectTo?: string): Promise<void> {
    this.showPendingInviteModal = false;
    this.pendingOrgInvite = null;

    await authClient.getSession({ query: { disableCookieCache: true } });

    const response = await classroomio.account.$get();
    const accountData = (await response.json()) as AccountResponse;
    if (accountData?.success) {
      this.data = accountData;
      this.setupStores();
    }

    const isOnOrgSite = get(globalStore).isOrgSite;
    if (redirectTo?.startsWith('/org/') && isOnOrgSite) {
      window.location.href = `${getAppOrigin()}${redirectTo}`;
      return;
    }

    if (redirectTo) {
      window.location.href = redirectTo;
      return;
    }

    window.location.reload();
  }

  reset() {
    super.reset();
    this.data = null;
    this.syncedTenantKey = null;
    this.pendingOrgInvite = null;
    this.showPendingInviteModal = false;
    licenseApi.reset();

    user.set(defaultUserState);
    profile.set(defaultProfileState);
  }

  get isInitializedAndReady() {
    return !this.isLoading && !this.error && this.data !== null;
  }
}

export const appInitApi = new AppInitApi();
