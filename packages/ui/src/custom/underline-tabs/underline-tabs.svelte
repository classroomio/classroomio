<script lang="ts">
  import { Tabs as TabsPrimitive } from 'bits-ui';
  import { cn } from '../../tools';
  import { useUnderlineTabs } from './underline-tabs.svelte.js';
  import { box } from 'svelte-toolbelt';

  const uid = $props.id();

  let {
    ref = $bindable(null),
    value = $bindable(''),
    id = uid,
    class: className,
    ...restProps
  }: Omit<TabsPrimitive.RootProps, 'orientation' | 'id'> & { id?: string } = $props();

  useUnderlineTabs({
    value: box.with(
      () => value,
      (v) => (value = v)
    ),
    id: box.with(() => id)
  });
</script>

<TabsPrimitive.Root
  bind:ref
  bind:value
  orientation="horizontal"
  data-slot="underline-tabs"
  class={cn('ui:flex ui:flex-col ui:gap-2', className)}
  {...restProps}
/>
