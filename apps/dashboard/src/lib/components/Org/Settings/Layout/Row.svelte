<script lang="ts">
  interface Props {
    id?: string;
    class?: string;
    children?: import('svelte').Snippet;
  }

  let { id, class: className = '', children }: Props = $props();
</script>

<div {id} class="lg:grid-cols-16 grid grid-cols-1 gap-5 px-3 {className}">
  {@render children?.()}
</div>
