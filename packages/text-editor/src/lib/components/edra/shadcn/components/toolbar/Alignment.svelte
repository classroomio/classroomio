<script lang="ts">
  import * as DropdownMenu from '../../../../ui/dropdown-menu/index.js';
  import commands from '../../../commands/toolbar-commands.js';
  import type { Editor } from '@tiptap/core';
  import AlignLeft from '@lucide/svelte/icons/align-left';
  import EdraToolTip from '../EdraToolTip.svelte';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import { buttonVariants } from '../../../../ui/button/index.js';
  import { cn } from '../../../../../utils';

  interface Props {
    editor: Editor;
  }
  const { editor }: Props = $props();

  const alignments = commands['alignment'];

  const isActive = $derived.by(() => {
    return alignments.find((alignment) => alignment.isActive?.(editor)) !== undefined;
  });

  const AlignMentIcon = $derived.by(() => {
    const a = alignments.find((alignment) => alignment.isActive?.(editor));
    if (a) return a.icon;
    else return AlignLeft;
  });
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    <EdraToolTip tooltip="Alignment">
      <div
        class={buttonVariants({
          variant: 'ghost',
          size: 'icon',
          class: cn('gap-0')
        })}
        class:bg-muted={isActive}
      >
        <AlignMentIcon />
        <ChevronDown class="text-muted-foreground !size-2" />
      </div>
    </EdraToolTip>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content portalProps={{ disabled: true, to: undefined }}>
    {#each alignments as alignment (alignment)}
      {@const Icon = alignment.icon}
      <DropdownMenu.Item onclick={() => alignment.onClick?.(editor)}>
        <Icon />
        <span>{alignment.tooltip}</span>
        <DropdownMenu.Shortcut>
          {alignment.shortCut}
        </DropdownMenu.Shortcut>
      </DropdownMenu.Item>
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>
