<script lang="ts">
  import { onDestroy } from 'svelte';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { useSidebar } from '@cio/ui/base/sidebar';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { profile } from '$lib/utils/store/user';
  import { orgs } from '$lib/utils/store/org';
  import SidebarSkeleton from '$features/ui/sidebar/sidebar-skeleton.svelte';
  import PoweredBy from '$features/ui/powered-by.svelte';
  import PathSidebarLogo from './path-sidebar-logo.svelte';
  import PathSidebarNavigation from './path-sidebar-navigation.svelte';
  import { startResizablePanelDrag } from '$lib/utils/functions/resizable-panel';
  import { PATH_SIDEBAR_DEFAULT_WIDTH, PATH_SIDEBAR_MAX_WIDTH, PATH_SIDEBAR_MIN_WIDTH } from './constants';
  import type { LearningPathDetail } from '../../utils/types';

  const isOrgLoaded = $derived($orgs.length > 0 && $profile.id);
  const SIDEBAR_ITEM_SKELETON_COUNT = 6;

  interface Props {
    path?: LearningPathDetail | null;
    isPathReady?: boolean;
    sidebarWidth?: number;
    onSidebarWidthPreview?: (width: number) => void;
    onSidebarWidthChange?: (width: number) => void;
  }

  let {
    path = null,
    isPathReady = true,
    sidebarWidth = PATH_SIDEBAR_DEFAULT_WIDTH,
    onSidebarWidthPreview = () => {},
    onSidebarWidthChange = () => {}
  }: Props = $props();

  const sidebar = useSidebar();
  let shouldIgnoreRailClick = $state(false);
  let stopSidebarResize: (() => void) | null = null;

  function clampSidebarWidth(width: number) {
    return Math.min(PATH_SIDEBAR_MAX_WIDTH, Math.max(PATH_SIDEBAR_MIN_WIDTH, width));
  }

  function clearSidebarResizeListeners() {
    stopSidebarResize?.();
    stopSidebarResize = null;
  }

  function handleRailPointerDown(event: PointerEvent) {
    if (sidebar.isMobile || !sidebar.open) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    clearSidebarResizeListeners();

    const startWidth = sidebarWidth;

    stopSidebarResize = startResizablePanelDrag({
      event,
      startWidth,
      resolveWidth: ({ startWidth, deltaX }) => clampSidebarWidth(startWidth + deltaX),
      onPreview: onSidebarWidthPreview,
      onCommit: ({ hasDragged, width }) => {
        if (hasDragged) {
          onSidebarWidthChange(width);
        }
      },
      onDragStart: () => {
        document.body.dataset.pathSidebarResizing = 'true';
      },
      onDragEnd: ({ hasDragged }) => {
        shouldIgnoreRailClick = hasDragged;
        delete document.body.dataset.pathSidebarResizing;
        stopSidebarResize = null;

        if (hasDragged) {
          window.setTimeout(() => {
            shouldIgnoreRailClick = false;
          }, 0);
        }
      }
    });
  }

  function handleRailClick(event: MouseEvent) {
    if (shouldIgnoreRailClick) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    sidebar.toggle();
  }

  onDestroy(() => {
    clearSidebarResizeListeners();
  });
</script>

{#if !isOrgLoaded}
  <SidebarSkeleton />
{:else}
  <Sidebar.Root collapsible="icon" class="ui:z-app-bar-elevated" mobileOverlayClass="ui:z-app-bar-elevated">
    <Sidebar.Header>
      <PathSidebarLogo {path} />
    </Sidebar.Header>

    <Sidebar.Content>
      {#if isPathReady && path}
        <PathSidebarNavigation {path} />
      {:else}
        <Sidebar.Group class="pt-0!">
          <div class="flex h-8 items-center gap-2 rounded-md px-2">
            <Skeleton class="size-4 rounded-md" />
            <Skeleton class="h-4 w-24" />
          </div>
          <Sidebar.Menu>
            {#each Array(SIDEBAR_ITEM_SKELETON_COUNT) as _, i (i)}
              <Sidebar.MenuItem>
                <div class="flex h-8 items-center gap-2 rounded-md px-2" data-sidebar="menu-skeleton">
                  <Skeleton class="size-4 rounded-md" />
                  <Skeleton class="h-4 max-w-32 flex-1" />
                </div>
              </Sidebar.MenuItem>
            {/each}
          </Sidebar.Menu>
        </Sidebar.Group>
      {/if}
    </Sidebar.Content>

    <Sidebar.Rail onclick={handleRailClick} onpointerdown={handleRailPointerDown} />

    <Sidebar.Footer>
      <PoweredBy
        variant="sidebar"
        sidebarUtmSource="lms-path-sidebar"
        showOnlyLogo={!sidebar.open || sidebar.isMobile}
      />
    </Sidebar.Footer>
  </Sidebar.Root>
{/if}

<style>
  :global(body[data-path-sidebar-resizing='true'] [data-slot='sidebar-gap']),
  :global(body[data-path-sidebar-resizing='true'] [data-slot='sidebar-container']) {
    transition: none !important;
  }
</style>
