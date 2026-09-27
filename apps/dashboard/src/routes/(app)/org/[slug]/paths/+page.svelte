<script lang="ts">
  import { PathsListing, CreatePathButton } from '$features/learning-path';
  import { learningPathApi } from '$features/learning-path/api';
  import * as Page from '@cio/ui/base/page';
  import * as Alert from '@cio/ui/base/alert';
  import { t } from '$lib/utils/functions/translations';

  let { data } = $props();

  $effect(() => {
    if (data.paths) {
      learningPathApi.paths = data.paths;
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
      {#if data.loadError}
        <Alert.Callout
          variant="destructive"
          title={$t('learningPath.listing.load_error_title')}
          description={data.loadError}
          class="mb-6"
        />
      {:else}
        <PathsListing loadError={data.loadError} />
      {/if}
    {/snippet}
  </Page.Body>
</Page.Root>
