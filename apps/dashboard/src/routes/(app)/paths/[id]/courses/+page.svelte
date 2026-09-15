<script lang="ts">
  import * as Page from '@cio/ui/base/page';
  import { Button } from '@cio/ui/base/button';
  import { RefreshPageData } from '$features/ui';
  import { PathBuilder } from '$features/learning-path';
  import { learningPathApi } from '$features/learning-path/api';
  import { Spinner } from '@cio/ui/base/spinner';
  import { t } from '$lib/utils/functions/translations';

  let { data } = $props();

  let reorder = $state(false);
  let showAddDialog = $state(false);

  const activePath = $derived.by(() => {
    if (
      learningPathApi.currentPath &&
      (learningPathApi.currentPath.id === data.pathId || learningPathApi.currentPath.slug === data.pathId)
    ) {
      return learningPathApi.currentPath;
    }
    const found = learningPathApi.paths.find((p) => p.id === data.pathId || p.slug === data.pathId);
    if (found) return found;
    return data.path || null;
  });

  const basePath = $derived(activePath ? `/paths/${activePath.id}` : `/paths/${data.pathId}`);

  function handleRefresh() {
    if (data.pathId) {
      learningPathApi.getPath(data.pathId);
    }
  }
</script>

<Page.Root class="mx-auto flex w-[90%] px-4 md:max-w-2xl lg:max-w-3xl">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>
        {$t('learningPath.workspace.tabs.courses')}
      </Page.Title>
    </Page.HeaderContent>
    <Page.Action>
      <div class="flex w-full justify-end gap-2">
        <Button variant="outline" onclick={() => (reorder = !reorder)}>
          {$t(`course.navItem.lessons.add_lesson.${reorder ? 'end_reorder' : 'start_reorder'}`)}
        </Button>
        <Button onclick={() => (showAddDialog = true)}>
          {$t('learningPath.builder.add_course_button')}
        </Button>
        <RefreshPageData onRefresh={handleRefresh} />
      </div>
    </Page.Action>
  </Page.Header>

  <Page.Body>
    {#snippet child()}
      {#if activePath}
        <PathBuilder path={activePath} {basePath} bind:reorder bind:showAddDialog />
      {:else}
        <div class="flex h-64 items-center justify-center">
          <Spinner class="ui:text-primary size-6" />
        </div>
      {/if}
    {/snippet}
  </Page.Body>
</Page.Root>
