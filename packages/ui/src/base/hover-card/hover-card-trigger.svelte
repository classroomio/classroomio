<script lang="ts">
  import { LinkPreview as HoverCardPrimitive } from 'bits-ui';
  import { cn } from '../../tools';

  let { ref = $bindable(null), class: className, ...restProps }: HoverCardPrimitive.TriggerProps = $props();
</script>

<HoverCardPrimitive.Trigger
  bind:ref
  data-slot="hover-card-trigger"
  class={cn('ui:cursor-pointer', className)}
  {...restProps}
/>
