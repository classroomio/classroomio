<script lang="ts">
  import { openUpgradeModal } from '$lib/utils/functions/org';
  import { isFreePlan } from '$lib/utils/store/org';
  import * as Item from '@cio/ui/base/item';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import { PremiumIcon, HoverableItem } from '@cio/ui/custom/moving-icons';

  interface Props {
    className?: string;
    onClick?: any;
    children?: import('svelte').Snippet;
  }

  let { className = '', onClick = () => {}, ...restProps }: Props = $props();
</script>

{#if $isFreePlan}
  <HoverableItem>
    {#snippet children(isHovered)}
      <Item.Root variant="outline" size="sm" class="h-fit w-full border-blue-700! py-2! {className}">
        {#snippet child({ props })}
          <button
            {...props}
            onclick={() => {
              onClick();
              openUpgradeModal();
            }}
          >
            <Item.Media variant="icon">
              <PremiumIcon {isHovered} size={20} class="text-blue-700 dark:text-white" />
            </Item.Media>
            <Item.Content>
              <Item.Title class="text-blue-700! dark:text-white!">
                {@render restProps.children?.()}
              </Item.Title>
            </Item.Content>
            <Item.Actions>
              <ChevronRightIcon class="size-4 text-blue-700! dark:text-white!" />
            </Item.Actions>
          </button>
        {/snippet}
      </Item.Root>
    {/snippet}
  </HoverableItem>
{/if}
