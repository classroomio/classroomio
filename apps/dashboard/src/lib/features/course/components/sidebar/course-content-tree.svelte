<script lang="ts">
  import {
    dragHandleZone,
    dragHandle,
    TRIGGERS,
    SOURCES,
    SHADOW_ITEM_MARKER_PROPERTY_NAME,
    type DndEvent
  } from 'svelte-dnd-action';
  import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
  import { tick } from 'svelte';
  import {
    buildSidebarOutline,
    outlineReorderPayload,
    outlineToCourseContent,
    updateSidebarOutlineZone
  } from '$features/course/utils/sidebar-outline';
  import type { SidebarOutlineEntry } from '$features/course/utils/types';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import Plus from '@lucide/svelte/icons/plus';
  import LockIcon from '@lucide/svelte/icons/lock';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import * as Collapsible from '@cio/ui/base/collapsible';
  import { ContentType } from '@cio/utils/constants/content';
  import { courseApi, contentApi } from '$features/course/api';
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
  import CourseContentIcon from '$features/course/components/course-content-icon.svelte';
  import { isCourseLearnerView } from '$lib/utils/store/app';
  import { SvelteSet } from 'svelte/reactivity';
  import { getSessionIndicatorPhase, liveSessionClock } from '$features/course/utils/live-session-phase';
  import LiveSessionIndicator from '$features/course/components/lesson/live-session-indicator.svelte';

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
  let outline = $state<SidebarOutlineEntry[]>([]);
  let dragging = $state(false);
  let draggingSection = $state(false);
  let saving = $state(false);
  let finalizeVersion = 0;

  $effect(() => {
    if (!dragging && !saving) {
      outline = buildSidebarOutline(contentData);
    }
  });

  function handleConsider(sectionId: string | null, event: CustomEvent<DndEvent<SidebarOutlineEntry>>) {
    if (!canOpenContentModal || saving) return;

    if (event.detail.info.trigger === TRIGGERS.DRAG_STOPPED) {
      void handleFinalize(sectionId, event);
      return;
    }

    if (event.detail.info.trigger === TRIGGERS.DRAG_STARTED) {
      draggingSection = outline.some((entry) => entry.id === event.detail.info.id && entry.kind === 'section');
    }
    dragging = true;
    outline = updateSidebarOutlineZone(outline, sectionId, event.detail.items);
  }

  async function handleFinalize(sectionId: string | null, event: CustomEvent<DndEvent<SidebarOutlineEntry>>) {
    if (!canOpenContentModal || saving) return;

    outline = updateSidebarOutlineZone(outline, sectionId, event.detail.items);
    if (event.detail.info.trigger === TRIGGERS.DROPPED_INTO_ANOTHER) return;

    if (event.detail.info.source === SOURCES.KEYBOARD && event.detail.info.trigger !== TRIGGERS.DRAG_STOPPED) return;

    const version = ++finalizeVersion;
    await tick();
    if (version !== finalizeVersion || !courseApi.course?.content) return;

    const course = courseApi.course;
    const previousContent = course.content;
    const payload = outlineReorderPayload(outline, contentData.grouped);
    const nextContent = outlineToCourseContent(outline, contentData.grouped);
    saving = true;
    dragging = false;
    draggingSection = false;
    courseApi.course.content = nextContent;
    const saved = await contentApi.reorder(course.id, payload);
    if (!saved && courseApi.course?.id === course.id) {
      courseApi.course.content = previousContent;
    }
    saving = false;
  }
</script>

{#snippet contentItemRow(contentItem: (typeof contentData.items)[number])}
  {@const isContentLocked = (contentItem.isUnlocked ?? true) === false}
  {@const isLockedForStudent = $isCourseLearnerView && (isContentLocked || contentItem.accessible === false)}
  {@const sessionPhase =
    contentItem.type === ContentType.Lesson ? getSessionIndicatorPhase(contentItem, $liveSessionClock) : null}
  <Sidebar.MenuSubButton isActive={isContentItemInPath(contentItem.id, currentPath)}>
    {#snippet child({ props })}
      <a
        {...props}
        href={resolve(getContentRoute(id, contentItem), {})}
        aria-disabled={isLockedForStudent}
        title={contentItem.title}
        data-sidebar-content-id={contentItem.id}
        class="{props.class} group/content-row flex w-full items-center gap-2 {isLockedForStudent
          ? 'cursor-not-allowed opacity-50'
          : ''}"
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
      >
        {#if canOpenContentModal}
          <span
            use:dragHandle
            role="button"
            tabindex="0"
            onkeydown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') event.preventDefault();
            }}
            class="outline-handle relative flex size-3.5 shrink-0 cursor-grab items-center justify-center"
            aria-label={$t('course.navItem.lessons.drag')}
            onclick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            <span class="outline-icon"><CourseContentIcon type={contentItem.type} size={14} /></span>
            <GripVerticalIcon class="outline-grip absolute size-3.5" />
          </span>
        {:else}
          <CourseContentIcon type={contentItem.type} size={14} />
        {/if}
        <span class="flex-1 truncate">{contentItem.title}</span>
        <div class="ml-auto flex items-center gap-1">
          {#if contentItem.isComplete}
            <span class="shrink-0">
              <CircleCheckIcon size={16} filled />
            </span>
          {/if}
          {#if sessionPhase === 'live'}
            <LiveSessionIndicator phase={sessionPhase} />
          {:else if isContentLocked || isLockedForStudent}
            <span
              class="shrink-0"
              title={$t('course.navItem.lessons.add_lesson.lock')}
              aria-label={$t('course.navItem.lessons.add_lesson.lock')}
            >
              <LockIcon size={12} />
            </span>
          {:else if sessionPhase}
            <LiveSessionIndicator phase={sessionPhase} />
          {/if}
        </div>
      </a>
    {/snippet}
  </Sidebar.MenuSubButton>
{/snippet}

<div class={className}>
  <ul
    data-sidebar-outline
    use:dragHandleZone={{
      items: outline,
      type: 'course-sidebar-outline',
      centreDraggedOnCursor: true,
      dragDisabled: !canOpenContentModal || saving,
      dropTargetStyle: { outline: '2px solid var(--color-primary)' }
    }}
    onconsider={(event) => handleConsider(null, event)}
    onfinalize={(event) => handleFinalize(null, event)}
    class="min-h-8 list-none"
  >
    {#each outline as entry (entry.id)}
      <li
        data-is-dnd-shadow-item-hint={(entry as SidebarOutlineEntry & Record<string, unknown>)[
          SHADOW_ITEM_MARKER_PROPERTY_NAME
        ]}
      >
        {#if entry.kind === 'item'}
          {@render contentItemRow(entry.item)}
        {:else}
          {@const section = entry.section}
          {@const sectionProgress = getContentItemsProgress(
            entry.items.flatMap((child) => (child.kind === 'item' ? [child.item] : []))
          )}
          {@const sectionOpen = isSectionOpen(section.id)}
          <Collapsible.Root
            open={sectionOpen}
            onOpenChange={(open) => handleSectionOpenChange(section.id, open)}
            class="group/section"
          >
            {#snippet child({ props })}
              <div {...props} data-sidebar-section-id={section.id}>
                <Collapsible.Trigger>
                  {#snippet child({ props })}
                    <Sidebar.MenuSubButton
                      {...props}
                      class="group/content-row flex w-full items-center gap-2 font-medium"
                    >
                      {#if canOpenContentModal}
                        <span
                          use:dragHandle
                          role="button"
                          tabindex="0"
                          onkeydown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') event.preventDefault();
                          }}
                          class="outline-handle relative flex size-3.5 shrink-0 cursor-grab items-center justify-center"
                          aria-label={$t('course.navItem.lessons.drag')}
                          onclick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                          }}
                        >
                          <span class="outline-icon"><CourseContentIcon type={ContentType.Section} size={12} /></span>
                          <GripVerticalIcon class="outline-grip absolute size-3.5" />
                        </span>
                      {:else}
                        <CourseContentIcon type={ContentType.Section} size={12} />
                      {/if}

                      <span class="flex-1 truncate">{section.title}</span>

                      <div class="ml-auto flex items-center gap-1">
                        {#if isStudent}
                          {#if sectionProgress.total > 0}
                            <span
                              class="shrink-0 text-[11px] font-medium tabular-nums {sectionProgress.completed ===
                              sectionProgress.total
                                ? 'text-green-600'
                                : 'ui:text-muted-foreground'}"
                            >
                              {formatSectionCompletionLabel(sectionProgress.completed, sectionProgress.total)}
                            </span>
                          {/if}
                        {/if}
                        {#if canOpenContentModal}
                          <IconButton
                            variant="secondary"
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

                        <IconButton variant="secondary" size="icon-xs">
                          <ChevronRightIcon
                            class="transition-transform duration-200 group-data-[state=open]/section:rotate-90"
                          />
                        </IconButton>
                      </div>
                    </Sidebar.MenuSubButton>
                  {/snippet}
                </Collapsible.Trigger>
                <Collapsible.Content>
                  <div class="ui:border-sidebar-border ml-2 border-l pl-2">
                    <ul
                      data-sidebar-section-items={section.id}
                      use:dragHandleZone={{
                        items: entry.items,
                        type: 'course-sidebar-outline',
                        centreDraggedOnCursor: true,
                        dragDisabled: !canOpenContentModal || saving,
                        dropFromOthersDisabled: draggingSection,
                        dropTargetStyle: { outline: '2px solid var(--color-primary)' }
                      }}
                      onconsider={(event) => handleConsider(section.id, event)}
                      onfinalize={(event) => handleFinalize(section.id, event)}
                      class="min-h-8 list-none"
                    >
                      {#each entry.items as child (child.id)}
                        <li
                          data-is-dnd-shadow-item-hint={(child as SidebarOutlineEntry & Record<string, unknown>)[
                            SHADOW_ITEM_MARKER_PROPERTY_NAME
                          ]}
                        >
                          {#if child.kind === 'item'}{@render contentItemRow(child.item)}{/if}
                        </li>
                      {/each}
                    </ul>
                  </div>
                </Collapsible.Content>
              </div>
            {/snippet}
          </Collapsible.Root>
        {/if}
      </li>
    {/each}
  </ul>
</div>

<style>
  :global(.group\/content-row:hover .outline-icon),
  :global(.outline-handle:focus .outline-icon) {
    opacity: 0;
  }
  .outline-grip {
    opacity: 0;
  }
  :global(.group\/content-row:hover .outline-grip),
  :global(.outline-handle:focus .outline-grip) {
    opacity: 1;
  }
  a {
    text-decoration: none;
  }
</style>
