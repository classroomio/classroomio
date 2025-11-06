<script lang="ts">
  import type { Content, Editor } from '@tiptap/core';
  import type { Transaction } from '@tiptap/pm/state';
  import { EdraEditor, EdraToolBar, EdraBubbleMenu, EdraDragHandleExtended } from './ui';
  import { slide } from 'svelte/transition';
  import { cn } from '$src/tools';

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
    // Placeholder text for the editor
    placeholder?: string | ((node: any) => string);
    // Callback functions
    onContentChange?: (content: Content) => void;
    onEditorReady?: (editor: Editor) => void;
    onEditorDestroy?: () => void;
  }

  let {
    content = $bindable(getDefaultContent()),
    showToolBar = true,
    editable = true,
    enablePersistence = false,
    contentStorageKey = 'edra-content',
    editableStorageKey = 'edra-editable',
    class: className = '',
    editorClass = '',
    placeholder,
    onContentChange,
    onEditorReady,
    onEditorDestroy
  }: Props = $props();

  let editor = $state<Editor>();

  // Browser detection
  const browser = typeof window !== 'undefined';

  // Default content fallback
  function getDefaultContent(): Content {
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Start typing...'
            }
          ]
        }
      ]
    };
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
          const persistedContent: Content = JSON.parse(rawContentString);
          console.log('persistedContent', persistedContent);
          content = persistedContent;
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

  // Handle editor ready
  $effect(() => {
    if (editor) {
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
      'bg-background z-50 mx-auto mt-12 flex size-full w-[95%] max-w-5xl flex-col rounded-md border border-dashed sm:w-[85%]',
      className
    )}
  >
    {#if editor && !editor.isDestroyed}
      {#if showToolBar}
        <div transition:slide>
          <EdraToolBar
            class="bg-secondary/50 flex w-full items-center overflow-x-auto border-b border-dashed p-0.5"
            {editor}
          />
        </div>
      {/if}
      <EdraBubbleMenu {editor} />

      <EdraDragHandleExtended {editor} />
    {/if}
    <EdraEditor
      class={cn('h-[32rem] overflow-auto p-4', editorClass)}
      bind:editor
      {editable}
      {content}
      {onUpdate}
      {placeholder}
    />
  </div>
{/if}
