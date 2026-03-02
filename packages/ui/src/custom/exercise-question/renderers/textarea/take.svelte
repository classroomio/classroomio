<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { Editor } from '@tiptap/core';
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import { Editor as EditorComponent } from '../../../editor';

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

  function handleEditorReady(editor: Editor) {
    if (!editor?.view?.dom || disabled) return;
    const blurHandler = () => {
      if (!editor.isDestroyed) onAnswerChange(String(editor.getHTML() ?? ''));
    };
    editor.view.dom.addEventListener('blur', blurHandler);
    onDestroy(() => {
      if (editor?.view?.dom) editor.view.dom.removeEventListener('blur', blurHandler);
    });
  }
</script>

<div class="ui:space-y-2">
  <EditorComponent
    {content}
    editable={!disabled}
    showToolBar={!disabled}
    placeholder={label('textarea.take.placeholder')}
    editorClass="ui:h-40"
    onContentChange={(nextContent) => onAnswerChange(String(nextContent ?? ''))}
    onEditorReady={handleEditorReady}
  />
</div>
