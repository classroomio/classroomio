<script lang="ts">
  import type { Editor } from '@tiptap/core';
  import { buttonVariants } from '@cio/shadcn-ui/button';
  import * as DropdownMenu from '@cio/shadcn-ui/dropdown-menu';
  import Heading from '@lucide/svelte/icons/heading';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import commands from '../../../commands/toolbar-commands.js';
  import { cn } from '../../../../../utils';
  import EdraToolTip from '../EdraToolTip.svelte';
  import Paragraph from '@lucide/svelte/icons/pilcrow';

  interface Props {
    editor: Editor;
  }

  const { editor }: Props = $props();

  const headings = commands['headings'];

  const isActive = $derived.by(() => {
    return headings.find((h) => h.isActive?.(editor)) !== undefined;
  });

  const HeadingIcon = $derived.by(() => {
    const h = headings.find((h) => h.isActive?.(editor));
    return h ? h.icon : Heading;
  });
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    <EdraToolTip tooltip="Headings">
      <div
        class={buttonVariants({
          variant: 'ghost',
          size: 'icon',
          class: cn('gap-0')
        })}
        class:bg-muted={isActive}
      >
        <HeadingIcon />
        <ChevronDown class="text-muted-foreground !size-2" />
      </div>
    </EdraToolTip>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content portalProps={{ to: undefined, disabled: true }}>
    <DropdownMenu.Item onclick={() => editor.chain().focus().setParagraph().run()}>
      <Paragraph />
      <span>Paragraph</span>
    </DropdownMenu.Item>
    {#each headings as heading (heading)}
      {@const Icon = heading.icon}
      <DropdownMenu.Item onclick={() => heading.onClick?.(editor)}>
        <Icon />
        <span>{heading.tooltip}</span>
      </DropdownMenu.Item>
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>
