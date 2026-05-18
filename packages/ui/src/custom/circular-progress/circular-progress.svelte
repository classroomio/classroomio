<script lang="ts">
  import { cn } from '../../utils';

  interface Props {
    /** Progress value from 0 to 100 */
    value: number;
    /** Size of the circular progress in pixels */
    size?: number;
    /** Stroke width of the progress ring */
    strokeWidth?: number;
    /** Additional CSS classes */
    class?: string;
    /** Color class for the progress stroke (e.g. 'stroke-primary') */
    progressClass?: string;
    /** Color class for the background track (e.g. 'stroke-muted') */
    trackClass?: string;
  }

  let {
    value,
    size = 20,
    strokeWidth = 2,
    class: className = '',
    progressClass = 'stroke-primary',
    trackClass = 'stroke-muted'
  }: Props = $props();

  const radius = $derived((size - strokeWidth) / 2);
  const circumference = $derived(2 * Math.PI * radius);
  const clampedValue = $derived(Math.max(0, Math.min(100, value)));
  const offset = $derived(circumference - (clampedValue / 100) * circumference);
  const center = $derived(size / 2);
</script>

<svg
  width={size}
  height={size}
  viewBox={`0 0 ${size} ${size}`}
  class={cn('shrink-0 -rotate-90', className)}
  aria-valuenow={clampedValue}
  aria-valuemin={0}
  aria-valuemax={100}
  role="progressbar"
>
  <circle
    cx={center}
    cy={center}
    r={radius}
    fill="none"
    stroke-width={strokeWidth}
    class={cn('transition-all', trackClass)}
  />
  <circle
    cx={center}
    cy={center}
    r={radius}
    fill="none"
    stroke-width={strokeWidth}
    stroke-dasharray={circumference}
    stroke-dashoffset={offset}
    stroke-linecap="round"
    class={cn('transition-all duration-300', progressClass)}
  />
</svg>
