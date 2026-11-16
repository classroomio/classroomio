<script lang="ts">
  import type { ExerciseQuestionRendererProps } from '@cio/question-types';

  let { question }: ExerciseQuestionRendererProps = $props();

  const pluginQuestion = $derived((question.settings?.pluginQuestion ?? {}) as Record<string, unknown>);
  const pluginId = $derived(String(pluginQuestion.pluginId ?? 'Unknown Plugin'));
  const contributionId = $derived(String(pluginQuestion.contributionId ?? 'Custom Question'));
</script>

<div class="ui:rounded-lg ui:border ui:border-dashed ui:border-border ui:bg-muted/20 ui:p-4 ui:text-sm">
  <div class="ui:font-medium ui:text-foreground">Plugin: {pluginId}</div>
  <div class="ui:mt-1 ui:text-xs ui:text-muted-foreground">Contribution: {contributionId}</div>
</div>
