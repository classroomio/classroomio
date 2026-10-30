<script lang="ts">
  import type { HTMLContent, Editor, Extensions } from '@tiptap/core';
  import type { Transaction } from '@tiptap/pm/state';
  import type { UnsplashPhoto } from './types';
  import type { Snippet } from 'svelte';
  import { EdraEditor, EdraToolBar, EdraBubbleMenu, EdraDragHandleExtended } from './ui';
  import { slide } from 'svelte/transition';
  import { cn } from '$src/tools';
  import * as Sheet from '../../base/sheet';

  interface Props {
    // Content of the editor
    content?: HTMLContent;
    // Whether the toolbar should be visible
    showToolBar?: boolean;
    toolbarPreset?: 'default' | 'email';
    toolbarTrailing?: Snippet<[]>;
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
    /** No dashed frame — plain document surface (notes, embedded panels). */
    frameless?: boolean;
    // Placeholder text for the editor
    placeholder?: string | ((node: any) => string);
    // Callback functions
    onContentChange?: (content: HTMLContent) => void;
    onEditorReady?: (editor: Editor) => void;
    onEditorDestroy?: () => void;
    extraExtensions?: Extensions;
    onImageUpload?: (file: File) => Promise<string>;
    onSearchUnsplash?: (query: string) => Promise<UnsplashPhoto[]>;
    showDragHandle?: boolean;
    /** Enables a large editor sheet, opened by setting `expanded`; both editors stay in sync. */
    expandable?: boolean;
    expanded?: boolean;
    expandedTitle?: string;
    expandedDescription?: string;
  }

  let {
    content = $bindable(''),
    showToolBar = true,
    toolbarPreset = 'default',
    toolbarTrailing,
    editable = true,
    enablePersistence = false,
    contentStorageKey = 'edra-content',
    editableStorageKey = 'edra-editable',
    class: className = '',
    editorClass = '',
    frameless = false,
    placeholder,
    onContentChange,
    onEditorReady,
    onImageUpload,
    onSearchUnsplash,
    showDragHandle = true,
    expandable = false,
    expanded = $bindable(false),
    expandedTitle = '',
    expandedDescription = '',
    extraExtensions = []
  }: Props = $props();

  const editors = $state<{ inline?: Editor; expanded?: Editor }>({});

  // Browser detection
  const browser = typeof window !== 'undefined';

  function normalizeEditorContent(value: HTMLContent | undefined): string {
    const html = String(value ?? '').trim();

    if (html === '' || html === '<p></p>' || html === '<p><br></p>') return '';

    return html;
  }

  // Handle content persistence
  $effect(() => {
    if (enablePersistence && browser && content) {
      localStorage.setItem(contentStorageKey, JSON.stringify(content));
    }
  });

  // Handle editable state persistence
  $effect(() => {
    if (enablePersistence && browser) {
      localStorage.setItem(editableStorageKey, editable.toString());
    }
  });

  // Load persisted content and editable state on mount
  $effect(() => {
    if (enablePersistence && browser) {
      try {
        // Load content
        const rawContentString = localStorage.getItem(contentStorageKey);
        if (rawContentString !== null) {
          console.log('persistedContent', rawContentString);
          content = rawContentString;
        }

        // Load editable state
        const rawEditableString = localStorage.getItem(editableStorageKey);
        if (rawEditableString !== null) {
          editable = rawEditableString === 'true';
        }
      } catch (error) {
        console.warn('Failed to load persisted state:', error);
      }
    }
  });

  let isEditorReady = $state(false);
  // Handle editor ready
  $effect(() => {
    if (editors.inline && !isEditorReady) {
      isEditorReady = true;
      onEditorReady?.(editors.inline);
    }
  });

  $effect(() => {
    const nextContent = normalizeEditorContent(content);

    for (const editor of [editors.inline, editors.expanded]) {
      if (!editor || editor.isDestroyed) continue;

      const currentContent = normalizeEditorContent(editor.getHTML());
      if (currentContent === nextContent) continue;

      editor.commands.setContent(nextContent, { emitUpdate: false });
    }
  });

  function onUpdate(props: { editor: Editor; transaction: Transaction }) {
    if (props?.editor && !props.editor.isDestroyed) {
      const newContent = props.editor.getHTML();
      content = newContent;
      onContentChange?.(newContent);
    }
  }

  function handleExpandedChange(isOpen: boolean) {
    const expandedEditor = editors.expanded;

    if (!isOpen && expandedEditor && !expandedEditor.isDestroyed) {
      expandedEditor.view.dom.blur();
    }

    expanded = isOpen;
  }
</script>

{#snippet editorSurface(surface: 'inline' | 'expanded', wrapperClass: string, contentClass: string)}
  {@const editor = editors[surface]}
  <div
    class={cn(
      'ui:relative ui:bg-background ui:z-50 ui:flex ui:size-full ui:w-full ui:flex-col',
      !frameless && 'ui:rounded-md ui:border ui:border-dashed',
      wrapperClass
    )}
  >
    {#if editor && !editor.isDestroyed}
      {#if showToolBar}
        <div transition:slide>
          <EdraToolBar
            class={cn(
              'ui:bg-secondary/50 ui:flex ui:w-full ui:items-center ui:p-0.5',
              !frameless && 'ui:border-b ui:border-dashed',
              toolbarPreset === 'email' ? 'ui:flex-wrap ui:overflow-x-hidden' : 'ui:flex-nowrap ui:overflow-x-auto'
            )}
            {editor}
            preset={toolbarPreset}
            trailingContent={toolbarTrailing}
          />
        </div>
      {/if}
      {#if toolbarPreset !== 'email'}
        <EdraBubbleMenu {editor} />
      {/if}

      {#if editable && showDragHandle && toolbarPreset !== 'email'}
        <EdraDragHandleExtended {editor} />
      {/if}
    {/if}
    <div class="ui:flex ui:min-h-0 ui:min-w-0 ui:w-full ui:flex-1 ui:flex-col">
      <EdraEditor
        class={cn(
          'ui:relative ui:min-h-0 ui:min-w-0 ui:w-full ui:flex-1 ui:overflow-auto',
          frameless ? 'ui:p-0' : 'ui:p-4',
          contentClass
        )}
        bind:editor={editors[surface]}
        {editable}
        emailSafe={toolbarPreset === 'email'}
        {content}
        {onUpdate}
        {placeholder}
        {onImageUpload}
        {onSearchUnsplash}
        {extraExtensions}
      />
    </div>
  </div>
{/snippet}

{#if browser}
  {@render editorSurface('inline', className, editorClass)}

  {#if expandable}
    <Sheet.Root open={expanded} onOpenChange={handleExpandedChange}>
      <Sheet.Content side="right" class="ui:w-full ui:gap-0 ui:sm:max-w-3xl">
        <Sheet.Header class="ui:pr-12">
          <Sheet.Title>{expandedTitle}</Sheet.Title>
          {#if expandedDescription}
            <Sheet.Description>{expandedDescription}</Sheet.Description>
          {/if}
        </Sheet.Header>
        <div class="ui:flex ui:min-h-0 ui:flex-1 ui:flex-col ui:px-4 ui:pb-4">
          {#if expanded}
            {@render editorSurface('expanded', 'ui:min-h-0 ui:flex-1', 'ui:min-h-0 ui:flex-1')}
          {/if}
        </div>
      </Sheet.Content>
    </Sheet.Root>
  {/if}
{/if}
