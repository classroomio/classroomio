<script lang="ts">
  import ThumbsDownIcon from '@lucide/svelte/icons/thumbs-down';
  import ThumbsUpIcon from '@lucide/svelte/icons/thumbs-up';
  import {
    getExerciseQuestionLabel,
    type ExerciseQuestionLabels,
    type ExerciseQuestionOption
  } from '@cio/question-types';
  import * as ToggleGroup from '../../../../base/toggle-group';
  import { getThumbsOptionLabel } from './thumbs-options';

  interface Props {
    labels: ExerciseQuestionLabels | undefined;
    options: ExerciseQuestionOption[] | undefined;
    studentValue: string;
  }

  let { labels, options, studentValue }: Props = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  const defaultYesLabel = $derived(label('thumbs.yes_label', 'Yes'));
  const defaultNoLabel = $derived(label('thumbs.no_label', 'No'));
  const yesLabel = $derived(getThumbsOptionLabel(options, true, defaultYesLabel, defaultNoLabel));
  const noLabel = $derived(getThumbsOptionLabel(options, false, defaultYesLabel, defaultNoLabel));
</script>

<div class="ui:space-y-2">
  <ToggleGroup.Root type="single" value={studentValue} disabled={true} variant="outline">
    <ToggleGroup.Item value="true" class="ui:min-w-28 ui:gap-2 ui:px-6">
      <ThumbsUpIcon aria-hidden="true" class="custom ui:size-4" />
      {yesLabel}
    </ToggleGroup.Item>
    <ToggleGroup.Item value="false" class="ui:min-w-28 ui:gap-2 ui:px-6">
      <ThumbsDownIcon aria-hidden="true" class="custom ui:size-4" />
      {noLabel}
    </ToggleGroup.Item>
  </ToggleGroup.Root>
</div>
