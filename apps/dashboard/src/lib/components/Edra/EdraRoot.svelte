<script lang="ts">
  import { Editor } from '@cio/ui/custom/editor';
  import defaultContent from './default-content';
  import type { Content, Editor as TiptapEditor } from '@tiptap/core';

  interface Props {
    // Content of the editor
    content?: Content;
    // Whether the toolbar should be visible
    showToolBar?: boolean;
    // Whether the editor is editable
    editable?: boolean;
    // Whether to enable localStorage persistence
    enablePersistence?: boolean;
    // localStorage key for content persistence
    contentStorageKey?: string;
    // localStorage key for editable state persistence
    editableStorageKey?: string;
    // CSS class for the editor wrapper
    class?: string;
    // CSS class for the editor itself
    editorClass?: string;
    // Callback functions
    onContentChange?: (content: Content) => void;
    onEditorReady?: (editor: TiptapEditor) => void;
    onEditorDestroy?: () => void;
  }

  let {
    content = $bindable(defaultContent),
    showToolBar = true,
    editable = true,
    enablePersistence = false,
    contentStorageKey = 'edra-content',
    editableStorageKey = 'edra-editable',
    class: className = '',
    editorClass = '',
    onContentChange,
    onEditorReady,
    onEditorDestroy
  }: Props = $props();
</script>

<Editor
  bind:content
  {showToolBar}
  {editable}
  {enablePersistence}
  {contentStorageKey}
  {editableStorageKey}
  class={className}
  {editorClass}
  {onContentChange}
  {onEditorReady}
  {onEditorDestroy}
/>
