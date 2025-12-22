<script lang="ts">
  import { openUpgradeModal } from '$lib/utils/functions/org';
  import ZapIcon from '@lucide/svelte/icons/zap';
  import { isFreePlan } from '$lib/utils/store/org';
  import * as Item from '@cio/ui/base/item';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

  interface Props {
    className?: string;
    onClick?: any;
    children?: import('svelte').Snippet;
  }

  let { className = '', onClick = () => {}, children }: Props = $props();
</script>

{#if $isFreePlan}
  <Item.Root variant="outline" size="sm" class="border-blue-700! py-2! h-fit w-full {className}">
    {#snippet child({ props })}
      <button
        {...props}
        onclick={() => {
          onClick();
          openUpgradeModal();
        }}
      >
        <Item.Media variant="icon">
          <ZapIcon class="custom size-5 text-blue-700" />
        </Item.Media>
        <Item.Content>
          <Item.Title class="text-blue-700!">
            {@render children?.()}
          </Item.Title>
        </Item.Content>
        <Item.Actions>
          <ChevronRightIcon class="text-blue-700! size-4" />
        </Item.Actions>
      </button>
    {/snippet}
  </Item.Root>
{/if}
