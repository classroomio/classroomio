<script lang="ts">
  import * as InputGroup from '../../base/input-group';
  import type { ComponentProps } from 'svelte';
  import { cn } from '../../tools';

  interface Props {
    placeholder?: string;
    value?: string;
    class?: string;
    disabled?: boolean;
    prefix?: string;
    suffix?: string;
    /** `tray` renders the prefix and suffix as shaded monospace trays on a taller field. */
    variant?: 'default' | 'tray';
  }

  let {
    placeholder = 'example.com',
    value = $bindable(''),
    class: className = '',
    disabled = false,
    prefix = 'https://',
    suffix = '.com',
    variant = 'default',
    ...restProps
  }: Props & Omit<ComponentProps<typeof InputGroup.Root>, 'class' | 'children'> = $props();

  const isTray = $derived(variant === 'tray');
  const trayAddonClass = 'ui:self-stretch ui:bg-muted ui:border-border ui:px-3';
  const trayTextClass = 'ui:font-mono ui:text-[13px] ui:font-normal';
</script>

<InputGroup.Root
  class={cn('ui:w-full', isTray && 'ui:h-11 ui:overflow-hidden', className)}
  data-slot="domain-input"
  data-variant={variant}
>
  {#if prefix}
    <InputGroup.Addon class={isTray ? cn(trayAddonClass, 'ui:border-r') : undefined}>
      <InputGroup.Text class={isTray ? trayTextClass : undefined}>{prefix}</InputGroup.Text>
    </InputGroup.Addon>
  {/if}
  <InputGroup.Input
    {...restProps}
    {placeholder}
    bind:value
    {disabled}
    class={isTray ? 'ui:px-3 ui:text-[15px]' : '!ps-0.5'}
  />
  {#if suffix}
    <InputGroup.Addon align="inline-end" class={isTray ? cn(trayAddonClass, 'ui:border-l') : undefined}>
      <InputGroup.Text class={isTray ? trayTextClass : undefined}>{suffix}</InputGroup.Text>
    </InputGroup.Addon>
  {/if}
</InputGroup.Root>
