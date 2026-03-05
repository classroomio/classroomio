<script lang="ts">
  import FileIcon from '@lucide/svelte/icons/file';
  import FileVideoIcon from '@lucide/svelte/icons/file-video';
  import Link2Icon from '@lucide/svelte/icons/link-2';

  import { ActivityCard } from '$features/ui';
  import { formatBytes } from '$features/media/utils';
  import type { AssetStorageSummary } from '$features/media/utils';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    storageSummary: AssetStorageSummary | null;
  }

  let { storageSummary }: Props = $props();

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
</script>

{#if storageSummary}
  <div class="flex w-full flex-wrap items-center justify-between gap-4">
    {#each storageCards as card}
      <ActivityCard activity={card} className="max-w-[300px]" />
    {/each}
  </div>
{/if}
