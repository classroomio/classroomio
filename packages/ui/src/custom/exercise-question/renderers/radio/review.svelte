<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import OptionImage from '../option-image.svelte';
  import { getOptionImageUrl, hasOptionImages } from '../option-image-utils';
  import { getMcqReviewRowBorderClass, getOptionNumericId } from '../option-review-utils';
  import OptionCorrectnessBadges from '../shared/option-correctness-badges.svelte';
  import { cn } from '../../../../tools';

  let { question, answer = null, labels }: ExerciseQuestionRendererProps = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  const selectedOptionId = $derived.by(() => {
    if (answer?.type !== 'RADIO') return null;
    return answer.optionId;
  });

  const optionsHaveImages = $derived(hasOptionImages(question.options));
</script>

<div class="ui:space-y-2">
  <div class={optionsHaveImages ? 'ui:grid ui:grid-cols-2 ui:gap-3' : 'ui:space-y-2'}>
    {#each question.options ?? [] as option, index}
      {@const optionImageUrl = getOptionImageUrl(option)}
      {@const oid = getOptionNumericId(option)}
      {@const isSelected = oid !== null && selectedOptionId !== null && selectedOptionId === oid}
      {@const isCorrect = option.isCorrect === true}

      <div
        class={cn(
          'ui:rounded-md ui:border ui:p-2',
          optionsHaveImages ? 'ui:space-y-2' : 'ui:flex ui:items-center ui:gap-2',
          getMcqReviewRowBorderClass(isSelected, isCorrect)
        )}
      >
        <OptionImage
          src={optionImageUrl}
          alt={label('question.edit.image_alt')}
          variant="take"
          hasAnyImageInOptions={optionsHaveImages}
        />

        <div class="ui:flex ui:min-w-0 ui:flex-1 ui:items-center ui:gap-2">
          <span
            class="ui:inline-flex ui:h-4 ui:w-4 ui:shrink-0 ui:rounded-full ui:border ui:border-muted-foreground"
            aria-hidden="true"
            style={`box-shadow: inset 0 0 0 3px ${isSelected ? 'var(--foreground)' : 'transparent'}`}
          ></span>
          <div class="ui:text-sm ui:font-normal">
            {option.label ||
              option.value ||
              [label('common.option_prefix'), String(index + 1)].filter(Boolean).join(' ')}
            <OptionCorrectnessBadges {labels} showCorrect={isCorrect} showIncorrect={isSelected && !isCorrect} />
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
