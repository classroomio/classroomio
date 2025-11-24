<script lang="ts">
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';

  interface Props {
    options?: Array<{
      label: string;
      onClick?: () => void;
      separator?: boolean;
    }>;
    classNames?: string;
    isIcon?: boolean;
    children?: import('svelte').Snippet;
  }

  let { options = [], classNames = '', isIcon = false, children }: Props = $props();

  function onClick(option: any) {
    return () => {
      if (option && option.onClick) {
        option.onClick();
      }
    };
  }
</script>

<div class="{classNames} {!options.length && 'hidden'}">
  <DropdownMenu.Root>
    <DropdownMenu.Trigger
      class="flex flex-row items-center {!isIcon &&
        'border-grey rounded-lg border p-3 focus:border-gray-400 focus:bg-gray-200 focus:outline-none'}"
    >
      {@render children?.()}
    </DropdownMenu.Trigger>

    <DropdownMenu.Content align="end" class="w-48">
      {#each options as option, index}
        {#if option.separator}
          <DropdownMenu.Separator />
        {:else}
          <DropdownMenu.Item onclick={onClick(option)}>
            {option.label}
          </DropdownMenu.Item>
        {/if}
      {/each}
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</div>
