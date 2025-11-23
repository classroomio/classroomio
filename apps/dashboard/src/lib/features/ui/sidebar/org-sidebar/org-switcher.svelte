<script lang="ts">
  import * as Avatar from '@cio/ui/base/avatar';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import * as Breadcrumb from '@cio/ui/base/breadcrumb';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { useSidebar } from '@cio/ui/base/sidebar';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import { getShortOrgName } from '$lib/utils/functions/org';
  import type { AccountOrg } from '$lib/features/app/types';

  import { setTheme } from '$lib/utils/functions/theme';
  import { currentOrg, currentOrgPath, orgs } from '$lib/utils/store/org';

  import { ComingSoon } from '$lib/features/ui';

  const sidebar = useSidebar();

  interface Props {
    variant?: 'sidebar' | 'breadcrumb';
  }

  let { variant = 'sidebar' }: Props = $props();

  function onClick(org: AccountOrg) {
    if (org.id === $currentOrg.id) return;

    localStorage.setItem('classroomio_org_sitename', org.siteName);
    currentOrg.set(org);

    setTheme(org.theme);
    window.location.href = $currentOrgPath;
  }
</script>

{#if variant === 'breadcrumb'}
  <!-- Breadcrumb context version -->
  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        <Breadcrumb.Link {...props} href="##" class="flex items-center gap-2">
          {#if $currentOrg.name}
            <Avatar.Root class="rounded-md! size-6! flex items-center justify-center">
              <Avatar.Image src={$currentOrg.avatarUrl} alt={$currentOrg.name} />
              <Avatar.Fallback class="rounded-md! text-xs">{getShortOrgName($currentOrg.name)}</Avatar.Fallback>
            </Avatar.Root>
            <span class="hidden truncate text-sm font-medium md:block">{$currentOrg.name}</span>
            <ChevronDownIcon class="ml-auto hidden size-4 md:block" />
          {:else}
            <Skeleton class="h-4 w-24" />
          {/if}
        </Breadcrumb.Link>
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
        <DropdownMenu.Item onSelect={() => onClick(org)} class="gap-2 p-2">
          <Avatar.Root class="flex size-8 items-center justify-center rounded-lg">
            <Avatar.Image src={org.avatarUrl} alt={org.name} />
            <Avatar.Fallback class="rounded-lg">{getShortOrgName(org.name)}</Avatar.Fallback>
          </Avatar.Root>

          {org.name}
        </DropdownMenu.Item>
      {/each}

      <DropdownMenu.Separator />

      <DropdownMenu.Item class="cursor-not-allowed gap-2 p-2 opacity-50">
        <div class="flex size-6 items-center justify-center rounded-md border bg-transparent">
          <PlusIcon class="size-4" />
        </div>
        <div class="ui:text-muted-foreground ui:font-normal">Add Organization</div>

        <ComingSoon />
      </DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{:else}
  <!-- Sidebar context version -->
  <Sidebar.Menu>
    <Sidebar.MenuItem>
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
                  <Avatar.Image src={$currentOrg.avatarUrl} alt={$currentOrg.name} />
                  <Avatar.Fallback class="rounded-lg">{getShortOrgName($currentOrg.name)}</Avatar.Fallback>
                </Avatar.Root>

                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-normal">
                    {$currentOrg.name}
                  </span>
                  <span class="truncate text-xs">
                    {$currentOrg.plans?.[0]?.planName || 'Free'}
                  </span>
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
            <DropdownMenu.Item onSelect={() => onClick(org)} class="gap-2 p-2">
              <Avatar.Root class="flex size-8 items-center justify-center rounded-lg">
                <Avatar.Image src={org.avatarUrl} alt={org.name} />
                <Avatar.Fallback class="rounded-lg">{getShortOrgName(org.name)}</Avatar.Fallback>
              </Avatar.Root>

              {org.name}
            </DropdownMenu.Item>
          {/each}

          <DropdownMenu.Separator />

          <DropdownMenu.Item class="cursor-not-allowed gap-2 p-2 opacity-50">
            <div class="flex size-6 items-center justify-center rounded-md border bg-transparent">
              <PlusIcon class="size-4" />
            </div>
            <div class="ui:text-muted-foreground ui:font-normal">Add Organization</div>

            <ComingSoon />
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </Sidebar.MenuItem>
  </Sidebar.Menu>
{/if}
