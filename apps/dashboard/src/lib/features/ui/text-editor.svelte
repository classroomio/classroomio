<script module lang="ts">
  // Module-level singleton: one Promise shared across all mounted instances.
  // Dynamic imports are already cached by the JS engine after the first load,
  // but reusing the same Promise avoids redundant microtask chains on remounts.
  let pending: Promise<typeof import('@cio/ui/custom/editor')> | null = null;

  function loadEditor() {
    pending ??= import('@cio/ui/custom/editor');
    return pending;
  }

  /** Warm the editor chunk without mounting an instance (e.g. on newsfeed page load). */
  export function preloadTextEditor() {
    return loadEditor();
  }
</script>

<script lang="ts">
  // Type-only imports are erased at build time — no static TipTap dependency.
  import type { HTMLContent, TiptapEditor } from '@cio/ui/custom/editor';
  import { cn } from '@cio/ui/tools';
  import { uploadImage } from '$lib/utils/services/upload';

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
  <div
    class={cn('ui:bg-background relative flex w-full flex-col rounded-md border border-dashed', className)}
    aria-busy="true"
    aria-hidden="true"
  >
    {#if showToolBar}
      <div class="ui:bg-muted/50 h-9 shrink-0 border-b border-dashed" />
    {/if}
    <div class={cn('ui:bg-muted/50 relative h-128 w-full animate-pulse overflow-auto p-4', editorClass)} />
  </div>
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
    onImageUpload={uploadImage}
  />
{/await}
