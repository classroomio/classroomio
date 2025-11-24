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
  class={cn('ui:relative ui:flex ui:size-8 ui:shrink-0 ui:overflow-hidden ui:rounded-full', className)}
  {...restProps}
/>
