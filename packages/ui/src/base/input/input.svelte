<script lang="ts">
  import type { HTMLInputAttributes, HTMLInputTypeAttribute } from 'svelte/elements';
  import { cn, type WithElementRef } from '../../tools';

  type InputType = Exclude<HTMLInputTypeAttribute, 'file'>;

  type Props = WithElementRef<
    Omit<HTMLInputAttributes, 'type'> & ({ type: 'file'; files?: FileList } | { type?: InputType; files?: undefined })
  >;

  let {
    ref = $bindable(null),
    value = $bindable(),
    type,
    files = $bindable(),
    class: className,
    'data-slot': dataSlot = 'input',
    ...restProps
  }: Props = $props();
</script>

{#if type === 'file'}
  <input
    bind:this={ref}
    data-slot={dataSlot}
    class={cn(
      'ui:selection:bg-primary ui:dark:bg-input/30 ui:selection:text-primary-foreground ui:border-input ui:ring-offset-background ui:placeholder:text-muted-foreground ui:shadow-xs ui:flex ui:h-9 ui:w-full ui:min-w-0 ui:rounded-md ui:border ui:bg-transparent ui:px-3 ui:pt-1.5 ui:text-sm ui:font-medium ui:outline-none ui:transition-[color,box-shadow] ui:disabled:cursor-not-allowed ui:disabled:opacity-50',
      'ui:focus-visible:border-ring ui:focus-visible:ring-ring/50 ui:focus-visible:ring-[3px]',
      'ui:aria-invalid:ring-destructive/20 ui:dark:aria-invalid:ring-destructive/40 ui:aria-invalid:border-destructive',
      className
    )}
    type="file"
    bind:files
    bind:value
    {...restProps}
  />
{:else}
  <input
    bind:this={ref}
    data-slot={dataSlot}
    class={cn(
      'ui:border-input ui:bg-background ui:selection:bg-primary ui:dark:bg-input/30 ui:selection:text-primary-foreground ui:ring-offset-background ui:placeholder:text-muted-foreground ui:shadow-xs ui:flex ui:h-9 ui:w-full ui:min-w-0 ui:rounded-md ui:border ui:px-3 ui:py-1 ui:text-base ui:outline-none ui:transition-[color,box-shadow] ui:disabled:cursor-not-allowed ui:disabled:opacity-50 ui:md:text-sm',
      'ui:focus-visible:border-ring ui:focus-visible:ring-ring/50 ui:focus-visible:ring-[3px]',
      'ui:aria-invalid:ring-destructive/20 ui:dark:aria-invalid:ring-destructive/40 ui:aria-invalid:border-destructive',
      className
    )}
    {type}
    bind:value
    {...restProps}
  />
{/if}
