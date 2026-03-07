<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import { Checkbox } from '../../../../base/checkbox';
  import { Label } from '../../../../base/label';
  import OptionImage from '../option-image.svelte';
  import { getOptionImageUrl, hasOptionImages } from '../option-image-utils';
  import { cn } from '../../../../tools';

  let {
    question,
    answer = null,
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
    const optionIds = answer?.type === 'CHECKBOX' ? answer.optionIds : [];
    return new Set(optionIds.map((id) => String(id)));
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

    const options = question.options ?? [];
    const optionIds = Array.from(nextSelectedValues)
      .map((val) => {
        const matched = options.find((opt, i) => getOptionValue(opt, i) === val);
        const id = matched?.id ?? val;
        const num = Number(id);
        return Number.isNaN(num) ? undefined : num;
      })
      .filter((id): id is number => id !== undefined);

    onAnswerChange({ type: 'CHECKBOX', optionIds });
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
