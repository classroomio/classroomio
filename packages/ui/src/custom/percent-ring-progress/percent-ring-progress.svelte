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
  const sizeClass = $derived(size === 'small' ? 'ui:size-10' : 'ui:size-14');
  const labelClass = $derived(size === 'small' ? 'ui:text-[10px]' : 'ui:text-sm');
</script>

<div class="ui:relative ui:shrink-0">
  <svg
    class="{sizeClass} ui:-rotate-90"
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
      class="ui:text-gray-200 ui:dark:text-gray-700"
    />
    <circle
      cx="50"
      cy="50"
      r={RING_RADIUS}
      fill="none"
      stroke="currentColor"
      stroke-width="8"
      stroke-linecap="round"
      class="ui:text-green-600 ui:transition-[stroke-dashoffset] ui:duration-700 ui:ease-out"
      stroke-dasharray={RING_CIRCUMFERENCE}
      stroke-dashoffset={strokeDashoffset}
    />
  </svg>
  <div class="ui:absolute ui:inset-0 ui:flex ui:flex-col ui:items-center ui:justify-center">
    <p class={labelClass}>{labelPercentage}%</p>
  </div>
</div>
