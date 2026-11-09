<script lang="ts">
  import * as Block from '@cio/ui/custom/block';
  import { SafeHtmlContent } from '@cio/ui/custom/safe-html-content';
  import HTMLRender from '$features/ui/html-render.svelte';
  import type { BlockViewProps } from '../../utils/types';

  let { block }: BlockViewProps<'note'> = $props();
</script>

<Block.Note editable={false} contentHtml={block.content}>
  {#snippet view()}
    <HTMLRender>
      <SafeHtmlContent content={block.content} />
    </HTMLRender>
  {/snippet}
</Block.Note>
