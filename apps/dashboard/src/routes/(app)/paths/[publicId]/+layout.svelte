<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import { Spinner } from '@cio/ui/base/spinner';
  import { PathSidebar, PathHeader } from '$features/learning-path';
  import { learningPathApi } from '$features/learning-path/api';
  import type { LearningPathDetail } from '$features/learning-path/utils/types';
  import { DeleteModal } from '$features/ui';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrgPath } from '$lib/utils/store/org';

  interface Props {
    children?: import('svelte').Snippet;
    data: {
      publicId: string;
      path?: LearningPathDetail;
    };
  }

  let { data, children }: Props = $props();

  let sidebarWidth = $state(256);
  let hasLoadedSidebarWidth = $state(false);
  let sidebarProviderElement = $state<HTMLDivElement | null>(null);

  let deleteModalOpen = $state(false);
  let isDeleting = $state(false);

  $effect(() => {
    if (!data.publicId) return;

    if (data.path) {
      learningPathApi.currentPath = data.path;
      return;
    }

    learningPathApi.ensurePath(data.publicId);
  });

  const activePath = $derived(learningPathApi.currentPath);
  const isPathReady = $derived.by(() => {
    if (!activePath) return false;
    return activePath.publicId === data.publicId;
  });

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
      await learningPathApi.delete(activePath.id);
      if (learningPathApi.success) {
        goto(`${$currentOrgPath}/paths`);
      }
    } catch (err) {
      console.error('Failed to delete learning path:', err);
      snackbar.error();
    } finally {
      deleteModalOpen = false;
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

    {#if learningPathApi.isNotFound}
      <div class="mx-auto flex h-[calc(100vh-56px)] w-full items-center justify-center p-6">
        <Empty
          title={$t('learningPath.workspace.not_found_title')}
          description={$t('learningPath.workspace.not_found_description')}
          variant="page"
        >
          <div class="mt-4 flex justify-center">
            <Button href={`${$currentOrgPath}/paths`} variant="outline">
              {$t('learningPath.workspace.back_to_paths')}
            </Button>
          </div>
        </Empty>
      </div>
    {:else if learningPathApi.loadError}
      <div class="mx-auto flex h-[calc(100vh-56px)] w-full items-center justify-center p-6">
        <Empty
          title={$t('learningPath.workspace.load_failed_title')}
          description={$t('learningPath.workspace.load_failed_description')}
          variant="page"
        >
          <div class="mt-4 flex justify-center gap-2">
            <Button variant="outline" onclick={() => learningPathApi.refreshPath(data.publicId)}>
              {$t('common.refresh')}
            </Button>
            <Button href={`${$currentOrgPath}/paths`} variant="outline">
              {$t('learningPath.workspace.back_to_paths')}
            </Button>
          </div>
        </Empty>
      </div>
    {:else if !isPathReady}
      <div class="mx-auto flex h-[calc(100vh-56px)] w-full items-center justify-center p-6">
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
