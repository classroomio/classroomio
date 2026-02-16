<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { Badge } from '@cio/ui/base/badge';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import * as Item from '@cio/ui/base/item';
  import * as Page from '@cio/ui/base/page';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { Empty } from '@cio/ui/custom/empty';
  import { Search } from '@cio/ui/custom/search';
  import * as Select from '@cio/ui/base/select';
  import * as Tabs from '@cio/ui/base/tabs';

  import DownloadIcon from '@lucide/svelte/icons/download';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import FileIcon from '@lucide/svelte/icons/file';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import FileVideoIcon from '@lucide/svelte/icons/file-video';
  import ImageIcon from '@lucide/svelte/icons/image';
  import Music2Icon from '@lucide/svelte/icons/music-2';
  import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
  import VideoIcon from '@lucide/svelte/icons/video';

  import type { Component } from 'svelte';
  import type { TAssetUpdate } from '@cio/utils/validation/assets';

  import { EditAssetDialog } from '$features/media-manager';
  import { formatBytes } from '$features/media-manager/utils';
  import { mediaManagerApi } from '$features/media-manager/api';
  import type { AssetUsageGraph, OrganizationAsset, OrganizationAssetUsage } from '$features/media-manager/utils';
  import { snackbar } from '$features/ui/snackbar/store';
  import { ActivityCard } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import Link2Icon from '@lucide/svelte/icons/link-2';

  let { data } = $props();

  type AssetKindFilter = 'all' | 'video' | 'document' | 'image' | 'audio' | 'other';
  type AssetStatusFilter = 'all' | 'active' | 'archived';

  let assets = $state<OrganizationAsset[]>([]);
  let storageSummary = $state<typeof data.storageSummary>(null);
  let pagination = $state<typeof data.pagination>(null);

  let search = $state('');
  let kind = $state<AssetKindFilter>('all');
  let status = $state<AssetStatusFilter>('all');
  let isRefreshing = $state(false);

  let editOpen = $state(false);
  let usageOpen = $state(false);
  let isSavingAsset = $state(false);
  let isUsageLoading = $state(false);
  let downloadingAssetId = $state<string | null>(null);

  let selectedAsset = $state<OrganizationAsset | null>(null);
  let usageData = $state<AssetUsageGraph | null>(null);

  const isUsageEmpty = $derived((usageData?.usages?.length ?? 0) === 0);

  const kindOptions: AssetKindFilter[] = ['all', 'video', 'document', 'image', 'audio', 'other'];
  const statusOptions: AssetStatusFilter[] = ['all', 'active', 'archived'];
  const storageCards = $derived([
    {
      icon: FileIcon,
      title: t.get('media_manager.storage.total_bytes'),
      percentage: formatBytes(storageSummary?.totalBytes ?? 0),
      description: t.get('media_manager.storage.total_bytes'),
      hidePercentage: true
    },
    {
      icon: FileVideoIcon,
      title: t.get('media_manager.storage.internal_bytes'),
      percentage: formatBytes(storageSummary?.internalBytes ?? 0),
      description: t.get('media_manager.storage.internal_bytes'),
      hidePercentage: true
    },
    {
      icon: Link2Icon,
      title: t.get('media_manager.storage.external_assets'),
      percentage: storageSummary?.externalAssetCount ?? 0,
      description: t.get('media_manager.storage.external_assets'),
      hidePercentage: true
    }
  ]);

  $effect(() => {
    assets = data.assets ?? [];
    storageSummary = data.storageSummary ?? null;
    pagination = data.pagination ?? null;
  });

  function getAssetDisplayName(asset: OrganizationAsset) {
    return asset.title?.trim() || asset.storageKey || asset.id;
  }

  function getKindIcon(kindValue: OrganizationAsset['kind']): Component {
    if (kindValue === 'video') return FileVideoIcon;
    if (kindValue === 'document') return FileTextIcon;
    if (kindValue === 'image') return ImageIcon;
    if (kindValue === 'audio') return Music2Icon;
    return FileIcon;
  }

  function getTargetTypeLabel(targetType: OrganizationAssetUsage['targetType']) {
    const keyMap: Record<string, string> = {
      lesson: 'media_manager.usage.target.lesson',
      exercise: 'media_manager.usage.target.exercise',
      question: 'media_manager.usage.target.question'
    };

    return t.get(keyMap[targetType] ?? 'media_manager.usage.target.unknown');
  }

  function formatUsageDate(value: string | null | undefined) {
    if (!value) {
      return t.get('media_manager.common.not_available');
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return t.get('media_manager.common.not_available');
    }

    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  async function refreshAssets(page = 1) {
    isRefreshing = true;
    try {
      await mediaManagerApi.listAssets({
        page,
        limit: pagination?.limit ?? 20,
        search: search.trim() || undefined,
        kind: kind === 'all' ? undefined : kind,
        status: status === 'all' ? undefined : status
      });

      assets = mediaManagerApi.assets;
      pagination = mediaManagerApi.pagination;
    } finally {
      isRefreshing = false;
    }
  }

  async function refreshStorageSummary() {
    await mediaManagerApi.getStorageSummary();
    if (mediaManagerApi.storageSummary) {
      storageSummary = mediaManagerApi.storageSummary;
    }
  }

  async function refreshMediaData() {
    await Promise.all([refreshAssets(1), refreshStorageSummary()]);
  }

  function openEditAsset(asset: OrganizationAsset) {
    selectedAsset = asset;
    editOpen = true;
  }

  async function saveAsset(fields: TAssetUpdate) {
    if (!selectedAsset) {
      return;
    }

    isSavingAsset = true;
    try {
      const updated = await mediaManagerApi.updateAsset(selectedAsset.id, fields);
      if (!updated) {
        return;
      }

      assets = assets.map((asset) => (asset.id === updated.id ? updated : asset));
      selectedAsset = updated;
      editOpen = false;
      snackbar.success('snackbar.media_manager.update_success');
      await refreshStorageSummary();
    } finally {
      isSavingAsset = false;
    }
  }

  function handleKindChange(value: string) {
    if (!kindOptions.includes(value as AssetKindFilter)) {
      return;
    }

    const nextKind = value as AssetKindFilter;
    kind = nextKind;
    void refreshAssets(1);
  }

  async function openUsage(asset: OrganizationAsset) {
    selectedAsset = asset;
    usageOpen = true;
    isUsageLoading = true;
    usageData = null;

    try {
      usageData = await mediaManagerApi.getAssetUsage(asset.id);
    } finally {
      isUsageLoading = false;
    }
  }

  function resetUsageModalState() {
    selectedAsset = null;
    usageData = null;
    isUsageLoading = false;
  }

  async function downloadAsset(asset: OrganizationAsset) {
    downloadingAssetId = asset.id;
    try {
      const url = await mediaManagerApi.getAssetDownloadUrl(asset);
      if (!url) {
        snackbar.error('snackbar.media_manager.download_failed');
        return;
      }

      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      downloadingAssetId = null;
    }
  }
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
      {#if storageSummary}
        <div class="flex w-full flex-wrap items-center justify-between gap-4">
          {#each storageCards as card}
            <ActivityCard activity={card} className="max-w-[300px]" />
          {/each}
        </div>
      {/if}

      <Page.BodyHeader class="items-center gap-3">
        <Tabs.Root bind:value={kind} class="min-w-0 flex-1" onValueChange={handleKindChange}>
          <Tabs.List class="grid h-auto w-full grid-cols-3 md:grid-cols-6">
            {#each kindOptions as option (option)}
              <Tabs.Trigger value={option}>
                {$t(`media_manager.filters.kind_options.${option}`)}
              </Tabs.Trigger>
            {/each}
          </Tabs.List>
        </Tabs.Root>

        <div class="flex flex-wrap items-center gap-2">
          <Search
            class="w-full sm:w-[220px]"
            placeholder={$t('media_manager.filters.search_placeholder')}
            bind:value={search}
          />
          <Select.Root type="single" bind:value={status}>
            <Select.Trigger class="min-w-[160px]">
              <p>{$t(`media_manager.filters.status_options.${status}`)}</p>
            </Select.Trigger>
            <Select.Content>
              {#each statusOptions as option (option)}
                <Select.Item value={option}>
                  {$t(`media_manager.filters.status_options.${option}`)}
                </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
          <Button onclick={() => refreshAssets(1)} loading={isRefreshing} disabled={isRefreshing}>
            {$t('media_manager.filters.apply')}
          </Button>
          <IconButton
            onclick={refreshMediaData}
            disabled={isRefreshing}
            aria-label={$t('media_manager.filters.refresh')}
            tooltip={$t('media_manager.filters.refresh')}
          >
            <RotateCcwIcon size={16} />
          </IconButton>
        </div>
      </Page.BodyHeader>

      {#if assets.length === 0}
        <Empty
          title={$t('media_manager.empty')}
          description={$t('media_manager.empty_description')}
          icon={VideoIcon}
          variant="page"
        />
      {:else}
        <Item.Group class="grid! w-full grid-cols-1 gap-4 md:grid-cols-3">
          {#each assets as asset (asset.id)}
            <Item.Root
              variant="outline"
              class="group relative cursor-pointer p-4!"
              onclick={() => openEditAsset(asset)}
              onkeydown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openEditAsset(asset);
                }
              }}
            >
              <Item.Header>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger
                    class="ui:data-[state=open]:opacity-100 absolute top-3 right-3 z-40 flex items-center justify-center opacity-0 transition-all delay-150 duration-200 ease-in-out group-hover:opacity-100"
                    onclick={(event) => event.stopPropagation()}
                  >
                    <Button variant="outline" size="icon">
                      <EllipsisVerticalIcon size={16} />
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content align="end" onclick={(event) => event.stopPropagation()}>
                    <DropdownMenu.Item onclick={() => openEditAsset(asset)}>
                      {$t('media_manager.actions.edit')}
                    </DropdownMenu.Item>
                    <DropdownMenu.Item onclick={() => openUsage(asset)}>
                      {$t('media_manager.actions.where_used')}
                    </DropdownMenu.Item>
                    <DropdownMenu.Item onclick={() => downloadAsset(asset)} disabled={downloadingAssetId === asset.id}>
                      <span class="flex items-center gap-2">
                        <DownloadIcon size={14} />
                        {$t('media_manager.actions.download')}
                      </span>
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>

                <div
                  class="ui:bg-muted/40 flex h-36 w-full items-center justify-center overflow-hidden rounded-md border"
                >
                  {#if asset.thumbnailUrl}
                    <img
                      src={asset.thumbnailUrl}
                      alt={$t('media_manager.form.thumbnail_alt')}
                      class="h-full w-full object-cover"
                    />
                  {:else}
                    {@const KindIcon = getKindIcon(asset.kind)}
                    <div class="ui:text-muted-foreground flex flex-col items-center gap-2">
                      <KindIcon class="size-8" />
                      <p class="text-xs">{$t(`media_manager.kind.${asset.kind}`)}</p>
                    </div>
                  {/if}
                </div>
              </Item.Header>

              <Item.Content>
                <div class="min-w-0 flex-1">
                  <Item.Title class="line-clamp-1 w-full!">
                    <span class="max-w-64 truncate text-base! break-all">{getAssetDisplayName(asset)}</span>
                  </Item.Title>
                </div>

                <div class="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline">{$t(`media_manager.kind.${asset.kind}`)}</Badge>
                  <Badge variant="outline">{$t(`media_manager.provider.${asset.provider}`)}</Badge>
                  <Badge variant="outline">
                    {$t(`media_manager.status.${asset.status}`)}
                  </Badge>
                </div>

                <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p class="ui:text-muted-foreground text-xs uppercase">{$t('media_manager.table.size')}</p>
                    <p class="font-medium">{formatBytes(asset.byteSize)}</p>
                  </div>
                  <div>
                    <p class="ui:text-muted-foreground text-xs uppercase">{$t('media_manager.table.updated_at')}</p>
                    <p class="font-medium">{formatUsageDate(asset.updatedAt)}</p>
                  </div>
                </div>
              </Item.Content>
            </Item.Root>
          {/each}
        </Item.Group>
      {/if}

      {#if pagination && pagination.totalPages > 1}
        <div class="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isRefreshing || pagination.page <= 1}
            onclick={() => refreshAssets(pagination.page - 1)}
          >
            {$t('media_manager.pagination.previous')}
          </Button>
          <p class="ui:text-muted-foreground text-sm">
            {$t('media_manager.pagination.page')}
            {pagination.page}
            / {pagination.totalPages}
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={isRefreshing || pagination.page >= pagination.totalPages}
            onclick={() => refreshAssets(pagination.page + 1)}
          >
            {$t('media_manager.pagination.next')}
          </Button>
        </div>
      {/if}
    {/snippet}
  </Page.Body>
</Page.Root>

<EditAssetDialog bind:open={editOpen} asset={selectedAsset} isSaving={isSavingAsset} onSave={saveAsset} />

<Dialog.Root
  bind:open={usageOpen}
  onOpenChange={(isOpen) => {
    if (!isOpen) {
      resetUsageModalState();
    }
  }}
>
  <Dialog.Content class="w-[95%] max-w-4xl">
    <Dialog.Header>
      <Dialog.Title>{$t('media_manager.usage.title')}</Dialog.Title>
      <Dialog.Description>
        {$t('media_manager.usage.description')}
        {#if selectedAsset}
          <span class="font-medium">{getAssetDisplayName(selectedAsset)}</span>
        {/if}
      </Dialog.Description>
    </Dialog.Header>

    {#if selectedAsset}
      <Item.Root variant="outline" class="mb-4 p-3!">
        <Item.Content>
          <div class="flex gap-3">
            <div
              class="ui:bg-muted/40 flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded border"
            >
              {#if selectedAsset.thumbnailUrl}
                <img
                  src={selectedAsset.thumbnailUrl}
                  alt={$t('media_manager.form.thumbnail_alt')}
                  class="h-full w-full object-cover"
                />
              {:else}
                {@const KindIcon = getKindIcon(selectedAsset.kind)}
                <KindIcon class="ui:text-muted-foreground size-7" />
              {/if}
            </div>

            <div class="min-w-0 flex-1">
              <Item.Title class="line-clamp-1">{getAssetDisplayName(selectedAsset)}</Item.Title>
              <div class="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline">{$t(`media_manager.kind.${selectedAsset.kind}`)}</Badge>
                <Badge variant="outline">{$t(`media_manager.provider.${selectedAsset.provider}`)}</Badge>
                <Badge variant="outline">{$t(`media_manager.status.${selectedAsset.status}`)}</Badge>
              </div>

              <div class="mt-2 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p class="ui:text-muted-foreground text-xs uppercase">{$t('media_manager.table.size')}</p>
                  <p class="font-medium">{formatBytes(selectedAsset.byteSize)}</p>
                </div>
                <div>
                  <p class="ui:text-muted-foreground text-xs uppercase">{$t('media_manager.table.updated_at')}</p>
                  <p class="font-medium">{formatUsageDate(selectedAsset.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </Item.Content>
      </Item.Root>
    {/if}

    {#if isUsageLoading}
      <p class="ui:text-muted-foreground text-sm">{$t('media_manager.usage.loading')}</p>
    {:else if isUsageEmpty}
      <p class="ui:text-muted-foreground text-sm">{$t('media_manager.usage.empty')}</p>
    {:else if usageData}
      <p class="ui:text-muted-foreground mb-3 text-sm">
        {$t('media_manager.usage.total')}
        {usageData.usageCount}
      </p>
      <div class="max-h-[420px] overflow-auto rounded-lg border">
        <div class="divide-y">
          {#each usageData.usages as usage (usage.id)}
            <div class="grid grid-cols-1 gap-2 p-3 text-sm md:grid-cols-5 md:items-center md:gap-4">
              <div>
                <p class="ui:text-muted-foreground text-xs">{$t('media_manager.usage.table.target_type')}</p>
                <p>{getTargetTypeLabel(usage.targetType)}</p>
              </div>
              <div>
                <p class="ui:text-muted-foreground text-xs">{$t('media_manager.usage.table.target_id')}</p>
                <p class="font-mono text-xs">{usage.targetId}</p>
              </div>
              <div>
                <p class="ui:text-muted-foreground text-xs">{$t('media_manager.usage.table.slot')}</p>
                <p>{usage.slotType}{usage.slotKey ? ` (${usage.slotKey})` : ''}</p>
              </div>
              <div>
                <p class="ui:text-muted-foreground text-xs">{$t('media_manager.usage.table.position')}</p>
                <p>{usage.position ?? t.get('media_manager.common.not_available')}</p>
              </div>
              <div>
                <p class="ui:text-muted-foreground text-xs">{$t('media_manager.usage.table.added')}</p>
                <p>{formatUsageDate(usage.createdAt)}</p>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </Dialog.Content>
</Dialog.Root>
