<script lang="ts">
  import { Checkbox as CheckboxPrimitive } from 'bits-ui';
  import CheckIcon from '@lucide/svelte/icons/check';
  import MinusIcon from '@lucide/svelte/icons/minus';
  import { cn, type WithoutChildrenOrChild } from '../../tools';

  let {
    ref = $bindable(null),
    checked = $bindable(false),
    indeterminate = $bindable(false),
    class: className,
    ...restProps
  }: WithoutChildrenOrChild<CheckboxPrimitive.RootProps> = $props();
</script>

<CheckboxPrimitive.Root
  bind:ref
  data-slot="checkbox"
  class={cn(
<<<<<<< HEAD
    'border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive shadow-xs peer flex size-4 shrink-0 items-center justify-center rounded-[4px] border outline-none transition-shadow focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
=======
    'ui:border-input ui:dark:bg-input/30 ui:data-[state=checked]:bg-primary ui:data-[state=checked]:text-primary-foreground ui:dark:data-[state=checked]:bg-primary ui:data-[state=checked]:border-primary ui:focus-visible:border-ring ui:focus-visible:ring-ring/50 ui:aria-invalid:ring-destructive/20 ui:dark:aria-invalid:ring-destructive/40 ui:aria-invalid:border-destructive ui:shadow-xs ui:flex ui:size-4 ui:shrink-0 ui:items-center ui:justify-center ui:rounded-[4px] ui:border ui:outline-none ui:transition-shadow ui:focus-visible:ring-[3px] ui:disabled:cursor-not-allowed ui:disabled:opacity-50 peer',
>>>>>>> feat/release-v2
    className
  )}
  bind:checked
  bind:indeterminate
  {...restProps}
>
  {#snippet children({ checked, indeterminate })}
<<<<<<< HEAD
    <div data-slot="checkbox-indicator" class="text-current transition-none">
      {#if checked}
        <CheckIcon class="size-3.5" />
      {:else if indeterminate}
        <MinusIcon class="size-3.5" />
=======
    <div data-slot="checkbox-indicator" class="ui:text-current ui:transition-none">
      {#if checked}
        <CheckIcon class="ui:size-3.5" />
      {:else if indeterminate}
        <MinusIcon class="ui:size-3.5" />
>>>>>>> feat/release-v2
      {/if}
    </div>
  {/snippet}
</CheckboxPrimitive.Root>
