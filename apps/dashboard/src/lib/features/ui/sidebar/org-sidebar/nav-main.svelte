<script lang="ts">
  import { currentOrgPath, currentOrg, isOrgAdmin, isFreePlan, isStudentLimitReached } from '$lib/utils/store/org';
  import * as Collapsible from '@cio/ui/base/collapsible';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { t } from '$lib/utils/functions/translations';
  import { page } from '$app/state';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import { getOrgNavigationGroups } from '$features/ui/navigation/org-navigation';
  import { HoverableItem, PremiumIcon } from '@cio/ui/custom/moving-icons';

  const groups = $derived(
    getOrgNavigationGroups($currentOrgPath, $currentOrg, $isOrgAdmin, $t, page.url.pathname + page.url.search, {
      students: $isStudentLimitReached
    })
  );
</script>

{#each groups as group (group.labelKey)}
  <Sidebar.Group class="pt-0!">
    {#if group.labelKey}
      <Sidebar.GroupLabel>{$t(group.labelKey)}</Sidebar.GroupLabel>
    {/if}
    <Sidebar.Menu>
      {#each group.items as item (item.title)}
        <Collapsible.Root open={item.isActive || item.isExpanded} class="group/collapsible">
          {#snippet child({ props })}
            <Sidebar.MenuItem {...props}>
              {#if item.items}
                <Collapsible.Trigger>
                  {#snippet child({ props })}
                    <Sidebar.MenuButton {...props} tooltipContent={item.title} isActive={item.isActive}>
                      {#snippet child({ props })}
                        <HoverableItem>
                          {#snippet children(isHovered)}
                            {#if item.disabled}
                              <span {...props} aria-disabled="true">
                                {#if item.icon}
                                  {@const Icon = item.icon}
                                  <Icon {isHovered} size={16} class="custom" />
                                  <span>{item.title}</span>
                                {:else}
                                  <span>{item.title}</span>
                                {/if}
                              </span>
                            {:else}
                              <a href={item.url} {...props}>
                                {#if item.icon}
                                  {@const Icon = item.icon}
                                  <Icon {isHovered} size={16} class="custom" />
                                  <span>{item.title}</span>
                                {:else}
                                  <span>{item.title}</span>
                                {/if}
                                <ChevronRightIcon
                                  class="custom ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                                />
                              </a>
                            {/if}
                          {/snippet}
                        </HoverableItem>
                      {/snippet}
                    </Sidebar.MenuButton>
                  {/snippet}
                </Collapsible.Trigger>
              {:else}
                <Sidebar.MenuButton tooltipContent={item.title} isActive={item.isActive}>
                  {#snippet child({ props })}
                    <HoverableItem>
                      {#snippet children(isHovered)}
                        {#if item.disabled}
                          <span {...props} aria-disabled="true">
                            {#if item.icon}
                              {@const Icon = item.icon}
                              <Icon {isHovered} size={16} class="custom" />
                              <span>{item.title}</span>
                            {:else}
                              <span>{item.title}</span>
                            {/if}
                          </span>
                        {:else}
                          <a href={item.url} {...props}>
                            {#if item.icon}
                              {@const Icon = item.icon}
                              <Icon {isHovered} size={16} class="custom" />
                              <span>{item.title}</span>
                            {:else}
                              <span>{item.title}</span>
                            {/if}
                            {#if item.upgrade}
                              <PremiumIcon {isHovered} size={16} class="ui:text-primary ml-auto" />
                            {/if}
                          </a>
                        {/if}
                      {/snippet}
                    </HoverableItem>
                  {/snippet}
                </Sidebar.MenuButton>
              {/if}
              {#if item.items}
                <Collapsible.Content>
                  <Sidebar.MenuSub>
                    {#each item.items ?? [] as subItem (subItem.title)}
                      <Sidebar.MenuSubItem>
                        <Sidebar.MenuSubButton isActive={subItem.isActive}>
                          {#snippet child({ props })}
                            <a href={subItem.url} {...props}>
                              <span>{subItem.title}</span>
                              {#if subItem.isPaid && $isFreePlan}
                                <PremiumIcon size={16} class="ui:text-primary ml-auto" />
                              {/if}
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
{/each}
