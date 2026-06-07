<script module lang="ts">
  // Module-level singleton: one Promise shared across all mounted instances.
  // Dynamic imports are already cached by the JS engine after the first load,
  // but reusing the same Promise avoids redundant microtask chains on remounts.
  let pending: Promise<typeof import('@cio/ui/custom/editor')> | null = null;

  function loadEditor() {
    pending ??= import('@cio/ui/custom/editor');
    return pending;
  }
</script>

<script lang="ts">
  // Type-only imports are erased at build time — no static TipTap dependency.
  import type { HTMLContent, TiptapEditor } from '@cio/ui/custom/editor';

  interface Props {
    placeholder?: string | ((node: any) => string);
    content?: HTMLContent;
    showToolBar?: boolean;
    editable?: boolean;
    enablePersistence?: boolean;
    contentStorageKey?: string;
    editableStorageKey?: string;
    class?: string;
    editorClass?: string;
    onChange?: (content: HTMLContent) => void;
    onReady?: (editor: TiptapEditor) => void;
    onEditorDestroy?: () => void;
  }

  let {
    content = '',
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

{#await loadEditor()}
  <div class="ui:animate-pulse ui:rounded-md ui:bg-muted ui:h-32 ui:w-full" />
{:then { Editor }}
  <Editor
    {content}
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
{/await}
