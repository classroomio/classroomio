<script lang="ts">
  import type { HTMLContent, Content, Editor } from '@tiptap/core';
  import type { Transaction } from '@tiptap/pm/state';
  import { EdraEditor, EdraToolBar, EdraBubbleMenu, EdraDragHandleExtended } from './ui';
  import { slide } from 'svelte/transition';
  import { cn } from '$src/tools';

  interface Props {
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
    /** No dashed frame — plain document surface (notes, embedded panels). */
    frameless?: boolean;
    // Placeholder text for the editor
    placeholder?: string | ((node: any) => string);
    // Callback functions
    onContentChange?: (content: HTMLContent) => void;
    onEditorReady?: (editor: Editor) => void;
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
    frameless = false,
    placeholder,
    onContentChange,
    onEditorReady,
    extraExtensions = []
  }: Props = $props();

  let editor = $state<Editor>();

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
    if (editor && !isEditorReady) {
      isEditorReady = true;
      onEditorReady?.(editor);
    }
  });

  $effect(() => {
    if (!editor || editor.isDestroyed) return;

    const nextContent = normalizeEditorContent(content);
    const currentContent = normalizeEditorContent(editor.getHTML());

    if (currentContent === nextContent) return;

    editor.commands.setContent(nextContent, false);
  });

  function onUpdate(props: { editor: Editor; transaction: Transaction }) {
    if (props?.editor && !props.editor.isDestroyed) {
      const newContent = props.editor.getHTML();
      content = newContent;
      onContentChange?.(newContent);
    }
  }
</script>

{#if browser}
  <div
    class={cn(
      frameless
        ? 'ui:relative ui:bg-background ui:z-50 ui:flex ui:size-full ui:w-full ui:flex-col'
        : 'ui:relative ui:bg-background ui:z-50 ui:flex ui:size-full ui:w-full ui:flex-col ui:rounded-md ui:border ui:border-dashed',
      className
    )}
  >
    {#if editor && !editor.isDestroyed}
      {#if showToolBar}
        <div transition:slide>
          <EdraToolBar
            class={cn(
              'ui:bg-secondary/50 ui:flex ui:w-full ui:items-center ui:overflow-x-auto ui:p-0.5',
              !frameless && 'ui:border-b ui:border-dashed'
            )}
            {editor}
          />
        </div>
      {/if}
      <EdraBubbleMenu {editor} />

      {#if editable}
        <EdraDragHandleExtended {editor} />
      {/if}
    {/if}
    <EdraEditor
      class={cn(
        frameless ? 'ui:relative ui:min-h-0 ui:overflow-auto ui:p-0' : 'ui:relative ui:h-128 ui:overflow-auto ui:p-4',
        editorClass
      )}
      bind:editor
      {editable}
      {content}
      {onUpdate}
      {placeholder}
      {extraExtensions}
    />
  </div>
{/if}
