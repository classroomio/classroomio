<script lang="ts">
  import {
    getMathQuestionLabel,
    readMathExpressionSettings,
    type ExerciseQuestionRendererProps
  } from '@cio/question-types';
  import LabeledValueRow from '../shared/labeled-value-row.svelte';

  let { question, labels }: ExerciseQuestionRendererProps = $props();

  const settings = $derived(readMathExpressionSettings(question.settings));
  const acceptedText = $derived(settings.acceptedAnswers.map((answer) => `$${answer}$`).join(',  '));
</script>

<div class="ui:space-y-1">
  {#if acceptedText}
    <LabeledValueRow label={getMathQuestionLabel(labels, 'math.preview.accepted_label')} value={acceptedText} />
    <LabeledValueRow
      label={getMathQuestionLabel(labels, 'math.preview.compare_label')}
      value={getMathQuestionLabel(labels, `math.edit.compare.${settings.compare.mode}`)}
    />
  {:else}
    <p class="ui:text-muted-foreground ui:text-sm">{getMathQuestionLabel(labels, 'math.preview.empty')}</p>
  {/if}
</div>
