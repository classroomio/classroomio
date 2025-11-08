<script lang="ts">
  import { Button, buttonVariants } from '$src/base/button';
  import * as Popover from '$src/base/popover';
  import type { Editor } from '@tiptap/core';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import { cn } from '$src/tools';
  import EdraToolTip from '../EdraToolTip.svelte';

  interface Props {
    class?: string;
    editor: Editor;
  }
  const { class: className = '', editor }: Props = $props();

  const colors = [
    { label: 'Default', value: '' },
    { label: 'Blue', value: '#0000FF' },
    { label: 'Brown', value: '#A52A2A' },
    { label: 'Green', value: '#008000' },
    { label: 'Grey', value: '#808080' },
    { label: 'Orange', value: '#FFA500' },
    { label: 'Pink', value: '#FFC0CB' },
    { label: 'Purple', value: '#800080' },
    { label: 'Red', value: '#FF0000' },
    { label: 'Yellow', value: '#FFFF00' }
  ];

  const currentColor = $derived.by(() => editor.getAttributes('textStyle').color);
  const currentHighlight = $derived.by(() => editor.getAttributes('highlight').color);
</script>

<Popover.Root>
  <Popover.Trigger>
    <EdraToolTip tooltip="Quick Colors">
      <div
        class={buttonVariants({
          variant: 'ghost',
          size: 'icon',
          class: cn('gap-0.5', className)
        })}
        style={`color: ${currentColor}; background-color: ${currentHighlight}50;`}
      >
        <span>A</span>
        <ChevronDown class="text-muted-foreground !size-2" />
      </div>
    </EdraToolTip>
  </Popover.Trigger>
  <Popover.Content class="size-fit shadow-lg" portalProps={{ disabled: true, to: undefined }}>
    <div class="text-muted-foreground my-2 text-xs">Text Colors</div>
    <div class="grid grid-cols-5 gap-2">
      {#each colors as color (color)}
        <Button
          variant="ghost"
          class={cn(
            `size-6 border-0 p-0 font-normal`,
            editor.isActive('textStyle', { color: color.value }) && 'border-2 font-extrabold',
            color.value === '' && 'border'
          )}
          style={`color: ${color.value}; background-color: ${color.value}50; border-color: ${color.value};`}
          title={color.label}
          onclick={() => {
            if (color.value === '' || color.label === 'Default') editor.chain().focus().unsetColor().run();
            else
              editor
                .chain()
                .focus()
                .setColor(currentColor === color.value ? '' : color.value)
                .run();
          }}
        >
          A
        </Button>
      {/each}
    </div>
    <div class="text-muted-foreground my-2 text-xs">Highlight Colors</div>
    <div class="grid grid-cols-5 gap-2">
      {#each colors as color (color)}
        <Button
          variant="ghost"
          class={cn(
            `size-6 border-0 p-0 font-normal`,
            editor.isActive('highlight', { color: color.value }) && 'border-2',
            color.value === '' && 'border'
          )}
          style={`background-color: ${color.value}50; border-color: ${color.value};`}
          title={color.label}
          onclick={() => {
            if (color.value === '' || color.label === 'Default') editor.chain().focus().unsetHighlight().run();
            else editor.chain().focus().toggleHighlight({ color: color.value }).run();
          }}>A</Button
        >
      {/each}
    </div>
  </Popover.Content>
</Popover.Root>
