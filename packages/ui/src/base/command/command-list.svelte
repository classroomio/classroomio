<script lang="ts">
  import { Command as CommandPrimitive } from 'bits-ui';
  import { cn } from '../../tools';

  let { ref = $bindable(null), class: className, ...restProps }: CommandPrimitive.ListProps = $props();
</script>

<CommandPrimitive.List
  bind:ref
  data-slot="command-list"
  class={cn('ui:max-h-[300px] ui:scroll-py-1 ui:overflow-y-auto ui:overflow-x-hidden', className)}
  {...restProps}
/>
