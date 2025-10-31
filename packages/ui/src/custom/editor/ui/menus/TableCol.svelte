<script lang="ts">
  import type { ShouldShowProps } from '../../types';
  import { type Editor } from '@tiptap/core';
  import ArrowLeftFromLine from '@lucide/svelte/icons/arrow-left-from-line';
  import ArrowRightFromLine from '@lucide/svelte/icons/arrow-right-from-line';

  import Trash from '@lucide/svelte/icons/trash';
  import { Button } from '$src/base/button';
  import { isColumnGripSelected } from '../../extensions/table/utils';
  import EdraToolTip from '../components/EdraToolTip.svelte';
  import BubbleMenu from '../../components/BubbleMenu.svelte';

  interface Props {
    editor: Editor;
  }

  const { editor }: Props = $props();
</script>

<BubbleMenu
  {editor}
  pluginKey="table-col-menu"
  shouldShow={(props: ShouldShowProps) => {
    if (!props.editor.isEditable) return false;
    if (!props.state) {
      return false;
    }
    return isColumnGripSelected({
      editor: props.editor,
      view: props.view,
      state: props.state,
      from: props.from
    });
  }}
  class="bg-background flex h-fit w-fit items-center gap-1 rounded border shadow-lg"
>
  <EdraToolTip tooltip="Add Column After">
    <Button variant="ghost" size="icon" onclick={() => editor.chain().focus().addColumnAfter().run()}>
      <ArrowRightFromLine />
    </Button>
  </EdraToolTip>
  <EdraToolTip tooltip="Add Column Before">
    <Button variant="ghost" size="icon" onclick={() => editor.chain().focus().addColumnBefore().run()}>
      <ArrowLeftFromLine />
    </Button>
  </EdraToolTip>

  <EdraToolTip tooltip="Delete This Column">
    <Button variant="ghost" size="icon" onclick={() => editor.chain().focus().deleteColumn().run()}>
      <Trash />
    </Button>
  </EdraToolTip>
</BubbleMenu>
