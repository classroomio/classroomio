<script lang="ts">
  import { Editor } from '@cio/ui/custom/editor';
  import type { HTMLContent, TiptapEditor } from '@cio/ui/custom/editor';

  interface Props {
    placeholder?: string | ((node: any) => string);
    // Content of the editor
    content?: HTMLContent;
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
    onChange?: (content: HTMLContent) => void;
    onReady?: (editor: TiptapEditor) => void;
    onEditorDestroy?: () => void;
  }

  let {
    content = $bindable(''),
    showToolBar = true,
    editable = true,
    enablePersistence = false,
    contentStorageKey = 'edra-content',
    editableStorageKey = 'edra-editable',
    class: className = '',
    editorClass = '',
    placeholder = 'Welcome to ClassroomIO',
    onChange,
    onReady,
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
  {placeholder}
  onContentChange={onChange}
  onEditorReady={onReady}
  {onEditorDestroy}
/>
