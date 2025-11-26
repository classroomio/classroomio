<script lang="ts">
  import { RadioGroup as RadioGroupPrimitive } from 'bits-ui';
  import CircleIcon from '@lucide/svelte/icons/circle';
  import { cn, type WithoutChildrenOrChild } from '../../tools';

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: WithoutChildrenOrChild<RadioGroupPrimitive.ItemProps> = $props();
</script>

<RadioGroupPrimitive.Item
  bind:ref
  data-slot="radio-group-item"
  class={cn(
<<<<<<< HEAD
    'border-input text-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 shadow-xs aspect-square size-4 shrink-0 rounded-full border outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
=======
    'ui:border-input ui:text-primary ui:focus-visible:border-ring ui:focus-visible:ring-ring/50 ui:aria-invalid:ring-destructive/20 ui:dark:aria-invalid:ring-destructive/40 ui:aria-invalid:border-destructive ui:dark:bg-input/30 ui:shadow-xs ui:size-4 ui:shrink-0 ui:rounded-full ui:border ui:outline-none ui:transition-[color,box-shadow] ui:focus-visible:ring-[3px] ui:disabled:cursor-not-allowed ui:disabled:opacity-50 aspect-square',
>>>>>>> feat/release-v2
    className
  )}
  {...restProps}
>
  {#snippet children({ checked })}
<<<<<<< HEAD
    <div data-slot="radio-group-indicator" class="relative flex items-center justify-center">
      {#if checked}
        <CircleIcon class="fill-primary absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2" />
=======
    <div data-slot="radio-group-indicator" class="ui:relative ui:flex ui:items-center ui:justify-center">
      {#if checked}
        <CircleIcon
          class="ui:fill-primary ui:absolute ui:left-1/2 ui:top-1/2 ui:size-2 ui:-translate-x-1/2 ui:-translate-y-1/2"
        />
>>>>>>> feat/release-v2
      {/if}
    </div>
  {/snippet}
</RadioGroupPrimitive.Item>
