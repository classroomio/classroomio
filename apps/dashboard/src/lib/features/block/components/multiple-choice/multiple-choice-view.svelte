<script lang="ts">
  import * as Block from '@cio/ui/custom/block';
  import type { BlockViewProps } from '../../utils/types';
  import { getMultipleChoiceLabels } from './multiple-choice-labels';

  let { block }: BlockViewProps<'multiple_choice'> = $props();
</script>

<Block.MultipleChoice
  question={block.data.question}
  options={block.data.options}
  correctOptionId={block.data.correctOptionId}
  imageUrl={block.data.imageUrl}
  labels={getMultipleChoiceLabels()}
  testId="block-multiple-choice"
/>
