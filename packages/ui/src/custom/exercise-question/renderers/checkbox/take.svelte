<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import { Checkbox } from '../../../../base/checkbox';
  import { Label } from '../../../../base/label';
  import OptionImage from '../option-image.svelte';
  import { getOptionImageUrl, hasOptionImages } from '../option-image-utils';
  import { cn } from '../../../../tools';

  let {
    question,
    answer = [],
    disabled = false,
    labels,
    onAnswerChange = () => {}
  }: ExerciseQuestionRendererProps = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  function getOptionValue(option: { id?: number | string; value?: string; label?: string }, index: number): string {
    return String(option.id ?? option.value ?? option.label ?? index);
  }

  const selectedOptionValues = $derived.by(() => {
    if (Array.isArray(answer)) {
      return new Set(answer.map((entry) => String(entry)));
    }

    if (answer === undefined || answer === null || answer === '') {
      return new Set<string>();
    }

    return new Set([String(answer)]);
  });

  const optionsHaveImages = $derived(hasOptionImages(question.options));

  function isOptionSelected(option: { id?: number | string; value?: string; label?: string }, index: number): boolean {
    return selectedOptionValues.has(getOptionValue(option, index));
  }

  function toggleOption(nextValue: string) {
    const nextSelectedValues = new Set(selectedOptionValues);

    if (nextSelectedValues.has(nextValue)) {
      nextSelectedValues.delete(nextValue);
    } else {
      nextSelectedValues.add(nextValue);
    }

    onAnswerChange(Array.from(nextSelectedValues));
  }
</script>

<div class="ui:space-y-2">
  <div class={optionsHaveImages ? 'ui:grid ui:grid-cols-2 ui:gap-3' : 'ui:space-y-2'}>
    {#each question.options ?? [] as option, index}
      {@const optionValue = getOptionValue(option, index)}
      {@const optionId = `checkbox-${question.id ?? 'question'}-${index}`}
      {@const optionImageUrl = getOptionImageUrl(option)}

      <div
        class={cn(
          'ui:rounded-md ui:p-2 ui:border',
          optionsHaveImages ? 'ui:space-y-2' : 'ui:flex ui:items-center ui:gap-2'
        )}
      >
        <OptionImage
          src={optionImageUrl}
          alt={label('question.edit.image_alt')}
          variant="take"
          hasAnyImageInOptions={optionsHaveImages}
        />

        <div class="ui:flex ui:items-center ui:gap-2">
          <Checkbox
            id={optionId}
            checked={isOptionSelected(option, index)}
            {disabled}
            onCheckedChange={() => toggleOption(optionValue)}
          />
          <Label class="ui:cursor-pointer ui:font-normal ui:w-full" for={optionId}>
            {option.label ||
              option.value ||
              [label('common.option_prefix'), String(index + 1)].filter(Boolean).join(' ')}
          </Label>
        </div>
      </div>
    {/each}
  </div>
</div>
