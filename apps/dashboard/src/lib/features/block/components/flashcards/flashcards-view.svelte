<script lang="ts">
  import * as Block from '@cio/ui/custom/block';
  import type { BlockViewProps } from '../../utils/types';
  import { getFlashcardsLabels } from './flashcards-labels';

  let { block }: BlockViewProps<'flashcards'> = $props();
</script>

<Block.Flashcards cards={block.data.cards} labels={getFlashcardsLabels()} testId="block-flashcards" />
