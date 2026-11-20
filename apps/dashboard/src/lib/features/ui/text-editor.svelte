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
  import type { EditorToolbarPreset, HTMLContent, TiptapEditor } from '@cio/ui/custom/editor';
  import type { Snippet } from 'svelte';
  import { cn } from '@cio/ui/tools';
  import { uploadImage } from '$lib/utils/services/upload';
  import { queryUnsplash } from './upload-widget/utils';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    placeholder?: string | ((node: any) => string);
    content?: HTMLContent;
    showToolBar?: boolean;
    toolbarPreset?: EditorToolbarPreset;
    toolbarTrailing?: Snippet<[]>;
    editable?: boolean;
    enablePersistence?: boolean;
    contentStorageKey?: string;
    editableStorageKey?: string;
    class?: string;
    editorClass?: string;
    onChange?: (content: HTMLContent) => void;
    onReady?: (editor: TiptapEditor) => void;
    onEditorDestroy?: () => void;
    expandable?: boolean;
    expanded?: boolean;
    expandedTitle?: string;
    expandedDescription?: string;
  }

  let {
    content = '',
    showToolBar = true,
    toolbarPreset = 'default',
    toolbarTrailing,
    editable = true,
    enablePersistence = false,
    contentStorageKey = 'edra-content',
    editableStorageKey = 'edra-editable',
    class: className = '',
    editorClass = '',
    placeholder = 'Welcome to ClassroomIO',
    onChange,
    onReady,
    onEditorDestroy,
    expandable = false,
    expanded = $bindable(false),
    expandedTitle = '',
    expandedDescription = ''
  }: Props = $props();

  const mathEditLabels = $derived({
    insertMath: $t('math_editor.insert_math'),
    typeTab: $t('math_editor.type_tab'),
    latexTab: $t('math_editor.latex_tab'),
    mathFieldLabel: $t('math_editor.math_field_label'),
    paletteLabel: $t('math_editor.palette_label'),
    structures: {
      fraction: $t('math_editor.structures.fraction'),
      mixed_number: $t('math_editor.structures.mixed_number'),
      parentheses: $t('math_editor.structures.parentheses'),
      power: $t('math_editor.structures.power'),
      subscript: $t('math_editor.structures.subscript'),
      square_root: $t('math_editor.structures.square_root'),
      nth_root: $t('math_editor.structures.nth_root'),
      absolute_value: $t('math_editor.structures.absolute_value'),
      system: $t('math_editor.structures.system'),
      matrix: $t('math_editor.structures.matrix'),
      piecewise: $t('math_editor.structures.piecewise'),
      integral: $t('math_editor.structures.integral'),
      sum: $t('math_editor.structures.sum'),
      limit: $t('math_editor.structures.limit'),
      derivative: $t('math_editor.structures.derivative')
    },
    latexLabel: $t('math_editor.latex_label'),
    previewLabel: $t('math_editor.preview_label'),
    previewEmpty: $t('math_editor.preview_empty'),
    done: $t('math_editor.done'),
    cancel: $t('math_editor.cancel')
  });
</script>

{#await loadEditor()}
  <div
    class={cn('ui:bg-background relative flex w-full flex-col rounded-md border border-dashed', className)}
    aria-busy="true"
    aria-hidden="true"
  >
    {#if showToolBar}
      <div class="ui:bg-muted/50 h-9 shrink-0 border-b border-dashed"></div>
    {/if}
    <div class={cn('ui:bg-muted/50 relative h-full w-full animate-pulse overflow-auto p-4', editorClass)}></div>
  </div>
{:then { Editor }}
  <Editor
    {content}
    {showToolBar}
    {toolbarPreset}
    {toolbarTrailing}
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
    onSearchUnsplash={queryUnsplash}
    {expandable}
    bind:expanded
    {expandedTitle}
    {expandedDescription}
    mathLabels={mathEditLabels}
  />
{/await}
