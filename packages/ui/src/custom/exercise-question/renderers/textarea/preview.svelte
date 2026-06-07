<script module lang="ts">
  let pending: Promise<typeof import('../../../editor')> | null = null;
  function loadEditor() {
    pending ??= import('../../../editor');
    return pending;
  }
</script>

<script lang="ts">
  import type { ExerciseQuestionRendererProps } from '@cio/question-types';

  let { question, answer = null }: ExerciseQuestionRendererProps = $props();

  const content = $derived(answer?.type === 'TEXTAREA' ? answer.text : '');
</script>

<div class="ui:space-y-2">
  {#await loadEditor()}
    <div class="ui:animate-pulse ui:rounded-md ui:bg-muted ui:h-40 ui:w-full" />
  {:then { Editor }}
    <Editor {content} editable={false} showToolBar={false} editorClass="ui:h-40" />
  {/await}
</div>
