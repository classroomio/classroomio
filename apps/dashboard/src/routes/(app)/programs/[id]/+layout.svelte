<script lang="ts">
  import { page } from '$app/state';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { Empty } from '@cio/ui/custom/empty';
  import { Spinner } from '@cio/ui/base/spinner';
  import { ProgramSidebar } from '$features/program/components/sidebar';
  import ProgramHeader from '$features/program/components/program-header.svelte';
  import { programApi } from '$features/program/api';
  import { profile } from '$lib/utils/store/user';

  interface Props {
    children?: import('svelte').Snippet;
    data: {
      programId: string;
    };
  }

  let { children, data }: Props = $props();

  $effect(() => {
    if (!data.programId || !$profile.id) return;
    programApi.ensureProgramShell(data.programId);
  });

  const isProgramReady = $derived.by(() => {
    return (
      programApi.program?.id === data.programId &&
      programApi.loadedMembersProgramId === data.programId &&
      programApi.loadedCoursesProgramId === data.programId
    );
  });
</script>

<svelte:head>
  <title>{programApi.program?.name || 'Program'} - ClassroomIO</title>
</svelte:head>

<Sidebar.Provider data-sveltekit-preload-data="off">
  <ProgramSidebar path={page.url.pathname} id={data.programId} {isProgramReady} />

  <Sidebar.Inset
    class="w-[calc(100vw-var(--sidebar-width))] group-data-[collapsible=icon]:w-[calc(100vw-var(--sidebar-width-icon))]"
  >
    <ProgramHeader />

    {#if !isProgramReady}
      <div class="mx-auto flex h-[calc(100vh-56px)] w-full items-center justify-center">
        <Empty
          title="Loading program..."
          description="Please wait while we load your program data."
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
