<script lang="ts">
  import { cn } from '../../tools';
  import type { ImageCropperControlsProps } from './types';

  let { ref = $bindable(null), class: className, children, ...rest }: ImageCropperControlsProps = $props();
</script>

<div
  {...rest}
  bind:this={ref}
  class={cn('ui:flex ui:w-full ui:place-items-center ui:justify-center ui:gap-2', className)}
>
  {@render children?.()}
</div>
