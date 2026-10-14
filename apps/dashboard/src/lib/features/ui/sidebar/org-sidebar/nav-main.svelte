<script lang="ts">
  import { currentOrgPath, currentOrg, isOrgAdmin, isFreePlan, isStudentLimitReached } from '$lib/utils/store/org';
  import * as Collapsible from '@cio/ui/base/collapsible';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { t } from '$lib/utils/functions/translations';
  import { page } from '$app/state';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import { getOrgNavigationGroups } from '$features/ui/navigation/org-navigation';
  import { HoverableItem, PremiumIcon } from '@cio/ui/custom/moving-icons';
  import { formatCompactCount } from '@cio/utils/functions';
  import { orgNavCountsApi } from './org-nav-counts.svelte';
  import { PluginIcon, pluginsApi, PluginPopover } from '$features/plugins';
  import BlocksIcon from '@lucide/svelte/icons/blocks';

  let isPluginsOpen = $state(false);

  const isPluginsActive = $derived(page.url.pathname.includes('/plugins'));

  const installedPluginNavItems = $derived.by(() => {
    return pluginsApi.installations
      .filter((inst) => {
        if (inst.status !== 'active') return false;
        const manifest = inst.manifest as any;
        const contributesPages = manifest?.contributes?.pages;
        return Boolean(contributesPages && contributesPages.length > 0);
      })
      .map((inst) => {
        const routeKey = inst.plugin?.slug ?? inst.pluginId;
        return {
          pluginId: inst.pluginId,
          name: inst.plugin?.name ?? inst.pluginId,
          iconUrl: inst.iconUrl ?? null,
          url: `${$currentOrgPath}/plugins/${routeKey}`
        };
      });
  });

  const groups = $derived(
    getOrgNavigationGroups(
      $currentOrgPath,
      $currentOrg,
      $isOrgAdmin,
      $t,
      page.url.pathname + page.url.search,
      {
        students: $isStudentLimitReached
      },
      orgNavCountsApi.counts
    )
  );
</script>

{#each groups as group (group.labelKey)}
  <Sidebar.Group class="pt-0!">
    {#if group.labelKey}
      <Sidebar.GroupLabel>{$t(group.labelKey)}</Sidebar.GroupLabel>
    {/if}
    <Sidebar.Menu>
      {#each group.items as item (item.testId)}
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
                              <a href={item.url} {...props} data-testid={item.testId}>
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
                          <a href={item.url} {...props} data-testid={item.testId}>
                            {#if item.icon}
                              {@const Icon = item.icon}
                              <Icon {isHovered} size={16} class="custom" />
                              <span>{item.title}</span>
                            {:else}
                              <span>{item.title}</span>
                            {/if}
                            {#if item.upgrade}
                              <PremiumIcon {isHovered} size={16} class="ui:text-primary ml-auto" />
                            {:else if item.count}
                              <Sidebar.MenuBadge>{formatCompactCount(item.count)}</Sidebar.MenuBadge>
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
                    {#each item.items ?? [] as subItem (subItem.testId)}
                      <Sidebar.MenuSubItem>
                        <Sidebar.MenuSubButton isActive={subItem.isActive}>
                          {#snippet child({ props })}
                            <a href={subItem.url} {...props} data-testid={subItem.testId}>
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
      {#if group.labelKey === 'org_navigation.tools' && $isOrgAdmin}
        <Collapsible.Root
          open={isPluginsOpen || isPluginsActive}
          onOpenChange={(open) => (isPluginsOpen = open)}
          class="group/collapsible"
        >
          {#snippet child({ props })}
            <Sidebar.MenuItem {...props}>
              <PluginPopover>
                {#snippet trigger({ props: popoverProps })}
                  <Sidebar.MenuButton
                    {...popoverProps}
                    tooltipContent={$t('org_navigation.plugins_and_extensions')}
                    isActive={isPluginsActive}
                    data-testid="org-nav-plugins"
                  >
                    <div class="flex items-center gap-2">
                      <BlocksIcon size={16} />
                      <span>{$t('org_navigation.plugins_and_extensions')}</span>
                    </div>
                  </Sidebar.MenuButton>
                {/snippet}
              </PluginPopover>

              {#if installedPluginNavItems.length > 0}
                <Collapsible.Trigger>
                  {#snippet child({ props: triggerProps })}
                    <Sidebar.MenuAction {...triggerProps} showOnHover={false}>
                      <ChevronRightIcon
                        class="size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                      />
                      <span class="sr-only">Toggle plugins</span>
                    </Sidebar.MenuAction>
                  {/snippet}
                </Collapsible.Trigger>

                <Collapsible.Content>
                  <Sidebar.MenuSub>
                    {#each installedPluginNavItems as subItem (subItem.pluginId)}
                      <Sidebar.MenuSubItem>
                        <Sidebar.MenuSubButton isActive={page.url.pathname.startsWith(subItem.url)}>
                          {#snippet child({ props: subProps })}
                            <a href={subItem.url} {...subProps} data-testid="org-nav-plugin-{subItem.pluginId}">
                              <div class="flex items-center gap-2 truncate">
                                <PluginIcon src={subItem.iconUrl} alt={subItem.name} />
                                <span class="truncate">{subItem.name}</span>
                              </div>
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
      {/if}
    </Sidebar.Menu>
  </Sidebar.Group>
{/each}
