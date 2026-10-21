<script lang="ts">
  import type { Editor } from '@tiptap/core';
  import { onMount } from 'svelte';
  import * as DropdownMenu from '$src/base/dropdown-menu';
  import { buttonVariants } from '$src/base/button';
  import LayoutGrid from '@lucide/svelte/icons/layout-grid';
  import { cn } from '$src/tools';
  import EdraToolTip from '../EdraToolTip.svelte';
  import { CALLOUT_OPTIONS, isCalloutStyle, type CalloutStyle } from '../../../extensions/callout/callout';

  interface Props {
    editor: Editor;
  }

  const { editor }: Props = $props();

  const DEFAULT_VALUE = 'default';

  const dotClass: Record<CalloutStyle, string> = {
    info: 'ui:bg-[oklch(0.5_0.17_250)]',
    tip: 'ui:bg-[oklch(0.45_0.14_160)]',
    important: 'ui:bg-primary',
    warning: 'ui:bg-[oklch(0.55_0.2_25)]',
    highlight: 'ui:bg-[oklch(0.45_0.13_95)]'
  };

  function readStyle() {
    if (editor.isDestroyed || !editor.isActive('callout')) return DEFAULT_VALUE;

    const style = editor.getAttributes('callout').style;
    return typeof style === 'string' && isCalloutStyle(style) ? style : DEFAULT_VALUE;
  }

  let activeStyle = $state(readStyle());

  onMount(() => {
    const sync = () => {
      activeStyle = readStyle();
    };

    editor.on('transaction', sync);

    return () => {
      editor.off('transaction', sync);
    };
  });

  function selectStyle(next: string) {
    if (next === DEFAULT_VALUE) {
      editor.chain().focus().setCallout(null).run();
      return;
    }

    if (!isCalloutStyle(next)) return;

    editor.chain().focus().setCallout(next).run();
  }
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger data-testid="editor-callout-style" aria-label="Callout style">
    <EdraToolTip tooltip="Callout style">
      <div
        class={buttonVariants({
          variant: 'ghost',
          size: 'icon',
          class: cn(activeStyle !== DEFAULT_VALUE && 'ui:bg-muted')
        })}
      >
        <LayoutGrid class="custom" />
      </div>
    </EdraToolTip>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content portalProps={{ to: undefined, disabled: true }} class="ui:min-w-44">
    <DropdownMenu.RadioGroup value={activeStyle} onValueChange={selectStyle}>
      <DropdownMenu.RadioItem value={DEFAULT_VALUE}>
        <span class="ui:bg-muted-foreground ui:size-2 ui:shrink-0 ui:rounded-full"></span>
        <span>Default</span>
      </DropdownMenu.RadioItem>
      {#each CALLOUT_OPTIONS as option (option.id)}
        <DropdownMenu.RadioItem value={option.id}>
          <span class={cn('ui:size-2 ui:shrink-0 ui:rounded-full', dotClass[option.id])}></span>
          <span>{option.label}</span>
        </DropdownMenu.RadioItem>
      {/each}
    </DropdownMenu.RadioGroup>
  </DropdownMenu.Content>
</DropdownMenu.Root>
