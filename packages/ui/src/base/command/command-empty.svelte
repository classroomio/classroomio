<script lang="ts">
  import { Command as CommandPrimitive } from 'bits-ui';
  import { cn } from '../../tools';

  let { ref = $bindable(null), class: className, ...restProps }: CommandPrimitive.EmptyProps = $props();
</script>

<CommandPrimitive.Empty
  bind:ref
  data-slot="command-empty"
<<<<<<< HEAD
  class={cn('py-6 text-center text-sm', className)}
=======
  class={cn('ui:py-6 ui:text-center ui:text-sm', className)}
>>>>>>> feat/release-v2
  {...restProps}
/>
