<script lang="ts">
  const RING_RADIUS = 45;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

  interface Props {
    /** Progress value from 0 to 100 */
    value: number;
    size?: 'small' | 'default';
  }

  let { value, size = 'small' }: Props = $props();

  const clampedValue = $derived(Math.max(0, Math.min(100, value)));
  const labelPercentage = $derived(Math.round(clampedValue));
  const strokeDashoffset = $derived(RING_CIRCUMFERENCE * (1 - clampedValue / 100));
  const sizeClass = $derived(size === 'small' ? 'size-10' : 'size-14');
  const labelClass = $derived(size === 'small' ? 'text-[10px]' : 'text-sm');
</script>

<div class="relative shrink-0">
  <svg
    class="{sizeClass} -rotate-90"
    style="transform-box: fill-box; transform-origin: center;"
    viewBox="0 0 100 100"
    aria-hidden="true"
  >
    <circle
      cx="50"
      cy="50"
      r={RING_RADIUS}
      fill="none"
      stroke="currentColor"
      stroke-width="8"
      class="text-gray-200 dark:text-gray-700"
    />
    <circle
      cx="50"
      cy="50"
      r={RING_RADIUS}
      fill="none"
      stroke="currentColor"
      stroke-width="8"
      stroke-linecap="round"
      class="text-green-600 transition-[stroke-dashoffset] duration-700 ease-out"
      stroke-dasharray={RING_CIRCUMFERENCE}
      stroke-dashoffset={strokeDashoffset}
    />
  </svg>
  <div class="absolute inset-0 flex flex-col items-center justify-center">
    <p class={labelClass}>{labelPercentage}%</p>
  </div>
</div>
