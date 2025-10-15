<script lang="ts">
  // import CircleCheckIcon from '@lucide/svelte/icons/circle-check';

  interface Props {
    filled?: Boolean;
    size?: number;
  }
  let { filled, size = 16 }: Props = $props();
</script>

<!-- <CircleCheckIcon
  {size}
  class={filled ? 'filled' : ''}
  fill={filled ? 'red' : 'none'}
  strokeWidth={filled ? 0 : undefined}
/> -->

<svg
  xmlns="http://www.w3.org/2000/svg"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  class="custom lucide-icon lucide lucide-circle-check {filled ? 'filled' : ''}"
  ><!----><circle cx="12" cy="12" r="10"></circle><!----><path d="m9 12 2 2 4-4"></path><!----><!----><!----></svg
>

<style>
  svg circle {
    stroke: var(--icon-stroke-color, currentColor); /* Circle border */
    fill: none; /* Circle is notsvg by default */
  }

  /* Target the path (checkmark) specifically */
  svg path {
    stroke: var(--icon-stroke-color, currentColor); /* Checkmark color */
    fill: none; /* Checkmark is not filled, just stroked */
  }

  svg.filled circle {
    fill: var(--icon-fill-color, currentColor); /* Fill the circle with color */
    stroke: var(--icon-fill-color, currentColor); /* Make the circle's border match its fill */
  }

  svg.filled path {
    stroke: white; /* Make the checkmark white so it's visible against the fill */
    fill: none; /* Ensure the checkmark path itself is not filled */
  }
</style>
