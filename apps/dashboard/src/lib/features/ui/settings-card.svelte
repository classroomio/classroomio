<script lang="ts">
  import type { Snippet } from 'svelte';
  import * as Card from '@cio/ui/base/card';

  interface Props {
    title: string;
    description?: string | Snippet;
    children: Snippet;
    id?: string;
    hash?: string;
  }

  let { title, description, children, id, hash = id }: Props = $props();
</script>

<section {id} class="flex scroll-mt-24 flex-col gap-3">
  <div class="flex flex-col gap-1.5">
    <h2 class="text-lg font-semibold tracking-tight">
      {#if hash || id}
        <a href="#{hash}" class="text-inherit no-underline hover:underline">{title}</a>
      {:else}
        {title}
      {/if}
    </h2>
    {#if typeof description === 'string'}
      <p class="ui:text-muted-foreground text-sm">{description}</p>
    {:else if description}
      <p class="ui:text-muted-foreground text-sm">{@render description()}</p>
    {/if}
  </div>
  <Card.Root>
    <Card.Content>
      {@render children()}
    </Card.Content>
  </Card.Root>
</section>
