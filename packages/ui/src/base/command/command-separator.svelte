<script lang="ts">
  import { Command as CommandPrimitive } from 'bits-ui';
  import { cn } from '../../tools';

  let { ref = $bindable(null), class: className, ...restProps }: CommandPrimitive.SeparatorProps = $props();
</script>

<CommandPrimitive.Separator
  bind:ref
  data-slot="command-separator"
  class={cn('ui:bg-border ui:-mx-1 ui:h-px', className)}
  {...restProps}
/>
