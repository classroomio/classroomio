<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { flip } from 'svelte/animate';
  import { dndzone } from 'svelte-dnd-action';
  import { t } from '$lib/utils/functions/translations';
  import { globalStore } from '$lib/utils/store/app';
  import { contentApi, courseApi, exerciseApi, lessonApi } from '$features/course/api';
  import { snackbar } from '$features/ui/snackbar/store';
  import { profile } from '$lib/utils/store/user';
  import DeleteLessonConfirmation from '$features/course/components/lesson/delete-lesson-confirmation.svelte';
  import type { CourseContent, CourseContentItem } from '$features/course/utils/types';
  import { contentCreateStore, contentEditingStore } from '$features/course/components/content/store';
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
  let deletingData = {
    id: '',
    isSection: false
  };
  const courseId = $derived(courseApi.course?.id || '');
  const profileId = $derived($profile?.id || '');
  const contentData = $derived(getCourseContent(courseApi.course));

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

  $effect(() => {
    if (!reorder || sections.length === 0) {
      syncSections();
    }
  });

  function onEdit(params: CrudParam) {
    contentEditingStore.set(params.sectionId || params.lessonId);
    prevTitle = params.sectionTitle || params.lessonTitle;
  }

  async function onSave(params: CrudParam, item?: ContentDndItem) {
    let nextErrors: Record<string, string> = {};

    if (params.sectionId) {
      const section = sections.find((entry) => entry.id === params.sectionId);
      if (!section) return;

      await lessonApi.updateSection(courseId, section.id, {
        title: section.title!
      });

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
      syncCourseContentSections(sections);

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
    contentCreateStore.set({
      open: true,
      sectionId,
      initialType: ContentType.Lesson
    });
  }

  /**
   * Drag functionality
   */
  const flipDurationMs = 200;

  function handleDndConsiderColumns(e) {
    sections = e.detail.items as SectionDnd[];
  }

  async function handleDndFinalizeColumns(e) {
    const updatedSections = (e.detail.items as SectionDnd[]).map((section, index) => ({
      ...section,
      order: index + 1
    }));

    sections = updatedSections;

    const sectionsToReorder = updatedSections
      .filter((section) => section.id !== 'ungrouped')
      .map((section) => ({ id: section.id, order: section.order ?? 0 }));

    if (sectionsToReorder.length > 0) {
      await lessonApi.reorderSections(courseId, sectionsToReorder);
    }

    syncCourseContentSections(updatedSections);
  }

  function handleDndConsiderCards(sectionId: string, e) {
    updateSectionItems(sectionId, e.detail.items as ContentDndItem[]);
  }

  async function handleDndFinalizeCards(sectionId: string, e) {
    const items = e.detail.items as ContentDndItem[];
    updateSectionItems(sectionId, items);

    const normalizedSectionId = sectionId === 'ungrouped' ? null : sectionId;
    const contentUpdates: Array<{
      id: string;
      type: ContentType.Lesson | ContentType.Exercise;
      order: number;
      sectionId?: string | null;
    }> = [];

    items.forEach((item, index) => {
      const order = index + 1;

      if (item.type !== ContentType.Lesson && item.type !== ContentType.Exercise) {
        return;
      }

      if (item.order !== order || item.sectionId !== normalizedSectionId) {
        item.order = order;
        item.sectionId = normalizedSectionId;
        contentUpdates.push({
          id: item.contentId,
          type: item.type,
          order,
          sectionId: normalizedSectionId
        });
      }
    });

    if (contentUpdates.length > 0) {
      await contentApi.updateContent(courseId, contentUpdates);
    }

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
    {@const lockLabel = hasSectionItems
      ? sectionHasUnlocked
        ? $t('course.navItem.lessons.add_lesson.lock')
        : $t('course.navItem.lessons.add_lesson.unlock')
      : undefined}
    <div
      class="m-auto mb-3 max-w-xl rounded-md border-2 border-gray-200 transition dark:bg-neutral-800 {reorder
        ? 'border-primary-300 bg-primary-50/40 cursor-move shadow-sm'
        : ''}"
    >
      <SectionHeader
        {section}
        isEditing={$contentEditingStore === section.id}
        showActions={!isUngrouped}
        disabled={!!$contentEditingStore}
        {errors}
        {lockLabel}
        onEdit={() => onEdit({ sectionId: section.id, sectionTitle: section.title! })}
        onSave={() => onSave({ sectionId: section.id })}
        onCancel={() => {
          section.title = prevTitle ?? section.title;
          resetEdit();
        }}
        onAddContent={() => openContentModal(section.id)}
        onToggleLock={hasSectionItems ? () => toggleSectionLock(section.id) : undefined}
        onDelete={() => onDelete({ sectionId: section.id })}
      />

      <div
        class="mx-3 py-1 {reorder ? 'cursor-move' : ''}"
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
          {@const lessonLocked = $globalStore.isStudent && !item.isUnlocked}
          {@const exerciseLocked = $globalStore.isStudent && (item.isUnlocked ?? true) === false}
          {@const lockLabel = item.isUnlocked
            ? $t('course.navItem.lessons.add_lesson.lock')
            : $t('course.navItem.lessons.add_lesson.unlock')}
          <div
            class="mb-2 flex min-h-[50px] max-w-xl items-center justify-between rounded-md border border-gray-200 px-3 py-1 transition {reorder
              ? 'border-primary-300 bg-primary-50/40 cursor-move shadow-sm'
              : ''}"
            animate:flip={{ duration: flipDurationMs }}
          >
            {#if item.type === ContentType.Lesson}
              <ContentRow
                {item}
                bind:title={item.title}
                href={resolve(
                  lessonLocked ? page.url.pathname : `/courses/${courseApi.course?.id}/lessons/${item.contentId}`,
                  {}
                )}
                isEditing={isEditingItem}
                {errors}
                containerClass="flex w-4/5 items-center gap-2"
                linkClass={`text-black dark:text-white ${lessonLocked ? 'cursor-not-allowed' : ''}`}
                inputClass="w-4/6"
                iconSize={16}
                preloadOff
              />
            {:else if item.type === ContentType.Exercise}
              <ContentRow
                {item}
                bind:title={item.title}
                href={resolve(
                  exerciseLocked ? page.url.pathname : `/courses/${courseApi.course?.id}/exercises/${item.contentId}`,
                  {}
                )}
                isEditing={isEditingItem}
                {errors}
                containerClass="flex w-4/5 items-center gap-2"
                linkClass={`flex-1 truncate text-sm text-black dark:text-white ${
                  exerciseLocked ? 'cursor-not-allowed opacity-50' : ''
                }`}
                inputClass="w-4/6"
                iconSize={16}
                showStatus
                isLocked={exerciseLocked}
                isComplete={item.isComplete}
              />
            {/if}

            <ContentActions
              isEditing={isEditingItem}
              disabled={Boolean($contentEditingStore && !isEditingItem)}
              {lockLabel}
              onEdit={() => onEdit({ lessonId: item.contentId, lessonTitle: item.title })}
              onSave={() => onSave({ lessonId: item.contentId }, item)}
              onCancel={() => {
                item.title = prevTitle ?? item.title;
                resetEdit();
              }}
              onDelete={() => onDelete({ lessonId: item.contentId })}
              onToggleLock={async () => {
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
              }}
            />
          </div>
        {:else}
          {$t('course.navItem.lessons.no_lesson')}
        {/each}
      </div>
    </div>
  {/each}
</section>
