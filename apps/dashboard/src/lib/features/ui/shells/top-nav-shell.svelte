<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import {
    currentOrgPath,
    currentOrg,
    currentOrgPlan,
    isOrgAdmin,
    isStudentLimitReached,
    orgs
  } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { basePath } from '$lib/utils/store/app';
  import { t } from '$lib/utils/functions/translations';
  import { getOrgNavigationGroups } from '$features/ui/navigation/org-navigation';
  import { orgNavCountsApi } from '$features/ui/sidebar/org-sidebar/org-nav-counts.svelte';
  import { appConfig } from '$lib/utils/config';
  import { applyNavConfig } from '@cio/sdk';
  import { formatCompactCount } from '@cio/utils/functions';
  import { cn } from '@cio/ui/tools';
  import * as Avatar from '@cio/ui/base/avatar';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { Separator } from '@cio/ui/base/separator';
  import * as Popover from '@cio/ui/base/popover';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import * as Sheet from '@cio/ui/base/sheet';
  import BellIcon from '@lucide/svelte/icons/bell';
  import SettingsIcon from '@lucide/svelte/icons/settings';
  import LogOutIcon from '@lucide/svelte/icons/log-out';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import PanelLeftIcon from '@lucide/svelte/icons/panel-left';
  import Search from '$features/ui/search.svelte';
  import VisitOrgSiteBtn from '$features/ui/visit-org-site-btn.svelte';
  import NotificationsPanel from '$features/notifications/components/notifications-panel.svelte';
  import { notificationsApi } from '$features/notifications/api/notifications.svelte';
  import { UserAvatar } from '@cio/ui/custom/user-avatar';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { PLAN_NAMES, PLAN } from '@cio/utils/plans';
  import { BRAND_ROOT_DOMAIN, TENANT_ROOT_DOMAIN } from '@cio/utils/constants';
  import AppBreadcrumbs from '$features/ui/navigation/app-breadcrumbs.svelte';

  interface Props {
    isSettingsRoute?: boolean;
    data?: {
      orgName?: string;
      [key: string]: any;
    };
    children?: Snippet;
  }

  let { isSettingsRoute = false, data = {}, children }: Props = $props();

  let mobileOpen = $state(false);

  const plan = $derived($currentOrgPlan?.planName || PLAN.BASIC);
  const utmSource = $derived(
    $currentOrg.customDomain ||
      ($currentOrg.siteName ? `${$currentOrg.siteName}.${TENANT_ROOT_DOMAIN}` : BRAND_ROOT_DOMAIN)
  );

  const notificationCount = $derived(notificationsApi.unreadCount);
  const isOrgLoaded = $derived($orgs.length > 0 && $profile.id);

  $effect(() => {
    if (!isOrgLoaded || !$currentOrg.id) return;

    void orgNavCountsApi.ensureCounts($currentOrg.id);
  });

  onMount(() => {
    notificationsApi.fetchOnce();
  });

  const rawGroups = $derived(
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

  const groups = $derived(applyNavConfig(rawGroups as any, appConfig.nav));
  const navItems = $derived(groups.flatMap((g) => g.items));

  // Core tabs visible directly in Tier 2
  const PRIMARY_KEYS = ['home', 'courses', 'cohorts', 'people', 'community', 'dash'];

  const primaryTabs = $derived(navItems.filter((item) => PRIMARY_KEYS.includes(item.key ?? '')));

  const moreTabs = $derived(navItems.filter((item) => !PRIMARY_KEYS.includes(item.key ?? '')));

  const isMoreActive = $derived(moreTabs.some((item) => item.isActive));
</script>

<div data-testid="layout-top-nav" class="bg-background flex min-h-screen w-full flex-col">
  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <!-- FIXED HEADER: TIER 1 + TIER 2 (STICKY TOGETHER)                       -->
  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <div class="border-border bg-background/95 sticky top-0 z-40 w-full border-b backdrop-blur-md">
    <!-- TIER 1: GLOBAL HEADER BAR -->
    <header class="border-border/60 flex h-14 w-full items-center justify-between border-b px-6">
      <div class="flex items-center gap-4">
        <!-- Mobile Drawer Trigger (< md) -->
        <div class="md:hidden">
          <Sheet.Root bind:open={mobileOpen}>
            <Sheet.Trigger>
              {#snippet child({ props })}
                <Button {...props} variant="ghost" size="icon" class="size-9">
                  <PanelLeftIcon size={18} />
                  <span class="sr-only">Open navigation menu</span>
                </Button>
              {/snippet}
            </Sheet.Trigger>
            <Sheet.Content side="left" class="flex w-[300px] flex-col justify-between p-4">
              <div class="flex flex-col gap-4">
                <!-- Mobile Drawer Header -->
                <div class="border-border flex items-center gap-2.5 border-b pb-2">
                  <Avatar.Root class="flex size-7 items-center justify-center rounded-lg">
                    <Avatar.Image src="/logo-192.png" alt="ClassroomIO logo" />
                  </Avatar.Root>
                  <span class="text-foreground text-base font-semibold tracking-tight">ClassroomIO</span>
                  <Badge variant="outline" class="text-xs capitalize">
                    {PLAN_NAMES[plan] || plan}
                  </Badge>
                </div>

                <!-- Mobile Nav List -->
                <nav class="flex max-h-[calc(100vh-220px)] flex-col gap-1 overflow-y-auto">
                  {#each navItems as item (item.testId || item.key)}
                    <a
                      href={item.url}
                      data-testid={item.testId}
                      onclick={() => (mobileOpen = false)}
                      class={cn(
                        'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        item.isActive
                          ? 'bg-secondary text-secondary-foreground font-semibold shadow-xs'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <div class="flex items-center gap-2.5">
                        {#if item.icon}
                          {@const Icon = item.icon}
                          <Icon size={18} />
                        {/if}
                        <span>{item.title}</span>
                      </div>
                      {#if item.count !== undefined}
                        <span class="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                          {formatCompactCount(item.count)}
                        </span>
                      {/if}
                    </a>
                  {/each}
                </nav>
              </div>

              <!-- Mobile Footer Actions -->
              <div class="border-border flex flex-col gap-2 border-t pt-4">
                <a
                  href={resolve(`${$basePath}/settings`, {})}
                  onclick={() => (mobileOpen = false)}
                  class="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
                >
                  <SettingsIcon size={16} />
                  <span>{$t('org_navigation.settings')}</span>
                </a>
                <a
                  href={resolve('/logout', {})}
                  class="text-destructive hover:bg-destructive/10 flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
                >
                  <LogOutIcon size={16} />
                  <span>{$t('settings.profile.logout')}</span>
                </a>
              </div>
            </Sheet.Content>
          </Sheet.Root>
        </div>

        <!-- ClassroomIO Logo & Branding -->
        <a
          href="https://{BRAND_ROOT_DOMAIN}?utm_source={utmSource}"
          target="_blank"
          rel="noopener noreferrer"
          class="text-foreground flex shrink-0 items-center gap-2.5 font-medium transition-opacity hover:opacity-80"
        >
          <Avatar.Root class="flex size-7 items-center justify-center rounded-lg">
            <Avatar.Image src="/logo-192.png" alt="ClassroomIO logo" />
          </Avatar.Root>
          <span class="text-foreground text-base font-semibold tracking-tight">ClassroomIO</span>
          <Badge variant="outline" class="hidden text-xs capitalize lg:inline-flex">
            {PLAN_NAMES[plan] || plan}
          </Badge>
        </a>

        <!-- Vertical divider -->
        <Separator orientation="vertical" class="hidden h-5 md:block" />

        <!-- Org Switcher & Breadcrumbs -->
        <div class="hidden max-w-md items-center overflow-hidden md:flex">
          <AppBreadcrumbs />
        </div>
      </div>

      <!-- Tier 1 Right Actions -->
      <div class="flex items-center gap-2.5">
        <div class="hidden sm:block">
          <VisitOrgSiteBtn variant="outline" labelKey="dashboard.open_academy" />
        </div>

        <Search />

        <!-- Notifications -->
        <div class="relative">
          <Popover.Root>
            <Popover.Trigger>
              {#snippet child({ props })}
                <Button
                  {...props}
                  variant="ghost"
                  size="icon"
                  class="size-9 rounded-full"
                  testId="app-notifications-trigger"
                >
                  <BellIcon size={18} />
                </Button>
              {/snippet}
            </Popover.Trigger>
            <Popover.Content align="end" sideOffset={8} class="ui:p-0! w-[460px]">
              <NotificationsPanel />
            </Popover.Content>
          </Popover.Root>

          {#if notificationCount > 0}
            <span
              class="ui:bg-primary ui:text-primary-foreground pointer-events-none absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium"
            >
              {notificationCount}
            </span>
          {/if}
        </div>

        <!-- User Profile Menu -->
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props })}
              <button
                {...props}
                class="ring-offset-background hover:ring-ring/20 flex items-center gap-2 rounded-full transition-shadow hover:ring-2 focus:outline-hidden"
              >
                <UserAvatar src={$profile.avatarUrl} alt={$profile.fullname} />
              </button>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end" class="w-56">
            <DropdownMenu.Label class="font-normal">
              <div class="flex flex-col space-y-1">
                <p class="text-sm leading-none font-medium">{$profile.fullname}</p>
                <p class="text-muted-foreground text-xs leading-none">{$profile.email}</p>
              </div>
            </DropdownMenu.Label>
            <DropdownMenu.Separator />
            <DropdownMenu.Item>
              {#snippet child({ props })}
                <a href={resolve(`${$basePath}/settings`, {})} {...props} class="flex w-full items-center gap-2">
                  <SettingsIcon size={16} />
                  <span>{$t('org_navigation.settings')}</span>
                </a>
              {/snippet}
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item>
              {#snippet child({ props })}
                <a href={resolve('/logout', {})} {...props} class="text-destructive flex w-full items-center gap-2">
                  <LogOutIcon size={16} />
                  <span>{$t('settings.profile.logout')}</span>
                </a>
              {/snippet}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
    </header>

    <!-- TIER 2: SUB-NAVIGATION TABS BAR (Desktop / Tablet >= md, CENTERED!) -->
    <nav class="-mb-px hidden w-full items-center justify-center px-6 md:flex">
      <div class="no-scrollbar flex items-center justify-center gap-1 overflow-x-auto">
        <!-- Primary Tabs -->
        {#each primaryTabs as item (item.testId || item.key)}
          <a
            href={item.url}
            data-testid={item.testId}
            class={cn(
              'hover:text-foreground relative inline-flex h-11 shrink-0 items-center gap-2 border-b-2 px-3.5 text-sm font-medium transition-colors',
              item.isActive
                ? 'border-primary text-foreground font-semibold'
                : 'text-muted-foreground hover:border-border border-transparent'
            )}
          >
            {#if item.icon}
              {@const Icon = item.icon}
              <Icon size={16} />
            {/if}
            <span>{item.title}</span>
            {#if item.count !== undefined}
              <span
                class={cn(
                  'rounded-full px-1.5 py-0.5 text-xs font-normal',
                  item.isActive ? 'bg-primary/10 text-primary font-medium' : 'bg-muted text-muted-foreground'
                )}
              >
                {formatCompactCount(item.count)}
              </span>
            {/if}
          </a>
        {/each}

        <!-- More Dropdown Menu for Secondary / Plugin Tools -->
        {#if moreTabs.length > 0}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              {#snippet child({ props })}
                <button
                  {...props}
                  class={cn(
                    'hover:text-foreground relative inline-flex h-11 shrink-0 cursor-pointer items-center gap-1.5 border-b-2 px-3.5 text-sm font-medium transition-colors focus:outline-hidden',
                    isMoreActive
                      ? 'border-primary text-foreground font-semibold'
                      : 'text-muted-foreground hover:border-border border-transparent'
                  )}
                >
                  <span>{$t('org_navigation.more')}</span>
                  <ChevronDownIcon size={14} class="opacity-70 transition-transform duration-200" />
                </button>
              {/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="start" class="w-52">
              {#each moreTabs as item (item.testId || item.key)}
                <DropdownMenu.Item>
                  {#snippet child({ props })}
                    <a
                      href={item.url}
                      data-testid={item.testId}
                      {...props}
                      class={cn(
                        'flex w-full items-center justify-between gap-2 px-2 py-1.5 text-sm',
                        item.isActive && 'bg-accent text-accent-foreground font-medium'
                      )}
                    >
                      <div class="flex items-center gap-2">
                        {#if item.icon}
                          {@const Icon = item.icon}
                          <Icon size={16} />
                        {/if}
                        <span>{item.title}</span>
                      </div>
                      {#if item.count !== undefined}
                        <span class="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-xs">
                          {formatCompactCount(item.count)}
                        </span>
                      {/if}
                    </a>
                  {/snippet}
                </DropdownMenu.Item>
              {/each}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        {/if}
      </div>
    </nav>
  </div>

  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <!-- MAIN CONTENT CANVAS                                                  -->
  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <main class="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-8">
    {#if data.orgName === '*'}
      <div class="grid auto-rows-min gap-4 md:grid-cols-3">
        <Skeleton class="aspect-video rounded-xl" />
        <Skeleton class="aspect-video rounded-xl" />
        <Skeleton class="aspect-video rounded-xl" />
      </div>
      <Skeleton class="h-[50vh] w-full rounded-xl" />
    {:else}
      {@render children?.()}
    {/if}
  </main>
</div>
