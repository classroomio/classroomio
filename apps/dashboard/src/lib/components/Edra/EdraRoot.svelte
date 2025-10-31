<script lang="ts">
  import { browser } from '$app/environment';
  import type { Content, Editor } from '@tiptap/core';
  import type { Transaction } from '@tiptap/pm/state';
  import { EdraEditor, EdraToolBar, EdraBubbleMenu, EdraDragHandleExtended } from '@cio/ui/custom/editor/ui';
  import { slide } from 'svelte/transition';
  import defaultContent from './default-content';

  // Editor states
  let content = $state<Content>(defaultContent);
  let editor = $state<Editor>();
  let showToolBar = $state(true);
  let editable = $derived.by(() => {
    if (browser) return localStorage.getItem('edra-editable') === 'true';
    return true;
  });

  $effect(() => {
    if (content) {
      $inspect('[DEBUG] Content', content);
      localStorage.setItem('edra-content', JSON.stringify(content));
    }
  });

  if (browser) {
    try {
      const rawDataString = localStorage.getItem('edra-content');

      if (rawDataString === null) {
        content = defaultContent;
      } else {
        const rawData: Content = JSON.parse(rawDataString);
        content = rawData;
      }
    } catch (error) {
      console.warn('Failed to parse stored content, using default:', error);
      content = defaultContent;
    }
  }

  function onUpdate(props: { editor: Editor; transaction: Transaction }) {
    if (props?.editor && !props.editor.isDestroyed) {
      content = props.editor.getJSON();
    }
  }
</script>

{#if browser}
  <div class="mx-auto flex w-[95%] max-w-7xl flex-col rounded border sm:w-[85%]">
    {#if editor}
      {#if showToolBar}
        <div transition:slide>
          <EdraToolBar {editor} />
        </div>
      {/if}
      <EdraBubbleMenu {editor} />

      <EdraDragHandleExtended {editor} />
    {/if}
    <EdraEditor class="h-[32rem] overflow-auto" bind:editor {editable} content={content || defaultContent} {onUpdate} />
  </div>
{/if}
