<script lang="ts">
  import * as Avatar from '@cio/ui/base/avatar';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import * as Breadcrumb from '@cio/ui/base/breadcrumb';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { useSidebar } from '@cio/ui/base/sidebar';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import { shortenName } from '$lib/utils/functions/string';

  import { currentOrg, currentOrgPath, currentOrgPlan } from '$lib/utils/store/org';

  import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
  import OrgSwitcherMenu from './org-switcher-menu.svelte';

  const sidebar = useSidebar();
  const isSelfHosted = PUBLIC_IS_SELFHOSTED === 'true';
  const MENU_CONTENT_CLASS =
    'max-h-[min(70vh,36rem)] w-(--bits-dropdown-menu-anchor-width) min-w-64 overflow-y-auto rounded-lg';

  interface Props {
    variant?: 'sidebar' | 'breadcrumb';
  }

  let { variant = 'sidebar' }: Props = $props();

  const currentPlanName = $derived($currentOrgPlan?.planName || 'Free');
</script>

{#if isSelfHosted}
  <!-- Self-hosted: show org name only, no switching -->
  {#if variant === 'breadcrumb'}
    <Breadcrumb.Link href={$currentOrgPath} class="flex items-center gap-2">
      {#if $currentOrg.name}
        <Avatar.Root class="flex size-6! items-center justify-center rounded-md!">
          <Avatar.Image src={$currentOrg.avatarUrl} alt={$currentOrg.name} />
          <Avatar.Fallback class="rounded-md! text-xs">{shortenName($currentOrg.name)}</Avatar.Fallback>
        </Avatar.Root>
        <span class="hidden truncate text-sm font-medium md:block">{$currentOrg.name}</span>
      {:else}
        <Skeleton class="h-4 w-24" />
      {/if}
    </Breadcrumb.Link>
  {:else}
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <div class="flex items-center gap-3 px-2 py-1.5">
          {#if $currentOrg.name}
            <Avatar.Root class="flex size-8 items-center justify-center rounded-lg">
              <Avatar.Image src={$currentOrg.avatarUrl} alt={$currentOrg.name} />
              <Avatar.Fallback class="rounded-lg">{shortenName($currentOrg.name)}</Avatar.Fallback>
            </Avatar.Root>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-normal">{$currentOrg.name}</span>
              <span class="truncate text-xs">{currentPlanName}</span>
            </div>
          {:else}
            <Skeleton class="h-full w-full" />
          {/if}
        </div>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  {/if}
{:else if variant === 'breadcrumb'}
  <!-- Breadcrumb context version -->
  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        <Breadcrumb.Link {...props} href="##" class="flex items-center gap-2" data-testid="org-switcher-trigger">
          {#if $currentOrg.name}
            <Avatar.Root class="flex size-6! items-center justify-center rounded-md!">
              <Avatar.Image src={$currentOrg.avatarUrl} alt={$currentOrg.name} />
              <Avatar.Fallback class="rounded-md! text-xs">{shortenName($currentOrg.name)}</Avatar.Fallback>
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
      class={MENU_CONTENT_CLASS}
      align="start"
      side={sidebar.isMobile ? 'bottom' : 'right'}
      sideOffset={4}
    >
      <OrgSwitcherMenu />
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
              data-testid="org-switcher-trigger"
              class="ui:data-[state=open]:bg-sidebar-accent ui:data-[state=open]:text-sidebar-accent-foreground"
            >
              {#if $currentOrg.name}
                <Avatar.Root class="flex size-8 items-center justify-center rounded-lg">
                  <Avatar.Image src={$currentOrg.avatarUrl} alt={$currentOrg.name} />
                  <Avatar.Fallback class="rounded-lg">{shortenName($currentOrg.name)}</Avatar.Fallback>
                </Avatar.Root>

                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-normal">
                    {$currentOrg.name}
                  </span>
                  <span class="truncate text-xs">
                    {currentPlanName}
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
          class={MENU_CONTENT_CLASS}
          align="start"
          side={sidebar.isMobile ? 'bottom' : 'right'}
          sideOffset={4}
        >
          <OrgSwitcherMenu />
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </Sidebar.MenuItem>
  </Sidebar.Menu>
{/if}
