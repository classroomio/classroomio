<script lang="ts">
  import { Label } from '../label';
  import { cn } from '../../tools';
  import type { ComponentProps } from 'svelte';

  let { ref = $bindable(null), class: className, children, ...restProps }: ComponentProps<typeof Label> = $props();
</script>

<Label
  bind:ref
  data-slot="field-label"
  class={cn(
    'ui:group/field-label ui:peer/field-label ui:flex ui:w-fit ui:gap-2 ui:leading-snug ui:group-data-[disabled=true]/field:opacity-50',
    'ui:has-[>[data-slot=field]]:w-full ui:has-[>[data-slot=field]]:flex-col ui:has-[>[data-slot=field]]:rounded-md ui:has-[>[data-slot=field]]:border ui:*:data-[slot=field]:p-4',
    'ui:has-data-[state=checked]:bg-primary/5 ui:has-data-[state=checked]:border-primary ui:dark:has-data-[state=checked]:bg-primary/10',
    className
  )}
  {...restProps}
>
  {@render children?.()}
</Label>
