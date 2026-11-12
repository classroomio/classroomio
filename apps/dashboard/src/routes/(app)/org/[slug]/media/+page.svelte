<script lang="ts">
  import * as Page from '@cio/ui/base/page';
  import { MediaPage, UploadMediaActions } from '$features/media';
  import { mediaApi } from '$features/media/api';
  import { t } from '$lib/utils/functions/translations';

  let { data } = $props();

  let mediaPage = $state<ReturnType<typeof MediaPage>>();

  $effect(() => {
    mediaApi.assets = data.assets ?? [];
    mediaApi.storageSummary = data.storageSummary ?? null;
    mediaApi.pagination = data.pagination ?? null;
  });
</script>

<svelte:head>
  <title>{$t('media_manager.page_title')}</title>
</svelte:head>

<Page.Root class="w-full">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('media_manager.heading')}</Page.Title>
      <Page.Subtitle>{$t('media_manager.page_subtitle')}</Page.Subtitle>
    </Page.HeaderContent>
    <Page.Action>
      <UploadMediaActions onUploaded={() => mediaPage?.refreshMediaData()} />
    </Page.Action>
  </Page.Header>

  <Page.Body class="space-y-4">
    {#snippet child()}
      <MediaPage bind:this={mediaPage} />
    {/snippet}
  </Page.Body>
</Page.Root>
