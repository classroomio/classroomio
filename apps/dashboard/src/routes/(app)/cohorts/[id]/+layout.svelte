<script lang="ts">
  import { page } from '$app/state';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { Empty } from '@cio/ui/custom/empty';
  import { Spinner } from '@cio/ui/base/spinner';
  import { CohortSidebar } from '$features/cohort/components/sidebar';
  import CohortHeader from '$features/cohort/components/cohort-header.svelte';
  import { cohortApi } from '$features/cohort/api';
  import { profile } from '$lib/utils/store/user';

  interface Props {
    children?: import('svelte').Snippet;
    data: {
      cohortId: string;
    };
  }

  let { children, data }: Props = $props();

  $effect(() => {
    if (!data.cohortId || !$profile.id) return;
    cohortApi.ensureCohortShell(data.cohortId);
  });

  const isCohortReady = $derived.by(() => {
    return (
      cohortApi.cohort?.id === data.cohortId &&
      cohortApi.loadedMembersCohortId === data.cohortId &&
      cohortApi.loadedCoursesCohortId === data.cohortId
    );
  });
</script>

<svelte:head>
  <title>{cohortApi.cohort?.name || 'Cohort'} - ClassroomIO</title>
</svelte:head>

<Sidebar.Provider data-sveltekit-preload-data="off">
  <CohortSidebar path={page.url.pathname} id={data.cohortId} {isCohortReady} />

  <Sidebar.Inset
    class="w-[calc(100vw-var(--sidebar-width))] group-data-[collapsible=icon]:w-[calc(100vw-var(--sidebar-width-icon))]"
  >
    <CohortHeader />

    {#if !isCohortReady}
      <div class="mx-auto flex h-[calc(100vh-56px)] w-full items-center justify-center">
        <Empty
          title="Loading cohort..."
          description="Please wait while we load your cohort data."
          icon={Spinner}
          iconClass="h-8 w-8"
          variant="page"
        />
      </div>
    {:else}
      {@render children?.()}
    {/if}
  </Sidebar.Inset>
</Sidebar.Provider>
