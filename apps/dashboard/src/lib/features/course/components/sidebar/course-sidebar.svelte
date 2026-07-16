<script lang="ts">
  import { onDestroy } from 'svelte';
  import { page } from '$app/state';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { Progress } from '@cio/ui/base/progress';
  import { profile } from '$lib/utils/store/user';
  import { orgs } from '$lib/utils/store/org';
  import { isStudentExperience } from '$lib/utils/store/app';
  import CourseSidebarLogo from './course-sidebar-logo.svelte';
  import Navigation from './course-sidebar-navigation.svelte';
  import SidebarSkeleton from '$features/ui/sidebar/sidebar-skeleton.svelte';
  import PoweredBy from '$features/ui/powered-by.svelte';
  import { courseApi } from '$features/course/api';
  import { getCourseProgress } from '$features/course/utils/content';
  import { t } from '$lib/utils/functions/translations';
  import { useSidebar } from '@cio/ui/base/sidebar';
  import { startResizablePanelDrag } from '$lib/utils/functions/resizable-panel';
  import { COURSE_SIDEBAR_DEFAULT_WIDTH, COURSE_SIDEBAR_MAX_WIDTH, COURSE_SIDEBAR_MIN_WIDTH } from './constants';

  const isOrgLoaded = $derived($orgs.length > 0 && $profile.id);

  /** When false, course is still loading and sidebar nav shows skeletons. */
  const SIDEBAR_ITEM_SKELETON_COUNT = 8;

  interface Props {
    path: string;
    id: string;
    /** If false, sidebar nav shows loading skeletons. Omit or true = show real nav. */
    isCourseReady?: boolean;
    sidebarWidth?: number;
    onSidebarWidthPreview?: (width: number) => void;
    onSidebarWidthChange?: (width: number) => void;
  }

  let {
    path,
    id,
    isCourseReady = true,
    sidebarWidth = COURSE_SIDEBAR_DEFAULT_WIDTH,
    onSidebarWidthPreview = () => {},
    onSidebarWidthChange = () => {}
  }: Props = $props();

  const sidebar = useSidebar();
  const currentPath = $derived(path || page.url.pathname);
  let shouldIgnoreRailClick = $state(false);
  let stopSidebarResize: (() => void) | null = null;

  const attributionCourseSlug = $derived(courseApi.course?.slug ?? null);
  const courseProgress = $derived(getCourseProgress(courseApi.course));
  const showCourseProgress = $derived(
    $isStudentExperience && isCourseReady && sidebar.open && !sidebar.isMobile && courseProgress.total > 0
  );

  function clampSidebarWidth(width: number) {
    return Math.min(COURSE_SIDEBAR_MAX_WIDTH, Math.max(COURSE_SIDEBAR_MIN_WIDTH, width));
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
        document.body.dataset.courseSidebarResizing = 'true';
      },
      onDragEnd: ({ hasDragged }) => {
        shouldIgnoreRailClick = hasDragged;
        delete document.body.dataset.courseSidebarResizing;
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
  <Sidebar.Root collapsible="icon" class="z-app-bar-elevated!" mobileOverlayClass="z-app-bar-elevated!">
    <Sidebar.Header>
      <CourseSidebarLogo isStudent={$isStudentExperience} />
    </Sidebar.Header>

    <Sidebar.Content>
      {#if isCourseReady}
        <Navigation path={currentPath} {id} isStudent={$isStudentExperience} />
      {:else}
        <Sidebar.Group class="pt-0!">
          <div class="flex h-8 items-center gap-2 rounded-md px-2">
            <Skeleton class="ui:size-4 ui:rounded-md" />
            <Skeleton class="ui:h-4 ui:w-24" />
          </div>
          <Sidebar.Menu>
            {#each Array(SIDEBAR_ITEM_SKELETON_COUNT) as _, i (i)}
              <Sidebar.MenuItem>
                <div class="ui:flex ui:h-8 ui:items-center ui:gap-2 ui:rounded-md ui:px-2" data-sidebar="menu-skeleton">
                  <Skeleton class="ui:size-4 ui:rounded-md" />
                  <Skeleton class="ui:h-4 ui:max-w-32 ui:flex-1" />
                </div>
              </Sidebar.MenuItem>
            {/each}
          </Sidebar.Menu>
        </Sidebar.Group>
      {/if}
    </Sidebar.Content>

    <Sidebar.Rail onclick={handleRailClick} onpointerdown={handleRailPointerDown} />

    <Sidebar.Footer>
      {#if showCourseProgress}
        <div class="ui:border-sidebar-border ui:bg-sidebar-accent/50 rounded-lg border p-3">
          <div class="flex items-baseline justify-between gap-2">
            <span class="text-xs font-medium">{$t('course.sidebar.progress.title')}</span>
            <span class="ui:text-primary text-xs font-semibold tabular-nums">{courseProgress.percent}%</span>
          </div>
          <Progress value={courseProgress.percent} max={100} class="ui:h-1.5 mt-2" />
          <p class="ui:text-muted-foreground mt-2 truncate text-[11px]">
            {$t('course.sidebar.progress.lessons', {
              completed: courseProgress.lessonsComplete,
              total: courseProgress.lessonsTotal
            })}{#if courseProgress.exercisesTotal > 0}
              · {$t('course.sidebar.progress.exercises', {
                completed: courseProgress.exercisesComplete,
                total: courseProgress.exercisesTotal
              })}{/if}
          </p>
        </div>
      {/if}
      <PoweredBy
        variant="sidebar"
        sidebarUtmSource="lms-course-sidebar"
        courseSlug={attributionCourseSlug}
        showOnlyLogo={!sidebar.open || sidebar.isMobile}
      />
    </Sidebar.Footer>
  </Sidebar.Root>
{/if}

<style>
  :global(body[data-course-sidebar-resizing='true'] [data-slot='sidebar-gap']),
  :global(body[data-course-sidebar-resizing='true'] [data-slot='sidebar-container']) {
    transition: none !important;
  }
</style>
