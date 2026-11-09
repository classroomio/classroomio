<script lang="ts">
  import * as Block from '@cio/ui/custom/block';
  import { SafeHtmlContent } from '@cio/ui/custom/safe-html-content';
  import HTMLRender from '$features/ui/html-render.svelte';
  import { isHtmlValueEmpty } from '$lib/utils/functions/toHtml';
  import { t } from '$lib/utils/functions/translations';
  import type { BlockViewProps } from '../../utils/types';

  let { block }: BlockViewProps<'note'> = $props();
</script>

<Block.Note
  editable={false}
  contentHtml={block.content}
  empty={isHtmlValueEmpty(block.content)}
  emptyLabel={$t('course.navItem.lessons.materials.blocks.empty_note')}
>
  {#snippet view()}
    <HTMLRender>
      <SafeHtmlContent content={block.content} />
    </HTMLRender>
  {/snippet}
</Block.Note>
