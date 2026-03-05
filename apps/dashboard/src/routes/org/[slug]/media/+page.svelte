<script lang="ts">
  import * as Page from '@cio/ui/base/page';
  import { MediaPage } from '$features/media';
  import { mediaApi } from '$features/media/api';
  import type { AssetKindFilter, AssetStatusFilter } from '$features/media/utils';
  import { t } from '$lib/utils/functions/translations';
  import { onMount } from 'svelte';

  let { data } = $props();

  let search = $state('');
  let kind = $state<AssetKindFilter>('all');
  let status = $state<AssetStatusFilter>('all');

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
    </Page.HeaderContent>
  </Page.Header>

  <Page.Body class="space-y-4">
    {#snippet child()}
      <MediaPage bind:search bind:kind bind:status />
    {/snippet}
  </Page.Body>
</Page.Root>
