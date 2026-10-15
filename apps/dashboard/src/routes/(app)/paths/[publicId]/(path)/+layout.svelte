<script lang="ts">
  import type { Snippet } from 'svelte';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { Empty } from '@cio/ui/custom/empty';
  import { Spinner } from '@cio/ui/base/spinner';
  import { PathSidebar, PathHeader } from '$features/learning-path';
  import { learningPathApi } from '$features/learning-path/api';
  import { getPathViewContext } from '$features/learning-path/utils/path-view-context';
  import { getPathHubRoute } from '$features/learning-path/utils/routes';
  import { DeleteModal } from '$features/ui';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrgPath } from '$lib/utils/store/org';

  interface Props {
    children?: Snippet;
    data: {
      publicId: string;
    };
  }

  let { data, children }: Props = $props();

  const viewContext = getPathViewContext();
  const mode = $derived(viewContext.getMode());

  let sidebarWidth = $state(256);
  let hasLoadedSidebarWidth = $state(false);
  let sidebarProviderElement = $state<HTMLDivElement | null>(null);

  let deleteModalOpen = $state(false);
  let isDeleting = $state(false);

  // Learners only get the hub: send any staff sub-route back to `/paths/[publicId]`.
  $effect(() => {
    if (mode !== 'learner') return;

    const hub = getPathHubRoute(data.publicId);
    if (page.url.pathname !== hub) {
      void goto(hub, { replaceState: true });
    }
  });

  const activePath = $derived(learningPathApi.currentPath);
  const isPathReady = $derived(mode === 'staff' && !!activePath);

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
      snackbar.error('learningPath.snackbar.delete_failed');
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

{#if mode === 'learner'}
  {@render children?.()}
{:else}
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

      {#if !isPathReady}
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
{/if}
