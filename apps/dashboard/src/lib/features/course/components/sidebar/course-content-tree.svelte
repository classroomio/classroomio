<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import Plus from '@lucide/svelte/icons/plus';
  import LockIcon from '@lucide/svelte/icons/lock';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import * as Sidebar from '@cio/ui/base/sidebar';
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
    id: string;
    isStudent?: boolean;
    className?: string;
    onOpenContentModal?: (sectionId?: string) => void;
    onEditSection?: (sectionId: string) => void;
  }

  let { path, id, isStudent = false, className = '', onOpenContentModal }: Props = $props();

  const contentData = $derived(getCourseContent(courseApi.course));
  const canOpenContentModal = $derived(Boolean(onOpenContentModal) && !isStudent);
  const currentPath = $derived(path || page.url.pathname);
  const activeSectionId = $derived(getActiveSectionId(courseApi.course, currentPath));

  let expandedSectionIds = new SvelteSet<string>();
  let trackedActiveSectionId = $state<string | null>(null);

  $effect(() => {
    if (!isStudent || !contentData.grouped || !activeSectionId) {
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
    if (!isStudent) {
      return true;
    }

    return expandedSectionIds.has(sectionId);
  }

  function handleSectionOpenChange(sectionId: string, open: boolean) {
    if (!isStudent) {
      return;
    }

    if (open) {
      expandedSectionIds.add(sectionId);
      return;
    }

    expandedSectionIds.delete(sectionId);
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
  <Sidebar.MenuSubItem>
    <Sidebar.MenuSubButton isActive={isContentItemInPath(contentItem.id, currentPath)}>
      {#snippet child({ props })}
        <a
          href={resolve(getContentRoute(id, contentItem), {})}
          aria-disabled={isLockedForStudent}
          title={contentItem.title}
          data-sidebar-content-id={contentItem.id}
          class="flex w-full items-center gap-2 {isLockedForStudent ? 'cursor-not-allowed opacity-50' : ''}"
          onclick={(event) => {
            if (isLockedForStudent) {
              event.preventDefault();
            } else if (isStudent && contentData.grouped) {
              const sectionId = getSectionIdForContentItem(courseApi.course, contentItem.id);
              if (sectionId) {
                expandedSectionIds.clear();
                expandedSectionIds.add(sectionId);
              }
            }
          }}
          {...props}
        >
          <CourseContentIcon type={contentItem.type} size={14} />
          <span class="flex-1 truncate">{contentItem.title}</span>
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
    </Sidebar.MenuSubButton>
  </Sidebar.MenuSubItem>
{/snippet}

<Sidebar.MenuSub class={className}>
  {#if contentData.grouped}
    {#each contentData.sections as section (section.id)}
      {@const sectionProgress = getContentItemsProgress(section.items)}
      {@const sectionOpen = isSectionOpen(section.id)}
      <Collapsible.Root
        open={sectionOpen}
        onOpenChange={(open) => handleSectionOpenChange(section.id, open)}
        class="group/section"
      >
        {#snippet child({ props })}
          <Sidebar.MenuSubItem {...props}>
            <Collapsible.Trigger>
              {#snippet child({ props })}
                <Sidebar.MenuSubButton {...props} class="flex w-full items-center gap-2 font-medium">
                  <CourseContentIcon type={ContentType.Section} size={12} />

                  <span class="flex-1 truncate">{section.title}</span>

                  <div class="ml-auto flex items-center gap-1">
                    {#if isStudent}
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
                    {/if}
                    {#if canOpenContentModal}
                      <IconButton
                        variant="ghost-outline"
                        size="icon-xs"
                        class="opacity-0 transition-opacity duration-150 group-hover/section:opacity-100"
                        onclick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          onOpenContentModal?.(section.id);
                        }}
                      >
                        <Plus />
                      </IconButton>
                    {/if}

                    <IconButton variant="ghost" size="icon-xs">
                      <ChevronRightIcon
                        class="transition-transform duration-200 group-data-[state=open]/section:rotate-90"
                      />
                    </IconButton>
                  </div>
                </Sidebar.MenuSubButton>
              {/snippet}
            </Collapsible.Trigger>
            <Collapsible.Content>
              <Sidebar.MenuSub class="ml-2">
                {#each section.items as contentItem (contentItem.id)}
                  {@render contentItemRow(contentItem)}
                {/each}
              </Sidebar.MenuSub>
            </Collapsible.Content>
          </Sidebar.MenuSubItem>
        {/snippet}
      </Collapsible.Root>
    {/each}
  {:else}
    {#each contentData.items as contentItem (contentItem.id)}
      {@render contentItemRow(contentItem)}
    {/each}
  {/if}
</Sidebar.MenuSub>

<style>
  a {
    text-decoration: none;
  }
</style>
