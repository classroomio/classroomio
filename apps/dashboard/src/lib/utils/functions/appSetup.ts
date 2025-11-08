import { currentOrg, currentOrgDomain } from '$lib/utils/store/org';
import { identifyPosthogUser, initPosthog } from '$lib/utils/services/posthog';
import { initSentry, setSentryUser } from '$lib/utils/services/sentry';
import { profile, user } from '$lib/utils/store/user';

import { ROLE } from '$lib/utils/constants/roles';
import { ROUTE } from '$lib/utils/constants/routes';
import { dev } from '$app/environment';
import { get } from 'svelte/store';
import { getOrganizations } from '$lib/utils/services/org';
import { goto } from '$app/navigation';
import { handleLocaleChange } from '$lib/utils/functions/translations';
import isEmpty from 'lodash/isEmpty';
import isPublicRoute from '$lib/utils/functions/routes/isPublicRoute';
import { page } from '$app/state';
import { setTheme } from '$lib/utils/functions/theme';
import shouldRedirectOnAuth from '$lib/utils/functions/routes/shouldRedirectOnAuth';
import { supabase } from '$lib/utils/functions/supabase';

export function setupAnalytics() {
  // Set up sentry
  initSentry();

  // Set up posthog
  initPosthog();

  // Disable umami on localhost
  if (dev) {
    localStorage.setItem('umami.disabled', '1');
  }
}

function setAnalyticsUser() {
  const profileStore = get(profile);

  if (!profileStore.id) return;

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

// export function setupUser(locals: App.Locals) {

// }

export async function getProfile({
  path,
  queryParam,
  isOrgSite,
  orgSiteName
}: {
  path: string;
  queryParam: string;
  isOrgSite: boolean;
  orgSiteName: string;
}) {
  const currentOrgStore = get(currentOrg);
  const currentOrgDomainStore = get(currentOrgDomain);

  const params = new URLSearchParams(window.location.search);
  // Get user profile
  const {
    data: { session }
  } = await supabase.auth.getSession();
  const { user: authUser } = session || {};
  console.log('Get user', authUser);

  if (!authUser && !isPublicRoute(page.url?.pathname)) {
    return goto('/login?redirect=/' + path + queryParam);
  }

  // Skip refetching profile, if already in store
  if (profileStore.id) {
    handleLocaleChange(profileStore.locale);
    return;
  }

  // Check if user has profile
  const {
    data: profileData,
    error,
    status
  } = await supabase.from('profile').select(`*`).eq('id', authUser?.id).single();
  console.log('Get profile', profileData);

  if (error && !profileData && status === 406 && authUser) {
    // User wasn't found, create profile
    console.log(`User wasn't found, create profile`);

    const [regexUsernameMatch] = [...(authUser.email?.matchAll(/(.*)@/g) || [])];

    const isGoogleAuth = !!authUser.app_metadata?.providers?.includes('google');

    const { data: newProfileData, error } = await supabase
      .from('profile')
      .insert({
        id: authUser.id,
        username: regexUsernameMatch[1] + `${new Date().getTime()}`,
        fullname: regexUsernameMatch[1],
        email: authUser.email,
        is_email_verified: isGoogleAuth,
        verified_at: isGoogleAuth ? new Date().toDateString() : undefined
      })
      .select();

    // Profile created, go to onboarding or lms
    if (!error && newProfileData) {
      user.update((_user) => ({
        ..._user,
        fetchingUser: false,
        isLoggedIn: true,
        currentSession: authUser
      }));

      profile.set(newProfileData[0]);

      setAnalyticsUser();

      // Fetch language
      handleLocaleChange(newProfileData[0].locale);

      if (isOrgSite) {
        const { data, error } = await supabase
          .from('organizationmember')
          .insert({
            organization_id: currentOrgStore.id,
            profile_id: profileStore.id,
            role_id: 3
          })
          .select();
        if (error) {
          console.error('Error adding user to organisation', error);
        } else {
          console.log('Success adding user to organisation', data);
          const memberId = data?.[0]?.id || '';

          currentOrg.update((_currentOrg) => ({
            ..._currentOrg,
            memberId
          }));
        }

        if (params.get('redirect')) {
          goto(params.get('redirect') || '');
        } else if (shouldRedirectOnAuth(path)) {
          goto('/lms');
        }
        return;
      }

      // On invite page, don't go to onboarding
      if (!path.includes('invite')) {
        goto(ROUTE.ONBOARDING);
      }
    }

    user.update((_user) => ({
      ..._user,
      fetchingUser: false
    }));
  } else if (profileData) {
    // Profile exists, go to profile page
    user.update((_user) => ({
      ..._user,
      fetchingUser: false,
      isLoggedIn: true,
      currentSession: authUser
    }));

    profile.set(profileData);

    // Set user in sentry
    setAnalyticsUser();

    handleLocaleChange(profileData.locale);

    const orgRes = await getOrganizations(profileData.id, isOrgSite, orgSiteName);

    const isStudentAccount = orgRes.currentOrg.role_id == ROLE.STUDENT;

    // student redirect
    if (isOrgSite) {
      if (params.has('redirect')) {
        goto(params.get('redirect') || '');
      } else if (shouldRedirectOnAuth(path)) {
        goto('/lms');
      }
    } else {
      if (isStudentAccount) {
        // Check if the student logged into the dashboard.
        console.log('Student logged into dashboard');
        if (dev) {
          goto('/lms');
        } else {
          window.location.replace(`${currentOrgDomainStore}/lms`);
        }
      } else if (isEmpty(orgRes.orgs) && !path.includes('invite')) {
        // Not on invite page or no org, go to onboarding
        goto(ROUTE.ONBOARDING);
      } else if (params.has('redirect')) {
        goto(params.get('redirect') || '');
      } else if (shouldRedirectOnAuth(path)) {
        // By default redirect to first organization
        goto(`/org/${orgRes.currentOrg.siteName}`);
      }
    }

    setTheme(orgRes?.currentOrg?.theme);
  }

  if (!profileData && !isPublicRoute(pageStore.url?.pathname)) {
    goto('/login?redirect=/' + path);
  }
}
