<script lang="ts">
  import { cn } from '../../../tools';

  interface Props {
    size?: number;
    duration?: number;
    anchor?: number;
    borderWidth?: number;
    colorFrom?: string;
    colorTo?: string;
    delay?: number;
    class?: string;
  }

  let {
    size = 200,
    duration = 15,
    anchor = 90,
    borderWidth = 1.5,
    colorFrom = '#ffaa40',
    colorTo = '#9c40ff',
    delay = 0,
    class: className = ''
  }: Props = $props();
</script>

<div
  style:--border-width={borderWidth}
  style:--size={size}
  style:--color-from={colorFrom}
  style:--color-to={colorTo}
  style:--delay="{delay}s"
  style:--anchor={anchor}
  style:--duration={duration}
  class={cn('cio-marketing-border-beam', className)}
></div>
