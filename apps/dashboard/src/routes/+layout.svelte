<script lang="ts">
  import { page } from '$app/state';

  import { OrgLandingPage, PlayQuiz } from '$features/org';
  import { Snackbar } from '$features/ui';
  import { UpgradeModal, PageLoadProgress, PageRestricted } from '$features/ui';
  import { user } from '$lib/utils/store/user';
  import { setupAnalytics } from '$lib/utils/functions/appSetup';
  import { setTheme } from '$lib/utils/functions/theme';
  import { initOrgAnalytics } from '$lib/utils/services/posthog';
  import { globalStore } from '$lib/utils/store/app';
  import { currentOrg } from '$lib/utils/store/org';
  import { appInitApi } from '$features/app/init.svelte';
  import merge from 'lodash/merge';
  import { onMount } from 'svelte';
  import { MetaTags } from 'svelte-meta-tags';
  import { authClient } from '$lib/utils/services/auth/client';
  import { isPublicRoute } from '$lib/utils/functions/routes/isPublicRoute';

  import { ModeWatcher } from '@cio/ui/base/dark-mode';

  import '../app.css';

  let { data, children } = $props();

  let path = $derived(page.url.pathname);

  function intialAppSetup() {
    console.log(
      'Welcome to ClassroomIO, we are grateful you chose us.',
      page.url.host,
      `\nIs student domain: ${data.isOrgSite}`,
      data
    );

    setupAnalytics();

    if (data.locals.user) {
      user.set({
        ...$user,
        isLoggedIn: true,
        currentSession: data.locals.user
      });
    }

    console.log('user', $user);

    // Authentication Steps
    if (!data.isOrgSite || !data.org) return;

    $globalStore.orgSiteName = data.orgSiteName || '';
    $globalStore.isOrgSite = data.isOrgSite;

    currentOrg.set(data.org);

    // Setup internal analytics
    if (data.orgSiteName) {
      initOrgAnalytics(data.orgSiteName);
    }

    const theme = data.org?.theme;
    if (theme) {
      setTheme(theme);
    }
  }

  onMount(() => {
    intialAppSetup();

    if (data.skipAuth) return;
  });

  const session = authClient.useSession();
  const isSessionReady = $derived(!$session.isPending && !$session.isRefetching && $session.data);

  // The goal of this effect is to make sure that we do a redirect to /login if the session data is expired
  // This should be happening on the hooks.server.ts but we've made the home page public so we can show a loading spinner while the app is initializing OR an error message if the backend is down.
  $effect(() => {
    if ($session.isPending || $session.isRefetching || !!$session.data) {
      console.log('session is pending or refetching');
      return;
    }
    console.log('path', path);
    console.log('isPublicRoute', isPublicRoute(path));
    console.log('data', $session.data);

    // No need to require login for public routes
    if (isPublicRoute(path) && path !== '/') return;

    if (!$session.data && path !== '/login') {
      console.log('session data is not available, go to login');
      window.location.href = '/login';
    }
  });

  $effect(() => {
    // this means the session cookie 'classroomio.session_data' expired and we need to trigger a new session
    // triggering a new session will update the session data in the cookies so that our hooks.server.ts doesn't always have to hit the DB when checking if user is logged in or not. Without the session cookie, every page navigation or route would always hit the database to check if user is logged in or not.
    if (!data.locals.fromSessions && isSessionReady) {
      authClient.getSession().then(() => {
        console.log('triggered new session');
      });
    }
  });

  $effect(() => {
    if (isSessionReady && !appInitApi.isInitializedAndReady && !appInitApi.loading) {
      console.log('setting up account with session data');

      appInitApi.setupApp($session.data as App.Locals, {
        isOrgSite: data.isOrgSite,
        orgSiteName: data.orgSiteName
      });
    }
  });

  const metaTags = $derived(merge(data.baseMetaTags, page.data.pageMetaTags));
</script>

<div>
  <ModeWatcher />

  <MetaTags {...metaTags} />

  <UpgradeModal />

  <Snackbar />

  {#if data.org?.isRestricted || $currentOrg.isRestricted}
    <PageRestricted />
  {:else if data.skipAuth}
    <PlayQuiz />
  {:else if data.isOrgSite && data.org && path === '/'}
    <OrgLandingPage orgSiteName={data.orgSiteName} org={data.org} />
  {:else}
    <PageLoadProgress zIndex={10000} />

    {@render children?.()}
  {/if}
</div>

<style>
  :global(:root) {
    --main-primary-color: rgba(29, 78, 216, 1);
    --border-color: #eaecef;
  }

  :global(.dark svg.dark) {
    fill: #fff;
  }

  :global(.border-c) {
    border: 1px solid var(--border-color);
  }

  :global(.border-bottom-c) {
    border-bottom: 1px solid var(--border-color);
  }

  :global(.cards-container) {
    width: 90%;
    margin: 0 auto;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    column-gap: 12px;
    row-gap: 12px;
  }

  @media screen and (max-width: 768px) {
    :global(.cards-container) {
      width: 95%;
      margin: 0 auto;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      column-gap: 12px;
      row-gap: 12px;
    }
  }
</style>
