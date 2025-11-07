<script lang="ts">
  import { Skeleton } from '@cio/ui/base/skeleton';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { useSidebar } from '@cio/ui/base/sidebar';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
  import PlusIcon from '@lucide/svelte/icons/plus';

  import { goto } from '$app/navigation';
  import { setTheme } from '$lib/utils/functions/theme';
  import type { CurrentOrg } from '$lib/utils/types/org';
  import { currentOrg, currentOrgPath, orgs } from '$lib/utils/store/org';

  let { teams, canAddOrg = true }: { teams: { name: string; logo: any; plan: string }[]; canAddOrg?: boolean } =
    $props();

  const sidebar = useSidebar();

  let activeTeam = $state(teams?.[0] || null);

  function getOrg(org: CurrentOrg) {
    return $orgs.find((team) => team.name === org.name);
  }

  function onClick(org: any) {
    activeTeam = org;
    const organization = getOrg(org);

    if (organization) {
      console.log('found organization', organization);
      localStorage.setItem('classroomio_org_sitename', organization.siteName);
      currentOrg.set(organization);

      setTheme(organization.theme);
      goto($currentOrgPath);
    }
  }
</script>

<Sidebar.Menu>
  <Sidebar.MenuItem>
    {#if activeTeam}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          {#snippet child({ props })}
            <Sidebar.MenuButton
              {...props}
              size="lg"
              class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {#if $currentOrg.name}
                <div
                  class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
                >
                  <activeTeam.logo class="size-4" />
                </div>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-medium">
                    {activeTeam.name}
                  </span>
                  <span class="truncate text-xs">{activeTeam.plan}</span>
                </div>
                <ChevronsUpDownIcon class="ml-auto" />
              {:else}
                <div class="h-[30px] w-[219px]">
                  <Skeleton class="h-full w-full" />
                </div>
              {/if}
            </Sidebar.MenuButton>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
          align="start"
          side={sidebar.isMobile ? 'bottom' : 'right'}
          sideOffset={4}
        >
          <DropdownMenu.Label class="text-muted-foreground text-xs">Teams</DropdownMenu.Label>
          {#each teams as team, index (team.name)}
            {#if canAddOrg}
              <DropdownMenu.Item onSelect={() => onClick(team)} class="gap-2 p-2">
                <div class="flex size-6 items-center justify-center rounded-md border">
                  <team.logo class="size-3.5 shrink-0" />
                </div>
                {team.name}
                <DropdownMenu.Shortcut>⌘{index + 1}</DropdownMenu.Shortcut>
              </DropdownMenu.Item>
            {/if}
          {/each}
          <DropdownMenu.Separator />
          <DropdownMenu.Item class="gap-2 p-2">
            <div class="flex size-6 items-center justify-center rounded-md border bg-transparent">
              <PlusIcon class="size-4" />
            </div>
            <div class="text-muted-foreground font-medium">Add team</div>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    {:else}
      <Sidebar.MenuButton size="lg">
        <div
          class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
        >
          <PlusIcon class="size-4" />
        </div>
        <div class="grid flex-1 text-left text-sm leading-tight">
          <span class="truncate font-medium">No teams</span>
          <span class="truncate text-xs">Loading...</span>
        </div>
      </Sidebar.MenuButton>
    {/if}
  </Sidebar.MenuItem>
</Sidebar.Menu>
