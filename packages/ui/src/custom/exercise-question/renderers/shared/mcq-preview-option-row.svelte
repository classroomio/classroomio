<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionLabels } from '@cio/question-types';
  import OptionImage from '../option-image.svelte';
  import { cn } from '../../../../tools';
  import OptionCorrectnessBadges from './option-correctness-badges.svelte';

  interface Props {
    option: { label: string; value?: string; isCorrect?: boolean };
    index: number;
    optionImageUrl: string | null;
    optionsHaveImages: boolean;
    labels: ExerciseQuestionLabels | undefined;
  }

  let { option, index, optionImageUrl, optionsHaveImages, labels }: Props = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);
</script>

<li class={cn(optionsHaveImages && 'ui:space-y-2 ui:rounded-md ui:p-2', 'ui:text-sm')}>
  <OptionImage
    src={optionImageUrl}
    alt={label('question.edit.image_alt')}
    variant="preview"
    hasAnyImageInOptions={optionsHaveImages}
  />

  <div>
    {option.label || option.value || [label('common.option_prefix'), String(index + 1)].filter(Boolean).join(' ')}
    <OptionCorrectnessBadges {labels} showCorrect={option.isCorrect === true} />
  </div>
</li>
