<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { flip } from 'svelte/animate';
  import { dndzone } from 'svelte-dnd-action';
  import CalendarClockIcon from '@lucide/svelte/icons/calendar-clock';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import HelpCircleIcon from '@lucide/svelte/icons/help-circle';
  import LockIcon from '@lucide/svelte/icons/lock';
  import { Spinner } from '@cio/ui/base/spinner';
  import UnlockIcon from '@lucide/svelte/icons/lock-open';
  import VideoIcon from '@lucide/svelte/icons/video';
  import { Button } from '@cio/ui/base/button';
  import { HoverableItem, AttachmentIcon } from '@cio/ui/custom/moving-icons';
  import formatDate from '$lib/utils/functions/formatDate';
  import { t } from '$lib/utils/functions/translations';
  import { globalStore } from '$lib/utils/store/app';
  import { contentApi, courseApi, exerciseApi, lessonApi } from '$features/course/api';
  import { snackbar } from '$features/ui/snackbar/store';
  import { profile } from '$lib/utils/store/user';
  import DeleteLessonConfirmation from '$features/course/components/lesson/delete-lesson-confirmation.svelte';
  import type { CourseContent, CourseContentItem } from '$features/course/utils/types';
  import { contentCreateStoreUtils, contentEditingStore } from '$features/course/components/content/store';
  import { getCourseContent } from '$features/course/utils/content';
  import { ContentType } from '@cio/utils/constants/content';
  import ContentRow from './content-row.svelte';
  import ContentActions from './content-actions.svelte';
  import SectionHeader from './section-header.svelte';
  import { deleteContent, saveContent, toggleLock } from './content-action-helpers';

  type CrudParam = {
    sectionId?: string;
    lessonId?: string;
    sectionTitle?: string;
    lessonTitle?: string;
  };

  interface Props {
    reorder?: boolean;
  }

  let { reorder = false }: Props = $props();

  let prevTitle: string | undefined = $state();
  let errors: Record<string, string> = $state({});
  let openDeleteModal = $state(false);
  let lockPendingItemKeys = $state<Record<string, boolean>>({});
  let deletingData = {
    id: '',
    isSection: false
  };
  const courseId = $derived(courseApi.course?.id || '');
  const profileId = $derived($profile?.id || '');
  const contentData = $derived(getCourseContent(courseApi.course));
  const isStudentView = $derived($globalStore.isStudent === true);
  const isLiveCourse = $derived(courseApi.course?.type === 'LIVE_CLASS');
  const isSelfPacedCourse = $derived(courseApi.course?.type === 'SELF_PACED');
  const metaChipClass =
    'inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-[10px] text-gray-700 dark:bg-neutral-700 dark:text-gray-200';

  type ContentDndItem = CourseContentItem & {
    id: string;
    contentId: string;
    isUnlocked?: boolean | null;
    isComplete?: boolean | null;
  };

  type ContentSection = CourseContent['sections'][number];

  type SectionDnd = {
    id: string;
    title: string;
    order: number | null;
    items: ContentDndItem[];
  };

  let sections = $state<SectionDnd[]>([]);

  function resolveErrors(apiErrors?: Record<string, string> | null) {
    if (!apiErrors) return {};
    const entries = Object.entries(apiErrors).filter(([, value]) => Boolean(value));
    return entries.length ? Object.fromEntries(entries) : {};
  }

  function buildSectionItems(section: ContentSection): ContentDndItem[] {
    return section.items.map((item) => ({
      ...item,
      id: `${item.type}-${item.id}`,
      contentId: item.id
    }));
  }

  function syncSections() {
    sections = (contentData.sections || []).map((section) => ({
      ...section,
      items: buildSectionItems(section)
    }));
  }

  function toCourseContentItems(items: ContentDndItem[]): CourseContentItem[] {
    return items.map(({ contentId, id: _dndId, ...rest }) => ({
      ...rest,
      id: contentId
    }));
  }

  function syncCourseContentSections(updatedSections: SectionDnd[]) {
    if (!courseApi.course?.content) return;

    courseApi.course.content = {
      ...courseApi.course.content,
      sections: updatedSections.map((section) => ({
        ...section,
        items: toCourseContentItems(section.items),
        order: section.order ?? null
      }))
    };
  }

  function updateSectionItems(sectionId: string, items: ContentDndItem[]) {
    sections = sections.map((section) => (section.id === sectionId ? { ...section, items } : section));
  }

  function normalizeSectionId(value?: string | null) {
    return value && value !== 'ungrouped' ? value : null;
  }

  async function applyPendingReorder() {
    if (!sections.length) return;

    const contentUpdates: Array<{
      id: string;
      type: ContentType.Lesson | ContentType.Exercise;
      order: number;
      sectionId?: string | null;
    }> = [];

    const updatedSections = sections.map((section, sectionIndex) => {
      const normalizedSectionId = normalizeSectionId(section.id);
      const updatedItems = section.items.map((item, index) => {
        const order = index + 1;

        if (item.type === ContentType.Lesson || item.type === ContentType.Exercise) {
          if (item.order !== order || item.sectionId !== normalizedSectionId) {
            contentUpdates.push({
              id: item.contentId,
              type: item.type,
              order,
              sectionId: normalizedSectionId
            });
          }
        }

        return {
          ...item,
          order,
          sectionId: normalizedSectionId
        };
      });

      return {
        ...section,
        order: sectionIndex + 1,
        items: updatedItems
      };
    });

    sections = updatedSections;
    syncCourseContentSections(updatedSections);

    const sectionsToReorder = updatedSections
      .filter((section) => section.id !== 'ungrouped')
      .map((section) => ({ id: section.id, order: section.order ?? 0 }));

    if (sectionsToReorder.length > 0) {
      await lessonApi.reorderSections(courseId, sectionsToReorder);
    }

    if (contentUpdates.length > 0) {
      await contentApi.updateContent(courseId, contentUpdates);
    }
  }

  let previousReorder = $state(false);

  $effect(() => {
    if (previousReorder && !reorder) {
      void applyPendingReorder();
    }
    previousReorder = reorder;

    if (!reorder || sections.length === 0) {
      syncSections();
    }
  });

  $effect(() => {
    const activeEditId = $contentEditingStore;
    if (!activeEditId) return;

    const hasMatchingSection = sections.some((section) => section.id === activeEditId);
    const hasMatchingItem = sections.some((section) => section.items.some((item) => item.contentId === activeEditId));

    if (!hasMatchingSection && !hasMatchingItem) {
      contentEditingStore.set(undefined);
    }
  });

  function onEdit(params: CrudParam) {
    contentEditingStore.set(params.sectionId || params.lessonId);
    prevTitle = params.sectionTitle || params.lessonTitle;
  }

  async function onSave(params: CrudParam, item?: ContentDndItem) {
    let nextErrors: Record<string, string> = {};
    let shouldRefreshSections = false;

    if (params.sectionId) {
      const section = sections.find((entry) => entry.id === params.sectionId);
      if (!section) return;

      if (section.id === 'ungrouped') {
        await lessonApi.promoteUngroupedSection(courseId, {
          title: section.title!
        });
        shouldRefreshSections = true;
      } else {
        await lessonApi.updateSection(courseId, section.id, {
          title: section.title!
        });
      }

      nextErrors = resolveErrors(lessonApi.errors);
    } else if (item) {
      nextErrors = await saveContent({
        item,
        courseId,
        lessonApi,
        exerciseApi
      });
    }

    errors = nextErrors;

    if (Object.keys(nextErrors).length === 0) {
      resetEdit();

      if (shouldRefreshSections) {
        if (profileId) {
          await courseApi.refreshCourse(courseId, profileId);
        }
        syncSections();
      } else {
        syncCourseContentSections(sections);
      }

      // Refresh course data to get updated information (especially for exercises)
      if (item?.type === ContentType.Exercise && exerciseApi.success && profileId) {
        await courseApi.refreshCourse(courseId, profileId);
      }

      // Note: exerciseApi.update already shows a success snackbar, so we don't need to show it again
      if (item?.type !== ContentType.Exercise) {
        snackbar.success('snackbar.success_update');
      }
    }
  }

  function onDelete(params: CrudParam) {
    deletingData.id = params.sectionId || params.lessonId || '';
    deletingData.isSection = params.sectionId ? true : false;
    openDeleteModal = true;
  }

  function removeSection(sectionId: string) {
    sections = sections.filter((section) => section.id !== sectionId);
    syncCourseContentSections(sections);
  }

  async function deleteLesson() {
    if (deletingData.isSection) {
      const wasDeleted = await contentApi.deleteContent(courseId, { sectionId: deletingData.id });
      if (wasDeleted) {
        removeSection(deletingData.id);
      }
      return;
    }

    const item = sections.flatMap((section) => section.items).find((entry) => entry.contentId === deletingData.id);

    if (!item) return;

    const wasDeleted = await deleteContent({
      item,
      courseId,
      lessonApi,
      exerciseApi
    });

    if (wasDeleted && profileId) {
      await courseApi.refreshCourse(courseId, profileId);
    }
  }

  async function toggleSectionLock(sectionId: string) {
    const section = sections.find((entry) => entry.id === sectionId);
    if (!section) return;

    const shouldLock = section.items.some((item) => item.isUnlocked ?? false);
    const nextIsUnlocked = !shouldLock;
    const updatedItems = section.items.map((item) => ({
      ...item,
      isUnlocked: nextIsUnlocked
    }));
    const updatedSections = sections.map((entry) =>
      entry.id === sectionId
        ? {
            ...entry,
            items: updatedItems
          }
        : entry
    );

    const wasUpdated = await contentApi.updateContent(
      courseId,
      updatedItems.map((item) => ({
        id: item.contentId,
        type: item.type as ContentType.Lesson | ContentType.Exercise,
        isUnlocked: nextIsUnlocked
      }))
    );

    if (!wasUpdated) return;

    sections = updatedSections;
    syncCourseContentSections(sections);
  }

  function resetEdit() {
    contentEditingStore.set(undefined);
    prevTitle = undefined;
    errors = {};
  }

  function openContentModal(sectionId: string) {
    contentCreateStoreUtils.openContentUnit(sectionId);
  }

  function getItemPath(item: ContentDndItem) {
    if (item.type === ContentType.Lesson) {
      return `/courses/${courseApi.course?.id}/lessons/${item.contentId}`;
    }

    return `/courses/${courseApi.course?.id}/exercises/${item.contentId}`;
  }

  function openExternalUrl(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function formatMetaDate(value?: string | null): string {
    if (!value) return '';
    return formatDate(value);
  }

  function isLockedForStudent(item: ContentDndItem) {
    return isStudentView && (item.isUnlocked ?? true) === false;
  }

  function getItemLockKey(item: ContentDndItem) {
    return `${item.type}-${item.contentId}`;
  }

  async function handleToggleItemLock(item: ContentDndItem) {
    const lockKey = getItemLockKey(item);
    if (lockPendingItemKeys[lockKey]) return;

    lockPendingItemKeys = {
      ...lockPendingItemKeys,
      [lockKey]: true
    };

    try {
      const lockErrors = await toggleLock({
        item,
        courseId,
        lessonApi,
        exerciseApi
      });
      errors = lockErrors;
      if (Object.keys(lockErrors).length === 0) {
        syncCourseContentSections(sections);
      }
    } finally {
      const nextPending = { ...lockPendingItemKeys };
      delete nextPending[lockKey];
      lockPendingItemKeys = nextPending;
    }
  }

  /**
   * Drag functionality
   */
  const flipDurationMs = 200;

  function handleDndConsiderColumns(e) {
    sections = e.detail.items as SectionDnd[];
    syncCourseContentSections(sections);
  }

  function handleDndFinalizeColumns(e) {
    const updatedSections = (e.detail.items as SectionDnd[]).map((section, index) => ({
      ...section,
      order: index + 1
    }));

    sections = updatedSections;
    syncCourseContentSections(updatedSections);
  }

  function handleDndConsiderCards(sectionId: string, e) {
    updateSectionItems(sectionId, e.detail.items as ContentDndItem[]);
    syncCourseContentSections(sections);
  }

  function handleDndFinalizeCards(sectionId: string, e) {
    const items = e.detail.items as ContentDndItem[];
    updateSectionItems(sectionId, items);
    syncCourseContentSections(sections);

    if (!reorder) {
      syncSections();
    }
  }
</script>

<DeleteLessonConfirmation bind:openDeleteModal {deleteLesson} />

<section
  class="mx-auto w-full p-3 lg:w-11/12 lg:px-4"
  use:dndzone={{
    items: sections,
    flipDurationMs,
    type: 'rows',
    dropTargetStyle: {
      border: '2px #1d4ed8 solid',
      'border-style': 'dashed'
    },
    dragDisabled: !reorder
  }}
  onconsider={handleDndConsiderColumns}
  onfinalize={handleDndFinalizeColumns}
>
  {#each sections as section (section.id)}
    {@const isUngrouped = section.id === 'ungrouped'}
    {@const hasSectionItems = section.items.length > 0}
    {@const sectionHasUnlocked = section.items.some((item) => item.isUnlocked ?? false)}
    {@const sectionLockLabel = hasSectionItems
      ? sectionHasUnlocked
        ? `${$t('course.navItem.lessons.add_lesson.lock')} ${$t('course.navItem.lessons.add_lesson.all')}`
        : `${$t('course.navItem.lessons.add_lesson.unlock')} ${$t('course.navItem.lessons.add_lesson.all')}`
      : undefined}
    <div
      class="border-border m-auto mb-3 max-w-xl rounded-md border transition dark:bg-neutral-800"
      style={reorder ? 'border: 2px #1d4ed8 solid; border-style: dashed; cursor: grab;' : ''}
    >
      <SectionHeader
        {section}
        isEditing={$contentEditingStore === section.id}
        isSaving={lessonApi.isLoading && $contentEditingStore === section.id}
        showActions={true}
        showAddContent={!isUngrouped}
        showDelete={!isUngrouped}
        disabled={Boolean($contentEditingStore && $contentEditingStore !== section.id)}
        {errors}
        lockLabel={isUngrouped ? undefined : sectionLockLabel}
        onEdit={() => onEdit({ sectionId: section.id, sectionTitle: section.title! })}
        onSave={() => onSave({ sectionId: section.id })}
        onCancel={() => {
          section.title = prevTitle ?? section.title;
          resetEdit();
        }}
        onAddContent={() => openContentModal(section.id)}
        onToggleLock={!isUngrouped && hasSectionItems ? () => toggleSectionLock(section.id) : undefined}
        onDelete={() => {
          if (!isUngrouped) {
            onDelete({ sectionId: section.id });
          }
        }}
      />

      <div
        class="m-3 {reorder ? 'cursor-grab active:cursor-grabbing' : ''}"
        use:dndzone={{
          items: section.items,
          flipDurationMs,
          dropTargetStyle: {
            border: '2px #1d4ed8 solid',
            'border-style': 'dashed'
          },
          dragDisabled: !reorder,
          type: 'section-content'
        }}
        onconsider={(e) => handleDndConsiderCards(section.id, e)}
        onfinalize={(e) => handleDndFinalizeCards(section.id, e)}
      >
        {#each section.items as item (item.id)}
          {@const isEditingItem = $contentEditingStore === item.contentId}
          {@const itemLocked = isLockedForStudent(item)}
          {@const itemLockLabel = item.isUnlocked
            ? $t('course.navItem.lessons.add_lesson.lock')
            : $t('course.navItem.lessons.add_lesson.unlock')}
          {@const canRenderJoinButton =
            item.type === ContentType.Lesson && isLiveCourse && Boolean(item.callUrl) && !itemLocked}
          {@const canRenderContinueButton = isStudentView && !itemLocked}
          {@const isLockPending = Boolean(lockPendingItemKeys[getItemLockKey(item)])}
          {@const actionDisabled = Boolean($contentEditingStore && !isEditingItem)}

          <div
            class="mb-2 flex min-h-[50px] max-w-xl items-start justify-between rounded-md border border-gray-200 px-3 py-1 transition"
            style={reorder ? 'border: 2px #1d4ed8 solid; border-style: dashed; cursor: grab;' : ''}
            animate:flip={{ duration: flipDurationMs }}
          >
            {#if item.type === ContentType.Lesson}
              <ContentRow
                {item}
                bind:title={item.title}
                isLocked={itemLocked}
                href={resolve(itemLocked ? page.url.pathname : getItemPath(item), {})}
                isEditing={isEditingItem}
                {errors}
                preloadOff
              >
                {#snippet meta()}
                  {@const hasVideos = (item.videosCount ?? 0) > 0}
                  {@const hasDocuments = (item.documentsCount ?? 0) > 0}
                  {@const hasNote = item.hasNoteContent === true}
                  {@const hasSlide = item.hasSlideContent === true}
                  {@const hasAnyMaterials = hasVideos || hasDocuments || hasNote || hasSlide}
                  <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {#if hasVideos}
                      <span class={metaChipClass}>
                        <VideoIcon size={11} />
                        {item.videosCount}
                      </span>
                    {/if}

                    {#if hasDocuments}
                      <span class={metaChipClass}>
                        <FileTextIcon size={11} />
                        {item.documentsCount}
                      </span>
                    {/if}

                    {#if hasNote}
                      <span class={metaChipClass}>
                        <FileTextIcon size={11} />
                        {$t('course.navItem.lessons.materials.tabs.note.title')}
                      </span>
                    {/if}

                    {#if hasSlide}
                      <span class={metaChipClass}>
                        <FileTextIcon size={11} />
                        {$t('course.navItem.lessons.materials.tabs.slide.title')}
                      </span>
                    {/if}

                    {#if !hasAnyMaterials}
                      <HoverableItem>
                        {#snippet children(isHovered)}
                          <span class={metaChipClass}>
                            <AttachmentIcon size={11} {isHovered} />
                            {$t('course.navItem.lessons.materials.no_content')}
                          </span>
                        {/snippet}
                      </HoverableItem>
                    {/if}

                    {#if isLiveCourse && item.lessonAt}
                      <span class={metaChipClass}>
                        <CalendarClockIcon size={11} />
                        {formatMetaDate(item.lessonAt)}
                      </span>
                    {/if}

                    {#if isStudentView}
                      <span class={metaChipClass}>
                        {item.isComplete
                          ? $t('course.navItem.lessons.complete')
                          : $t('course.navItem.lessons.incomplete')}
                      </span>
                    {/if}
                  </div>
                {/snippet}
              </ContentRow>
            {:else if item.type === ContentType.Exercise}
              <ContentRow
                {item}
                bind:title={item.title}
                isLocked={itemLocked}
                href={resolve(itemLocked ? page.url.pathname : getItemPath(item), {})}
                isEditing={isEditingItem}
                {errors}
              >
                {#snippet meta()}
                  <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {#if !isStudentView && item.questionCount !== null}
                      <span class={metaChipClass}>
                        <HelpCircleIcon size={11} />
                        {item.questionCount}
                        {$t('course.navItem.lessons.exercises.all_exercises.questions')}
                      </span>
                    {/if}

                    {#if isSelfPacedCourse && item.dueBy}
                      <span class={metaChipClass}>
                        <CalendarClockIcon size={11} />
                        {$t('course.navItem.lessons.exercises.all_exercises.view_mode.due')}: {formatMetaDate(
                          item.dueBy
                        )}
                      </span>
                    {/if}
                  </div>
                {/snippet}
              </ContentRow>
            {/if}

            <div class="ml-3 flex min-w-fit items-start gap-2">
              {#if isStudentView}
                <span class="mt-1 inline-flex items-center text-gray-500 dark:text-gray-300">
                  {#if itemLocked}
                    <LockIcon size={16} />
                  {:else}
                    <UnlockIcon size={16} />
                  {/if}
                </span>
              {:else}
                <Button
                  size="icon-sm"
                  variant="outline"
                  class="h-8 w-8 text-gray-600"
                  onclick={() => handleToggleItemLock(item)}
                  disabled={actionDisabled || isEditingItem || isLockPending}
                  aria-label={itemLockLabel}
                  title={itemLockLabel}
                >
                  {#if isLockPending}
                    <Spinner class="h-5 w-5" />
                  {:else if item.isUnlocked}
                    <UnlockIcon class="h-5 w-5" />
                  {:else}
                    <LockIcon class="h-5 w-5" />
                  {/if}
                </Button>
              {/if}

              {#if !isStudentView && canRenderJoinButton}
                <Button size="sm" variant="outline" class="mt-0.5" onclick={() => openExternalUrl(item.callUrl!)}>
                  {$t('schedule.join')}
                </Button>
              {/if}

              {#if isStudentView && canRenderContinueButton && !isEditingItem}
                {#if canRenderJoinButton}
                  <Button size="sm" onclick={() => openExternalUrl(item.callUrl!)}>{$t('schedule.join')}</Button>
                {:else}
                  <a href={resolve(getItemPath(item), {})}>
                    <Button size="sm" variant="outline">{$t('dashboard.continue')}</Button>
                  </a>
                {/if}
              {/if}

              {#if !isStudentView}
                <ContentActions
                  isEditing={isEditingItem}
                  disabled={actionDisabled}
                  lockLabel={itemLockLabel}
                  showLock={false}
                  onEdit={() => onEdit({ lessonId: item.contentId, lessonTitle: item.title })}
                  onSave={() => onSave({ lessonId: item.contentId }, item)}
                  onCancel={() => {
                    item.title = prevTitle ?? item.title;
                    resetEdit();
                  }}
                  onDelete={() => onDelete({ lessonId: item.contentId })}
                  onToggleLock={() => handleToggleItemLock(item)}
                />
              {/if}
            </div>
          </div>
        {:else}
          {$t('course.navItem.lessons.no_lesson')}
        {/each}
      </div>
    </div>
  {/each}
</section>
