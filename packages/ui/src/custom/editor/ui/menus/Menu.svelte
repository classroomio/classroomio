<script lang="ts">
  import commands from '../../commands/toolbar-commands';
  import BubbleMenu from '../../components/BubbleMenu.svelte';
  import type { EdraToolbarProps, ShouldShowProps } from '../../types';

  import { cn } from '$src/tools';
  import { isTextSelection } from '@tiptap/core';
  import Alignment from '../components/toolbar/Alignment.svelte';
  import FontSize from '../components/toolbar/FontSize.svelte';
  import Headings from '../components/toolbar/Headings.svelte';
  import QuickColors from '../components/toolbar/QuickColors.svelte';
  import ToolBarIcon from '../components/ToolBarIcon.svelte';

  const {
    editor,
    class: className,
    excludedCommands = ['undo-redo', 'media', 'lists', 'table'],
    children
  }: EdraToolbarProps = $props();

  const toolbarCommands = Object.keys(commands).filter((key) => !excludedCommands?.includes(key));

  let isDragging = $state(false);

  editor.view.dom.addEventListener('dragstart', () => {
    isDragging = true;
  });

  editor.view.dom.addEventListener('drop', () => {
    isDragging = true;

    // Allow some time for the drop action to complete before re-enabling
    setTimeout(() => {
      isDragging = false;
    }, 100); // Adjust delay if needed
  });

  function shouldShow(props: ShouldShowProps) {
    if (!props.editor.isEditable) return false;
    const { view, editor } = props;
    if (!view || editor.view.dragging) {
      return false;
    }
    if (editor.isActive('link')) return false;
    if (editor.isActive('codeBlock')) return false;
    if (editor.isActive('image-placeholder')) return false;
    if (editor.isActive('video-placeholder')) return false;
    if (editor.isActive('audio-placeholder')) return false;
    if (editor.isActive('iframe-placeholder')) return false;
    const {
      state: {
        doc,
        selection,
        selection: { empty, from, to }
      }
    } = editor;
    // check if the selection is a table grip
    const domAtPos = view.domAtPos(from || 0).node as HTMLElement;
    const nodeDOM = view.nodeDOM(from || 0) as HTMLElement;
    const node = nodeDOM || domAtPos;

    if (isTableGripSelected(node)) {
      return false;
    }
    // Sometime check for `empty` is not enough.
    // Doubleclick an empty paragraph returns a node size of 2.
    // So we check also for an empty text size.
    const isEmptyTextBlock = !doc.textBetween(from, to).length && isTextSelection(selection);
    if (empty || isEmptyTextBlock || !editor.isEditable) {
      return false;
    }
    return !isDragging && !editor.state.selection.empty;
  }

  const isTableGripSelected = (node: HTMLElement) => {
    let container = node;
    while (container && !['TD', 'TH'].includes(container.tagName)) {
      container = container.parentElement!;
    }
    const gripColumn = container && container.querySelector && container.querySelector('a.grip-column.selected');
    const gripRow = container && container.querySelector && container.querySelector('a.grip-row.selected');
    if (gripColumn || gripRow) {
      return true;
    }
    return false;
  };
</script>

<BubbleMenu
  {editor}
  pluginKey="link-bubble-menu"
  {shouldShow}
  class={cn(
    'edra-bubble-menu ui:bg-popover ui:flex ui:h-fit ui:w-fit ui:items-center ui:rounded-lg ui:p-0.5',
    className
  )}
>
  {#if children}
    {@render children()}
  {:else}
    {#each toolbarCommands.filter((c) => !excludedCommands?.includes(c)) as cmd (cmd)}
      {#if cmd === 'headings'}
        <Headings {editor} />
      {:else if cmd === 'alignment'}
        <Alignment {editor} />
      {:else}
        {@const commandGroup = commands[cmd]}
        {#each commandGroup as command (command)}
          {#if command.name === 'paragraph'}
            <span></span>
          {:else}
            <ToolBarIcon {editor} {command} />
          {/if}
        {/each}
      {/if}
    {/each}
    <FontSize {editor} />
    <QuickColors {editor} />
  {/if}
</BubbleMenu>
