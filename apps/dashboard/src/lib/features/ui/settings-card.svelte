<script lang="ts">
  import type { Snippet } from 'svelte';
  import * as Card from '@cio/ui/base/card';

  interface Props {
    title: string;
    description?: string | Snippet;
    children: Snippet;
    id?: string;
  }

  let { title, description, children, id }: Props = $props();
</script>

<section {id} class="flex flex-col gap-3">
  <div class="flex flex-col gap-1.5">
    <h2 class="text-lg font-semibold tracking-tight">{title}</h2>
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
