<script lang="ts">
  import Button from '../../../../ui/button/button.svelte';
  import * as DropdownMenu from '../../../../ui/dropdown-menu/index.js';
  import { Editor } from '@tiptap/core';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import { cn } from '../../../../../utils';
  import EdraToolTip from '../EdraToolTip.svelte';

  interface Props {
    class?: string;
    editor: Editor;
  }

  const { class: className = '', editor }: Props = $props();

  const FONT_SIZE = [
    { label: 'Tiny', value: '0.7rem' },
    { label: 'Smaller', value: '0.75rem' },
    { label: 'Small', value: '0.9rem' },
    { label: 'Default', value: '' },
    { label: 'Large', value: '1.25rem' },
    { label: 'Extra Large', value: '1.5rem' }
  ];

  let currentSize = $derived.by(() => editor.getAttributes('textStyle').fontSize || '');

  const currentLabel = $derived.by(() => {
    const l = FONT_SIZE.find((f) => f.value === currentSize);
    if (l) return l.label.split(' ')[0];
    return 'Medium';
  });
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    <EdraToolTip tooltip="Font Size">
      <Button variant="ghost" class={cn('gap-0.5 !px-2', className)}>
        <span>{currentLabel}</span>
        <ChevronDown class="text-muted-foreground !size-2" />
      </Button>
    </EdraToolTip>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content class="h-fit w-fit" portalProps={{ disabled: true, to: undefined }}>
    {#each FONT_SIZE as fontSize (fontSize)}
      <DropdownMenu.Item
        onclick={() => {
          editor.chain().focus().setFontSize(fontSize.value).run();
        }}
        style={`font-size: ${fontSize.value}`}>{fontSize.label}</DropdownMenu.Item
      >
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>
