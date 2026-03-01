<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import * as RadioGroup from '../../../../base/radio-group';
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

  const selectedOptionValue = $derived.by(() => {
    if (Array.isArray(answer)) {
      const first = answer[0];
      return first === undefined || first === null ? '' : String(first);
    }

    if (answer === undefined || answer === null) {
      return '';
    }

    return String(answer);
  });

  const optionsHaveImages = $derived(hasOptionImages(question.options));

  function handleOptionChange(value: string) {
    const nextValue = String(value ?? '').trim();
    if (!nextValue) return;

    const matchedOption = (question.options ?? []).find((option, index) => getOptionValue(option, index) === nextValue);

    if (matchedOption?.id !== undefined && matchedOption.id !== null) {
      onAnswerChange(matchedOption.id);
      return;
    }

    onAnswerChange(nextValue);
  }
</script>

<div class="ui:space-y-2">
  <RadioGroup.Root value={selectedOptionValue} {disabled} onValueChange={handleOptionChange}>
    <div class={optionsHaveImages ? 'ui:grid ui:grid-cols-2 ui:gap-3' : 'ui:space-y-2'}>
      {#each question.options ?? [] as option, index}
        {@const optionValue = getOptionValue(option, index)}
        {@const optionId = `radio-${question.id ?? 'question'}-${index}`}
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
            <RadioGroup.Item id={optionId} value={optionValue} />
            <Label class="ui:cursor-pointer ui:font-normal ui:w-full" for={optionId}>
              {option.label ||
                option.value ||
                [label('common.option_prefix'), String(index + 1)].filter(Boolean).join(' ')}
            </Label>
          </div>
        </div>
      {/each}
    </div>
  </RadioGroup.Root>
</div>
