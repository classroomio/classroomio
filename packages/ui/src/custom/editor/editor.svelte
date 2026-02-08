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
    placeholder,
    onContentChange,
    onEditorReady
  }: Props = $props();

  let editor = $state<Editor>();

  // Browser detection
  const browser = typeof window !== 'undefined';

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
      'ui:relative ui:bg-background ui:z-50 ui:flex ui:size-full ui:w-full ui:flex-col ui:rounded-md ui:border ui:border-dashed',
      className
    )}
  >
    {#if editor && !editor.isDestroyed}
      {#if showToolBar}
        <div transition:slide>
          <EdraToolBar
            class="ui:bg-secondary/50 ui:flex ui:w-full ui:items-center ui:overflow-x-auto ui:border-b ui:border-dashed ui:p-0.5"
            {editor}
          />
        </div>
      {/if}
      <EdraBubbleMenu {editor} />

      <EdraDragHandleExtended {editor} />
    {/if}
    <EdraEditor
      class={cn('ui:relative ui:h-128 ui:overflow-auto ui:p-4', editorClass)}
      bind:editor
      {editable}
      {content}
      {onUpdate}
      {placeholder}
    />
  </div>
{/if}
