<script lang="ts">
  import { resolve } from '$app/paths';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { useSidebar } from '@cio/ui/base/sidebar';
  import { BackButton } from '@cio/ui/custom/back-button';
  import { CourseIcon, HoverableItem, PeopleIcon, SettingsIcon } from '@cio/ui/custom/moving-icons';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrgPath, isOrgAdmin, orgs } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import OrgLogo from '$features/ui/sidebar/org-sidebar/org-logo.svelte';
  import SidebarSkeleton from '$features/ui/sidebar/sidebar-skeleton.svelte';
  import PoweredBy from '$features/ui/powered-by.svelte';

  interface Props {
    path: string;
    id: string;
  }

  let { path, id }: Props = $props();

  const sidebar = useSidebar();
  const isOrgLoaded = $derived($orgs.length > 0 && $profile.id);

  const navItems = $derived(
    [
      {
        id: 'courses',
        title: $t('learning_paths.sidebar.courses'),
        url: `/paths/${id}/courses`,
        isActive: path.endsWith('/courses'),
        icon: CourseIcon
      },
      {
        id: 'people',
        title: $t('learning_paths.sidebar.people'),
        url: `/paths/${id}/people`,
        isActive: path.endsWith('/people'),
        icon: PeopleIcon,
        adminOnly: true
      },
      {
        id: 'settings',
        title: $t('learning_paths.sidebar.settings'),
        url: `/paths/${id}/settings`,
        isActive: path.endsWith('/settings'),
        icon: SettingsIcon
      }
    ].filter((item) => !item.adminOnly || $isOrgAdmin)
  );
</script>

{#if !isOrgLoaded}
  <SidebarSkeleton />
{:else}
  <Sidebar.Root collapsible="icon" class="ui:z-app-bar-elevated">
    <Sidebar.Header>
      <OrgLogo />
    </Sidebar.Header>

    <Sidebar.Content>
      <Sidebar.Group class="pt-0!">
        <BackButton
          href={resolve(`${$currentOrgPath}/paths`, {})}
          label={$t('learning_paths.sidebar.back')}
          class="px-2! py-2!"
        />

        <Sidebar.Menu>
          {#each navItems as item (item.id)}
            <Sidebar.MenuItem>
              <Sidebar.MenuButton tooltipContent={item.title} isActive={item.isActive}>
                {#snippet child({ props })}
                  <HoverableItem>
                    {#snippet children(isHovered)}
                      {@const Icon = item.icon}
                      <a href={resolve(item.url, {})} {...props} data-testid="learning-path-nav-{item.id}">
                        <Icon {isHovered} size={16} />
                        <span>{item.title}</span>
                      </a>
                    {/snippet}
                  </HoverableItem>
                {/snippet}
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          {/each}
        </Sidebar.Menu>
      </Sidebar.Group>
    </Sidebar.Content>

    <Sidebar.Rail />

    <Sidebar.Footer>
      <PoweredBy
        variant="sidebar"
        sidebarUtmSource="learning-path-sidebar"
        showOnlyLogo={!sidebar.open || sidebar.isMobile}
      />
    </Sidebar.Footer>
  </Sidebar.Root>
{/if}

<style>
  a {
    text-decoration: none;
  }
</style>
