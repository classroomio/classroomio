<script lang="ts">
  import { MediaQuery } from 'svelte/reactivity';
  import * as Breadcrumb from '@cio/ui/base/breadcrumb';
  import * as Drawer from '@cio/ui/base/drawer';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import { buttonVariants } from '@cio/ui/base/button';
  import { page } from '$app/state';
  import { currentOrgPath, currentOrg, isOrgAdmin } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { getOrgNavigationItems } from './org-navigation';
  import { generateBreadcrumbs } from './breadcrumb';
  import OrgSwitcher from '../sidebar/org-sidebar/org-switcher.svelte';

  const navItems = $derived(getOrgNavigationItems($currentOrgPath, $currentOrg, $isOrgAdmin, $t, page.url.pathname));

  const breadcrumbs = $derived(
    generateBreadcrumbs(
      page.url.pathname,
      page.url.search,
      navItems,
      $currentOrgPath,
      page.data as { breadcrumb?: string } | undefined
    )
  );

  let open = $state(false);

  const isDesktop = new MediaQuery('(min-width: 768px)');
  const ITEMS_TO_DISPLAY = $derived(isDesktop.current ? 2 : 1); // Show last 2 items (since we have org switcher as first)
</script>

<Breadcrumb.Root>
  <Breadcrumb.List>
    <Breadcrumb.Item>
      <OrgSwitcher variant="breadcrumb" />
    </Breadcrumb.Item>

    {#if breadcrumbs.length > 0}
      <Breadcrumb.Separator />

      {#if breadcrumbs.length > ITEMS_TO_DISPLAY}
        <!-- Show ellipsis for hidden items -->
        <Breadcrumb.Item>
          {#if isDesktop.current}
            <DropdownMenu.Root bind:open>
              <DropdownMenu.Trigger class="flex items-center gap-1" aria-label="Toggle menu">
                <Breadcrumb.Ellipsis class="size-4" />
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="start">
                {#each breadcrumbs.slice(0, -ITEMS_TO_DISPLAY) as breadcrumb, i (i)}
                  <DropdownMenu.Item>
                    <a href={breadcrumb.href ? breadcrumb.href : '##'}>
                      {breadcrumb.label}
                    </a>
                  </DropdownMenu.Item>
                {/each}
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          {:else}
            <Drawer.Root bind:open>
              <Drawer.Trigger aria-label="Toggle Menu">
                <Breadcrumb.Ellipsis class="size-4" />
              </Drawer.Trigger>
              <Drawer.Content>
                <Drawer.Header class="text-start">
                  <Drawer.Title>Navigate to</Drawer.Title>
                  <Drawer.Description>Select a page to navigate to.</Drawer.Description>
                </Drawer.Header>
                <div class="grid gap-1 px-4">
                  {#each breadcrumbs.slice(0, -ITEMS_TO_DISPLAY) as breadcrumb, i (i)}
                    <a href={breadcrumb.href ? breadcrumb.href : '##'} class="py-1 text-sm">
                      {breadcrumb.label}
                    </a>
                  {/each}
                </div>
                <Drawer.Footer class="pt-4">
                  <Drawer.Close class={buttonVariants({ variant: 'outline' })}>Close</Drawer.Close>
                </Drawer.Footer>
              </Drawer.Content>
            </Drawer.Root>
          {/if}
        </Breadcrumb.Item>
        <Breadcrumb.Separator />
      {/if}

      <!-- Show last ITEMS_TO_DISPLAY items (or all if <= ITEMS_TO_DISPLAY) -->
      {#each breadcrumbs.slice(-ITEMS_TO_DISPLAY) as breadcrumb, index (breadcrumb.label)}
        <Breadcrumb.Item>
          {@const isLast = index === breadcrumbs.slice(-ITEMS_TO_DISPLAY).length - 1}
          {#if !isLast}
            <Breadcrumb.Link href={breadcrumb.href} class="max-w-20 truncate md:max-w-none">
              {breadcrumb.label}
            </Breadcrumb.Link>
            <Breadcrumb.Separator />
          {:else}
            <Breadcrumb.Page class="max-w-20 truncate md:max-w-none">
              {breadcrumb.label}
            </Breadcrumb.Page>
          {/if}
        </Breadcrumb.Item>
      {/each}
    {/if}
  </Breadcrumb.List>
</Breadcrumb.Root>
