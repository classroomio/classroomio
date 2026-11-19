<script lang="ts">
  import * as Block from '@cio/ui/custom/block';
  import type { BlockViewProps } from '../../utils/types';
  import { getHtmlBlockLabels } from './html-labels';

  let { block }: BlockViewProps<'html'> = $props();
</script>

<Block.Html
  html={block.data.html}
  name={block.data.name}
  width={block.data.width}
  height={block.data.height}
  labels={getHtmlBlockLabels()}
/>
