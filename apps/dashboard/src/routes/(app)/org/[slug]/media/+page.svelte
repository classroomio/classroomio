<script lang="ts">
  import * as Page from '@cio/ui/base/page';
  import { MediaPage } from '$features/media';
  import { mediaApi } from '$features/media/api';
  import { t } from '$lib/utils/functions/translations';
  import { onMount } from 'svelte';

  let { data } = $props();

  onMount(() => {
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
  </Page.Header>

  <Page.Body class="space-y-4">
    {#snippet child()}
      <MediaPage />
    {/snippet}
  </Page.Body>
</Page.Root>
