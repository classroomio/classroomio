<script lang="ts">
  import { Separator } from '../separator';
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { Snippet } from 'svelte';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    children?: Snippet;
  } = $props();

  const hasContent = $derived(!!children);
</script>

<div
  bind:this={ref}
  data-slot="field-separator"
  data-content={hasContent}
  class={cn('ui:relative ui:-my-2 ui:h-5 ui:text-sm ui:group-data-[variant=outline]/field-group:-mb-2', className)}
  {...restProps}
>
  <Separator class="ui:absolute ui:inset-0 ui:top-1/2" />
  {#if children}
    <span
      class="ui:bg-background ui:text-muted-foreground ui:relative ui:mx-auto ui:block ui:w-fit ui:px-2"
      data-slot="field-separator-content"
    >
      {@render children()}
    </span>
  {/if}
</div>
