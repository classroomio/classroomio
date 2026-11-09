<script lang="ts">
  import { getBlockViewHost } from '../../utils/block-host';
  import type { BlockViewProps } from '../../utils/types';

  let { block, index }: BlockViewProps<'video'> = $props();

  const host = getBlockViewHost();
</script>

{@render host.videoPlayer({ block, index })}
