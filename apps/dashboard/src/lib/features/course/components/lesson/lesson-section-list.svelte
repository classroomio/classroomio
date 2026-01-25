<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { flip } from 'svelte/animate';
  import { dndzone } from 'svelte-dnd-action';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import LockIcon from '@lucide/svelte/icons/lock';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import { Button } from '@cio/ui/base/button';
  import { InputField } from '@cio/ui/custom/input-field';
  import { Chip } from '@cio/ui/custom/chip';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { t } from '$lib/utils/functions/translations';
  import { globalStore } from '$lib/utils/store/app';
  import { courseApi } from '$features/course/api';
  import { snackbar } from '$features/ui/snackbar/store';
  import { profile } from '$lib/utils/store/user';
  import { lessonApi } from '$features/course/api';
  import DeleteLessonConfirmation from '$features/course/components/lesson/delete-lesson-confirmation.svelte';
  import { RoleBasedSecurity } from '$features/ui';
  import type { CourseContent, CourseContentItem } from '$features/course/utils/types';
  import { ExerciseIcon } from '@cio/ui/custom/moving-icons';
  import { CircleCheckIcon } from '$features/ui/icons';
  import { contentCreateStore } from '$features/course/components/content/store';
  import { getCourseContent } from '$features/course/utils/content';
  import { ContentType } from '@cio/utils/constants/content';
  import { exerciseApi } from '$features/course/api';

  type CrudParam = {
    sectionId?: string;
    lessonId?: string;
    sectionTitle?: string;
    lessonTitle?: string;
  };

  interface Props {
    reorder?: boolean;
    lessonEditing: string | undefined;
  }

  let { reorder = false, lessonEditing = $bindable() }: Props = $props();

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
    order?: number | null;
    items: ContentDndItem[];
  };

  let sections = $state<SectionDnd[]>([]);

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
    lessonEditing = params.sectionId || params.lessonId;
    prevTitle = params.sectionTitle || params.lessonTitle;
  }

  async function onSave(params: CrudParam, item?: ContentDndItem) {
    if (params.sectionId) {
      const section = sections.find((entry) => entry.id === params.sectionId);
      if (!section) return;

      await lessonApi.updateSection(courseId, section.id, {
        title: section.title!
      });

      if (lessonApi.errors && Object.keys(lessonApi.errors).length) {
        errors = {
          title: lessonApi.errors.title
        };
      }
    } else if (item) {
      await lessonApi.update(courseId, item.contentId, {
        title: item.title || '',
        isUnlocked: item.isUnlocked ?? undefined,
        sectionId: item.sectionId ?? undefined,
        order: item.order ?? undefined
      });

      if (lessonApi.errors && Object.keys(lessonApi.errors).length) {
        errors = {
          title: lessonApi.errors.title
        };
      }
    }

    if (!errors?.title) {
      resetEdit();
      syncCourseContentSections(sections);

      snackbar.success('snackbar.success_update');
    }
  }

  function onDelete(params: CrudParam) {
    deletingData.id = params.sectionId || params.lessonId || '';
    deletingData.isSection = params.sectionId ? true : false;
    openDeleteModal = true;
  }

  async function deleteLesson() {
    if (deletingData.isSection) {
      await lessonApi.deleteSection(courseId, deletingData.id);
    } else {
      await lessonApi.delete(courseId, deletingData.id);
    }

    if (lessonApi.success && profileId) {
      await courseApi.refreshCourse(courseId, profileId);
    }
  }

  function resetEdit() {
    lessonEditing = undefined;
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
    const lessonsToReorder: Array<{ id: string; order: number; sectionId?: string }> = [];
    const exerciseUpdates: Array<{ id: string; order: number; sectionId?: string }> = [];

    items.forEach((item, index) => {
      const order = index + 1;

      if (item.type === ContentType.Lesson) {
        if (item.order !== order || item.sectionId !== normalizedSectionId) {
          item.order = order;
          item.sectionId = normalizedSectionId;
          lessonsToReorder.push({ id: item.contentId, order, sectionId: normalizedSectionId ?? undefined });
        }
      }

      if (item.type === ContentType.Exercise) {
        if (item.order !== order || item.sectionId !== normalizedSectionId) {
          item.order = order;
          item.sectionId = normalizedSectionId;
          exerciseUpdates.push({ id: item.contentId, order, sectionId: normalizedSectionId ?? undefined });
        }
      }
    });

    if (lessonsToReorder.length > 0) {
      await lessonApi.reorderLessons(courseId, lessonsToReorder);
    }

    if (exerciseUpdates.length > 0) {
      await Promise.all(
        exerciseUpdates.map((update) =>
          exerciseApi.update(courseId, update.id, {
            order: update.order,
            sectionId: update.sectionId
          })
        )
      );
    }

    syncCourseContentSections(sections);

    if (!reorder) {
      syncSections();
    }
  }

  function getLessonOrder(items: ContentDndItem[], lessonId: string) {
    const index = items.findIndex((item) => item.type === ContentType.Lesson && item.contentId === lessonId);

    if (index < 9) {
      return '0' + (index + 1);
    }

    return index + 1;
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
    <div
      class="m-auto mb-3 max-w-xl rounded-md border-2 border-gray-200 transition dark:bg-neutral-800 {reorder
        ? 'border-primary-300 bg-primary-50/40 cursor-move shadow-sm'
        : ''}"
    >
      <div
        class="mb-2 flex min-h-[50px] items-center justify-between rounded-tl-md rounded-tr-md border-b bg-gray-50 px-3 py-1 dark:bg-neutral-700"
      >
        {#if lessonEditing === section.id && !isUngrouped}
          <InputField className="w-4/6" bind:value={section.title} errorMessage={errors?.title} />
        {:else}
          <p class="w-4/6 font-semibold">{section.title}</p>
        {/if}

        <RoleBasedSecurity allowedRoles={[1, 2]}>
          {#if !isUngrouped}
            <div class="flex items-center">
              {#if lessonEditing === section.id}
                <Button
                  variant="outline"
                  onclick={() => {
                    section.title = prevTitle ?? section.title;
                    resetEdit();
                  }}
                >
                  {$t('course.navItem.lessons.add_lesson.cancel')}
                </Button>
                <Button onclick={() => onSave({ sectionId: section.id })}>
                  {$t('course.navItem.lessons.add_lesson.save')}
                </Button>
              {:else}
                <IconButton onclick={() => openContentModal(section.id)} disabled={!!lessonEditing}>
                  <PlusIcon size={16} />
                </IconButton>

                <DropdownMenu.Root>
                  <DropdownMenu.Trigger>
                    <Button variant="ghost" size="icon" class="h-8 w-8">
                      <EllipsisVerticalIcon class="h-5 w-5" />
                      <span class="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content align="end">
                    <DropdownMenu.Item
                      disabled={!!lessonEditing}
                      onclick={() => onEdit({ sectionId: section.id, sectionTitle: section.title! })}
                    >
                      {$t('course.navItem.lessons.add_lesson.edit')}
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item
                      class="text-red-600 focus:text-red-600 dark:text-red-400"
                      onclick={() => onDelete({ sectionId: section.id })}
                    >
                      {$t('course.navItem.lessons.add_lesson.delete')}
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              {/if}
            </div>
          {/if}
        </RoleBasedSecurity>
      </div>

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
          <div
            class="mb-2 flex min-h-[50px] max-w-xl items-center justify-between rounded-md border border-gray-200 px-3 py-1 transition {reorder
              ? 'border-primary-300 bg-primary-50/40 cursor-move shadow-sm'
              : ''}"
            animate:flip={{ duration: flipDurationMs }}
          >
            {#if item.type === ContentType.Lesson}
              {#if lessonEditing === item.contentId}
                <InputField className="w-4/6" bind:value={item.title} errorMessage={errors?.title} />
              {:else}
                <div class="flex w-4/5 items-center gap-2">
                  <Chip value={getLessonOrder(section.items, item.contentId)} />
                  <div>
                    <a
                      href={resolve(
                        $globalStore.isStudent && !item.isUnlocked
                          ? page.url.pathname
                          : `/courses/${courseApi.course?.id}/lessons/${item.contentId}`,
                        {}
                      )}
                      class=" text-black dark:text-white {$globalStore.isStudent && !item.isUnlocked
                        ? 'cursor-not-allowed'
                        : ''}"
                      data-sveltekit-preload-data="off"
                    >
                      {item.title}
                    </a>
                  </div>
                </div>
              {/if}

              <RoleBasedSecurity allowedRoles={[1, 2]}>
                <div class="flex items-center gap-1">
                  {#if lessonEditing === item.contentId}
                    <Button
                      variant="outline"
                      onclick={() => {
                        item.title = prevTitle ?? item.title;
                        resetEdit();
                      }}
                    >
                      {$t('course.navItem.lessons.add_lesson.cancel')}
                    </Button>
                    <Button onclick={() => onSave({ lessonId: item.contentId }, item)}>
                      {$t('course.navItem.lessons.add_lesson.save')}
                    </Button>
                  {:else}
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger>
                        <Button variant="ghost" size="icon" class="h-8 w-8">
                          <EllipsisVerticalIcon class="h-5 w-5" />
                          <span class="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content align="end">
                        <DropdownMenu.Item
                          onclick={async () => {
                            item.isUnlocked = !(item.isUnlocked ?? false);

                            const courseId = courseApi.course?.id || '';
                            await lessonApi.update(courseId, item.contentId, {
                              title: item.title || '',
                              isUnlocked: item.isUnlocked ?? undefined,
                              sectionId: item.sectionId ?? undefined
                            });
                            syncCourseContentSections(sections);
                          }}
                        >
                          {item.isUnlocked
                            ? $t('course.navItem.lessons.add_lesson.lock')
                            : $t('course.navItem.lessons.add_lesson.unlock')}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          onclick={() => onEdit({ lessonId: item.contentId, lessonTitle: item.title })}
                        >
                          {$t('course.navItem.lessons.add_lesson.edit')}
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator />
                        <DropdownMenu.Item
                          class="text-red-600 focus:text-red-600 dark:text-red-400"
                          onclick={() => onDelete({ lessonId: item.contentId })}
                        >
                          {$t('course.navItem.lessons.add_lesson.delete')}
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  {/if}
                </div>
              </RoleBasedSecurity>
            {:else if item.type === ContentType.Exercise}
              {@const isLocked = $globalStore.isStudent && (item.isUnlocked ?? true) === false}
              <div class="flex w-full items-center justify-between gap-2">
                <div class="flex w-4/5 items-center gap-2">
                  <ExerciseIcon size={16} />
                  <a
                    href={resolve(
                      isLocked ? page.url.pathname : `/courses/${courseApi.course?.id}/exercises/${item.contentId}`,
                      {}
                    )}
                    class="flex-1 truncate text-sm text-black dark:text-white {isLocked
                      ? 'cursor-not-allowed opacity-50'
                      : ''}"
                  >
                    {item.title}
                  </a>
                  {#if isLocked}
                    <LockIcon size={16} class="shrink-0" />
                  {:else if item.isComplete}
                    <span class="shrink-0">
                      <CircleCheckIcon size={16} filled />
                    </span>
                  {/if}
                </div>
                <RoleBasedSecurity allowedRoles={[1, 2]}>
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                      <Button variant="ghost" size="icon" class="h-8 w-8">
                        <EllipsisVerticalIcon class="h-5 w-5" />
                        <span class="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="end">
                      <DropdownMenu.Item
                        onclick={async () => {
                          item.isUnlocked = !(item.isUnlocked ?? true);

                          await exerciseApi.update(courseId, item.contentId, {
                            isUnlocked: item.isUnlocked ?? undefined
                          });
                          syncCourseContentSections(sections);
                        }}
                      >
                        {item.isUnlocked
                          ? $t('course.navItem.lessons.add_lesson.lock')
                          : $t('course.navItem.lessons.add_lesson.unlock')}
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                </RoleBasedSecurity>
              </div>
            {/if}
          </div>
        {:else}
          {$t('course.navItem.lessons.no_lesson')}
        {/each}
      </div>
    </div>
  {/each}
</section>
