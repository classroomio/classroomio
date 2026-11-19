<script lang="ts">
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import type { Snippet } from 'svelte';
  import { Button } from '../../../../base/button';
  import * as Collapsible from '../../../../base/collapsible';

  interface Props {
    label: string;
    open?: boolean;
    children: Snippet;
  }

  let { label, open = $bindable(false), children }: Props = $props();
</script>

<Collapsible.Root bind:open data-testid="math-more-options">
  <Collapsible.Trigger>
    {#snippet child({ props })}
      <Button {...props} type="button" variant="ghost" size="sm" class="ui:text-muted-foreground">
        {label}
        <ChevronDownIcon class={open ? 'ui:size-4 ui:rotate-180' : 'ui:size-4'} />
      </Button>
    {/snippet}
  </Collapsible.Trigger>
  <Collapsible.Content class="ui:space-y-4 ui:pt-3">
    {@render children()}
  </Collapsible.Content>
</Collapsible.Root>
