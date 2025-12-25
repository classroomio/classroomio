<script lang="ts">
  import { Avatar as AvatarPrimitive } from 'bits-ui';
  import { cn } from '../../tools';

  let { ref = $bindable(null), class: className, ...restProps }: AvatarPrimitive.ImageProps = $props();
</script>

<AvatarPrimitive.Image
  bind:ref
  data-slot="avatar-image"
  class={cn('ui:size-full aspect-square', className)}
  {...restProps}
/>
