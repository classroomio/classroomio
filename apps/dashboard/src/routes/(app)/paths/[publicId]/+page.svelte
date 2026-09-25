<script lang="ts">
  import { onMount } from 'svelte';
  import { replaceState } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import * as Page from '@cio/ui/base/page';
  import { Button } from '@cio/ui/base/button';
  import { RefreshPageData } from '$features/ui';
  import { PathBuilder } from '$features/learning-path';
  import { learningPathApi, pathCoursesApi } from '$features/learning-path/api';
  import { t } from '$lib/utils/functions/translations';

  let { data } = $props();

  let reorder = $state(page.url.searchParams.get('reorder') === 'true');
  let showAddDialog = $state(false);

  onMount(() => {
    if (page.url.searchParams.has('reorder')) {
      const url = new URL(page.url);
      url.searchParams.delete('reorder');
      replaceState(resolve(`${url.pathname}${url.search}`, {}), page.state);
    }
  });

  const activePath = $derived(learningPathApi.currentPath);

  function handleRefresh() {
    if (data.publicId) {
      learningPathApi.refreshPath(data.publicId);
    }
  }

  async function handleToggleReorder() {
    if (reorder && activePath && activePath.courses && activePath.courses.length > 0) {
      await pathCoursesApi.reorderCourses(
        activePath.id,
        activePath.courses.map((c) => c.courseId)
      );
    }
    reorder = !reorder;
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
        <Button variant="outline" onclick={handleToggleReorder}>
          {$t(`learningPath.builder.${reorder ? 'end_reorder' : 'start_reorder'}`)}
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
        <PathBuilder path={activePath} bind:reorder bind:showAddDialog />
      {/if}
    {/snippet}
  </Page.Body>
</Page.Root>
