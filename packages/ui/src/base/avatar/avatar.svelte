<script lang="ts">
  import { Avatar as AvatarPrimitive } from 'bits-ui';
  import { cn } from '../../tools';

  let {
    ref = $bindable(null),
    loadingStatus = $bindable('loading'),
    class: className,
    ...restProps
  }: AvatarPrimitive.RootProps = $props();
</script>

<AvatarPrimitive.Root
  bind:ref
  bind:loadingStatus
  data-slot="avatar"
<<<<<<< HEAD
  class={cn('relative flex size-8 shrink-0 overflow-hidden rounded-full', className)}
=======
  class={cn('ui:relative ui:flex ui:size-8 ui:shrink-0 ui:overflow-hidden ui:rounded-full', className)}
>>>>>>> feat/release-v2
  {...restProps}
/>
