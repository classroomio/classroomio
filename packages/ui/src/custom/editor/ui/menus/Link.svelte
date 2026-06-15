<script lang="ts">
  import type { ShouldShowProps } from '../../types';
  import BubbleMenu from '../../components/BubbleMenu.svelte';
  import type { Editor } from '@tiptap/core';
  import { Button } from '$src/base/button';
  import Copy from '@lucide/svelte/icons/copy';
  import Trash from '@lucide/svelte/icons/trash';

  interface Props {
    editor: Editor;
  }

  const { editor }: Props = $props();

  let href = $state('');

  $effect(() => {
    const syncHref = () => {
      href = editor.getAttributes('link').href ?? '';
    };

    syncHref();
    editor.on('selectionUpdate', syncHref);
    editor.on('transaction', syncHref);

    return () => {
      editor.off('selectionUpdate', syncHref);
      editor.off('transaction', syncHref);
    };
  });

  function copyLink(event: MouseEvent) {
    event.preventDefault();

    const url = editor.getAttributes('link').href;
    if (!url) return;

    void navigator.clipboard.writeText(url);
  }
</script>

<BubbleMenu
  {editor}
  pluginKey="link-bubble-menu"
  shouldShow={(props: ShouldShowProps) => {
    if (!props.editor.isEditable) return false;
    return props.editor.isActive('link');
  }}
  options={{
    strategy: 'fixed'
  }}
  class="ui:bg-popover ui:flex ui:h-fit ui:w-fit ui:items-center ui:gap-1 ui:rounded ui:border ui:p-1 ui:shadow-lg"
>
  <Button variant="link" {href} class="ui:max-w-80 ui:p-1" target="_blank">
    <span class="ui:w-full ui:overflow-hidden ui:text-ellipsis">
      {href}
    </span>
  </Button>
  <Button variant="ghost" title="Copy Link" size="icon" class="ui:z-50" onmousedown={copyLink}>
    <Copy />
  </Button>
  <Button
    variant="ghost"
    title="Remove Link"
    size="icon"
    onclick={() => editor.chain().focus().extendMarkRange('link').unsetLink().run()}
  >
    <Trash />
  </Button>
</BubbleMenu>
