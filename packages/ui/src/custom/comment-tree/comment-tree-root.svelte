<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    class?: string;
    children?: Snippet;
  }

  let { class: className = '', children }: Props = $props();
</script>

<div class="ui:flex ui:w-full ui:flex-col ui:gap-1.5 {className}">
  {@render children?.()}
</div>
