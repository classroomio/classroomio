<script lang="ts">
  import { page } from '$app/state';

  import { appInitApi } from '$features/app/init.svelte';
  import { setupCloudAnalytics } from '$lib/utils/functions/appSetup';
  import { Spinner } from '@cio/ui/base/spinner';
  import { Button } from '@cio/ui/base/button';
  import FrownIcon from '@lucide/svelte/icons/frown';
  import { Empty } from '@cio/ui/custom/empty';
  import { SimpleLogoNav } from '@cio/ui/custom/simple-logo-nav';
  import { authClient } from '$lib/utils/services/auth/client';

  setupCloudAnalytics();

  const session = authClient.useSession();
  const isSessionLoading = $derived($session.isPending || $session.isRefetching);
  const isLoadingApp = $derived(isSessionLoading || appInitApi.loading);
  const isSessionReady = $derived(!$session.isPending && !$session.isRefetching && $session.data);

  $effect(() => {
    if ($session.isPending || $session.isRefetching || !!$session.data) {
      return;
    }

    if (!$session.data && !page.url.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  });

  $effect(() => {
    if (isSessionReady && !appInitApi.isInitializedAndReady && !appInitApi.loading) {
      appInitApi.setupApp($session.data as App.Locals, {
        isOrgSite: false,
        orgSiteName: ''
      });
    }
  });
</script>

{#if !isLoadingApp && appInitApi.error}
  <Empty
    title="Something Went Wrong"
    description="We encountered an unexpected error. Please reload the page or contact us for support."
    icon={FrownIcon}
    variant="page"
    layout="full-page"
    showLogo={true}
  >
    {#if appInitApi.error}
      <p class="my-2 text-red-500">{appInitApi.error}</p>
    {/if}
    <div class="flex gap-2">
      <Button variant="secondary" onclick={() => window.location.reload()}>Reload Page</Button>
      <Button variant="default" href="https://classroomio.com/contact">Contact Us</Button>
    </div>
  </Empty>
{:else}
  <div class="m-2 flex h-screen w-screen flex-col items-center justify-center font-sans sm:m-0">
    <SimpleLogoNav />
    <Spinner class="size-14! text-blue-700!" />
  </div>
{/if}
