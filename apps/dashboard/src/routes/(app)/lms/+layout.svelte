<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { appInitApi } from '$features/app/init.svelte';
  import { toLmsAvailabilityContext } from '$features/ui/navigation/lms-navigation';
  import { findLmsDestinationForPathname, isLmsDestinationAvailable } from '@cio/utils/lms';
  import { currentOrg } from '$lib/utils/store/org';
  import LmsHeader from '$features/ui/navigation/lms-header.svelte';
  import { LMSSidebar } from '$features/ui/sidebar/lms-sidebar';

  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();

  const destination = $derived(findLmsDestinationForPathname(page.url.pathname));
  const availabilityContext = $derived(toLmsAvailabilityContext($currentOrg));
  const isOrgReady = $derived(appInitApi.isInitializedAndReady);
  const hasConditionalRule = $derived(destination?.isConditional === true);
  const isBlocked = $derived(
    isOrgReady && !!destination && !isLmsDestinationAvailable(destination, availabilityContext)
  );

  $effect(() => {
    if (!isBlocked) return;

    void goto(resolve('/lms', {}), { replaceState: true });
  });
</script>

<Sidebar.Provider>
  <LMSSidebar />

  <Sidebar.Inset>
    <LmsHeader />

    <div class="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4">
      {#if isBlocked || (hasConditionalRule && !isOrgReady)}
        <Skeleton class="h-10 w-1/3 rounded-lg" />
        <Skeleton class="h-64 w-full rounded-xl" />
      {:else}
        {@render children?.()}
      {/if}
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>
