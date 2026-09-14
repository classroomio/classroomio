<script lang="ts" module>
  import type { Component } from 'svelte';

  export type ComboButtonItem = {
    /** Stable key, used for the `{#each}` and as a test-id suffix. */
    id: string;
    label: string;
    /** Optional lucide icon component. */
    icon?: Component<{ size?: number | string; class?: string }>;
    /** Shown under the label, e.g. why the item is unavailable. */
    description?: string;
    disabled?: boolean;
    destructive?: boolean;
    onSelect: () => void | Promise<void>;
  };
</script>

<script lang="ts">
  import * as ButtonGroup from '../../base/button-group';
  import * as DropdownMenu from '../../base/dropdown-menu';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import { Button } from '../../base/button';
  import type { ButtonVariant } from '../../base/button';

  interface Props {
    /** The primary half. Label it with the action it performs, not a category. */
    label: string;
    items: ComboButtonItem[];
    icon?: Component<{ size?: number | string; class?: string }>;
    variant?: ButtonVariant;
    size?: 'sm' | 'default' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    /** Accessible name for the chevron, which has no visible text. */
    menuLabel: string;
    align?: 'start' | 'center' | 'end';
    testId?: string;
    onSelect: () => void | Promise<void>;
  }

  let {
    label,
    items,
    icon: Icon,
    variant = 'outline',
    size = 'sm',
    disabled = false,
    loading = false,
    menuLabel,
    align = 'end',
    testId,
    onSelect
  }: Props = $props();

  const iconSize = $derived(size === 'lg' ? 18 : 16);
  const triggerSize = $derived(size === 'sm' ? 'icon-sm' : 'icon');
</script>

<ButtonGroup.Root>
  <Button {variant} {size} {disabled} {loading} {testId} onclick={onSelect}>
    {#if Icon && !loading}
      <Icon size={iconSize} />
    {/if}
    {label}
  </Button>

  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        <Button
          {...props}
          type="button"
          {variant}
          size={triggerSize}
          disabled={disabled || loading}
          aria-label={menuLabel}
          testId={testId ? `${testId}-menu` : undefined}
        >
          <ChevronDownIcon size={iconSize} />
        </Button>
      {/snippet}
    </DropdownMenu.Trigger>

    <DropdownMenu.Content {align} class="ui:w-56">
      {#each items as item (item.id)}
        <DropdownMenu.Item
          disabled={item.disabled}
          class={item.destructive ? 'ui:text-destructive ui:focus:text-destructive' : undefined}
          onSelect={item.onSelect}
        >
          {#if item.icon}
            <item.icon size={16} />
          {/if}
          <span class="ui:flex ui:flex-col">
            <span>{item.label}</span>
            {#if item.description}
              <span class="ui:text-muted-foreground ui:text-xs">{item.description}</span>
            {/if}
          </span>
        </DropdownMenu.Item>
      {/each}
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</ButtonGroup.Root>
