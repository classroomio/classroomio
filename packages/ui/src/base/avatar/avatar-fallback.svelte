<script lang="ts">
  import { Avatar as AvatarPrimitive } from 'bits-ui';
  import { cn } from '../../tools';

  let { ref = $bindable(null), class: className, ...restProps }: AvatarPrimitive.FallbackProps = $props();
</script>

<AvatarPrimitive.Fallback
  bind:ref
  data-slot="avatar-fallback"
<<<<<<< HEAD
  class={cn('bg-muted flex size-full items-center justify-center rounded-full', className)}
=======
  class={cn('ui:bg-muted ui:flex ui:size-full ui:items-center ui:justify-center ui:rounded-full', className)}
>>>>>>> feat/release-v2
  {...restProps}
/>
