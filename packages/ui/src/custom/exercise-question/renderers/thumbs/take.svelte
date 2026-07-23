<script lang="ts">
  import ThumbsDownIcon from '@lucide/svelte/icons/thumbs-down';
  import ThumbsUpIcon from '@lucide/svelte/icons/thumbs-up';
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import * as ToggleGroup from '../../../../base/toggle-group';

  let {
    question,
    answer = null,
    disabled = false,
    labels,
    onAnswerChange = () => {}
  }: ExerciseQuestionRendererProps = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

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
    <ToggleGroup.Item value="true" class="ui:gap-2">
      <ThumbsUpIcon aria-hidden="true" class="ui:size-4" />
      {label('thumbs.yes_label')}
    </ToggleGroup.Item>
    <ToggleGroup.Item value="false" class="ui:gap-2">
      <ThumbsDownIcon aria-hidden="true" class="ui:size-4" />
      {label('thumbs.no_label')}
    </ToggleGroup.Item>
  </ToggleGroup.Root>
</div>
