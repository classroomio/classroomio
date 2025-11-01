<script lang="ts">
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
</script>

<p class="font-bold dark:text-white">
  {@render children?.()}
</p>
