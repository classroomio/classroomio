<script lang="ts">
  import { Tabs as TabsPrimitive } from 'bits-ui';
  import { cn } from '../../tools';

  let { ref = $bindable(null), class: className, ...restProps }: TabsPrimitive.ContentProps = $props();
</script>

<TabsPrimitive.Content
  bind:ref
  data-slot="tabs-content"
  class={cn('ui:flex-1 ui:outline-none', className)}
  {...restProps}
/>
