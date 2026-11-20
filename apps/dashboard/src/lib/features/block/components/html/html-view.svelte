<script lang="ts">
  import * as Block from '@cio/ui/custom/block';
  import type { BlockViewProps } from '../../utils/types';
  import { getHtmlBlockLabels } from './html-labels';
  import { getHtmlContentUrl } from './html-utils';

  let { block }: BlockViewProps<'html'> = $props();
</script>

<Block.Html
  src={getHtmlContentUrl(block.data)}
  name={block.data.name}
  width={block.data.width}
  height={block.data.height}
  labels={getHtmlBlockLabels()}
/>
