<script lang="ts">
  import type { ExerciseQuestionRendererProps } from '@cio/question-types';
  import { Editor } from '../../../editor';

  let { question, answer = null }: ExerciseQuestionRendererProps = $props();

  const content = $derived(answer?.type === 'TEXTAREA' ? answer.text : '');
</script>

<div class="ui:space-y-2">
  <Editor {content} editable={false} showToolBar={false} editorClass="ui:h-40" />
</div>
