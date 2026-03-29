<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { Editor } from '@tiptap/core';
  import {
    getExerciseQuestionLabel,
    getTextareaAnswerCharacterCount,
    getTextareaCharacterLimits,
    type ExerciseQuestionRendererProps
  } from '@cio/question-types';
  import { Editor as EditorComponent } from '../../../editor';

  let {
    question,
    answer,
    disabled = false,
    labels,
    onAnswerChange = () => {}
  }: ExerciseQuestionRendererProps = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  const content = $derived(answer?.type === 'TEXTAREA' ? answer.text : String(answer ?? ''));
  const characterLimits = $derived(getTextareaCharacterLimits(question));
  const characterCount = $derived(getTextareaAnswerCharacterCount(content));
  const shouldShowCharacterCount = $derived(
    characterLimits.minCharacters !== undefined && characterLimits.maxCharacters !== undefined
  );

  let detachEditorListeners: (() => void) | undefined;

  onDestroy(() => {
    detachEditorListeners?.();
  });

  function normalizeAnswerHtml(value: string | null | undefined): string {
    const html = String(value ?? '').trim();

    if (getTextareaAnswerCharacterCount(html) < 1) return '';

    return html;
  }

  function updateAnswer(value: string | null | undefined) {
    onAnswerChange({ type: 'TEXTAREA', text: normalizeAnswerHtml(value) });
  }

  function getEditorDom(editor: Editor): HTMLElement | null {
    try {
      return editor.view.dom as HTMLElement;
    } catch {
      return null;
    }
  }

  function getCurrentCharacterCount(editor: Editor): number {
    return getTextareaAnswerCharacterCount(editor.getHTML());
  }

  function getSelectedCharacterCount(editor: Editor): number {
    const { from, to, empty } = editor.state.selection;

    if (empty) return 0;

    return editor.state.doc.textBetween(from, to, '\n', '\n').length;
  }

  function canInsertCharacters(editor: Editor, insertedCharacterCount: number): boolean {
    const maxCharacters = characterLimits.maxCharacters;

    if (maxCharacters === undefined || insertedCharacterCount < 1) return true;

    const nextCharacterCount =
      getCurrentCharacterCount(editor) - getSelectedCharacterCount(editor) + insertedCharacterCount;

    return nextCharacterCount <= maxCharacters;
  }

  function getBeforeInputCharacterCount(event: InputEvent): number {
    switch (event.inputType) {
      case 'insertParagraph':
      case 'insertLineBreak':
        return 1;
      default:
        return typeof event.data === 'string' ? event.data.length : 0;
    }
  }

  function handleEditorReady(editor: Editor) {
    detachEditorListeners?.();

    const editorDom = getEditorDom(editor);

    if (!editorDom || disabled) return;

    const blurHandler = () => {
      if (!editor.isDestroyed) updateAnswer(editor.getHTML());
    };

    const beforeInputHandler = (event: Event) => {
      const inputEvent = event as InputEvent;

      if (!inputEvent.inputType?.startsWith('insert')) return;

      const insertedCharacterCount = getBeforeInputCharacterCount(inputEvent);
      if (canInsertCharacters(editor, insertedCharacterCount)) return;

      inputEvent.preventDefault();
    };

    const pasteHandler = (event: ClipboardEvent) => {
      const pastedText = event.clipboardData?.getData('text/plain') ?? '';
      if (canInsertCharacters(editor, pastedText.length)) return;

      event.preventDefault();
    };

    editorDom.addEventListener('blur', blurHandler);
    editorDom.addEventListener('beforeinput', beforeInputHandler);
    editorDom.addEventListener('paste', pasteHandler);

    detachEditorListeners = () => {
      editorDom.removeEventListener('blur', blurHandler);
      editorDom.removeEventListener('beforeinput', beforeInputHandler);
      editorDom.removeEventListener('paste', pasteHandler);
    };
  }
</script>

<div class="ui:space-y-2">
  <EditorComponent
    {content}
    editable={!disabled}
    showToolBar={!disabled}
    placeholder={label('textarea.take.placeholder')}
    editorClass="ui:h-40"
    onContentChange={updateAnswer}
    onEditorReady={handleEditorReady}
  />

  {#if shouldShowCharacterCount}
    <span class="ui:text-muted-foreground ui:block ui:text-right ui:text-xs">
      {characterCount} / {characterLimits.maxCharacters}
    </span>
  {/if}
</div>
