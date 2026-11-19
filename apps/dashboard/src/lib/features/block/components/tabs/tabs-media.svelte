<script lang="ts">
  import * as Block from '@cio/ui/custom/block';
  import type { TTabMedia, TVideoBlockData } from '@cio/utils/validation/block';
  import { findBlockViewHost } from '../../utils/block-host';
  import type { BlockViewModel } from '../../utils/types';

  interface Props {
    media: TTabMedia | undefined;
    blockId: string;
    tabId: string;
    index: number;
  }

  let { media, blockId, tabId, index }: Props = $props();

  const host = findBlockViewHost();

  function videoModel(data: TVideoBlockData): BlockViewModel<'video'> {
    return { id: `${blockId}-${tabId}`, type: 'video', data, content: '' };
  }
</script>

{#if media?.kind === 'image'}
  <div class="flex flex-col gap-2" data-testid="block-tabs-media-image">
    <Block.Image url={media.data.url} alt={media.data.alt ?? ''} fit={media.data.fit ?? 'cover'} />
  </div>
{:else if media?.kind === 'video' && host}
  <div class="flex flex-col gap-2" data-testid="block-tabs-media-video">
    {@render host.videoPlayer({ block: videoModel(media.data), index })}
  </div>
{/if}
