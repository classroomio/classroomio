<script lang="ts">
  import * as Avatar from '@cio/ui/base/avatar';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { useSidebar } from '@cio/ui/base/sidebar';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
  import { getShortOrgName } from '$lib/utils/functions/org';
  import type { AccountOrg } from '$lib/features/app/types';

  import { setTheme } from '$lib/utils/functions/theme';
  import { currentOrg, currentOrgPath, orgs } from '$lib/utils/store/org';

  import TextChip from '$lib/components/Chip/Text.svelte';
  import ComingSoon from '$lib/components/ComingSoon/index.svelte';

  let {
    canAddOrg = true
  }: {
    canAddOrg?: boolean;
  } = $props();

  const sidebar = useSidebar();

  function onClick(org: AccountOrg) {
    if (org.id === $currentOrg.id) return;

    localStorage.setItem('classroomio_org_sitename', org.siteName);
    currentOrg.set(org);

    setTheme(org.theme);
    window.location.href = $currentOrgPath;
  }
</script>

<Sidebar.Menu>
  <Sidebar.MenuItem>
    {#if $currentOrg.id}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          {#snippet child({ props })}
            <Sidebar.MenuButton
              {...props}
              size="lg"
              class="ui:data-[state=open]:bg-sidebar-accent ui:data-[state=open]:text-sidebar-accent-foreground"
            >
              {#if $currentOrg.name}
                <Avatar.Root class="ui:flex ui:size-8 ui:items-center ui:justify-center ui:rounded-lg">
                  {#if $currentOrg.avatarUrl}
                    <Avatar.Image src={$currentOrg.avatarUrl} alt={$currentOrg.name} />
                  {:else}
                    <TextChip
                      size="sm"
                      value={getShortOrgName($currentOrg.name)}
                      className="bg-primary-200 dark:text-black"
                    />
                  {/if}
                </Avatar.Root>

                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-medium">
                    {$currentOrg.name}
                  </span>
                  <span class="truncate text-xs">{$currentOrg.plans?.[0]?.planName || 'Free'}</span>
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
          class="ui:w-(--bits-dropdown-menu-anchor-width) ui:min-w-56 ui:rounded-lg"
          align="start"
          side={sidebar.isMobile ? 'bottom' : 'right'}
          sideOffset={4}
        >
          <DropdownMenu.Label class="ui:text-muted-foreground ui:text-xs">Organizations</DropdownMenu.Label>
          {#each $orgs as org (org.name)}
            {#if canAddOrg}
              <DropdownMenu.Item onSelect={() => onClick(org)} class="gap-2 p-2">
                <Avatar.Root class="flex size-8 items-center justify-center rounded-lg">
                  {#if org.avatarUrl}
                    <Avatar.Image src={org.avatarUrl} alt={org.name} />
                  {:else}
                    <TextChip
                      size="sm"
                      value={getShortOrgName(org.name)}
                      className="ui:bg-primary-200 ui:dark:text-black"
                    />
                  {/if}
                </Avatar.Root>

                {org.name}
              </DropdownMenu.Item>
            {/if}
          {/each}
          <DropdownMenu.Separator />
          <DropdownMenu.Item class="cursor-not-allowed gap-2 p-2 opacity-50">
            <div class="flex size-6 items-center justify-center rounded-md border bg-transparent">
              <PlusIcon class="size-4" />
            </div>
            <div class="ui:text-muted-foreground ui:font-medium">Add Organization</div>

            <ComingSoon />
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    {:else}
      <Sidebar.MenuButton size="lg">
        <div
          class="ui:bg-sidebar-primary ui:text-sidebar-primary-foreground ui:flex ui:aspect-square ui:size-8 ui:items-center ui:justify-center ui:rounded-lg"
        >
          <PlusIcon class="size-4" />
        </div>
        <div class="grid flex-1 text-left text-sm leading-tight">
          <span class="truncate font-medium">No orgs</span>
          <span class="truncate text-xs">Loading...</span>
        </div>
      </Sidebar.MenuButton>
    {/if}
  </Sidebar.MenuItem>
</Sidebar.Menu>
