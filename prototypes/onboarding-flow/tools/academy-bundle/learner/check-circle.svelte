<script lang="ts">
  /* features/ui/icons/circle-check-icon.svelte */
  interface Props {
    filled?: boolean;
    size?: number;
  }

  let { filled = false, size = 16 }: Props = $props();
</script>

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
  class="shrink-0 {filled ? 'ui:text-primary' : ''}"
>
  <circle cx="12" cy="12" r="10" fill={filled ? 'currentColor' : 'none'}></circle>
  <path d="m9 12 2 2 4-4" stroke={filled ? 'white' : 'currentColor'}></path>
</svg>
