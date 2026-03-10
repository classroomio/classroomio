<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
    description?: string;
    children?: Snippet;
  }

  let { title = '', description = '', children }: Props = $props();
</script>

<section class="ui:space-y-4">
  {#if title}
    <header class="ui:space-y-1">
      <h2 class="ui:text-lg ui:font-semibold">{title}</h2>
      {#if description}
        <p class="ui:text-muted-foreground ui:text-sm">{description}</p>
      {/if}
    </header>
  {/if}

  <div class="ui:space-y-3">
    {@render children?.()}
  </div>
</section>
