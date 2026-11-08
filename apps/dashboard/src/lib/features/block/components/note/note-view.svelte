<script lang="ts">
  import * as Block from '@cio/ui/custom/block';
  import { SafeHtmlContent } from '@cio/ui/custom/safe-html-content';
  import HTMLRender from '$features/ui/html-render.svelte';
  import { isHtmlValueEmpty } from '$lib/utils/functions/toHtml';
  import { t } from '$lib/utils/functions/translations';
  import { noteStyleLabelKey } from './note-styles';
  import type { BlockViewProps } from '../../utils/types';

  let { block }: BlockViewProps<'note'> = $props();

  const style = $derived(block.data.style ?? 'default');
</script>

<Block.Note
  {style}
  editable={false}
  contentHtml={block.content}
  empty={isHtmlValueEmpty(block.content)}
  styleLabel={$t(noteStyleLabelKey(style))}
  emptyLabel={$t('course.navItem.lessons.materials.blocks.empty_note')}
>
  {#snippet view()}
    <HTMLRender>
      <SafeHtmlContent content={block.content} />
    </HTMLRender>
  {/snippet}
</Block.Note>
