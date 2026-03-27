<script lang="ts">
  import type { ExerciseQuestionRendererProps } from '@cio/question-types';
  import { getOptionImageUrl, hasOptionImages } from '../option-image-utils';
  import McqPreviewOptionRow from '../shared/mcq-preview-option-row.svelte';

  let { question, labels }: ExerciseQuestionRendererProps = $props();

  const optionsHaveImages = $derived(hasOptionImages(question.options));
</script>

<div class="ui:space-y-2">
  <ul class={optionsHaveImages ? 'ui:grid ui:grid-cols-2 ui:gap-3' : 'ui:space-y-1'}>
    {#each question.options ?? [] as option, index}
      <McqPreviewOptionRow {option} {index} optionImageUrl={getOptionImageUrl(option)} {optionsHaveImages} {labels} />
    {/each}
  </ul>
</div>
