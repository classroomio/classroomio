<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { Empty } from '@cio/ui/custom/empty';
  import { Spinner } from '@cio/ui/base/spinner';
  import { PathSidebar, PathHeader, ClonePathModal } from '$features/learning-path';
  import { learningPathApi } from '$features/learning-path/api';
  import { resolveActivePath } from '$features/learning-path/utils/learning-path-utils';
  import { DeleteModal } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';

  let { data, children } = $props();

  let sidebarWidth = $state(256);
  let hasLoadedSidebarWidth = $state(false);
  let sidebarProviderElement = $state<HTMLDivElement | null>(null);

  let deleteModalOpen = $state(false);
  let isDeleting = $state(false);

  $effect.pre(() => {
    if (data.pathId) {
      learningPathApi.getPath(data.pathId);
    }
  });

  const activePath = $derived(
    resolveActivePath(data.pathId, learningPathApi.currentPath, learningPathApi.paths, data.path)
  );

  const isPathReady = $derived(!!activePath);

  function handleSidebarWidthPreview(width: number) {
    sidebarProviderElement?.style.setProperty('--sidebar-width', `${width}px`);
  }

  function handleSidebarWidthChange(width: number) {
    sidebarWidth = width;
  }

  async function handleDeletePath() {
    if (!activePath) return;

    isDeleting = true;
    try {
      await learningPathApi.deletePath(activePath.id);
      deleteModalOpen = false;
      goto(`/org/${data.orgSlug}/paths`);
    } finally {
      isDeleting = false;
    }
  }

  onMount(() => {
    try {
      const storedWidth = Number(localStorage.getItem('cio_lp_sidebar_width'));
      if (Number.isFinite(storedWidth) && storedWidth > 0) {
        sidebarWidth = storedWidth;
      }
    } catch {
      // localStorage unavailable
    }
    hasLoadedSidebarWidth = true;
  });

  $effect(() => {
    if (!hasLoadedSidebarWidth) return;
    try {
      localStorage.setItem('cio_lp_sidebar_width', String(Math.round(sidebarWidth)));
    } catch {
      // localStorage unavailable
    }
  });
</script>

<svelte:head>
  <title>{activePath?.name || $t('org_navigation.learning_paths')} - ClassroomIO</title>
</svelte:head>

<DeleteModal bind:open={deleteModalOpen} onDelete={handleDeletePath} isLoading={isDeleting} />

<ClonePathModal />

<Sidebar.Provider
  bind:ref={sidebarProviderElement}
  data-sveltekit-preload-data="off"
  style={`--sidebar-width: ${sidebarWidth}px;`}
>
  <PathSidebar
    path={activePath}
    {isPathReady}
    {sidebarWidth}
    onSidebarWidthPreview={handleSidebarWidthPreview}
    onSidebarWidthChange={handleSidebarWidthChange}
  />

  <Sidebar.Inset class="min-w-0 flex-1">
    <PathHeader path={activePath} onDelete={() => (deleteModalOpen = true)} />

    {#if !isPathReady}
      <div class="mx-auto flex h-[calc(100vh-56px)] w-full items-center justify-center">
        <Empty
          title={$t('learningPath.workspace.loading_title')}
          description={$t('learningPath.workspace.loading_description')}
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
