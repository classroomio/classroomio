<script lang="ts">
  import { currentOrgPath, currentOrg, isOrgAdmin } from '$lib/utils/store/org';
  import * as Collapsible from '@cio/ui/base/collapsible';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { t } from '$lib/utils/functions/translations';
  import { isActive } from '$lib/utils/functions/app';
  import { page } from '$app/state';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import { getOrgNavigationItems } from '$lib/features/ui/navigation/org-navigation';

  const items = $derived(getOrgNavigationItems($currentOrgPath, $currentOrg, $isOrgAdmin, $t, page.url.pathname));

  const pathWithQuery = $derived(page.url.pathname + page.url.search);
</script>

<Sidebar.Group>
  <Sidebar.GroupLabel>{$t('org_navigation.platform')}</Sidebar.GroupLabel>
  <Sidebar.Menu>
    {#each items as item (item.title)}
      <Collapsible.Root open={item.isActive || item.isExpanded} class="group/collapsible">
        {#snippet child({ props })}
          <Sidebar.MenuItem {...props}>
            <Collapsible.Trigger>
              {#snippet child({ props })}
                <Sidebar.MenuButton {...props} tooltipContent={item.title} isActive={item.isActive}>
                  {#snippet child({ props })}
                    <a href={item.url} {...props}>
                      {#if item.icon}
                        <item.icon />
                      {/if}
                      <span>{item.title}</span>
                      {#if item.items}
                        <ChevronRightIcon
                          class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                        />
                      {/if}
                    </a>
                  {/snippet}
                </Sidebar.MenuButton>
              {/snippet}
            </Collapsible.Trigger>
            {#if item.items}
              <Collapsible.Content>
                <Sidebar.MenuSub>
                  {#each item.items ?? [] as subItem (subItem.title)}
                    <Sidebar.MenuSubItem>
                      <Sidebar.MenuSubButton isActive={isActive(pathWithQuery, subItem.url, true)}>
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
            {/if}
          </Sidebar.MenuItem>
        {/snippet}
      </Collapsible.Root>
    {/each}
  </Sidebar.Menu>
</Sidebar.Group>
