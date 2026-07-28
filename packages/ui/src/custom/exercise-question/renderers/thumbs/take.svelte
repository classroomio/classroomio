<script lang="ts">
  import ThumbsDownIcon from '@lucide/svelte/icons/thumbs-down';
  import ThumbsUpIcon from '@lucide/svelte/icons/thumbs-up';
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import * as ToggleGroup from '../../../../base/toggle-group';
  import { getThumbsOptionLabel } from './thumbs-options';

  let {
    question,
    answer = null,
    disabled = false,
    labels,
    onAnswerChange = () => {}
  }: ExerciseQuestionRendererProps = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  const defaultYesLabel = $derived(label('thumbs.yes_label', 'Yes'));
  const defaultNoLabel = $derived(label('thumbs.no_label', 'No'));
  const yesLabel = $derived(getThumbsOptionLabel(question.options, true, defaultYesLabel, defaultNoLabel));
  const noLabel = $derived(getThumbsOptionLabel(question.options, false, defaultYesLabel, defaultNoLabel));

  const selected = $derived.by(() => {
    const val = answer?.type === 'THUMBS' ? answer.value : undefined;
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    return '';
  });

  function update(value: string) {
    if (value !== 'true' && value !== 'false') return;
    onAnswerChange({ type: 'THUMBS', value: value === 'true' });
  }
</script>

<div class="ui:space-y-2">
  <ToggleGroup.Root type="single" value={selected} {disabled} variant="outline" onValueChange={update}>
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
