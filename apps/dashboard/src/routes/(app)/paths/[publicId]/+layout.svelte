<script lang="ts">
  import type { Snippet } from 'svelte';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import { Spinner } from '@cio/ui/base/spinner';
  import { PathSidebar, PathHeader } from '$features/learning-path';
  import { learningPathApi, pathMembersApi } from '$features/learning-path/api';
  import type { LearningPathDetail } from '$features/learning-path/utils/types';
  import { DeleteModal } from '$features/ui';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrgPath, isOrgAdmin } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { ROLE } from '@cio/utils/constants';

  interface Props {
    children?: Snippet;
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
  let viewerFetchKey: string | null = $state(null);

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

  $effect(() => {
    const pathId = activePath?.id;
    const profileId = $profile.id;
    if (!isPathReady || !pathId || !profileId) return;

    const key = `${pathId}:${profileId}`;
    if (viewerFetchKey === key) return;

    viewerFetchKey = key;
    void pathMembersApi.fetchViewerRole(pathId, profileId);
  });

  const currentUserRole = $derived.by(() => {
    if (pathMembersApi.viewerRole !== undefined) return pathMembersApi.viewerRole;

    const member = pathMembersApi.members.find((item) => item.profileId === $profile.id);
    return member ? Number(member.roleId) : null;
  });

  const canCheck = $derived(!!$profile.id && isPathReady);

  const isPermitted = $derived.by(() => {
    if (!isPathReady) return false;
    if (!canCheck) return true;

    if ($isOrgAdmin === null) return true;

    if ($isOrgAdmin) return true;

    if (pathMembersApi.viewerRole === undefined) return true;

    return currentUserRole === ROLE.ADMIN || currentUserRole === ROLE.TUTOR;
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

{#if isPathReady}
  <Dialog.Root open={!isPermitted}>
    <Dialog.Content class="w-96">
      <Dialog.Header>
        <Dialog.Title>{$t('course.not_permitted.header')}</Dialog.Title>
      </Dialog.Header>
      <div>
        <p class="text-md text-center dark:text-white">
          {$t('course.not_permitted.body')}
        </p>

        <div class="mt-5 flex justify-center">
          <Button
            onclick={() => {
              goto(`${$currentOrgPath}/paths`);
            }}
          >
            {$t('course.not_permitted.button')}
          </Button>
        </div>
      </div>
    </Dialog.Content>
  </Dialog.Root>
{/if}

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
