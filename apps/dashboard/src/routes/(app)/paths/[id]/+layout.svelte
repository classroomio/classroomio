<script lang="ts">
  import type { Snippet } from 'svelte';
  import { page } from '$app/state';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { Separator } from '@cio/ui/base/separator';
  import { Empty } from '@cio/ui/custom/empty';
  import { Spinner } from '@cio/ui/base/spinner';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';
  import { learningPathApi } from '$features/learning-path/api/learning-path.svelte';
  import LearningPathSidebar from '$features/learning-path/components/learning-path-sidebar.svelte';
  import { LEARNING_PATH_STATUS_KEYS } from '$features/learning-path/utils/learning-path-utils';

  interface Props {
    children?: Snippet;
    data: { pathId: string };
  }

  let { children, data }: Props = $props();

  let loadedKey = '';

  $effect(() => {
    const organizationId = $currentOrg.id;
    const pathId = data.pathId;
    const key = `${organizationId}:${pathId}`;
    if (!organizationId || !pathId || key === loadedKey) return;

    loadedKey = key;
    learningPathApi.resetWorkspace();
    void learningPathApi.loadPath(pathId);
  });

  const isReady = $derived(learningPathApi.path?.id === data.pathId);
</script>

<svelte:head>
  <title>{learningPathApi.path?.name || $t('learning_paths.heading')} - ClassroomIO</title>
</svelte:head>

<Sidebar.Provider data-sveltekit-preload-data="off">
  <LearningPathSidebar path={page.url.pathname} id={data.pathId} />

  <Sidebar.Inset
    class="w-[calc(100vw-var(--sidebar-width))] group-data-[collapsible=icon]:w-[calc(100vw-var(--sidebar-width-icon))]"
  >
    <header
      class="ui:border-border ui:bg-background ui:z-app-bar sticky top-0 flex h-12 w-full shrink-0 items-center gap-2 border-b px-4"
    >
      <Sidebar.Trigger />
      <div class="h-4 w-2">
        <Separator orientation="vertical" />
      </div>
      <p class="max-w-md truncate text-sm font-medium">{learningPathApi.path?.name ?? ''}</p>
      {#if learningPathApi.path}
        <span class="ui:text-muted-foreground text-sm">
          {$t(LEARNING_PATH_STATUS_KEYS[learningPathApi.path.status])}
        </span>
      {/if}
    </header>

    {#if !isReady}
      <div class="mx-auto flex h-[calc(100vh-56px)] w-full items-center justify-center">
        <Empty
          title={$t('learning_paths.loading_title')}
          description={$t('learning_paths.loading_description')}
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
