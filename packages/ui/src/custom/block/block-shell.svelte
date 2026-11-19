<script lang="ts">
  import type { Snippet } from 'svelte';
  import { dragHandle } from 'svelte-dnd-action';
  import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
  import MoreHorizontalIcon from '@lucide/svelte/icons/more-horizontal';
  import * as DropdownMenu from '../../base/dropdown-menu';
  import { cn } from '../../tools';
  import type { BlockShellMenuItem } from './types';

  interface Props {
    blockId: string;
    label: string;
    badge?: string;
    editable?: boolean;
    highlighted?: boolean;
    draggable?: boolean;
    dragLabel?: string;
    actionsLabel?: string;
    menuItems?: BlockShellMenuItem[];
    children: Snippet;
  }

  let {
    blockId,
    label,
    badge,
    editable = false,
    highlighted = false,
    draggable = true,
    dragLabel,
    actionsLabel,
    menuItems = [],
    children
  }: Props = $props();
</script>

<section
  data-block-item
  data-block-id={blockId}
  class={cn(
    'ui:group/block ui:relative ui:rounded-xl ui:px-3 ui:transition-colors',
    editable ? 'ui:bg-muted ui:pb-3' : 'ui:bg-card',
    highlighted && 'ui:bg-primary/5 ui:ring-primary/30 ui:ring-2'
  )}
>
  {#if editable}
    <div class="ui:flex ui:items-center ui:gap-2 ui:px-1 ui:py-1">
      {#if draggable}
        <div
          use:dragHandle
          class="ui:text-muted-foreground ui:flex ui:size-6 ui:shrink-0 ui:cursor-grab ui:items-center ui:justify-center ui:rounded-md ui:opacity-50 ui:transition ui:group-hover/block:opacity-100 ui:active:cursor-grabbing"
          aria-label={dragLabel}
          title={dragLabel}
        >
          <GripVerticalIcon size={14} />
        </div>
      {/if}

      <span class="ui:text-muted-foreground ui:text-xs ui:font-semibold ui:tracking-wide ui:uppercase">{label}</span>

      {#if badge}
        <span
          class="ui:bg-muted ui:text-muted-foreground ui:rounded-full ui:px-2 ui:py-0.5 ui:text-[10px] ui:font-semibold ui:tracking-wide ui:uppercase"
        >
          {badge}
        </span>
      {/if}

      {#if menuItems.length > 0}
        <div class="ui:ml-auto">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger
              class="ui:text-muted-foreground ui:hover:bg-muted ui:hover:text-foreground ui:focus-visible:ring-ring ui:flex ui:size-7 ui:items-center ui:justify-center ui:rounded-md ui:opacity-60 ui:transition ui:group-hover/block:opacity-100 ui:focus-visible:ring-2 ui:focus-visible:outline-none"
              aria-label={actionsLabel}
            >
              <MoreHorizontalIcon size={16} />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              {#each menuItems as item (item.label)}
                {#if item.icon}
                  {@const ItemIcon = item.icon}
                  <DropdownMenu.Item
                    disabled={item.disabled}
                    variant={item.destructive ? 'destructive' : 'default'}
                    onSelect={item.onSelect}
                  >
                    <ItemIcon size={14} />
                    {item.label}
                  </DropdownMenu.Item>
                {:else}
                  <DropdownMenu.Item
                    disabled={item.disabled}
                    variant={item.destructive ? 'destructive' : 'default'}
                    onSelect={item.onSelect}
                  >
                    {item.label}
                  </DropdownMenu.Item>
                {/if}
              {/each}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      {/if}
    </div>
  {/if}

  <div class={editable ? 'ui:px-1' : ''}>
    {@render children()}
  </div>
</section>
