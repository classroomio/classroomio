<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import { Checkbox } from '../../../../base/checkbox';
  import { Label } from '../../../../base/label';
  import OptionImage from '../option-image.svelte';
  import { getOptionImageUrl, hasOptionImages } from '../option-image-utils';
  import { getMcqReviewRowBorderClass, getOptionNumericId } from '../option-review-utils';
  import OptionCorrectnessBadges from '../shared/option-correctness-badges.svelte';
  import { cn } from '../../../../tools';

  let { question, answer = null, labels }: ExerciseQuestionRendererProps = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  const selectedIds = $derived.by(() => {
    if (answer?.type !== 'CHECKBOX') return [] as number[];
    return answer.optionIds;
  });

  const optionsHaveImages = $derived(hasOptionImages(question.options));
</script>

<div class="ui:space-y-2">
  <div class={optionsHaveImages ? 'ui:grid ui:grid-cols-2 ui:gap-3' : 'ui:space-y-2'}>
    {#each question.options ?? [] as option, index}
      {@const optionId = `checkbox-review-${question.id ?? 'q'}-${index}`}
      {@const optionImageUrl = getOptionImageUrl(option)}
      {@const oid = getOptionNumericId(option)}
      {@const isSelected = oid !== null && selectedIds.includes(oid)}
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

        <div class="ui:flex ui:items-center ui:gap-2">
          <Checkbox id={optionId} checked={isSelected} disabled={true} />
          <Label class="ui:cursor-default ui:font-normal ui:w-full" for={optionId}>
            {option.label ||
              option.value ||
              [label('common.option_prefix'), String(index + 1)].filter(Boolean).join(' ')}
            <OptionCorrectnessBadges {labels} showCorrect={isCorrect} showIncorrect={isSelected && !isCorrect} />
          </Label>
        </div>
      </div>
    {/each}
  </div>
</div>
