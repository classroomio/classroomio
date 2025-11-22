<script lang="ts">
  import { currentOrgPath } from '$lib/utils/store/org';
  import * as Collapsible from '@cio/ui/base/collapsible';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { Icon } from '@lucide/svelte';

  let {
    items
  }: {
    items: {
      title: string;
      url: string;
      icon?: typeof Icon;
      isActive?: boolean;
      items?: {
        title: string;
        url: string;
      }[];
    }[];
  } = $props();
</script>

<Sidebar.Group>
  <Sidebar.GroupLabel>Platform</Sidebar.GroupLabel>
  <Sidebar.Menu>
    {#each items as item (item.title)}
      <Collapsible.Root open={item.isActive} class="group/collapsible">
        {#snippet child({ props })}
          <Sidebar.MenuItem {...props}>
            <Sidebar.MenuButton
              {...props}
              tooltipContent={item.title}
              class={item.isActive ? 'ui:bg-accent ui:text-accent-foreground' : ''}
            >
              {#if item.icon}
                <item.icon />
              {/if}
              <a href="{$currentOrgPath}{item.url}" class="w-full">{item.title}</a>
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>
        {/snippet}
      </Collapsible.Root>
    {/each}
  </Sidebar.Menu>
</Sidebar.Group>
