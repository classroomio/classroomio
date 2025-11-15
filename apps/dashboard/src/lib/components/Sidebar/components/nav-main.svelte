<script lang="ts">
  import { currentOrgPath } from '$lib/utils/store/org';
  import * as Collapsible from '@cio/ui/base/collapsible';
  import * as Sidebar from '@cio/ui/base/sidebar';

  let {
    items
  }: {
    items: {
      title: string;
      url: string;
      // this should be `Component` after @lucide/svelte updates types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      icon?: any;
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
              class={item.isActive ? 'bg-accent text-accent-foreground' : ''}
            >
              {#if item.icon}
                <item.icon />
              {/if}
              <a href="{$currentOrgPath}{item.url}">{item.title}</a>
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>
        {/snippet}
      </Collapsible.Root>
    {/each}
  </Sidebar.Menu>
</Sidebar.Group>
