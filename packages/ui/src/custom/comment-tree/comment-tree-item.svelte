<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    class?: string;
    children?: Snippet;
  }

  let { class: className = '', children }: Props = $props();
</script>

<div
  class="ui:group ui:relative ui:flex ui:w-full ui:flex-col ui:gap-1.5 ui:rounded-md ui:py-1 ui:transition-colors {className}"
>
  {@render children?.()}
</div>
