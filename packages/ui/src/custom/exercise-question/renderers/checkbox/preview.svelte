<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import OptionImage from '../option-image.svelte';
  import { getOptionImageUrl, hasOptionImages } from '../option-image-utils';
  import { cn } from '../../../../tools';

  let { question, labels }: ExerciseQuestionRendererProps = $props();
  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  const optionsHaveImages = $derived(hasOptionImages(question.options));
</script>

<div class="ui:space-y-2">
  <ul class={optionsHaveImages ? 'ui:grid ui:grid-cols-2 ui:gap-3' : 'ui:space-y-1'}>
    {#each question.options ?? [] as option, index}
      {@const optionImageUrl = getOptionImageUrl(option)}
      <li class={cn(optionsHaveImages && 'ui:space-y-2 ui:rounded-md ui:p-2', 'ui:text-sm')}>
        <OptionImage
          src={optionImageUrl}
          alt={label('question.edit.image_alt')}
          variant="preview"
          hasAnyImageInOptions={optionsHaveImages}
        />

        <div>
          {option.label || option.value || [label('common.option_prefix'), String(index + 1)].filter(Boolean).join(' ')}
          {#if option.isCorrect}
            <span class="ui:ml-2 ui:text-xs ui:text-green-600">{label('common.correct_badge')}</span>
          {/if}
        </div>
      </li>
    {/each}
  </ul>
</div>
