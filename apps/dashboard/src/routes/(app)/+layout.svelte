<script lang="ts">
  import { page } from '$app/state';

  import { UpgradeModal, PageLoadProgress, PageRestricted } from '$features/ui';
  import { user } from '$lib/utils/store/user';
  import { setTheme } from '$lib/utils/functions/theme';
  import { setupCloudAnalytics } from '$lib/utils/functions/appSetup';
  import { globalStore } from '$lib/utils/store/app';
  import { currentOrg, isOrgStudent } from '$lib/utils/store/org';
  import { appInitApi } from '$features/app/init.svelte';
  import { onMount } from 'svelte';
  import { authClient } from '$lib/utils/services/auth/client';
  import { isPublicRoute } from '$lib/utils/functions/routes/isPublicRoute';
  import { env } from '$env/dynamic/public';

  interface Props {
    children?: import('svelte').Snippet;
    data: {
      isOrgSite: boolean;
      orgSiteName: string;
      org: import('$features/app/types').AccountOrg | null;
      skipAuth: boolean;
      locals: App.Locals;
    };
  }

  let { children, data }: Props = $props();

  let path = $derived(page.url.pathname);

  function intialAppSetup() {
    setupCloudAnalytics();

    if (data?.locals?.user) {
      user.set({
        ...$user,
        isLoggedIn: true,
        currentSession: data.locals.user
      });
    }

    if (!data.isOrgSite || !data.org) return;

    $globalStore.orgSiteName = data.orgSiteName || '';
    $globalStore.isOrgSite = data.isOrgSite;

    currentOrg.set(data.org);

    const theme = data.org?.theme;
    setTheme(theme || 'blue');
  }

  onMount(() => {
    const loadingIndicator = document.getElementById('app-loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }

    intialAppSetup();

    if (data.skipAuth) return;
  });

  const session = authClient.useSession();
  const isSessionReady = $derived(!$session.isPending && !$session.isRefetching && $session.data);

  $effect(() => {
    if ($session.isPending || $session.isRefetching || !!$session.data) {
      return;
    }

    if (isPublicRoute(path) && (path !== '/' || data.isOrgSite)) {
      return;
    }

    if (!$session.data && !path.startsWith('/login')) {
      console.log('session data is not available, go to login');
      window.location.href = '/login';
    }
  });

  $effect(() => {
    if (!data?.locals?.fromSessions && isSessionReady) {
      authClient.getSession().then(() => {
        console.log('triggered new session');
      });
    }
  });

  $effect(() => {
    console.log('env public server url', env.PUBLIC_SERVER_URL);
    console.log('env public is selfhosted', env.PUBLIC_IS_SELFHOSTED);
    if (isSessionReady && !appInitApi.isInitializedAndReady && !appInitApi.loading) {
      appInitApi.setupApp($session.data as App.Locals, {
        isOrgSite: data.isOrgSite,
        orgSiteName: data.orgSiteName
      });
    }
  });

  $effect(() => {
    if ($isOrgStudent === null) return;

    if ($isOrgStudent !== $globalStore.isStudent) {
      globalStore.update((s) => ({ ...s, isStudent: !!$isOrgStudent }));
    }
  });
</script>

<UpgradeModal />

{#if data.org?.isRestricted || $currentOrg.isRestricted}
  <PageRestricted />
{:else}
  <PageLoadProgress zIndex={10000} />

  {@render children?.()}
{/if}
