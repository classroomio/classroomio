<script lang="ts">
  import * as Block from '@cio/ui/custom/block';
  import type { BlockViewProps } from '../../utils/types';

  let { block }: BlockViewProps<'image'> = $props();
</script>

<Block.Image url={block.data.url} alt={block.data.alt ?? ''} fit={block.data.fit ?? 'cover'} editable={false} />
