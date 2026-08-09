<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import LockIcon from '@lucide/svelte/icons/lock';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import * as Collapsible from '@cio/ui/base/collapsible';
  import { ContentType } from '@cio/utils/constants/content';
  import { courseApi } from '$features/course/api';
  import { getContentItemsProgress, getContentRoute, getCourseContent } from '$features/course/utils/content';
  import {
    formatSectionCompletionLabel,
    getActiveSectionId,
    getSectionIdForContentItem,
    isContentItemInPath
  } from '$features/course/utils/content-navigation';
  import { CircleCheckIcon } from '$features/ui/icons';
  import { t } from '$lib/utils/functions/translations';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { RadioIcon } from '@cio/ui/custom/moving-icons';
  import CourseContentIcon from '$features/course/components/course-content-icon.svelte';
  import { isCourseLearnerView } from '$lib/utils/store/app';
  import { SvelteSet } from 'svelte/reactivity';

  interface Props {
    path: string;
    courseId: string;
    class?: string;
  }

  let { path, courseId, class: className = '' }: Props = $props();

  const contentData = $derived(getCourseContent(courseApi.course));
  const currentPath = $derived(path || page.url.pathname);
  const activeSectionId = $derived(getActiveSectionId(courseApi.course, currentPath));
  const activeItemId = $derived.by(() => {
    const items = contentData.grouped ? contentData.sections.flatMap((section) => section.items) : contentData.items;

    return items.find((item) => isContentItemInPath(item.id, currentPath))?.id ?? null;
  });

  let expandedSectionIds = new SvelteSet<string>();
  let trackedActiveSectionId = $state<string | null>(null);

  $effect(() => {
    if (!contentData.grouped || !activeSectionId) {
      return;
    }

    if (activeSectionId === trackedActiveSectionId) {
      return;
    }

    trackedActiveSectionId = activeSectionId;
    expandedSectionIds.clear();
    expandedSectionIds.add(activeSectionId);
  });

  function isSectionOpen(sectionId: string): boolean {
    return expandedSectionIds.has(sectionId);
  }

  function handleSectionOpenChange(sectionId: string, open: boolean) {
    if (open) {
      expandedSectionIds.add(sectionId);
      return;
    }

    expandedSectionIds.delete(sectionId);
  }

  export function collapseToActiveSection() {
    if (!activeSectionId) {
      return;
    }

    expandedSectionIds.clear();
    expandedSectionIds.add(activeSectionId);
    trackedActiveSectionId = activeSectionId;
  }

  export function getActiveItemId() {
    return activeItemId;
  }
</script>

{#snippet liveSessionDot()}
  <span
    class="shrink-0"
    title={$t('course.navItem.lessons.session.live_indicator')}
    aria-label={$t('course.navItem.lessons.session.live_indicator')}
  >
    <RadioIcon size={14} color="#ef4444" />
  </span>
{/snippet}

{#snippet contentItemRow(contentItem: (typeof contentData.items)[number])}
  {@const isContentLocked = (contentItem.isUnlocked ?? true) === false}
  {@const isLockedForStudent = $isCourseLearnerView && (isContentLocked || contentItem.accessible === false)}
  {@const isActive = isContentItemInPath(contentItem.id, currentPath)}
  <a
    href={resolve(getContentRoute(courseId, contentItem), {})}
    aria-disabled={isLockedForStudent}
    title={contentItem.title}
    data-sidebar-content-id={contentItem.id}
    class="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors {isActive
      ? 'ui:bg-sidebar-accent ui:text-sidebar-accent-foreground font-medium'
      : 'ui:text-foreground hover:ui:bg-muted'} {isLockedForStudent ? 'cursor-not-allowed opacity-50' : ''}"
    onclick={(event) => {
      if (isLockedForStudent) {
        event.preventDefault();
        return;
      }

      if (contentData.grouped) {
        const sectionId = getSectionIdForContentItem(courseApi.course, contentItem.id);
        if (sectionId) {
          expandedSectionIds.clear();
          expandedSectionIds.add(sectionId);
        }
      }
    }}
  >
    <CourseContentIcon type={contentItem.type} size={14} />
    <span class="min-w-0 flex-1 truncate">{contentItem.title}</span>
    <div class="ml-auto flex items-center gap-1">
      {#if contentItem.isComplete}
        <span class="shrink-0">
          <CircleCheckIcon size={16} filled />
        </span>
      {/if}
      {#if contentItem.type === ContentType.Lesson && contentItem.callUrl}
        {@render liveSessionDot()}
      {:else if isContentLocked || isLockedForStudent}
        <span
          class="shrink-0"
          title={$t('course.navItem.lessons.add_lesson.lock')}
          aria-label={$t('course.navItem.lessons.add_lesson.lock')}
        >
          <LockIcon size={12} />
        </span>
      {/if}
    </div>
  </a>
{/snippet}

<nav class="flex flex-col gap-1 {className}" aria-label={$t('course.navItems.nav_content')}>
  {#if contentData.grouped}
    {#each contentData.sections as section (section.id)}
      {@const sectionProgress = getContentItemsProgress(section.items)}
      {@const sectionOpen = isSectionOpen(section.id)}
      <Collapsible.Root
        open={sectionOpen}
        onOpenChange={(open) => handleSectionOpenChange(section.id, open)}
        class="group/section"
      >
        <Collapsible.Trigger class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium">
          <CourseContentIcon type={ContentType.Section} size={12} />
          <span class="min-w-0 flex-1 truncate">{section.title}</span>
          <div class="ml-auto flex items-center gap-1">
            {#if sectionProgress.total > 0}
              <span
                class="shrink-0 text-[11px] font-medium tabular-nums {sectionProgress.completed ===
                sectionProgress.total
                  ? 'ui:text-green-600'
                  : 'ui:text-muted-foreground'}"
              >
                {formatSectionCompletionLabel(sectionProgress.completed, sectionProgress.total)}
              </span>
            {/if}
            <IconButton variant="ghost" size="icon-xs">
              <ChevronRightIcon class="transition-transform duration-200 group-data-[state=open]/section:rotate-90" />
            </IconButton>
          </div>
        </Collapsible.Trigger>
        <Collapsible.Content class="ml-2 flex flex-col gap-0.5 border-l pl-2">
          {#each section.items as contentItem (contentItem.id)}
            {@render contentItemRow(contentItem)}
          {/each}
        </Collapsible.Content>
      </Collapsible.Root>
    {/each}
  {:else}
    {#each contentData.items as contentItem (contentItem.id)}
      {@render contentItemRow(contentItem)}
    {/each}
  {/if}
</nav>

<style>
  a {
    text-decoration: none;
  }
</style>
