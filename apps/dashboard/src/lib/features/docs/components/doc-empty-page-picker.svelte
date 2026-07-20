<script lang="ts">
  import FileIcon from '@lucide/svelte/icons/file';
  import LayoutTemplateIcon from '@lucide/svelte/icons/layout-template';
  import ListTreeIcon from '@lucide/svelte/icons/list-tree';
  import UploadIcon from '@lucide/svelte/icons/upload';
  import type { Component } from 'svelte';
  import { cn } from '@cio/ui/tools';
  import { t } from '$lib/utils/functions/translations';

  export type NoteEmptyPageOption = 'empty' | 'table_of_contents' | 'templates' | 'import';

  interface PickerItem {
    id: NoteEmptyPageOption;
    label: string;
    icon: Component;
  }

  interface Props {
    onSelect: (option: NoteEmptyPageOption) => void;
    class?: string;
  }

  let { onSelect, class: className = '' }: Props = $props();

  const items: PickerItem[] = [
    { id: 'empty', label: 'docs.empty_page.empty', icon: FileIcon },
    { id: 'table_of_contents', label: 'docs.empty_page.with_table_of_contents', icon: ListTreeIcon },
    { id: 'templates', label: 'docs.empty_page.templates', icon: LayoutTemplateIcon },
    { id: 'import', label: 'docs.empty_page.import', icon: UploadIcon }
  ];

  let selectedIndex = $state(0);

  function selectItem(index: number) {
    selectedIndex = index;
    onSelect(items[index].id);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      selectedIndex = (selectedIndex + 1) % items.length;
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      selectedIndex = (selectedIndex - 1 + items.length) % items.length;
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      onSelect(items[selectedIndex].id);
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class={cn('flex flex-col gap-3 py-1', className)}>
  <p class="ui:text-muted-foreground text-sm leading-relaxed">
    {$t('docs.empty_page.hint')}
  </p>

  <ul class="flex flex-col gap-0.5" role="listbox" aria-label={$t('docs.empty_page.aria_label')}>
    {#each items as item, index (item.id)}
      {@const Icon = item.icon}
      <li role="presentation">
        <button
          type="button"
          role="option"
          aria-selected={selectedIndex === index}
          class={cn(
            'flex w-full max-w-md items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
            selectedIndex === index ? 'ui:bg-muted/70' : 'hover:ui:bg-muted/50'
          )}
          onclick={() => selectItem(index)}
        >
          <Icon size={18} class="ui:text-muted-foreground shrink-0" />
          <span class="ui:text-foreground/80">{$t(item.label)}</span>
        </button>
      </li>
    {/each}
  </ul>
</div>
