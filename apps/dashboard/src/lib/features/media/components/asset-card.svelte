<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import * as Item from '@cio/ui/base/item';
  import { IconButton } from '@cio/ui/custom/icon-button';

  import DownloadIcon from '@lucide/svelte/icons/download';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';

  import { t } from '$lib/utils/functions/translations';
  import {
    formatBytes,
    formatUsageDate,
    getAssetDisplayName,
    getKindIcon,
    type OrganizationAsset
  } from '$features/media/utils';

  interface Props {
    asset: OrganizationAsset;
    downloadingAssetId?: string | null;
    onEdit?: (asset: OrganizationAsset) => void;
    onUsage?: (asset: OrganizationAsset) => void;
    onDownload?: (asset: OrganizationAsset) => void;
  }

  let {
    asset,
    downloadingAssetId = null,
    onEdit = () => {},
    onUsage = () => {},
    onDownload = () => {}
  }: Props = $props();
</script>

<Item.Root
  variant="outline"
  class="group relative max-w-[300px] cursor-pointer p-4!"
  onclick={() => onEdit(asset)}
  onkeydown={(event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onEdit(asset);
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
        <DropdownMenu.Item onclick={() => onEdit(asset)}>
          {$t('media_manager.actions.edit')}
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => onUsage(asset)}>
          {$t('media_manager.actions.where_used')}
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => onDownload(asset)} disabled={downloadingAssetId === asset.id}>
          <span class="flex items-center gap-2">
            <DownloadIcon size={14} />
            {$t('media_manager.actions.download')}
          </span>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>

    <div class="ui:bg-muted/40 flex h-36 w-full items-center justify-center overflow-hidden rounded-md border">
      {#if asset.thumbnailUrl}
        <img src={asset.thumbnailUrl} alt={$t('media_manager.form.thumbnail_alt')} class="h-full w-full object-cover" />
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
      <Badge variant="outline">{$t(`media_manager.status.${asset.status}`)}</Badge>
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
