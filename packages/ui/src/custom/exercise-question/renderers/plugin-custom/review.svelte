<script lang="ts">
  import type { ExerciseQuestionRendererProps } from '@cio/question-types';

  let { question, answer }: ExerciseQuestionRendererProps = $props();

  const pluginQuestion = $derived((question.settings?.pluginQuestion ?? {}) as Record<string, unknown>);
  const contributionId = $derived(String(pluginQuestion.contributionId ?? 'custom-question'));
</script>

<div class="ui:rounded-lg ui:border ui:border-border ui:bg-muted/30 ui:p-4 ui:text-sm">
  <div class="ui:font-medium ui:text-foreground">Review: {contributionId}</div>
  {#if answer && answer.type === 'PLUGIN_CUSTOM'}
    <div class="ui:mt-2 ui:text-xs ui:text-muted-foreground">
      Student answer: <code class="ui:rounded ui:bg-muted ui:px-1 ui:py-0.5">{JSON.stringify(answer.value)}</code>
    </div>
  {/if}
</div>
