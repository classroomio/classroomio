<script lang="ts">
  import type { ShouldShowProps } from '../../types';
  import BubbleMenu from '../../components/BubbleMenu.svelte';
  import type { Editor } from '@tiptap/core';
  import { Button } from '@cio/shadcn-ui/button';
  import Copy from '@lucide/svelte/icons/copy';
  import Trash from '@lucide/svelte/icons/trash';

  interface Props {
    editor: Editor;
  }

  const { editor }: Props = $props();

  let link = $derived.by(() => editor.getAttributes('link').href);
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
  class="bg-popover flex h-fit w-fit items-center gap-1 rounded border p-1 shadow-lg"
>
  <Button variant="link" href={link} class="max-w-80 p-1" target="_blank">
    <span class="w-full overflow-hidden text-ellipsis">
      {link}
    </span>
  </Button>
  <Button
    variant="ghost"
    title="Copy Link"
    size="icon"
    class="z-50"
    onclick={() => {
      navigator.clipboard.writeText(link);
    }}
  >
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
