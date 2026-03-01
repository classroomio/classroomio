<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import { Editor } from '../../../editor';

  let {
    question,
    answer = '',
    disabled = false,
    labels,
    onAnswerChange = () => {}
  }: ExerciseQuestionRendererProps = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  const content = $derived(String(answer ?? ''));
</script>

<div class="ui:space-y-2">
  <Editor
    {content}
    editable={!disabled}
    showToolBar={!disabled}
    placeholder={label('textarea.take.placeholder')}
    editorClass="ui:h-40"
    onContentChange={(nextContent) => onAnswerChange(String(nextContent ?? ''))}
  />
</div>
