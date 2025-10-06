<script lang="ts">
  interface Props {
    className?: string;
  }

  let { className = '' }: Props = $props();
</script>

<svg
  width="24"
  height="24"
  class="h-6 w-6 {className}"
  fill="currentColor"
  viewBox="0 0 20 20"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    fill-rule="evenodd"
    d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
    clip-rule="evenodd"
  />
</svg>
