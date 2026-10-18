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
  import type { CourseContentItem, SidebarDeleteTarget, SidebarOutlineEntry } from '$features/course/utils/types';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';
  import Plus from '@lucide/svelte/icons/plus';
  import FilePenLineIcon from '@lucide/svelte/icons/file-pen-line';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import LockIcon from '@lucide/svelte/icons/lock';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import * as Collapsible from '@cio/ui/base/collapsible';
  import { ContentType } from '@cio/utils/constants/content';
  import { courseApi, contentApi, exerciseApi, lessonApi } from '$features/course/api';
  import { deleteContent } from '$features/course/components/lesson/content-action-helpers';
  import DeleteLessonConfirmation from '$features/course/components/lesson/delete-lesson-confirmation.svelte';
  import { snackbar } from '$features/ui/snackbar/store';
  import { profile } from '$lib/utils/store/user';
  import {
    getContentEditRoute,
    getContentItemsProgress,
    getContentRoute,
    getCourseContent
  } from '$features/course/utils/content';
  import {
    formatSectionCompletionLabel,
    getActiveSectionId,
    getSectionIdForContentItem,
    isContentItemInPath
  } from '$features/course/utils/content-navigation';
  import { CircleCheckIcon } from '$features/ui/icons';
  import { t } from '$lib/utils/functions/translations';
  import { Button } from '@cio/ui/base/button';
  import * as Tooltip from '@cio/ui/base/tooltip';
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
  const canManageContent = $derived(Boolean(onOpenContentModal) && !isStudent && !$isCourseLearnerView);
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

  let openedEmptySectionIds = new SvelteSet<string>();

  function isEmptySection(sectionId: string): boolean {
    const section = contentData.sections.find((entry) => entry.id === sectionId);

    return (section?.items.length ?? 0) === 0;
  }

  function isSectionOpen(sectionId: string): boolean {
    if (isEmptySection(sectionId)) {
      return openedEmptySectionIds.has(sectionId) || (dragging && !draggingSection);
    }

    if (!isStudent) {
      return true;
    }

    return expandedSectionIds.has(sectionId);
  }

  function handleSectionOpenChange(sectionId: string, open: boolean) {
    if (isEmptySection(sectionId)) {
      if (open) {
        openedEmptySectionIds.add(sectionId);
        return;
      }

      openedEmptySectionIds.delete(sectionId);
      return;
    }

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
    if (!canManageContent || saving) return;

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
    if (!canManageContent || saving) return;

    outline = updateSidebarOutlineZone(outline, sectionId, event.detail.items);
    if (event.detail.info.trigger === TRIGGERS.DROPPED_INTO_ANOTHER) return;

    if (event.detail.info.source === SOURCES.KEYBOARD && event.detail.info.trigger !== TRIGGERS.DRAG_STOPPED) return;

    const version = ++finalizeVersion;
    await tick();
    if (version !== finalizeVersion) return;

    if (!courseApi.course?.content) {
      dragging = false;
      draggingSection = false;
      return;
    }

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

  let deleteTarget = $state<SidebarDeleteTarget | null>(null);
  let openDeleteModal = $state(false);

  function requestDelete(event: MouseEvent, target: SidebarDeleteTarget) {
    event.preventDefault();
    event.stopPropagation();
    deleteTarget = target;
    openDeleteModal = true;
  }

  function requestEdit(event: MouseEvent, item: CourseContentItem) {
    event.preventDefault();
    event.stopPropagation();
    void goto(resolve(getContentEditRoute(id, item), {}));
  }

  function isViewingDeleteTarget(target: SidebarDeleteTarget) {
    if (target.kind === 'section') return activeSectionId === target.sectionId;

    return isContentItemInPath(target.item.id, currentPath);
  }

  async function deleteOutlineItem(courseId: string, item: CourseContentItem) {
    return deleteContent({
      item: {
        type: item.type,
        contentId: item.id,
        title: item.title,
        isUnlocked: item.isUnlocked,
        sectionId: item.sectionId,
        order: item.order
      },
      courseId,
      lessonApi,
      exerciseApi
    });
  }

  async function confirmDelete() {
    const target = deleteTarget;
    const courseId = courseApi.course?.id;
    if (!target || !courseId) return;

    const wasViewingTarget = isViewingDeleteTarget(target);
    const wasDeleted =
      target.kind === 'section'
        ? await contentApi.deleteContent(courseId, { sectionId: target.sectionId })
        : await deleteOutlineItem(courseId, target.item);
    deleteTarget = null;
    if (!wasDeleted) return;

    if (target.kind === 'section') {
      snackbar.success('snackbar.lessons.section_deleted');
    }
    if (wasViewingTarget) {
      await goto(resolve(`/courses/${courseId}/lessons`, {}));
    }

    const profileId = $profile?.id;
    if (profileId) {
      await courseApi.refreshCourse(courseId, profileId);
    }
  }
</script>

<DeleteLessonConfirmation bind:openDeleteModal deleteLesson={confirmDelete} />

{#snippet rowAction(label: string, onclick: (event: MouseEvent) => void, Icon: typeof Plus)}
  <Tooltip.Provider delayDuration={300}>
    <Tooltip.Root>
      <Tooltip.Trigger>
        {#snippet child({ props })}
          <Button
            {...props}
            variant="ghost"
            size="icon-2xs"
            class="ui:text-muted-foreground ui:hover:text-foreground"
            aria-label={label}
            {onclick}
          >
            <Icon class="size-3.5" />
          </Button>
        {/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content side="top" sideOffset={6}>
        <span>{label}</span>
      </Tooltip.Content>
    </Tooltip.Root>
  </Tooltip.Provider>
{/snippet}

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
        {#if canManageContent}
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
            <CourseContentIcon type={contentItem.type} size={14} className="outline-icon" />
            <GripVerticalIcon class="outline-grip absolute size-3.5" />
          </span>
        {:else}
          <CourseContentIcon type={contentItem.type} size={14} />
        {/if}
        <span class="flex-1 truncate" title={contentItem.title}>{contentItem.title}</span>
        <div class="ml-auto flex items-center gap-1">
          {#if canManageContent}
            <div class="hidden items-center gap-2 group-focus-within/content-row:flex group-hover/content-row:flex">
              {@render rowAction(
                $t('course.navItem.lessons.edit'),
                (event) => requestEdit(event, contentItem),
                FilePenLineIcon
              )}
              {@render rowAction(
                $t('common.delete'),
                (event) => requestDelete(event, { kind: 'item', item: contentItem }),
                Trash2Icon
              )}
            </div>
          {/if}
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

{#snippet sectionDropZone(sectionId: string, items: SidebarOutlineEntry[], visible: boolean)}
  <div class={visible ? 'ui:border-sidebar-border ml-3.5 border-l pl-0.5' : ''}>
    <ul
      data-sidebar-section-items={sectionId}
      use:dragHandleZone={{
        items,
        type: 'course-sidebar-outline',
        dragDisabled: !canManageContent || saving,
        dropFromOthersDisabled: draggingSection,
        dropTargetStyle: { outline: '2px solid var(--color-primary)' }
      }}
      onconsider={(event) => handleConsider(sectionId, event)}
      onfinalize={(event) => handleFinalize(sectionId, event)}
      class="list-none {visible ? 'min-h-8' : 'h-0 overflow-hidden'}"
    >
      {#each items as child (child.id)}
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
{/snippet}

{#snippet sectionChevron(iconClass = '')}
  <ChevronRightIcon
    class="ui:text-muted-foreground size-3.5 shrink-0 transition-transform duration-200 {draggingSection
      ? ''
      : 'group-data-[state=open]/section:rotate-90'} {iconClass}"
  />
{/snippet}

<div class={className}>
  <ul
    data-sidebar-outline
    use:dragHandleZone={{
      items: outline,
      type: 'course-sidebar-outline',
      dragDisabled: !canManageContent || saving,
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
                      {#if canManageContent}
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
                          {@render sectionChevron('outline-icon')}
                          <GripVerticalIcon class="outline-grip absolute size-3.5" />
                        </span>
                      {:else}
                        {@render sectionChevron()}
                      {/if}

                      <span class="flex-1 truncate">{section.title}</span>

                      <div class="ml-auto flex items-center gap-1">
                        {#if sectionProgress.total > 0}
                          {#if isStudent}
                            <span
                              class="shrink-0 text-[11px] font-medium tabular-nums {sectionProgress.completed ===
                              sectionProgress.total
                                ? 'text-green-600'
                                : 'ui:text-muted-foreground'}"
                            >
                              {formatSectionCompletionLabel(sectionProgress.completed, sectionProgress.total)}
                            </span>
                          {:else}
                            <span class="ui:text-muted-foreground shrink-0 text-[11px] font-medium tabular-nums">
                              {sectionProgress.total}
                            </span>
                          {/if}
                        {/if}
                        {#if canManageContent}
                          <div
                            class="hidden items-center gap-2 group-focus-within/content-row:flex group-hover/content-row:flex"
                          >
                            {@render rowAction(
                              $t('course.navItem.lessons.add_content_add_to_section'),
                              (event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                onOpenContentModal?.(section.id);
                              },
                              Plus
                            )}
                            {@render rowAction(
                              $t('common.delete'),
                              (event) => requestDelete(event, { kind: 'section', sectionId: section.id }),
                              Trash2Icon
                            )}
                          </div>
                        {/if}
                      </div>
                    </Sidebar.MenuSubButton>
                  {/snippet}
                </Collapsible.Trigger>
                {#if isEmptySection(section.id)}
                  {@render sectionDropZone(section.id, entry.items, sectionOpen)}
                {:else}
                  <Collapsible.Content>
                    {@render sectionDropZone(section.id, entry.items, !draggingSection)}
                  </Collapsible.Content>
                {/if}
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
  :global(.outline-grip) {
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
