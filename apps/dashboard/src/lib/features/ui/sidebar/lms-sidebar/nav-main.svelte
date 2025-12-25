<script lang="ts">
  import { currentOrg } from '$lib/utils/store/org';
  import * as Collapsible from '@cio/ui/base/collapsible';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { t } from '$lib/utils/functions/translations';
  import { isActive } from '$lib/utils/functions/app';
  import { page } from '$app/state';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import { getLmsNavigationItems } from '$features/ui/navigation/lms-navigation';

  const items = $derived(getLmsNavigationItems($currentOrg, $t, page.url.pathname));

  const pathWithQuery = $derived(page.url.pathname + page.url.search);
</script>

<Sidebar.Group>
  <Sidebar.GroupLabel>LMS Navigation</Sidebar.GroupLabel>
  <Sidebar.Menu>
    {#each items as item (item.path)}
      {#if item.items}
        <!-- Collapsible Settings Menu -->
        <Collapsible.Root open={item.isActive || item.isExpanded} class="group/collapsible">
          {#snippet child({ props })}
            <Sidebar.MenuItem {...props}>
              <Collapsible.Trigger>
                {#snippet child({ props })}
                  <Sidebar.MenuButton {...props} tooltipContent={item.title} isActive={item.isActive}>
                    {#snippet child({ props })}
                      <a href={item.url} {...props}>
                        {#if item.icon}
                          <item.icon class="custom" />
                        {/if}
                        <span>{item.title}</span>
                        <ChevronRightIcon
                          class="custom ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                        />
                      </a>
                    {/snippet}
                  </Sidebar.MenuButton>
                {/snippet}
              </Collapsible.Trigger>
              <Collapsible.Content>
                <Sidebar.MenuSub>
                  {#each item.items ?? [] as subItem (subItem.path)}
                    <Sidebar.MenuSubItem>
                      <Sidebar.MenuSubButton isActive={isActive(pathWithQuery, subItem.url, undefined, true)}>
                        {#snippet child({ props })}
                          <a href={subItem.url} {...props}>
                            <span>{subItem.title}</span>
                          </a>
                        {/snippet}
                      </Sidebar.MenuSubButton>
                    </Sidebar.MenuSubItem>
                  {/each}
                </Sidebar.MenuSub>
              </Collapsible.Content>
            </Sidebar.MenuItem>
          {/snippet}
        </Collapsible.Root>
      {:else}
        <!-- Regular Menu Item -->
        <Sidebar.MenuItem>
          <Sidebar.MenuButton tooltipContent={item.title} isActive={item.isActive}>
            {#snippet child({ props })}
              <a href={item.url} {...props}>
                {#if item.icon}
                  <item.icon class="custom" />
                {/if}
                <span>{item.title}</span>
              </a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      {/if}
    {/each}
  </Sidebar.Menu>
</Sidebar.Group>
