<script lang="ts">
  import type { ExerciseQuestionRendererProps } from '@cio/question-types';

  let { question }: ExerciseQuestionRendererProps = $props();

  const pluginQuestion = $derived((question.settings?.pluginQuestion ?? {}) as Record<string, unknown>);
  const contributionId = $derived(String(pluginQuestion.contributionId ?? 'custom-question'));
</script>

<div class="ui:rounded-lg ui:border ui:border-border ui:bg-muted/30 ui:p-4 ui:text-sm">
  <div class="ui:font-medium ui:text-foreground">Preview: {contributionId}</div>
</div>
