<script lang="ts">
  import { PathsListing, CreatePathButton } from '$features/learning-path';
  import { learningPathApi } from '$features/learning-path/api';
  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';

  let { data } = $props();

  $effect.pre(() => {
    if (data.paths && data.paths.length > 0 && learningPathApi.paths.length === 0) {
      learningPathApi.paths = [...data.paths];
      learningPathApi.recomputeMetrics();
    }
  });

  const basePath = $derived(`/org/${data.orgSlug}/paths`);
</script>

<svelte:head>
  <title>Learning Paths - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('learningPath.listing.title')}</Page.Title>
      <Page.Subtitle>{$t('learningPath.listing.subtitle')}</Page.Subtitle>
    </Page.HeaderContent>
    <Page.Action>
      <CreatePathButton isResponsive />
    </Page.Action>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <PathsListing {basePath} initialPaths={data.paths} />
    {/snippet}
  </Page.Body>
</Page.Root>
