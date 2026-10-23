<script lang="ts">
  import * as Card from '@cio/ui/base/card';
  import { cn } from '@cio/ui/tools';
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    description?: string;
    class?: string;
    children?: Snippet;
  }

  let { title, description, class: className, children }: Props = $props();
</script>

<Card.Root class={cn(className)}>
  <Card.Header>
    <Card.Title>{title}</Card.Title>
    {#if description}
      <Card.Description>{description}</Card.Description>
    {/if}
  </Card.Header>
  <Card.Content>
    {@render children?.()}
  </Card.Content>
</Card.Root>
