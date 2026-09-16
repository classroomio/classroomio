<script lang="ts">
  import { PathsListing, CreatePathButton } from '$features/learning-path';
  import { learningPathApi } from '$features/learning-path/api';
  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';

  let { data } = $props();

  $effect.pre(() => {
    if (data.orgId && learningPathApi.currentOrgId !== data.orgId) {
      learningPathApi.setOrg(data.orgId, data.paths);
    }
  });
</script>

<svelte:head>
  <title>{$t('learningPath.listing.title')} - ClassroomIO</title>
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
      <PathsListing initialPaths={data.paths} />
    {/snippet}
  </Page.Body>
</Page.Root>
